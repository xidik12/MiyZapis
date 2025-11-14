// Loyalty service - adapted for React Native
import { apiClient } from './api';

export interface UserLoyalty {
  currentPoints: number;
  lifetimePoints: number;
  tier: string;
  nextTier: string | null;
  nextTierPoints: number;
  progressToNext: number;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS' | 'REFERRAL';
  points: number;
  description: string;
  bookingId?: string;
  createdAt: string;
}

export interface LoyaltyStats {
  totalPoints: number;
  currentTier: string;
  nextTierPoints: number;
  monthlyPoints: number;
  savedAmount: number;
}

export class LoyaltyService {
  // Get user loyalty account
  async getAccount(): Promise<UserLoyalty> {
    const response = await apiClient.get<UserLoyalty>('/loyalty/account');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get loyalty account');
    }
    return response.data;
  }

  // Get loyalty transactions
  async getTransactions(filters: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}): Promise<{
    transactions: LoyaltyTransaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{
      transactions: LoyaltyTransaction[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/loyalty/transactions?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get loyalty transactions');
    }
    
    return {
      transactions: response.data.transactions || [],
      pagination: {
        currentPage: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        hasNext: (response.data.page || 1) < (response.data.totalPages || 1),
        hasPrev: (response.data.page || 1) > 1,
        limit: filters.limit || 20,
      }
    };
  }

  // Get loyalty stats
  async getStats(): Promise<LoyaltyStats> {
    const response = await apiClient.get<LoyaltyStats>('/loyalty/stats');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get loyalty stats');
    }
    return response.data;
  }

  // Redeem loyalty points
  async redeemPoints(points: number, bookingId?: string): Promise<{
    success: boolean;
    discountAmount: number;
    remainingPoints: number;
  }> {
    const response = await apiClient.post('/loyalty/redeem', {
      points,
      bookingId,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to redeem loyalty points');
    }
    return response.data;
  }

  // Get available rewards
  async getRewards(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    discountPercentage: number;
  }>> {
    const response = await apiClient.get('/loyalty/rewards');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get rewards');
    }
    return response.data.rewards || [];
  }
}

export const loyaltyService = new LoyaltyService();

