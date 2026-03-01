// ============================================================
// Loyalty Types — From frontend/src/types/index.ts
// ============================================================

import { BaseEntity } from './user';

export interface LoyaltyAccount {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierPoints: number;
  nextTierBenefits: string[];
}

export interface LoyaltyTransaction extends BaseEntity {
  userId: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  bookingId?: string;
  redemptionId?: string;
}

export interface LoyaltyRedemption extends BaseEntity {
  userId: string;
  points: number;
  value: number;
  rewardType: 'discount' | 'service_credit';
  bookingId?: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt?: string;
}
