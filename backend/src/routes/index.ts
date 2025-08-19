import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import serviceRoutes from './services';
import specialistRoutes from './specialists';
import bookingRoutes from './bookings';
import paymentRoutes from './payments';
import reviewRoutes from './reviews';
import messageRoutes from './messages';
import notificationRoutes from './notifications';
import analyticsRoutes from './analytics';
import fileRoutes from './files';
import healthRoutes from './health';
// Import other route modules as they are created
// import loyaltyRoutes from './loyalty';
// import telegramRoutes from './telegram';

const router = Router();

// Health check routes
router.use('/', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/specialists', specialistRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/files', fileRoutes);
// router.use('/loyalty', loyaltyRoutes);
// router.use('/telegram', telegramRoutes);

export default router;