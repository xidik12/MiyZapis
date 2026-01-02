import { logger } from '@/utils/logger';
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';
import { environment } from '@/config/environment';
import {
  BookingSocketEvent,
  NotificationSocketEvent,
  PaymentSocketEvent,
  SocketEvent,
  User
} from '@/types';

export type SocketEventHandler<T = any> = (data: T) => void;

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventHandlers = new Map<string, Set<SocketEventHandler>>();

  // Initialize socket connection
  connect(user?: User): void {
    if (this.socket?.connected) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      logger.warn('No auth token available for socket connection');
      return;
    }

    try {
      logger.debug('[Socket] Connecting to:', environment.WS_URL);
      logger.debug('[Socket] Token available:', !!token);

      this.socket = io(environment.WS_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        forceNew: true,
      });

      this.setupEventListeners();

      logger.debug('[Socket] Attempting to connect to', environment.WS_URL);
    } catch (error) {
      logger.error('[Socket] Connection error:', error);
    }
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventHandlers.clear();
      
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Disconnected');
      }
    }
  }

  // Check if socket is connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Setup core socket event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Connected successfully');
      }
      
      this.emit('socket:connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Disconnected:', reason);
      }
      
      this.emit('socket:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;

      logger.error('[Socket] Connection error:', error);
      logger.error('[Socket] Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      logger.error('[Socket] WS_URL:', environment.WS_URL);
      logger.error('[Socket] Attempt #:', this.reconnectAttempts);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('[Socket] Max reconnection attempts reached');
        this.emit('socket:connection_failed', { error: error.message });
      }
    });

    // Authentication events
    this.socket.on('auth:success', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Authentication successful:', data);
      }
    });

    this.socket.on('auth:error', (error) => {
      logger.error('[Socket] Authentication error:', error);
      this.emit('socket:auth_error', { error });
    });

    // Booking events
    this.socket.on('booking:status_changed', (data: BookingSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Booking status changed:', data);
      }
      this.emit('booking:status_changed', data);
    });

    this.socket.on('booking:new', (data: BookingSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] New booking:', data);
      }
      this.emit('booking:new', data);
    });

    this.socket.on('booking:updated', (data: BookingSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Booking updated:', data);
      }
      this.emit('booking:updated', data);
    });

    this.socket.on('booking:reminder', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Booking reminder:', data);
      }
      this.emit('booking:reminder', data);
    });

    // Payment events
    this.socket.on('payment:status_changed', (data: PaymentSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Payment status changed:', data);
      }
      this.emit('payment:status_changed', data);
    });

    // Notification events
    // Backend may emit a generic 'notification' event
    this.socket.on('notification', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Notification:', data);
      }

      // Check if this is a payment completion notification
      if (data.type === 'PAYMENT_COMPLETED') {
        if (import.meta.env.VITE_DEBUG === 'true') {
          logger.debug('[Socket] Payment completion notification:', data);
        }
        this.emit('payment:completed', data.data);
      }

      // Also emit as general notification
      this.emit('notification:new', data);
    });

    this.socket.on('notification:new', (data: NotificationSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] New notification:', data);
      }
      this.emit('notification:new', data);
    });

    // Optional notification read events (if server emits)
    // Underscore variant from backend
    this.socket.on('notification_read', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Notification read:', data);
      }
      this.emit('notification:read', data);
    });

    this.socket.on('notification:read', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Notification read:', data);
      }
      this.emit('notification:read', data);
    });

    this.socket.on('notification:mark_all_read', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Notifications mark all read:', data);
      }
      this.emit('notification:mark_all_read', data);
    });

    this.socket.on('notification:deleted', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Notification deleted:', data);
      }
      this.emit('notification:deleted', data);
    });

    // Server initial unread notifications count
    this.socket.on('unread_notifications', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Unread notifications count:', data);
      }
      this.emit('unread_notifications', data);
    });

    // Specialist availability events
    this.socket.on('availability:updated', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] Availability updated:', data);
      }
      this.emit('availability:updated', data);
    });

    // Chat/messaging events (if implemented)
    this.socket.on('message:new', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] New message:', data);
      }
      this.emit('message:new', data);
    });

    this.socket.on('message:typing', (data) => {
      this.emit('message:typing', data);
    });

    // Review events
    this.socket.on('review:new', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] New review:', data);
      }
      this.emit('review:new', data);
    });

    // System events
    this.socket.on('system:maintenance', (data) => {
      logger.warn('[Socket] System maintenance:', data);
      this.emit('system:maintenance', data);
    });

    this.socket.on('system:announcement', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug('[Socket] System announcement:', data);
      }
      this.emit('system:announcement', data);
    });
  }

  // Subscribe to socket events
  on<T = any>(event: string, handler: SocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  // Enhanced subscription for payment events with auto-retry
  subscribeToPayment(paymentId: string, handler: SocketEventHandler): () => void {
    // Ensure connection is active
    if (!this.isSocketConnected()) {
      logger.debug('[Socket] Attempting to reconnect for payment subscription');
      this.ensureConnection();
    }

    // Subscribe to both specific and general payment events
    this.on('payment:completed', handler);
    this.on('notification', (data: any) => {
      if (data.type === 'PAYMENT_COMPLETED' && data.data?.paymentId === paymentId) {
        handler(data.data);
      }
    });

    // Join payment-specific room if connected
    if (this.isSocketConnected()) {
      this.send('payment:subscribe', { paymentId });
    }

    // Return unsubscribe function
    return () => {
      this.off('payment:completed', handler);
      if (this.isSocketConnected()) {
        this.send('payment:unsubscribe', { paymentId });
      }
    };
  }

  // Ensure WebSocket connection with retry
  ensureConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isSocketConnected()) {
        resolve(true);
        return;
      }

      // Try to reconnect
      const token = getAuthToken();
      if (!token) {
        logger.warn('[Socket] No auth token for reconnection');
        resolve(false);
        return;
      }

      // Set up one-time connection listener
      const onConnect = () => {
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
        resolve(true);
      };

      const onError = () => {
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
        resolve(false);
      };

      // Attempt reconnection
      try {
        if (!this.socket || this.socket.disconnected) {
          this.connect();
        } else {
          this.socket.connect();
        }

        this.socket?.on('connect', onConnect);
        this.socket?.on('connect_error', onError);

        // Timeout after 5 seconds
        setTimeout(() => {
          this.socket?.off('connect', onConnect);
          this.socket?.off('connect_error', onError);
          if (!this.isSocketConnected()) {
            resolve(false);
          }
        }, 5000);
      } catch (error) {
        logger.error('[Socket] Error during reconnection:', error);
        resolve(false);
      }
    });
  }

  // Unsubscribe from socket events
  off<T = any>(event: string, handler: SocketEventHandler<T>): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    }
  }

  // Emit events to registered handlers
  private emit<T = any>(event: string, data: T): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          logger.error(`[Socket] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Send data to server
  send(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      
      if (import.meta.env.VITE_DEBUG === 'true') {
        logger.debug(`[Socket] Sent ${event}:`, data);
      }
    } else {
      logger.warn(`[Socket] Cannot send ${event}: not connected`);
    }
  }

  // Join a room (for specialist or customer specific events)
  joinRoom(roomId: string): void {
    this.send('join:room', { roomId });
  }

  // Leave a room
  leaveRoom(roomId: string): void {
    this.send('leave:room', { roomId });
  }

  // Update user presence status
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    this.send('presence:update', { status });
  }

  // Send typing indicator
  sendTyping(roomId: string, isTyping: boolean): void {
    this.send('typing', { roomId, isTyping });
  }

  // Request real-time updates for a booking
  subscribeToBooking(bookingId: string): void {
    this.send('booking:subscribe', { bookingId });
  }

  // Unsubscribe from booking updates
  unsubscribeFromBooking(bookingId: string): void {
    this.send('booking:unsubscribe', { bookingId });
  }

  // Subscribe to availability updates for a specialist
  subscribeToAvailability(specialistId: string): void {
    this.send('availability:subscribe', { specialistId });
  }

  // Unsubscribe from availability updates
  unsubscribeFromAvailability(specialistId: string): void {
    this.send('availability:unsubscribe', { specialistId });
  }

  // Get connection statistics
  getConnectionStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
    eventHandlersCount: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      eventHandlersCount: this.eventHandlers.size,
    };
  }

  // Manually trigger reconnection
  reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  // Set custom reconnection parameters
  setReconnectionConfig(config: {
    maxAttempts?: number;
    delay?: number;
    delayMax?: number;
  }): void {
    if (config.maxAttempts !== undefined) {
      this.maxReconnectAttempts = config.maxAttempts;
    }
    if (config.delay !== undefined) {
      this.reconnectDelay = config.delay;
    }
    
    if (this.socket) {
      if (config.maxAttempts !== undefined) {
        this.socket.io.opts.reconnectionAttempts = config.maxAttempts;
      }
      if (config.delay !== undefined) {
        this.socket.io.opts.reconnectionDelay = config.delay;
      }
      if (config.delayMax !== undefined) {
        this.socket.io.opts.reconnectionDelayMax = config.delayMax;
      }
    }
  }
}

// Create singleton instance
export const socketService = new SocketService();

// Export convenience methods for common use cases
export const connectSocket = (user?: User) => socketService.connect(user);
export const disconnectSocket = () => socketService.disconnect();
export const isSocketConnected = () => socketService.isSocketConnected();

// Event subscription helpers
export const onBookingUpdate = (handler: SocketEventHandler<BookingSocketEvent['data']>) => {
  socketService.on('booking:status_changed', handler);
  return () => socketService.off('booking:status_changed', handler);
};

export const onNewNotification = (handler: SocketEventHandler<NotificationSocketEvent['data']>) => {
  socketService.on('notification:new', handler);
  return () => socketService.off('notification:new', handler);
};

export const onPaymentUpdate = (handler: SocketEventHandler<PaymentSocketEvent['data']>) => {
  socketService.on('payment:status_changed', handler);
  return () => socketService.off('payment:status_changed', handler);
};

export const onAvailabilityUpdate = (handler: SocketEventHandler<any>) => {
  socketService.on('availability:updated', handler);
  return () => socketService.off('availability:updated', handler);
};

// Enhanced payment subscription helper
export const subscribeToPaymentUpdates = (paymentId: string, handler: SocketEventHandler<PaymentSocketEvent['data']>) => {
  return socketService.subscribeToPayment(paymentId, handler);
};

// Connection helpers
export const ensureSocketConnection = () => socketService.ensureConnection();

export default socketService;
