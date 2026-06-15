import { apiClient } from './api';

// ---------------------------------------------------------------------------
// Marketplace acquisition — Promote client.
// Featured/boosted placement toggle + acquisition reporting (bookings by
// source + new clients acquired via discovery/embed).
// ---------------------------------------------------------------------------

export const BOOKING_SOURCES = ['DIRECT', 'DISCOVERY', 'EMBED', 'MARKETPLACE'] as const;
export type BookingSourceKey = (typeof BOOKING_SOURCES)[number];

export interface FeaturedStatus {
  isFeatured: boolean; // boost switched on
  isActive: boolean; // boost on AND not expired
  featuredUntil: string | null; // ISO string or null
}

export interface AcquisitionStats {
  from: string | null;
  to: string | null;
  totalBookings: number;
  newClients: number;
  bySource: Record<BookingSourceKey, number>;
  newClientsBySource: Record<BookingSourceKey, number>;
}

// --- Promoted listing creative ---------------------------------------------

export type PromotionStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'PAUSED';

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
  submit?: boolean;
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

export class PromoteService {
  async getStatus(): Promise<FeaturedStatus> {
    const response = await apiClient.get<{ status: FeaturedStatus }>('/promote/status');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load promote status');
    }
    return response.data.status;
  }

  // Self-serve toggle today; becomes a paid boost once live billing lands.
  async setFeatured(enabled: boolean, days?: number): Promise<FeaturedStatus> {
    const response = await apiClient.post<{ status: FeaturedStatus }>('/promote/featured', {
      enabled,
      ...(days != null ? { days } : {}),
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update featured status');
    }
    return response.data.status;
  }

  async getStats(from?: string, to?: string): Promise<AcquisitionStats> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const qs = params.toString();
    const response = await apiClient.get<{ stats: AcquisitionStats }>(
      `/promote/stats${qs ? `?${qs}` : ''}`,
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load acquisition stats');
    }
    return response.data.stats;
  }

  // --- Promoted listing creative (owner-managed) ---------------------------

  async getListing(): Promise<PromotionListing | null> {
    const response = await apiClient.get<{ listing: PromotionListing | null }>('/promote/listing');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load promoted listing');
    }
    return response.data.listing;
  }

  async saveListing(input: UpsertListingInput): Promise<PromotionListing> {
    const response = await apiClient.put<{ listing: PromotionListing }>('/promote/listing', input);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to save promoted listing');
    }
    return response.data.listing;
  }

  // --- Public showcase + tracking (marketplace ad slots) -------------------

  async showcase(opts: { city?: string; category?: string; limit?: number } = {}): Promise<ShowcaseItem[]> {
    const params = new URLSearchParams();
    if (opts.city) params.append('city', opts.city);
    if (opts.category) params.append('category', opts.category);
    if (opts.limit != null) params.append('limit', String(opts.limit));
    const qs = params.toString();
    try {
      const response = await apiClient.get<{ items: ShowcaseItem[] }>(
        `/promoted/showcase${qs ? `?${qs}` : ''}`,
      );
      return response.success && response.data ? response.data.items : [];
    } catch {
      return []; // an ad slot must never break the page
    }
  }

  // Best-effort; failures are swallowed.
  track(promotionId: string, type: 'impression' | 'click'): void {
    void apiClient.post('/promoted/track', { promotionId, type }).catch(() => undefined);
  }
}

export const promoteService = new PromoteService();
