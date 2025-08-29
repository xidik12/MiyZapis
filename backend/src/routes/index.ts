import { Router } from 'express';
import authRoutes from './auth';
import authEnhancedRoutes from './auth-enhanced';
import oauthRoutes from './oauth';
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
import favoritesRoutes from './favorites';
import helpRoutes from './help';
import adminRoutes from './admin';
// New API routes
import loyaltyRoutes from './loyalty';
import availabilityRoutes from './availability';
import analyticsEnhancedRoutes from './analytics-enhanced';
import telegramEnhancedRoutes from './telegram-enhanced';
import diagnosticsRoutes from './diagnostics';
import setupAdminRoutes from './setup-admin';
import debugAdminRoutes from './debug-admin';
import debugEmailRoutes from './debug-email';

const router = Router();

// Health check routes
router.use('/', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/auth-enhanced', authEnhancedRoutes);
router.use('/oauth', oauthRoutes);
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
router.use('/favorites', favoritesRoutes);
router.use('/help', helpRoutes);
router.use('/admin', adminRoutes);

// New enhanced API routes
router.use('/loyalty', loyaltyRoutes);
router.use('/availability', availabilityRoutes);
router.use('/analytics-enhanced', analyticsEnhancedRoutes);
router.use('/telegram', telegramEnhancedRoutes);
router.use('/diagnostics', diagnosticsRoutes);

// Admin setup routes (for initial setup only)
router.use('/setup', setupAdminRoutes);

// Debug routes (for testing only)
router.use('/debug', debugAdminRoutes);
router.use('/debug/email', debugEmailRoutes);

export default router;