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
  currentPoints: number;
  lifetimePoints: number;
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
  totalServices: number; // Added missing field for services completed
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  monthlyPoints: number;
  yearlyPoints: number;
  totalSpentPoints: number;
}

export class LoyaltyService {
  // Get user's loyalty profile
  async getUserLoyalty(): Promise<UserLoyalty> {
    try {
      const response = await apiClient.get<{profile: any}>('/loyalty/profile');
      
      if (!response.success || !response.data) {
        // Return default values if no loyalty profile exists yet
        return this.getDefaultLoyaltyProfile();
      }
      
      const profile = response.data.profile;
      
      // Transform backend response to match frontend interface
      return {
        currentPoints: profile.totalPoints || 0,
        lifetimePoints: profile.totalPoints || 0, // Assuming current points is also lifetime for now
        tier: profile.tier || 'Bronze',
        badges: profile.badges || [],
        nextTier: profile.nextTier,
        progressToNext: profile.progressToNext || 0,
        availableDiscounts: profile.availableDiscounts || [],
        stats: profile.stats || {
          totalBookings: 0,
          totalReviews: 0,
          successfulReferrals: 0,
          totalTransactions: 0
        }
      };
    } catch (error: any) {
      // Silently handle 404 errors as they're expected for new users or when backend is updating
      if (error?.response?.status !== 404) {
        console.warn('Failed to fetch loyalty profile, using defaults:', error);
      }
      return this.getDefaultLoyaltyProfile();
    }
  }

  private getDefaultLoyaltyProfile(): UserLoyalty {
    return {
      currentPoints: 0,
      lifetimePoints: 0,
      tier: 'Bronze',
      badges: [],
      nextTier: 'Silver',
      progressToNext: 0,
      availableDiscounts: [],
      stats: {
        totalBookings: 0,
        totalReviews: 0,
        successfulReferrals: 0,
        totalTransactions: 0
      }
    };
  }

  // Get loyalty statistics
  async getLoyaltyStats(): Promise<LoyaltyStats> {
    try {
      const response = await apiClient.get<LoyaltyStats>('/loyalty/stats');

      if (!response.success || !response.data) {
        return this.getDefaultLoyaltyStats();
      }

      return response.data;
    } catch (error: any) {
      // Silently handle 404 errors as they're expected for new users or when backend is updating
      if (error?.response?.status !== 404) {
        console.warn('Failed to fetch loyalty stats, using defaults:', error);
      }
      return this.getDefaultLoyaltyStats();
    }
  }

  private getDefaultLoyaltyStats(): LoyaltyStats {
    return {
      totalPoints: 0,
      totalTransactions: 0,
      totalBadges: 0,
      totalReferrals: 0,
      totalServices: 0,
      currentTier: null,
      nextTier: null,
      pointsToNextTier: 0,
      monthlyPoints: 0,
      yearlyPoints: 0,
      totalSpentPoints: 0
    };
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
    
    const apiTiers = response.data.tiers || [];
    // Normalize to fixed ranges: Bronze 0-499, Silver 500-999, Gold 1000-1999, Platinum 2000+
    const byKey = new Map<string, LoyaltyTier>();
    for (const t of apiTiers) {
      const k = (t.slug || t.name || '').toLowerCase();
      if (k) byKey.set(k, t);
    }
    const fixed = [
      { key: 'bronze', name: 'Bronze', min: 0, max: 499, defaults: ['Basic support', 'Standard booking', 'Point earning'] },
      { key: 'silver', name: 'Silver', min: 500, max: 999, defaults: ['Priority support', 'Early booking access'] },
      { key: 'gold', name: 'Gold', min: 1000, max: 1999, defaults: ['5% bonus points', 'Priority support', 'Early access'] },
      { key: 'platinum', name: 'Platinum', min: 2000, max: undefined as number | undefined, defaults: ['10% bonus points', 'VIP support', 'Exclusive services'] },
    ];
    const pick = (key: string): LoyaltyTier | undefined => {
      const direct = byKey.get(key);
      if (direct) return direct;
      for (const [k, v] of byKey) {
        if (k.includes(key)) return v;
      }
      return undefined;
    };
    const normalized: LoyaltyTier[] = fixed.map((f, idx) => {
      const found = pick(f.key);
      const base: LoyaltyTier = found
        ? { ...found }
        : {
            id: `local-${f.key}`,
            name: f.name,
            slug: f.key,
            minPoints: f.min,
            maxPoints: f.max,
            benefits: f.defaults,
            discountPercentage: idx === 2 ? 5 : idx === 3 ? 10 : 0,
            prioritySupport: idx >= 1,
            exclusiveOffers: idx >= 3,
            createdAt: new Date(0).toISOString(),
          };
      base.name = f.name;
      base.slug = f.key;
      base.minPoints = f.min;
      base.maxPoints = f.max;
      if (!base.benefits || base.benefits.length === 0) base.benefits = f.defaults;
      if (base.discountPercentage == null) base.discountPercentage = idx === 2 ? 5 : idx === 3 ? 10 : 0;
      base.prioritySupport = idx >= 1;
      base.exclusiveOffers = idx >= 3;
      return base;
    });
    return normalized;
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
