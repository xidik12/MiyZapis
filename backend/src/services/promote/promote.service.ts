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
}
