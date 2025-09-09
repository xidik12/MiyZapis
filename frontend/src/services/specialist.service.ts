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
    const response = await apiClient.get<{ specialist: any }>(`/specialists/${specialistId}/public`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist profile');
    }
    
    // Extract the specialist data from the nested response
    const specialistData = response.data.specialist;
    console.log('🔍 Raw specialist data from API:', specialistData);
    
    // Check if avatar URLs are accessible (basic validation)
    if (specialistData.user?.avatar && specialistData.user.avatar.includes('/uploads/')) {
      console.log('⚠️ Avatar URL points to uploads directory - may not be accessible if files were lost');
    }
    
    // Transform the response to match frontend expectations
    // Normalize response time to minutes if backend stores milliseconds
    const normalizeResponseTime = (value: any): number | undefined => {
      if (value === null || value === undefined) return undefined;
      const n = Number(value);
      if (!isFinite(n) || n <= 0) return undefined;
      // Heuristic: if value looks like milliseconds (> 300), convert to minutes
      return n > 300 ? Math.round(n / 60000) : n;
    };

    const transformedSpecialist = {
      ...specialistData,
      // Handle user data nesting
      user: specialistData.user ? {
        ...specialistData.user,
        firstName: specialistData.user.firstName || specialistData.firstName,
        lastName: specialistData.user.lastName || specialistData.lastName,
        avatar: specialistData.user.avatar || specialistData.avatar,
        isVerified: specialistData.user.isVerified || specialistData.isVerified || false
      } : {
        firstName: specialistData.firstName,
        lastName: specialistData.lastName,
        avatar: specialistData.avatar,
        isVerified: specialistData.isVerified || false
      },
      // Also keep avatar at root level for backward compatibility
      avatar: specialistData.user?.avatar || specialistData.avatar,
      // Flatten location data to root level for compatibility
      city: specialistData.location?.city || specialistData.city,
      state: specialistData.location?.state || specialistData.state,
      country: specialistData.location?.country || specialistData.country,
      address: specialistData.location?.address || specialistData.address,
      // Ensure specialties is properly handled
      specialties: Array.isArray(specialistData.specialties) 
        ? specialistData.specialties 
        : (typeof specialistData.specialties === 'string' 
           ? JSON.parse(specialistData.specialties) 
           : []),
      // Ensure portfolio images are properly structured
      portfolioImages: (() => {
        try {
          const portfolioData = Array.isArray(specialistData.portfolioImages)
            ? specialistData.portfolioImages
            : (typeof specialistData.portfolioImages === 'string'
               ? JSON.parse(specialistData.portfolioImages)
               : []);
          
          // Filter out overly large base64 images that could cause performance issues
          const filteredPortfolio = portfolioData.filter((item: any) => {
            if (typeof item === 'string' && item.startsWith('data:image/')) {
              const sizeKB = Math.round(item.length / 1024);
              if (item.length >= 500000) {
                console.warn(`⚠️ Skipping large base64 portfolio image: ${sizeKB}KB (max 488KB)`);
                console.warn('💡 Suggestion: Convert large images to files and upload via backend');
                return false;
              }
              return true;
            } else if (typeof item === 'object' && item.imageUrl && item.imageUrl.startsWith('data:image/')) {
              const sizeKB = Math.round(item.imageUrl.length / 1024);
              if (item.imageUrl.length >= 500000) {
                console.warn(`⚠️ Skipping large base64 portfolio image: ${sizeKB}KB (max 488KB)`);
                console.warn('💡 Suggestion: Convert large images to files and upload via backend');
                return false;
              }
              return true;
            }
            return true; // Keep all non-base64 images
          });
          
          console.log('📸 Portfolio images processed:', {
            original: portfolioData.length,
            filtered: filteredPortfolio.length,
            removed: portfolioData.length - filteredPortfolio.length
          });
          
          return filteredPortfolio;
        } catch (error) {
          console.error('❌ Error processing portfolio images:', error);
          return [];
        }
      })(),
      // Handle bio fields
      bio: specialistData.bio || specialistData.description,
      bioUk: specialistData.bioUk,
      bioRu: specialistData.bioRu,
      // Ensure other common fields
      businessName: specialistData.businessName,
      rating: specialistData.rating || 0,
      reviewCount: specialistData.reviewCount || specialistData.totalReviews || 0,
      completedBookings: specialistData.completedBookings || specialistData.totalBookings || 0,
      experience: specialistData.experience || 0,
      responseTime: normalizeResponseTime(specialistData.responseTime)
    };
    
    console.log('✅ Transformed specialist data:', transformedSpecialist);
    return transformedSpecialist;
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
    console.log('📸 Processing portfolio image:', file.name, 'Size:', file.size);
    
    // Import fileUploadService dynamically to avoid circular dependencies
    const { fileUploadService } = await import('./fileUpload.service');
    
    // Use the proper backend file upload service
    const result = await fileUploadService.uploadPortfolioImage(file);
    
    console.log('✅ Portfolio image uploaded successfully:', result.url);
    return { imageUrl: result.url };
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
    try {
      console.log('🗑️ API: Deleting service:', serviceId);
      
      if (!serviceId || serviceId.trim() === '') {
        throw new Error('Service ID is required for deletion');
      }
      
      const response = await apiClient.delete<{ message: string }>(`/specialists/services/${serviceId}`);
      console.log('📦 API: Delete response:', response);
      
      if (!response.success || !response.data) {
        const errorMessage = response.error?.message || 'Failed to delete service';
        console.error('❌ API: Delete failed:', response.error);
        throw new Error(errorMessage);
      }
      
      console.log('✅ API: Service deleted successfully');
      return response.data;
    } catch (error: any) {
      console.error('🚨 API: Service deletion error:', {
        serviceId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Provide more specific error messages based on status code
      if (error.response?.status === 500) {
        throw new Error('Server error occurred while deleting service. This may be due to existing bookings or dependencies.');
      } else if (error.response?.status === 404) {
        throw new Error('Service not found or already deleted.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this service.');
      }
      
      throw new Error(error.message || 'Failed to delete service');
    }
  }

  // Migrate currency data for existing services
  async migrateCurrencyData(): Promise<{ totalServices: number; updatedServices: number; updates: any[] }> {
    const response = await apiClient.post<{ totalServices: number; updatedServices: number; updates: any[] }>('/services/migrate-currency');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to migrate currency data');
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
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    try {
      // Use the existing blocked slots endpoint directly (skip the non-existent /specialists/blocks)
      console.log('📦 Fetching availability blocks from blocked slots endpoint...');
      const response = await apiClient.get<{ blockedSlots: BlockedSlot[] }>(`/specialists/availability/blocked?${params}`);
      if (response.success && response.data) {
        const blocks = response.data.blockedSlots || response.data.data?.blockedSlots || [];
        console.log('📦 getAvailabilityBlocks response:', { response: response.data, extractedBlocks: blocks });
        return Array.isArray(blocks) ? blocks : [];
      }
    } catch (error: any) {
      console.warn('📦 Failed to fetch availability blocks:', error);
    }
    
    return [];
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
    // Convert frontend field names to backend field names
    const backendData = {
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      isAvailable: data.isAvailable,
      reason: data.reason,
      isRecurring: data.recurring, // Note: backend uses isRecurring, not recurring
      recurringDays: data.recurringDays,
      recurringUntil: data.recurringUntil,
    };
    
    console.log('📤 Creating availability block:', backendData);
    
    const response = await apiClient.post<{ message: string; block: BlockedSlot }>('/specialists/blocks', backendData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create availability block');
    }
    
    console.log('✅ Block created successfully:', response.data);
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
    // Convert frontend field names to backend field names
    const backendData = {
      startDateTime: data.startDateTime,
      endDateTime: data.endDateTime,
      isAvailable: data.isAvailable,
      reason: data.reason,
      isRecurring: data.recurring, // Note: backend uses isRecurring, not recurring
      recurringDays: data.recurringDays,
      recurringUntil: data.recurringUntil,
    };
    
    console.log('📤 Updating availability block:', blockId, backendData);
    
    const response = await apiClient.put<{ message: string; block: BlockedSlot }>(`/specialists/blocks/${blockId}`, backendData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update availability block');
    }
    
    console.log('✅ Block updated successfully:', response.data);
    return response.data;
  }

  // Delete availability block
  async deleteAvailabilityBlock(blockId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/specialists/blocks/${blockId}`);
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
  // Get available dates for a specialist (for booking flow)
  async getAvailableDates(specialistId: string): Promise<{ availableDates: string[] }> {
    try {
      console.log('📅 API: Getting available dates for specialist:', specialistId);
      
      const response = await apiClient.get<{ availableDates: string[] }>(
        `/specialists/${specialistId}/available-dates`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get available dates');
      }
      
      console.log('✅ API: Available dates received:', response.data.availableDates);
      return { availableDates: response.data.availableDates || [] };
    } catch (error: any) {
      console.error('❌ API: Error getting available dates:', error);
      throw error;
    }
  }

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
