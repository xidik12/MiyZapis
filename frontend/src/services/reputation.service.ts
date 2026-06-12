import { apiClient } from './api';

export interface ReputationSettings {
  googleReviewUrl: string | null;
  facebookReviewUrl: string | null;
  autoRequestEnabled: boolean;
}

export interface ReputationSettingsInput {
  googleReviewUrl?: string | null;
  facebookReviewUrl?: string | null;
}

const DEFAULT_SETTINGS: ReputationSettings = {
  googleReviewUrl: null,
  facebookReviewUrl: null,
  autoRequestEnabled: true,
};

export const reputationService = {
  // Fetch the specialist's review URLs + auto-request state.
  async getSettings(): Promise<ReputationSettings> {
    const response = await apiClient.get<ReputationSettings>('/reputation');
    return response.data ?? DEFAULT_SETTINGS;
  },

  // Persist the specialist's Google / Facebook review URLs.
  async setSettings(input: ReputationSettingsInput): Promise<ReputationSettings> {
    const response = await apiClient.put<ReputationSettings>('/reputation', input);
    return response.data ?? DEFAULT_SETTINGS;
  },
};
