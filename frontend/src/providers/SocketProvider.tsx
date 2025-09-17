import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/notificationSlice';
import { updateBookingStatus } from '@/store/slices/bookingSlice';
import { socketService } from '@/services/socket.service';
import { environment } from '@/config/environment';
import { notificationService } from '@/services/notification.service';
import type { 
  SocketEvent, 
  BookingSocketEvent, 
  NotificationSocketEvent,
  PaymentSocketEvent 
} from '@/types';

interface SocketContextType {
  isConnected: boolean;
  socket: typeof socketService | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  socket: null,
  joinRoom: () => {},
  leaveRoom: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect socket if user is not authenticated
      if (socketService.isConnected()) {
        socketService.disconnect();
        setIsConnected(false);
      }
      return;
    }

    // Connect socket when user is authenticated
    const connectSocket = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);

        // Join user-specific room
        socketService.joinRoom(`user:${user.id}`);

        // Join role-specific room
        if (user.userType === 'specialist') {
          socketService.joinRoom(`specialist:${user.id}`);
        } else {
          socketService.joinRoom(`customer:${user.id}`);
        }

        if (environment.DEBUG) {
          console.log('Socket connected and joined rooms');
        }
      } catch (error) {
        console.error('Failed to connect socket:', error);
        setIsConnected(false);
      }
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      if (socketService.isConnected()) {
        socketService.disconnect();
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isConnected) return;

    // Helper: broadcast latest unread count to sync bell badge immediately
    const broadcastUnreadCount = async () => {
      try {
        const { unreadCount } = await notificationService.getUnreadCount();
        try {
          window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount } }));
        } catch {}
      } catch (e) {
        if (environment.DEBUG) console.warn('Failed to refresh unread count:', e);
      }
    };

    // Optimistic increment then reconcile after short delay
    let reconcileTimer: number | null = null;
    const optimisticIncrement = (delta: number = 1) => {
      try {
        window.dispatchEvent(new CustomEvent('notifications:update', { detail: { delta } }));
      } catch {}
      if (reconcileTimer) {
        window.clearTimeout(reconcileTimer);
      }
      reconcileTimer = window.setTimeout(() => {
        broadcastUnreadCount();
        reconcileTimer = null;
      }, 1000);
    };

    // Handle booking events
    const handleBookingStatusChanged = (event: BookingSocketEvent) => {
      if (environment.DEBUG) {
        console.log('Booking status changed:', event);
      }

      dispatch(updateBookingStatus({
        bookingId: event.data.bookingId,
        status: event.data.newStatus!,
        booking: event.data.booking,
      }));

      // Show notification for status change
      const statusMessages: Record<string, string> = {
        confirmed: 'Your booking has been confirmed!',
        cancelled: 'Your booking has been cancelled.',
        in_progress: 'Your booking is now in progress.',
        completed: 'Your booking has been completed.',
        pending_payment: 'Payment is required for your booking.',
      };

      if (event.data.newStatus && statusMessages[event.data.newStatus]) {
        dispatch(addNotification({
          id: `booking-${event.data.bookingId}-${Date.now()}`,
          type: 'booking_status_changed',
          title: 'Booking Update',
          message: statusMessages[event.data.newStatus],
          data: { bookingId: event.data.bookingId },
          isRead: false,
          userId: user!.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        // Optimistically bump the bell, then reconcile
        optimisticIncrement(1);
      }
    };

    const handleNewBooking = (event: BookingSocketEvent) => {
      if (environment.DEBUG) {
        console.log('New booking received:', event);
      }

      // Only show notification for specialists receiving new bookings
      if (user?.userType === 'specialist') {
        dispatch(addNotification({
          id: `new-booking-${event.data.bookingId}-${Date.now()}`,
          type: 'new_booking',
          title: 'New Booking Received!',
          message: 'You have received a new booking request.',
          data: { bookingId: event.data.bookingId },
          isRead: false,
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        optimisticIncrement(1);
      }
    };

    const handleBookingUpdated = (event: BookingSocketEvent) => {
      if (environment.DEBUG) {
        console.log('Booking updated:', event);
      }

      // Update booking in store if provided
      if (event.data.booking) {
        // This would dispatch an action to update the booking in the store
        // dispatch(updateBooking(event.data.booking));
      }
    };

    // Handle notification events
    const handleNewNotification = (event: NotificationSocketEvent) => {
      if (environment.DEBUG) {
        console.log('New notification:', event);
      }

      dispatch(addNotification(event.data.notification));
      optimisticIncrement(1);
    };

    // Handle payment events
    const handlePaymentStatusChanged = (event: PaymentSocketEvent) => {
      if (environment.DEBUG) {
        console.log('Payment status changed:', event);
      }

      // Show notification for payment status
      const paymentMessages: Record<string, string> = {
        succeeded: 'Payment completed successfully!',
        failed: 'Payment failed. Please try again.',
        processing: 'Payment is being processed...',
        cancelled: 'Payment was cancelled.',
      };

      if (paymentMessages[event.data.status]) {
        dispatch(addNotification({
          id: `payment-${event.data.paymentId}-${Date.now()}`,
          type: event.data.status === 'succeeded' ? 'payment_received' : 'payment_failed',
          title: 'Payment Update',
          message: paymentMessages[event.data.status],
          data: { 
            paymentId: event.data.paymentId,
            bookingId: event.data.bookingId,
            amount: event.data.amount,
          },
          isRead: false,
          userId: user!.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        optimisticIncrement(1);
      }
    };

    // Register event handlers
    socketService.on('booking:status_changed', handleBookingStatusChanged);
    socketService.on('booking:new', handleNewBooking);
    socketService.on('booking:updated', handleBookingUpdated);
    socketService.on('notification:new', handleNewNotification);
    // Decrement optimistically on notification read or bulk read events if emitted by server
    const handleNotificationRead = (_data: any) => {
      optimisticIncrement(-1);
    };
    const handleNotificationMarkAll = (_data: any) => {
      try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: 0 } })); } catch {}
      // Reconcile to be sure
      broadcastUnreadCount();
    };
    const handleNotificationDeleted = (_data: any) => {
      // If server indicates deletion of an unread notification, decrement; else reconcile
      optimisticIncrement(-1);
    };
    socketService.on('notification:read', handleNotificationRead);
    socketService.on('notification:mark_all_read', handleNotificationMarkAll);
    socketService.on('notification:deleted', handleNotificationDeleted);
    socketService.on('payment:status_changed', handlePaymentStatusChanged);
    // Exact unread count from backend initial payload
    const handleUnreadNotifications = (data: any) => {
      const count = typeof data?.count === 'number' ? data.count : undefined;
      if (count !== undefined) {
        try { window.dispatchEvent(new CustomEvent('notifications:update', { detail: { unreadCount: count } })); } catch {}
      }
    };
    socketService.on('unread_notifications', handleUnreadNotifications);

    // Handle connection status
    socketService.on('connect', () => {
      setIsConnected(true);
      if (environment.DEBUG) {
        console.log('Socket connected');
      }
    });

    socketService.on('disconnect', () => {
      setIsConnected(false);
      if (environment.DEBUG) {
        console.log('Socket disconnected');
      }
    });

    // Cleanup event listeners
    return () => {
      socketService.off('booking:status_changed', handleBookingStatusChanged);
      socketService.off('booking:new', handleNewBooking);
      socketService.off('booking:updated', handleBookingUpdated);
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification:read', handleNotificationRead);
      socketService.off('notification:mark_all_read', handleNotificationMarkAll);
      socketService.off('notification:deleted', handleNotificationDeleted);
      socketService.off('payment:status_changed', handlePaymentStatusChanged);
      socketService.off('unread_notifications', handleUnreadNotifications);
    };
  }, [isConnected, user, dispatch]);

  const joinRoom = (roomId: string) => {
    if (isConnected) {
      socketService.joinRoom(roomId);
    }
  };

  const leaveRoom = (roomId: string) => {
    if (isConnected) {
      socketService.leaveRoom(roomId);
    }
  };

  const contextValue: SocketContextType = {
    isConnected,
    socket: socketService,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
