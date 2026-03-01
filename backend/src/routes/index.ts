import { Router } from 'express';
import authRoutes from './auth';
import authEnhancedRoutes from './auth-enhanced';
import oauthRoutes from './oauth';
import userRoutes from './users';
import serviceRoutes from './services';
import locationsRoutes from './locations';
import specialistRoutes from './specialists';
import bookingRoutes from './bookings';
import paymentRoutes from './payments';
import cryptoPaymentRoutes from './payment.routes';
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
import adminLoyaltyRoutes from './admin-loyalty';
import userLoyaltyFixRoutes from './user-loyalty-fix';
import rewardsRoutes from './rewards';
import referralRoutes from './referral';
import availabilityRoutes from './availability';
import analyticsEnhancedRoutes from './analytics-enhanced';
import telegramRoutes from './telegram';
import diagnosticsRoutes from './diagnostics';
import setupAdminRoutes from './setup-admin';
import debugAdminRoutes from './debug-admin';
import debugEmailRoutes from './debug-email';
import cronRoutes from './cron';
import groupSessionsRoutes from './group-sessions';
import expenseRoutes from './expenses';
import communityRoutes from './community';
import pushRoutes from './push';
import waitlistRoutes from './waitlist';

const router = Router();

// Health check routes
router.use('/', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/auth-enhanced', authEnhancedRoutes);
router.use('/oauth', oauthRoutes);
router.use('/users', userRoutes);
router.use('/services', serviceRoutes);
router.use('/locations', locationsRoutes);
router.use('/specialists', specialistRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/crypto-payments', cryptoPaymentRoutes);
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
router.use('/admin/loyalty', adminLoyaltyRoutes);
router.use('/user/loyalty', userLoyaltyFixRoutes);
router.use('/rewards', rewardsRoutes);
router.use('/referral', referralRoutes);
router.use('/', availabilityRoutes);  // Mount availability routes at root to match /specialists/:id/slots pattern
router.use('/analytics-enhanced', analyticsEnhancedRoutes);
router.use('/telegram', telegramRoutes);
router.use('/diagnostics', diagnosticsRoutes);
router.use('/group-sessions', groupSessionsRoutes);
router.use('/expenses', expenseRoutes);
router.use('/community', communityRoutes);
router.use('/push', pushRoutes);
router.use('/waitlist', waitlistRoutes);

// Admin setup routes (for initial setup only - production gated internally)
router.use('/setup', setupAdminRoutes);

// Debug routes - only available in development
if (process.env.NODE_ENV !== 'production') {
  router.use('/debug', debugAdminRoutes);
  router.use('/debug/email', debugEmailRoutes);
}

// Cron job routes (internal use only - should be protected)
router.use('/cron', cronRoutes);

export default router;
