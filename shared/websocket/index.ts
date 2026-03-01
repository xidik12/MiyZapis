// ============================================================
// Shared WebSocket Service — Configurable for frontend and mini-app
// Merged from frontend/src/services/socket.service.ts and
// mini-app/src/services/websocket.service.ts
// ============================================================

import { io, Socket } from 'socket.io-client';
import type {
  WebSocketMessage,
  BookingUpdate,
  NotificationData,
  WebSocketEventType,
} from '../types';

export type SocketEventHandler<T = any> = (data: T) => void;

export interface WebSocketConfig {
  /** WebSocket server URL */
  url: string;
  /** Function to get auth token */
  getToken: () => string | null;
  /** Whether to log debug messages */
  debug?: boolean;
  /** Max reconnect attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Reconnect delay in ms (default: 1000) */
  reconnectDelay?: number;
}

const noop = (..._args: any[]) => {};

export class SharedWebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private listeners: Map<string, Set<SocketEventHandler>> = new Map();
  private isConnectedFlag = false;
  private userId: string | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private config: WebSocketConfig;

  private log: (...args: any[]) => void;
  private logWarn: (...args: any[]) => void;
  private logError: (...args: any[]) => void;

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 5;
    this.reconnectDelay = config.reconnectDelay ?? 1000;

    this.log = config.debug ? (...args: any[]) => console.log('[WS]', ...args) : noop;
    this.logWarn = config.debug ? (...args: any[]) => console.warn('[WS]', ...args) : noop;
    this.logError = (...args: any[]) => console.error('[WS]', ...args);
  }

  // ---- Connection ----

  connect(userId?: string): void {
    if (this.socket?.connected) {
      this.log('Already connected');
      return;
    }

    const token = this.config.getToken();
    if (!token) {
      this.logWarn('No auth token available for socket connection');
      return;
    }

    if (userId) this.userId = userId;

    this.socket = io(this.config.url, {
      auth: { token, userId: this.userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true,
    });

    this.setupSocketListeners();
    this.log('Connecting to', this.config.url);
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnectedFlag = false;
      this.userId = null;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  reconnect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  async ensureConnection(): Promise<boolean> {
    if (this.isConnected()) return true;

    return new Promise((resolve) => {
      const token = this.config.getToken();
      if (!token) {
        resolve(false);
        return;
      }

      const onConnect = () => {
        cleanup();
        resolve(true);
      };
      const onError = () => {
        cleanup();
        resolve(false);
      };
      const cleanup = () => {
        this.socket?.off('connect', onConnect);
        this.socket?.off('connect_error', onError);
      };

      if (!this.socket || this.socket.disconnected) {
        this.connect();
      } else {
        this.socket.connect();
      }

      this.socket?.on('connect', onConnect);
      this.socket?.on('connect_error', onError);

      setTimeout(() => {
        cleanup();
        if (!this.isConnected()) resolve(false);
      }, 5000);
    });
  }

  // ---- Event Handling ----

  on<T = any>(event: string, handler: SocketEventHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<T = any>(event: string, handler: SocketEventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  private emit<T = any>(event: string, data: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          this.logError('Error in event handler:', error);
        }
      });
    }
  }

  // ---- Send to server ----

  send(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      this.logWarn('Not connected, cannot send:', event);
    }
  }

  // ---- Room management ----

  joinRoom(roomId: string): void {
    this.send('join_room', { roomId });
  }

  leaveRoom(roomId: string): void {
    this.send('leave_room', { roomId });
  }

  // ---- Booking operations ----

  subscribeToBooking(bookingId: string): void {
    this.send('booking:subscribe', { bookingId });
  }

  unsubscribeFromBooking(bookingId: string): void {
    this.send('booking:unsubscribe', { bookingId });
  }

  updateBookingStatus(bookingId: string, status: string, data?: any): void {
    this.send('update_booking_status', {
      bookingId,
      status,
      data,
      timestamp: Date.now(),
    });
  }

  // ---- Messaging ----

  sendMessage(recipientId: string, message: string, bookingId?: string): void {
    this.send('send_message', {
      recipientId,
      message,
      bookingId,
      timestamp: Date.now(),
    });
  }

  sendTyping(roomId: string, isTyping: boolean): void {
    this.send('typing', { roomId, isTyping });
  }

  // ---- Presence / Location ----

  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    this.send('presence:update', { status });
  }

  updateLocation(latitude: number, longitude: number): void {
    this.send('update_location', { latitude, longitude, timestamp: Date.now() });
  }

  requestSpecialistStatus(specialistId: string): void {
    this.send('get_specialist_status', { specialistId });
  }

  // ---- Availability ----

  subscribeToAvailability(specialistId: string): void {
    this.send('availability:subscribe', { specialistId });
  }

  unsubscribeFromAvailability(specialistId: string): void {
    this.send('availability:unsubscribe', { specialistId });
  }

  // ---- Heartbeat ----

  startHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000);
  }

  // ---- Connection Stats ----

  getConnectionStats() {
    return {
      isConnected: this.isConnectedFlag,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      eventHandlersCount: this.listeners.size,
    };
  }

  // ---- Internal: Socket event listeners ----

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.log('Connected');
      this.isConnectedFlag = true;
      this.reconnectAttempts = 0;
      if (this.userId) {
        this.socket?.emit('join_user_room', this.userId);
      }
      this.emit('connection_status', { connected: true });
      this.emit('socket:connected', { connected: true });
    });

    this.socket.on('disconnect', (reason: string) => {
      this.log('Disconnected:', reason);
      this.isConnectedFlag = false;
      this.emit('connection_status', { connected: false, reason });
      this.emit('socket:disconnected', { reason });
    });

    this.socket.on('connect_error', (error: any) => {
      this.logError('Connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection_error', { error: error.message });
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('socket:connection_failed', { error: error.message });
      }
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      this.log('Reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', { attempts: attemptNumber });
    });

    // Auth events
    this.socket.on('auth:success', (data: any) => {
      this.log('Auth successful:', data);
    });

    this.socket.on('auth:error', (error: any) => {
      this.logError('Auth error:', error);
      this.emit('socket:auth_error', { error });
    });

    // Booking events
    const bookingEvents = [
      'booking_updated', 'booking_confirmed', 'booking_cancelled', 'booking_reminder',
      'booking:status_changed', 'booking:new', 'booking:updated', 'booking:reminder',
    ];
    bookingEvents.forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.log(`${event}:`, data);
        this.emit(event, data);
      });
    });

    // Payment events
    ['payment_completed', 'payment_failed', 'payment:status_changed'].forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.log(`${event}:`, data);
        this.emit(event, data);
      });
    });

    // Specialist status events
    ['specialist_online', 'specialist_offline'].forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.log(`${event}:`, data);
        this.emit(event, data);
      });
    });

    // Message events
    ['new_message', 'message:new', 'message:typing'].forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.log(`${event}:`, data);
        this.emit(event, data);
      });
    });

    // Notification events
    this.socket.on('notification', (data: any) => {
      this.log('Notification:', data);
      if (data.type === 'PAYMENT_COMPLETED') {
        this.emit('payment:completed', data.data);
      }
      this.emit('notification:new', data);
    });

    ['notification:new', 'notification_read', 'notification:read',
     'notification:mark_all_read', 'notification:deleted', 'unread_notifications',
     'system_notification'].forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.log(`${event}:`, data);
        this.emit(event, data);
      });
    });

    // Availability events
    this.socket.on('availability:updated', (data: any) => {
      this.log('Availability updated:', data);
      this.emit('availability:updated', data);
    });

    // System events
    ['system:maintenance', 'system:announcement'].forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.log(`${event}:`, data);
        this.emit(event, data);
      });
    });

    // Review events
    this.socket.on('review:new', (data: any) => {
      this.log('New review:', data);
      this.emit('review:new', data);
    });

    // Generic message handler
    this.socket.on('message', (message: WebSocketMessage) => {
      this.log('Message:', message);
      this.emit(message.type, message.data);
    });
  }
}

// Re-export types for convenience
export type {
  WebSocketMessage,
  BookingUpdate,
  NotificationData,
  WebSocketEventType,
};
