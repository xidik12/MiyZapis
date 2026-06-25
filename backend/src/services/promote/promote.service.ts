import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Marketplace acquisition — Promote service (owner-scoped).
//
// Powers the growth flywheel that Fresha/Booksy monetize:
//   1. Featured/boosted placement in marketplace search (see specialist + service
//      search ranking — active-featured specialists sort first).
//   2. New-client attribution: every Booking records its `source`
//      (DIRECT | DISCOVERY | EMBED | MARKETPLACE) and `isFirstVisit`.
//   3. Reporting: the acquisition dashboard (bookings by source + new clients
//      acquired via discovery/embed).
//
// `ownerId` is always the logged-in user's id (User.id). Each owner has exactly
// one Specialist row (Specialist.userId). All booking aggregates key on the
// specialist's User id, mirroring Booking.specialistId usage across the codebase.
//
// BILLING NOTE: setFeatured() is a SELF-SERVE toggle for now — enabling a boost
// is free. Once live payments land, this becomes a PAID boost: setFeatured(enabled:
// true) would first require a successful charge / active subscription before
// flipping isFeatured, and acquisitionStats would feed commission/attribution
// billing ("you acquired N new clients via the marketplace this month"). Charging
// itself is intentionally out of scope here — placement + attribution + reporting
// only.
// ---------------------------------------------------------------------------

const DEFAULT_BOOST_DAYS = 30;

export const BOOKING_SOURCES = ['DIRECT', 'DISCOVERY', 'EMBED', 'MARKETPLACE'] as const;
export type BookingSourceKey = (typeof BOOKING_SOURCES)[number];

export class PromoteServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'PromoteServiceError';
  }
}

export interface FeaturedStatus {
  isFeatured: boolean; // raw column value (boost was switched on)
  isActive: boolean; // boost is on AND not expired
  featuredUntil: string | null; // ISO string or null (no expiry)
}

export interface SetFeaturedInput {
  enabled: boolean;
  days?: number; // boost length in days when enabling (default 30)
}

export interface AcquisitionStats {
  from: string | null;
  to: string | null;
  totalBookings: number;
  newClients: number; // bookings where isFirstVisit = true
  bySource: Record<BookingSourceKey, number>; // all bookings grouped by source
  newClientsBySource: Record<BookingSourceKey, number>; // first-visit bookings by source
}

// --- Promoted listing creative ---------------------------------------------

export const PROMOTION_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED'] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export interface PromotionListing {
  headline: string | null;
  offerText: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  accentColor: string;
  highlightServiceId: string | null;
  ctaLabel: string | null;
  status: PromotionStatus;
  startsAt: string | null;
  endsAt: string | null;
  impressions: number;
  clicks: number;
}

export interface UpsertListingInput {
  headline?: string | null;
  offerText?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  accentColor?: string | null;
  highlightServiceId?: string | null;
  ctaLabel?: string | null;
  submit?: boolean; // true → DRAFT becomes PENDING_REVIEW (request platform review)
}

export interface ShowcaseService {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: number;
}

export interface ShowcaseItem {
  promotionId: string;
  specialistId: string;
  slug: string | null;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  rating: number;
  reviewCount: number;
  headline: string | null;
  offerText: string | null;
  imageUrl: string | null;
  accentColor: string;
  ctaLabel: string | null;
  service: ShowcaseService | null;
}

const DEFAULT_ACCENT = '#5b6b3a';

export class PromoteService {
  // Resolve the owner's specialist row (throws if they have no profile).
  private static async getOwnerSpecialist(ownerId: string) {
    const specialist = await prisma.specialist.findUnique({
      where: { userId: ownerId },
      select: { id: true, userId: true, isFeatured: true, featuredUntil: true },
    });
    if (!specialist) {
      throw new PromoteServiceError('SPECIALIST_NOT_FOUND', 'Specialist profile not found');
    }
    return specialist;
  }

  private static toStatus(s: { isFeatured: boolean; featuredUntil: Date | null }): FeaturedStatus {
    const isActive =
      s.isFeatured && (s.featuredUntil == null || new Date(s.featuredUntil).getTime() > Date.now());
    return {
      isFeatured: s.isFeatured,
      isActive,
      featuredUntil: s.featuredUntil ? new Date(s.featuredUntil).toISOString() : null,
    };
  }

  // GET /promote/status — current featured/boost state for the owner.
  static async getStatus(ownerId: string): Promise<FeaturedStatus> {
    const specialist = await PromoteService.getOwnerSpecialist(ownerId);
    return PromoteService.toStatus(specialist);
  }

  // POST /promote/featured — toggle the boost.
  //   enabled: true  → isFeatured = true, featuredUntil = now + days (default 30)
  //   enabled: false → isFeatured = false, featuredUntil = null
  //
  // Self-serve toggle today. See BILLING NOTE at top of file — this becomes a
  // paid boost (charge-gated) once live payments are enabled.
  static async setFeatured(ownerId: string, input: SetFeaturedInput): Promise<FeaturedStatus> {
    const specialist = await PromoteService.getOwnerSpecialist(ownerId);

    let featuredUntil: Date | null = null;
    if (input.enabled) {
      const days =
        input.days != null && Number.isFinite(input.days) && input.days > 0
          ? Math.floor(input.days)
          : DEFAULT_BOOST_DAYS;
      featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.specialist.update({
      where: { id: specialist.id },
      data: {
        isFeatured: input.enabled,
        featuredUntil, // cleared (null) when disabling
        updatedAt: new Date(),
      },
      select: { isFeatured: true, featuredUntil: true },
    });

    logger.info('Promote: featured toggled', {
      ownerId,
      specialistId: specialist.id,
      enabled: input.enabled,
      featuredUntil,
    });

    return PromoteService.toStatus(updated);
  }

  // GET /promote/stats — acquisition report: bookings grouped by source +
  // new-client (first-visit) counts overall and per source, within [from, to].
  static async acquisitionStats(
    ownerId: string,
    from?: Date,
    to?: Date,
  ): Promise<AcquisitionStats> {
    const specialist = await PromoteService.getOwnerSpecialist(ownerId);

    const where: Record<string, unknown> = { specialistId: specialist.userId };
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: from } : {}),
        ...(to ? { lte: to } : {}),
      };
    }

    // Two groupBy passes: all bookings by source, and first-visit bookings by source.
    const [bySourceRows, newBySourceRows] = await Promise.all([
      prisma.booking.groupBy({
        by: ['source'],
        where,
        _count: { _all: true },
      }),
      prisma.booking.groupBy({
        by: ['source'],
        where: { ...where, isFirstVisit: true },
        _count: { _all: true },
      }),
    ]);

    const emptyCounts = (): Record<BookingSourceKey, number> => ({
      DIRECT: 0,
      DISCOVERY: 0,
      EMBED: 0,
      MARKETPLACE: 0,
    });

    const bySource = emptyCounts();
    let totalBookings = 0;
    for (const row of bySourceRows) {
      const key = (BOOKING_SOURCES as readonly string[]).includes(row.source)
        ? (row.source as BookingSourceKey)
        : 'DIRECT';
      bySource[key] += row._count._all;
      totalBookings += row._count._all;
    }

    const newClientsBySource = emptyCounts();
    let newClients = 0;
    for (const row of newBySourceRows) {
      const key = (BOOKING_SOURCES as readonly string[]).includes(row.source)
        ? (row.source as BookingSourceKey)
        : 'DIRECT';
      newClientsBySource[key] += row._count._all;
      newClients += row._count._all;
    }

    return {
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
      totalBookings,
      newClients,
      bySource,
      newClientsBySource,
    };
  }

  // -------------------------------------------------------------------------
  // Promoted listing creative (owner-managed draft; platform-curated to go live)
  // -------------------------------------------------------------------------

  private static toListing(p: {
    headline: string | null;
    offerText: string | null;
    imageUrl: string | null;
    logoUrl: string | null;
    accentColor: string | null;
    highlightServiceId: string | null;
    ctaLabel: string | null;
    status: string;
    startsAt: Date | null;
    endsAt: Date | null;
    impressions: number;
    clicks: number;
  }): PromotionListing {
    return {
      headline: p.headline,
      offerText: p.offerText,
      imageUrl: p.imageUrl,
      logoUrl: p.logoUrl,
      accentColor: p.accentColor || DEFAULT_ACCENT,
      highlightServiceId: p.highlightServiceId,
      ctaLabel: p.ctaLabel,
      status: (PROMOTION_STATUSES as readonly string[]).includes(p.status)
        ? (p.status as PromotionStatus)
        : 'DRAFT',
      startsAt: p.startsAt ? new Date(p.startsAt).toISOString() : null,
      endsAt: p.endsAt ? new Date(p.endsAt).toISOString() : null,
      impressions: p.impressions,
      clicks: p.clicks,
    };
  }

  // GET /promote/listing — the owner's promoted-listing creative (null if none).
  static async getListing(ownerId: string): Promise<PromotionListing | null> {
    const specialist = await PromoteService.getOwnerSpecialist(ownerId);
    const promotion = await prisma.promotion.findUnique({
      where: { specialistId: specialist.id },
    });
    return promotion ? PromoteService.toListing(promotion) : null;
  }

  // PUT /promote/listing — create/update the creative. Editing always keeps the
  // promotion out of ACTIVE: it lands in DRAFT, or PENDING_REVIEW when submitted.
  // Only the platform flips it to ACTIVE/PAUSED (see setStatus, admin-only).
  static async upsertListing(
    ownerId: string,
    input: UpsertListingInput,
  ): Promise<PromotionListing> {
    const specialist = await PromoteService.getOwnerSpecialist(ownerId);

    // Validate that the highlight service (if given) belongs to this specialist.
    let highlightServiceId: string | null | undefined = input.highlightServiceId;
    if (highlightServiceId) {
      const svc = await prisma.service.findFirst({
        where: { id: highlightServiceId, specialistId: specialist.id, isDeleted: false },
        select: { id: true },
      });
      if (!svc) {
        throw new PromoteServiceError('SERVICE_NOT_FOUND', 'Highlight service not found');
      }
    }

    const accent = input.accentColor && /^#[0-9a-fA-F]{6}$/.test(input.accentColor)
      ? input.accentColor
      : undefined;

    const clean = (v: string | null | undefined): string | null | undefined =>
      v === undefined ? undefined : (v && v.trim() ? v.trim() : null);

    const nextStatus = input.submit ? 'PENDING_REVIEW' : 'DRAFT';

    const data = {
      headline: clean(input.headline),
      offerText: clean(input.offerText),
      imageUrl: clean(input.imageUrl),
      logoUrl: clean(input.logoUrl),
      ...(accent ? { accentColor: accent } : {}),
      highlightServiceId: highlightServiceId === undefined ? undefined : (highlightServiceId || null),
      ctaLabel: clean(input.ctaLabel),
      status: nextStatus,
    };

    const promotion = await prisma.promotion.upsert({
      where: { specialistId: specialist.id },
      create: { specialistId: specialist.id, accentColor: accent || DEFAULT_ACCENT, ...data },
      update: data,
    });

    logger.info('Promote: listing upserted', {
      ownerId,
      specialistId: specialist.id,
      status: nextStatus,
    });

    return PromoteService.toListing(promotion);
  }

  // Called by TelegramStarsService after a successful boost payment.
  // Sets isFeatured=true + featuredUntil=now+days AND flips the Promotion row
  // to ACTIVE with the same expiry window. Both happen in one transaction.
  // If no Promotion row exists yet, only the featured fields are set (listing
  // stays unset — the specialist can add the creative later; it will go live
  // on the next paid boost that creates the row or after upsert).
  static async activatePaidBoost(ownerUserId: string, days: number): Promise<void> {
    const specialist = await PromoteService.getOwnerSpecialist(ownerUserId);
    const now = new Date();
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      // 1. Always set isFeatured on the specialist row.
      await tx.specialist.update({
        where: { id: specialist.id },
        data: { isFeatured: true, featuredUntil: endsAt, updatedAt: now },
      });

      // 2. Flip the Promotion row to ACTIVE if it exists; upsert if not.
      const existing = await tx.promotion.findUnique({
        where: { specialistId: specialist.id },
        select: { id: true },
      });

      if (existing) {
        await tx.promotion.update({
          where: { specialistId: specialist.id },
          data: { status: 'ACTIVE', startsAt: now, endsAt },
        });
      } else {
        // No listing creative yet — create a bare ACTIVE row so the showcase
        // slot is reserved. The specialist can fill in creative details later.
        logger.info('activatePaidBoost: no Promotion row found; creating bare ACTIVE row', {
          ownerUserId,
          specialistId: specialist.id,
        });
        await tx.promotion.create({
          data: {
            specialistId: specialist.id,
            status: 'ACTIVE',
            startsAt: now,
            endsAt,
            accentColor: '#5b6b3a',
          },
        });
      }
    });

    logger.info('activatePaidBoost: boost activated', {
      ownerUserId,
      specialistId: specialist.id,
      days,
      endsAt,
    });
  }

  // Called when a specialist manually disables their boost (POST /promote/featured
  // with enabled:false). Flips any ACTIVE Promotion row to PAUSED so it leaves
  // the discovery showcase immediately.
  static async deactivateListingOnBoostEnd(ownerId: string): Promise<void> {
    const specialist = await PromoteService.getOwnerSpecialist(ownerId);
    const existing = await prisma.promotion.findUnique({
      where: { specialistId: specialist.id },
      select: { id: true, status: true },
    });
    if (existing && existing.status === 'ACTIVE') {
      await prisma.promotion.update({
        where: { specialistId: specialist.id },
        data: { status: 'PAUSED' },
      });
      logger.info('deactivateListingOnBoostEnd: listing paused', {
        ownerId,
        specialistId: specialist.id,
      });
    }
  }

  // Admin/curation — set the live status of a promotion by specialist id.
  // Not wired to a public route; called from a curation tool/script by the platform.
  static async setStatus(specialistId: string, status: PromotionStatus): Promise<PromotionListing> {
    const promotion = await prisma.promotion.update({
      where: { specialistId },
      data: { status },
    });
    return PromoteService.toListing(promotion);
  }

  // GET /promoted/showcase — PUBLIC. Active promoted cards for marketplace slots.
  // Soft filters: prefer matches on city/category, but fall back to any active
  // promotion so a curated slot is never empty when one is available.
  static async showcase(opts: {
    city?: string;
    category?: string;
    limit?: number;
  }): Promise<ShowcaseItem[]> {
    const now = new Date();
    const limit = Math.min(Math.max(opts.limit ?? 3, 1), 10);

    const baseWhere = {
      status: 'ACTIVE',
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    };

    const include = {
      specialist: {
        select: {
          id: true,
          slug: true,
          businessName: true,
          city: true,
          rating: true,
          reviewCount: true,
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
    } as const;

    const fetchPromotions = async (cityFilter?: string) => {
      const where: Record<string, unknown> = { ...baseWhere };
      if (cityFilter) {
        where.specialist = { city: { equals: cityFilter, mode: 'insensitive' } };
      }
      return prisma.promotion.findMany({
        where,
        include,
        orderBy: { updatedAt: 'desc' },
        take: limit * 2, // over-fetch so category soft-filter still has candidates
      });
    };

    // Try city-filtered first; if nothing, fall back to any active.
    let promotions = await fetchPromotions(opts.city);
    if (promotions.length === 0) {
      promotions = await fetchPromotions(undefined);
    }
    if (promotions.length === 0) return [];

    // Resolve highlight services in one query.
    const serviceIds = promotions
      .map((p) => p.highlightServiceId)
      .filter((id): id is string => !!id);
    const services = serviceIds.length
      ? await prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true, basePrice: true, currency: true, duration: true, category: true },
        })
      : [];
    const serviceById = new Map(services.map((s) => [s.id, s]));

    const items: ShowcaseItem[] = promotions.map((p) => {
      const sp = p.specialist;
      const svc = p.highlightServiceId ? serviceById.get(p.highlightServiceId) : undefined;
      const displayName =
        sp.businessName?.trim() ||
        `${sp.user.firstName} ${sp.user.lastName}`.trim() ||
        'Specialist';
      return {
        promotionId: p.id,
        specialistId: sp.id,
        slug: sp.slug,
        displayName,
        avatarUrl: p.logoUrl || sp.user.avatar || null,
        city: sp.city,
        rating: sp.rating,
        reviewCount: sp.reviewCount,
        headline: p.headline,
        offerText: p.offerText,
        imageUrl: p.imageUrl,
        accentColor: p.accentColor || DEFAULT_ACCENT,
        ctaLabel: p.ctaLabel,
        service: svc
          ? {
              id: svc.id,
              name: svc.name,
              price: Number(svc.basePrice),
              currency: svc.currency,
              duration: svc.duration,
            }
          : null,
        _category: svc?.category ?? null,
      } as ShowcaseItem & { _category: string | null };
    });

    // Soft category preference: matches first, then the rest.
    let ordered = items as Array<ShowcaseItem & { _category?: string | null }>;
    if (opts.category) {
      const cat = opts.category.toLowerCase();
      ordered = [...items].sort((a, b) => {
        const am = (a as { _category?: string | null })._category?.toLowerCase() === cat ? 0 : 1;
        const bm = (b as { _category?: string | null })._category?.toLowerCase() === cat ? 0 : 1;
        return am - bm;
      });
    }

    return ordered.slice(0, limit).map((it) => {
      const clone = { ...it } as Record<string, unknown>;
      delete clone._category;
      return clone as unknown as ShowcaseItem;
    });
  }

  // POST /promoted/track — PUBLIC. Increment impression/click counters.
  static async track(promotionId: string, type: 'impression' | 'click'): Promise<void> {
    const field = type === 'click' ? 'clicks' : 'impressions';
    try {
      await prisma.promotion.update({
        where: { id: promotionId },
        data: { [field]: { increment: 1 } },
      });
    } catch {
      // Unknown id — ignore silently (tracking is best-effort).
    }
  }
}
