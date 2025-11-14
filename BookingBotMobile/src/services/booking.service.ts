// Booking service - adapted for React Native
import { apiClient } from './api';
import {
  Booking,
  CreateBookingRequest,
  BookingStatus,
  RescheduleRecord,
  PaymentIntent,
  Pagination,
  ApiResponse,
} from '../types';

export interface BookingFilters {
  status?: BookingStatus | BookingStatus[] | string;
  startDate?: string;
  endDate?: string;
  specialistId?: string;
  customerId?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

export class BookingService {
  // Create new booking
  async createBooking(data: CreateBookingRequest): Promise<{ booking: Booking; paymentIntent?: PaymentIntent }> {
    const response = await apiClient.post<{ booking: Booking; paymentIntent?: PaymentIntent }>('/bookings', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create booking');
    }
    return response.data;
  }

  // Update booking
  async updateBooking(bookingId: string, data: { 
    status?: string; 
    specialistNotes?: string; 
    customerNotes?: string; 
    preparationNotes?: string; 
    completionNotes?: string; 
  }): Promise<Booking> {
    const response = await apiClient.put<Booking>(`/bookings/${bookingId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update booking');
    }
    return response.data;
  }

  // Get user's bookings
  async getBookings(filters: BookingFilters = {}, userType: 'customer' | 'specialist' = 'customer'): Promise<{ bookings: Booking[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    params.append('userType', userType);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'status' && Array.isArray(value)) {
          value.forEach(v => params.append('status', v.toString()));
        } else {
          params.append(key, value.toString());
        }
      }
    });

    const response = await apiClient.get<{ bookings: Booking[]; pagination: Pagination }>(`/bookings?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get bookings');
    }
    return response.data;
  }

  // Get specific booking details
  async getBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.get<Booking>(`/bookings/${bookingId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get booking details');
    }
    return response.data;
  }

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string): Promise<{ booking: Booking; refundAmount?: number }> {
    const response = await apiClient.put<{ booking: Booking; refundAmount?: number }>(`/bookings/${bookingId}/cancel`, {
      reason
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to cancel booking');
    }
    return response.data;
  }

  // Specialist confirms booking
  async confirmBooking(bookingId: string, data: {
    meetingLink?: string;
    preparationNotes?: string;
  }): Promise<{ booking: Booking; notificationsSent: string[] }> {
    const response = await apiClient.post<{ booking: Booking; notificationsSent: string[] }>(`/bookings/${bookingId}/confirm`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to confirm booking');
    }
    return response.data;
  }

  // Mark booking as completed
  async completeBooking(bookingId: string, data: {
    completionNotes?: string;
    deliverables?: string[];
  }): Promise<Booking> {
    const response = await apiClient.post<Booking>(`/bookings/${bookingId}/complete`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to complete booking');
    }
    return response.data;
  }

  // Reschedule booking
  async rescheduleBooking(bookingId: string, data: {
    newScheduledAt: string;
    reason?: string;
  }): Promise<{ booking: Booking; notificationsSent: string[] }> {
    const response = await apiClient.post<{ booking: Booking; notificationsSent: string[] }>(`/bookings/${bookingId}/reschedule`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to reschedule booking');
    }
    return response.data;
  }

  // Start booking session
  async startBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.post<Booking>(`/bookings/${bookingId}/start`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to start booking');
    }
    return response.data;
  }

  // Get upcoming bookings
  async getUpcomingBookings(limit: number = 10): Promise<Booking[]> {
    const response = await apiClient.get<{ bookings: Booking[] }>(`/bookings/upcoming?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get upcoming bookings');
    }
    return response.data.bookings || [];
  }

  // Get booking statistics
  async getBookingStats(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageRating: number;
    completionRate: number;
  }> {
    const response = await apiClient.get(`/bookings/stats?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get booking statistics');
    }
    return response.data;
  }

  // Check booking conflicts
  async checkBookingConflicts(specialistId: string, scheduledAt: string, duration: number, excludeBookingId?: string): Promise<{
    hasConflicts: boolean;
    conflicts: Array<{ bookingId: string; startTime: string; endTime: string }>;
  }> {
    const params = new URLSearchParams({
      specialistId,
      scheduledAt,
      duration: duration.toString(),
    });

    if (excludeBookingId) {
      params.append('excludeBookingId', excludeBookingId);
    }

    const response = await apiClient.get(`/bookings/check-conflicts?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check booking conflicts');
    }
    return response.data;
  }

  // Get availability for booking
  async getAvailability(specialistId: string, startDate: string, endDate: string, serviceId?: string): Promise<{
    availableSlots: Array<{ startTime: string; endTime: string; available: boolean }>;
  }> {
    const params = new URLSearchParams({
      specialistId,
      startDate,
      endDate,
    });
    if (serviceId) {
      params.append('serviceId', serviceId);
    }

    const response = await apiClient.get(`/bookings/availability?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get availability');
    }
    return response.data;
  }
}

export const bookingService = new BookingService();

