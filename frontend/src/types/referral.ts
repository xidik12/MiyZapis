import { BaseEntity } from './index';

// Referral Types
export type ReferralType = 'CUSTOMER_TO_CUSTOMER' | 'SPECIALIST_TO_CUSTOMER' | 'CUSTOMER_TO_SPECIALIST';
export type ReferralStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';
export type RewardType = 'POINTS' | 'DISCOUNT' | 'CREDIT' | 'CUSTOM';
export type InviteChannel = 'EMAIL' | 'SMS' | 'SOCIAL' | 'DIRECT' | 'LINK';

// Referral Interface
export interface Referral extends BaseEntity {
  referrerId: string;
  referredId?: string;
  referralCode: string;
  referralType: ReferralType;
  targetUserType: 'CUSTOMER' | 'SPECIALIST';
  status: ReferralStatus;

  // Reward Configuration
  referrerRewardType: RewardType;
  referrerRewardValue?: number;
  referredRewardType: RewardType;
  referredRewardValue?: number;

  // Points specific
  referrerPoints: number;
  referredPoints: number;
  pointsAwarded: boolean;

  // Meta information
  inviteChannel?: InviteChannel;
  customMessage?: string;
  specialistId?: string;

  // Tracking
  clickCount: number;
  viewCount: number;

  // Dates
  expiresAt: string;
  completedAt?: string;

  // First booking reference
  firstBookingId?: string;

  // Relationships (populated from backend)
  referrer?: {
    id: string;
    firstName: string;
    lastName: string;
    userType: string;
    avatar?: string;
  };
  referred?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    createdAt: string;
  };

  // Frontend helpers
  shareUrl: string;
  isExpired: boolean;
}

// Configuration Interface
export interface ReferralConfig {
  REWARDS: {
    [key in ReferralType]: {
      referrerRewardType: RewardType;
      referrerRewardValue: number;
      referredRewardType: RewardType;
      referredRewardValue: number;
    };
  };
  CODE_LENGTH: number;
  CODE_PREFIX: {
    [key in ReferralType]: string;
  };
  DEFAULT_EXPIRY_DAYS: number;
  MAX_EXPIRY_DAYS: number;
  MAX_REFERRALS_PER_USER_PER_DAY: number;
  MAX_PENDING_REFERRALS_PER_USER: number;
}

// Request Interfaces
export interface CreateReferralRequest {
  referralType: ReferralType;
  targetUserType: 'CUSTOMER' | 'SPECIALIST';
  inviteChannel?: InviteChannel;
  customMessage?: string;
  specialistId?: string;
  expiresInDays?: number;
}

export interface ProcessReferralRequest {
  referralCode: string;
  referredUserId: string;
  firstBookingId?: string;
}

// Response Interfaces
export interface ReferralConfigResponse {
  config: ReferralConfig;
  userType: string;
  isSpecialist: boolean;
  availableTypes: ReferralType[];
  limits: {
    dailyUsed: number;
    dailyLimit: number;
    pendingUsed: number;
    pendingLimit: number;
  };
}

export interface MyReferralsResponse {
  referrals: Referral[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ReferralAnalytics {
  overview: {
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    expiredReferrals: number;
    conversionRate: number;
    totalPointsEarned: number;
  };
  byType: Record<string, number>;
  topPerformingTypes: Array<{
    type: ReferralType;
    completedCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    referralCode: string;
    referralType: ReferralType;
    status: ReferralStatus;
    createdAt: string;
    completedAt?: string;
    referred?: {
      name: string;
      userType: string;
    };
  }>;
}

// Filter Interfaces
export interface ReferralFilters {
  status?: ReferralStatus;
  type?: ReferralType;
  limit?: number;
  offset?: number;
}

// Component Props
export interface ReferralCardProps {
  referral: Referral;
  onCopyLink: (referralCode: string) => void;
  onShare: (referral: Referral) => void;
  className?: string;
}

export interface ReferralFormData {
  referralType: ReferralType;
  targetUserType: 'CUSTOMER' | 'SPECIALIST';
  inviteChannel: InviteChannel;
  customMessage: string;
  specialistId?: string;
  expiresInDays: number;
}

export interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReferralRequest) => Promise<void>;
  config: ReferralConfigResponse;
  loading?: boolean;
}

export interface ReferralDashboardProps {
  userType: 'customer' | 'specialist';
  className?: string;
}

export interface ReferralTrackerProps {
  referrals: Referral[];
  analytics: ReferralAnalytics;
  loading?: boolean;
  className?: string;
}

// Share options
export interface ShareOption {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  action: (url: string, message?: string) => void;
  color: string;
}

// Reward display helpers
export interface RewardDisplay {
  type: RewardType;
  value: number;
  formatted: string;
  icon: string;
  color: string;
}