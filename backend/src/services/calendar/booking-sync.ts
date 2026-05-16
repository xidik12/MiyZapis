// Glue between booking lifecycle and external calendars.
// Pushes/updates/removes events on Google Calendar (and Apple later).
// Fire-and-forget — booking flow never blocks on calendar sync.

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { GoogleCalendarService } from './google-calendar.service';

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

    // Customer-side event
    const customerEventId = await GoogleCalendarService.pushBookingForUser(booking.customerId, {
      bookingId,
      summary: `${serviceName} with ${specialistName || 'specialist'}`,
      description: `MiyZapis booking #${booking.id}`,
      startISO,
      endISO,
      timezone: booking.customer?.timezone ?? 'UTC',
      existingEventId: booking.calendarEventIdCustomer,
    });
    // Specialist-side event
    const specialistEventId = await GoogleCalendarService.pushBookingForUser(booking.specialistId, {
      bookingId,
      summary: `${serviceName} — ${customerName || 'customer'}`,
      description: `MiyZapis booking #${booking.id}`,
      startISO,
      endISO,
      timezone: booking.specialist?.timezone ?? 'UTC',
      existingEventId: booking.calendarEventIdSpecialist,
    });

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
      await GoogleCalendarService.deleteEventForUser(booking.customerId, booking.calendarEventIdCustomer);
    }
    if (booking.calendarEventIdSpecialist) {
      await GoogleCalendarService.deleteEventForUser(booking.specialistId, booking.calendarEventIdSpecialist);
    }
    if (booking.calendarEventIdCustomer || booking.calendarEventIdSpecialist) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { calendarEventIdCustomer: null, calendarEventIdSpecialist: null },
      }).catch(() => undefined);
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
