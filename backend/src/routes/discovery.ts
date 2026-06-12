// Public discovery / AI-search surfaces for MiyZapis.
//
// These endpoints are intentionally PUBLIC (no auth) and expose only data that
// already appears on the public specialist profile (/s/:slug) and business
// (/biz/:slug) pages. They make the platform's bookable services machine
// readable by aggregators, AI assistants and search crawlers.
//
//   GET /discovery/feed            JSON feed of active, bookable services
//   GET /discovery/feed/:slug      same feed scoped to one specialist (by slug or id)
//   GET /discovery/sitemap.xml     XML urlset of public /s/<slug> + /biz/<slug> URLs
//
// "Reserve with Google": the /discovery/feed payload is the shape an aggregator
// or a Reserve-with-Google action feed would consume. Wiring it into the actual
// Reserve-with-Google partner program is NOT done here — that requires Google
// Actions Center onboarding (a real-time booking server + feeds approved by
// Google). This endpoint is the data source such an integration would read.

import { Router, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { cacheMiddleware } from '@/middleware/cache';
import { logger } from '@/utils/logger';

const router = Router();

// Canonical public site origin used to build absolute booking/profile URLs.
// Overridable via PUBLIC_SITE_URL; defaults to the production domain.
const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://miyzapis.com').replace(/\/$/, '');

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

type FeedEntry = {
  specialistName: string;
  slug: string;
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  durationMinutes: number;
  city: string | null;
  bookingUrl: string;
  rating: number;
};

// Build the booking URL the way the SPA expects it: /booking/<serviceId>.
const bookingUrl = (serviceId: string) => `${SITE_URL}/booking/${serviceId}`;

const fullName = (user: { firstName: string; lastName: string }) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ').trim();

// Map a Prisma service row (with its specialist+user joined) to a feed entry.
function toFeedEntry(svc: {
  id: string;
  name: string;
  basePrice: unknown;
  currency: string;
  duration: number;
  specialist: {
    slug: string | null;
    id: string;
    city: string | null;
    rating: number;
    user: { firstName: string; lastName: string };
  };
}): FeedEntry {
  const spec = svc.specialist;
  return {
    specialistName: fullName(spec.user) || 'Specialist',
    // Prefer the human-friendly slug; fall back to the id so the URL always resolves.
    slug: spec.slug || spec.id,
    serviceId: svc.id,
    serviceName: svc.name,
    price: Number(svc.basePrice ?? 0),
    currency: svc.currency || 'UAH',
    durationMinutes: svc.duration ?? 0,
    city: spec.city || null,
    bookingUrl: bookingUrl(svc.id),
    rating: Number(spec.rating ?? 0),
  };
}

// Shared select: only the fields the feed exposes (all already public).
const FEED_SELECT = {
  id: true,
  name: true,
  basePrice: true,
  currency: true,
  duration: true,
  specialist: {
    select: {
      id: true,
      slug: true,
      city: true,
      rating: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} as const;

// Only active, non-deleted services of active, non-deleted specialist accounts.
function feedWhere(extra: Record<string, unknown> = {}) {
  return {
    isActive: true,
    isDeleted: false,
    // Don't surface point-only services in a discovery/booking feed.
    loyaltyPointsOnly: false,
    specialist: {
      user: { isActive: true },
    },
    ...extra,
  };
}

// GET /discovery/feed — paginated feed across all active specialists.
// Query: ?limit (<=500), ?offset, ?city (case-insensitive contains)
router.get(
  '/feed',
  cacheMiddleware(300, 'discovery-feed'),
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(
        Math.max(parseInt(String(req.query.limit ?? ''), 10) || DEFAULT_LIMIT, 1),
        MAX_LIMIT,
      );
      const offset = Math.max(parseInt(String(req.query.offset ?? ''), 10) || 0, 0);
      const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';

      const where = feedWhere(
        city
          ? { specialist: { is: { city: { contains: city }, user: { isActive: true } } } }
          : {},
      );

      const [rows, total] = await Promise.all([
        prisma.service.findMany({
          where: where as any,
          select: FEED_SELECT,
          orderBy: [{ specialist: { rating: 'desc' } }, { name: 'asc' }],
          skip: offset,
          take: limit,
        }),
        prisma.service.count({ where: where as any }),
      ]);

      const entries = rows.map((r) => toFeedEntry(r as any));

      res.json({
        generator: 'MiyZapis Discovery Feed',
        siteUrl: SITE_URL,
        generatedAt: new Date().toISOString(),
        total,
        limit,
        offset,
        count: entries.length,
        entries,
      });
    } catch (error) {
      logger.error('Discovery feed error:', error);
      res.status(500).json({ error: 'Failed to build discovery feed' });
    }
  },
);

// GET /discovery/feed/:slug — feed scoped to a single specialist (slug or id).
router.get(
  '/feed/:slug',
  cacheMiddleware(300, 'discovery-feed-slug'),
  async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;

      const specialist = await prisma.specialist.findFirst({
        where: {
          OR: [{ slug }, { id: slug }],
          user: { isActive: true },
        },
        select: { id: true },
      });

      if (!specialist) {
        res.status(404).json({ error: 'Specialist not found' });
        return;
      }

      const rows = await prisma.service.findMany({
        where: feedWhere({ specialistId: specialist.id }) as any,
        select: FEED_SELECT,
        orderBy: { name: 'asc' },
      });

      const entries = rows.map((r) => toFeedEntry(r as any));

      res.json({
        generator: 'MiyZapis Discovery Feed',
        siteUrl: SITE_URL,
        generatedAt: new Date().toISOString(),
        count: entries.length,
        entries,
      });
    } catch (error) {
      logger.error('Discovery feed (slug) error:', error);
      res.status(500).json({ error: 'Failed to build discovery feed' });
    }
  },
);

// XML-escape text for safe inclusion in <loc>.
const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// GET /discovery/sitemap.xml — urlset of public specialist + business pages.
router.get(
  '/sitemap.xml',
  cacheMiddleware(600, 'discovery-sitemap'),
  async (_req: Request, res: Response) => {
    try {
      const [specialists, businesses] = await Promise.all([
        prisma.specialist.findMany({
          where: { slug: { not: null }, user: { isActive: true } },
          select: { slug: true, updatedAt: true },
        }),
        prisma.business.findMany({
          where: { isActive: true },
          select: { slug: true, updatedAt: true },
        }),
      ]);

      const urls: string[] = [];
      // Home page first.
      urls.push(`  <url><loc>${SITE_URL}/</loc></url>`);

      for (const s of specialists) {
        if (!s.slug) continue;
        urls.push(
          `  <url><loc>${xmlEscape(`${SITE_URL}/s/${s.slug}`)}</loc>` +
            `<lastmod>${s.updatedAt.toISOString()}</lastmod></url>`,
        );
      }
      for (const b of businesses) {
        urls.push(
          `  <url><loc>${xmlEscape(`${SITE_URL}/biz/${b.slug}`)}</loc>` +
            `<lastmod>${b.updatedAt.toISOString()}</lastmod></url>`,
        );
      }

      const xml =
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        urls.join('\n') +
        `\n</urlset>\n`;

      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.send(xml);
    } catch (error) {
      logger.error('Discovery sitemap error:', error);
      res.status(500).type('application/xml').send('<?xml version="1.0"?><urlset/>');
    }
  },
);

export default router;
