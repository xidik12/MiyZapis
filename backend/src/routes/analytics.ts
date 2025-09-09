import { Router } from 'express';
import { query } from 'express-validator';
import { authenticateToken as authMiddleware, authenticateTokenOptional } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { AnalyticsController } from '@/controllers/analytics';

const router = Router();
const analyticsController = new AnalyticsController();

// Authentication will be applied per route as needed

// Get dashboard overview
router.get(
  '/dashboard',
  authMiddleware,
  analyticsController.getDashboard
);

// Get booking analytics
router.get(
  '/bookings',
  authMiddleware,
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ],
  validateRequest,
  analyticsController.getBookingAnalytics
);

// Get revenue analytics
router.get(
  '/revenue',
  authMiddleware,
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ],
  validateRequest,
  analyticsController.getRevenueAnalytics
);

// Get review analytics
router.get(
  '/reviews',
  authMiddleware,
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getReviewAnalytics
);

// Get response time analytics
router.get(
  '/response-time',
  authMiddleware,
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getResponseTimeAnalytics
);

// Get service performance
router.get(
  '/service-performance',
  authMiddleware,
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getServicePerformance
);

// Get earnings data
router.get(
  '/earnings',
  authMiddleware,
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601(),
    query('period').optional().isIn(['day', 'week', 'month'])
  ],
  validateRequest,
  analyticsController.getEarnings
);

// Get customer insights
router.get(
  '/customer-insights',
  authMiddleware,
  [
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getCustomerInsights
);

// Export analytics data
router.get(
  '/export',
  authMiddleware,
  [
    query('type').isIn(['bookings', 'revenue', 'reviews', 'customers']),
    query('format').optional().isIn(['csv', 'xlsx']),
    query('fromDate').optional().isISO8601(),
    query('toDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.exportData
);

// Missing endpoints that frontend is expecting
// Get overview analytics (general summary)
router.get(
  '/overview',
  authMiddleware,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getOverview
);

// Get services analytics (service-specific performance)
router.get(
  '/services',
  authMiddleware,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getServicesAnalytics
);

// Get performance analytics (response times, conversion rates)
router.get(
  '/performance',
  authMiddleware,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getPerformanceAnalytics
);

// Track profile view (can be accessed by anonymous users)
router.post(
  '/profile-views/:specialistId',
  authenticateTokenOptional,
  analyticsController.trackProfileView
);

// Get profile view statistics (authenticated specialists only)
router.get(
  '/profile-views',
  authMiddleware,
  [
    query('period').optional().isIn(['week', 'month', 'year'])
  ],
  validateRequest,
  analyticsController.getProfileViewStats
);

export default router;