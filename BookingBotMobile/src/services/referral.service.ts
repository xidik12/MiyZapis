// Referral service - adapted for React Native
import { apiClient } from './api';

export interface ReferralProgram {
  code: string;
  referrerPoints: number;
  refereePoints: number;
  totalReferrals: number;
  activeReferrals: number;
}

export interface ReferralTransaction {
  id: string;
  referrerId: string;
  refereeId: string;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  pointsAwarded: number;
  createdAt: string;
}

export class ReferralService {
  // Get referral program info
  async getReferralProgram(): Promise<ReferralProgram> {
    const response = await apiClient.get<ReferralProgram>('/referral/config');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get referral program');
    }
    return response.data;
  }

  // Create referral code
  async createReferralCode(): Promise<{ code: string; message: string }> {
    const response = await apiClient.post<{ code: string; message: string }>('/referral/create');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create referral code');
    }
    return response.data;
  }

  // Get referral transactions
  async getReferralTransactions(): Promise<ReferralTransaction[]> {
    const response = await apiClient.get<{ transactions: ReferralTransaction[] }>('/referral/track');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get referral transactions');
    }
    return response.data.transactions || [];
  }

  // Get referral stats
  async getReferralStats(): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    totalPointsEarned: number;
  }> {
    const response = await apiClient.get('/referral/stats');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get referral stats');
    }
    return response.data;
  }
}

export const referralService = new ReferralService();

