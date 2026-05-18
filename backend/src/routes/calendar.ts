// User-facing calendar OAuth + status + manual resync endpoints.
import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { GoogleCalendarService } from '@/services/calendar/google-calendar.service';
import { AppleCalendarService } from '@/services/calendar/apple-calendar.service';
import { BookingCalendarSync } from '@/services/calendar/booking-sync';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

const router = Router();

// Status — does the caller have a connected calendar?
router.get('/google/status', authenticateToken as any, async (req: Request, res: Response) => {
  const userId = (req as unknown as AuthenticatedRequest).user!.id;
  const status = await GoogleCalendarService.getStatus(userId);
  return res.json(createSuccessResponse({ connected: !!status, ...(status ?? {}) }));
});

// Get OAuth consent URL — frontend redirects the user here.
router.get('/google/connect', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    if (!GoogleCalendarService.oauthConfigured) {
      return res.status(503).json(createErrorResponse('OAUTH_NOT_CONFIGURED', 'Google OAuth client not configured', req.id));
    }
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const url = await GoogleCalendarService.getAuthUrl(userId);
    return res.json(createSuccessResponse({ url }));
  } catch (err) {
    logger.error('Calendar connect failed', { error: (err as Error).message });
    return res.status(500).json(createErrorResponse('CONNECT_FAILED', 'Failed to start OAuth', req.id));
  }
});

// OAuth callback — Google redirects here with ?code=&state=
// state is the userId (we issued it in /connect).
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }
  try {
    await GoogleCalendarService.handleCallback(code, state);
    // Redirect back to frontend dashboard with success flag.
    const frontend = (await import('@/config')).config.frontend.url.replace(/\/$/, '');
    return res.redirect(`${frontend}/dashboard?calendar=connected`);
  } catch (err) {
    logger.error('Calendar OAuth callback failed', { error: (err as Error).message });
    const frontend = (await import('@/config')).config.frontend.url.replace(/\/$/, '');
    return res.redirect(`${frontend}/dashboard?calendar=error`);
  }
});

router.delete('/google', authenticateToken as any, async (req: Request, res: Response) => {
  const userId = (req as unknown as AuthenticatedRequest).user!.id;
  await GoogleCalendarService.disconnect(userId);
  return res.json(createSuccessResponse({ disconnected: true }));
});

// Manual resync — pushes the caller's upcoming bookings to their calendar
// (useful after connecting, or after a sync error). Re-pushes to ALL providers
// the user has connected.
router.post('/resync', authenticateToken as any, async (req: Request, res: Response) => {
  const userId = (req as unknown as AuthenticatedRequest).user!.id;
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ customerId: userId }, { specialistId: userId }],
      status: { in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] },
      scheduledAt: { gte: new Date() },
    },
    select: { id: true },
  });
  for (const b of bookings) BookingCalendarSync.syncBooking(b.id);
  return res.json(createSuccessResponse({ queued: bookings.length }));
});
// Keep Google-prefixed alias for backwards compat with anything already calling it.
router.post('/google/resync', authenticateToken as any, async (req: Request, res: Response) => {
  const userId = (req as unknown as AuthenticatedRequest).user!.id;
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ customerId: userId }, { specialistId: userId }],
      status: { in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] },
      scheduledAt: { gte: new Date() },
    },
    select: { id: true },
  });
  for (const b of bookings) BookingCalendarSync.syncBooking(b.id);
  return res.json(createSuccessResponse({ queued: bookings.length }));
});

// ─── Apple / iCloud ─────────────────────────────────────────────────────
//
// Apple has no OAuth for Calendar. User flow:
//   1) https://appleid.apple.com → Sign-In and Security → App-Specific Passwords → generate
//   2) POST /apple/connect with { appleId, appPassword }
// The app-specific password is stored in CalendarConnection.accessToken; rotate
// by repeating the flow or DELETE /apple to disconnect.

router.get('/apple/status', authenticateToken as any, async (req: Request, res: Response) => {
  const userId = (req as unknown as AuthenticatedRequest).user!.id;
  const status = await AppleCalendarService.getStatus(userId);
  return res.json(createSuccessResponse({ connected: !!status, ...(status ?? {}) }));
});

router.post('/apple/connect', authenticateToken as any, async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const { appleId, appPassword } = req.body ?? {};
    if (!appleId || !appPassword) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'appleId and appPassword required', req.id));
    }
    const conn = await AppleCalendarService.connect(userId, appleId, appPassword);
    return res.json(createSuccessResponse({
      connected: true,
      provider: conn.provider,
      calendarName: conn.calendarName,
    }));
  } catch (err) {
    const code = (err as Error).message;
    if (code === 'CALDAV_AUTH_FAILED') {
      return res.status(401).json(createErrorResponse(code, 'iCloud rejected the credentials. Generate a fresh app-specific password and retry.', req.id));
    }
    if (code === 'NO_CALENDARS_FOUND') {
      return res.status(400).json(createErrorResponse(code, 'No calendars on this iCloud account', req.id));
    }
    logger.error('Apple Calendar connect failed', { error: code });
    return res.status(500).json(createErrorResponse('CONNECT_FAILED', 'Failed to connect iCloud calendar', req.id));
  }
});

router.delete('/apple', authenticateToken as any, async (req: Request, res: Response) => {
  const userId = (req as unknown as AuthenticatedRequest).user!.id;
  await AppleCalendarService.disconnect(userId);
  return res.json(createSuccessResponse({ disconnected: true }));
});

export default router;
