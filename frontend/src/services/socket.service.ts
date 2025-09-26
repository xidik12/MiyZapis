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
      console.warn('No auth token available for socket connection');
      return;
    }

    try {
      console.log('[Socket] Connecting to:', environment.WS_URL);
      console.log('[Socket] Token available:', !!token);

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

      console.log('[Socket] Attempting to connect to', environment.WS_URL);
    } catch (error) {
      console.error('[Socket] Connection error:', error);
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
        console.log('[Socket] Disconnected');
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
        console.log('[Socket] Connected successfully');
      }
      
      this.emit('socket:connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Disconnected:', reason);
      }
      
      this.emit('socket:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      this.reconnectAttempts++;

      console.error('[Socket] Connection error:', error);
      console.error('[Socket] Error details:', {
        message: error.message,
        description: error.description,
        context: error.context,
        type: error.type
      });
      console.error('[Socket] WS_URL:', environment.WS_URL);
      console.error('[Socket] Attempt #:', this.reconnectAttempts);

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] Max reconnection attempts reached');
        this.emit('socket:connection_failed', { error: error.message });
      }
    });

    // Authentication events
    this.socket.on('auth:success', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Authentication successful:', data);
      }
    });

    this.socket.on('auth:error', (error) => {
      console.error('[Socket] Authentication error:', error);
      this.emit('socket:auth_error', { error });
    });

    // Booking events
    this.socket.on('booking:status_changed', (data: BookingSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Booking status changed:', data);
      }
      this.emit('booking:status_changed', data);
    });

    this.socket.on('booking:new', (data: BookingSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] New booking:', data);
      }
      this.emit('booking:new', data);
    });

    this.socket.on('booking:updated', (data: BookingSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Booking updated:', data);
      }
      this.emit('booking:updated', data);
    });

    this.socket.on('booking:reminder', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Booking reminder:', data);
      }
      this.emit('booking:reminder', data);
    });

    // Payment events
    this.socket.on('payment:status_changed', (data: PaymentSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Payment status changed:', data);
      }
      this.emit('payment:status_changed', data);
    });

    // Notification events
    // Backend may emit a generic 'notification' event
    this.socket.on('notification', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Notification:', data);
      }

      // Check if this is a payment completion notification
      if (data.type === 'PAYMENT_COMPLETED') {
        if (import.meta.env.VITE_DEBUG === 'true') {
          console.log('[Socket] Payment completion notification:', data);
        }
        this.emit('payment:completed', data.data);
      }

      // Also emit as general notification
      this.emit('notification:new', data);
    });

    this.socket.on('notification:new', (data: NotificationSocketEvent['data']) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] New notification:', data);
      }
      this.emit('notification:new', data);
    });

    // Optional notification read events (if server emits)
    // Underscore variant from backend
    this.socket.on('notification_read', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Notification read:', data);
      }
      this.emit('notification:read', data);
    });

    this.socket.on('notification:read', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Notification read:', data);
      }
      this.emit('notification:read', data);
    });

    this.socket.on('notification:mark_all_read', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Notifications mark all read:', data);
      }
      this.emit('notification:mark_all_read', data);
    });

    this.socket.on('notification:deleted', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Notification deleted:', data);
      }
      this.emit('notification:deleted', data);
    });

    // Server initial unread notifications count
    this.socket.on('unread_notifications', (data: any) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Unread notifications count:', data);
      }
      this.emit('unread_notifications', data);
    });

    // Specialist availability events
    this.socket.on('availability:updated', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] Availability updated:', data);
      }
      this.emit('availability:updated', data);
    });

    // Chat/messaging events (if implemented)
    this.socket.on('message:new', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] New message:', data);
      }
      this.emit('message:new', data);
    });

    this.socket.on('message:typing', (data) => {
      this.emit('message:typing', data);
    });

    // Review events
    this.socket.on('review:new', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] New review:', data);
      }
      this.emit('review:new', data);
    });

    // System events
    this.socket.on('system:maintenance', (data) => {
      console.warn('[Socket] System maintenance:', data);
      this.emit('system:maintenance', data);
    });

    this.socket.on('system:announcement', (data) => {
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log('[Socket] System announcement:', data);
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
          console.error(`[Socket] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Send data to server
  send(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      
      if (import.meta.env.VITE_DEBUG === 'true') {
        console.log(`[Socket] Sent ${event}:`, data);
      }
    } else {
      console.warn(`[Socket] Cannot send ${event}: not connected`);
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

export default socketService;
