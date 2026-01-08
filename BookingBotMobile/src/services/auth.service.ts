// Auth service - adapted for React Native
import { apiClient, getRefreshToken, clearAuthTokens } from './api';
import { fileUploadService } from './fileUpload.service';
import { API_ENDPOINTS, environment } from '../config/environment';
import {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  TelegramAuthRequest,
  ApiResponse
} from '../types';

export class AuthService {
  // Register new user
  async register(data: RegisterRequest): Promise<{ user: User; tokens?: AuthTokens; requiresVerification?: boolean; message?: string }> {
    const requestData = {
      ...data,
      userType: data.userType === 'customer' ? 'CUSTOMER' :
                data.userType === 'business' ? 'BUSINESS' :
                data.userType === 'specialist' ? 'SPECIALIST' :
                data.userType === 'admin' ? 'ADMIN' : 'CUSTOMER',
    };

    try {
      const response = await apiClient.post<{ user: User; tokens?: AuthTokens; requiresVerification?: boolean; message?: string }>(API_ENDPOINTS.AUTH.REGISTER, requestData);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Registration failed');
      }
      
      const userData = response.data;
      if (userData.user) {
        userData.user = this.transformUserFromBackend(userData.user);
      }
      
      return userData;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  // Login user
  async login(data: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      const loginData = { ...data, platform: 'mobile' };
      const response = await apiClient.post<{ user: User; tokens: AuthTokens }>(API_ENDPOINTS.AUTH.LOGIN, loginData);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }
      
      const userData = response.data;
      if (userData.user) {
        userData.user = this.transformUserFromBackend(userData.user);
      }
      
      return userData;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }

  // Google authentication - Pure API call, same as web version
  // Gets Google ID token from OAuth flow and sends it to backend API endpoint
  async googleAuth(credential: string, userType?: 'customer' | 'specialist' | 'business'): Promise<{ user: User; tokens: AuthTokens } | { requiresUserTypeSelection: true; googleData: any }> {
    try {
      // Prepare payload exactly like web version: { credential, userType? }
      const payload: any = { credential };
      if (userType) {
        payload.userType = userType === 'customer' ? 'CUSTOMER' :
                          userType === 'business' ? 'BUSINESS' :
                          userType === 'specialist' ? 'SPECIALIST' : 'CUSTOMER';
      }
      
      // API call to /auth-enhanced/google - same endpoint as web version
      const response = await apiClient.post<{ user: User; tokens: AuthTokens } | { requiresUserTypeSelection: true; googleData: any }>(API_ENDPOINTS.AUTH.GOOGLE_AUTH, payload);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Google authentication failed');
      }
      
      // Check if user type selection is required
      if ('requiresUserTypeSelection' in response.data) {
        return response.data;
      }
      
      // Transform backend user format to frontend format
      const userData = response.data as { user: User; tokens: AuthTokens };
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
      const response = await apiClient.post<{ user: User; tokens: AuthTokens; isNewUser: boolean }>(API_ENDPOINTS.AUTH.TELEGRAM_AUTH, data);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Telegram authentication failed');
      }
      
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
      const refreshTokenValue = await getRefreshToken();
      
      if (refreshTokenValue && refreshTokenValue.trim()) {
        try {
          await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken: refreshTokenValue.trim() });
        } catch (error) {
          // Silently handle logout errors
        }
      }
    } catch (error) {
      // Silently handle logout errors
    } finally {
      await clearAuthTokens();
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
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      password
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
    return this.transformUserFromBackend(response.data);
  }

  // Upload user avatar (React Native)
  async uploadAvatar(fileUri: string): Promise<{ avatarUrl: string }> {
    try {
      const uploadedFile = await fileUploadService.uploadFile(fileUri, 'avatar');
      return { avatarUrl: uploadedFile.url || uploadedFile.path };
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to upload avatar';
      throw new Error(errorMessage);
    }
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
    let avatarUrl = backendUser.avatar;
    
    if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
      const baseUrl = environment.API_URL.replace('/api/v1', '');
      avatarUrl = `${baseUrl}${avatarUrl}`;
    }

    return {
      ...backendUser,
      userType: backendUser.userType === 'CUSTOMER' ? 'customer' : 
                backendUser.userType === 'SPECIALIST' ? 'specialist' : 
                backendUser.userType === 'ADMIN' ? 'admin' : 
                backendUser.userType.toLowerCase(),
      avatar: avatarUrl,
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

