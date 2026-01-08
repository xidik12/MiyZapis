/**
 * Socket Provider - Manages WebSocket connection and events
 * Adapted for React Native
 */
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectUser, selectIsAuthenticated } from '../store/slices/authSlice';
import {
  updateBookingLocal,
} from '../store/slices/bookingSlice';
import {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
} from '../store/slices/notificationSlice';
import { updatePaymentStatus } from '../store/slices/paymentSlice';
import { socketService } from '../services/socket.service';
import { environment } from '../config/environment';

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
      if (socketService.isSocketConnected()) {
        socketService.disconnect();
        setIsConnected(false);
      }
      return;
    }

    // Connect socket when user is authenticated
    const connectSocket = async () => {
      try {
        socketService.connect(user);
        setIsConnected(true);

        // Join user-specific room
        socketService.joinRoom(`user:${user.id}`);

        // Join role-specific room
        if (user.userType === 'specialist' || user.userType === 'business') {
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
      if (socketService.isSocketConnected()) {
        socketService.disconnect();
        setIsConnected(false);
      }
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isConnected) return;

    // Booking event handlers
    const handleBookingStatusChanged = (data: any) => {
      if (data?.booking) {
        dispatch(updateBookingLocal({
          bookingId: data.booking.id,
          status: data.booking.status,
          booking: data.booking,
        }));
      }
    };

    const handleNewBooking = (data: any) => {
      if (data?.booking) {
        dispatch(updateBookingLocal({
          bookingId: data.booking.id,
          status: data.booking.status,
          booking: data.booking,
        }));
      }
    };

    const handleBookingUpdated = (data: any) => {
      if (data?.booking) {
        dispatch(updateBookingLocal({
          bookingId: data.booking.id,
          status: data.booking.status,
          booking: data.booking,
        }));
      }
    };

    // Notification event handlers
    const handleNewNotification = (data: any) => {
      if (data?.notification) {
        dispatch(addNotification(data.notification));
      }
    };

    const handleNotificationRead = (data: any) => {
      if (data?.notificationId) {
        dispatch(markAsRead(data.notificationId));
      }
    };

    const handleNotificationMarkAll = () => {
      dispatch(markAllAsRead());
    };

    const handleNotificationDeleted = (data: any) => {
      if (data?.notificationId) {
        dispatch(removeNotification(data.notificationId));
      }
    };

    // Payment event handlers
    const handlePaymentStatusChanged = (data: any) => {
      if (data?.payment) {
        dispatch(updatePaymentStatus(data.payment));
      }
    };

    // Unread notifications count - handled automatically by notification slice reducers
    const handleUnreadNotifications = (_data: any) => {
      // Unread count is managed automatically by the notification slice reducers
      // No action needed here
    };

    // Connection status handlers
    const handleConnect = () => {
      setIsConnected(true);
      if (environment.DEBUG) {
        console.log('Socket connected');
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      if (environment.DEBUG) {
        console.log('Socket disconnected');
      }
    };

    // Register event handlers
    socketService.on('booking:status_changed', handleBookingStatusChanged);
    socketService.on('booking:new', handleNewBooking);
    socketService.on('booking:updated', handleBookingUpdated);
    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification:read', handleNotificationRead);
    socketService.on('notification:mark_all_read', handleNotificationMarkAll);
    socketService.on('notification:deleted', handleNotificationDeleted);
    socketService.on('payment:status_changed', handlePaymentStatusChanged);
    socketService.on('unread_notifications', handleUnreadNotifications);
    socketService.on('socket:connected', handleConnect);
    socketService.on('socket:disconnected', handleDisconnect);

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
      socketService.off('socket:connected', handleConnect);
      socketService.off('socket:disconnected', handleDisconnect);
    };
  }, [isConnected, dispatch]);

  return <>{children}</>;
};

