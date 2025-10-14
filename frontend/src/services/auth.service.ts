import { apiClient } from './api';
import { API_ENDPOINTS, environment, STORAGE_KEYS } from '../config/environment';
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
  async register(data: RegisterRequest): Promise<{ user: User; tokens?: AuthTokens; requiresVerification?: boolean; message?: string }> {
    // Convert userType to backend format
    const requestData = {
      ...data,
      userType: data.userType === 'customer' ? 'CUSTOMER' : 'SPECIALIST',
    };

    try {
      const response = await apiClient.post<{ user: User; tokens?: AuthTokens; requiresVerification?: boolean; message?: string }>(API_ENDPOINTS.AUTH.REGISTER, requestData);
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
  async googleAuth(credential: string, userType?: 'customer' | 'specialist'): Promise<{ user: User; tokens: AuthTokens } | { requiresUserTypeSelection: true; googleData: any }> {
    try {
      const payload: any = { credential };
      if (userType) {
        payload.userType = userType;
      }
      
      const response = await apiClient.post<{ user: User; tokens: AuthTokens } | { requiresUserTypeSelection: true; googleData: any }>('/auth-enhanced/google', payload);
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
        
        // If user has a Google avatar URL, save it to backend storage
        if (userData.user.avatar && (userData.user.avatar.includes('googleusercontent.com') || userData.user.avatar.includes('google.com'))) {
          console.log('🔄 Saving Google avatar to backend storage...');
          try {
            const savedAvatar = await this.saveExternalImage(userData.user.avatar, 'avatar');
            // Update user profile with the saved avatar URL
            await this.updateProfile({ avatar: savedAvatar.avatarUrl });
            userData.user.avatar = savedAvatar.avatarUrl;
            console.log('✅ Google avatar saved and profile updated');
          } catch (saveError) {
            console.warn('⚠️ Failed to save Google avatar to backend:', saveError);
            // Continue with original Google URL as fallback
          }
        }
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
      // Get refresh token for logout request - works for both regular and Google OAuth users
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      // Always attempt server logout if we have a refresh token
      if (refreshToken && refreshToken.trim()) {
        // Backend now responds immediately, but keep timeout for network issues
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        try {
          await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, 
            { refreshToken: refreshToken.trim() }, 
            { 
              signal: controller.signal,
              timeout: 2000, // Additional axios timeout
              validateStatus: () => true, // Accept all status codes as success
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          clearTimeout(timeoutId);
        } catch (requestError: any) {
          clearTimeout(timeoutId);
          // Silently handle all logout errors - they don't affect the user experience
          // Backend now responds immediately, so any errors are likely network issues
        }
      }
    } catch (error) {
      // Silently handle logout errors - client-side logout is sufficient
    } finally {
      // Always clear local tokens regardless of server response
      // This works for both regular login and Google OAuth users
      this.clearAuthTokens();
    }
  }
  
  // Clear authentication tokens
  private clearAuthTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
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

  // Set initial password for Google OAuth users
  async setInitialPassword(password: string): Promise<{ message: string }> {
    // Try the dedicated endpoint first, fallback to change password without current password
    try {
      const response = await apiClient.post<{ message: string }>('/auth/set-initial-password', {
        password
      });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to set initial password');
      }
      return response.data;
    } catch (error: any) {
      // If 404, try different endpoints that might be available
      if (error.response?.status === 404) {
        console.log('Fallback: Trying alternative password setup methods');

        // Try change-password endpoint
        try {
          const response = await apiClient.post<{ message: string }>('/auth/change-password', {
            newPassword: password
          });
          if (!response.success || !response.data) {
            throw new Error(response.error?.message || 'Failed to set initial password');
          }
          return response.data;
        } catch (changeError: any) {
          if (changeError.response?.status === 404) {
            console.log('Change password endpoint also not found, trying profile update approach');
            // Last resort: Try updating user profile with password field
            try {
              const response = await apiClient.put<{ message: string }>('/users/profile', {
                password: password
              });
              if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Failed to set initial password');
              }
              return { message: 'Password set successfully' };
            } catch (profileError: any) {
              console.error('All password setup methods failed:', profileError);
              throw new Error('Unable to set password. Please contact support or try using the forgot password option.');
            }
          }
          throw changeError;
        }
      }
      throw error;
    }
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
      console.log('🔍 getCurrentUser raw response:', response.data);
      const transformedUser = this.transformUserFromBackend(response.data.user);
      console.log('🔍 getCurrentUser transformed result:', {
        authProvider: transformedUser.authProvider,
        hasPassword: transformedUser.hasPassword,
        passwordLastChanged: transformedUser.passwordLastChanged
      });
      return transformedUser;
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
    try {
      const formData = new FormData();
      formData.append('files', file);
      
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
    // Debug: Log the raw backend user data
    console.log('🔍 Raw backend user data:', {
      authProvider: backendUser.authProvider,
      provider: backendUser.provider,
      hasPassword: backendUser.hasPassword,
      passwordLastChanged: backendUser.passwordLastChanged,
      allKeys: Object.keys(backendUser)
    });

    // Ensure avatar URL is properly formatted - all avatars should now be stored in backend
    let avatarUrl = backendUser.avatar;
    console.log('🔄 Transforming user avatar from backend:', avatarUrl);
    
    if (avatarUrl && avatarUrl.startsWith('/uploads/')) {
      // Convert relative URL to absolute URL for production
      const baseUrl = environment.API_BASE_URL || 'https://huddle-backend-production.up.railway.app';
      avatarUrl = `${baseUrl}${avatarUrl}`;
      console.log('✅ Backend avatar URL transformed to absolute:', avatarUrl);
    } else if (avatarUrl && avatarUrl.startsWith('http')) {
      // Check if this is still a direct Google URL (should be rare after our changes)
      if (avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('google.com')) {
        console.warn('⚠️ Google avatar URL detected - this should be saved to backend storage!');
      } else {
        console.log('✅ Avatar URL already absolute:', avatarUrl);
      }
    } else if (!avatarUrl) {
      console.log('⚠️ No avatar URL provided for user');
    } else {
      console.log('🤔 Unexpected avatar URL format:', avatarUrl);
    }

    return {
      ...backendUser,
      userType: backendUser.userType === 'CUSTOMER' ? 'customer' : backendUser.userType === 'SPECIALIST' ? 'specialist' : backendUser.userType === 'ADMIN' ? 'admin' : backendUser.userType.toLowerCase(),
      avatar: avatarUrl, // Use the transformed avatar URL
      // Preserve authentication-related fields
      authProvider: backendUser.authProvider || backendUser.provider,
      hasPassword: backendUser.hasPassword !== undefined ? backendUser.hasPassword : true,
      passwordLastChanged: backendUser.passwordLastChanged,
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