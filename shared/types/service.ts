// ============================================================
// Service Types — Canonical definitions for MiyZapis
// Merged from frontend/src/types/index.ts and mini-app/src/types/index.ts
// ============================================================

import { BaseEntity } from './user';
import type { Specialist } from './specialist';

export interface Service extends BaseEntity {
  name: string;
  description: string;
  longDescription?: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  // Frontend uses string category, mini-app uses ServiceCategory object
  category: string | ServiceCategory;
  isActive: boolean;
  specialistId: string;
  specialist?: Specialist;
  images?: string[];
  tags?: string[];
  // Location
  serviceLocation?: string;
  locationNotes?: string;
  // Requirements/deliverables
  requirements?: string[];
  deliverables?: string[];
  // Loyalty Points pricing (frontend-specific)
  loyaltyPointsEnabled?: boolean;
  loyaltyPointsPrice?: number;
  loyaltyPointsOnly?: boolean;
  // Service Discounts (frontend-specific)
  discountEnabled?: boolean;
  discountType?: string;
  discountValue?: number;
  discountValidFrom?: string;
  discountValidUntil?: string;
  discountDescription?: string;
  // No-show protection — deposit & cancellation policy.
  // Policy layer only: the platform has no live payments yet, so these drive
  // computed/recorded amounts on bookings; nothing is charged here.
  requireDeposit?: boolean;
  depositType?: string; // 'PERCENT' | 'FIXED'
  depositValue?: number;
  cancellationWindowHours?: number;
  noShowFeeType?: string; // 'PERCENT' | 'FIXED'
  noShowFeeValue?: number;
  // Group Session fields (frontend-specific)
  isGroupSession?: boolean;
  maxParticipants?: number;
  minParticipants?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color?: string;
  isActive?: boolean;
  serviceCount?: number;
}
