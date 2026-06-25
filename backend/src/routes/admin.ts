import { Router } from 'express';
import { AdminController } from '@/controllers/admin/admin-dashboard';
import { authenticateToken, requireAdmin } from '@/middleware/auth/jwt';
import { ReferralProcessingService } from '@/services/referral/processing.service';
import { SpecialistService } from '@/services/specialist';
import { ReviewService } from '@/services/review';
import { CommunityController } from '@/controllers/community';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

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
router.get('/users', AdminController.listUsers);
router.post('/users/manage', AdminController.manageUsers);

// System health and monitoring
router.get('/system/health', AdminController.getSystemHealth);
router.get('/audit-logs', AdminController.getAuditLogs);

// Moderation: specialist verification
router.get('/moderation/verification-requests', async (req, res) => {
  try {
    const list = await SpecialistService.listPendingVerifications();
    res.json(createSuccessResponse({ verificationRequests: list }));
  } catch (error) {
    logger.error('List pending verifications error:', error);
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to list verification requests', req.headers['x-request-id'] as string));
  }
});

router.post('/moderation/verification/:specialistId', async (req: AuthenticatedRequest, res) => {
  try {
    const { specialistId } = req.params;
    const { action, note } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'action must be approve or reject', req.headers['x-request-id'] as string));
      return;
    }
    const result = await SpecialistService.resolveVerification(specialistId, action, note);
    res.json(createSuccessResponse({ specialist: result }));
  } catch (error) {
    logger.error('Resolve verification error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to resolve verification';
    if (msg === 'SPECIALIST_NOT_FOUND') {
      res.status(404).json(createErrorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Specialist not found', req.headers['x-request-id'] as string));
      return;
    }
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, msg, req.headers['x-request-id'] as string));
  }
});

// Moderation: review reports
router.get('/moderation/review-reports', async (req, res) => {
  try {
    const list = await ReviewService.listPendingReviewReports();
    res.json(createSuccessResponse({ reviewReports: list }));
  } catch (error) {
    logger.error('List review reports error:', error);
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to list review reports', req.headers['x-request-id'] as string));
  }
});

router.post('/moderation/review-reports/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action, resolutionNotes } = req.body;
    if (!['resolve', 'dismiss'].includes(action)) {
      res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'action must be resolve or dismiss', req.headers['x-request-id'] as string));
      return;
    }
    const result = await ReviewService.resolveReviewReport(id, action, resolutionNotes, req.user?.id);
    res.json(createSuccessResponse({ report: result }));
  } catch (error) {
    logger.error('Resolve review report error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to resolve review report';
    if (msg === 'REVIEW_REPORT_NOT_FOUND') {
      res.status(404).json(createErrorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Review report not found', req.headers['x-request-id'] as string));
      return;
    }
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, msg, req.headers['x-request-id'] as string));
  }
});

// Moderation: post reports
router.get('/moderation/post-reports', async (req, res) => {
  try {
    const list = await CommunityController.listPendingPostReports();
    res.json(createSuccessResponse({ postReports: list }));
  } catch (error) {
    logger.error('List post reports error:', error);
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to list post reports', req.headers['x-request-id'] as string));
  }
});

router.post('/moderation/post-reports/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { action, resolutionNotes } = req.body;
    if (!['resolve', 'dismiss'].includes(action)) {
      res.status(400).json(createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'action must be resolve or dismiss', req.headers['x-request-id'] as string));
      return;
    }
    const result = await CommunityController.resolvePostReport(id, action, resolutionNotes, req.user?.id);
    res.json(createSuccessResponse({ report: result }));
  } catch (error) {
    logger.error('Resolve post report error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to resolve post report';
    if (msg === 'POST_REPORT_NOT_FOUND') {
      res.status(404).json(createErrorResponse(ErrorCodes.RESOURCE_NOT_FOUND, 'Post report not found', req.headers['x-request-id'] as string));
      return;
    }
    res.status(500).json(createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, msg, req.headers['x-request-id'] as string));
  }
});

export default router;