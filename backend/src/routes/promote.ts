import { Router, Request, Response } from 'express';
import { PromoteService, PromoteServiceError } from '@/services/promote/promote.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

// ---------------------------------------------------------------------------
// Marketplace acquisition — Promote routes (owner-scoped).
// The logged-in specialist owns their featured boost + acquisition reporting.
// All routes require an authenticated SPECIALIST.
// ---------------------------------------------------------------------------
const router = Router();

router.use(authenticateToken, requireSpecialist);

const ownerIdOf = (req: Request): string =>
  (req as unknown as AuthenticatedRequest).user!.id;

const requestId = (req: Request): string =>
  (req.headers['x-request-id'] as string) || '';

const statusForServiceError = (code: string): number => {
  switch (code) {
    case 'SPECIALIST_NOT_FOUND':
    case 'SERVICE_NOT_FOUND':
      return 404;
    default:
      return 400;
  }
};

// GET /promote/listing — the owner's promoted-listing creative (null if none).
router.get('/listing', async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await PromoteService.getListing(ownerIdOf(req));
    res.json(createSuccessResponse({ listing }));
  } catch (error: unknown) {
    if (error instanceof PromoteServiceError) {
      res
        .status(statusForServiceError(error.code))
        .json(createErrorResponse(error.code, error.message, requestId(req)));
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting promote listing:', error);
    res.status(500).json(createErrorResponse('PROMOTE_ERROR', err.message, requestId(req)));
  }
});

// PUT /promote/listing — create/update the creative. Lands in DRAFT, or
// PENDING_REVIEW when { submit: true }. Going ACTIVE is a platform decision.
router.put('/listing', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};
    const listing = await PromoteService.upsertListing(ownerIdOf(req), {
      headline: body.headline,
      offerText: body.offerText,
      imageUrl: body.imageUrl,
      logoUrl: body.logoUrl,
      accentColor: body.accentColor,
      highlightServiceId: body.highlightServiceId,
      ctaLabel: body.ctaLabel,
      submit: body.submit === true,
    });
    res.json(createSuccessResponse({ listing }));
  } catch (error: unknown) {
    if (error instanceof PromoteServiceError) {
      res
        .status(statusForServiceError(error.code))
        .json(createErrorResponse(error.code, error.message, requestId(req)));
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error upserting promote listing:', error);
    res.status(500).json(createErrorResponse('PROMOTE_ERROR', err.message, requestId(req)));
  }
});

// GET /promote/status — current featured/boost state for the owner.
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await PromoteService.getStatus(ownerIdOf(req));
    res.json(createSuccessResponse({ status }));
  } catch (error: unknown) {
    if (error instanceof PromoteServiceError) {
      res
        .status(statusForServiceError(error.code))
        .json(createErrorResponse(error.code, error.message, requestId(req)));
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting promote status:', error);
    res.status(500).json(createErrorResponse('PROMOTE_ERROR', err.message, requestId(req)));
  }
});

// POST /promote/featured — toggle the boost { enabled: boolean, days?: number }.
// Self-serve today; becomes a paid boost once live billing lands.
router.post('/featured', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};
    if (typeof body.enabled !== 'boolean') {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', 'enabled (boolean) is required', requestId(req)));
      return;
    }
    const days =
      body.days !== undefined && body.days !== null ? Number(body.days) : undefined;
    if (days !== undefined && (!Number.isFinite(days) || days <= 0)) {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', 'days must be a positive number', requestId(req)));
      return;
    }

    const status = await PromoteService.setFeatured(ownerIdOf(req), {
      enabled: body.enabled,
      days,
    });
    res.json(createSuccessResponse({ status }));
  } catch (error: unknown) {
    if (error instanceof PromoteServiceError) {
      res
        .status(statusForServiceError(error.code))
        .json(createErrorResponse(error.code, error.message, requestId(req)));
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error setting promote featured:', error);
    res.status(500).json(createErrorResponse('PROMOTE_ERROR', err.message, requestId(req)));
  }
});

// GET /promote/stats?from=ISO&to=ISO — acquisition report.
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseDate = (v: unknown): Date | undefined => {
      if (typeof v !== 'string' || !v) return undefined;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? undefined : d;
    };
    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const stats = await PromoteService.acquisitionStats(ownerIdOf(req), from, to);
    res.json(createSuccessResponse({ stats }));
  } catch (error: unknown) {
    if (error instanceof PromoteServiceError) {
      res
        .status(statusForServiceError(error.code))
        .json(createErrorResponse(error.code, error.message, requestId(req)));
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting promote stats:', error);
    res.status(500).json(createErrorResponse('PROMOTE_ERROR', err.message, requestId(req)));
  }
});

export default router;
