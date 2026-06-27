import { apiClient } from './api';
import {
  Specialist,
  Service,
  BlockedSlot,
  SpecialistAnalytics,
  Pagination,
} from '@/types';
import { logger } from '@/utils/logger';

export class SpecialistService {
  // Get specialist profile (for specialists accessing their own profile)
  async getProfile(): Promise<Specialist> {
    const response = await apiClient.get<{ specialist: Specialist }>('/specialists/profile');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist profile');
    }
    return response.data.specialist || response.data;
  }

  // Get specialist by slug (for /s/:slug routing)
  async getBySlugNullable(slug: string): Promise<Specialist | null> {
    try {
      const response = await apiClient.get<{ specialist: any }>(`/specialists/by-slug/${slug}`);
      if (!response.success || !response.data) {
        return null;
      }
      return (response.data.specialist || response.data) as Specialist;
    } catch {
      return null;
    }
  }

  // Get public specialist profile (for customers)
  async getPublicProfile(specialistId: string): Promise<Specialist> {
    const response = await apiClient.get<{ specialist: any }>(`/specialists/${specialistId}/public`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist profile');
    }
    
    // Extract the specialist data from the nested response
    const specialistData = response.data.specialist || response.data;
    if (!specialistData || typeof specialistData !== 'object') {
      throw new Error('Invalid specialist data in response');
    }
    logger.debug('Raw specialist data from API:', specialistData);

    // Check if avatar URLs are accessible (basic validation)
    if (specialistData.user?.avatar && specialistData.user.avatar.includes('/uploads/')) {
      logger.warn('Avatar URL points to uploads directory - may not be accessible if files were lost');
    }
    
    // Transform the response to match frontend expectations
    // Normalize response time to minutes if backend stores milliseconds
    const normalizeResponseTime = (value: unknown): number | undefined => {
      if (value === null || value === undefined) return undefined;
      const n = Number(value);
      if (!isFinite(n) || n <= 0) return undefined;
      // Heuristic: if value looks like milliseconds (> 300), convert to minutes
      return n > 300 ? Math.round(n / 60000) : n;
    };

    const parsedBankDetails = (() => {
      if (!specialistData?.bankDetails) return undefined;
      if (typeof specialistData.bankDetails === 'string') {
        try {
          return JSON.parse(specialistData.bankDetails);
        } catch {
          return undefined;
        }
      }
      return specialistData.bankDetails;
    })();

    const transformedSpecialist = {
      ...specialistData,
      bankDetails: parsedBankDetails,
      // Handle user data nesting
      user: specialistData.user ? {
        ...specialistData.user,
        id: specialistData.user.id || specialistData.userId || specialistData.id,
        firstName: specialistData.user.firstName || specialistData.firstName,
        lastName: specialistData.user.lastName || specialistData.lastName,
        avatar: specialistData.user.avatar || specialistData.avatar,
        isVerified: specialistData.user.isVerified || specialistData.isVerified || false
      } : {
        id: specialistData.userId || specialistData.id,
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
           ? (() => { try { return JSON.parse(specialistData.specialties); } catch { return []; } })()
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
                logger.warn(`Skipping large base64 portfolio image: ${sizeKB}KB (max 488KB). Suggestion: Convert large images to files and upload via backend`);
                return false;
              }
              return true;
            } else if (typeof item === 'object' && item && item.imageUrl && item.imageUrl.startsWith('data:image/')) {
              const sizeKB = Math.round(item.imageUrl.length / 1024);
              if (item.imageUrl.length >= 500000) {
                logger.warn(`Skipping large base64 portfolio image: ${sizeKB}KB (max 488KB). Suggestion: Convert large images to files and upload via backend`);
                return false;
              }
              return true;
            }
            return true; // Keep all non-base64 images
          });

          logger.debug('Portfolio images processed:', {
            original: portfolioData.length,
            filtered: filteredPortfolio.length,
            removed: portfolioData.length - filteredPortfolio.length
          });

          return filteredPortfolio;
        } catch (error) {
          logger.error('Error processing portfolio images:', error);
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

    logger.debug('Transformed specialist data:', transformedSpecialist);
    return transformedSpecialist as unknown as Specialist;
  }

  // Create specialist profile
  async createProfile(data: unknown): Promise<Specialist> {
    const response = await apiClient.post<Specialist>('/specialists/profile', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create specialist profile');
    }
    return response.data;
  }

  // Update specialist profile
  async updateProfile(data: Partial<Specialist>): Promise<Specialist> {
    logger.debug('API: Updating specialist profile...');
    logger.debug('API: Profile data size:', JSON.stringify(data).length, 'chars');

    // Check for large portfolio data
    if ((data as any).portfolio) {
      const portfolioSize = JSON.stringify((data as any).portfolio).length;
      logger.debug('API: Portfolio data size:', portfolioSize, 'chars');
      if (portfolioSize > 1000000) { // 1MB
        logger.warn('API: Portfolio data is very large, this might cause issues');
      }
    }

    const response = await apiClient.put<Specialist>('/specialists/profile', data);
    logger.debug('API: Update response:', response);

    if (!response.success || !response.data) {
      logger.error('API: Profile update failed:', response.error);
      throw new Error(response.error?.message || 'Failed to update specialist profile');
    }

    logger.debug('API: Profile updated successfully');
    return response.data;
  }

  // Upload specialist portfolio images
  async uploadPortfolioImage(file: File): Promise<{ imageUrl: string }> {
    logger.debug('Processing portfolio image:', file.name, 'Size:', file.size);

    // Import fileUploadService dynamically to avoid circular dependencies
    const { fileUploadService } = await import('./fileUpload.service');

    // Use the proper backend file upload service
    const result = await fileUploadService.uploadPortfolioImage(file);

    logger.debug('Portfolio image uploaded successfully:', result.url);
    return { imageUrl: result.url };
  }

  // Get specialist's services (for own profile)
  async getServices(): Promise<Service[]> {
    logger.debug('API: Getting specialist services...');
    const response = await apiClient.get<{services: Service[]}>('/specialists/services');
    logger.debug('API: Response received:', response);

    if (!response.success || !response.data) {
      logger.error('API: Failed response:', response.error);
      throw new Error(response.error?.message || 'Failed to get specialist services');
    }

    const services = response.data.services || [];
    logger.debug('API: Extracted services:', services);
    logger.debug('API: Service IDs:', services.map(s => ({ id: s.id, name: s.name })));
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
      logger.debug('API: Deleting service:', serviceId);

      if (!serviceId || serviceId.trim() === '') {
        throw new Error('Service ID is required for deletion');
      }

      const response = await apiClient.delete<{ message: string }>(`/specialists/services/${serviceId}`);
      logger.debug('API: Delete response:', response);

      if (!response.success || !response.data) {
        const errorMessage = response.error?.message || 'Failed to delete service';
        logger.error('API: Delete failed:', response.error);
        throw new Error(errorMessage);
      }

      logger.debug('API: Service deleted successfully');
      return response.data;
    } catch (error: unknown) {
      const response = (error as any)?.response;
      logger.error('API: Service deletion error:', {
        serviceId,
        error: (error as any).message,
        response: response?.data,
        status: response?.status
      });

      // Provide more specific error messages based on status code
      if (response?.status === 500) {
        throw new Error('Server error occurred while deleting service. This may be due to existing bookings or dependencies.');
      } else if (response?.status === 404) {
        throw new Error('Service not found or already deleted.');
      } else if (response?.status === 403) {
        throw new Error('You do not have permission to delete this service.');
      }

      throw new Error((error as any).message || 'Failed to delete service');
    }
  }

  // Toggle service active status
  async toggleServiceStatus(serviceId: string, isActive: boolean): Promise<Service> {
    logger.debug('API: Toggling service status:', { serviceId, isActive });

    if (!serviceId) {
      throw new Error('Service ID is required');
    }

    const response = await apiClient.patch<{service: Service, message: string}>(`/specialists/services/${serviceId}/status`, { isActive });
    logger.debug('API: Toggle response:', response);

    if (!response.success || !response.data) {
      logger.error('API: Toggle failed:', response.error);
      throw new Error(response.error?.message || 'Failed to update service status');
    }

    logger.debug('API: Service status updated successfully');
    // Extract the service object from the response
    const serviceData = response.data.service || response.data;
    logger.debug('API: Extracted service data:', serviceData);
    return serviceData;
  }

  // Get all availability blocks (both available and blocked)
  async getAvailabilityBlocks(startDate?: string, endDate?: string): Promise<BlockedSlot[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    // Request up to 1000 blocks (enough for a week of 15-minute slots across multiple days)
    params.append('limit', '1000');

    try {
      // Use the correct /specialists/blocks endpoint
      logger.debug('Fetching availability blocks from /specialists/blocks endpoint...');
      const response = await apiClient.get<{ blocks: BlockedSlot[] }>(`/specialists/blocks?${params}`);
      if (response.success && response.data) {
        const blocks = response.data.blocks || [];
        logger.debug('getAvailabilityBlocks response:', {
          blocksCount: blocks.length,
          blocks: blocks.slice(0, 3) // Show first 3 blocks for debugging
        });
        return Array.isArray(blocks) ? blocks : [];
      }
    } catch (error: unknown) {
      logger.warn('Failed to fetch availability blocks:', error);
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

    logger.debug('Creating availability block:', backendData);

    const response = await apiClient.post<{ message: string; block: BlockedSlot }>('/specialists/blocks', backendData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create availability block');
    }

    logger.debug('Block created successfully:', response.data);
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

    logger.debug('Updating availability block:', blockId, backendData);

    const response = await apiClient.put<{ message: string; block: BlockedSlot }>(`/specialists/blocks/${blockId}`, backendData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update availability block');
    }

    logger.debug('Block updated successfully:', response.data);
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

  // Generate availability blocks from working hours
  async generateAvailabilityFromWorkingHours(): Promise<{ message: string; blocksCreated: number }> {
    logger.debug('Generating availability blocks from working hours');
    const response = await apiClient.post<{ message: string; blocksCreated: number }>('/specialists/availability/generate', {});
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to generate availability blocks');
    }
    logger.debug('Generated availability blocks:', response.data);
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

  // Get available time slots for a specific date
  // Get available dates for a specialist (for booking flow)
  async getAvailableDates(specialistId: string): Promise<{ availableDates: Array<{ date: string; dayName: string; workingHours: string; availableSlots: number; totalSlots: number }> }> {
    try {
      logger.debug('API: Getting available dates for specialist:', specialistId);

      const response = await apiClient.get<{ availableDates: Array<{ date: string; dayName: string; workingHours: string; availableSlots: number; totalSlots: number }> }>(
        `/specialists/${specialistId}/available-dates`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get available dates');
      }

      logger.debug('API: Available dates received:', response.data.availableDates);
      return { availableDates: response.data.availableDates || [] };
    } catch (error: unknown) {
      logger.error('API: Error getting available dates:', error);
      throw error;
    }
  }

  async getAvailableSlots(specialistId: string, date: string): Promise<string[]> {
    try {
      logger.debug('API: Getting available slots for specialist:', specialistId, 'date:', date);

      // Add cache-busting timestamp to ensure fresh data
      const cacheBuster = Date.now();
      const response = await apiClient.get<{ availableSlots: string[] }>(
        `/specialists/${specialistId}/slots?date=${date}&_t=${cacheBuster}`
      );

      if (!response.success || !response.data) {
        logger.warn('API: No available slots data, returning empty array');
        // Return empty array instead of throwing error to handle gracefully
        return [];
      }

      const slots = response.data.availableSlots || [];
      logger.debug('API: Available slots received:', slots);
      return slots;
    } catch (error) {
      logger.error('API: Error getting available slots:', error);
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
  // Get client notes
  async getClientNotes(customerId: string): Promise<{ notes: Array<{ id: string; content: string; category: string; updatedAt: string }> }> {
    const response = await apiClient.get<{ notes: Array<{ id: string; content: string; category: string; updatedAt: string }> }>(`/specialists/clients/${customerId}/notes`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get client notes');
    }
    return response.data;
  }

  // Create client note
  async createClientNote(customerId: string, content: string, category: string = 'general'): Promise<{ note: { id: string; content: string; category: string; updatedAt: string } }> {
    const response = await apiClient.post<{ note: { id: string; content: string; category: string; updatedAt: string } }>(`/specialists/clients/${customerId}/notes`, { content, category });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create client note');
    }
    return response.data;
  }

  // Delete client note
  async deleteClientNote(noteId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/specialists/clients/notes/${noteId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete client note');
    }
    return response.data;
  }

  // Complete specialist onboarding
  async completeOnboarding(): Promise<{ message: string; onboardingCompleted: boolean }> {
    const response = await apiClient.post<{ message: string; onboardingCompleted: boolean }>('/specialists/onboarding/complete');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to complete onboarding');
    }
    return response.data;
  }

  // Get specialist by slug
  async getBySlug(slug: string): Promise<Specialist> {
    const response = await apiClient.get<{ specialist: Specialist }>(`/specialists/by-slug/${slug}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Specialist not found');
    }
    return response.data.specialist || response.data;
  }

  // Get public before/after photos for a specialist
  async getPublicBeforeAfterPhotos(specialistId: string): Promise<any[]> {
    try {
      const response = await apiClient.get<{ photos: any[] }>(`/specialists/${specialistId}/before-after`);
      return response.data?.photos || [];
    } catch {
      return [];
    }
  }

}

export const specialistService = new SpecialistService();
