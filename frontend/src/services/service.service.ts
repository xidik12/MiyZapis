import { apiClient } from './api';
import {
  Service,
  ServiceCategory,
  SearchFilters,
  SearchResult,
  Specialist,
  Pagination,
  ApiResponse
} from '@/types';

export class ServiceService {
  // Search for services and specialists
  async searchServices(filters: SearchFilters = {}): Promise<SearchResult> {
    const params = new URLSearchParams();
    
    // Map frontend filters to backend parameters
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
    
    // Transform backend response to match frontend SearchResult interface
    return {
      services: response.data.services || [],
      specialists: [], // Not needed for service-focused search
      pagination: {
        currentPage: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        itemsPerPage: 20,
        hasNext: (response.data.page || 1) < (response.data.totalPages || 1),
        hasPrev: (response.data.page || 1) > 1
      },
      filters: {
        categories: [],
        priceRanges: [],
        specialties: []
      }
    };
  }

  // Get service categories
  async getCategories(): Promise<ServiceCategory[]> {
    const response = await apiClient.get<ServiceCategory[]>('/services/categories');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get service categories');
    }
    return response.data;
  }

  // Get specific service details
  async getService(serviceId: string): Promise<Service> {
    console.log('📡 API: Getting service by ID:', serviceId);
    
    if (!serviceId) {
      throw new Error('Service ID is required');
    }
    
    const response = await apiClient.get<Service>(`/services/${serviceId}`);
    console.log('📦 API: Service response:', response);
    
    if (!response.success || !response.data) {
      console.error('❌ API: Failed to get service:', response.error);
      throw new Error(response.error?.message || 'Failed to get service details');
    }
    
    console.log('✅ API: Service retrieved:', response.data);
    return response.data;
  }

  // Get featured/popular services
  async getFeaturedServices(limit: number = 10): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>(`/services/featured?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get featured services');
    }
    return response.data.services;
  }

  // Get services by category
  async getServicesByCategory(categoryId: string, page: number = 1, limit: number = 20): Promise<{
    services: Service[];
    pagination: Pagination;
  }> {
    const response = await apiClient.get<{ services: Service[]; pagination: Pagination }>(`/services/category/${categoryId}?page=${page}&limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get services by category');
    }
    return response.data;
  }

  // Get similar services
  async getSimilarServices(serviceId: string, limit: number = 5): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>(`/services/${serviceId}/similar?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get similar services');
    }
    return response.data.services;
  }

  // Get services by location
  async getServicesByLocation(
    latitude: number,
    longitude: number,
    radius: number = 50,
    page: number = 1,
    limit: number = 20
  ): Promise<{ services: Service[]; pagination: Pagination }> {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      radius: radius.toString(),
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await apiClient.get<{ services: Service[]; pagination: Pagination }>(`/services/location?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get services by location');
    }
    return response.data;
  }

  // Get trending services
  async getTrendingServices(period: 'day' | 'week' | 'month' = 'week', limit: number = 10): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>(`/services/trending?period=${period}&limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get trending services');
    }
    return response.data.services;
  }

  // Search suggestions/autocomplete
  async getSearchSuggestions(query: string, limit: number = 10): Promise<{
    services: Array<{ id: string; name: string; category: string }>;
    specialists: Array<{ id: string; businessName: string; specialties: string[] }>;
    categories: Array<{ id: string; name: string }>;
  }> {
    const response = await apiClient.get(`/services/suggestions?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get search suggestions');
    }
    return response.data;
  }

  // Get service pricing range for a category
  async getPricingRange(categoryId?: string): Promise<{ min: number; max: number; average: number; currency: string }> {
    const url = categoryId ? `/services/pricing-range?category=${categoryId}` : '/services/pricing-range';
    const response = await apiClient.get(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get pricing range');
    }
    return response.data;
  }

  // Get available specialties
  async getSpecialties(categoryId?: string): Promise<string[]> {
    const url = categoryId ? `/services/specialties?category=${categoryId}` : '/services/specialties';
    const response = await apiClient.get<{ specialties: string[] }>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialties');
    }
    return response.data.specialties;
  }

  // Get service availability for next few days
  async getServiceAvailability(serviceId: string, days: number = 7): Promise<Array<{
    date: string;
    available: boolean;
    earliestSlot?: string;
    totalSlots: number;
    availableSlots: number;
  }>> {
    const response = await apiClient.get(`/services/${serviceId}/availability?days=${days}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get service availability');
    }
    return response.data.availability;
  }

  // Report service issue
  async reportService(serviceId: string, reason: string, details: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/services/${serviceId}/report`, {
      reason,
      details
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to report service');
    }
    return response.data;
  }

  // Add service to favorites (for customers)
  async addToFavorites(serviceId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/services/${serviceId}/favorite`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add to favorites');
    }
    return response.data;
  }

  // Remove service from favorites
  async removeFromFavorites(serviceId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/services/${serviceId}/favorite`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove from favorites');
    }
    return response.data;
  }

  // Get user's favorite services
  async getFavoriteServices(page: number = 1, limit: number = 20): Promise<{
    services: Service[];
    pagination: Pagination;
  }> {
    const response = await apiClient.get<{ services: Service[]; pagination: Pagination }>(`/services/favorites?page=${page}&limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get favorite services');
    }
    return response.data;
  }

  // Get recently viewed services
  async getRecentlyViewed(limit: number = 10): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>(`/services/recently-viewed?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get recently viewed services');
    }
    return response.data.services;
  }

  // Track service view
  async trackServiceView(serviceId: string): Promise<void> {
    try {
      await apiClient.post(`/services/${serviceId}/view`);
    } catch (error) {
      // Don't throw error for tracking failures
      console.warn('Failed to track service view:', error);
    }
  }

  // Get recommended services for user
  async getRecommendedServices(limit: number = 10): Promise<Service[]> {
    const response = await apiClient.get<{ services: Service[] }>(`/services/recommended?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get recommended services');
    }
    return response.data.services;
  }

  // Get service comparison data
  async compareServices(serviceIds: string[]): Promise<{
    services: Array<Service & {
      pros: string[];
      cons: string[];
      uniqueFeatures: string[];
    }>;
  }> {
    const response = await apiClient.post('/services/compare', { serviceIds });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to compare services');
    }
    return response.data;
  }
}

export const serviceService = new ServiceService();