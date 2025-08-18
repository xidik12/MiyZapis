import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
}

export interface BookingUpdate {
  id: string;
  status: string;
  changes: Record<string, any>;
  updatedBy: 'customer' | 'specialist' | 'system';
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  userId: string;
}

export type WebSocketEventType = 
  | 'booking_updated'
  | 'booking_cancelled'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'payment_completed'
  | 'payment_failed'
  | 'specialist_online'
  | 'specialist_offline'
  | 'new_message'
  | 'system_notification';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected = false;
  private userId: string | null = null;
  private token: string | null = null;

  constructor() {
    this.setupSocketListeners();
  }

  /**
   * Initialize WebSocket connection
   */
  connect(userId: string, token: string): void {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.token = token;

    const socketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

    this.socket = io(socketUrl, {
      auth: {
        token,
        userId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000
    });

    this.setupSocketListeners();
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      this.token = null;
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user room for personalized events
      if (this.userId) {
        this.socket?.emit('join_user_room', this.userId);
      }
      
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection_error', { error: error.message });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', { attempts: attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.reconnectAttempts++;
    });

    // Booking events
    this.socket.on('booking_updated', (data: BookingUpdate) => {
      console.log('Booking updated:', data);
      this.emit('booking_updated', data);
    });

    this.socket.on('booking_confirmed', (data: BookingUpdate) => {
      console.log('Booking confirmed:', data);
      this.emit('booking_confirmed', data);
      this.showTelegramNotification('Booking Confirmed', `Your booking has been confirmed!`);
    });

    this.socket.on('booking_cancelled', (data: BookingUpdate) => {
      console.log('Booking cancelled:', data);
      this.emit('booking_cancelled', data);
      this.showTelegramNotification('Booking Cancelled', 'A booking has been cancelled.');
    });

    this.socket.on('booking_reminder', (data: any) => {
      console.log('Booking reminder:', data);
      this.emit('booking_reminder', data);
      this.showTelegramNotification('Booking Reminder', `You have an upcoming appointment in ${data.timeUntil}.`);
    });

    // Payment events
    this.socket.on('payment_completed', (data: any) => {
      console.log('Payment completed:', data);
      this.emit('payment_completed', data);
      this.showTelegramNotification('Payment Successful', 'Your payment has been processed successfully.');
    });

    this.socket.on('payment_failed', (data: any) => {
      console.log('Payment failed:', data);
      this.emit('payment_failed', data);
      this.showTelegramNotification('Payment Failed', 'There was an issue processing your payment.');
    });

    // Specialist status events
    this.socket.on('specialist_online', (data: any) => {
      console.log('Specialist online:', data);
      this.emit('specialist_online', data);
    });

    this.socket.on('specialist_offline', (data: any) => {
      console.log('Specialist offline:', data);
      this.emit('specialist_offline', data);
    });

    // Message events
    this.socket.on('new_message', (data: any) => {
      console.log('New message:', data);
      this.emit('new_message', data);
      this.showTelegramNotification('New Message', `You have a new message from ${data.senderName}.`);
    });

    // System notifications
    this.socket.on('system_notification', (data: NotificationData) => {
      console.log('System notification:', data);
      this.emit('system_notification', data);
      this.showTelegramNotification(data.title, data.message);
    });

    // Generic message handler
    this.socket.on('message', (message: WebSocketMessage) => {
      console.log('WebSocket message:', message);
      this.emit(message.type, message.data);
    });
  }

  /**
   * Show notification in Telegram
   */
  private showTelegramNotification(title: string, message: string): void {
    if (window.Telegram?.WebApp) {
      // Use Telegram's haptic feedback for notifications
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      
      // Could also show in-app notification or send via bot
      this.emit('telegram_notification', { title, message });
    }
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit event to local listeners
   */
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Send message to server
   */
  send(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send message:', event, data);
    }
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string): void {
    this.send('join_room', { roomId });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    this.send('leave_room', { roomId });
  }

  /**
   * Update booking status
   */
  updateBookingStatus(bookingId: string, status: string, data?: any): void {
    this.send('update_booking_status', {
      bookingId,
      status,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send chat message
   */
  sendMessage(recipientId: string, message: string, bookingId?: string): void {
    this.send('send_message', {
      recipientId,
      message,
      bookingId,
      timestamp: Date.now()
    });
  }

  /**
   * Request specialist status
   */
  requestSpecialistStatus(specialistId: string): void {
    this.send('get_specialist_status', { specialistId });
  }

  /**
   * Update user location (for nearby specialists)
   */
  updateLocation(latitude: number, longitude: number): void {
    this.send('update_location', {
      latitude,
      longitude,
      timestamp: Date.now()
    });
  }

  /**
   * Subscribe to booking updates
   */
  subscribeToBooking(bookingId: string): void {
    this.send('subscribe_booking', { bookingId });
  }

  /**
   * Unsubscribe from booking updates
   */
  unsubscribeFromBooking(bookingId: string): void {
    this.send('unsubscribe_booking', { bookingId });
  }

  /**
   * Get connection status
   */
  isConnectedStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  /**
   * Manually reconnect
   */
  reconnect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  /**
   * Send heartbeat to keep connection alive
   */
  private sendHeartbeat(): void {
    if (this.socket?.connected) {
      this.socket.emit('heartbeat', { timestamp: Date.now() });
    }
  }

  /**
   * Start heartbeat interval
   */
  startHeartbeat(): void {
    setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Send heartbeat every 30 seconds
  }
}

export const webSocketService = new WebSocketService();