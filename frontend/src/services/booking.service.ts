import { apiClient } from './api';
import {
  Booking,
  CreateBookingRequest,
  BookingStatus,
  PaymentIntent,
  Pagination} from '@/types';

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
    console.log('📤 BookingService: Creating booking with data:', data);
    
    try {
      // Optional: Check for conflicts before creating (client-side validation)
      if (data.specialistId && data.scheduledAt && data.duration) {
        try {
          const conflicts = await this.checkBookingConflicts(
            data.specialistId, 
            data.scheduledAt, 
            data.duration
          );
          
          if (conflicts.hasConflicts) {
            console.warn('⚠️ BookingService: Conflicts detected before booking creation:', conflicts.conflicts);
            throw new Error('Time slot conflicts detected. Please choose a different time.');
          }
        } catch (conflictError) {
          // If conflict check fails, continue with booking (backend will handle it)
          console.warn('⚠️ BookingService: Could not check conflicts, proceeding with booking:', conflictError);
        }
      }
      
      const response = await apiClient.post<{ booking: Booking; paymentIntent?: PaymentIntent }>('/bookings', data);
      console.log('📦 BookingService: Create booking response:', response);
      
      if (!response.success || !response.data) {
        console.error('❌ BookingService: Failed to create booking:', response.error);
        const error = new Error(response.error?.message || 'Failed to create booking');
        (error as any).response = { status: response.error?.code === 'BOOKING_CONFLICT' ? 409 : 400, data: response.error };
        throw error;
      }
      
      console.log('✅ BookingService: Booking created successfully');
      return response.data;
    } catch (error: unknown) {
      const response = (error as any)?.response;
      console.error('❌ BookingService: Booking creation failed:', error);

      // Re-throw with proper error structure for Redux to handle
      if (response) {
        throw error; // Already has response structure
      } else {
        const wrappedError = new Error((error as any).message || 'Failed to create booking');
        (wrappedError as any).response = {
          status: (error as any).message?.includes('conflicts detected') ? 409 : 500,
          data: { error: (error as any).message }
        };
        throw wrappedError;
      }
    }
  }

  // Create a recurring booking series
  async createRecurringBooking(data: CreateBookingRequest & {
    recurrence: {
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      daysOfWeek?: number[];
      endType: 'never' | 'after' | 'on';
      occurrences?: number;
      endDate?: string;
    };
  }): Promise<{ parentBooking: Booking; childrenCount: number; message: string }> {
    console.log('BookingService: Creating recurring booking with data:', data);

    try {
      const response = await apiClient.post<{ parentBooking: Booking; childrenCount: number; message: string }>(
        '/bookings/recurring',
        {
          ...data,
          recurrence: {
            frequency: data.recurrence.frequency,
            daysOfWeek: data.recurrence.daysOfWeek,
            endType: data.recurrence.endType,
            endAfterCount: data.recurrence.occurrences,
            endDate: data.recurrence.endDate,
          },
        }
      );
      console.log('BookingService: Recurring booking response:', response);

      if (!response.success || !response.data) {
        console.error('BookingService: Failed to create recurring booking:', response.error);
        throw new Error(response.error?.message || 'Failed to create recurring booking');
      }

      console.log('BookingService: Recurring booking created successfully');
      return response.data;
    } catch (error: unknown) {
      const response = (error as any)?.response;
      console.error('BookingService: Recurring booking creation failed:', error);
      if (response) {
        throw error;
      }
      const wrappedError = new Error((error as any).message || 'Failed to create recurring booking');
      (wrappedError as any).response = {
        status: 500,
        data: { error: (error as any).message },
      };
      throw wrappedError;
    }
  }

  // Update booking (status, notes, etc.)
  async updateBooking(bookingId: string, data: { status?: string; specialistNotes?: string; customerNotes?: string; preparationNotes?: string; completionNotes?: string; }): Promise<Booking> {
    console.log('📤 BookingService: Updating booking:', bookingId, data);
    const response = await apiClient.put<Booking>(`/bookings/${bookingId}`, data);
    console.log('📦 BookingService: Update booking response:', response);
    
    if (!response.success || !response.data) {
      console.error('❌ BookingService: Failed to update booking:', response.error);
      throw new Error(response.error?.message || 'Failed to update booking');
    }
    
    console.log('✅ BookingService: Booking updated successfully');
    return response.data;
  }

  // Create booking after payment is confirmed (payment-first approach)
  async createBookingWithPayment(data: CreateBookingRequest & { paymentId: string }): Promise<{ booking: Booking }> {
    console.log('📤 BookingService: Creating booking with confirmed payment:', data);

    try {
      const response = await apiClient.post<{ booking: Booking }>('/bookings/with-payment', data);
      console.log('📦 BookingService: Create booking with payment response:', response);

      if (!response.success || !response.data) {
        console.error('❌ BookingService: Failed to create booking with payment:', response.error);
        throw new Error(response.error?.message || 'Failed to create booking');
      }

      console.log('✅ BookingService: Booking created with payment successfully');
      return response.data;
    } catch (error: unknown) {
      console.error('❌ BookingService: Booking with payment creation failed:', error);
      throw error;
    }
  }

  // Complete booking with payment confirmation
  async completeBookingWithPayment(bookingId: string, data: {
    paymentConfirmed: boolean;
    completionNotes?: string;
    specialistNotes?: string;
    totalAmount?: number; // actual amount charged (may differ from the listed price)
  }): Promise<Booking> {
    console.log('📤 BookingService: Completing booking with payment:', bookingId, data);
    const response = await apiClient.post<Booking>(`/bookings/${bookingId}/complete`, data);
    console.log('📦 BookingService: Complete booking response:', response);

    if (!response.success || !response.data) {
      console.error('❌ BookingService: Failed to complete booking:', response.error);
      throw new Error(response.error?.message || 'Failed to complete booking');
    }

    console.log('✅ BookingService: Booking completed successfully');
    return response.data;
  }

  // Get user's bookings
  async getBookings(filters: BookingFilters = {}, userType: 'customer' | 'specialist' = 'customer'): Promise<{ bookings: Booking[]; pagination: Pagination }> {
    const params = new URLSearchParams();
    
    // Add userType parameter - this is crucial for the backend to determine filtering
    params.append('userType', userType);
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    console.log('📡 BookingService: Fetching bookings with userType:', userType, 'filters:', filters);
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

  // Specialist marks a confirmed booking as a no-show.
  // No-show protection — POLICY/TRACKING only: the backend computes + records the
  // no-show fee and forfeits any required deposit, but no card is charged (the
  // platform has no live payments yet). A future payments module collects it.
  async markNoShow(bookingId: string, notes?: string): Promise<{ booking: Booking }> {
    const response = await apiClient.post<{ booking: Booking }>(`/bookings/${bookingId}/no-show`, { notes });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark booking as no-show');
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

    const response = await apiClient.get<{
      hasConflicts: boolean;
      conflicts: Array<{ bookingId: string; startTime: string; endTime: string }>;
    }>(`/bookings/check-conflicts?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check booking conflicts');
    }
    return response.data;
  }

}

export const bookingService = new BookingService();