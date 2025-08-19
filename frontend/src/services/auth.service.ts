import { apiClient } from './api';
import { API_ENDPOINTS, environment } from '../config/environment';
import {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  TelegramAuthRequest,
  ApiResponse
} from '../types';

// Helper functions for backend integration

export class AuthService {
  // Register new user
  async register(data: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    // Convert userType to backend format
    const requestData = {
      ...data,
      userType: data.userType === 'customer' ? 'CUSTOMER' : 'SPECIALIST',
    };

    try {
      const response = await apiClient.post<{ user: User; tokens: AuthTokens }>(API_ENDPOINTS.AUTH.REGISTER, requestData);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Registration failed');
      }
      
      // Transform backend user format to frontend format
      const userData = response.data;
      if (userData.user) {
        userData.user = this.transformUserFromBackend(userData.user);
      }
      
      return userData;
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  // Login user
  async login(data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiClient.post<{ user: User; tokens: AuthTokens }>(API_ENDPOINTS.AUTH.LOGIN, data);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }
      
      // Transform backend user format to frontend format
      const userData = response.data;
      if (userData.user) {
        userData.user = this.transformUserFromBackend(userData.user);
      }
      
      return userData;
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }

  // Google authentication
  async googleAuth(credential: string): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const response = await apiClient.post<{ user: User; tokens: AuthTokens }>('/auth-enhanced/google', { credential });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Google authentication failed');
      }
      
      // Transform backend user format to frontend format
      const userData = response.data;
      if (userData.user) {
        userData.user = this.transformUserFromBackend(userData.user);
      }
      
      return userData;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Google authentication failed';
      throw new Error(errorMessage);
    }
  }

  // Telegram authentication
  async telegramAuth(data: TelegramAuthRequest): Promise<{ user: User; tokens: AuthTokens; isNewUser: boolean }> {
    try {
      const response = await apiClient.post<{ user: User; tokens: AuthTokens; isNewUser: boolean }>('/auth-enhanced/telegram', data);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Telegram authentication failed');
      }
      
      // Transform backend user format to frontend format
      const userData = response.data;
      if (userData.user) {
        userData.user = this.transformUserFromBackend(userData.user);
      }
      
      return userData;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Telegram authentication failed';
      throw new Error(errorMessage);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await apiClient.post<{ accessToken: string; expiresIn: number }>(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Token refresh failed');
    }
    return response.data;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Even if logout fails on server, we should clear local tokens
      console.warn('Logout request failed:', error);
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Forgot password request failed');
    }
    return response.data;
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      newPassword
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Password reset failed');
    }
    return response.data;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', {
      currentPassword,
      newPassword
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Password change failed');
    }
    return response.data;
  }

  // Verify email
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Email verification failed');
    }
    return response.data;
  }

  // Resend verification email
  async resendVerificationEmail(): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/resend-verification');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to resend verification email');
    }
    return response.data;
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.USERS.PROFILE);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get user profile');
      }
      return this.transformUserFromBackend(response.data.user);
    } catch (error: any) {
      // Extract error message from API response
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get user profile';
      throw new Error(errorMessage);
    }
  }

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update profile');
    }
    return response.data;
  }

  // Upload user avatar
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const response = await apiClient.upload<{ url: string }>(API_ENDPOINTS.USERS.UPLOAD_AVATAR, file);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload avatar');
    }
    return { avatarUrl: response.data.url };
  }

  // Delete account
  async deleteAccount(password: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(API_ENDPOINTS.USERS.DELETE_ACCOUNT, {
      data: { password }
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete account');
    }
    return response.data;
  }

  // Helper method to transform backend user format to frontend format
  private transformUserFromBackend(backendUser: any): User {
    return {
      ...backendUser,
      userType: backendUser.userType === 'CUSTOMER' ? 'customer' : backendUser.userType === 'SPECIALIST' ? 'specialist' : backendUser.userType.toLowerCase(),
      // Set default values for missing frontend properties
      totalBookings: backendUser.totalBookings || 0,
      memberSince: backendUser.createdAt || backendUser.memberSince,
      profileComplete: backendUser.profileComplete !== undefined ? backendUser.profileComplete : true,
      isVerified: backendUser.isEmailVerified || backendUser.isVerified || false,
      preferences: backendUser.preferences || {
        language: backendUser.language || 'en',
        currency: backendUser.currency || 'USD',
        timezone: backendUser.timezone || 'UTC',
        notifications: {
          email: true,
          push: true,
          telegram: false,
        },
      },
    };
  }
}

export const authService = new AuthService();