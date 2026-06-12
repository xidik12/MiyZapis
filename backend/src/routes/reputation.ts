import { Router, Request, Response } from 'express';
import { ReputationService } from '@/services/reputation/reputation.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// All reputation routes require authentication and specialist role.
// Cast: middleware RequestHandler signature differs from this Router's generic
// Request type (same pattern as accounting.ts). Behaviour identical.
router.use(authenticateToken as any, requireSpecialist as any);

// The logged-in user owns the Specialist row that holds the review URLs.
const ownerIdOf = (req: Request): string =>
  (req as unknown as AuthenticatedRequest).user!.id;

const requestId = (req: Request): string =>
  (req.headers['x-request-id'] as string) || '';

// GET /reputation — the owner's review URLs + auto-request state.
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await ReputationService.getSettings(ownerIdOf(req));
    res.json(createSuccessResponse(settings));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting reputation settings:', error);
    res.status(500).json(createErrorResponse('REPUTATION_ERROR', err.message, requestId(req)));
  }
});

// PUT /reputation — update the owner's Google / Facebook review URLs.
router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await ReputationService.setSettings(ownerIdOf(req), {
      googleReviewUrl: req.body?.googleReviewUrl,
      facebookReviewUrl: req.body?.facebookReviewUrl,
      autoRequestEnabled: req.body?.autoRequestEnabled,
    });
    res.json(createSuccessResponse(settings));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'INVALID_URL') {
      res.status(400).json(createErrorResponse('INVALID_URL', 'Review URL must be a valid http(s) URL', requestId(req)));
      return;
    }
    if (err.message === 'SPECIALIST_NOT_FOUND') {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Specialist profile not found', requestId(req)));
      return;
    }
    logger.error('Error updating reputation settings:', error);
    res.status(500).json(createErrorResponse('REPUTATION_ERROR', err.message, requestId(req)));
  }
});

export default router;
