import { Router } from 'express';
import { BookingController } from '@/controllers/bookings';
import { authenticateToken, requireAdmin } from '@/middleware/auth/jwt';
import {
  validateCreateBooking,
  validateUpdateBookingStatus,
  validateGetBookings,
  validateBookingId,
  validateConfirmBooking,
  validateCancelBooking
} from '@/middleware/validation/bookings';

const router = Router();

// Protected routes - require authentication
router.post('/', authenticateToken, validateCreateBooking, BookingController.createBooking);
router.get('/', authenticateToken, validateGetBookings, BookingController.getUserBookings);
router.get('/stats', authenticateToken, BookingController.getSpecialistBookingStats);
router.get('/:bookingId', authenticateToken, validateBookingId, BookingController.getBooking);
router.put('/:bookingId', authenticateToken, validateBookingId, validateUpdateBookingStatus, BookingController.updateBooking);
router.put('/:bookingId/confirm', authenticateToken, validateConfirmBooking, BookingController.confirmBooking);
router.put('/:bookingId/reject', authenticateToken, validateBookingId, BookingController.rejectBooking);
router.put('/:bookingId/cancel', authenticateToken, validateCancelBooking, BookingController.cancelBooking);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, BookingController.getAllBookings);

export default router;