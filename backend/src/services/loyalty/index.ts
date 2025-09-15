import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

// Loyalty Program Configuration
export const LOYALTY_CONFIG = {
  // Point earning rates
  POINTS_PER_DOLLAR: 10,
  FIRST_BOOKING_BONUS: 100,
  STREAK_BONUS_POINTS: 50,
  STREAK_REQUIRED_BOOKINGS: 3,
  
  // Review rewards
  RATING_POINTS: 10,
  REVIEW_COMMENT_POINTS: 30,
  REVIEW_PHOTO_POINTS: 50,
  MAX_REVIEW_REWARDS_PER_MONTH: 3,
  MIN_REVIEW_COMMENT_LENGTH: 20,
  
  // Referral rewards
  REFERRER_POINTS: 200,
  REFERRED_POINTS: 200,
  
  // Discounts
  DISCOUNT_TIERS: [
    { points: 500, discount: 0.05 },   // 5%
    { points: 1000, discount: 0.10 },  // 10%
    { points: 2000, discount: 0.25 }   // 25%
  ],
  
  // Tier thresholds
  TIERS: {
    BRONZE: { min: 0, max: 499 },
    SILVER: { min: 500, max: 1499 },
    GOLD: { min: 1500, max: 4999 },
    PLATINUM: { min: 5000, max: null }
  },
  
  // Point expiration
  POINTS_EXPIRY_MONTHS: 12
};

export interface EarnPointsOptions {
  userId: string;
  points: number;
  reason: string;
  description?: string;
  referenceId?: string;
  type?: 'EARNED' | 'BONUS';
}

// Export types for controller usage
export interface CreateLoyaltyTransactionData {
  userId: string;
  type: 'EARN' | 'REDEEM';
  points: number;
  description: string;
  reason?: string;
  expiresAt?: Date;
  bookingId?: string;
  campaignId?: string;
  referenceId?: string;
}

export interface LoyaltyFilters {
  userId?: string;
  type?: 'EARN' | 'REDEEM' | string;
  startDate?: Date;
  endDate?: Date;
  bookingId?: string;
  campaignId?: string;
  minPoints?: number;
  maxPoints?: number;
}

export interface RedeemPointsData {
  userId: string;
  points: number;
  reason: string;
  description?: string;
  referenceId?: string;
  bookingId?: string;
}

export interface SpendPointsOptions {
  userId: string;
  points: number;
  reason: string;
  description?: string;
  referenceId?: string;
  bookingId?: string;
}

export class LoyaltyService {
  
  // Core Points Management
  static async earnPoints(options: EarnPointsOptions): Promise<boolean> {
    const { userId, points, reason, description, referenceId, type = 'EARNED' } = options;
    
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + LOYALTY_CONFIG.POINTS_EXPIRY_MONTHS);
      
      await prisma.$transaction(async (tx) => {
        // Create loyalty transaction
        await tx.loyaltyTransaction.create({
          data: {
            userId,
            type,
            points,
            reason,
            description,
            referenceId,
            expiresAt
          }
        });
        
        // Update user's total loyalty points
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              increment: points
            }
          }
        });
        
        // Check and update user tier
        await this.updateUserTier(userId, tx);
        
        // Check for badge achievements
        await this.checkBadgeAchievements(userId, reason, tx);
      });
      
      logger.info('Points earned successfully', { userId, points, reason });
      return true;
    } catch (error) {
      logger.error('Failed to earn points', { error, userId, points, reason });
      return false;
    }
  }
  
  static async spendPoints(options: SpendPointsOptions): Promise<boolean> {
    const { userId, points, reason, description, referenceId, bookingId } = options;
    
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true }
      });
      
      if (!user || user.loyaltyPoints < points) {
        logger.warn('Insufficient loyalty points', { userId, requested: points, available: user?.loyaltyPoints });
        return false;
      }
      
      await prisma.$transaction(async (tx) => {
        // Create redemption transaction
        await tx.loyaltyTransaction.create({
          data: {
            userId,
            type: 'REDEEMED',
            points: -points, // Negative for spending
            reason,
            description,
            referenceId
          }
        });
        
        // Update user's total loyalty points
        await tx.user.update({
          where: { id: userId },
          data: {
            loyaltyPoints: {
              decrement: points
            }
          }
        });
        
        // Create points redemption record if it's a booking-related redemption
        if (bookingId) {
          await tx.pointsRedemption.create({
            data: {
              userId,
              type: 'PAYMENT',
              pointsUsed: points,
              bookingId,
              description: description || `Redeemed ${points} points for booking`
            }
          });
        }
        
        // Update user tier (might have dropped)
        await this.updateUserTier(userId, tx);
      });
      
      logger.info('Points spent successfully', { userId, points, reason });
      return true;
    } catch (error) {
      logger.error('Failed to spend points', { error, userId, points, reason });
      return false;
    }
  }
  
  // Booking-related point earning
  static async processBookingCompletion(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true }
      });
      
      if (!booking) {
        logger.warn('Booking not found for loyalty processing', { bookingId });
        return;
      }
      
      // Calculate points (1 point per dollar)
      const basePoints = Math.floor(booking.totalAmount * LOYALTY_CONFIG.POINTS_PER_DOLLAR);
      let totalPoints = basePoints;
      let bonusDescription = '';
      
      // Check for first booking bonus
      const customerBookingCount = await prisma.booking.count({
        where: {
          customerId: booking.customerId,
          status: 'COMPLETED'
        }
      });
      
      if (customerBookingCount === 1) {
        totalPoints += LOYALTY_CONFIG.FIRST_BOOKING_BONUS;
        bonusDescription = ` (includes ${LOYALTY_CONFIG.FIRST_BOOKING_BONUS} first booking bonus)`;
      }
      
      // Check for streak bonus (3 bookings in current month)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      const monthlyBookings = await prisma.booking.count({
        where: {
          customerId: booking.customerId,
          status: 'COMPLETED',
          scheduledAt: {
            gte: currentMonth
          }
        }
      });
      
      if (monthlyBookings >= LOYALTY_CONFIG.STREAK_REQUIRED_BOOKINGS) {
        // Check if streak bonus not already awarded this month
        const streakBonusThisMonth = await prisma.loyaltyTransaction.findFirst({
          where: {
            userId: booking.customerId,
            reason: 'BOOKING_STREAK_BONUS',
            createdAt: {
              gte: currentMonth
            }
          }
        });
        
        if (!streakBonusThisMonth) {
          totalPoints += LOYALTY_CONFIG.STREAK_BONUS_POINTS;
          bonusDescription += ` (includes ${LOYALTY_CONFIG.STREAK_BONUS_POINTS} streak bonus)`;
        }
      }
      
      // Award points
      await this.earnPoints({
        userId: booking.customerId,
        points: totalPoints,
        reason: 'BOOKING_COMPLETED',
        description: `Earned ${totalPoints} points for booking completion${bonusDescription}`,
        referenceId: bookingId
      });
      
      // Check for active campaigns
      await this.processCampaignBonuses(booking.customerId, 'BOOKING', bookingId, basePoints);
      
    } catch (error) {
      logger.error('Failed to process booking completion for loyalty', { error, bookingId });
    }
  }
  
  // Review rewards
  static async processReviewReward(reviewId: string, bookingId: string, customerId: string, rating: number, comment?: string, hasPhoto?: boolean): Promise<void> {
    try {
      // Check monthly review reward cap
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const monthlyRewards = await prisma.reviewReward.count({
        where: {
          userId: customerId,
          monthYear: currentMonth
        }
      });
      
      if (monthlyRewards >= LOYALTY_CONFIG.MAX_REVIEW_REWARDS_PER_MONTH) {
        logger.info('Monthly review reward cap reached', { customerId, monthlyRewards });
        return;
      }
      
      // Calculate reward points
      let points = LOYALTY_CONFIG.RATING_POINTS;
      let rewardType = 'RATING_ONLY';
      
      if (comment && comment.length >= LOYALTY_CONFIG.MIN_REVIEW_COMMENT_LENGTH) {
        points += LOYALTY_CONFIG.REVIEW_COMMENT_POINTS;
        rewardType = 'WITH_COMMENT';
      }
      
      if (hasPhoto) {
        points += LOYALTY_CONFIG.REVIEW_PHOTO_POINTS;
        rewardType = 'WITH_PHOTO';
      }
      
      await prisma.$transaction(async (tx) => {
        // Create review reward record
        await tx.reviewReward.create({
          data: {
            userId: customerId,
            reviewId,
            bookingId,
            pointsEarned: points,
            rewardType,
            monthYear: currentMonth,
            verified: true,
            verifiedAt: new Date()
          }
        });
        
        // Award points
        await this.earnPoints({
          userId: customerId,
          points,
          reason: 'REVIEW_SUBMITTED',
          description: `Earned ${points} points for ${rewardType.toLowerCase().replace('_', ' ')} review`,
          referenceId: reviewId
        });
      });
      
    } catch (error) {
      // Handle unique constraint violation (duplicate reward)
      if (error.code === 'P2002') {
        logger.info('Review reward already processed', { reviewId, customerId });
        return;
      }
      logger.error('Failed to process review reward', { error, reviewId, customerId });
    }
  }
  
  // Referral system
  static async processReferralCompletion(referralCode: string): Promise<void> {
    try {
      const referral = await prisma.loyaltyReferral.findUnique({
        where: { referralCode },
        include: { referrer: true, referred: true }
      });
      
      if (!referral || referral.status !== 'COMPLETED' || referral.pointsAwarded) {
        return;
      }
      
      await prisma.$transaction(async (tx) => {
        // Award points to referrer
        await this.earnPoints({
          userId: referral.referrerId,
          points: LOYALTY_CONFIG.REFERRER_POINTS,
          reason: 'REFERRAL_COMPLETED',
          description: `Earned ${LOYALTY_CONFIG.REFERRER_POINTS} points for successful referral`,
          referenceId: referralCode,
          type: 'BONUS'
        });
        
        // Award points to referred user
        if (referral.referredId) {
          await this.earnPoints({
            userId: referral.referredId,
            points: LOYALTY_CONFIG.REFERRED_POINTS,
            reason: 'REFERRAL_JOINED',
            description: `Earned ${LOYALTY_CONFIG.REFERRED_POINTS} points for joining via referral`,
            referenceId: referralCode,
            type: 'BONUS'
          });
        }
        
        // Mark referral as points awarded
        await tx.loyaltyReferral.update({
          where: { id: referral.id },
          data: { pointsAwarded: true }
        });
      });
      
    } catch (error) {
      logger.error('Failed to process referral completion', { error, referralCode });
    }
  }
  
  // Tier management
  static async updateUserTier(userId: string, tx?: any): Promise<void> {
    const dbClient = tx || prisma;
    
    try {
      const user = await dbClient.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true }
      });
      
      if (!user) return;
      
      let tierName: string;
      if (user.loyaltyPoints >= LOYALTY_CONFIG.TIERS.PLATINUM.min) {
        tierName = 'PLATINUM';
      } else if (user.loyaltyPoints >= LOYALTY_CONFIG.TIERS.GOLD.min) {
        tierName = 'GOLD';
      } else if (user.loyaltyPoints >= LOYALTY_CONFIG.TIERS.SILVER.min) {
        tierName = 'SILVER';
      } else {
        tierName = 'BRONZE';
      }
      
      // Find or create tier
      let tier = await dbClient.loyaltyTier.findUnique({
        where: { name: tierName }
      });
      
      if (!tier) {
        // Create default tiers if they don't exist
        await this.createDefaultTiers(dbClient);
        tier = await dbClient.loyaltyTier.findUnique({
          where: { name: tierName }
        });
      }
      
      // Update user tier
      await dbClient.user.update({
        where: { id: userId },
        data: { loyaltyTierId: tier?.id }
      });
      
    } catch (error) {
      logger.error('Failed to update user tier', { error, userId });
    }
  }

  // Create default loyalty tiers
  static async createDefaultTiers(tx?: any): Promise<void> {
    const dbClient = tx || prisma;
    
    try {
      const defaultTiers = [
        {
          name: 'BRONZE',
          minPoints: LOYALTY_CONFIG.TIERS.BRONZE.min,
          maxPoints: LOYALTY_CONFIG.TIERS.BRONZE.max,
          benefits: JSON.stringify([
            'Basic customer support',
            'Access to standard promotions'
          ]),
          discountPercentage: 0,
          prioritySupport: false,
          exclusiveOffers: false
        },
        {
          name: 'SILVER',
          minPoints: LOYALTY_CONFIG.TIERS.SILVER.min,
          maxPoints: LOYALTY_CONFIG.TIERS.SILVER.max,
          benefits: JSON.stringify([
            'Priority customer support',
            'Early access to new services',
            '5% discount on bookings'
          ]),
          discountPercentage: 5,
          prioritySupport: true,
          exclusiveOffers: false
        },
        {
          name: 'GOLD',
          minPoints: LOYALTY_CONFIG.TIERS.GOLD.min,
          maxPoints: LOYALTY_CONFIG.TIERS.GOLD.max,
          benefits: JSON.stringify([
            'Premium customer support',
            'Exclusive service access',
            '10% discount on bookings',
            'Free service upgrades'
          ]),
          discountPercentage: 10,
          prioritySupport: true,
          exclusiveOffers: true
        },
        {
          name: 'PLATINUM',
          minPoints: LOYALTY_CONFIG.TIERS.PLATINUM.min,
          maxPoints: LOYALTY_CONFIG.TIERS.PLATINUM.max,
          benefits: JSON.stringify([
            'VIP customer support',
            'Personal account manager',
            '15% discount on bookings',
            'Free service upgrades',
            'Exclusive events and offers'
          ]),
          discountPercentage: 15,
          prioritySupport: true,
          exclusiveOffers: true
        }
      ];

      for (const tier of defaultTiers) {
        await dbClient.loyaltyTier.upsert({
          where: { name: tier.name },
          update: {
            minPoints: tier.minPoints,
            maxPoints: tier.maxPoints,
            benefits: tier.benefits,
            discountPercentage: tier.discountPercentage,
            prioritySupport: tier.prioritySupport,
            exclusiveOffers: tier.exclusiveOffers
          },
          create: tier
        });
      }

      logger.info('Default loyalty tiers created/updated successfully');
    } catch (error) {
      logger.error('Failed to create default tiers', { error });
      throw error;
    }
  }
  
  // Badge achievements
  static async checkBadgeAchievements(userId: string, reason: string, tx?: any): Promise<void> {
    const dbClient = tx || prisma;
    
    try {
      // Get user's current stats
      const stats = await this.getUserLoyaltyStats(userId);
      
      // Define badge criteria checks
      const badgeChecks = [
        {
          name: 'SUPER_BOOKER',
          condition: stats.totalBookings >= 10,
          category: 'BOOKING'
        },
        {
          name: 'TOP_REVIEWER',
          condition: stats.totalReviews >= 25,
          category: 'REVIEW'
        },
        {
          name: 'LOYAL_CLIENT',
          condition: stats.totalPoints >= 1000,
          category: 'LOYALTY'
        },
        {
          name: 'REFERRAL_MASTER',
          condition: stats.successfulReferrals >= 5,
          category: 'REFERRAL'
        }
      ];
      
      for (const check of badgeChecks) {
        if (check.condition) {
          await this.awardBadge(userId, check.name, dbClient);
        }
      }
      
    } catch (error) {
      logger.error('Failed to check badge achievements', { error, userId, reason });
    }
  }
  
  static async awardBadge(userId: string, badgeName: string, tx?: any): Promise<void> {
    const dbClient = tx || prisma;
    
    try {
      // Check if user already has this badge
      const existingBadge = await dbClient.userBadge.findFirst({
        where: {
          userId,
          badge: { name: badgeName }
        }
      });
      
      if (existingBadge) return;
      
      // Find or create badge
      let badge = await dbClient.badge.findUnique({
        where: { name: badgeName }
      });
      
      if (!badge) {
        await this.createDefaultBadges(dbClient);
        badge = await dbClient.badge.findUnique({
          where: { name: badgeName }
        });
      }
      
      if (badge) {
        await dbClient.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
            earnedAt: new Date()
          }
        });
        
        logger.info('Badge awarded', { userId, badgeName });
      }
      
    } catch (error) {
      if (error.code !== 'P2002') { // Ignore unique constraint violations
        logger.error('Failed to award badge', { error, userId, badgeName });
      }
    }
  }
  
  // Campaign processing
  static async processCampaignBonuses(userId: string, eventType: string, referenceId: string, basePoints?: number): Promise<void> {
    try {
      const now = new Date();
      const activeCampaigns = await prisma.loyaltyCampaign.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
          OR: [
            { targetUserType: null },
            { targetUserType: 'ALL' },
            { targetUserType: 'CUSTOMER' }
          ]
        }
      });
      
      for (const campaign of activeCampaigns) {
        // Check if user can participate
        const existingRedemptions = await prisma.campaignRedemption.count({
          where: {
            campaignId: campaign.id,
            userId
          }
        });
        
        if (existingRedemptions >= campaign.maxPerUser) continue;
        
        // Calculate bonus points
        let bonusPoints = campaign.bonusPoints;
        if (campaign.multiplier > 1 && basePoints) {
          bonusPoints += Math.floor((basePoints * campaign.multiplier) - basePoints);
        }
        
        if (bonusPoints > 0) {
          await prisma.$transaction(async (tx) => {
            // Create campaign redemption
            await tx.campaignRedemption.create({
              data: {
                campaignId: campaign.id,
                userId,
                pointsEarned: bonusPoints,
                referenceId,
                referenceType: eventType
              }
            });
            
            // Award bonus points
            await this.earnPoints({
              userId,
              points: bonusPoints,
              reason: 'CAMPAIGN_BONUS',
              description: `Earned ${bonusPoints} bonus points from ${campaign.name} campaign`,
              referenceId: campaign.id,
              type: 'BONUS'
            });
            
            // Update campaign redemption count
            await tx.loyaltyCampaign.update({
              where: { id: campaign.id },
              data: {
                currentRedemptions: { increment: 1 }
              }
            });
          });
        }
      }
      
    } catch (error) {
      logger.error('Failed to process campaign bonuses', { error, userId, eventType });
    }
  }
  
  // Utility methods
  
  static async getAvailableDiscounts(points: number): Promise<Array<{ points: number; discount: number }>> {
    return LOYALTY_CONFIG.DISCOUNT_TIERS.filter(tier => points >= tier.points);
  }
  
  static calculateDiscountedAmount(originalAmount: number, discountPercent: number): number {
    return originalAmount * (1 - discountPercent);
  }
  
  // Initialize default data
  static async createDefaultTiers(tx?: any): Promise<void> {
    const dbClient = tx || prisma;
    
    const defaultTiers = [
      {
        name: 'SILVER',
        minPoints: 0,
        maxPoints: 999,
        color: '#C0C0C0',
        icon: 'star',
        benefits: JSON.stringify(['Basic support', 'Standard booking', 'Point earning'])
      },
      {
        name: 'GOLD',
        minPoints: 1000,
        maxPoints: 4999,
        color: '#FFD700',
        icon: 'star-solid',
        benefits: JSON.stringify(['Priority support', 'Early booking access', '5% bonus points'])
      },
      {
        name: 'PLATINUM',
        minPoints: 5000,
        maxPoints: null,
        color: '#E5E4E2',
        icon: 'crown',
        benefits: JSON.stringify(['VIP support', 'Exclusive services', '10% bonus points', 'Free cancellation'])
      }
    ];
    
    for (const tier of defaultTiers) {
      try {
        await dbClient.loyaltyTier.create({ data: tier });
      } catch (error) {
        // Ignore if already exists
        if (error.code !== 'P2002') {
          logger.error('Failed to create default tier', { error, tier: tier.name });
        }
      }
    }
  }
  
  static async createDefaultBadges(tx?: any): Promise<void> {
    const dbClient = tx || prisma;
    
    const defaultBadges = [
      {
        name: 'SUPER_BOOKER',
        description: 'Completed 10+ bookings',
        icon: 'calendar-check',
        color: '#10B981',
        category: 'BOOKING',
        criteria: JSON.stringify({ totalBookings: { gte: 10 } }),
        rarity: 'COMMON'
      },
      {
        name: 'TOP_REVIEWER',
        description: 'Left 25+ reviews',
        icon: 'star',
        color: '#F59E0B',
        category: 'REVIEW',
        criteria: JSON.stringify({ totalReviews: { gte: 25 } }),
        rarity: 'RARE'
      },
      {
        name: 'LOYAL_CLIENT',
        description: 'Earned 1000+ loyalty points',
        icon: 'heart',
        color: '#EF4444',
        category: 'LOYALTY',
        criteria: JSON.stringify({ totalPoints: { gte: 1000 } }),
        rarity: 'EPIC'
      },
      {
        name: 'REFERRAL_MASTER',
        description: 'Successfully referred 5+ friends',
        icon: 'user-group',
        color: '#8B5CF6',
        category: 'REFERRAL',
        criteria: JSON.stringify({ successfulReferrals: { gte: 5 } }),
        rarity: 'LEGENDARY'
      }
    ];
    
    for (const badge of defaultBadges) {
      try {
        await dbClient.badge.create({ data: badge });
      } catch (error) {
        // Ignore if already exists
        if (error.code !== 'P2002') {
          logger.error('Failed to create default badge', { error, badge: badge.name });
        }
      }
    }
  }
  
  // Method aliases for backward compatibility and controller integration
  static async getLoyaltyBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    });
    return user?.loyaltyPoints || 0;
  }
  
  static async getLoyaltyTransactions(filters: LoyaltyFilters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.startDate) where.createdAt = { gte: filters.startDate };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: filters.endDate };
    if (filters.bookingId) where.referenceId = filters.bookingId;
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.minPoints) where.points = { gte: filters.minPoints };
    if (filters.maxPoints) where.points = { ...where.points, lte: filters.maxPoints };
    
    const [transactions, total] = await Promise.all([
      prisma.loyaltyTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.loyaltyTransaction.count({ where })
    ]);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      transactions,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }
  
  static async awardPoints(data: CreateLoyaltyTransactionData): Promise<boolean> {
    return await this.earnPoints({
      userId: data.userId,
      points: data.points,
      reason: data.description,
      referenceId: data.referenceId
    });
  }
  
  static async redeemPoints(data: RedeemPointsData): Promise<boolean> {
    return await this.spendPoints({
      userId: data.userId,
      points: data.points,
      reason: data.reason,
      referenceId: data.bookingId
    });
  }
  
  static async getUserLoyaltyStats(userId: string) {
    try {
      // Get user's full info including related data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          customerBookings: {
            where: { status: 'COMPLETED' }
          },
          specialistBookings: {
            where: { status: 'COMPLETED' }
          },
          reviews: true,
          referralsGiven: {
            where: { status: 'COMPLETED' }
          },
          badges: {
            include: { badge: true }
          }
        }
      });
      
      if (!user) return null;
      
      // Calculate total points from transactions (more accurate than user.loyaltyPoints field)
      const pointsAggregate = await prisma.loyaltyTransaction.aggregate({
        _sum: { points: true },
        where: { userId }
      });
      
      const totalPoints = pointsAggregate._sum.points || 0;
      
      // Determine current tier based on calculated points
      let tier = 'BRONZE';
      if (totalPoints >= LOYALTY_CONFIG.TIERS.PLATINUM.min) {
        tier = 'PLATINUM';
      } else if (totalPoints >= LOYALTY_CONFIG.TIERS.GOLD.min) {
        tier = 'GOLD';
      } else if (totalPoints >= LOYALTY_CONFIG.TIERS.SILVER.min) {
        tier = 'SILVER';
      }
      
      // Get transaction count
      const totalTransactions = await prisma.loyaltyTransaction.count({ 
        where: { userId } 
      });
      
      // Count total bookings for both customer and specialist roles
      const totalBookings = user.customerBookings.length + user.specialistBookings.length;
      
      return {
        userId,
        totalPoints: Math.max(0, totalPoints), // Ensure non-negative
        tier,
        badges: user.badges.map(ub => ub.badge),
        totalBookings,
        totalReviews: user.reviews.length,
        successfulReferrals: user.referralsGiven.length,
        totalTransactions,
        memberSince: user.createdAt
      };
    } catch (error) {
      logger.error('Failed to get user loyalty stats', { error, userId });
      return null;
    }
  }

  static async getLoyaltyStats(userId: string) {
    const userStats = await this.getUserLoyaltyStats(userId);
    
    if (!userStats) {
      return null;
    }
    
    // Transform the user stats to match frontend expectations
    return {
      totalPoints: userStats.totalPoints,
      totalTransactions: userStats.totalTransactions,
      totalBadges: userStats.badges.length,
      totalReferrals: userStats.successfulReferrals,
      totalServices: userStats.totalBookings, // Map totalBookings to totalServices
      currentTier: null, // TODO: Implement tier lookup
      nextTier: null, // TODO: Implement next tier lookup
      pointsToNextTier: 0, // TODO: Calculate points needed for next tier
      monthlyPoints: 0, // TODO: Calculate monthly points
      yearlyPoints: 0, // TODO: Calculate yearly points
      totalSpentPoints: 0 // TODO: Calculate spent points from redemption transactions
    };
  }
  
  static async getLoyaltyTiers() {
    return await prisma.loyaltyTier.findMany({
      orderBy: { minPoints: 'asc' }
    });
  }
  
  static async getUserTier(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    });
    
    if (!user) return null;
    
    const tiers = await this.getLoyaltyTiers();
    return tiers.reverse().find(tier => user.loyaltyPoints >= tier.minPoints) || null;
  }
}

export default LoyaltyService;