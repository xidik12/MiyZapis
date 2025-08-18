import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '../config';
import { ApiResponse, ApiClient, Specialist, Service, ServiceCategory, Booking, UserProfile, PaginatedResponse } from '../types';
import { logger } from '../utils/logger';

class ApiService implements ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BookingBot-Telegram/1.0.0'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`, {
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('API Response Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        success: false,
        error: 'CONNECTION_ERROR',
        message: 'Unable to connect to the booking service'
      };
    }

    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || 'API_ERROR',
        message: error.response.data?.message || 'An error occurred while processing your request'
      };
    }

    return {
      success: false,
      error: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred'
    };
  }

  // User Management
  async createTelegramUser(telegramData: {
    telegramId: number;
    firstName: string;
    lastName?: string;
    username?: string;
    languageCode?: string;
  }): Promise<ApiResponse<UserProfile>> {
    return this.post('/api/v1/auth/telegram', telegramData);
  }

  async getUserProfile(telegramId: number): Promise<ApiResponse<UserProfile>> {
    return this.get(`/api/v1/users/telegram/${telegramId}`);
  }

  async updateUserProfile(telegramId: number, data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return this.put(`/api/v1/users/telegram/${telegramId}`, data);
  }

  // Service Categories
  async getServiceCategories(): Promise<ApiResponse<ServiceCategory[]>> {
    return this.get('/api/v1/services/categories');
  }

  // Specialists
  async getSpecialists(params?: {
    categoryId?: string;
    location?: string;
    rating?: number;
    priceRange?: string;
    availability?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Specialist>> {
    return this.get('/api/v1/specialists', params);
  }

  async getSpecialistById(id: string): Promise<ApiResponse<Specialist>> {
    return this.get(`/api/v1/specialists/${id}`);
  }

  async searchSpecialists(query: string, filters?: Record<string, any>): Promise<PaginatedResponse<Specialist>> {
    return this.get('/api/v1/specialists/search', { q: query, ...filters });
  }

  // Services
  async getServicesBySpecialist(specialistId: string): Promise<ApiResponse<Service[]>> {
    return this.get(`/api/v1/specialists/${specialistId}/services`);
  }

  async getServiceById(id: string): Promise<ApiResponse<Service>> {
    return this.get(`/api/v1/services/${id}`);
  }

  // Bookings
  async createBooking(bookingData: {
    specialistId: string;
    serviceId: string;
    date: string;
    time: string;
    notes?: string;
    userId: string;
  }): Promise<ApiResponse<Booking>> {
    return this.post('/api/v1/bookings', bookingData);
  }

  async getUserBookings(telegramId: number, status?: string): Promise<ApiResponse<Booking[]>> {
    const params = status ? { status } : undefined;
    return this.get(`/api/v1/users/telegram/${telegramId}/bookings`, params);
  }

  async getBookingById(id: string): Promise<ApiResponse<Booking>> {
    return this.get(`/api/v1/bookings/${id}`);
  }

  async updateBooking(id: string, data: Partial<Booking>): Promise<ApiResponse<Booking>> {
    return this.put(`/api/v1/bookings/${id}`, data);
  }

  async cancelBooking(id: string, reason?: string): Promise<ApiResponse<void>> {
    return this.post(`/api/v1/bookings/${id}/cancel`, { reason });
  }

  // Availability
  async getSpecialistAvailability(specialistId: string, date?: string): Promise<ApiResponse<{
    date: string;
    slots: { time: string; available: boolean }[];
  }[]>> {
    const params = date ? { date } : undefined;
    return this.get(`/api/v1/specialists/${specialistId}/availability`, params);
  }

  // Reviews
  async getSpecialistReviews(specialistId: string, page = 1, limit = 10): Promise<PaginatedResponse<{
    id: string;
    rating: number;
    comment: string;
    customerName: string;
    date: string;
  }>> {
    return this.get(`/api/v1/specialists/${specialistId}/reviews`, { page, limit });
  }

  async createReview(bookingId: string, data: {
    rating: number;
    comment: string;
  }): Promise<ApiResponse<void>> {
    return this.post(`/api/v1/bookings/${bookingId}/review`, data);
  }

  // Location-based search
  async getNearbySpecialists(latitude: number, longitude: number, radius = 5): Promise<PaginatedResponse<Specialist>> {
    return this.get('/api/v1/specialists/nearby', {
      lat: latitude,
      lng: longitude,
      radius
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/api/v1/health');
  }

  // Specialist Earnings
  async getSpecialistEarnings(telegramId: number): Promise<ApiResponse<{
    totalEarnings: number;
    monthlyEarnings: number;
    pendingEarnings: number;
    lastPayout: number;
    completedBookings: number;
    averageRating: number;
  }>> {
    return this.get(`/api/v1/specialists/telegram/${telegramId}/earnings`);
  }

  // Specialist Analytics
  async getSpecialistAnalytics(telegramId: number): Promise<ApiResponse<{
    totalBookings: number;
    totalRevenue: number;
    rating: number;
    reviewCount: number;
    completionRate: number;
    responseTime: number;
    monthlyBookings: number;
    monthlyRevenue: number;
  }>> {
    return this.get(`/api/v1/specialists/telegram/${telegramId}/analytics`);
  }
}

export const apiService = new ApiService();
export default apiService;