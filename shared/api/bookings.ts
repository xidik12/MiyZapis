// ============================================================
// Bookings API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { Booking, CreateBookingRequest, Pagination, PaginatedResponse } from '../types';

export interface BookingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  specialistId?: string;
  customerId?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
  userType?: 'customer' | 'specialist';
}

export function createBookingsApi(client: SharedApiClient) {
  return {
    async getBookings(filters: BookingFilters = {}) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      return client.get<{ bookings: Booking[]; pagination: Pagination } | PaginatedResponse<Booking>>(
        `/bookings?${params}`,
      );
    },

    async getBooking(id: string) {
      return client.get<Booking>(`/bookings/${id}`);
    },

    async createBooking(data: CreateBookingRequest) {
      return client.post<{ booking: Booking; paymentIntent?: any }>('/bookings', data);
    },

    async updateBooking(id: string, updates: any) {
      return client.put<Booking>(`/bookings/${id}`, updates);
    },

    async cancelBooking(id: string, reason?: string) {
      return client.put<{ booking: Booking; refundAmount?: number }>(`/bookings/${id}/cancel`, { reason });
    },

    async confirmBooking(id: string, data?: { meetingLink?: string; preparationNotes?: string }) {
      return client.post<{ booking: Booking; notificationsSent: string[] }>(`/bookings/${id}/confirm`, data);
    },

    async rejectBooking(id: string, reason: string) {
      return client.put(`/bookings/${id}/reject`, { reason });
    },

    async completeBooking(id: string, data?: { completionNotes?: string; deliverables?: string[] }) {
      return client.post<Booking>(`/bookings/${id}/complete`, data);
    },

    async rescheduleBooking(id: string, data: { newScheduledAt: string; reason?: string }) {
      return client.post<{ booking: Booking; notificationsSent: string[] }>(`/bookings/${id}/reschedule`, data);
    },

    async startBooking(id: string) {
      return client.post<Booking>(`/bookings/${id}/start`);
    },

    async getBookingStats(period?: string) {
      const params = period ? `?period=${period}` : '';
      return client.get(`/bookings/stats${params}`);
    },

    async getUpcomingBookings(limit: number = 10) {
      return client.get<{ bookings: Booking[] }>(`/bookings/upcoming?limit=${limit}`);
    },

    async checkBookingConflicts(specialistId: string, scheduledAt: string, duration: number, excludeBookingId?: string) {
      const params = new URLSearchParams({ specialistId, scheduledAt, duration: duration.toString() });
      if (excludeBookingId) params.append('excludeBookingId', excludeBookingId);
      return client.get<{ hasConflicts: boolean; conflicts: Array<{ bookingId: string; startTime: string; endTime: string }> }>(
        `/bookings/check-conflicts?${params}`,
      );
    },
  };
}

export type BookingsApi = ReturnType<typeof createBookingsApi>;
