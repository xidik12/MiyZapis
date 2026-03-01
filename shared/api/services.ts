// ============================================================
// Services API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { Service, ServiceCategory, PaginatedResponse } from '../types';

export function createServicesApi(client: SharedApiClient) {
  return {
    async getServices(params?: {
      page?: number;
      limit?: number;
      category?: string;
      search?: string;
      query?: string;
      sort?: string;
      city?: string;
    }) {
      // Normalize search -> query for backend compatibility
      const apiParams: any = { ...params };
      if (apiParams.search && !apiParams.query) {
        apiParams.query = apiParams.search;
        delete apiParams.search;
      }
      return client.get<PaginatedResponse<Service>>('/services', { params: apiParams });
    },

    async getService(id: string) {
      return client.get<Service>(`/services/${id}`);
    },

    async getServiceCategories() {
      return client.get<ServiceCategory[]>('/services/categories');
    },

    async searchServices(query: string, filters?: any) {
      return client.get<PaginatedResponse<Service>>('/services/search', {
        params: { query, ...filters },
      });
    },

    // Specialist service management
    async getMyServices() {
      return client.get<Service[]>('/specialists/services');
    },

    async createService(data: {
      name: string;
      description: string;
      categoryId: string;
      duration: number;
      price: number;
      currency?: string;
    }) {
      return client.post<Service>('/specialists/services', data);
    },

    async updateService(id: string, data: any) {
      return client.put<Service>(`/specialists/services/${id}`, data);
    },

    async deleteService(id: string) {
      return client.delete(`/specialists/services/${id}`);
    },
  };
}

export type ServicesApi = ReturnType<typeof createServicesApi>;
