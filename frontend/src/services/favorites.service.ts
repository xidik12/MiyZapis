import { apiClient } from './api';
import { Pagination } from '@/types';

export interface FavoriteSpecialist {
  id: string;
  userId: string;
  specialistId: string;
  createdAt: string;
  specialist: {
    id: string;
    userId: string;
    businessName: string | null;
    description: string | null;
    specialties: string[];
    experience: number | null;
    rating: number | null;
    reviewCount: number;
    isVerified: boolean;
    location: any;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
}

export interface FavoriteService {
  id: string;
  userId: string;
  serviceId: string;
  createdAt: string;
  service: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration: number;
    category: string;
    isActive: boolean;
    specialist: {
      id: string;
      businessName: string | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  };
}

export interface FavoritesCount {
  specialists: number;
  services: number;
}

export class FavoritesService {
  // Add specialist to favorites
  async addSpecialistToFavorites(specialistId: string): Promise<{ message: string; favorite: FavoriteSpecialist }> {
    const response = await apiClient.post<{ message: string; favorite: FavoriteSpecialist }>(
      `/favorites/specialists/${specialistId}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add specialist to favorites');
    }
    
    return response.data;
  }

  // Add service to favorites
  async addServiceToFavorites(serviceId: string): Promise<{ message: string; favorite: FavoriteService }> {
    const response = await apiClient.post<{ message: string; favorite: FavoriteService }>(
      `/favorites/services/${serviceId}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add service to favorites');
    }
    
    return response.data;
  }

  // Remove specialist from favorites
  async removeSpecialistFromFavorites(specialistId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/favorites/specialists/${specialistId}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove specialist from favorites');
    }
    
    return response.data;
  }

  // Remove service from favorites
  async removeServiceFromFavorites(serviceId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/favorites/services/${serviceId}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove service from favorites');
    }
    
    return response.data;
  }

  // Get user's favorite specialists
  async getFavoriteSpecialists(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    specialists: FavoriteSpecialist[];
    pagination: Pagination;
  }> {
    const response = await apiClient.get<{
      specialists: FavoriteSpecialist[];
      pagination: Pagination;
    }>(`/favorites/specialists?page=${page}&limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get favorite specialists');
    }
    
    return response.data;
  }

  // Get user's favorite services
  async getFavoriteServices(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    services: FavoriteService[];
    pagination: Pagination;
  }> {
    const response = await apiClient.get<{
      services: FavoriteService[];
      pagination: Pagination;
    }>(`/favorites/services?page=${page}&limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get favorite services');
    }
    
    return response.data;
  }

  // Get all user's favorites
  async getAllFavorites(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    specialists: FavoriteSpecialist[];
    services: FavoriteService[];
    pagination: {
      specialists: Pagination;
      services: Pagination;
    };
  }> {
    const response = await apiClient.get<{
      specialists: FavoriteSpecialist[];
      services: FavoriteService[];
      pagination: {
        specialists: Pagination;
        services: Pagination;
      };
    }>(`/favorites/all?page=${page}&limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get all favorites');
    }
    
    return response.data;
  }

  // Check if specialist is in favorites
  async checkSpecialistInFavorites(specialistId: string): Promise<{ isInFavorites: boolean }> {
    const response = await apiClient.get<{ isInFavorites: boolean }>(
      `/favorites/specialists/${specialistId}/check`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check specialist favorite status');
    }
    
    return response.data;
  }

  // Check if service is in favorites
  async checkServiceInFavorites(serviceId: string): Promise<{ isInFavorites: boolean }> {
    const response = await apiClient.get<{ isInFavorites: boolean }>(
      `/favorites/services/${serviceId}/check`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check service favorite status');
    }
    
    return response.data;
  }

  // Get favorites count
  async getFavoritesCount(): Promise<FavoritesCount> {
    const response = await apiClient.get<FavoritesCount>('/favorites/count');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get favorites count');
    }
    
    return response.data;
  }

  // Clear all favorites
  async clearAllFavorites(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/favorites/all');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to clear favorites');
    }
    
    return response.data;
  }
}

export const favoritesService = new FavoritesService();