import { Router } from 'express';
import { BookingController } from '@/controllers/bookings';
import { authenticateToken, requireAdmin } from '@/middleware/auth/jwt';

const router = Router();

// Protected routes - require authentication
router.post('/', authenticateToken, BookingController.createBooking);
router.get('/', authenticateToken, BookingController.getUserBookings);
router.get('/stats', authenticateToken, BookingController.getSpecialistBookingStats);
router.get('/:bookingId', authenticateToken, BookingController.getBooking);
router.put('/:bookingId', authenticateToken, BookingController.updateBooking);
router.put('/:bookingId/confirm', authenticateToken, BookingController.confirmBooking);
router.put('/:bookingId/reject', authenticateToken, BookingController.rejectBooking);
router.put('/:bookingId/cancel', authenticateToken, BookingController.cancelBooking);

// Admin routes
router.get('/admin/all', authenticateToken, requireAdmin, BookingController.getAllBookings);

export default router;