// Marketplace search-box autocomplete. Returns a mixed list of matches
// across services, specialists, and categories. The frontend renders these
// in a single dropdown grouped by `type`.
//
// Cheap and cached — runs three short Prisma queries in parallel, capped at
// `limit` per type, results joined client-side. Suitable for as-you-type.

import { Router, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { cacheMiddleware } from '@/middleware/cache';

const router = Router();

interface Suggestion {
  type: 'service' | 'specialist' | 'category';
  id: string;
  label: string;
  sublabel?: string;
  // Action hints for the frontend so it can route correctly.
  href: string;
}

router.get('/suggest', cacheMiddleware(60, 'search-suggest'), async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || '').trim();
  const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '5', 10), 1), 10);
  if (q.length < 2) {
    return res.json(createSuccessResponse({ suggestions: [], q }));
  }

  try {
    const [services, specialists, categories] = await Promise.all([
      prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, category: true, basePrice: true, currency: true },
        take: limit,
        orderBy: [{ name: 'asc' }],
      }),
      prisma.specialist.findMany({
        where: {
          user: { isActive: true },
          OR: [
            { businessName: { contains: q, mode: 'insensitive' } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
          ],
        },
        select: {
          id: true, slug: true, businessName: true, rating: true,
          user: { select: { firstName: true, lastName: true } },
        },
        take: limit,
        orderBy: [{ rating: 'desc' }],
      }),
      prisma.category.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: { id: true, slug: true, name: true },
        take: limit,
        orderBy: [{ name: 'asc' }],
      }).catch(() => [] as Array<{ id: string; slug: string | null; name: string }>),
    ]);

    const suggestions: Suggestion[] = [
      ...services.map((s) => ({
        type: 'service' as const,
        id: s.id,
        label: s.name,
        sublabel: s.basePrice ? `${s.basePrice} ${s.currency}` : undefined,
        href: `/services/${s.id}`,
      })),
      ...specialists.map((s) => {
        const name = s.businessName || `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.trim() || 'Specialist';
        return {
          type: 'specialist' as const,
          id: s.id,
          label: name,
          sublabel: s.rating ? `★ ${s.rating.toFixed(1)}` : undefined,
          href: s.slug ? `/specialist/${s.slug}` : `/specialists/${s.id}`,
        };
      }),
      ...categories.map((c) => ({
        type: 'category' as const,
        id: c.id,
        label: c.name,
        href: `/search?category=${encodeURIComponent(c.slug ?? c.id)}`,
      })),
    ];

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json(createSuccessResponse({ suggestions, q }));
  } catch (err) {
    logger.error('Autocomplete failed', { error: (err as Error).message, q });
    return res.status(500).json(createErrorResponse('SEARCH_SUGGEST_FAILED', 'Search suggestions unavailable', req.id));
  }
});

export default router;
