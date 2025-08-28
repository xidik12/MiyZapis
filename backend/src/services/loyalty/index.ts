import { LoyaltyTransaction } from '@prisma/client';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

export interface CreateLoyaltyTransactionData {
  userId: string;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
  points: number;
  reason: string;
  description?: string;
  referenceId?: string;
  expiresAt?: Date;
}

export interface LoyaltyFilters {
  userId?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  minPoints?: number;
  maxPoints?: number;
}

export interface RedeemPointsData {
  userId: string;
  points: number;
  reason: string;
  description?: string;
  referenceId?: string;
}

export class LoyaltyService {
  /**
   * Get user's current loyalty balance
   */
  static async getLoyaltyBalance(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          loyaltyPoints: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Get recent transactions for activity summary
      const recentTransactions = await prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      // Calculate total earned and redeemed
      const allTransactions = await prisma.loyaltyTransaction.findMany({
        where: { userId },
        select: { type: true, points: true },
      });

      const totalEarned = allTransactions
        .filter(t => ['EARNED', 'BONUS'].includes(t.type))
        .reduce((sum, t) => sum + t.points, 0);

      const totalRedeemed = allTransactions
        .filter(t => t.type === 'REDEEMED')
        .reduce((sum, t) => sum + Math.abs(t.points), 0);

      return {
        balance: user.loyaltyPoints,
        totalEarned,
        totalRedeemed,
        recentTransactions: recentTransactions.map(t => ({
          ...t,
          isPositive: ['EARNED', 'BONUS'].includes(t.type),
        })),
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch (error) {
      logger.error('Error getting loyalty balance:', error);
      throw error;
    }
  }

  /**
   * Get loyalty transaction history with pagination
   */
  static async getLoyaltyTransactions(
    filters: LoyaltyFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const where: any = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      if (filters.minPoints !== undefined || filters.maxPoints !== undefined) {
        where.points = {};
        if (filters.minPoints !== undefined) {
          where.points.gte = filters.minPoints;
        }
        if (filters.maxPoints !== undefined) {
          where.points.lte = filters.maxPoints;
        }
      }

      const offset = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        prisma.loyaltyTransaction.findMany({
          where,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.loyaltyTransaction.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        transactions: transactions.map(t => ({
          ...t,
          isPositive: ['EARNED', 'BONUS'].includes(t.type),
          isExpired: t.expiresAt && t.expiresAt < new Date(),
        })),
        page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error('Error getting loyalty transactions:', error);
      throw error;
    }
  }

  /**
   * Award loyalty points to a user
   */
  static async awardPoints(data: CreateLoyaltyTransactionData): Promise<LoyaltyTransaction> {
    try {
      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (data.points <= 0) {
        throw new Error('POINTS_MUST_BE_POSITIVE');
      }

      // Create transaction and update user balance in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update user balance
        await tx.user.update({
          where: { id: data.userId },
          data: {
            loyaltyPoints: { increment: data.points },
          },
        });

        // Create transaction record
        const transaction = await tx.loyaltyTransaction.create({
          data: {
            userId: data.userId,
            type: data.type,
            points: data.points,
            reason: data.reason,
            description: data.description,
            referenceId: data.referenceId,
            expiresAt: data.expiresAt,
          },
        });

        return transaction;
      });

      logger.info(`Awarded ${data.points} loyalty points to user ${data.userId}: ${data.reason}`);
      return result;
    } catch (error) {
      logger.error('Error awarding loyalty points:', error);
      throw error;
    }
  }

  /**
   * Redeem loyalty points
   */
  static async redeemPoints(data: RedeemPointsData): Promise<LoyaltyTransaction> {
    try {
      // Validate user and balance
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (data.points <= 0) {
        throw new Error('POINTS_MUST_BE_POSITIVE');
      }

      if (user.loyaltyPoints < data.points) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      // Create transaction and update user balance
      const result = await prisma.$transaction(async (tx) => {
        // Update user balance
        await tx.user.update({
          where: { id: data.userId },
          data: {
            loyaltyPoints: { decrement: data.points },
          },
        });

        // Create transaction record (negative points for redemption)
        const transaction = await tx.loyaltyTransaction.create({
          data: {
            userId: data.userId,
            type: 'REDEEMED',
            points: -data.points, // Negative for redemption
            reason: data.reason,
            description: data.description,
            referenceId: data.referenceId,
          },
        });

        return transaction;
      });

      logger.info(`Redeemed ${data.points} loyalty points for user ${data.userId}: ${data.reason}`);
      return result;
    } catch (error) {
      logger.error('Error redeeming loyalty points:', error);
      throw error;
    }
  }

  /**
   * Get loyalty program statistics
   */
  static async getLoyaltyStats(userId?: string) {
    try {
      const where = userId ? { userId } : {};

      const [
        totalTransactions,
        totalPointsEarned,
        totalPointsRedeemed,
        activeUsers,
        recentActivity,
      ] = await Promise.all([
        prisma.loyaltyTransaction.count({ where }),
        prisma.loyaltyTransaction.aggregate({
          where: {
            ...where,
            type: { in: ['EARNED', 'BONUS'] },
          },
          _sum: { points: true },
        }),
        prisma.loyaltyTransaction.aggregate({
          where: {
            ...where,
            type: 'REDEEMED',
          },
          _sum: { points: true },
        }),
        userId ? null : prisma.user.count({
          where: { loyaltyPoints: { gt: 0 } },
        }),
        prisma.loyaltyTransaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

      return {
        totalTransactions,
        totalPointsEarned: totalPointsEarned._sum.points || 0,
        totalPointsRedeemed: Math.abs(totalPointsRedeemed._sum.points || 0),
        activeUsers,
        recentActivity: recentActivity.map(t => ({
          ...t,
          isPositive: ['EARNED', 'BONUS'].includes(t.type),
        })),
      };
    } catch (error) {
      logger.error('Error getting loyalty stats:', error);
      throw error;
    }
  }

  /**
   * Get loyalty tiers and benefits (static for now)
   */
  static getLoyaltyTiers() {
    return {
      tiers: [
        {
          name: 'Bronze',
          minPoints: 0,
          maxPoints: 999,
          benefits: [
            'Earn 1 point per $1 spent',
            'Birthday bonus: 100 points',
            'Access to basic promotions',
          ],
          badgeColor: '#CD7F32',
        },
        {
          name: 'Silver',
          minPoints: 1000,
          maxPoints: 4999,
          benefits: [
            'Earn 1.5 points per $1 spent',
            'Birthday bonus: 200 points',
            'Early access to sales',
            '5% discount on selected services',
          ],
          badgeColor: '#C0C0C0',
        },
        {
          name: 'Gold',
          minPoints: 5000,
          maxPoints: 9999,
          benefits: [
            'Earn 2 points per $1 spent',
            'Birthday bonus: 500 points',
            'Priority booking support',
            '10% discount on selected services',
            'Free service upgrade once per month',
          ],
          badgeColor: '#FFD700',
        },
        {
          name: 'Platinum',
          minPoints: 10000,
          maxPoints: null,
          benefits: [
            'Earn 3 points per $1 spent',
            'Birthday bonus: 1000 points',
            'VIP customer support',
            '15% discount on all services',
            'Free service upgrade anytime',
            'Exclusive access to premium specialists',
          ],
          badgeColor: '#E5E4E2',
        },
      ],
      pointsValue: {
        currency: 'USD',
        exchangeRate: 0.01, // 100 points = $1
      },
    };
  }

  /**
   * Get user's loyalty tier
   */
  static async getUserTier(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const tiers = this.getLoyaltyTiers().tiers;
      const userTier = tiers.find(tier => {
        if (tier.maxPoints === null) {
          return user.loyaltyPoints >= tier.minPoints;
        }
        return user.loyaltyPoints >= tier.minPoints && user.loyaltyPoints <= tier.maxPoints;
      }) || tiers[0];

      const nextTier = tiers.find(tier => tier.minPoints > user.loyaltyPoints);
      const pointsToNextTier = nextTier ? nextTier.minPoints - user.loyaltyPoints : 0;

      return {
        currentTier: userTier,
        nextTier,
        pointsToNextTier,
        currentPoints: user.loyaltyPoints,
      };
    } catch (error) {
      logger.error('Error getting user tier:', error);
      throw error;
    }
  }

  /**
   * Expire old loyalty points (for cleanup jobs)
   */
  static async expireOldPoints() {
    try {
      const now = new Date();
      
      const expiredTransactions = await prisma.loyaltyTransaction.findMany({
        where: {
          expiresAt: { lt: now },
          type: { in: ['EARNED', 'BONUS'] },
        },
      });

      const expiredCount = expiredTransactions.length;
      let totalExpiredPoints = 0;

      // Process expired transactions
      for (const transaction of expiredTransactions) {
        // Create expiration transaction
        await prisma.loyaltyTransaction.create({
          data: {
            userId: transaction.userId,
            type: 'EXPIRED',
            points: -transaction.points,
            reason: 'Points expired',
            description: `Expired points from transaction: ${transaction.reason}`,
            referenceId: transaction.id,
          },
        });

        // Update user balance
        await prisma.user.update({
          where: { id: transaction.userId },
          data: {
            loyaltyPoints: { decrement: transaction.points },
          },
        });

        totalExpiredPoints += transaction.points;
      }

      logger.info(`Expired ${totalExpiredPoints} points from ${expiredCount} transactions`);
      
      return {
        expiredTransactions: expiredCount,
        totalExpiredPoints,
      };
    } catch (error) {
      logger.error('Error expiring old points:', error);
      throw error;
    }
  }
}