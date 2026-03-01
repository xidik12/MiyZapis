// ============================================================
// Payments API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { PaginatedResponse } from '../types';

export function createPaymentsApi(client: SharedApiClient) {
  return {
    async createPaymentIntent(bookingId: string) {
      return client.post('/payments/intent', { bookingId });
    },

    async confirmPayment(paymentIntentId: string) {
      return client.post('/payments/confirm', { paymentIntentId });
    },

    async getPaymentMethods() {
      return client.get('/payments/methods/my');
    },

    async addPaymentMethod(data: { type: string; token?: string }) {
      return client.post('/payments/methods', data);
    },

    async deletePaymentMethod(id: string) {
      return client.delete(`/payments/methods/${id}`);
    },

    async setDefaultPaymentMethod(id: string) {
      return client.put(`/payments/methods/${id}/default`);
    },

    async getPaymentHistory(params?: { page?: number; limit?: number }) {
      return client.get('/payments/history', { params });
    },

    // Wallet
    async getWalletBalance() {
      return client.get('/payments/wallet/balance');
    },

    async getWalletTransactions(params?: { page?: number; limit?: number; type?: string }) {
      return client.get<PaginatedResponse<any>>('/payments/wallet/transactions', { params });
    },

    async requestPayout(data: { amount: number; method?: string }) {
      return client.post('/payments/wallet/payout', data);
    },

    // Earnings (specialist)
    async getEarnings(params?: { period?: string }) {
      return client.get('/payments/earnings/my', { params });
    },

    async getEarningsOverview() {
      return client.get('/payments/earnings/overview');
    },

    async getEarningsTrends(params?: { months?: number }) {
      return client.get('/payments/earnings/trends', { params });
    },

    async getEarningsAnalytics() {
      return client.get('/payments/earnings/analytics');
    },

    async getRevenueData(params?: { months?: number }) {
      return client.get('/payments/earnings/revenue', { params });
    },
  };
}

export type PaymentsApi = ReturnType<typeof createPaymentsApi>;
