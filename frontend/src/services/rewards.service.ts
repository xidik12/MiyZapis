import { apiClient } from './api';

export interface LoyaltyReward {
  id: string;
  specialistId: string;
  title: string;
  description: string;
  type: 'DISCOUNT_VOUCHER' | 'SERVICE_CREDIT' | 'FREE_SERVICE' | 'PERCENTAGE_OFF';
  pointsRequired: number;
  discountPercent?: number;
  discountAmount?: number;
  serviceIds?: string[];
  maxRedemptions?: number;
  currentRedemptions: number;
  usageLimit: 'UNLIMITED' | 'ONCE_PER_USER' | 'LIMITED_TOTAL';
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  termsConditions?: string;
  minimumTier?: string;
  createdAt: string;
  updatedAt: string;
  specialist?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface CreateRewardData {
  title: string;
  description: string;
  type: 'DISCOUNT_VOUCHER' | 'SERVICE_CREDIT' | 'FREE_SERVICE' | 'PERCENTAGE_OFF';
  pointsRequired: number;
  discountPercent?: number;
  discountAmount?: number;
  serviceIds?: string[];
  maxRedemptions?: number;
  usageLimit?: 'UNLIMITED' | 'ONCE_PER_USER' | 'LIMITED_TOTAL';
  validFrom?: Date;
  validUntil?: Date;
  termsConditions?: string;
  minimumTier?: string;
}

export interface UpdateRewardData extends Partial<CreateRewardData> {
  isActive?: boolean;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  userId: string;
  bookingId?: string;
  status: string;
  pointsUsed: number;
  discountApplied?: number;
  originalAmount?: number;
  finalAmount?: number;
  redeemedAt: string;
  usedAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  reward: LoyaltyReward;
  user: {
    firstName: string;
    lastName: string;
  };
}

export class RewardsService {
  // Specialist methods - for creating and managing rewards
  static async createReward(data: CreateRewardData): Promise<LoyaltyReward> {
    const response = await apiClient.post<{ reward: LoyaltyReward }>('/rewards', {
      ...data,
      validFrom: data.validFrom?.toISOString(),
      validUntil: data.validUntil?.toISOString(),
    });
    return response.data.reward;
  }

  static async getSpecialistRewards(specialistId?: string, includeInactive = false): Promise<LoyaltyReward[]> {
    const endpoint = specialistId
      ? `/rewards/specialist/${specialistId}`
      : '/rewards/specialist';
    const response = await apiClient.get<{ rewards: LoyaltyReward[] }>(endpoint, {
      params: { includeInactive }
    });
    return response.data.rewards;
  }

  static async updateReward(rewardId: string, data: UpdateRewardData): Promise<LoyaltyReward> {
    const response = await apiClient.put<{ reward: LoyaltyReward }>(`/rewards/${rewardId}`, {
      ...data,
      validFrom: data.validFrom?.toISOString(),
      validUntil: data.validUntil?.toISOString(),
    });
    return response.data.reward;
  }

  static async deleteReward(rewardId: string): Promise<void> {
    await apiClient.delete(`/rewards/${rewardId}`);
  }

  // Customer methods - for browsing and redeeming rewards
  static async getAvailableRewards(specialistId?: string): Promise<LoyaltyReward[]> {
    const response = await apiClient.get<{ rewards: LoyaltyReward[] }>('/rewards/available', {
      params: specialistId ? { specialistId } : {}
    });
    return response.data.rewards;
  }

  static async redeemReward(rewardId: string, bookingId?: string): Promise<RewardRedemption> {
    const response = await apiClient.post<{ redemption: RewardRedemption }>('/rewards/redeem', {
      rewardId,
      bookingId
    });
    return response.data.redemption;
  }

  static async getUserRedemptions(): Promise<RewardRedemption[]> {
    const response = await apiClient.get<{ redemptions: RewardRedemption[] }>('/rewards/redemptions');
    return response.data.redemptions;
  }

  // Public methods
  static async getRewardById(rewardId: string): Promise<LoyaltyReward> {
    const response = await apiClient.get<{ reward: LoyaltyReward }>(`/rewards/${rewardId}`);
    return response.data.reward;
  }

  // Helper methods
  static getRewardTypeLabel(type: string): string {
    switch (type) {
      case 'DISCOUNT_VOUCHER':
        return 'Discount Voucher';
      case 'SERVICE_CREDIT':
        return 'Service Credit';
      case 'FREE_SERVICE':
        return 'Free Service';
      case 'PERCENTAGE_OFF':
        return 'Percentage Off';
      default:
        return type;
    }
  }

  static getRewardValue(reward: LoyaltyReward): string {
    switch (reward.type) {
      case 'PERCENTAGE_OFF':
        return `${reward.discountPercent}% off`;
      case 'DISCOUNT_VOUCHER':
        return `$${reward.discountAmount} off`;
      case 'FREE_SERVICE':
        return 'Free service';
      case 'SERVICE_CREDIT':
        return `$${reward.discountAmount} credit`;
      default:
        return 'Special offer';
    }
  }

  static formatRedemptionStatus(status: string): { label: string; color: string } {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', color: 'yellow' };
      case 'APPROVED':
        return { label: 'Ready to Use', color: 'green' };
      case 'USED':
        return { label: 'Used', color: 'blue' };
      case 'EXPIRED':
        return { label: 'Expired', color: 'red' };
      case 'CANCELLED':
        return { label: 'Cancelled', color: 'gray' };
      default:
        return { label: status, color: 'gray' };
    }
  }

  static isRewardAvailable(reward: LoyaltyReward): boolean {
    if (!reward.isActive) return false;

    const now = new Date();
    const validFrom = new Date(reward.validFrom);
    const validUntil = reward.validUntil ? new Date(reward.validUntil) : null;

    if (now < validFrom) return false;
    if (validUntil && now > validUntil) return false;

    if (reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions) {
      return false;
    }

    return true;
  }
}

export default RewardsService;
