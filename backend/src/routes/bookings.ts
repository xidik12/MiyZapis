import { Router, Request, Response } from 'express';
import { BookingController } from '@/controllers/bookings';
import { authenticateToken, requireAuth, requireAdmin } from '@/middleware/auth/jwt';
import { BookingLifecycleService } from '@/services/booking/lifecycle.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { bookingRateLimit } from '@/middleware/rate-limiter';
import {
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateGetBookings,
  validateBookingId,
  validateConfirmBooking,
  validateCancelBooking
} from '@/middleware/validation/bookings';

const router = Router();

// All booking routes require authentication.
// requireAuth guarantees req.user exists, so controllers don't need `if (!req.user)` checks.
router.use(authenticateToken, requireAuth);

// Protected routes
router.post('/', bookingRateLimit, validateCreateBooking, BookingController.createBooking);
router.post('/with-payment', bookingRateLimit, BookingController.createBookingWithPayment);
router.post('/recurring', bookingRateLimit, BookingController.createRecurringBooking);
router.get('/', validateGetBookings, BookingController.getUserBookings);
router.get('/stats', BookingController.getSpecialistBookingStats);
router.get('/:bookingId', validateBookingId, BookingController.getBooking);
router.put('/:bookingId', validateBookingId, validateUpdateBookingStatus, BookingController.updateBooking);
router.put('/:bookingId/confirm', validateConfirmBooking, BookingController.confirmBooking);
router.post('/:bookingId/complete', validateBookingId, BookingController.completeBookingWithPayment);
router.put('/:bookingId/reject', validateBookingId, BookingController.rejectBooking);
router.put('/:bookingId/cancel', validateCancelBooking, BookingController.cancelBooking);

// Unified post-appointment resolution. Either the customer or the specialist can
// hit this to settle a past booking — Completed, or No-show with which party
// didn't attend. Used both manually (from the UI) and from the stale-bookings
// cron's notification deep links.
router.post('/:bookingId/resolve', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(createErrorResponse('AUTHENTICATION_REQUIRED', 'Access token is required', req.id));
    }
    const { outcome, noShowParty, notes } = req.body ?? {};
    if (outcome !== 'COMPLETED' && outcome !== 'NO_SHOW') {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'outcome must be COMPLETED or NO_SHOW', req.id));
    }

    // We need to know whether the caller is the customer or the specialist to
    // attribute the resolution correctly in the audit notes.
    const booking = await (await import('@/config/database')).prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true, specialistId: true },
    });
    if (!booking) {
      return res.status(404).json(createErrorResponse('BOOKING_NOT_FOUND', 'Booking not found', req.id));
    }
    const party = userId === booking.customerId ? 'CUSTOMER' : userId === booking.specialistId ? 'SPECIALIST' : null;
    if (!party) {
      return res.status(403).json(createErrorResponse('NOT_AUTHORIZED', 'You are not a participant of this booking', req.id));
    }

    let updated;
    if (outcome === 'COMPLETED') {
      updated = await BookingLifecycleService.markCompleted(bookingId, userId, party, notes);
    } else {
      if (noShowParty !== 'CUSTOMER' && noShowParty !== 'SPECIALIST') {
        return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'noShowParty must be CUSTOMER or SPECIALIST', req.id));
      }
      updated = await BookingLifecycleService.markNoShow(bookingId, userId, party, noShowParty, notes);
    }
    return res.json(createSuccessResponse({ booking: updated }));
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : 'RESOLVE_FAILED';
    const known = ['BOOKING_NOT_FOUND', 'BOOKING_ALREADY_RESOLVED', 'NOT_AUTHORIZED', 'INVALID_NO_SHOW_REPORT'];
    if (known.includes(code)) {
      return res.status(code === 'BOOKING_NOT_FOUND' ? 404 : code === 'NOT_AUTHORIZED' ? 403 : 400)
        .json(createErrorResponse(code, code, req.id));
    }
    logger.error('Booking resolve failed', { error: code });
    return res.status(500).json(createErrorResponse('RESOLVE_FAILED', 'Failed to resolve booking', req.id));
  }
});

// Admin routes
router.get('/admin/all', requireAdmin, BookingController.getAllBookings);

export default router;