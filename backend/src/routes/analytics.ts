import { Router } from 'express';
import { query } from 'express-validator';
import { authenticateToken as authMiddleware } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { AnalyticsController } from '@/controllers/analytics';

const router = Router();
const analyticsController = new AnalyticsController();

// All routes require authentication
router.use(authMiddleware);

// Get dashboard overview
router.get(
  '/dashboard',
  analyticsController.getDashboard
);

// Get booking analytics
router.get(
  '/bookings',
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
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  validateRequest,
  analyticsController.getPerformanceAnalytics
);

export default router;