/**
 * WebSocket Service - Adapted for React Native
 */
import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';
import { environment } from '../config/environment';
import {
  BookingSocketEvent,
  NotificationSocketEvent,
  PaymentSocketEvent,
  SocketEvent,
  User,
} from '../types';

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
      console.warn('[Socket] No auth token available for socket connection');
      return;
    }

    try {
      console.log('[Socket] Connecting to:', environment.WS_URL);
      console.log('[Socket] Token available:', !!token);

      this.socket = io(environment.WS_URL, {
        auth: {
          token,
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
      this.reconnectAttempts = 0;
      this.eventHandlers.clear();
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

      if (environment.DEBUG) {
        console.log('[Socket] Connected successfully');
      }

      this.emit('socket:connected', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;

      if (environment.DEBUG) {
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
        type: error.type,
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
      if (environment.DEBUG) {
        console.log('[Socket] Authentication successful:', data);
      }
    });

    this.socket.on('auth:error', (error) => {
      console.error('[Socket] Authentication error:', error);
      this.emit('socket:auth_error', { error });
    });

    // Booking events
    this.socket.on('booking:status_changed', (data: BookingSocketEvent) => {
      this.emit('booking:status_changed', data);
    });

    this.socket.on('booking:new', (data: BookingSocketEvent) => {
      this.emit('booking:new', data);
    });

    this.socket.on('booking:updated', (data: BookingSocketEvent) => {
      this.emit('booking:updated', data);
    });

    // Notification events
    this.socket.on('notification:new', (data: NotificationSocketEvent) => {
      this.emit('notification:new', data);
    });

    this.socket.on('notification:read', (data: NotificationSocketEvent) => {
      this.emit('notification:read', data);
    });

    this.socket.on('notification:mark_all_read', () => {
      this.emit('notification:mark_all_read', {});
    });

    this.socket.on('notification:deleted', (data: NotificationSocketEvent) => {
      this.emit('notification:deleted', data);
    });

    // Payment events
    this.socket.on('payment:status_changed', (data: PaymentSocketEvent) => {
      this.emit('payment:status_changed', data);
    });

    // Unread notifications count
    this.socket.on('unread_notifications', (data: { count: number }) => {
      this.emit('unread_notifications', data);
    });
  }

  // Join a room
  joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join_room', roomId);
      if (environment.DEBUG) {
        console.log('[Socket] Joined room:', roomId);
      }
    }
  }

  // Leave a room
  leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', roomId);
      if (environment.DEBUG) {
        console.log('[Socket] Left room:', roomId);
      }
    }
  }

  // Emit an event
  emit(event: SocketEvent, data: any): void {
    // Trigger all registered handlers for this event
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[Socket] Error in handler for ${event}:`, error);
        }
      });
    }
  }

  // Register an event handler
  on<T = any>(event: SocketEvent, handler: SocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    // Also listen on socket if connected
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  // Unregister an event handler
  off(event: SocketEvent, handler?: SocketEventHandler): void {
    if (handler) {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
      }
      if (this.socket) {
        this.socket.off(event, handler);
      }
    } else {
      // Remove all handlers for this event
      this.eventHandlers.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }
}

export const socketService = new SocketService();

