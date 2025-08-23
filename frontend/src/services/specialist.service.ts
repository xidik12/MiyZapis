import { apiClient } from './api';
import {
  Specialist,
  Service,
  SpecialistAvailability,
  AvailabilityRequest,
  DayAvailability,
  BlockedSlot,
  SpecialistAnalytics,
  Pagination,
  ApiResponse
} from '@/types';

export class SpecialistService {
  // Get specialist profile (for specialists accessing their own profile)
  async getProfile(): Promise<Specialist> {
    const response = await apiClient.get<Specialist>('/specialists/profile');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist profile');
    }
    return response.data;
  }

  // Get public specialist profile (for customers)
  async getPublicProfile(specialistId: string): Promise<Specialist> {
    const response = await apiClient.get<Specialist>(`/specialists/${specialistId}/public`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist profile');
    }
    return response.data;
  }

  // Update specialist profile
  async updateProfile(data: Partial<Specialist>): Promise<Specialist> {
    const response = await apiClient.put<Specialist>('/specialists/profile', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update specialist profile');
    }
    return response.data;
  }

  // Upload specialist portfolio images
  async uploadPortfolioImage(file: File): Promise<{ imageUrl: string }> {
    const response = await apiClient.upload<{ imageUrl: string }>('/specialists/portfolio/upload', file);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to upload portfolio image');
    }
    return response.data;
  }

  // Get specialist's services
  async getServices(): Promise<Service[]> {
    const response = await apiClient.get<{services: Service[]}>('/specialists/services');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist services');
    }
    return response.data.services || [];
  }

  // Create new service
  async createService(data: Partial<Service>): Promise<Service> {
    const response = await apiClient.post<Service>('/specialists/services', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create service');
    }
    return response.data;
  }

  // Update service
  async updateService(serviceId: string, data: Partial<Service>): Promise<Service> {
    const response = await apiClient.put<Service>(`/specialists/services/${serviceId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update service');
    }
    return response.data;
  }

  // Delete service
  async deleteService(serviceId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/specialists/services/${serviceId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete service');
    }
    return response.data;
  }

  // Toggle service active status
  async toggleServiceStatus(serviceId: string, isActive: boolean): Promise<Service> {
    const response = await apiClient.patch<Service>(`/specialists/services/${serviceId}/status`, { isActive });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update service status');
    }
    return response.data;
  }

  // Get specialist availability
  async getAvailability(request: AvailabilityRequest): Promise<{ availableSlots: DayAvailability[] }> {
    const params = new URLSearchParams();
    Object.entries(request).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{ availableSlots: DayAvailability[] }>(`/specialists/availability?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get availability');
    }
    return response.data;
  }

  // Update working hours
  async updateWorkingHours(workingHours: Specialist['availability']['workingHours']): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>('/specialists/availability/working-hours', {
      workingHours
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update working hours');
    }
    return response.data;
  }

  // Block time slots
  async blockTimeSlot(data: {
    startDateTime: string;
    endDateTime: string;
    reason: string;
    recurring?: boolean;
  }): Promise<{ message: string; blockedSlot: BlockedSlot }> {
    const response = await apiClient.post<{ message: string; blockedSlot: BlockedSlot }>('/specialists/availability/block', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to block time slot');
    }
    return response.data;
  }

  // Unblock time slot
  async unblockTimeSlot(blockId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/specialists/availability/block/${blockId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to unblock time slot');
    }
    return response.data;
  }

  // Get blocked slots
  async getBlockedSlots(startDate?: string, endDate?: string): Promise<BlockedSlot[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{ blockedSlots: BlockedSlot[] }>(`/specialists/availability/blocked?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get blocked slots');
    }
    return response.data.blockedSlots;
  }

  // Set vacation/break period
  async setVacation(data: {
    startDate: string;
    endDate: string;
    reason: string;
    autoDeclineBookings?: boolean;
  }): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/specialists/availability/vacation', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to set vacation period');
    }
    return response.data;
  }

  // Get analytics dashboard data
  async getAnalytics(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<SpecialistAnalytics> {
    const response = await apiClient.get<SpecialistAnalytics>(`/specialists/analytics?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get analytics data');
    }
    return response.data;
  }

  // Get revenue breakdown
  async getRevenueBreakdown(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    totalRevenue: number;
    pendingRevenue: number;
    paidRevenue: number;
    platformFee: number;
    netRevenue: number;
    breakdown: Array<{
      date: string;
      revenue: number;
      bookings: number;
    }>;
  }> {
    const response = await apiClient.get(`/specialists/revenue?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get revenue breakdown');
    }
    return response.data;
  }

  // Get top performing services
  async getTopServices(limit: number = 10): Promise<Array<{
    service: Service;
    bookings: number;
    revenue: number;
    rating: number;
    growth: number;
  }>> {
    const response = await apiClient.get(`/specialists/top-services?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get top services');
    }
    return response.data.services;
  }

  // Get customer insights
  async getCustomerInsights(): Promise<{
    totalCustomers: number;
    repeatCustomers: number;
    averageBookingsPerCustomer: number;
    customerSatisfactionRate: number;
    topCustomers: Array<{
      customerId: string;
      customerName: string;
      totalBookings: number;
      totalSpent: number;
      lastBooking: string;
    }>;
  }> {
    const response = await apiClient.get('/specialists/customer-insights');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get customer insights');
    }
    return response.data;
  }

  // Update pricing
  async updatePricing(data: {
    baseRate?: number;
    depositAmount?: number;
    depositPercentage?: number;
    currency?: string;
  }): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>('/specialists/pricing', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update pricing');
    }
    return response.data;
  }

  // Request verification
  async requestVerification(documents: {
    businessLicense?: File;
    professionalCertificate?: File;
    identityDocument?: File;
    additionalInfo?: string;
  }): Promise<{ message: string; verificationId: string }> {
    const formData = new FormData();
    
    if (documents.businessLicense) {
      formData.append('businessLicense', documents.businessLicense);
    }
    if (documents.professionalCertificate) {
      formData.append('professionalCertificate', documents.professionalCertificate);
    }
    if (documents.identityDocument) {
      formData.append('identityDocument', documents.identityDocument);
    }
    if (documents.additionalInfo) {
      formData.append('additionalInfo', documents.additionalInfo);
    }

    const response = await apiClient.post('/specialists/verification/request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to request verification');
    }
    return response.data;
  }

  // Get verification status
  async getVerificationStatus(): Promise<{
    status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'not_submitted';
    submittedAt?: string;
    reviewedAt?: string;
    feedback?: string;
    requiredDocuments?: string[];
  }> {
    const response = await apiClient.get('/specialists/verification/status');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get verification status');
    }
    return response.data;
  }

  // Update business information
  async updateBusinessInfo(data: {
    businessName?: string;
    description?: string;
    specialties?: string[];
    experience?: number;
    location?: {
      address?: string;
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
    };
  }): Promise<Specialist> {
    const response = await apiClient.put<Specialist>('/specialists/business-info', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update business information');
    }
    return response.data;
  }

  // Get payment settings
  async getPaymentSettings(): Promise<{
    stripeAccountId?: string;
    paymentMethodsEnabled: string[];
    payoutSchedule: 'daily' | 'weekly' | 'monthly';
    minimumPayout: number;
    currency: string;
  }> {
    const response = await apiClient.get('/specialists/payment-settings');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment settings');
    }
    return response.data;
  }

  // Setup payment account
  async setupPaymentAccount(): Promise<{ accountLinkUrl: string }> {
    const response = await apiClient.post<{ accountLinkUrl: string }>('/specialists/payment-settings/setup');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to setup payment account');
    }
    return response.data;
  }

  // Search for other specialists (for networking)
  async searchSpecialists(query: string, filters: {
    specialties?: string[];
    location?: string;
    experience?: number;
    rating?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    specialists: Specialist[];
    pagination: Pagination;
  }> {
    const params = new URLSearchParams({ query });
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get<{ specialists: Specialist[]; pagination: Pagination }>(`/specialists?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to search specialists');
    }
    return response.data;
  }
}

export const specialistService = new SpecialistService();