import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

// Types
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

export interface RedeemRewardData {
  rewardId: string;
  userId: string;
  bookingId?: string;
}

export interface LoyaltyReward {
  id: string;
  specialistId: string;
  title: string;
  description: string;
  type: string;
  pointsRequired: number;
  discountPercent?: number | null;
  discountAmount?: number | null;
  serviceIds?: string | null;
  maxRedemptions?: number | null;
  currentRedemptions: number;
  usageLimit: string;
  isActive: boolean;
  validFrom: Date;
  validUntil?: Date | null;
  termsConditions?: string | null;
  minimumTier?: string | null;
  createdAt: Date;
  updatedAt: Date;
  specialist?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  userId: string;
  bookingId?: string | null;
  status: string;
  pointsUsed: number;
  discountApplied?: number | null;
  originalAmount?: number | null;
  finalAmount?: number | null;
  redeemedAt: Date;
  usedAt?: Date | null;
  expiresAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  reward: LoyaltyReward;
  user: {
    firstName: string;
    lastName: string;
  };
}

export class RewardsService {
  // Create a new reward (for specialists)
  static async createReward(specialistId: string, data: CreateRewardData): Promise<LoyaltyReward> {
    try {
      logger.info('Creating loyalty reward', { specialistId, title: data.title });

      const reward = await prisma.loyaltyReward.create({
        data: {
          specialistId,
          title: data.title,
          description: data.description,
          type: data.type,
          pointsRequired: data.pointsRequired,
          discountPercent: data.discountPercent,
          discountAmount: data.discountAmount,
          serviceIds: data.serviceIds ? JSON.stringify(data.serviceIds) : null,
          maxRedemptions: data.maxRedemptions,
          usageLimit: data.usageLimit || 'UNLIMITED',
          validFrom: data.validFrom || new Date(),
          validUntil: data.validUntil,
          termsConditions: data.termsConditions,
          minimumTier: data.minimumTier,
        },
        include: {
          specialist: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      logger.info('Loyalty reward created successfully', { rewardId: reward.id });
      return reward;
    } catch (error) {
      logger.error('Failed to create loyalty reward', { error, specialistId });
      throw error;
    }
  }

  // Update a reward
  static async updateReward(rewardId: string, specialistId: string, data: UpdateRewardData): Promise<LoyaltyReward> {
    try {
      logger.info('Updating loyalty reward', { rewardId, specialistId });

      // Verify the reward belongs to the specialist
      const existingReward = await prisma.loyaltyReward.findFirst({
        where: { id: rewardId, specialistId }
      });

      if (!existingReward) {
        throw new Error('Reward not found or access denied');
      }

      const updateData: any = { ...data };
      if (data.serviceIds) {
        updateData.serviceIds = JSON.stringify(data.serviceIds);
      }

      const reward = await prisma.loyaltyReward.update({
        where: { id: rewardId },
        data: updateData,
        include: {
          specialist: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      logger.info('Loyalty reward updated successfully', { rewardId });
      return reward;
    } catch (error) {
      logger.error('Failed to update loyalty reward', { error, rewardId, specialistId });
      throw error;
    }
  }

  // Delete a reward
  static async deleteReward(rewardId: string, specialistId: string): Promise<void> {
    try {
      logger.info('Deleting loyalty reward', { rewardId, specialistId });

      // Verify the reward belongs to the specialist
      const existingReward = await prisma.loyaltyReward.findFirst({
        where: { id: rewardId, specialistId }
      });

      if (!existingReward) {
        throw new Error('Reward not found or access denied');
      }

      await prisma.loyaltyReward.delete({
        where: { id: rewardId }
      });

      logger.info('Loyalty reward deleted successfully', { rewardId });
    } catch (error) {
      logger.error('Failed to delete loyalty reward', { error, rewardId, specialistId });
      throw error;
    }
  }

  // Get rewards for a specialist
  static async getSpecialistRewards(specialistId: string, includeInactive = false): Promise<LoyaltyReward[]> {
    try {
      const rewards = await prisma.loyaltyReward.findMany({
        where: {
          specialistId,
          ...(includeInactive ? {} : { isActive: true })
        },
        include: {
          specialist: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return rewards;
    } catch (error) {
      logger.error('Failed to get specialist rewards', { error, specialistId });
      throw error;
    }
  }

  // Get available rewards for a customer
  static async getAvailableRewards(userId: string, specialistId?: string): Promise<LoyaltyReward[]> {
    try {
      // Get user's loyalty tier and points
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          loyaltyTier: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const whereClause: any = {
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ],
        pointsRequired: { lte: user.loyaltyPoints }
      };

      // Filter by specialist if provided
      if (specialistId) {
        whereClause.specialistId = specialistId;
      }

      // Filter by minimum tier if user has a tier
      if (user.loyaltyTier) {
        const tierHierarchy = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
        const userTierIndex = tierHierarchy.indexOf(user.loyaltyTier.name);

        if (userTierIndex >= 0) {
          const eligibleTiers = tierHierarchy.slice(0, userTierIndex + 1);
          whereClause.OR = [
            { minimumTier: null },
            { minimumTier: { in: eligibleTiers } }
          ];
        }
      } else {
        // User has no tier, only show rewards with no tier requirement
        whereClause.minimumTier = null;
      }

      const rewards = await prisma.loyaltyReward.findMany({
        where: whereClause,
        include: {
          specialist: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: [
          { pointsRequired: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return rewards;
    } catch (error) {
      logger.error('Failed to get available rewards', { error, userId, specialistId });
      throw error;
    }
  }

  // Redeem a reward
  static async redeemReward(data: RedeemRewardData): Promise<RewardRedemption> {
    try {
      logger.info('Redeeming loyalty reward', data);

      // Get reward details
      const reward = await prisma.loyaltyReward.findUnique({
        where: { id: data.rewardId },
        include: {
          specialist: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!reward) {
        throw new Error('Reward not found');
      }

      if (!reward.isActive) {
        throw new Error('Reward is not active');
      }

      if (reward.validUntil && reward.validUntil < new Date()) {
        throw new Error('Reward has expired');
      }

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        include: {
          loyaltyTier: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has enough points
      if (user.loyaltyPoints < reward.pointsRequired) {
        throw new Error('Insufficient loyalty points');
      }

      // Check tier requirement
      if (reward.minimumTier) {
        if (!user.loyaltyTier) {
          throw new Error('Minimum loyalty tier required');
        }

        const tierHierarchy = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
        const requiredTierIndex = tierHierarchy.indexOf(reward.minimumTier);
        const userTierIndex = tierHierarchy.indexOf(user.loyaltyTier.name);

        if (userTierIndex < requiredTierIndex) {
          throw new Error(`Minimum tier ${reward.minimumTier} required`);
        }
      }

      // Check usage limits
      if (reward.maxRedemptions && reward.currentRedemptions >= reward.maxRedemptions) {
        throw new Error('Reward redemption limit reached');
      }

      if (reward.usageLimit === 'ONCE_PER_USER') {
        const existingRedemption = await prisma.rewardRedemption.findFirst({
          where: {
            rewardId: data.rewardId,
            userId: data.userId,
            status: { in: ['PENDING', 'APPROVED', 'USED'] }
          }
        });

        if (existingRedemption) {
          throw new Error('You can only redeem this reward once');
        }
      }

      // Calculate expiration (30 days from redemption)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create redemption and update user points
      const result = await prisma.$transaction(async (prisma) => {
        // Deduct points from user
        await prisma.user.update({
          where: { id: data.userId },
          data: {
            loyaltyPoints: { decrement: reward.pointsRequired }
          }
        });

        // Create loyalty transaction
        await prisma.loyaltyTransaction.create({
          data: {
            userId: data.userId,
            type: 'REDEEMED',
            points: -reward.pointsRequired,
            reason: 'REWARD_REDEMPTION',
            description: `Redeemed: ${reward.title}`,
            referenceId: data.rewardId
          }
        });

        // Create redemption record
        const redemption = await prisma.rewardRedemption.create({
          data: {
            rewardId: data.rewardId,
            userId: data.userId,
            bookingId: data.bookingId,
            pointsUsed: reward.pointsRequired,
            expiresAt,
            status: 'APPROVED' // Auto-approve for now
          },
          include: {
            reward: {
              include: {
                specialist: {
                  include: {
                    user: {
                      select: { firstName: true, lastName: true }
                    }
                  }
                }
              }
            },
            user: {
              select: { firstName: true, lastName: true }
            }
          }
        });

        // Update reward redemption count
        await prisma.loyaltyReward.update({
          where: { id: data.rewardId },
          data: {
            currentRedemptions: { increment: 1 }
          }
        });

        return redemption;
      });

      logger.info('Loyalty reward redeemed successfully', {
        redemptionId: result.id,
        rewardId: data.rewardId,
        userId: data.userId
      });

      return result;
    } catch (error) {
      logger.error('Failed to redeem loyalty reward', { error, data });
      throw error;
    }
  }

  // Get user's reward redemptions
  static async getUserRedemptions(userId: string): Promise<RewardRedemption[]> {
    try {
      const redemptions = await prisma.rewardRedemption.findMany({
        where: { userId },
        include: {
          reward: {
            include: {
              specialist: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          },
          user: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return redemptions;
    } catch (error) {
      logger.error('Failed to get user redemptions', { error, userId });
      throw error;
    }
  }

  // Apply reward to booking (when booking is made)
  static async applyRewardToBooking(redemptionId: string, bookingId: string, originalAmount: number): Promise<number> {
    try {
      logger.info('Applying reward to booking', { redemptionId, bookingId, originalAmount });

      const redemption = await prisma.rewardRedemption.findUnique({
        where: { id: redemptionId },
        include: { reward: true }
      });

      if (!redemption) {
        throw new Error('Redemption not found');
      }

      if (redemption.status !== 'APPROVED') {
        throw new Error('Redemption not approved');
      }

      if (redemption.expiresAt && redemption.expiresAt < new Date()) {
        throw new Error('Redemption has expired');
      }

      const reward = redemption.reward;
      let discountAmount = 0;
      let finalAmount = originalAmount;

      // Calculate discount based on reward type
      if (reward.type === 'PERCENTAGE_OFF' && reward.discountPercent) {
        discountAmount = (originalAmount * reward.discountPercent) / 100;
      } else if (reward.type === 'DISCOUNT_VOUCHER' && reward.discountAmount) {
        discountAmount = Math.min(reward.discountAmount, originalAmount);
      } else if (reward.type === 'FREE_SERVICE') {
        discountAmount = originalAmount;
      }

      finalAmount = Math.max(0, originalAmount - discountAmount);

      // Update redemption with booking details
      await prisma.rewardRedemption.update({
        where: { id: redemptionId },
        data: {
          bookingId,
          originalAmount,
          discountApplied: discountAmount,
          finalAmount,
          status: 'USED',
          usedAt: new Date()
        }
      });

      logger.info('Reward applied to booking successfully', {
        redemptionId,
        bookingId,
        discountAmount,
        finalAmount
      });

      return finalAmount;
    } catch (error) {
      logger.error('Failed to apply reward to booking', { error, redemptionId, bookingId });
      throw error;
    }
  }

  // Get reward by ID
  static async getRewardById(rewardId: string): Promise<LoyaltyReward | null> {
    try {
      const reward = await prisma.loyaltyReward.findUnique({
        where: { id: rewardId },
        include: {
          specialist: {
            include: {
              user: {
                select: { firstName: true, lastName: true }
              }
            }
          }
        }
      });

      return reward;
    } catch (error) {
      logger.error('Failed to get reward by ID', { error, rewardId });
      throw error;
    }
  }
}

export default RewardsService;
