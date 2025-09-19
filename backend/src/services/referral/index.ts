import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export type ReferralType = 'CUSTOMER_TO_CUSTOMER' | 'SPECIALIST_TO_CUSTOMER' | 'CUSTOMER_TO_SPECIALIST';
export type UserType = 'CUSTOMER' | 'SPECIALIST';
export type RewardType = 'POINTS' | 'DISCOUNT' | 'CREDIT' | 'CUSTOM';
export type ReferralStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED';
export type InviteChannel = 'EMAIL' | 'SMS' | 'SOCIAL' | 'DIRECT' | 'LINK';

export interface CreateReferralData {
  referrerId: string;
  referralType: ReferralType;
  targetUserType: UserType;
  inviteChannel?: InviteChannel;
  customMessage?: string;
  specialistId?: string; // For specialist-specific referrals
  expiresInDays?: number; // Default 30 days
}

export interface ReferralRewards {
  referrerRewardType: RewardType;
  referrerRewardValue?: number; // Points or monetary value
  referredRewardType: RewardType;
  referredRewardValue?: number; // Points or monetary value
}

export interface ProcessReferralData {
  referralCode: string;
  referredUserId: string;
  firstBookingId?: string;
}

// Enhanced referral configuration
export const REFERRAL_CONFIG = {
  // Default rewards by referral type
  REWARDS: {
    CUSTOMER_TO_CUSTOMER: {
      referrerRewardType: 'POINTS' as RewardType,
      referrerRewardValue: 100,
      referredRewardType: 'POINTS' as RewardType,
      referredRewardValue: 50,
    },
    SPECIALIST_TO_CUSTOMER: {
      referrerRewardType: 'CREDIT' as RewardType,
      referrerRewardValue: 10, // $10 credit
      referredRewardType: 'DISCOUNT' as RewardType,
      referredRewardValue: 15, // 15% discount on first booking
    },
    CUSTOMER_TO_SPECIALIST: {
      referrerRewardType: 'POINTS' as RewardType,
      referrerRewardValue: 200, // Higher reward for bringing specialists
      referredRewardType: 'CREDIT' as RewardType,
      referredRewardValue: 25, // $25 credit for joining specialist
    },
  },

  // Referral code settings
  CODE_LENGTH: 8,
  CODE_PREFIX: {
    CUSTOMER_TO_CUSTOMER: 'CC',
    SPECIALIST_TO_CUSTOMER: 'SC',
    CUSTOMER_TO_SPECIALIST: 'CS',
  },

  // Expiration settings
  DEFAULT_EXPIRY_DAYS: 30,
  MAX_EXPIRY_DAYS: 365,

  // Limits
  MAX_REFERRALS_PER_USER_PER_DAY: 10,
  MAX_PENDING_REFERRALS_PER_USER: 50,
};

export class ReferralService {

  // Generate unique referral code
  private static generateReferralCode(referralType: ReferralType): string {
    const prefix = REFERRAL_CONFIG.CODE_PREFIX[referralType];
    const randomStr = crypto.randomBytes(REFERRAL_CONFIG.CODE_LENGTH)
      .toString('base64url')
      .substring(0, REFERRAL_CONFIG.CODE_LENGTH)
      .toUpperCase();
    return `${prefix}${randomStr}`;
  }

  // Get default rewards for referral type
  private static getDefaultRewards(referralType: ReferralType): ReferralRewards {
    return REFERRAL_CONFIG.REWARDS[referralType];
  }

  // Create a new referral
  static async createReferral(data: CreateReferralData) {
    try {
      // Validate referrer exists and get their type
      const referrer = await prisma.user.findUnique({
        where: { id: data.referrerId },
        include: { specialist: true }
      });

      if (!referrer || !referrer.isActive) {
        throw new Error('REFERRER_NOT_FOUND_OR_INACTIVE');
      }

      // Validate referral type matches user type
      const referrerIsSpecialist = !!referrer.specialist;
      if (data.referralType === 'SPECIALIST_TO_CUSTOMER' && !referrerIsSpecialist) {
        throw new Error('INVALID_REFERRAL_TYPE_FOR_USER');
      }

      // Check daily limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayReferrals = await prisma.loyaltyReferral.count({
        where: {
          referrerId: data.referrerId,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (todayReferrals >= REFERRAL_CONFIG.MAX_REFERRALS_PER_USER_PER_DAY) {
        throw new Error('DAILY_REFERRAL_LIMIT_EXCEEDED');
      }

      // Check pending referrals limit
      const pendingReferrals = await prisma.loyaltyReferral.count({
        where: {
          referrerId: data.referrerId,
          status: 'PENDING',
        },
      });

      if (pendingReferrals >= REFERRAL_CONFIG.MAX_PENDING_REFERRALS_PER_USER) {
        throw new Error('PENDING_REFERRALS_LIMIT_EXCEEDED');
      }

      // Generate unique referral code
      let referralCode: string;
      let attempts = 0;
      do {
        referralCode = this.generateReferralCode(data.referralType);
        const existing = await prisma.loyaltyReferral.findUnique({
          where: { referralCode },
        });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('FAILED_TO_GENERATE_UNIQUE_CODE');
      }

      // Calculate expiry date
      const expiresAt = new Date();
      const expiryDays = Math.min(
        data.expiresInDays || REFERRAL_CONFIG.DEFAULT_EXPIRY_DAYS,
        REFERRAL_CONFIG.MAX_EXPIRY_DAYS
      );
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      // Get default rewards
      const rewards = this.getDefaultRewards(data.referralType);

      // Create referral
      const referral = await prisma.loyaltyReferral.create({
        data: {
          referrerId: data.referrerId,
          referralCode,
          referralType: data.referralType,
          targetUserType: data.targetUserType,
          inviteChannel: data.inviteChannel,
          customMessage: data.customMessage,
          specialistId: data.specialistId,
          expiresAt,
          referrerRewardType: rewards.referrerRewardType,
          referrerRewardValue: rewards.referrerRewardValue,
          referredRewardType: rewards.referredRewardType,
          referredRewardValue: rewards.referredRewardValue,
          referrerPoints: rewards.referrerRewardType === 'POINTS' ? rewards.referrerRewardValue || 0 : 0,
          referredPoints: rewards.referredRewardType === 'POINTS' ? rewards.referredRewardValue || 0 : 0,
        },
        include: {
          referrer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userType: true,
            },
          },
        },
      });

      logger.info('Referral created successfully', {
        referralId: referral.id,
        referralCode: referral.referralCode,
        referrerId: data.referrerId,
        referralType: data.referralType,
      });

      return referral;
    } catch (error) {
      logger.error('Error creating referral', { error, data });
      throw error;
    }
  }

  // Get referral by code
  static async getReferralByCode(referralCode: string) {
    try {
      const referral = await prisma.loyaltyReferral.findUnique({
        where: { referralCode },
        include: {
          referrer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userType: true,
              avatar: true,
            },
          },
          referred: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userType: true,
            },
          },
        },
      });

      if (!referral) {
        throw new Error('REFERRAL_NOT_FOUND');
      }

      // Check if referral is expired
      if (referral.expiresAt < new Date()) {
        if (referral.status === 'PENDING') {
          await prisma.loyaltyReferral.update({
            where: { id: referral.id },
            data: { status: 'EXPIRED' },
          });
        }
        throw new Error('REFERRAL_EXPIRED');
      }

      return referral;
    } catch (error) {
      logger.error('Error getting referral by code', { error, referralCode });
      throw error;
    }
  }

  // Track referral view/click
  static async trackReferralActivity(referralCode: string, activityType: 'VIEW' | 'CLICK') {
    try {
      const field = activityType === 'VIEW' ? 'viewCount' : 'clickCount';
      await prisma.loyaltyReferral.update({
        where: { referralCode },
        data: {
          [field]: {
            increment: 1,
          },
        },
      });

      logger.info('Referral activity tracked', { referralCode, activityType });
    } catch (error) {
      logger.error('Error tracking referral activity', { error, referralCode, activityType });
    }
  }

  // Process referral completion
  static async processReferralCompletion(data: ProcessReferralData) {
    try {
      const referral = await prisma.loyaltyReferral.findUnique({
        where: { referralCode: data.referralCode },
        include: {
          referrer: true,
          referred: true,
        },
      });

      if (!referral) {
        throw new Error('REFERRAL_NOT_FOUND');
      }

      if (referral.status !== 'PENDING') {
        throw new Error('REFERRAL_ALREADY_PROCESSED');
      }

      if (referral.expiresAt < new Date()) {
        await prisma.loyaltyReferral.update({
          where: { id: referral.id },
          data: { status: 'EXPIRED' },
        });
        throw new Error('REFERRAL_EXPIRED');
      }

      // Validate referred user
      const referredUser = await prisma.user.findUnique({
        where: { id: data.referredUserId },
        include: { specialist: true },
      });

      if (!referredUser) {
        throw new Error('REFERRED_USER_NOT_FOUND');
      }

      // Validate user type matches target
      const referredIsSpecialist = !!referredUser.specialist;
      if (referral.targetUserType === 'SPECIALIST' && !referredIsSpecialist) {
        throw new Error('REFERRED_USER_TYPE_MISMATCH');
      }
      if (referral.targetUserType === 'CUSTOMER' && referredIsSpecialist) {
        throw new Error('REFERRED_USER_TYPE_MISMATCH');
      }

      // Process completion in transaction
      await prisma.$transaction(async (tx) => {
        // Update referral status
        await tx.loyaltyReferral.update({
          where: { id: referral.id },
          data: {
            referredId: data.referredUserId,
            status: 'COMPLETED',
            completedAt: new Date(),
            firstBookingId: data.firstBookingId,
            pointsAwarded: true,
          },
        });

        // Award points/credits to referrer
        if (referral.referrerRewardType === 'POINTS' && referral.referrerPoints > 0) {
          await tx.user.update({
            where: { id: referral.referrerId },
            data: {
              loyaltyPoints: {
                increment: referral.referrerPoints,
              },
            },
          });

          // Create loyalty transaction for referrer
          await tx.loyaltyTransaction.create({
            data: {
              userId: referral.referrerId,
              type: 'EARN',
              points: referral.referrerPoints,
              description: `Referral reward: ${referral.referralType}`,
              reason: 'REFERRAL_COMPLETED',
              referenceId: referral.referralCode,
            },
          });
        } else if (referral.referrerRewardType === 'CREDIT' && referral.referrerRewardValue) {
          // Add wallet credit
          await tx.user.update({
            where: { id: referral.referrerId },
            data: {
              walletBalance: {
                increment: referral.referrerRewardValue,
              },
            },
          });

          // Create wallet transaction
          await tx.walletTransaction.create({
            data: {
              userId: referral.referrerId,
              type: 'CREDIT',
              amount: referral.referrerRewardValue,
              description: `Referral reward: ${referral.referralType}`,
              status: 'COMPLETED',
              referenceId: referral.referralCode,
            },
          });
        }

        // Award points/credits to referred user
        if (referral.referredRewardType === 'POINTS' && referral.referredPoints > 0) {
          await tx.user.update({
            where: { id: data.referredUserId },
            data: {
              loyaltyPoints: {
                increment: referral.referredPoints,
              },
            },
          });

          // Create loyalty transaction for referred user
          await tx.loyaltyTransaction.create({
            data: {
              userId: data.referredUserId,
              type: 'EARN',
              points: referral.referredPoints,
              description: `Welcome bonus: ${referral.referralType}`,
              reason: 'REFERRAL_JOINED',
              referenceId: referral.referralCode,
            },
          });
        } else if (referral.referredRewardType === 'CREDIT' && referral.referredRewardValue) {
          // Add wallet credit
          await tx.user.update({
            where: { id: data.referredUserId },
            data: {
              walletBalance: {
                increment: referral.referredRewardValue,
              },
            },
          });

          // Create wallet transaction
          await tx.walletTransaction.create({
            data: {
              userId: data.referredUserId,
              type: 'CREDIT',
              amount: referral.referredRewardValue,
              description: `Welcome bonus: ${referral.referralType}`,
              status: 'COMPLETED',
              referenceId: referral.referralCode,
            },
          });
        }
      });

      logger.info('Referral completion processed successfully', {
        referralCode: data.referralCode,
        referrerId: referral.referrerId,
        referredUserId: data.referredUserId,
      });

      return true;
    } catch (error) {
      logger.error('Error processing referral completion', { error, data });
      throw error;
    }
  }

  // Get user referrals (sent)
  static async getUserReferrals(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const [referrals, total] = await Promise.all([
        prisma.loyaltyReferral.findMany({
          where: { referrerId: userId },
          include: {
            referred: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                userType: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.loyaltyReferral.count({
          where: { referrerId: userId },
        }),
      ]);

      return {
        referrals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting user referrals', { error, userId });
      throw error;
    }
  }

  // Get user referral stats
  static async getUserReferralStats(userId: string) {
    try {
      const stats = await prisma.loyaltyReferral.aggregate({
        where: { referrerId: userId },
        _count: {
          _all: true,
        },
        _sum: {
          referrerPoints: true,
          clickCount: true,
          viewCount: true,
        },
      });

      const statusBreakdown = await prisma.loyaltyReferral.groupBy({
        by: ['status'],
        where: { referrerId: userId },
        _count: {
          _all: true,
        },
      });

      const typeBreakdown = await prisma.loyaltyReferral.groupBy({
        by: ['referralType'],
        where: { referrerId: userId },
        _count: {
          _all: true,
        },
      });

      return {
        totalReferrals: stats._count._all || 0,
        totalPointsEarned: stats._sum.referrerPoints || 0,
        totalClicks: stats._sum.clickCount || 0,
        totalViews: stats._sum.viewCount || 0,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item.status] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
        typeBreakdown: typeBreakdown.reduce((acc, item) => {
          acc[item.referralType] = item._count._all;
          return acc;
        }, {} as Record<string, number>),
      };
    } catch (error) {
      logger.error('Error getting user referral stats', { error, userId });
      throw error;
    }
  }

  // Generate referral link
  static generateReferralLink(referralCode: string, baseUrl: string): string {
    return `${baseUrl}/referral/${referralCode}`;
  }

  // Validate referral for booking
  static async validateReferralForBooking(referralCode: string, userId: string) {
    try {
      const referral = await this.getReferralByCode(referralCode);

      // Check if user is trying to use their own referral
      if (referral.referrerId === userId) {
        throw new Error('CANNOT_USE_OWN_REFERRAL');
      }

      // Check if referral is already used
      if (referral.status !== 'PENDING') {
        throw new Error('REFERRAL_ALREADY_USED');
      }

      return referral;
    } catch (error) {
      logger.error('Error validating referral for booking', { error, referralCode, userId });
      throw error;
    }
  }

  // Clean up expired referrals
  static async cleanupExpiredReferrals() {
    try {
      const result = await prisma.loyaltyReferral.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      logger.info('Expired referrals cleaned up', { count: result.count });
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired referrals', { error });
      throw error;
    }
  }

  // Get referral analytics for a user
  static async getReferralAnalytics(userId: string) {
    try {
      const [totalReferrals, completedReferrals, pendingReferrals, expiredReferrals, totalRewards] = await Promise.all([
        // Total referrals created
        prisma.loyaltyReferral.count({
          where: { referrerId: userId }
        }),

        // Completed referrals
        prisma.loyaltyReferral.count({
          where: { referrerId: userId, status: 'COMPLETED' }
        }),

        // Pending referrals
        prisma.loyaltyReferral.count({
          where: { referrerId: userId, status: 'PENDING' }
        }),

        // Expired referrals
        prisma.loyaltyReferral.count({
          where: { referrerId: userId, status: 'EXPIRED' }
        }),

        // Total rewards earned
        prisma.loyaltyReferral.aggregate({
          where: {
            referrerId: userId,
            status: 'COMPLETED',
            pointsAwarded: true
          },
          _sum: {
            referrerPoints: true
          }
        })
      ]);

      // Get referrals by type
      const referralsByType = await prisma.loyaltyReferral.groupBy({
        by: ['referralType'],
        where: { referrerId: userId },
        _count: {
          id: true
        }
      });

      // Get conversion rates
      const conversionRate = totalReferrals > 0 ? (completedReferrals / totalReferrals) * 100 : 0;

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await prisma.loyaltyReferral.findMany({
        where: {
          referrerId: userId,
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          referred: {
            select: {
              firstName: true,
              lastName: true,
              userType: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Get top performing referral types
      const topPerformingTypes = await prisma.loyaltyReferral.groupBy({
        by: ['referralType'],
        where: {
          referrerId: userId,
          status: 'COMPLETED'
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      return {
        overview: {
          totalReferrals,
          completedReferrals,
          pendingReferrals,
          expiredReferrals,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalPointsEarned: totalRewards._sum.referrerPoints || 0
        },
        byType: referralsByType.reduce((acc, item) => {
          acc[item.referralType] = item._count.id;
          return acc;
        }, {} as Record<string, number>),
        topPerformingTypes: topPerformingTypes.map(item => ({
          type: item.referralType,
          completedCount: item._count.id
        })),
        recentActivity: recentActivity.map(referral => ({
          id: referral.id,
          referralCode: referral.referralCode,
          referralType: referral.referralType,
          status: referral.status,
          createdAt: referral.createdAt,
          completedAt: referral.completedAt,
          referred: referral.referred ? {
            name: `${referral.referred.firstName} ${referral.referred.lastName}`,
            userType: referral.referred.userType
          } : null
        }))
      };
    } catch (error) {
      logger.error('Error getting referral analytics', { error, userId });
      throw error;
    }
  }
}