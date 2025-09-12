import { apiClient } from './api';
import { ApiResponse } from '@/types';

// Loyalty Types
export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS' | 'REFERRAL' | 'CAMPAIGN' | 'ADJUSTMENT';
  points: number;
  description: string;
  reference?: string;
  bookingId?: string;
  campaignId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  slug: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
  discountPercentage?: number;
  prioritySupport: boolean;
  exclusiveOffers: boolean;
  createdAt: string;
}

export interface UserLoyalty {
  profile: {
    totalPoints: number;
    tier: string;
    badges: LoyaltyBadge[];
    nextTier: string | null;
    progressToNext: number;
    availableDiscounts: Array<{ points: number; discount: number }>;
    stats: {
      totalBookings: number;
      totalReviews: number;
      successfulReferrals: number;
      totalTransactions: number;
    };
  };
}

export interface LoyaltyBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: string;
  points: number;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  isActive: boolean;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: LoyaltyBadge;
  earnedAt: string;
  progress?: number;
  isCompleted: boolean;
}

export interface LoyaltyCampaign {
  id: string;
  name: string;
  description: string;
  type: 'POINTS_MULTIPLIER' | 'BONUS_POINTS' | 'TIER_BOOST' | 'SPECIAL_OFFER';
  startDate: string;
  endDate: string;
  isActive: boolean;
  conditions: any;
  rewards: any;
  createdAt: string;
}

export interface ReferralProgram {
  id: string;
  code: string;
  referrerPoints: number;
  refereePoints: number;
  isActive: boolean;
  maxUses?: number;
  currentUses: number;
  expiresAt?: string;
  createdAt: string;
}

export interface UserReferral {
  id: string;
  referrerId: string;
  refereeId: string;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  referrerPoints: number;
  refereePoints: number;
  completedAt?: string;
  createdAt: string;
}

export interface LoyaltyStats {
  totalPoints: number;
  totalTransactions: number;
  totalBadges: number;
  totalReferrals: number;
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  monthlyPoints: number;
  yearlyPoints: number;
}

export class LoyaltyService {
  // Get user's loyalty profile
  async getUserLoyalty(): Promise<UserLoyalty> {
    const response = await apiClient.get<UserLoyalty>('/loyalty/profile');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get loyalty profile');
    }
    
    return response.data;
  }

  // Get loyalty statistics
  async getLoyaltyStats(): Promise<LoyaltyStats> {
    const response = await apiClient.get<LoyaltyStats>('/loyalty/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get loyalty stats');
    }
    
    return response.data;
  }

  // Get loyalty transactions history
  async getTransactions(page: number = 1, limit: number = 20): Promise<{
    transactions: LoyaltyTransaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await apiClient.get<{
      transactions: LoyaltyTransaction[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(`/loyalty/transactions?page=${page}&limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get transactions');
    }
    
    return response.data;
  }

  // Get all loyalty tiers
  async getTiers(): Promise<LoyaltyTier[]> {
    const response = await apiClient.get<{ tiers: LoyaltyTier[] }>('/loyalty/tiers');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get loyalty tiers');
    }
    
    return response.data.tiers;
  }

  // Get user's badges
  async getUserBadges(): Promise<UserBadge[]> {
    const response = await apiClient.get<{ badges: UserBadge[] }>('/loyalty/badges');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get user badges');
    }
    
    return response.data.badges;
  }

  // Get available badges
  async getAvailableBadges(): Promise<LoyaltyBadge[]> {
    const response = await apiClient.get<{ badges: LoyaltyBadge[] }>('/loyalty/badges/available');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get available badges');
    }
    
    return response.data.badges;
  }

  // Get active campaigns
  async getActiveCampaigns(): Promise<LoyaltyCampaign[]> {
    const response = await apiClient.get<{ campaigns: LoyaltyCampaign[] }>('/loyalty/campaigns');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get campaigns');
    }
    
    return response.data.campaigns;
  }

  // Get user's referral program info
  async getReferralProgram(): Promise<ReferralProgram> {
    const response = await apiClient.get<ReferralProgram>('/loyalty/referral');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get referral program');
    }
    
    return response.data;
  }

  // Get user's referrals
  async getUserReferrals(): Promise<UserReferral[]> {
    const response = await apiClient.get<{ referrals: UserReferral[] }>('/loyalty/referrals');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get user referrals');
    }
    
    return response.data.referrals;
  }

  // Create referral code
  async createReferralCode(): Promise<ReferralProgram> {
    const response = await apiClient.post<ReferralProgram>('/loyalty/referral/create');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create referral code');
    }
    
    return response.data;
  }

  // Redeem points for rewards
  async redeemPoints(rewardId: string, points: number): Promise<{
    success: boolean;
    message: string;
    newBalance: number;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      newBalance: number;
    }>('/loyalty/redeem', {
      rewardId,
      points
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to redeem points');
    }
    
    return response.data;
  }

  // Get redemption history
  async getRedemptionHistory(): Promise<LoyaltyTransaction[]> {
    const response = await apiClient.get<{ transactions: LoyaltyTransaction[] }>('/loyalty/redemptions');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get redemption history');
    }
    
    return response.data.transactions;
  }
}

export const loyaltyService = new LoyaltyService();