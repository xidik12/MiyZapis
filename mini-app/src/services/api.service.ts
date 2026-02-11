import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  private async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.get(url, { params });
    return response.data.data;
  }

  private async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.post(url, data);
    return response.data.data;
  }

  private async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.put(url, data);
    return response.data.data;
  }

  private async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<ApiResponse<T>> = await this.api.delete(url);
    return response.data.data;
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.post('/auth/login', credentials);
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    return this.post('/auth/register', userData);
  }

  async telegramAuth(telegramData: any) {
    return this.post('/auth/telegram', telegramData);
  }

  async refreshToken() {
    return this.post('/auth/refresh');
  }

  async getMe() {
    return this.get('/auth/me');
  }

  // Services endpoints
  async getServices(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/services', params);
  }

  async getService(id: string) {
    return this.get(`/services/${id}`);
  }

  async getServiceCategories() {
    return this.get('/services/categories');
  }

  // Specialists endpoints
  async getSpecialists(params?: {
    page?: number;
    limit?: number;
    service?: string;
    location?: string;
    rating?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/specialists', params);
  }

  async getSpecialist(id: string) {
    return this.get(`/specialists/${id}`);
  }

  async getSpecialistServices(id: string) {
    return this.get(`/specialists/${id}/services`);
  }

  async getSpecialistAvailability(id: string, date: string) {
    return this.get(`/specialists/${id}/availability`, { date });
  }

  // Bookings endpoints
  async getBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/bookings', params);
  }

  async getBooking(id: string) {
    return this.get(`/bookings/${id}`);
  }

  async createBooking(bookingData: {
    serviceId: string;
    specialistId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    return this.post('/bookings', bookingData);
  }

  async updateBooking(id: string, updates: any) {
    return this.put(`/bookings/${id}`, updates);
  }

  async cancelBooking(id: string, reason?: string) {
    return this.put(`/bookings/${id}/cancel`, { reason });
  }

  // Reviews endpoints
  async getReviews(params?: {
    page?: number;
    limit?: number;
    serviceId?: string;
    specialistId?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/reviews', params);
  }

  async createReview(reviewData: {
    bookingId: string;
    rating: number;
    comment?: string;
  }) {
    return this.post('/reviews', reviewData);
  }

  // Users endpoints
  async updateProfile(updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    preferences?: any;
  }) {
    return this.put('/users/profile', updates);
  }

  async getUserProfile() {
    return this.get('/users/profile');
  }

  // Payments endpoints
  async createPaymentIntent(bookingId: string) {
    return this.post('/payments/intent', { bookingId });
  }

  async confirmPayment(paymentIntentId: string) {
    return this.post('/payments/confirm', { paymentIntentId });
  }

  // Wallet endpoints
  async getWalletBalance() {
    return this.get('/wallet/balance');
  }

  async getWalletTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/wallet/transactions', params);
  }

  // Favorites endpoints
  async getFavorites(params?: {
    page?: number;
    limit?: number;
    type?: 'specialist' | 'service';
  }): Promise<PaginatedResponse<any>> {
    return this.get('/favorites', params);
  }

  async addFavorite(data: { targetId: string; type: 'specialist' | 'service' }) {
    return this.post('/favorites', data);
  }

  async removeFavorite(id: string) {
    return this.delete(`/favorites/${id}`);
  }

  // Loyalty endpoints
  async getLoyaltyStatus() {
    return this.get('/loyalty/status');
  }

  async getLoyaltyHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/loyalty/history', params);
  }

  async redeemReward(rewardId: string) {
    return this.post('/loyalty/redeem', { rewardId });
  }

  async getLoyaltyRewards(): Promise<any[]> {
    return this.get('/loyalty/rewards');
  }

  // Community endpoints
  async getCommunityPosts(params?: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/community/posts', params);
  }

  async createCommunityPost(data: { title: string; content: string; type: string; image?: string }) {
    return this.post('/community/posts', data);
  }

  async likeCommunityPost(postId: string) {
    return this.post(`/community/posts/${postId}/like`);
  }

  async unlikeCommunityPost(postId: string) {
    return this.delete(`/community/posts/${postId}/like`);
  }

  // Specialist service management
  async getMyServices(): Promise<any[]> {
    return this.get('/specialists/me/services');
  }

  async createService(data: {
    name: string;
    description: string;
    categoryId: string;
    duration: number;
    price: number;
    currency?: string;
  }) {
    return this.post('/specialists/me/services', data);
  }

  async updateService(id: string, data: any) {
    return this.put(`/specialists/me/services/${id}`, data);
  }

  async deleteService(id: string) {
    return this.delete(`/specialists/me/services/${id}`);
  }

  // Notifications preferences
  async getNotificationPreferences() {
    return this.get('/users/notification-preferences');
  }

  async updateNotificationPreferences(prefs: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    telegram?: boolean;
    bookingReminders?: boolean;
    promotions?: boolean;
  }) {
    return this.put('/users/notification-preferences', prefs);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;