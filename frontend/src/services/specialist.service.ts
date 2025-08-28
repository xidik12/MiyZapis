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

  // Create specialist profile
  async createProfile(data: any): Promise<Specialist> {
    const response = await apiClient.post<Specialist>('/specialists/profile', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create specialist profile');
    }
    return response.data;
  }

  // Update specialist profile
  async updateProfile(data: Partial<Specialist>): Promise<Specialist> {
    console.log('💾 API: Updating specialist profile...');
    console.log('📝 API: Profile data size:', JSON.stringify(data).length, 'chars');
    
    // Check for large portfolio data
    if (data.portfolio) {
      const portfolioSize = JSON.stringify(data.portfolio).length;
      console.log('💼 API: Portfolio data size:', portfolioSize, 'chars');
      if (portfolioSize > 1000000) { // 1MB
        console.warn('⚠️ API: Portfolio data is very large, this might cause issues');
      }
    }
    
    const response = await apiClient.put<Specialist>('/specialists/profile', data);
    console.log('📦 API: Update response:', response);
    
    if (!response.success || !response.data) {
      console.error('❌ API: Profile update failed:', response.error);
      throw new Error(response.error?.message || 'Failed to update specialist profile');
    }
    
    console.log('✅ API: Profile updated successfully');
    return response.data;
  }

  // Upload specialist portfolio images
  async uploadPortfolioImage(file: File): Promise<{ imageUrl: string }> {
    console.log('📸 Uploading portfolio image:', file.name, 'Size:', file.size);
    
    // Validate file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Please choose an image smaller than 5MB.');
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please choose a JPEG, PNG, or WebP image.');
    }
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('files', file);
      
      // Upload to backend
      const response = await apiClient.post<Array<{
        id: string;
        filename: string;
        url: string;
        originalName: string;
        mimeType: string;
        size: number;
        uploadedBy: string;
        purpose: string;
        createdAt: string;
      }>>('/files/upload?purpose=portfolio', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.success || !response.data || response.data.length === 0) {
        throw new Error(response.error?.message || 'Failed to upload image');
      }
      
      const uploadedFile = response.data[0];
      console.log('✅ Image uploaded successfully:', uploadedFile.url);
      
      return { imageUrl: uploadedFile.url };
    } catch (error: any) {
      console.error('❌ Image upload failed:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to upload image');
    }
  }

  // Get specialist's services (for own profile)
  async getServices(): Promise<Service[]> {
    console.log('📡 API: Getting specialist services...');
    const response = await apiClient.get<{services: Service[]}>('/specialists/services');
    console.log('📦 API: Response received:', response);
    
    if (!response.success || !response.data) {
      console.error('❌ API: Failed response:', response.error);
      throw new Error(response.error?.message || 'Failed to get specialist services');
    }
    
    const services = response.data.services || [];
    console.log('🔍 API: Extracted services:', services);
    console.log('🏷️ API: Service IDs:', services.map(s => ({ id: s.id, name: s.name })));
    return services;
  }

  // Get services by specialist ID (for public viewing)
  async getSpecialistServices(specialistId: string): Promise<Service[]> {
    const response = await apiClient.get<{services: Service[]}>(`/specialists/${specialistId}/services`);
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
    console.log('🔄 API: Toggling service status:', { serviceId, isActive });
    
    if (!serviceId) {
      throw new Error('Service ID is required');
    }
    
    const response = await apiClient.patch<{service: Service, message: string}>(`/specialists/services/${serviceId}/status`, { isActive });
    console.log('📦 API: Toggle response:', response);
    
    if (!response.success || !response.data) {
      console.error('❌ API: Toggle failed:', response.error);
      throw new Error(response.error?.message || 'Failed to update service status');
    }
    
    console.log('✅ API: Service status updated successfully');
    // Extract the service object from the response
    const serviceData = response.data.service || response.data;
    console.log('🔍 API: Extracted service data:', serviceData);
    return serviceData;
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

  // Get all availability blocks (both available and blocked)
  async getAvailabilityBlocks(startDate?: string, endDate?: string): Promise<BlockedSlot[]> {
    try {
      // Use the working blocked slots endpoint as the main availability blocks endpoint doesn't exist
      return await this.getBlockedSlots(startDate, endDate);
    } catch (error) {
      // Return empty array if blocked slots endpoint fails
      console.warn('Failed to get availability blocks:', error);
      return [];
    }
  }

  // Create availability block (available or blocked)
  async createAvailabilityBlock(data: {
    startDateTime: string;
    endDateTime: string;
    isAvailable: boolean;
    reason?: string;
    recurring?: boolean;
    recurringDays?: string[];
    recurringUntil?: string;
  }): Promise<{ message: string; block: BlockedSlot }> {
    const response = await apiClient.post<{ message: string; block: BlockedSlot }>('/specialists/availability/block', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create availability block');
    }
    return response.data;
  }

  // Update availability block
  async updateAvailabilityBlock(blockId: string, data: {
    startDateTime: string;
    endDateTime: string;
    isAvailable: boolean;
    reason?: string;
    recurring?: boolean;
    recurringDays?: string[];
    recurringUntil?: string;
  }): Promise<{ message: string; block: BlockedSlot }> {
    const response = await apiClient.put<{ message: string; block: BlockedSlot }>(`/specialists/availability/block/${blockId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update availability block');
    }
    return response.data;
  }

  // Delete availability block
  async deleteAvailabilityBlock(blockId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/specialists/availability/block/${blockId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete availability block');
    }
    return response.data;
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

  // Get available time slots for a specific date
  async getAvailableSlots(specialistId: string, date: string): Promise<string[]> {
    try {
      console.log('📅 API: Getting available slots for specialist:', specialistId, 'date:', date);
      
      // Calculate start and end of the day for the availability query
      const startDate = `${date}T00:00:00.000Z`;
      const endDate = `${date}T23:59:59.999Z`;
      
      const response = await apiClient.get<{ availableSlots: string[] }>(
        `/specialists/${specialistId}/slots?date=${date}`
      );
      
      if (!response.success || !response.data) {
        console.warn('⚠️ API: No available slots data, returning empty array');
        // Return empty array instead of throwing error to handle gracefully
        return [];
      }
      
      const slots = response.data.availableSlots || [];
      console.log('✅ API: Available slots received:', slots);
      return slots;
    } catch (error) {
      console.error('❌ API: Error getting available slots:', error);
      // Return empty array to handle errors gracefully
      return [];
    }
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