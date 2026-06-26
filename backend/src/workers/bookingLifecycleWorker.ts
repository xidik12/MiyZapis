/**
 * bookingLifecycleWorker — runs every 3 minutes.
 *
 * Four independent blocks, each wrapped in its own try/catch so one failure
 * never blocks the others. All blocks are idempotent (flag-guarded or status-
 * terminal). Queries are bounded (take: 200) and hit existing indexes.
 *
 * A)  30-min customer reminder     (CONFIRMED, reminded30Sent=false, scheduledAt soon)
 * B)  PENDING SLA auto-cancel      (PENDING, confirmDeadlineAt < now)
 * C)  Post-appointment confirm prompt (CONFIRMED/IN_PROGRESS, past end time)
 * D)  Anti-orphan auto-complete    (CONFIRMED/IN_PROGRESS, past end + 48h)
 */

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification';
import { BookingService } from '@/services/booking';
import LoyaltyService from '@/services/loyalty';
import { ReferralProcessingService } from '@/services/referral/processing.service';

const INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const BATCH = 200;

const notificationService = new NotificationService(prisma);

// ─── helpers ────────────────────────────────────────────────────────────────

/** Compute confirmDeadlineAt from createdAt (or now) and scheduledAt.
 *
 *  Formula (requirement §3):
 *    deadline = min( anchor + 60min , max( scheduledAt - 30min , anchor + 10min ) )
 *
 *  where anchor = createdAt (at booking creation) or now (at reschedule).
 *  This gives ≤1h for normal bookings and a short window for "sudden" ones,
 *  while always requiring confirmation at least 30 min before the slot
 *  and always giving at least 10 min regardless.
 */
export function computeConfirmDeadline(anchor: Date, scheduledAt: Date): Date {
  const anchorMs = anchor.getTime();
  const schedMs = scheduledAt.getTime();

  const plus60  = anchorMs + 60 * 60 * 1000;
  const minus30 = schedMs  - 30 * 60 * 1000;
  const plus10  = anchorMs + 10 * 60 * 1000;

  return new Date(Math.min(plus60, Math.max(minus30, plus10)));
}

// ─── Block A: 30-min customer reminder ──────────────────────────────────────

async function blockA_30MinReminder(): Promise<void> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + 30 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'CONFIRMED',
      reminded30Sent: false,
      scheduledAt: { gte: now, lte: windowEnd },
    },
    select: {
      id: true,
      customerId: true,
      specialistId: true,
      scheduledAt: true,
      service: { select: { name: true } },
      specialist: { select: { firstName: true, lastName: true } },
    },
    take: BATCH,
  });

  if (bookings.length === 0) return;

  logger.info(`[lifecycle:A] ${bookings.length} booking(s) need 30-min reminder`);

  for (const b of bookings) {
    try {
      const serviceName = b.service?.name ?? 'your appointment';
      const specialistName = b.specialist
        ? `${b.specialist.firstName} ${b.specialist.lastName}`.trim()
        : 'your specialist';

      await notificationService.sendNotification(b.customerId, {
        type: 'BOOKING_REMINDER',
        title: 'notifications.booking.reminder.customer.title',
        message: 'notifications.booking.reminder.customer.message',
        data: {
          bookingId: b.id,
          scheduledAt: b.scheduledAt,
          _interpolate: {
            serviceName,
            specialistName,
            date: b.scheduledAt.toISOString(),
          },
        },
      });

      await prisma.booking.update({
        where: { id: b.id },
        data: { reminded30Sent: true },
      });

      logger.info('[lifecycle:A] 30-min reminder sent', { bookingId: b.id, customerId: b.customerId });
    } catch (err) {
      logger.error('[lifecycle:A] Failed for booking', {
        bookingId: b.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ─── Block B: PENDING SLA auto-cancel ───────────────────────────────────────

async function blockB_PendingSlaAutoCancel(): Promise<void> {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'PENDING',
      confirmDeadlineAt: { not: null, lt: now },
    },
    select: {
      id: true,
      customerId: true,
      specialistId: true,
      scheduledAt: true,
      service: { select: { name: true } },
      specialist: { select: { firstName: true, lastName: true } },
    },
    take: BATCH,
  });

  if (bookings.length === 0) return;

  logger.info(`[lifecycle:B] ${bookings.length} PENDING booking(s) past confirm deadline — auto-cancelling`);

  for (const b of bookings) {
    try {
      // Re-check status inside loop — another process may have confirmed it
      const fresh = await prisma.booking.findUnique({
        where: { id: b.id },
        select: { status: true },
      });
      if (!fresh || fresh.status !== 'PENDING') {
        logger.info('[lifecycle:B] Skipping — status changed', { bookingId: b.id, status: fresh?.status });
        continue;
      }

      // Cancel on behalf of the specialist (specialistId as cancelledBy) so
      // the window restriction is bypassed and the customer receives the $1
      // wallet refund that specialist-cancels trigger. The reason string makes
      // the automated origin clear in the audit trail.
      await BookingService.cancelBooking(
        b.id,
        b.specialistId,
        'Specialist did not confirm in time. Booking automatically cancelled by the system.'
      );

      const serviceName = b.service?.name ?? 'the requested service';
      const specialistName = b.specialist
        ? `${b.specialist.firstName} ${b.specialist.lastName}`.trim()
        : 'the specialist';

      // Notify customer: specialist couldn't confirm, please book someone else
      await notificationService.sendNotification(b.customerId, {
        type: 'BOOKING_EXPIRED',
        title: 'notifications.booking.expired.customer.title',
        message: 'notifications.booking.expired.customer.message',
        data: {
          bookingId: b.id,
          scheduledAt: b.scheduledAt,
          _interpolate: {
            serviceName,
            specialistName,
            searchUrl: '/search',
          },
        },
      });

      // Notify specialist: they missed the confirmation window
      await notificationService.sendNotification(b.specialistId, {
        type: 'BOOKING_EXPIRED',
        title: 'notifications.booking.expired.specialist.title',
        message: 'notifications.booking.expired.specialist.message',
        data: {
          bookingId: b.id,
          scheduledAt: b.scheduledAt,
          _interpolate: {
            serviceName,
          },
        },
      });

      logger.info('[lifecycle:B] Auto-cancelled PENDING booking', { bookingId: b.id });
    } catch (err) {
      logger.error('[lifecycle:B] Failed for booking', {
        bookingId: b.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ─── Block C: Post-appointment confirm prompt to specialist ──────────────────

async function blockC_PostApptConfirmPrompt(): Promise<void> {
  const now = new Date();

  // We can't do (scheduledAt + duration) < now in a single Prisma where clause
  // without raw SQL, so we pull candidates where scheduledAt is in the past and
  // filter by end-time in JS. Take a generous window — bookings that ended up
  // to 47h ago but haven't had the prompt sent yet (block D fires at 48h).
  const windowStart = new Date(now.getTime() - 47 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      postApptConfirmSent: false,
      scheduledAt: { lte: now, gte: windowStart },
    },
    select: {
      id: true,
      specialistId: true,
      scheduledAt: true,
      duration: true,
      service: { select: { name: true } },
      customer: { select: { firstName: true, lastName: true } },
    },
    take: BATCH,
  });

  if (bookings.length === 0) return;

  // Filter to only those whose end-time has passed
  const ended = bookings.filter((b) => {
    const endTime = new Date(b.scheduledAt.getTime() + b.duration * 60 * 1000);
    return endTime <= now;
  });

  if (ended.length === 0) return;

  logger.info(`[lifecycle:C] ${ended.length} booking(s) need post-appointment prompt`);

  for (const b of ended) {
    try {
      const serviceName = b.service?.name ?? 'your appointment';
      const customerName = b.customer
        ? `${b.customer.firstName} ${b.customer.lastName}`.trim()
        : 'the customer';

      await notificationService.sendNotification(b.specialistId, {
        type: 'BOOKING_CONFIRM_REQUEST',
        title: 'notifications.booking.confirmRequest.specialist.title',
        message: 'notifications.booking.confirmRequest.specialist.message',
        data: {
          bookingId: b.id,
          scheduledAt: b.scheduledAt,
          actorRole: 'SPECIALIST',
          // Reuse the BOOKING_AWAITING_REVIEW keyboard (Completed / No-show buttons)
          _interpolate: {
            serviceName,
            customerName,
          },
        },
      });

      await prisma.booking.update({
        where: { id: b.id },
        data: { postApptConfirmSent: true },
      });

      logger.info('[lifecycle:C] Post-appointment prompt sent', { bookingId: b.id, specialistId: b.specialistId });
    } catch (err) {
      logger.error('[lifecycle:C] Failed for booking', {
        bookingId: b.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ─── Block D: Anti-orphan auto-complete (48h safety net) ────────────────────

async function blockD_AntiOrphanAutoComplete(): Promise<void> {
  const now = new Date();
  // Bookings whose (scheduledAt + duration + 48h) < now
  // We use a conservative threshold: scheduledAt + 48h < now,
  // then re-filter by actual end time in JS (duration is per-row).
  const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      scheduledAt: { lt: cutoff },
    },
    select: {
      id: true,
      specialistId: true,
      scheduledAt: true,
      duration: true,
      service: { select: { name: true } },
    },
    take: BATCH,
  });

  if (bookings.length === 0) return;

  // Filter to only those where (scheduledAt + duration + 48h) < now
  const stale = bookings.filter((b) => {
    const endTime = new Date(b.scheduledAt.getTime() + b.duration * 60 * 1000);
    return endTime.getTime() + 48 * 60 * 60 * 1000 < now.getTime();
  });

  if (stale.length === 0) return;

  logger.info(`[lifecycle:D] ${stale.length} orphaned booking(s) — auto-completing`);

  for (const b of stale) {
    try {
      await prisma.booking.update({
        where: { id: b.id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
          completionNotes: `[${now.toISOString()}] Auto-completed by lifecycle worker after 48h with no resolution.`,
          updatedAt: now,
        },
      });

      logger.warn('[lifecycle:D] Auto-completed orphaned booking', {
        bookingId: b.id,
        specialistId: b.specialistId,
        scheduledAt: b.scheduledAt,
      });

      // Auto-complete is a real completion → must award loyalty + process
      // referrals like the manual and /resolve paths, else the most common
      // completion path silently awards nothing. Idempotent (the services guard
      // against double-award); fire-and-forget so a failure doesn't block others.
      LoyaltyService.processBookingCompletion(b.id).catch((e) =>
        logger.warn('[lifecycle:D] loyalty award failed', { bookingId: b.id, error: (e as Error)?.message }));
      ReferralProcessingService.processBookingCompletion(b.id).catch((e) =>
        logger.warn('[lifecycle:D] referral processing failed', { bookingId: b.id, error: (e as Error)?.message }));
    } catch (err) {
      logger.error('[lifecycle:D] Failed for booking', {
        bookingId: b.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ─── Main tick ───────────────────────────────────────────────────────────────

async function runLifecycleTick(): Promise<void> {
  logger.debug('[lifecycle] Tick start');

  // Each block is independent; one failure must not block the others.
  await Promise.allSettled([
    blockA_30MinReminder().catch((e) =>
      logger.error('[lifecycle:A] Uncaught error', { error: e instanceof Error ? e.message : String(e) })),
    blockB_PendingSlaAutoCancel().catch((e) =>
      logger.error('[lifecycle:B] Uncaught error', { error: e instanceof Error ? e.message : String(e) })),
    blockC_PostApptConfirmPrompt().catch((e) =>
      logger.error('[lifecycle:C] Uncaught error', { error: e instanceof Error ? e.message : String(e) })),
    blockD_AntiOrphanAutoComplete().catch((e) =>
      logger.error('[lifecycle:D] Uncaught error', { error: e instanceof Error ? e.message : String(e) })),
  ]);

  logger.debug('[lifecycle] Tick done');
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function startBookingLifecycleWorker(): void {
  // Fire immediately on startup, then every 3 minutes
  runLifecycleTick();
  setInterval(() => {
    runLifecycleTick();
  }, INTERVAL_MS);

  logger.info('🔄 Booking lifecycle worker started (interval: 3 min)');
}
