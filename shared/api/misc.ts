// ============================================================
// Miscellaneous API Endpoints — Favorites, Referrals, Help, Locations, Expenses
// ============================================================

import type { SharedApiClient } from './client';
import type { PaginatedResponse } from '../types';

export function createFavoritesApi(client: SharedApiClient) {
  return {
    async getAll(params?: { page?: number; limit?: number; type?: 'specialist' | 'service' }) {
      return client.get<PaginatedResponse<any>>('/favorites/all', { params });
    },

    async add(data: { targetId: string; type: 'specialist' | 'service' }) {
      return client.post(`/favorites/${data.type}s/${data.targetId}`);
    },

    async remove(id: string, type: 'specialist' | 'service' = 'specialist') {
      return client.delete(`/favorites/${type}s/${id}`);
    },
  };
}

export function createReferralApi(client: SharedApiClient) {
  return {
    async getConfig() {
      return client.get('/referral/config');
    },

    async create(data?: any) {
      return client.post('/referral/create', data ?? {
        referralType: 'CUSTOMER_TO_CUSTOMER',
        targetUserType: 'CUSTOMER',
        inviteChannel: 'LINK',
      });
    },

    async getMyReferrals(params?: { page?: number; limit?: number }) {
      return client.get('/referral/my-referrals', { params });
    },

    async getAnalytics() {
      return client.get('/referral/analytics');
    },
  };
}

export function createHelpApi(client: SharedApiClient) {
  return {
    async getFAQs(params?: { category?: string; language?: string }) {
      return client.get('/help/faqs', { params });
    },

    async getFAQCategories(params?: { language?: string }) {
      return client.get('/help/faq-categories', { params });
    },

    async searchFAQs(query: string) {
      return client.get('/help/search', { params: { query } });
    },

    async submitFeedback(data: { subject: string; message: string; category?: string; email?: string }) {
      return client.post('/help/feedback', data);
    },

    async getContactMethods() {
      return client.get('/help/contact-methods');
    },
  };
}

export function createLocationsApi(client: SharedApiClient) {
  return {
    async getCities(params?: { search?: string }) {
      return client.get('/locations/cities', { params });
    },
  };
}

export function createExpensesApi(client: SharedApiClient) {
  return {
    async getExpenses(params?: {
      category?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: string;
    }) {
      return client.get('/expenses', { params });
    },

    async getSummary(params?: { startDate?: string; endDate?: string }) {
      return client.get('/expenses/summary', { params });
    },

    async create(data: {
      category: string;
      amount: number;
      description?: string;
      date?: string;
      recurring?: boolean;
      frequency?: string;
      notes?: string;
    }) {
      return client.post('/expenses', data);
    },

    async update(id: string, data: any) {
      return client.put(`/expenses/${id}`, data);
    },

    async deleteExpense(id: string) {
      return client.delete(`/expenses/${id}`);
    },
  };
}

export type FavoritesApi = ReturnType<typeof createFavoritesApi>;
export type ReferralApi = ReturnType<typeof createReferralApi>;
export type HelpApi = ReturnType<typeof createHelpApi>;
export type LocationsApi = ReturnType<typeof createLocationsApi>;
export type ExpensesApi = ReturnType<typeof createExpensesApi>;
