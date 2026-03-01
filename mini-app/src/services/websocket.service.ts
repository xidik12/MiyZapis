import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: string;
  data: unknown;
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

const isDev = import.meta.env.DEV;
const log = (...args: unknown[]) => { if (isDev) console.log('[WS]', ...args); };
const logWarn = (...args: unknown[]) => { if (isDev) console.warn('[WS]', ...args); };
const logError = (...args: unknown[]) => { console.error('[WS]', ...args); };

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private isConnected = false;
  private userId: string | null = null;
  private token: string | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setupSocketListeners();
  }

  /**
   * Initialize WebSocket connection
   */
  connect(userId: string, token: string): void {
    if (this.socket?.connected) {
      log('Already connected');
      return;
    }

    this.userId = userId;
    this.token = token;

    const socketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

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
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
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
      log('Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Join user room for personalized events
      if (this.userId) {
        this.socket?.emit('join_user_room', this.userId);
      }
      
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason) => {
      log('Disconnected:', reason);
      this.isConnected = false;
      this.emit('connection_status', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      logError('Connection error:', error);
      this.emit('connection_error', { error: error.message });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      log('Reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', { attempts: attemptNumber });
    });

    this.socket.on('reconnect_error', (error) => {
      logError('Reconnection error:', error);
      this.reconnectAttempts++;
    });

    // Booking events
    this.socket.on('booking_updated', (data: BookingUpdate) => {
      log('Booking updated:', data);
      this.emit('booking_updated', data);
    });

    this.socket.on('booking_confirmed', (data: BookingUpdate) => {
      log('Booking confirmed:', data);
      this.emit('booking_confirmed', data);
      const l = this.getLocale();
      this.showTelegramNotification(
        l === 'uk' ? 'Запис підтверджено' : l === 'ru' ? 'Запись подтверждена' : 'Booking Confirmed',
        l === 'uk' ? 'Ваш запис підтверджено!' : l === 'ru' ? 'Ваша запись подтверждена!' : 'Your booking has been confirmed!'
      );
    });

    this.socket.on('booking_cancelled', (data: BookingUpdate) => {
      log('Booking cancelled:', data);
      this.emit('booking_cancelled', data);
      const l = this.getLocale();
      this.showTelegramNotification(
        l === 'uk' ? 'Запис скасовано' : l === 'ru' ? 'Запись отменена' : 'Booking Cancelled',
        l === 'uk' ? 'Запис було скасовано.' : l === 'ru' ? 'Запись была отменена.' : 'A booking has been cancelled.'
      );
    });

    this.socket.on('booking_reminder', (data: unknown) => {
      log('Booking reminder:', data);
      this.emit('booking_reminder', data);
      const l = this.getLocale();
      this.showTelegramNotification(
        l === 'uk' ? 'Нагадування' : l === 'ru' ? 'Напоминание' : 'Booking Reminder',
        l === 'uk' ? `У вас запис через ${data.timeUntil}.` : l === 'ru' ? `У вас запись через ${data.timeUntil}.` : `You have an upcoming appointment in ${data.timeUntil}.`
      );
    });

    // Payment events
    this.socket.on('payment_completed', (data: unknown) => {
      log('Payment completed:', data);
      this.emit('payment_completed', data);
      const l = this.getLocale();
      this.showTelegramNotification(
        l === 'uk' ? 'Оплата успішна' : l === 'ru' ? 'Оплата успешна' : 'Payment Successful',
        l === 'uk' ? 'Ваш платіж оброблено успішно.' : l === 'ru' ? 'Ваш платёж обработан успешно.' : 'Your payment has been processed successfully.'
      );
    });

    this.socket.on('payment_failed', (data: unknown) => {
      log('Payment failed:', data);
      this.emit('payment_failed', data);
      const l = this.getLocale();
      this.showTelegramNotification(
        l === 'uk' ? 'Помилка оплати' : l === 'ru' ? 'Ошибка оплаты' : 'Payment Failed',
        l === 'uk' ? 'Виникла проблема з обробкою платежу.' : l === 'ru' ? 'Возникла проблема с обработкой платежа.' : 'There was an issue processing your payment.'
      );
    });

    // Specialist status events
    this.socket.on('specialist_online', (data: unknown) => {
      log('Specialist online:', data);
      this.emit('specialist_online', data);
    });

    this.socket.on('specialist_offline', (data: unknown) => {
      log('Specialist offline:', data);
      this.emit('specialist_offline', data);
    });

    // Message events
    this.socket.on('new_message', (data: unknown) => {
      log('New message:', data);
      this.emit('new_message', data);
      const l = this.getLocale();
      this.showTelegramNotification(
        l === 'uk' ? 'Нове повідомлення' : l === 'ru' ? 'Новое сообщение' : 'New Message',
        l === 'uk' ? `У вас нове повідомлення від ${data.senderName}.` : l === 'ru' ? `У вас новое сообщение от ${data.senderName}.` : `You have a new message from ${data.senderName}.`
      );
    });

    // System notifications
    this.socket.on('system_notification', (data: NotificationData) => {
      log('System notification:', data);
      this.emit('system_notification', data);
      this.showTelegramNotification(data.title, data.message);
    });

    // Generic message handler
    this.socket.on('message', (message: WebSocketMessage) => {
      log('Message:', message);
      this.emit(message.type, message.data);
    });
  }

  /**
   * Get current locale from storage
   */
  private getLocale(): 'en' | 'uk' | 'ru' {
    try {
      const stored = localStorage.getItem('miyzapis_locale');
      if (stored === 'uk' || stored === 'ru') return stored;
      const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
      if (tgLang?.startsWith('uk')) return 'uk';
      if (tgLang?.startsWith('ru')) return 'ru';
    } catch {}
    return 'en';
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
  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: (data: unknown) => void): void {
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
  private emit(event: string, data: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logError('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Send message to server
   */
  send(event: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      logWarn('Not connected, cannot send:', event);
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
  updateBookingStatus(bookingId: string, status: string, data?: unknown): void {
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
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }
}

export const webSocketService = new WebSocketService();