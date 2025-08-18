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

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;