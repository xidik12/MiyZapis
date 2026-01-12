import { Booking } from '../types';
import { parseISO, isSameDay, addMinutes } from 'date-fns';

export interface BookingConflict {
  booking1: Booking;
  booking2: Booking;
  overlapMinutes: number;
  severity: 'warning' | 'error';
}

/**
 * Check if two bookings overlap in time
 */
export const doBookingsOverlap = (booking1: Booking, booking2: Booking): boolean => {
  const start1 = parseISO(booking1.scheduledAt);
  const end1 = addMinutes(start1, booking1.duration);

  const start2 = parseISO(booking2.scheduledAt);
  const end2 = addMinutes(start2, booking2.duration);

  // Check if same day first
  if (!isSameDay(start1, start2)) {
    return false;
  }

  // Check for overlap
  return start1 < end2 && start2 < end1;
};

/**
 * Calculate overlap duration in minutes
 */
export const getOverlapDuration = (booking1: Booking, booking2: Booking): number => {
  const start1 = parseISO(booking1.scheduledAt);
  const end1 = addMinutes(start1, booking1.duration);

  const start2 = parseISO(booking2.scheduledAt);
  const end2 = addMinutes(start2, booking2.duration);

  if (!doBookingsOverlap(booking1, booking2)) {
    return 0;
  }

  const overlapStart = start1 > start2 ? start1 : start2;
  const overlapEnd = end1 < end2 ? end1 : end2;

  return Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 1000 / 60);
};

/**
 * Find all booking conflicts in a list
 */
export const findBookingConflicts = (bookings: Booking[]): BookingConflict[] => {
  const conflicts: BookingConflict[] = [];

  // Only check active bookings (not cancelled or completed)
  const activeBookings = bookings.filter(
    b => b.status !== 'cancelled' && b.status !== 'CANCELLED' && b.status !== 'completed' && b.status !== 'COMPLETED'
  );

  for (let i = 0; i < activeBookings.length; i++) {
    for (let j = i + 1; j < activeBookings.length; j++) {
      if (doBookingsOverlap(activeBookings[i], activeBookings[j])) {
        const overlapMinutes = getOverlapDuration(activeBookings[i], activeBookings[j]);

        conflicts.push({
          booking1: activeBookings[i],
          booking2: activeBookings[j],
          overlapMinutes,
          severity: overlapMinutes > 30 ? 'error' : 'warning'
        });
      }
    }
  }

  return conflicts;
};

/**
 * Check if a booking conflicts with any existing bookings
 */
export const hasConflict = (booking: Booking, allBookings: Booking[]): boolean => {
  return allBookings.some(b =>
    b.id !== booking.id && doBookingsOverlap(booking, b)
  );
};

/**
 * Get conflicting bookings for a specific booking
 */
export const getConflictingBookings = (booking: Booking, allBookings: Booking[]): Booking[] => {
  return allBookings.filter(b =>
    b.id !== booking.id && doBookingsOverlap(booking, b)
  );
};

/**
 * Check if a time slot has conflicts
 */
export const isTimeSlotAvailable = (
  date: Date,
  startTime: string,
  duration: number,
  bookings: Booking[],
  excludeBookingId?: string
): boolean => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const slotStart = new Date(date);
  slotStart.setHours(hours, minutes, 0, 0);

  const tempBooking: Booking = {
    id: 'temp',
    scheduledAt: slotStart.toISOString(),
    duration,
    status: 'pending'
  } as Booking;

  const relevantBookings = bookings.filter(b =>
    b.id !== excludeBookingId &&
    (b.status !== 'cancelled' && b.status !== 'CANCELLED')
  );

  return !hasConflict(tempBooking, relevantBookings);
};
