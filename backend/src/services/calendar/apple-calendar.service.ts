// Apple Calendar (iCloud) sync via CalDAV.
//
// Apple has no OAuth for Calendar. Users generate an "app-specific password"
// at https://appleid.apple.com → Sign-In and Security → App-Specific Passwords,
// then paste their Apple ID + that password into MiyZapis. We store the
// credentials in the CalendarConnection row (provider='APPLE'), accessToken
// holding the app-specific password.
//
// Encrypted at rest is a follow-up; for now the accessToken column stores it
// in plaintext like the Google refresh token (same row, same threat model).

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { encryptField, decryptField } from '@/utils/encryption';

const ICLOUD_SERVER_URL = 'https://caldav.icloud.com';

async function loadTsdav() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('tsdav') as typeof import('tsdav');
}

export class AppleCalendarService {
  /**
   * Connect a user's iCloud calendar.
   * Throws CALDAV_AUTH_FAILED on bad credentials so callers can show a clear error.
   */
  static async connect(userId: string, appleId: string, appPassword: string) {
    const tsdav = await loadTsdav();

    let client;
    try {
      client = await tsdav.createDAVClient({
        serverUrl: ICLOUD_SERVER_URL,
        credentials: { username: appleId, password: appPassword },
        authMethod: 'Basic',
        defaultAccountType: 'caldav',
      });
    } catch (err) {
      logger.warn('iCloud CalDAV auth failed', { userId, error: (err as Error).message });
      throw new Error('CALDAV_AUTH_FAILED');
    }

    // Pick the user's default calendar (or the first one found).
    const calendars = await client.fetchCalendars();
    if (!calendars.length) throw new Error('NO_CALENDARS_FOUND');
    const primary = calendars.find((c) => /default|home/i.test(c.displayName as string || '')) ?? calendars[0];

    return prisma.calendarConnection.upsert({
      where: { userId_provider: { userId, provider: 'APPLE' } },
      create: {
        userId,
        provider: 'APPLE',
        providerAccountId: appleId,
        accessToken: encryptField(appPassword),
        refreshToken: null,
        scope: null,
        calendarId: primary.url, // CalDAV uses the calendar URL as the identifier
        calendarName: (primary.displayName as string) ?? 'iCloud Calendar',
      },
      update: {
        providerAccountId: appleId,
        accessToken: encryptField(appPassword),
        calendarId: primary.url,
        calendarName: (primary.displayName as string) ?? 'iCloud Calendar',
        syncEnabled: true,
        lastSyncError: null,
      },
    });
  }

  static async disconnect(userId: string): Promise<void> {
    await prisma.calendarConnection.deleteMany({ where: { userId, provider: 'APPLE' } });
  }

  static async getStatus(userId: string) {
    return prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'APPLE' } },
      select: {
        provider: true, calendarId: true, calendarName: true, syncEnabled: true,
        lastSyncAt: true, lastSyncError: true, createdAt: true,
        // never return accessToken
      },
    });
  }

  private static async getAuthedClient(userId: string) {
    const conn = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'APPLE' } },
    });
    if (!conn || !conn.syncEnabled || !conn.providerAccountId) return null;
    const tsdav = await loadTsdav();
    try {
      const client = await tsdav.createDAVClient({
        serverUrl: ICLOUD_SERVER_URL,
        credentials: { username: conn.providerAccountId, password: decryptField(conn.accessToken) },
        authMethod: 'Basic',
        defaultAccountType: 'caldav',
      });
      return { client, conn };
    } catch (err) {
      logger.warn('iCloud CalDAV client init failed', { userId, error: (err as Error).message });
      await prisma.calendarConnection.update({
        where: { userId_provider: { userId, provider: 'APPLE' } },
        data: { lastSyncError: (err as Error).message.slice(0, 500) },
      }).catch(() => undefined);
      return null;
    }
  }

  /** Push or update a booking to iCloud. Returns the event's URL (used as external ID). */
  static async pushBookingForUser(userId: string, opts: {
    bookingId: string;
    summary: string;
    description?: string;
    startISO: string;
    endISO: string;
    location?: string;
    existingEventUrl?: string | null;
  }): Promise<string | null> {
    const authed = await this.getAuthedClient(userId);
    if (!authed) return null;
    const { client, conn } = authed;

    const ical = this.toICalendar({
      uid: `miyzapis-${opts.bookingId}@miyzapis.com`,
      summary: opts.summary,
      description: opts.description,
      startUTC: opts.startISO,
      endUTC: opts.endISO,
      location: opts.location,
    });

    try {
      if (opts.existingEventUrl) {
        await client.updateCalendarObject({
          calendarObject: { url: opts.existingEventUrl, data: ical, etag: '*' },
        });
        await this.markSynced(userId);
        return opts.existingEventUrl;
      }
      // Create — give it a stable filename so we can find/update later.
      const filename = `miyzapis-${opts.bookingId}.ics`;
      const calendar = { url: conn.calendarId } as Parameters<typeof client.createCalendarObject>[0]['calendar'];
      const created = await client.createCalendarObject({
        calendar,
        filename,
        iCalString: ical,
      });
      await this.markSynced(userId);
      // tsdav returns a Response; the new event URL is calendar.url + filename
      return new URL(filename, conn.calendarId.endsWith('/') ? conn.calendarId : conn.calendarId + '/').toString();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn('iCloud CalDAV push failed', { userId, bookingId: opts.bookingId, error: message });
      await prisma.calendarConnection.update({
        where: { userId_provider: { userId, provider: 'APPLE' } },
        data: { lastSyncError: message.slice(0, 500) },
      }).catch(() => undefined);
      return null;
    }
  }

  static async deleteEventForUser(userId: string, eventUrl: string): Promise<void> {
    if (!eventUrl) return;
    const authed = await this.getAuthedClient(userId);
    if (!authed) return;
    const { client } = authed;
    try {
      await client.deleteCalendarObject({
        calendarObject: { url: eventUrl, etag: '*' } as Parameters<typeof client.deleteCalendarObject>[0]['calendarObject'],
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Already-gone is fine.
      if (!/not found|404|410/i.test(message)) {
        logger.warn('iCloud CalDAV delete failed', { userId, eventUrl, error: message });
      }
    }
  }

  private static async markSynced(userId: string) {
    await prisma.calendarConnection.update({
      where: { userId_provider: { userId, provider: 'APPLE' } },
      data: { lastSyncAt: new Date(), lastSyncError: null },
    }).catch(() => undefined);
  }

  /** Minimal iCalendar VEVENT — UTC times, no timezone block required. */
  private static toICalendar(e: {
    uid: string; summary: string; description?: string;
    startUTC: string; endUTC: string; location?: string;
  }): string {
    const fmt = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MiyZapis//Booking//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${fmt(new Date().toISOString())}`,
      `DTSTART:${fmt(e.startUTC)}`,
      `DTEND:${fmt(e.endUTC)}`,
      `SUMMARY:${esc(e.summary)}`,
      e.description ? `DESCRIPTION:${esc(e.description)}` : '',
      e.location ? `LOCATION:${esc(e.location)}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].filter(Boolean).join('\r\n');
  }
}
