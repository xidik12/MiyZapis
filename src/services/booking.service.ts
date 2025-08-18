import { apiClient } from './api';
import {
  Booking,
  CreateBookingRequest,
  BookingStatus,
  RescheduleRecord,
  PaymentIntent,
  Pagination,
  ApiResponse
} from '@/types';

export interface BookingFilters {
  status?: BookingStatus;
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

  // Get user's bookings
  async getBookings(filters: BookingFilters = {}): Promise<{ bookings: Booking[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
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

  // Update booking
  async updateBooking(bookingId: string, data: Partial<Booking>): Promise<Booking> {
    const response = await apiClient.put<Booking>(`/bookings/${bookingId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update booking');
    }
    return response.data;
  }

  // Cancel booking
  async cancelBooking(bookingId: string, reason?: string): Promise<{ booking: Booking; refundAmount?: number }> {
    const response = await apiClient.delete<{ booking: Booking; refundAmount?: number }>(`/bookings/${bookingId}`, {
      data: { reason }
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

  // Start booking session (for in-progress status)
  async startBooking(bookingId: string): Promise<Booking> {
    const response = await apiClient.post<Booking>(`/bookings/${bookingId}/start`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to start booking');
    }
    return response.data;
  }

  // Get booking history for a customer or specialist
  async getBookingHistory(filters: BookingFilters = {}): Promise<{ bookings: Booking[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{ bookings: Booking[]; pagination: Pagination }>(`/bookings/history?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get booking history');
    }
    return response.data;
  }

  // Get upcoming bookings
  async getUpcomingBookings(limit: number = 10): Promise<Booking[]> {
    const response = await apiClient.get<{ bookings: Booking[] }>(`/bookings/upcoming?limit=${limit}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get upcoming bookings');
    }
    return response.data.bookings;
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

  // Send booking reminder
  async sendBookingReminder(bookingId: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/bookings/${bookingId}/reminder`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send booking reminder');
    }
    return response.data;
  }

  // Check if booking can be cancelled
  async canCancelBooking(bookingId: string): Promise<{ canCancel: boolean; reason?: string; deadline?: string }> {
    const response = await apiClient.get<{ canCancel: boolean; reason?: string; deadline?: string }>(`/bookings/${bookingId}/can-cancel`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check cancellation eligibility');
    }
    return response.data;
  }

  // Check if booking can be rescheduled
  async canRescheduleBooking(bookingId: string): Promise<{ canReschedule: boolean; reason?: string; deadline?: string }> {
    const response = await apiClient.get<{ canReschedule: boolean; reason?: string; deadline?: string }>(`/bookings/${bookingId}/can-reschedule`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check reschedule eligibility');
    }
    return response.data;
  }

  // Get booking conflicts for a time slot
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

  // Export bookings data
  async exportBookings(filters: BookingFilters = {}, format: 'csv' | 'pdf' = 'csv'): Promise<void> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    params.append('format', format);

    await apiClient.download(`/bookings/export?${params}`, `bookings.${format}`);
  }
}

export const bookingService = new BookingService();