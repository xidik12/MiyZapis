import { Router } from 'express';
import { AdminController } from '@/controllers/admin/admin-dashboard';
import { authenticateToken, requireUserType } from '@/middleware/auth/jwt';
import { ReferralProcessingService } from '@/services/referral/processing.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';
import { logger } from '@/utils/logger';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireUserType('ADMIN'));

// Dashboard and analytics routes
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/analytics/users', AdminController.getUserAnalytics);
router.get('/analytics/bookings', AdminController.getBookingAnalytics);
router.get('/analytics/financial', AdminController.getFinancialAnalytics);

// Referral analytics routes
router.get('/analytics/referrals', async (req, res) => {
  try {
    const summary = await ReferralProcessingService.getReferralPerformanceSummary();
    res.json(createSuccessResponse({ referralAnalytics: summary }));
  } catch (error) {
    logger.error('Failed to get referral analytics', { error });
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get referral analytics',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Referral management routes
router.post('/referrals/cleanup-expired', async (req, res) => {
  try {
    const count = await ReferralProcessingService.cleanupExpiredReferrals();
    res.json(createSuccessResponse({
      message: `Cleaned up ${count} expired referrals`,
      cleanedCount: count
    }));
  } catch (error) {
    logger.error('Failed to cleanup expired referrals', { error });
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to cleanup expired referrals',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// User management routes
router.post('/users/manage', AdminController.manageUsers);

// System health and monitoring
router.get('/system/health', AdminController.getSystemHealth);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;