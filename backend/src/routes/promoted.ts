import { Router, Request, Response } from 'express';
import { PromoteService } from '@/services/promote/promote.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// PUBLIC promoted-listing surfaces (no auth). Powers the marketplace ad slots:
//   GET  /promoted/showcase — active promoted cards for a given city/category
//   POST /promoted/track    — best-effort impression/click counters
// Creatives are owner-drafted (see /promote/listing) but only go live when the
// platform curates them to status=ACTIVE.
// ---------------------------------------------------------------------------
const router = Router();

const requestId = (req: Request): string =>
  (req.headers['x-request-id'] as string) || '';

// GET /promoted/showcase?city=&category=&limit=
router.get('/showcase', async (req: Request, res: Response): Promise<void> => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : undefined;

    const items = await PromoteService.showcase({ city, category, limit });
    res.json(createSuccessResponse({ items }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting promoted showcase:', error);
    // Never break a public page on an ad-slot failure — return empty.
    res.json(createSuccessResponse({ items: [] }));
    void err;
  }
});

// POST /promoted/track { promotionId, type: 'impression' | 'click' }
router.post('/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};
    const promotionId = typeof body.promotionId === 'string' ? body.promotionId : '';
    const type = body.type === 'click' ? 'click' : 'impression';
    if (!promotionId) {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', 'promotionId is required', requestId(req)));
      return;
    }
    await PromoteService.track(promotionId, type);
    res.json(createSuccessResponse({ ok: true }));
  } catch (error: unknown) {
    // Tracking is best-effort — never surface an error to the client.
    res.json(createSuccessResponse({ ok: true }));
    void error;
  }
});

export default router;
