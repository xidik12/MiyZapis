// ============================================================
// Specialists API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { Specialist, PaginatedResponse } from '../types';

export function createSpecialistsApi(client: SharedApiClient) {
  return {
    async getSpecialists(params?: {
      page?: number;
      limit?: number;
      service?: string;
      location?: string;
      rating?: number;
    }) {
      return client.get<PaginatedResponse<Specialist>>('/specialists', { params });
    },

    async getSpecialist(id: string) {
      return client.get<Specialist>(`/specialists/${id}`);
    },

    async getSpecialistServices(id: string) {
      return client.get(`/specialists/${id}/services`);
    },

    async getSpecialistAvailability(id: string, date: string) {
      return client.get<{ availableSlots: string[] }>(`/specialists/${id}/slots`, {
        params: { date },
      });
    },

    async getSpecialistProfile() {
      return client.get<Specialist>('/specialists/profile');
    },

    async updateSpecialistProfile(data: any) {
      return client.put('/specialists/profile', data);
    },

    async getSpecialistAnalytics(params?: { period?: string }) {
      return client.get('/specialists/analytics', { params });
    },

    // Availability blocks
    async getAvailabilityBlocks(params?: { startDate?: string; endDate?: string }) {
      return client.get('/specialists/blocks', { params });
    },

    async createAvailabilityBlock(data: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isRecurring?: boolean;
    }) {
      return client.post('/specialists/blocks', data);
    },

    async updateAvailabilityBlock(id: string, data: any) {
      return client.put(`/specialists/blocks/${id}`, data);
    },

    async deleteAvailabilityBlock(id: string) {
      return client.delete(`/specialists/blocks/${id}`);
    },

    async generateAvailability(data: { startDate: string; endDate: string }) {
      return client.post('/specialists/availability/generate', data);
    },
  };
}

export type SpecialistsApi = ReturnType<typeof createSpecialistsApi>;
