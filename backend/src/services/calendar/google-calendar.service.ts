// Google Calendar one-way sync: pushes booking create/update/cancel to
// the user's connected Google Calendar. Bidirectional sync (pull events
// from Calendar to block availability) is a future addition.

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config';

// Lazy-load googleapis so this module doesn't load (and the dep doesn't trip
// up the build) until something actually calls it.
async function getGoogleApis() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('googleapis') as typeof import('googleapis');
}

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';

export class GoogleCalendarService {
  static get oauthConfigured(): boolean {
    return Boolean(config.google.clientId && config.google.clientSecret);
  }

  /** OAuth client for user-facing consent flow (Calendar-only redirect URI). */
  static async makeOAuthClient() {
    if (!this.oauthConfigured) throw new Error('GOOGLE_OAUTH_NOT_CONFIGURED');
    const { google } = await getGoogleApis();
    const redirectUri = `${config.frontend.url.replace(/\/$/, '')}/api/v1/calendar/google/callback`;
    return new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, redirectUri);
  }

  /** Returns the URL the user should be redirected to in order to grant calendar access. */
  static async getAuthUrl(userId: string): Promise<string> {
    const client = await this.makeOAuthClient();
    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent', // force refresh_token issuance every time
      scope: [SCOPE],
      state: userId, // we trust this since the redirect comes from Google with our own state
    });
  }

  /** Exchange the OAuth code for tokens and persist a CalendarConnection row. */
  static async handleCallback(code: string, userId: string) {
    const client = await this.makeOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.access_token) throw new Error('OAUTH_NO_ACCESS_TOKEN');

    return prisma.calendarConnection.upsert({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
      create: {
        userId,
        provider: 'GOOGLE',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? SCOPE,
        calendarId: 'primary',
      },
      update: {
        accessToken: tokens.access_token,
        // Google only returns refresh_token on first consent; keep the old one if absent.
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope ?? SCOPE,
        syncEnabled: true,
        lastSyncError: null,
      },
    });
  }

  static async disconnect(userId: string): Promise<void> {
    await prisma.calendarConnection.deleteMany({ where: { userId, provider: 'GOOGLE' } });
  }

  static async getStatus(userId: string) {
    const conn = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
      select: {
        provider: true, calendarId: true, calendarName: true, syncEnabled: true,
        lastSyncAt: true, lastSyncError: true, createdAt: true,
      },
    });
    return conn ?? null;
  }

  /** Internal: load + refresh tokens for the given user, return an authed client. */
  private static async getAuthedClient(userId: string) {
    const conn = await prisma.calendarConnection.findUnique({
      where: { userId_provider: { userId, provider: 'GOOGLE' } },
    });
    if (!conn || !conn.syncEnabled) return null;
    const { google } = await getGoogleApis();
    const redirectUri = `${config.frontend.url.replace(/\/$/, '')}/api/v1/calendar/google/callback`;
    const client = new google.auth.OAuth2(config.google.clientId, config.google.clientSecret, redirectUri);
    client.setCredentials({
      access_token: conn.accessToken,
      refresh_token: conn.refreshToken ?? undefined,
      expiry_date: conn.tokenExpiresAt?.getTime(),
    });
    // googleapis auto-refreshes when the access token is stale. Listen for new
    // tokens and persist them so the row stays current.
    client.on('tokens', (newTokens) => {
      prisma.calendarConnection.update({
        where: { userId_provider: { userId, provider: 'GOOGLE' } },
        data: {
          accessToken: newTokens.access_token ?? conn.accessToken,
          ...(newTokens.refresh_token ? { refreshToken: newTokens.refresh_token } : {}),
          tokenExpiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null,
        },
      }).catch((err) => logger.warn('Failed to persist refreshed Google tokens', { userId, error: err.message }));
    });
    return { client, conn };
  }

  /**
   * Push a booking to a user's Google Calendar. Creates a new event if no
   * external ID is recorded yet, updates the existing event otherwise.
   * Returns the new external event ID (or null if user isn't connected).
   */
  static async pushBookingForUser(userId: string, opts: {
    bookingId: string;
    summary: string;
    description?: string;
    startISO: string;
    endISO: string;
    timezone?: string;
    location?: string;
    existingEventId?: string | null;
  }): Promise<string | null> {
    const authed = await this.getAuthedClient(userId);
    if (!authed) return null;
    const { client, conn } = authed;
    const { google } = await getGoogleApis();
    const calendar = google.calendar({ version: 'v3', auth: client });

    const event = {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: opts.startISO, timeZone: opts.timezone ?? 'UTC' },
      end: { dateTime: opts.endISO, timeZone: opts.timezone ?? 'UTC' },
      location: opts.location,
      extendedProperties: { private: { miyzapisBookingId: opts.bookingId } },
    };

    try {
      let externalId: string | null = opts.existingEventId ?? null;
      if (externalId) {
        const res = await calendar.events.update({
          calendarId: conn.calendarId,
          eventId: externalId,
          requestBody: event,
        });
        externalId = res.data.id ?? externalId;
      } else {
        const res = await calendar.events.insert({
          calendarId: conn.calendarId,
          requestBody: event,
        });
        externalId = res.data.id ?? null;
      }
      await prisma.calendarConnection.update({
        where: { userId_provider: { userId, provider: 'GOOGLE' } },
        data: { lastSyncAt: new Date(), lastSyncError: null },
      });
      return externalId;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn('Google Calendar push failed', { userId, bookingId: opts.bookingId, error: message });
      await prisma.calendarConnection.update({
        where: { userId_provider: { userId, provider: 'GOOGLE' } },
        data: { lastSyncError: message.slice(0, 500) },
      }).catch(() => undefined);
      return null;
    }
  }

  /** Delete a previously-pushed event from a user's calendar. No-op if user not connected. */
  static async deleteEventForUser(userId: string, eventId: string): Promise<void> {
    if (!eventId) return;
    const authed = await this.getAuthedClient(userId);
    if (!authed) return;
    const { client, conn } = authed;
    const { google } = await getGoogleApis();
    const calendar = google.calendar({ version: 'v3', auth: client });
    try {
      await calendar.events.delete({ calendarId: conn.calendarId, eventId });
    } catch (err: unknown) {
      // 404/410 means the user already deleted it from their calendar — that's fine.
      const message = err instanceof Error ? err.message : String(err);
      if (!/not found|deleted|410|404/i.test(message)) {
        logger.warn('Google Calendar delete failed', { userId, eventId, error: message });
      }
    }
  }
}
