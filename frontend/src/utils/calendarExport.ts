import { Booking } from '../types';
import { format, parseISO } from 'date-fns';

/**
 * Generate iCal format (.ics file) for a booking
 */
export const generateICalEvent = (booking: Booking): string => {
  const start = parseISO(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.duration * 60000);

  // Format dates for iCal (YYYYMMDDTHHmmssZ)
  const formatICalDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const uid = `booking-${booking.id}@miyzapis.com`;
  const summary = booking.service?.name || 'Booking';
  const description = [
    `Customer: ${booking.customer?.firstName} ${booking.customer?.lastName}`,
    booking.notes ? `Notes: ${booking.notes}` : '',
    `Status: ${booking.status}`,
    `Duration: ${booking.duration} minutes`
  ].filter(Boolean).join('\\n');

  const location = booking.service?.serviceLocation || '';

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MiyZapis//Booking System//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(start)}`,
    `DTEND:${formatICalDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : '',
    `STATUS:${booking.status === 'CONFIRMED' || booking.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return icalContent;
};

/**
 * Download iCal file
 */
export const downloadICalFile = (booking: Booking): void => {
  const icalContent = generateICalEvent(booking);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `booking-${booking.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (booking: Booking): string => {
  const start = parseISO(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.duration * 60000);

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date: Date): string => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: booking.service?.name || 'Booking',
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details: [
      `Customer: ${booking.customer?.firstName} ${booking.customer?.lastName}`,
      booking.notes ? `Notes: ${booking.notes}` : '',
      `Status: ${booking.status}`,
      `Duration: ${booking.duration} minutes`
    ].filter(Boolean).join('\n'),
    location: booking.service?.serviceLocation || '',
    trp: 'false' // Don't show guests can modify
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Open Google Calendar in new tab
 */
export const openInGoogleCalendar = (booking: Booking): void => {
  const url = generateGoogleCalendarUrl(booking);
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Generate Outlook Calendar URL
 */
export const generateOutlookCalendarUrl = (booking: Booking): string => {
  const start = parseISO(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.duration * 60000);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: booking.service?.name || 'Booking',
    body: [
      `Customer: ${booking.customer?.firstName} ${booking.customer?.lastName}`,
      booking.notes ? `Notes: ${booking.notes}` : '',
      `Status: ${booking.status}`,
      `Duration: ${booking.duration} minutes`
    ].filter(Boolean).join('\n'),
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    location: booking.service?.serviceLocation || ''
  });

  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Export multiple bookings to iCal
 */
export const exportMultipleBookings = (bookings: Booking[]): void => {
  const icalEvents = bookings.map(booking => {
    const start = parseISO(booking.scheduledAt);
    const end = new Date(start.getTime() + booking.duration * 60000);

    const formatICalDate = (date: Date): string => {
      return format(date, "yyyyMMdd'T'HHmmss'Z'");
    };

    return [
      'BEGIN:VEVENT',
      `UID:booking-${booking.id}@miyzapis.com`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(start)}`,
      `DTEND:${formatICalDate(end)}`,
      `SUMMARY:${booking.service?.name || 'Booking'}`,
      `DESCRIPTION:Customer: ${booking.customer?.firstName} ${booking.customer?.lastName}`,
      booking.service?.serviceLocation ? `LOCATION:${booking.service.serviceLocation}` : '',
      'END:VEVENT'
    ].filter(Boolean).join('\r\n');
  }).join('\r\n');

  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MiyZapis//Booking System//EN',
    icalEvents,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `bookings-export-${format(new Date(), 'yyyy-MM-dd')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
