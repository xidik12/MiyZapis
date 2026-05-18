// Glue between booking lifecycle and external calendars.
// Pushes/updates/removes events on Google Calendar (and Apple later).
// Fire-and-forget — booking flow never blocks on calendar sync.

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { GoogleCalendarService } from './google-calendar.service';
import { AppleCalendarService } from './apple-calendar.service';

interface BookingForSync {
  id: string;
  customerId: string;
  specialistId: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  calendarEventIdCustomer: string | null;
  calendarEventIdSpecialist: string | null;
  service: { name: string } | null;
  customer: { firstName: string; lastName: string; timezone: string } | null;
  specialist: { firstName: string; lastName: string; timezone: string } | null;
}

export class BookingCalendarSync {
  /** Push or update calendar events for both parties. Fire-and-forget. */
  static syncBooking(bookingId: string): void {
    this.syncBookingAsync(bookingId).catch((err) =>
      logger.warn('Calendar sync failed (background)', { bookingId, error: (err as Error).message }),
    );
  }

  /** Remove calendar events for both parties (call on cancel/no-show). Fire-and-forget. */
  static removeBookingEvents(bookingId: string): void {
    this.removeBookingEventsAsync(bookingId).catch((err) =>
      logger.warn('Calendar removal failed (background)', { bookingId, error: (err as Error).message }),
    );
  }

  private static async syncBookingAsync(bookingId: string): Promise<void> {
    const booking = await this.fetchBooking(bookingId);
    if (!booking) return;
    // Don't sync resolved bookings — they get removed instead.
    const skip = ['CANCELLED', 'NO_SHOW', 'COMPLETED', 'REFUNDED'];
    if (skip.includes(booking.status)) return await this.removeBookingEventsAsync(bookingId);

    const startISO = booking.scheduledAt.toISOString();
    const endISO = new Date(booking.scheduledAt.getTime() + booking.duration * 60000).toISOString();
    const serviceName = booking.service?.name ?? 'Booking';
    const specialistName = `${booking.specialist?.firstName ?? ''} ${booking.specialist?.lastName ?? ''}`.trim();
    const customerName = `${booking.customer?.firstName ?? ''} ${booking.customer?.lastName ?? ''}`.trim();

    // Push to whichever provider each user has connected. A user can have
    // both Google and Apple connected; we push to both. The returned ID
    // is the same field — we prefer Google's ID when both exist, since it
    // changes less often.
    const customerSummary = `${serviceName} with ${specialistName || 'specialist'}`;
    const specialistSummary = `${serviceName} — ${customerName || 'customer'}`;
    const description = `MiyZapis booking #${booking.id}`;

    const customerEventId = await this.pushAcrossProviders(
      booking.customerId,
      { bookingId, summary: customerSummary, description, startISO, endISO,
        timezone: booking.customer?.timezone ?? 'UTC',
        existingEventId: booking.calendarEventIdCustomer },
    );
    const specialistEventId = await this.pushAcrossProviders(
      booking.specialistId,
      { bookingId, summary: specialistSummary, description, startISO, endISO,
        timezone: booking.specialist?.timezone ?? 'UTC',
        existingEventId: booking.calendarEventIdSpecialist },
    );

    if (customerEventId !== booking.calendarEventIdCustomer || specialistEventId !== booking.calendarEventIdSpecialist) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          ...(customerEventId !== undefined ? { calendarEventIdCustomer: customerEventId } : {}),
          ...(specialistEventId !== undefined ? { calendarEventIdSpecialist: specialistEventId } : {}),
        },
      }).catch(() => undefined);
    }
  }

  private static async removeBookingEventsAsync(bookingId: string): Promise<void> {
    const booking = await this.fetchBooking(bookingId);
    if (!booking) return;
    if (booking.calendarEventIdCustomer) {
      await this.deleteAcrossProviders(booking.customerId, booking.calendarEventIdCustomer);
    }
    if (booking.calendarEventIdSpecialist) {
      await this.deleteAcrossProviders(booking.specialistId, booking.calendarEventIdSpecialist);
    }
    if (booking.calendarEventIdCustomer || booking.calendarEventIdSpecialist) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { calendarEventIdCustomer: null, calendarEventIdSpecialist: null },
      }).catch(() => undefined);
    }
  }

  /** Try Google first, then Apple — whichever is connected. Either may be no-op. */
  private static async pushAcrossProviders(
    userId: string,
    opts: { bookingId: string; summary: string; description: string; startISO: string; endISO: string; timezone: string; existingEventId: string | null },
  ): Promise<string | null> {
    const googleId = await GoogleCalendarService.pushBookingForUser(userId, opts);
    // For Apple, we treat existingEventId as the iCloud event URL if it starts with https.
    const appleExisting = opts.existingEventId && opts.existingEventId.startsWith('http') ? opts.existingEventId : null;
    const appleId = await AppleCalendarService.pushBookingForUser(userId, { ...opts, existingEventUrl: appleExisting });
    // Prefer Google's ID for storage; fall back to Apple's URL if Google not connected.
    return googleId ?? appleId ?? opts.existingEventId;
  }

  /** Delete from whichever providers might have it. URL-shaped IDs go to Apple; others to Google. */
  private static async deleteAcrossProviders(userId: string, externalId: string): Promise<void> {
    if (!externalId) return;
    if (externalId.startsWith('http')) {
      await AppleCalendarService.deleteEventForUser(userId, externalId);
    } else {
      await GoogleCalendarService.deleteEventForUser(userId, externalId);
    }
  }

  private static async fetchBooking(bookingId: string): Promise<BookingForSync | null> {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true, customerId: true, specialistId: true,
        scheduledAt: true, duration: true, status: true,
        calendarEventIdCustomer: true, calendarEventIdSpecialist: true,
        service: { select: { name: true } },
        customer: { select: { firstName: true, lastName: true, timezone: true } },
        specialist: { select: { firstName: true, lastName: true, timezone: true } },
      },
    });
  }
}
