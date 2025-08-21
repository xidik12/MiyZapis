import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { query } from 'express-validator';
import { EnhancedAnalyticsController } from '@/controllers/analytics/enhanced';

const router = Router();

// Validation middleware
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month', 'year'])
    .withMessage('Group by must be one of: hour, day, week, month, year'),
];

const validateBookingAnalytics = [
  ...validateDateRange,
  query('status')
    .optional()
    .isIn(['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'])
    .withMessage('Status must be a valid booking status'),
  query('specialistId')
    .optional()
    .isString()
    .withMessage('Specialist ID must be a string'),
  query('serviceId')
    .optional()
    .isString()
    .withMessage('Service ID must be a string'),
  query('customerId')
    .optional()
    .isString()
    .withMessage('Customer ID must be a string'),
];

// Get specialist analytics
router.get(
  '/specialist/:id',
  authenticateToken,
  validateDateRange,
  EnhancedAnalyticsController.getSpecialistAnalytics
);

// Get current user's specialist analytics
router.get(
  '/my-specialist',
  authenticateToken,
  validateDateRange,
  EnhancedAnalyticsController.getMySpecialistAnalytics
);

// Get platform analytics (Admin only)
router.get(
  '/platform',
  authenticateToken,
  validateDateRange,
  EnhancedAnalyticsController.getPlatformAnalytics
);

// Get analytics summary for dashboard
router.get(
  '/summary',
  authenticateToken,
  EnhancedAnalyticsController.getAnalyticsSummary
);

// Get booking analytics with custom filters
router.get(
  '/bookings',
  authenticateToken,
  validateBookingAnalytics,
  EnhancedAnalyticsController.getBookingAnalytics
);

export default router;