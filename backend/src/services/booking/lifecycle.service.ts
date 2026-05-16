// Booking lifecycle service — handles bookings that have passed their
// scheduledAt time without either party transitioning them out of an
// active state (PENDING / CONFIRMED / IN_PROGRESS).
//
// Lifecycle phases this module owns:
//   Active        → PENDING / PENDING_PAYMENT / CONFIRMED / IN_PROGRESS (time still in future or now)
//   AwaitingReview→ scheduledAt + duration is past; neither party has confirmed completion
//   Resolved      → COMPLETED / CANCELLED / NO_SHOW / REFUNDED
//
// Without this service, bookings get stuck in CONFIRMED forever and customers
// can't even cancel them (the 24h window logic interprets negative time-until
// as "too late"). The service is invoked from /api/v1/cron/stale-bookings-check
// daily, plus from customer/specialist endpoints when they manually resolve.

import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification';

const notifier = new NotificationService(prisma);

const ACTIVE_STATUSES = ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] as const;

// How long after scheduledAt + duration we wait before considering a booking stale.
const STALE_GRACE_HOURS = 1;
// How long a stale booking can sit "awaiting review" before we auto-finalise it.
const AUTO_FINALISE_GRACE_DAYS = 14;
// Dedup window for "please review your stale booking" notifications.
const NOTIFY_DEDUP_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type ResolutionParty = 'CUSTOMER' | 'SPECIALIST' | 'SYSTEM';
export interface StaleBookingResult {
  bookingId: string;
  scheduledAt: Date;
  status: string;
  customerId: string;
  specialistId: string;
}

export class BookingLifecycleService {
  /** Bookings that have passed their scheduled end time but are still in an active state. */
  static async findStaleBookings(graceHours = STALE_GRACE_HOURS): Promise<StaleBookingResult[]> {
    // duration is stored in minutes; (NOW - graceHours) puts the cutoff at "if scheduledAt + duration < cutoff".
    // Prisma can't express that arithmetic cleanly with the standard query builder, so use raw SQL.
    const rows = await prisma.$queryRawUnsafe<StaleBookingResult[]>(
      `SELECT id AS "bookingId", "scheduledAt", status, "customerId", "specialistId"
         FROM bookings
        WHERE status = ANY ($1::text[])
          AND "scheduledAt" + (duration || ' minutes')::interval < NOW() - ($2 || ' hours')::interval
        ORDER BY "scheduledAt" ASC`,
      [...ACTIVE_STATUSES],
      String(graceHours),
    );
    return rows;
  }

  /** Mark a booking as completed (used by both customer "yes, it happened" and the auto-finaliser). */
  static async markCompleted(
    bookingId: string,
    actingUserId: string,
    party: ResolutionParty,
    notes?: string,
  ) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (!ACTIVE_STATUSES.includes(booking.status as (typeof ACTIVE_STATUSES)[number])) {
      throw new Error('BOOKING_ALREADY_RESOLVED');
    }
    if (party !== 'SYSTEM' && actingUserId !== booking.customerId && actingUserId !== booking.specialistId) {
      throw new Error('NOT_AUTHORIZED');
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: this.combineNotes(booking.completionNotes, notes, `completed by ${party.toLowerCase()}`),
      },
    });
  }

  /** Report that one party didn't show up (other party still gets to mark the booking closed). */
  static async markNoShow(
    bookingId: string,
    actingUserId: string,
    party: ResolutionParty,
    noShowParty: 'CUSTOMER' | 'SPECIALIST',
    notes?: string,
  ) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (!ACTIVE_STATUSES.includes(booking.status as (typeof ACTIVE_STATUSES)[number])) {
      throw new Error('BOOKING_ALREADY_RESOLVED');
    }
    if (party !== 'SYSTEM' && actingUserId !== booking.customerId && actingUserId !== booking.specialistId) {
      throw new Error('NOT_AUTHORIZED');
    }
    // Sanity: customer can't report themselves as no-show by accident.
    if (party === 'CUSTOMER' && noShowParty === 'CUSTOMER') throw new Error('INVALID_NO_SHOW_REPORT');
    if (party === 'SPECIALIST' && noShowParty === 'SPECIALIST') throw new Error('INVALID_NO_SHOW_REPORT');

    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'NO_SHOW',
        cancelledAt: new Date(),
        cancelledBy: noShowParty === 'CUSTOMER' ? booking.customerId : booking.specialistId,
        completionNotes: this.combineNotes(
          booking.completionNotes,
          notes,
          `no-show: ${noShowParty.toLowerCase()} did not attend; reported by ${party.toLowerCase()}`,
        ),
      },
    });
  }

  /**
   * Notify both parties about bookings that have just become stale, so they can
   * mark them Completed or No-show before the auto-finaliser does it for them.
   * Deduplicated via Redis so the same booking isn't re-notified daily.
   */
  static async notifyStaleReviews(stale: StaleBookingResult[]): Promise<number> {
    if (!stale.length) return 0;
    let notified = 0;

    for (const b of stale) {
      const dedupKey = `stale-review-notified:${b.bookingId}`;
      try {
        if (redis) {
          const wasSet = await redis.set(dedupKey, '1', 'EX', NOTIFY_DEDUP_SECONDS, 'NX');
          if (wasSet !== 'OK') continue; // already notified in window
        }
      } catch (err) {
        // If Redis is unhealthy, fall through and notify anyway — better than missing.
        logger.warn('Stale-review dedup check failed; notifying anyway', { error: (err as Error).message });
      }

      const baseData = {
        type: 'BOOKING_AWAITING_REVIEW',
        data: { bookingId: b.bookingId, scheduledAt: b.scheduledAt.toISOString() },
      };
      await Promise.all([
        notifier.sendNotification(b.customerId, {
          ...baseData,
          title: 'How did your appointment go?',
          message: 'Please confirm whether your booking happened so we can update your booking history.',
        }),
        notifier.sendNotification(b.specialistId, {
          ...baseData,
          title: 'Confirm or close a past booking',
          message: 'A past appointment is still open. Please mark it Completed or report a no-show.',
        }),
      ]).catch((err) => {
        logger.warn('Failed to push stale-review notifications', { bookingId: b.bookingId, error: (err as Error).message });
      });

      notified += 1;
    }
    return notified;
  }

  /** Auto-finalise bookings that have been stale for more than `graceDays`. */
  static async autoFinaliseOld(graceDays = AUTO_FINALISE_GRACE_DAYS): Promise<number> {
    const cutoff = new Date(Date.now() - graceDays * 24 * 60 * 60 * 1000);
    const candidates = await prisma.booking.findMany({
      where: {
        status: { in: [...ACTIVE_STATUSES] },
        scheduledAt: { lt: cutoff },
      },
      select: { id: true },
    });
    if (!candidates.length) return 0;
    const ids = candidates.map((c) => c.id);
    const result = await prisma.booking.updateMany({
      where: { id: { in: ids } },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        completionNotes: `[Auto-finalised by system after ${graceDays}-day grace period]`,
      },
    });
    logger.info('Auto-finalised stale bookings', { count: result.count, graceDays });
    return result.count;
  }

  /** Main cron entry — notify newly-stale + auto-finalise long-stale. */
  static async runCron(): Promise<{ stale: number; notified: number; finalised: number }> {
    const stale = await this.findStaleBookings();
    const notified = await this.notifyStaleReviews(stale);
    const finalised = await this.autoFinaliseOld();
    logger.info('Stale-bookings cron complete', { stale: stale.length, notified, finalised });
    return { stale: stale.length, notified, finalised };
  }

  private static combineNotes(existing: string | null | undefined, userNote: string | undefined, systemNote: string): string {
    const parts: string[] = [];
    if (existing) parts.push(existing);
    if (userNote) parts.push(userNote);
    parts.push(`[${new Date().toISOString()}] ${systemNote}`);
    return parts.join('\n');
  }
}
