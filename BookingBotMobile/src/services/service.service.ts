// Service service - adapted for React Native
import { apiClient } from './api';
import {
  Service,
  ServiceCategory,
  SearchFilters,
  SearchResult,
  Pagination,
} from '../types';

export class ServiceService {
  // Search for services
  async searchServices(filters: SearchFilters = {}): Promise<SearchResult> {
    const params = new URLSearchParams();
    
    if (filters.query) params.append('search', filters.query);
    if (filters.category) params.append('category', filters.category);
    if (filters.location) params.append('location', filters.location);
    if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.rating) params.append('rating', filters.rating.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await apiClient.get<{
      services: Service[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/services?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search services');
    }
    
    return {
      services: response.data.services || [],
      specialists: [],
      pagination: {
        currentPage: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        itemsPerPage: 20,
        hasNext: (response.data.page || 1) < (response.data.totalPages || 1),
        hasPrev: (response.data.page || 1) > 1,
        limit: 20,
      },
      filters: {
        categories: [],
        priceRanges: [],
        specialties: [],
        locations: [],
      }
    };
  }

  // Get service categories
  async getCategories(): Promise<ServiceCategory[]> {
    const response = await apiClient.get<{categories: ServiceCategory[]}>('/services/categories');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get service categories');
    }
    return response.data.categories || [];
  }

  // Get specific service details
  async getService(serviceId: string): Promise<Service> {
    const response = await apiClient.get<{service: Service}>(`/services/${serviceId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get service details');
    }
    return response.data.service || response.data;
  }

  // Get featured/popular services
  async getFeaturedServices(limit: number = 10): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>(`/services/featured?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get featured services');
    }
    return response.data.services || [];
  }

  // Get services by category
  async getServicesByCategory(categoryId: string, page: number = 1, limit: number = 20): Promise<{
    services: Service[];
    pagination: Pagination;
  }> {
    const params = new URLSearchParams({
      category: categoryId,
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get<{
      services: Service[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/services?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get services by category');
    }
    
    return {
      services: response.data.services || [],
      pagination: {
        currentPage: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        itemsPerPage: limit,
        hasNext: (response.data.page || 1) < (response.data.totalPages || 1),
        hasPrev: (response.data.page || 1) > 1,
        limit,
      }
    };
  }

  // Create service (for specialists)
  async createService(data: Partial<Service>): Promise<Service> {
    const response = await apiClient.post<Service>('/services', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create service');
    }
    return response.data;
  }

  // Update service (for specialists)
  async updateService(serviceId: string, data: Partial<Service>): Promise<Service> {
    const response = await apiClient.put<Service>(`/services/${serviceId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update service');
    }
    return response.data;
  }

  // Delete service (for specialists)
  async deleteService(serviceId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/services/${serviceId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete service');
    }
    return response.data;
  }

  // Get specialist's services
  async getSpecialistServices(specialistId: string): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>(`/services?specialistId=${specialistId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist services');
    }
    return response.data.services || [];
  }
}

export const serviceService = new ServiceService();

