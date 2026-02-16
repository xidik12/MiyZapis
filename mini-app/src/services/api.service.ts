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
          // Only clear auth for auth-critical endpoints (token validation)
          // Don't clear for other endpoints that may return 401 for other reasons
          const url = error.config?.url || '';
          if (url.includes('/auth/me') || url.includes('/auth/refresh')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
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

  // ==================== Notifications ====================
  async getNotifications(params?: { page?: number; limit?: number; filter?: string }) {
    return this.get('/notifications', params);
  }

  async getUnreadNotificationCount() {
    return this.get('/notifications/unread-count');
  }

  async markNotificationRead(id: string) {
    return this.put(`/notifications/${id}/read`);
  }

  async markAllNotificationsRead() {
    return this.put('/notifications/read-all');
  }

  async deleteNotification(id: string) {
    return this.delete(`/notifications/${id}`);
  }

  async deleteAllNotifications() {
    return this.delete('/notifications/all');
  }

  // ==================== Messages / Conversations ====================
  async getConversations() {
    return this.get('/messages/conversations');
  }

  async getConversation(id: string) {
    return this.get(`/messages/conversations/${id}`);
  }

  async createConversation(participantId: string) {
    return this.post('/messages/conversations', { participantId });
  }

  async sendMessage(conversationId: string, content: string) {
    return this.post(`/messages/conversations/${conversationId}/messages`, { content });
  }

  async markMessagesRead(conversationId: string) {
    return this.put(`/messages/conversations/${conversationId}/read`);
  }

  async getMessageUnreadCount() {
    return this.get('/messages/unread-count');
  }

  async deleteConversation(id: string) {
    return this.delete(`/messages/conversations/${id}`);
  }

  // ==================== Specialist Bookings Management ====================
  async confirmBooking(id: string) {
    return this.put(`/bookings/${id}/confirm`);
  }

  async rejectBooking(id: string, reason: string) {
    return this.put(`/bookings/${id}/reject`, { reason });
  }

  async getBookingStats() {
    return this.get('/bookings/stats');
  }

  // ==================== Specialist Schedule / Availability ====================
  async getAvailabilityBlocks(params?: { startDate?: string; endDate?: string }) {
    return this.get('/specialists/me/availability', params);
  }

  async createAvailabilityBlock(data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
  }) {
    return this.post('/specialists/me/availability', data);
  }

  async updateAvailabilityBlock(id: string, data: any) {
    return this.put(`/specialists/me/availability/${id}`, data);
  }

  async deleteAvailabilityBlock(id: string) {
    return this.delete(`/specialists/me/availability/${id}`);
  }

  async generateAvailability(data: { startDate: string; endDate: string }) {
    return this.post('/specialists/me/availability/generate', data);
  }

  // ==================== Specialist Earnings ====================
  async getSpecialistEarnings(params?: { period?: string }) {
    return this.get('/specialists/me/earnings', params);
  }

  async getEarningsOverview() {
    return this.get('/specialists/me/earnings/overview');
  }

  async getEarningsTrends(params?: { months?: number }) {
    return this.get('/specialists/me/earnings/trends', params);
  }

  async getEarningsAnalytics() {
    return this.get('/specialists/me/earnings/analytics');
  }

  // ==================== Community Post Detail ====================
  async getCommunityPost(id: string) {
    return this.get(`/community/posts/${id}`);
  }

  async getPostComments(postId: string, params?: { page?: number; limit?: number }) {
    return this.get(`/community/posts/${postId}/comments`, params);
  }

  async createComment(postId: string, data: { content: string; parentId?: string }) {
    return this.post(`/community/posts/${postId}/comments`, data);
  }

  async deleteComment(postId: string, commentId: string) {
    return this.delete(`/community/posts/${postId}/comments/${commentId}`);
  }

  async toggleCommentLike(postId: string, commentId: string) {
    return this.post(`/community/posts/${postId}/comments/${commentId}/like`);
  }

  // ==================== Payment Processing ====================
  async getPaymentMethods() {
    return this.get('/payments/methods');
  }

  async getPaymentHistory(params?: { page?: number; limit?: number }) {
    return this.get('/payments/history', params);
  }

  // ==================== Specialist Profile ====================
  async getSpecialistProfile() {
    return this.get('/specialists/me');
  }

  async updateSpecialistProfile(data: any) {
    return this.put('/specialists/me', data);
  }

  // ==================== Specialist Analytics ====================
  async getSpecialistAnalytics(params?: { period?: string }) {
    return this.get('/specialists/me/analytics', params);
  }

  async getAnalyticsEnhanced() {
    return this.get('/specialists/me/analytics/enhanced');
  }

  async getRevenueData(params?: { months?: number }) {
    return this.get('/specialists/me/analytics/revenue', params);
  }

  // ==================== Specialist Reviews ====================
  async getSpecialistReviews(params?: { page?: number; limit?: number }) {
    return this.get('/specialists/me/reviews', params);
  }

  async respondToReview(reviewId: string, response: string) {
    return this.post(`/reviews/${reviewId}/respond`, { response });
  }

  // ==================== Specialist Clients ====================
  async getSpecialistClients(params?: { page?: number; limit?: number; search?: string }) {
    return this.get('/specialists/me/clients', params);
  }

  async addClientNote(clientId: string, note: string) {
    return this.post(`/specialists/me/clients/${clientId}/notes`, { note });
  }

  // ==================== Payment Methods ====================
  async addPaymentMethod(data: { type: string; token?: string }) {
    return this.post('/payments/methods', data);
  }

  async deletePaymentMethod(id: string) {
    return this.delete(`/payments/methods/${id}`);
  }

  async setDefaultPaymentMethod(id: string) {
    return this.put(`/payments/methods/${id}/default`);
  }

  // ==================== Help & Support ====================
  async getFAQs(params?: { category?: string }) {
    return this.get('/support/faqs', params);
  }

  async getFAQCategories() {
    return this.get('/support/faqs/categories');
  }

  async searchFAQs(query: string) {
    return this.get('/support/faqs/search', { query });
  }

  async submitFeedback(data: { subject: string; message: string; category?: string }) {
    return this.post('/support/feedback', data);
  }

  // ==================== Referrals ====================
  async getReferralConfig() {
    return this.get('/referrals/config');
  }

  async createReferral() {
    return this.post('/referrals');
  }

  async getMyReferrals(params?: { page?: number; limit?: number }) {
    return this.get('/referrals', params);
  }

  async getReferralAnalytics() {
    return this.get('/referrals/analytics');
  }

  // ==================== Specialist Wallet / Payouts ====================
  async getSpecialistWallet() {
    return this.get('/specialists/me/wallet');
  }

  async getSpecialistPayouts(params?: { page?: number; limit?: number }) {
    return this.get('/specialists/me/payouts', params);
  }

  async requestPayout(data: { amount: number; method?: string }) {
    return this.post('/specialists/me/payouts', data);
  }

  // ==================== Onboarding ====================
  async completeOnboarding(data: any) {
    return this.post('/specialists/me/onboarding', data);
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;