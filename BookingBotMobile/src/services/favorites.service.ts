// Favorites service - adapted for React Native
import { apiClient } from './api';
import { Service, Specialist } from '../types';

export class FavoritesService {
  // Get user favorites
  async getFavorites(): Promise<{
    services: Service[];
    specialists: Specialist[];
  }> {
    const response = await apiClient.get<{
      services: Service[];
      specialists: Specialist[];
    }>('/favorites');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get favorites');
    }
    return response.data;
  }

  // Add service to favorites
  async addService(serviceId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/favorites/services', { serviceId });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add service to favorites');
    }
    return response.data;
  }

  // Remove service from favorites
  async removeService(serviceId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/favorites/services/${serviceId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove service from favorites');
    }
    return response.data;
  }

  // Add specialist to favorites
  async addSpecialist(specialistId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/favorites/specialists', { specialistId });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add specialist to favorites');
    }
    return response.data;
  }

  // Remove specialist from favorites
  async removeSpecialist(specialistId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/favorites/specialists/${specialistId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove specialist from favorites');
    }
    return response.data;
  }

  // Check if service is favorited
  async isServiceFavorited(serviceId: string): Promise<boolean> {
    const response = await apiClient.get<{ isFavorited: boolean }>(`/favorites/services/${serviceId}/check`);
    if (!response.success || !response.data) {
      return false;
    }
    return response.data.isFavorited || false;
  }

  // Check if specialist is favorited
  async isSpecialistFavorited(specialistId: string): Promise<boolean> {
    const response = await apiClient.get<{ isFavorited: boolean }>(`/favorites/specialists/${specialistId}/check`);
    if (!response.success || !response.data) {
      return false;
    }
    return response.data.isFavorited || false;
  }
}

export const favoritesService = new FavoritesService();

