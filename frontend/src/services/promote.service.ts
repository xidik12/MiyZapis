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
}

export const promoteService = new PromoteService();
