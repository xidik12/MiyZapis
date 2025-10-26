import { apiClient } from './api';
import {
  Referral,
  ReferralConfigResponse,
  CreateReferralRequest,
  ProcessReferralRequest,
  MyReferralsResponse,
  ReferralAnalytics,
  ReferralFilters
} from '../types/referral';
import { ApiResponse } from '../types';

class ReferralService {
  private baseUrl = '/referral';

  /**
   * Get referral configuration and user limits
   */
  async getConfig(): Promise<ReferralConfigResponse> {
    const response = await apiClient.get<ReferralConfigResponse>(`${this.baseUrl}/config`);
    return response.data!;
  }

  /**
   * Create a new referral
   */
  async createReferral(data: CreateReferralRequest): Promise<Referral> {
    const response = await apiClient.post<{ referral: Referral }>(`${this.baseUrl}/create`, data);
    return response.data!.referral;
  }

  /**
   * Get user's referrals with pagination and filters
   */
  async getMyReferrals(filters: ReferralFilters = {}): Promise<MyReferralsResponse> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/my-referrals?${queryString}` : `${this.baseUrl}/my-referrals`;

    const response = await apiClient.get<MyReferralsResponse>(url);
    return response.data!;
  }

  /**
   * Get referral by code (public endpoint)
   */
  async getReferralByCode(referralCode: string): Promise<Referral> {
    const response = await apiClient.get<{ referral: Referral }>(`${this.baseUrl}/code/${referralCode}`);
    return response.data!.referral;
  }

  /**
   * Process referral completion
   */
  async processReferral(data: ProcessReferralRequest): Promise<boolean> {
    const response = await apiClient.post<{ success: boolean; message: string }>(`${this.baseUrl}/process`, data);
    return response.data!.success;
  }

  /**
   * Get referral analytics
   */
  async getAnalytics(): Promise<ReferralAnalytics> {
    const response = await apiClient.get<{ analytics: ReferralAnalytics }>(`${this.baseUrl}/analytics`);
    return response.data!.analytics;
  }

  /**
   * Track referral link click
   */
  async trackClick(referralCode: string): Promise<void> {
    await apiClient.post(`${this.baseUrl}/track/${referralCode}/click`);
  }

  /**
   * Copy referral link to clipboard
   * Can accept either a referral code string or full referral object
   */
  async copyReferralLink(referralCodeOrObject: string | Referral): Promise<boolean> {
    try {
      let shareUrl: string;

      // If we received a full referral object, use its shareUrl directly
      if (typeof referralCodeOrObject === 'object' && referralCodeOrObject.shareUrl) {
        shareUrl = referralCodeOrObject.shareUrl;
      } else {
        // Otherwise fetch the referral by code
        const referralCode = typeof referralCodeOrObject === 'string'
          ? referralCodeOrObject
          : referralCodeOrObject.referralCode;
        const referral = await this.getReferralByCode(referralCode);
        shareUrl = referral.shareUrl;
      }

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Failed to copy referral link:', error);
      return false;
    }
  }

  /**
   * Share referral via native Web Share API or fallback
   */
  async shareReferral(referral: Referral, customMessage?: string): Promise<boolean> {
    const message = customMessage || referral.customMessage || `Join me on our platform! Use my referral code: ${referral.referralCode}`;

    const shareData = {
      title: 'Join me on our platform!',
      text: message,
      url: referral.shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      } else {
        // Fallback: copy to clipboard
        return await this.copyReferralLink(referral.referralCode);
      }
    } catch (error) {
      console.error('Error sharing referral:', error);
      return false;
    }
  }

  /**
   * Get formatted reward display text
   */
  getRewardDisplayText(type: string, value: number): string {
    switch (type) {
      case 'POINTS':
        return `${value} points`;
      case 'CREDIT':
        return `$${value} credit`;
      case 'DISCOUNT':
        return `${value}% discount`;
      default:
        return `${value}`;
    }
  }

  /**
   * Get referral type display name
   */
  getReferralTypeDisplayName(type: string): string {
    switch (type) {
      case 'CUSTOMER_TO_CUSTOMER':
        return 'Refer a Customer';
      case 'SPECIALIST_TO_CUSTOMER':
        return 'Refer a Customer (Specialist)';
      case 'CUSTOMER_TO_SPECIALIST':
        return 'Refer a Specialist';
      default:
        return type;
    }
  }

  /**
   * Get status color class for UI
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'COMPLETED':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'EXPIRED':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  }

  /**
   * Check if referral can be shared
   */
  canShareReferral(referral: Referral): boolean {
    return referral.status === 'PENDING' && !referral.isExpired;
  }

  /**
   * Calculate days until expiry
   */
  getDaysUntilExpiry(expiresAt: string): number {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Format conversion rate as percentage
   */
  formatConversionRate(rate: number): string {
    return `${rate.toFixed(1)}%`;
  }

  /**
   * Get share options for social platforms
   */
  getShareOptions(referral: Referral): Array<{
    name: string;
    url: string;
    icon: string;
    color: string;
  }> {
    const url = encodeURIComponent(referral.shareUrl);
    const text = encodeURIComponent(referral.customMessage || `Join me on our platform! Use my referral code: ${referral.referralCode}`);

    return [
      {
        name: 'Twitter',
        url: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
        icon: 'twitter',
        color: 'text-blue-500'
      },
      {
        name: 'Facebook',
        url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        icon: 'facebook',
        color: 'text-blue-600'
      },
      {
        name: 'WhatsApp',
        url: `https://wa.me/?text=${text} ${url}`,
        icon: 'whatsapp',
        color: 'text-green-500'
      },
      {
        name: 'Telegram',
        url: `https://t.me/share/url?url=${url}&text=${text}`,
        icon: 'telegram',
        color: 'text-blue-400'
      },
      {
        name: 'LinkedIn',
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        icon: 'linkedin',
        color: 'text-blue-700'
      }
    ];
  }

  /**
   * Validate referral form data
   */
  validateReferralForm(data: CreateReferralRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.referralType) {
      errors.push('Referral type is required');
    }

    if (!data.targetUserType) {
      errors.push('Target user type is required');
    }

    if (data.customMessage && data.customMessage.length > 500) {
      errors.push('Custom message must be 500 characters or less');
    }

    if (data.expiresInDays && (data.expiresInDays < 1 || data.expiresInDays > 365)) {
      errors.push('Expiry days must be between 1 and 365');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get analytics summary text
   */
  getAnalyticsSummary(analytics: ReferralAnalytics): string {
    const { overview } = analytics;
    const rate = this.formatConversionRate(overview.conversionRate);

    return `You've made ${overview.totalReferrals} referrals with a ${rate} conversion rate, earning ${overview.totalPointsEarned} points.`;
  }
}

export const referralService = new ReferralService();
export default referralService;