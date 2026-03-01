import { Router } from 'express';
import { BookingController } from '@/controllers/bookings';
import { authenticateToken, requireAuth, requireAdmin } from '@/middleware/auth/jwt';
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

// Admin routes
router.get('/admin/all', requireAdmin, BookingController.getAllBookings);

export default router;