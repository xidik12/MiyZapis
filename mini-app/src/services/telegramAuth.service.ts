import axios from 'axios';
import { TelegramAuthData, TelegramUser, User } from '@/types';

export interface TelegramAuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ValidateInitDataResponse {
  isValid: boolean;
  user?: TelegramUser;
  authDate: number;
  hash: string;
}

class TelegramAuthService {
  private readonly API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  /**
   * Validate Telegram Web App init data
   */
  async validateInitData(initData: string): Promise<ValidateInitDataResponse> {
    try {
      const response = await axios.post(`${this.API_BASE_URL}/auth/telegram/validate`, {
        initData
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error validating Telegram init data:', error);
      throw new Error('Failed to validate Telegram authentication');
    }
  }

  /**
   * Authenticate with Telegram Web App
   */
  async authenticateWithTelegram(initData: string): Promise<TelegramAuthResponse> {
    try {
      // First validate the init data
      const validation = await this.validateInitData(initData);
      
      if (!validation.isValid || !validation.user) {
        throw new Error('Invalid Telegram authentication data');
      }

      // Authenticate with the backend
      const response = await axios.post(`${this.API_BASE_URL}/auth/telegram/login`, {
        initData,
        user: validation.user
      });

      const authData = response.data.data;
      
      // Store tokens
      this.setTokens(authData.token, authData.refreshToken);
      
      return authData;
    } catch (error) {
      console.error('Error authenticating with Telegram:', error);
      throw new Error('Failed to authenticate with Telegram');
    }
  }

  /**
   * Register new user via Telegram
   */
  async registerWithTelegram(
    initData: string,
    additionalData: {
      firstName: string;
      lastName?: string;
      phone?: string;
      email?: string;
    }
  ): Promise<TelegramAuthResponse> {
    try {
      const validation = await this.validateInitData(initData);
      
      if (!validation.isValid || !validation.user) {
        throw new Error('Invalid Telegram authentication data');
      }

      const response = await axios.post(`${this.API_BASE_URL}/auth/telegram/register`, {
        initData,
        user: validation.user,
        ...additionalData
      });

      const authData = response.data.data;
      
      // Store tokens
      this.setTokens(authData.token, authData.refreshToken);
      
      return authData;
    } catch (error) {
      console.error('Error registering with Telegram:', error);
      throw new Error('Failed to register with Telegram');
    }
  }

  /**
   * Link existing account with Telegram
   */
  async linkTelegramAccount(
    initData: string,
    email: string,
    password: string
  ): Promise<TelegramAuthResponse> {
    try {
      const validation = await this.validateInitData(initData);
      
      if (!validation.isValid || !validation.user) {
        throw new Error('Invalid Telegram authentication data');
      }

      const response = await axios.post(`${this.API_BASE_URL}/auth/telegram/link`, {
        initData,
        user: validation.user,
        email,
        password
      });

      const authData = response.data.data;
      
      // Store tokens
      this.setTokens(authData.token, authData.refreshToken);
      
      return authData;
    } catch (error) {
      console.error('Error linking Telegram account:', error);
      throw new Error('Failed to link Telegram account');
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${this.API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await axios.post(`${this.API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      const { token, refreshToken: newRefreshToken } = response.data.data;
      
      this.setTokens(token, newRefreshToken);
      
      return token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      throw new Error('Failed to refresh authentication token');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await axios.post(`${this.API_BASE_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Parse Telegram init data
   */
  parseInitData(initData: string): TelegramAuthData | null {
    try {
      const urlParams = new URLSearchParams(initData);
      const user = urlParams.get('user');
      const authDate = urlParams.get('auth_date');
      const hash = urlParams.get('hash');
      const chatInstance = urlParams.get('chat_instance');
      const chatType = urlParams.get('chat_type');
      const startParam = urlParams.get('start_param');

      if (!user || !authDate || !hash) {
        return null;
      }

      return {
        user: JSON.parse(user),
        auth_date: parseInt(authDate),
        hash,
        chat_instance: chatInstance || undefined,
        chat_type: chatType || undefined,
        start_param: startParam || undefined
      };
    } catch (error) {
      console.error('Error parsing init data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get stored authentication token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('booking_app_token');
    }
    return null;
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('booking_app_refresh_token');
    }
    return null;
  }

  /**
   * Store authentication tokens
   */
  private setTokens(token: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('booking_app_token', token);
      localStorage.setItem('booking_app_refresh_token', refreshToken);
    }
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('booking_app_token');
      localStorage.removeItem('booking_app_refresh_token');
    }
  }

  /**
   * Setup axios interceptors for automatic token refresh
   */
  setupAxiosInterceptors(): void {
    // Request interceptor to add token
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            // Redirect to login or handle authentication error
            window.location.reload();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }
}

export const telegramAuthService = new TelegramAuthService();