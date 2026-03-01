// ============================================================
// Notification Types — Canonical definitions for MiyZapis
// Merged from frontend/src/types/index.ts and mini-app/src/types/index.ts
// ============================================================

import { BaseEntity } from './user';

// Combined from both apps
export type NotificationType =
  // Mini-app format (uppercase)
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REMINDER'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'REVIEW_RECEIVED'
  | 'PROMOTION'
  | 'SYSTEM'
  // Frontend format (lowercase with underscores)
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'payment_received'
  | 'payment_failed'
  | 'review_received'
  | 'new_booking'
  | 'booking_updated'
  | 'system_announcement';

export type NotificationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'TELEGRAM';

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
  channels?: NotificationChannel[];
  scheduledAt?: string;
  sentAt?: string;
}
