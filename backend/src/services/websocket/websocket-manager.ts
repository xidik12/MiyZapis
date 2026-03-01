import { logger } from '@/utils/logger';
import { WebSocketService } from './websocket';

/**
 * WebSocket Manager Singleton
 *
 * Provides global access to WebSocket functionality for services that need
 * to emit real-time events (like payment confirmations, booking updates, etc.)
 */
export class WebSocketManager {
  private static instance: WebSocketService | null = null;

  /**
   * Initialize the WebSocket manager with an WebSocketService instance
   */
  static initialize(enhancedWebSocketService: WebSocketService): void {
    if (WebSocketManager.instance) {
      logger.warn('WebSocketManager is already initialized');
      return;
    }

    WebSocketManager.instance = enhancedWebSocketService;
    logger.info('WebSocketManager initialized successfully');
  }

  /**
   * Get the WebSocket service instance
   */
  static getInstance(): WebSocketService {
    if (!WebSocketManager.instance) {
      throw new Error('WebSocketManager not initialized. Call initialize() first.');
    }

    return WebSocketManager.instance;
  }

  /**
   * Check if WebSocket manager is initialized
   */
  static isInitialized(): boolean {
    return WebSocketManager.instance !== null;
  }

  /**
   * Emit a payment completion event to a specific user
   */
  static async emitPaymentComplete(userId: string, paymentData: {
    paymentId: string;
    bookingId?: string;
    status: string;
    amount: number;
    currency: string;
    type: 'DEPOSIT' | 'SUBSCRIPTION' | 'WALLET_TOPUP';
    confirmedAt: Date;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!WebSocketManager.isInitialized()) {
      logger.warn('WebSocketManager not initialized, cannot emit payment completion event');
      return;
    }

    try {
      const instance = WebSocketManager.getInstance();

      // Emit to user-specific room
      await instance.sendNotification(userId, {
        type: 'PAYMENT_COMPLETED',
        data: paymentData,
        timestamp: new Date().toISOString(),
      });

      // If it's a booking deposit, also emit to booking-specific room
      if (paymentData.bookingId && paymentData.type === 'DEPOSIT') {
        await instance.broadcastBookingUpdate(paymentData.bookingId, {
          type: 'PAYMENT_CONFIRMED',
          status: 'DEPOSIT_PAID',
          paymentId: paymentData.paymentId,
          confirmedAt: paymentData.confirmedAt,
        });
      }

      logger.info('Payment completion event emitted successfully', {
        userId,
        paymentId: paymentData.paymentId,
        bookingId: paymentData.bookingId,
        type: paymentData.type,
      });
    } catch (error) {
      logger.error('Failed to emit payment completion event', {
        error: error instanceof Error ? error.message : error,
        userId,
        paymentData,
      });
    }
  }

  /**
   * Emit a payment status update event to a specific user
   */
  static async emitPaymentStatusUpdate(userId: string, paymentData: {
    paymentId: string;
    bookingId?: string;
    status: string;
    type: 'DEPOSIT' | 'SUBSCRIPTION' | 'WALLET_TOPUP';
    updatedAt: Date;
  }): Promise<void> {
    if (!WebSocketManager.isInitialized()) {
      logger.warn('WebSocketManager not initialized, cannot emit payment status update');
      return;
    }

    try {
      const instance = WebSocketManager.getInstance();

      // Emit to user-specific room
      await instance.sendNotification(userId, {
        type: 'PAYMENT_STATUS_UPDATED',
        data: paymentData,
        timestamp: new Date().toISOString(),
      });

      logger.info('Payment status update event emitted successfully', {
        userId,
        paymentId: paymentData.paymentId,
        status: paymentData.status,
      });
    } catch (error) {
      logger.error('Failed to emit payment status update event', {
        error: error instanceof Error ? error.message : error,
        userId,
        paymentData,
      });
    }
  }

  /**
   * Emit a booking confirmation event when payment is completed
   */
  static async emitBookingConfirmation(bookingId: string, customerId: string, specialistId: string): Promise<void> {
    if (!WebSocketManager.isInitialized()) {
      logger.warn('WebSocketManager not initialized, cannot emit booking confirmation event');
      return;
    }

    try {
      const instance = WebSocketManager.getInstance();

      // Emit booking confirmation to both customer and specialist
      await instance.broadcastBookingUpdate(bookingId, {
        type: 'BOOKING_CONFIRMED',
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
      });

      logger.info('Booking confirmation event emitted successfully', {
        bookingId,
        customerId,
        specialistId,
      });
    } catch (error) {
      logger.error('Failed to emit booking confirmation event', {
        error: error instanceof Error ? error.message : error,
        bookingId,
        customerId,
        specialistId,
      });
    }
  }
}