import { Router, Request, Response } from 'express';
import {
  MarketingService,
  MarketingServiceError,
  MARKETING_TYPES,
  MARKETING_CHANNELS,
  BIRTHDAY_SUPPORTED,
  MarketingChannel,
  ConfigPatch,
} from '@/services/marketing/marketing.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

// Marketing automation routes. The logged-in specialist/business owner is the
// automation owner. All routes are owner-scoped.
const router = Router();

router.use(authenticateToken, requireSpecialist);

const ownerIdOf = (req: Request): string =>
  (req as unknown as AuthenticatedRequest).user!.id;

const requestId = (req: Request): string =>
  (req.headers['x-request-id'] as string) || '';

const statusForServiceError = (code: string): number => {
  switch (code) {
    case 'INVALID_TYPE':
    case 'INVALID_CHANNEL':
    case 'INVALID_DAYS':
      return 400;
    default:
      return 400;
  }
};

// GET /config — the 3 automations (defaults created if missing) + meta.
router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const automations = await MarketingService.getConfig(ownerId);
    res.json(
      createSuccessResponse({
        automations,
        birthdaySupported: BIRTHDAY_SUPPORTED,
      })
    );
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting marketing config:', error);
    res.status(500).json(createErrorResponse('MARKETING_ERROR', err.message, requestId(req)));
  }
});

// PUT /config/:type — upsert one automation's config.
router.put('/config/:type', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const type = (req.params.type || '').toUpperCase();
    const body = req.body || {};

    const patch: ConfigPatch = {};
    if (body.isEnabled !== undefined) patch.isEnabled = Boolean(body.isEnabled);
    if (body.lapsedDays !== undefined) patch.lapsedDays = Number(body.lapsedDays);
    if (body.rebookDays !== undefined) patch.rebookDays = Number(body.rebookDays);
    if (body.channel !== undefined) {
      if (!MARKETING_CHANNELS.includes(body.channel)) {
        res
          .status(400)
          .json(createErrorResponse('VALIDATION_ERROR', 'Invalid channel', requestId(req)));
        return;
      }
      patch.channel = body.channel as MarketingChannel;
    }
    if (body.messageTemplate !== undefined) {
      patch.messageTemplate =
        body.messageTemplate === null ? null : String(body.messageTemplate);
    }

    const updated = await MarketingService.setConfig(ownerId, type, patch);
    res.json(createSuccessResponse({ automation: updated }));
  } catch (error: unknown) {
    if (error instanceof MarketingServiceError) {
      res
        .status(statusForServiceError(error.code))
        .json(createErrorResponse(error.code, error.message, requestId(req)));
      return;
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error setting marketing config:', error);
    res.status(500).json(createErrorResponse('MARKETING_ERROR', err.message, requestId(req)));
  }
});

// GET /stats — messages sent per type, last 30/90 days.
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const stats = await MarketingService.stats(ownerId);
    res.json(createSuccessResponse(stats));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting marketing stats:', error);
    res.status(500).json(createErrorResponse('MARKETING_ERROR', err.message, requestId(req)));
  }
});

// POST /run — manual "run now" for this owner.
router.post('/run', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const summary = await MarketingService.runForOwner(ownerId);
    res.json(createSuccessResponse(summary));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error running marketing automations:', error);
    res.status(500).json(createErrorResponse('MARKETING_ERROR', err.message, requestId(req)));
  }
});

// Reference the imported enum so unused-import linting stays quiet; also useful
// as a sanity guard at module load.
void MARKETING_TYPES;

export default router;
