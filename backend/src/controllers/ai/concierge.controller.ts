import { Request, Response } from 'express';
import { runConcierge, isConciergeEnabled, type ConciergeTurn } from '@/services/ai/concierge.service';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const numOrUndef = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

export async function conciergeHandler(req: Request, res: Response): Promise<void> {
  if (!isConciergeEnabled()) {
    res.status(503).json({ success: false, error: 'The AI concierge is not available yet.' });
    return;
  }
  const { message, history, lat, lng, city } = (req.body || {}) as {
    message?: string; history?: ConciergeTurn[]; lat?: unknown; lng?: unknown; city?: string;
  };
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ success: false, error: 'A message is required.' });
    return;
  }

  // Paywall: the AI concierge is a paid (Premium) feature. Access only while the
  // user's aiAccessUntil is in the future.
  const uid = (req as { user?: { id?: string } }).user?.id;
  const user = uid ? await prisma.user.findUnique({ where: { id: uid }, select: { aiAccessUntil: true } }) : null;
  const entitled = !!user?.aiAccessUntil && new Date(user.aiAccessUntil) > new Date();
  if (!entitled) {
    res.status(402).json({ success: false, code: 'AI_PREMIUM_REQUIRED', error: 'The AI concierge is a Premium feature. Upgrade to use it.' });
    return;
  }

  try {
    const result = await runConcierge({
      message: message.slice(0, 2000),
      history: Array.isArray(history)
        ? history.filter((h) => h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string').slice(-10)
        : [],
      lat: numOrUndef(lat),
      lng: numOrUndef(lng),
      city: typeof city === 'string' ? city : undefined,
      userId: (req as { user?: { id?: string } }).user?.id,
    });
    res.json({ success: true, data: result });
  } catch (e) {
    logger.error('Concierge request failed', { error: e instanceof Error ? e.message : e });
    res.status(500).json({ success: false, error: 'Sorry — the concierge had a problem. Please try again.' });
  }
}
