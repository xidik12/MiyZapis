import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/components/common/WebSocketProvider';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { Booking } from '@/types';

interface BookingUpdate {
  id: string;
  status: string;
  changes: Record<string, any>;
  updatedBy: 'customer' | 'specialist' | 'system';
}

export const useRealTimeBookings = () => {
  const { subscribe, unsubscribe, send } = useWebSocket();
  const { user, hapticFeedback, showAlert } = useTelegram();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle booking updates
  const handleBookingUpdate = useCallback((update: BookingUpdate) => {
    setBookings(prevBookings => {
      return prevBookings.map(booking => {
        if (booking.id === update.id) {
          const updatedBooking = {
            ...booking,
            ...update.changes,
            status: update.status as any,
            updatedAt: new Date().toISOString()
          };
          
          // Show notification for significant changes
          if (update.updatedBy !== 'customer') {
            showNotificationForBookingUpdate(updatedBooking, update);
          }
          
          return updatedBooking;
        }
        return booking;
      });
    });
  }, [hapticFeedback, showAlert]);

  // Handle booking confirmation
  const handleBookingConfirmed = useCallback((update: BookingUpdate) => {
    hapticFeedback.notificationSuccess();
    handleBookingUpdate(update);
  }, [handleBookingUpdate, hapticFeedback]);

  // Handle booking cancellation
  const handleBookingCancelled = useCallback((update: BookingUpdate) => {
    hapticFeedback.notificationError();
    handleBookingUpdate(update);
  }, [handleBookingUpdate, hapticFeedback]);

  // Handle booking reminders
  const handleBookingReminder = useCallback((data: any) => {
    hapticFeedback.notificationWarning();
    showAlert(`Reminder: You have an appointment in ${data.timeUntil}`);
  }, [hapticFeedback, showAlert]);

  // Show notification for booking updates
  const showNotificationForBookingUpdate = useCallback(async (booking: Booking, update: BookingUpdate) => {
    let message = '';
    
    switch (update.status) {
      case 'CONFIRMED':
        message = `Your booking for ${booking.service.name} has been confirmed!`;
        break;
      case 'CANCELLED':
        message = `Your booking for ${booking.service.name} has been cancelled.`;
        break;
      case 'RESCHEDULED':
        message = `Your booking for ${booking.service.name} has been rescheduled.`;
        break;
      case 'COMPLETED':
        message = `Your booking for ${booking.service.name} is complete. Please rate your experience!`;
        break;
      default:
        message = `Your booking for ${booking.service.name} has been updated.`;
    }
    
    await showAlert(message);
  }, [showAlert]);

  // Fetch initial bookings
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('booking_app_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Subscribe to booking updates for user
  const subscribeToUserBookings = useCallback(() => {
    if (!user) return;
    
    // Subscribe to user-specific booking events
    subscribe('booking_updated', handleBookingUpdate);
    subscribe('booking_confirmed', handleBookingConfirmed);
    subscribe('booking_cancelled', handleBookingCancelled);
    subscribe('booking_reminder', handleBookingReminder);
    
    return () => {
      unsubscribe('booking_updated', handleBookingUpdate);
      unsubscribe('booking_confirmed', handleBookingConfirmed);
      unsubscribe('booking_cancelled', handleBookingCancelled);
      unsubscribe('booking_reminder', handleBookingReminder);
    };
  }, [
    user,
    subscribe,
    unsubscribe,
    handleBookingUpdate,
    handleBookingConfirmed,
    handleBookingCancelled,
    handleBookingReminder
  ]);

  // Subscribe to specific booking
  const subscribeToBooking = useCallback((bookingId: string) => {
    send('subscribe_booking', { bookingId });
  }, [send]);

  // Unsubscribe from specific booking
  const unsubscribeFromBooking = useCallback((bookingId: string) => {
    send('unsubscribe_booking', { bookingId });
  }, [send]);

  // Update booking status
  const updateBookingStatus = useCallback((bookingId: string, status: string, data?: any) => {
    send('update_booking_status', { bookingId, status, data });
  }, [send]);

  // Cancel booking
  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    try {
      updateBookingStatus(bookingId, 'CANCELLED', { reason });
      
      // Also make API call for immediate update
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('booking_app_token')}`
        },
        body: JSON.stringify({ reason })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return false;
    }
  }, [updateBookingStatus]);

  // Reschedule booking
  const rescheduleBooking = useCallback(async (
    bookingId: string, 
    newDate: string, 
    newTime: string,
    reason?: string
  ) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('booking_app_token')}`
        },
        body: JSON.stringify({ 
          newDate, 
          newTime, 
          reason 
        })
      });
      
      if (response.ok) {
        updateBookingStatus(bookingId, 'RESCHEDULED', { 
          newDate, 
          newTime, 
          reason 
        });
      }
      
      return response.ok;
    } catch (error) {
      console.error('Failed to reschedule booking:', error);
      return false;
    }
  }, [updateBookingStatus]);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchBookings();
      const cleanup = subscribeToUserBookings();
      return cleanup;
    }
  }, [user, fetchBookings, subscribeToUserBookings]);

  return {
    bookings,
    isLoading,
    subscribeToBooking,
    unsubscribeFromBooking,
    updateBookingStatus,
    cancelBooking,
    rescheduleBooking,
    refreshBookings: fetchBookings
  };
};