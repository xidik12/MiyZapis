// ============================================================
// Loyalty API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { PaginatedResponse } from '../types';

export function createLoyaltyApi(client: SharedApiClient) {
  return {
    async getStatus() {
      return client.get('/loyalty/stats');
    },

    async getProfile() {
      return client.get('/loyalty/profile');
    },

    async getTiers() {
      return client.get('/loyalty/tiers');
    },

    async getBadges() {
      return client.get('/loyalty/badges');
    },

    async getConfig() {
      return client.get('/loyalty/config');
    },

    async getHistory(params?: { page?: number; limit?: number }) {
      return client.get<PaginatedResponse<any>>('/loyalty/transactions', { params });
    },

    async getRewards() {
      return client.get('/loyalty/discounts');
    },

    async redeemReward(rewardId: string) {
      return client.post('/loyalty/redeem', { rewardId });
    },
  };
}

export type LoyaltyApi = ReturnType<typeof createLoyaltyApi>;
