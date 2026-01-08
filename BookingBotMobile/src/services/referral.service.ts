// Referral service - adapted for React Native
import { apiClient } from './api';
import { Share, Platform } from 'react-native';

export interface ReferralProgram {
  code: string;
  referralCode?: string;
  referrerPoints: number;
  refereePoints: number;
  totalReferrals: number;
  activeReferrals: number;
}

export interface ReferralConfigResponse {
  referralCode: string;
  limits: {
    dailyLimit: number;
    dailyUsed: number;
    pendingLimit: number;
    pendingUsed: number;
  };
  availableTypes: string[];
  config: {
    REWARDS: {
      [key: string]: {
        referrerRewardType: string;
        referrerRewardValue: number;
        referredRewardType: string;
        referredRewardValue: number;
      };
    };
  };
}

export interface ReferralAnalytics {
  overview: {
    totalReferrals: number;
    completedReferrals: number;
    conversionRate: number;
    totalPointsEarned: number;
  };
}

export interface Referral {
  id: string;
  referralCode: string;
  shareUrl: string;
  customMessage?: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  createdAt: string;
}

export interface CreateReferralRequest {
  type: string;
  customMessage?: string;
}

export interface MyReferralsResponse {
  referrals: Referral[];
  total: number;
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
  // Get referral configuration and user limits
  async getConfig(): Promise<ReferralConfigResponse> {
    const response = await apiClient.get<ReferralConfigResponse>('/referral/config');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get referral config');
    }
    return response.data;
  }

  // Get referral program info (legacy method)
  async getReferralProgram(): Promise<ReferralProgram> {
    const config = await this.getConfig();
    return {
      code: config.referralCode,
      referralCode: config.referralCode,
      referrerPoints: 0,
      refereePoints: 0,
      totalReferrals: 0,
      activeReferrals: 0,
    };
  }

  // Get referral analytics
  async getAnalytics(): Promise<ReferralAnalytics> {
    const response = await apiClient.get<{ analytics: ReferralAnalytics }>('/referral/analytics');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get referral analytics');
    }
    return response.data.analytics;
  }

  // Create a new referral
  async createReferral(data: CreateReferralRequest): Promise<Referral> {
    const response = await apiClient.post<{ referral: Referral }>('/referral/create', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create referral');
    }
    return response.data.referral;
  }

  // Get user's referrals with pagination and filters
  async getMyReferrals(filters: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<MyReferralsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/referral/my-referrals?${queryString}` : '/referral/my-referrals';

    const response = await apiClient.get<MyReferralsResponse>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get referrals');
    }
    return response.data;
  }

  // Get referral stats (legacy method - uses analytics)
  async getReferralStats(): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    totalPointsEarned: number;
  }> {
    const analytics = await this.getAnalytics();
    return {
      totalReferrals: analytics.overview.totalReferrals,
      activeReferrals: analytics.overview.totalReferrals - analytics.overview.completedReferrals,
      completedReferrals: analytics.overview.completedReferrals,
      totalPointsEarned: analytics.overview.totalPointsEarned,
    };
  }

  // Copy referral link to clipboard (uses Share API on mobile)
  async copyReferralLink(referralCodeOrObject: string | Referral): Promise<boolean> {
    try {
      let shareUrl: string;

      if (typeof referralCodeOrObject === 'object' && referralCodeOrObject.shareUrl) {
        shareUrl = referralCodeOrObject.shareUrl;
      } else {
        const code = typeof referralCodeOrObject === 'string' 
          ? referralCodeOrObject 
          : referralCodeOrObject.referralCode;
        shareUrl = `https://panhaha.com/register?ref=${code}`;
      }

      // On mobile, use Share API which allows copying
      await Share.share({
        message: shareUrl,
        title: 'Referral Link',
      });
      return true;
    } catch (error: any) {
      // User cancelled share - that's okay
      if (error.message?.includes('cancelled') || error.message?.includes('User')) {
        return false;
      }
      console.error('Failed to copy referral link:', error);
      return false;
    }
  }

  // Share referral via native share
  async shareReferral(referral: Referral, customMessage?: string): Promise<boolean> {
    try {
      const message = customMessage || referral.customMessage || `Join me on Panhaha! Use my referral code: ${referral.referralCode}`;
      
      await Share.share({
        message: `${message}\n${referral.shareUrl}`,
        title: 'Join me on Panhaha!',
      });
      return true;
    } catch (error) {
      console.error('Error sharing referral:', error);
      return false;
    }
  }

  // Format conversion rate
  formatConversionRate(rate: number): string {
    return `${(rate * 100).toFixed(1)}%`;
  }
}

export const referralService = new ReferralService();

