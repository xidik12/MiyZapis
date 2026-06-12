import { apiClient } from './api';

// ---------------------------------------------------------------------------
// Marketing automation client: win-back, rebooking nudges, birthday.
// ---------------------------------------------------------------------------

export const MARKETING_TYPES = ['WINBACK', 'REBOOKING', 'BIRTHDAY'] as const;
export type MarketingType = (typeof MARKETING_TYPES)[number];

export const MARKETING_CHANNELS = ['TELEGRAM', 'EMAIL', 'BOTH'] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export interface MarketingAutomation {
  id: string;
  ownerId: string;
  businessId?: string | null;
  type: MarketingType;
  isEnabled: boolean;
  lapsedDays: number;
  rebookDays: number;
  channel: MarketingChannel;
  messageTemplate?: string | null;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketingConfig {
  automations: MarketingAutomation[];
  birthdaySupported: boolean;
}

export interface MarketingStats {
  last30Days: Record<MarketingType, number>;
  last90Days: Record<MarketingType, number>;
}

export interface MarketingConfigPatch {
  isEnabled?: boolean;
  lapsedDays?: number;
  rebookDays?: number;
  channel?: MarketingChannel;
  messageTemplate?: string | null;
}

export interface MarketingRunSummary {
  ownerId: string;
  byType: Record<string, { eligible: number; sent: number; skipped: number }>;
  totalSent: number;
}

export class MarketingService {
  async getConfig(): Promise<MarketingConfig> {
    const response = await apiClient.get<MarketingConfig>('/marketing/config');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load marketing config');
    }
    return response.data;
  }

  async setConfig(type: MarketingType, patch: MarketingConfigPatch): Promise<MarketingAutomation> {
    const response = await apiClient.put<{ automation: MarketingAutomation }>(
      `/marketing/config/${type}`,
      patch
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to save marketing config');
    }
    return response.data.automation;
  }

  async getStats(): Promise<MarketingStats> {
    const response = await apiClient.get<MarketingStats>('/marketing/stats');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load marketing stats');
    }
    return response.data;
  }

  async runNow(): Promise<MarketingRunSummary> {
    const response = await apiClient.post<MarketingRunSummary>('/marketing/run', {});
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to run automations');
    }
    return response.data;
  }
}

export const marketingService = new MarketingService();
