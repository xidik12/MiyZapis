/**
 * Public (no-auth) email tracking endpoints.
 *
 *   GET /track/c/:campaignId/open.gif?u=<customerId>
 *     Records a unique open per recipient, returns a 1×1 transparent GIF.
 *     Always responds 200 — never breaks the email client.
 *
 *   GET /track/c/:campaignId/click?u=<customerId>&r=<encodedUrl>
 *     Records a unique click per recipient (first click only increments clickCount).
 *     Redirects 302 to the original URL.
 *     Always redirects — never 500s to the user.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const router = Router();

// 1×1 transparent GIF (43 bytes, the canonical minimal GIF)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

const GIF_HEADERS = {
  'Content-Type': 'image/gif',
  'Content-Length': String(TRANSPARENT_GIF.length),
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

// ---------------------------------------------------------------------------
// GET /track/c/:campaignId/open.gif?u=<customerId>
// ---------------------------------------------------------------------------
router.get('/c/:campaignId/open.gif', async (req: Request, res: Response): Promise<void> => {
  // Always serve the pixel — tracking is best-effort, never block delivery.
  const sendPixel = () => {
    res.set(GIF_HEADERS).status(200).end(TRANSPARENT_GIF);
  };

  const { campaignId } = req.params;
  const customerId = typeof req.query.u === 'string' ? req.query.u : '';

  if (!campaignId || !customerId) {
    sendPixel();
    return;
  }

  try {
    // Upsert: create the event only if this recipient hasn't opened yet.
    // The partial unique index on (campaignId, customerId, type) WHERE url IS NULL
    // enforces one OPEN per recipient. P2002 = duplicate = already opened.
    await prisma.campaignEvent.create({
      data: {
        id: `${campaignId}_${customerId}_open_${Date.now()}`,
        campaignId,
        customerId,
        type: 'OPEN',
        url: null,
      },
    });

    // New open — increment the counter.
    await prisma.segmentCampaign.update({
      where: { id: campaignId },
      data: { openCount: { increment: 1 } },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'P2002') {
      // P2002 = unique violation = already counted; all other errors just log.
      logger.warn('email tracking: open record failed', { campaignId, customerId, err: (err as Error)?.message });
    }
    // Either way, still serve the pixel.
  }

  sendPixel();
});

// ---------------------------------------------------------------------------
// GET /track/c/:campaignId/click?u=<customerId>&r=<encodedUrl>
// ---------------------------------------------------------------------------
router.get('/c/:campaignId/click', async (req: Request, res: Response): Promise<void> => {
  const { campaignId } = req.params;
  const customerId = typeof req.query.u === 'string' ? req.query.u : '';
  const rawR = typeof req.query.r === 'string' ? req.query.r : '';

  // Validate destination URL — must be http(s).
  let destination = config.frontend.url || '/';
  try {
    const decoded = decodeURIComponent(rawR);
    if (/^https?:\/\//i.test(decoded)) {
      destination = decoded;
    }
  } catch {
    // malformed encoding — fall through to default destination
  }

  const doRedirect = () => res.redirect(302, destination);

  if (!campaignId || !customerId) {
    doRedirect();
    return;
  }

  try {
    // Record a click event. The partial unique index on
    // (campaignId, customerId, type, url) WHERE url IS NOT NULL
    // deduplicates per recipient+URL. P2002 = already clicked this URL.
    await prisma.campaignEvent.create({
      data: {
        id: `${campaignId}_${customerId}_click_${Date.now()}`,
        campaignId,
        customerId,
        type: 'CLICK',
        url: destination,
      },
    });

    // New click for this recipient+URL — increment clickCount.
    await prisma.segmentCampaign.update({
      where: { id: campaignId },
      data: { clickCount: { increment: 1 } },
    });
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code !== 'P2002') {
      logger.warn('email tracking: click record failed', { campaignId, customerId, err: (err as Error)?.message });
    }
    // Always redirect regardless.
  }

  doRedirect();
});

export default router;
