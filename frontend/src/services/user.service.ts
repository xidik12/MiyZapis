import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/environment';
import { User, ApiResponse } from '../types';

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  bio?: string;
  location?: {
    address: string;
    city: string;
    region: string;
    country: string;
  };
}

export interface UserPreferences {
  language: 'uk' | 'en' | 'ru';
  currency: 'USD' | 'KHR' | 'UAH' | 'EUR';
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    telegram: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

export class UserService {
  // Get current user profile
  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.USERS.PROFILE);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get user profile');
      }
      return response.data.user;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get user profile';
      throw new Error(errorMessage);
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    try {
      const response = await apiClient.put<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update profile');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to update profile';
      throw new Error(errorMessage);
    }
  }

  // Upload avatar
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('files', file); // Note: files field name for multer array upload
      
      const response = await apiClient.post<any>('/files/upload?purpose=avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.success || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(response.error?.message || 'Failed to upload avatar');
      }

      // Return the URL of the first uploaded file
      const uploadedFile = response.data[0];
      return { avatarUrl: uploadedFile.url || uploadedFile.path };
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to upload avatar';
      throw new Error(errorMessage);
    }
  }

  // Save external image (e.g., Google avatar) to backend storage
  async saveExternalImage(imageUrl: string, purpose: 'avatar' | 'portfolio' = 'avatar'): Promise<{ avatarUrl: string }> {
    try {
      console.log('💾 Saving external image to backend:', imageUrl);
      
      const response = await apiClient.post<any>('/files/save-external', {
        imageUrl,
        purpose
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to save external image');
      }

      console.log('✅ External image saved to backend:', response.data.url);
      return { avatarUrl: response.data.url };
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to save external image';
      throw new Error(errorMessage);
    }
  }

  // Get user preferences
  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await apiClient.get<UserPreferences>(API_ENDPOINTS.USERS.PREFERENCES);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get user preferences');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get user preferences';
      throw new Error(errorMessage);
    }
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const response = await apiClient.put<UserPreferences>(API_ENDPOINTS.USERS.PREFERENCES, preferences);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to update preferences');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to update preferences';
      throw new Error(errorMessage);
    }
  }

  // Delete user account
  async deleteAccount(): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(API_ENDPOINTS.USERS.DELETE_ACCOUNT);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to delete account');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to delete account';
      throw new Error(errorMessage);
    }
  }

  // Get user statistics (for dashboard)
  async getUserStats(): Promise<{
    totalBookings: number;
    completedBookings: number;
    totalSpent: number;
    loyaltyPoints: number;
    averageRating: number;
  }> {
    try {
      const response = await apiClient.get<any>(`${API_ENDPOINTS.USERS.PROFILE}/stats`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get user statistics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get user statistics';
      throw new Error(errorMessage);
    }
  }
}

export const userService = new UserService();
