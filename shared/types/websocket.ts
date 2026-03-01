// ============================================================
// WebSocket Types — Merged from both apps
// ============================================================

import type { Booking, BookingStatus, PaymentStatus } from './booking';
import type { Notification } from './notification';

// Frontend format
export interface SocketEvent {
  type: string;
  data: any;
  timestamp: string | number;
}

export interface BookingSocketEvent extends SocketEvent {
  type: 'booking:status_changed' | 'booking:new' | 'booking:updated';
  data: {
    bookingId: string;
    booking?: Booking;
    oldStatus?: BookingStatus;
    newStatus?: BookingStatus;
  };
}

export interface NotificationSocketEvent extends SocketEvent {
  type: 'notification:new';
  data: {
    notification: Notification;
  };
}

export interface PaymentSocketEvent extends SocketEvent {
  type: 'payment:status_changed';
  data: {
    paymentId: string;
    bookingId: string;
    status: PaymentStatus;
    amount: number;
  };
}

// Mini-app format
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
