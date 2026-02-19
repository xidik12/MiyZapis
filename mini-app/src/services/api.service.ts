import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { telegramAuthService } from '@/services/telegramAuth.service';

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

    // Request interceptor to add auth token (reads from canonical telegramAuthService)
    this.api.interceptors.request.use(
      (config) => {
        const token = telegramAuthService.getToken();
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
            telegramAuthService.clearTokens();
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
    city?: string;
  }): Promise<PaginatedResponse<any>> {
    // Backend expects 'query' not 'search'
    const apiParams: any = { ...params };
    if (apiParams.search) {
      apiParams.query = apiParams.search;
      delete apiParams.search;
    }
    return this.get('/services', apiParams);
  }

  async getCities(params?: { search?: string }): Promise<{ city: string; state?: string; count: number }[]> {
    const response: any = await this.get('/locations/cities', params);
    const cities = response?.cities || response || [];
    // Backend returns specialistsCount, normalize to count
    return cities.map((c: any) => ({
      city: c.city,
      state: c.state,
      count: c.specialistsCount ?? c.count ?? 0,
    }));
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

  async getSpecialistAvailability(id: string, date: string): Promise<string[]> {
    const result = await this.get<{ availableSlots: string[] }>(`/specialists/${id}/slots`, { date });
    return (result as any)?.availableSlots || [];
  }

  // Bookings endpoints
  async getBookings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    userType?: 'customer' | 'specialist';
  }): Promise<PaginatedResponse<any>> {
    return this.get('/bookings', params);
  }

  async getBooking(id: string) {
    return this.get(`/bookings/${id}`);
  }

  async createBooking(bookingData: {
    serviceId: string;
    specialistId: string;
    scheduledAt: string;
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
    if (params?.serviceId) {
      return this.get(`/reviews/service/${params.serviceId}`, { page: params.page, limit: params.limit });
    }
    if (params?.specialistId) {
      return this.get(`/reviews/specialist/${params.specialistId}`, { page: params.page, limit: params.limit });
    }
    return this.get('/reviews/my-reviews', params);
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
    return this.get('/payments/wallet/balance');
  }

  async getWalletTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/payments/wallet/transactions', params);
  }

  // Favorites endpoints
  async getFavorites(params?: {
    page?: number;
    limit?: number;
    type?: 'specialist' | 'service';
  }): Promise<PaginatedResponse<any>> {
    return this.get('/favorites/all', params);
  }

  async addFavorite(data: { targetId: string; type: 'specialist' | 'service' }) {
    return this.post(`/favorites/${data.type}s/${data.targetId}`);
  }

  async removeFavorite(id: string, type: 'specialist' | 'service' = 'specialist') {
    return this.delete(`/favorites/${type}s/${id}`);
  }

  // Loyalty endpoints
  async getLoyaltyStatus() {
    return this.get('/loyalty/stats');
  }

  async getLoyaltyHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<any>> {
    return this.get('/loyalty/transactions', params);
  }

  async redeemReward(rewardId: string) {
    return this.post('/loyalty/redeem', { rewardId });
  }

  async getLoyaltyRewards(): Promise<any[]> {
    return this.get('/loyalty/discounts');
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

  async createCommunityPost(data: {
    title: string;
    content: string;
    type: string;
    price?: number;
    currency?: string;
    contactPhone?: string;
    contactEmail?: string;
    images?: string[];
  }) {
    return this.post('/community/posts', data);
  }

  async updateCommunityPost(id: string, data: {
    title?: string;
    content?: string;
    price?: number;
    currency?: string;
    contactPhone?: string;
    contactEmail?: string;
    images?: string[];
  }) {
    return this.put(`/community/posts/${id}`, data);
  }

  async deleteCommunityPost(id: string) {
    return this.delete(`/community/posts/${id}`);
  }

  async likeCommunityPost(postId: string) {
    return this.post(`/community/posts/${postId}/like`);
  }

  async unlikeCommunityPost(postId: string) {
    return this.delete(`/community/posts/${postId}/like`);
  }

  // Specialist service management
  async getMyServices(): Promise<any[]> {
    return this.get('/specialists/services');
  }

  async createService(data: {
    name: string;
    description: string;
    categoryId: string;
    duration: number;
    price: number;
    currency?: string;
  }) {
    return this.post('/specialists/services', data);
  }

  async updateService(id: string, data: any) {
    return this.put(`/specialists/services/${id}`, data);
  }

  async deleteService(id: string) {
    return this.delete(`/specialists/services/${id}`);
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
    return this.get('/specialists/blocks', params);
  }

  async createAvailabilityBlock(data: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
  }) {
    return this.post('/specialists/blocks', data);
  }

  async updateAvailabilityBlock(id: string, data: any) {
    return this.put(`/specialists/blocks/${id}`, data);
  }

  async deleteAvailabilityBlock(id: string) {
    return this.delete(`/specialists/blocks/${id}`);
  }

  async generateAvailability(data: { startDate: string; endDate: string }) {
    return this.post('/specialists/availability/generate', data);
  }

  // ==================== Specialist Earnings ====================
  async getSpecialistEarnings(params?: { period?: string }) {
    return this.get('/payments/earnings/my', params);
  }

  async getEarningsOverview() {
    return this.get('/payments/earnings/overview');
  }

  async getEarningsTrends(params?: { months?: number }) {
    return this.get('/payments/earnings/trends', params);
  }

  async getEarningsAnalytics() {
    return this.get('/payments/earnings/analytics');
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
    return this.get('/payments/methods/my');
  }

  async getPaymentHistory(params?: { page?: number; limit?: number }) {
    return this.get('/payments/history', params);
  }

  // ==================== Specialist Profile ====================
  async getSpecialistProfile() {
    return this.get('/specialists/profile');
  }

  async updateSpecialistProfile(data: any) {
    return this.put('/specialists/profile', data);
  }

  // ==================== Specialist Analytics ====================
  async getSpecialistAnalytics(params?: { period?: string }) {
    return this.get('/specialists/analytics', params);
  }

  async getAnalyticsEnhanced() {
    return this.get('/analytics-enhanced/my-specialist');
  }

  async getRevenueData(params?: { months?: number }) {
    return this.get('/payments/earnings/revenue', params);
  }

  // ==================== Specialist Reviews ====================
  async getSpecialistReviews(params?: { page?: number; limit?: number }) {
    return this.get('/reviews/my-reviews', params);
  }

  async respondToReview(reviewId: string, response: string) {
    return this.post(`/reviews/${reviewId}/response`, { response });
  }

  // ==================== Specialist Clients ====================
  // Clients are derived from bookings — no dedicated endpoint exists

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
  async getFAQs(params?: { category?: string; language?: string }) {
    return this.get('/help/faqs', params);
  }

  async getFAQCategories(params?: { language?: string }) {
    return this.get('/help/faq-categories', params);
  }

  async searchFAQs(query: string) {
    return this.get('/help/search', { query });
  }

  async submitFeedback(data: { subject: string; message: string; category?: string; email?: string }) {
    return this.post('/help/feedback', data);
  }

  // ==================== Referrals ====================
  async getReferralConfig() {
    return this.get('/referral/config');
  }

  async createReferral() {
    return this.post('/referral/create', {
      referralType: 'CUSTOMER_TO_CUSTOMER',
      targetUserType: 'CUSTOMER',
      inviteChannel: 'LINK',
    });
  }

  async getMyReferrals(params?: { page?: number; limit?: number }) {
    return this.get('/referral/my-referrals', params);
  }

  async getReferralAnalytics() {
    return this.get('/referral/analytics');
  }

  // ==================== Specialist Wallet / Payouts ====================
  async getSpecialistWallet() {
    return this.get('/payments/wallet/balance');
  }

  async getSpecialistPayouts(params?: { page?: number; limit?: number }) {
    return this.get('/payments/wallet/transactions', params);
  }

  async requestPayout(data: { amount: number; method?: string }) {
    return this.post('/payments/wallet/payout', data);
  }

  // ==================== Onboarding ====================
  async completeOnboarding(data: any) {
    return this.post('/specialists/profile', data);
  }

  // ==================== File Upload ====================
  async uploadFile(file: File, purpose: string = 'portfolio'): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('files', file);

    const response = await this.api.post(`/files/upload?purpose=${purpose}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });

    const data = response.data?.data;
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('Upload failed');
    }
    return { url: data[0].url, filename: data[0].filename };
  }

  // ==================== Review Reactions ====================
  async reactToReview(reviewId: string, reactionType: 'LIKE' | 'DISLIKE') {
    return this.post(`/reviews/${reviewId}/react`, { reactionType });
  }

  async reportReview(reviewId: string, reason: string, details?: string) {
    return this.post(`/reviews/${reviewId}/report`, { reason, details });
  }

  // ==================== Help Contact Methods ====================
  async getContactMethods() {
    return this.get('/help/contact-methods');
  }

  // ==================== Expenses ====================
  async getExpenses(params?: {
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    return this.get('/expenses', params);
  }

  async getExpenseSummary(params?: { startDate?: string; endDate?: string }) {
    return this.get('/expenses/summary', params);
  }

  async createExpense(data: {
    category: string;
    amount: number;
    description?: string;
    date?: string;
    recurring?: boolean;
    frequency?: string;
    notes?: string;
  }) {
    return this.post('/expenses', data);
  }

  async updateExpense(id: string, data: {
    category?: string;
    amount?: number;
    description?: string;
    date?: string;
    recurring?: boolean;
    frequency?: string;
    notes?: string;
  }) {
    return this.put(`/expenses/${id}`, data);
  }

  async deleteExpense(id: string) {
    return this.delete(`/expenses/${id}`);
  }

  // ==================== Loyalty (extended) ====================
  async getLoyaltyProfile() {
    return this.get('/loyalty/profile');
  }

  async getLoyaltyTiers() {
    return this.get('/loyalty/tiers');
  }

  async getLoyaltyBadges() {
    return this.get('/loyalty/badges');
  }

  async getLoyaltyConfig() {
    return this.get('/loyalty/config');
  }

  // Health check
  async healthCheck() {
    return this.get('/health');
  }
}

export const apiService = new ApiService();
export default apiService;