// ============================================================
// Booking Types — Canonical definitions for MiyZapis
// Merged from frontend/src/types/index.ts and mini-app/src/types/index.ts
// ============================================================

import { BaseEntity, User } from './user';
import type { Service } from './service';
import type { Specialist } from './specialist';

// Combined statuses from both apps (frontend uses both cases)
export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// Mini-app format
export type PaymentStatus =
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  // Frontend format
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export type PaymentMethod =
  | 'CARD'
  | 'TELEGRAM_PAYMENT'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'WALLET';

export interface Booking extends BaseEntity {
  // Core fields (both apps)
  serviceId: string;
  service?: Service;
  customerId: string;
  customer?: User;
  specialistId: string;
  specialist?: Specialist;
  status: BookingStatus;
  notes?: string;
  totalAmount: number;
  currency?: string;
  cancellationReason?: string;
  rescheduleHistory?: RescheduleRecord[];

  // Frontend-specific fields
  scheduledAt?: string;
  duration?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  fullPaymentAmount?: number;
  fullPaymentPaid?: boolean;
  preparationNotes?: string;
  completionNotes?: string;
  deliverables?: string[];
  meetingLink?: string;
  canCancel?: boolean;
  cancellationDeadline?: string;
  participantCount?: number;
  groupSessionId?: string;
  review?: {
    id: string;
    rating: number;
    comment?: string;
    tags?: string;
    isPublic: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  // Flattened fields (added by backend transform for frontend)
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  amount?: number;
  type?: 'online' | 'in-person';

  // Mini-app specific fields
  startTime?: string;
  endTime?: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

export interface RescheduleRecord {
  id?: string;
  // Frontend format
  oldScheduledAt?: string;
  newScheduledAt?: string;
  requestedAt?: string;
  // Mini-app format
  originalDate?: string;
  originalTime?: string;
  newDate?: string;
  newTime?: string;
  // Common
  reason: string;
  requestedBy: 'customer' | 'specialist' | 'CUSTOMER' | 'SPECIALIST';
  createdAt?: string;
}

export interface CreateBookingRequest {
  serviceId: string;
  specialistId: string;
  scheduledAt: string;
  duration?: number;
  notes?: string;
  paymentMethodId?: string;
  loyaltyPointsUsed?: number;
  rewardRedemptionId?: string;
}

// Payment Types (from frontend)
export type PaymentType = 'deposit' | 'full_payment' | 'refund';

export interface Payment extends BaseEntity {
  bookingId: string;
  booking?: Booking;
  amount: number;
  currency: string;
  status: PaymentStatus;
  // Frontend uses type + paymentMethod string
  type?: PaymentType;
  paymentMethod?: string | PaymentMethod;
  // Mini-app uses method enum
  method?: PaymentMethod;
  stripePaymentIntentId?: string;
  telegramChargeId?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  finalAmount?: number;
  refundReason?: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface PaymentMethodRecord extends BaseEntity {
  userId: string;
  type: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  nickname?: string;
  isDefault: boolean;
  isActive: boolean;
}
