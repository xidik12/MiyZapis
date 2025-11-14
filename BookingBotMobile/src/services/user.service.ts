// User service - adapted for React Native
import { apiClient } from './api';
import { User, UserPreferences } from '../types';

export class UserService {
  // Get user profile
  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get user profile');
    }
    return response.data.user || response.data;
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>('/users/profile', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update profile');
    }
    return response.data;
  }

  // Get user preferences
  async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<UserPreferences>('/users/preferences');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get preferences');
    }
    return response.data;
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await apiClient.put<UserPreferences>('/users/preferences', preferences);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update preferences');
    }
    return response.data;
  }

  // Delete account
  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/users', {
      data: { password }
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete account');
    }
    return response.data;
  }
}

export const userService = new UserService();

