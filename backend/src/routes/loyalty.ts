import { Router, Request, Response } from 'express';
import { validationResult, query, body, param } from 'express-validator';
import { authenticateToken } from '@/middleware/auth/jwt';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { ErrorCodes, formatValidationErrors, calculatePaginationOffset, createPaginationMeta } from '@/types';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import LoyaltyService, { LOYALTY_CONFIG } from '@/services/loyalty';
import { prisma } from '@/config/database';

const router = Router();

// Get loyalty program statistics (frontend expects flat stats object)
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(
          ErrorCodes.UNAUTHORIZED,
          'User not authenticated',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Base stats
    const baseStats = await LoyaltyService.getUserLoyaltyStats(userId);
    if (!baseStats) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCodes.NOT_FOUND,
          'User not found',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Compute monthly and yearly earned points (sum of positive points)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Load transactions in periods to apply provider safeguard filter
    const [txMonth, txYear, totalSpentAgg] = await Promise.all([
      prisma.loyaltyTransaction.findMany({ where: { userId, createdAt: { gte: monthStart } } }),
      prisma.loyaltyTransaction.findMany({ where: { userId, createdAt: { gte: yearStart } } }),
      prisma.loyaltyTransaction.aggregate({ _sum: { points: true }, where: { userId, type: 'REDEEMED' } })
    ]);

    const filterTx = async (txs: any[]) => {
      const bookingIds = txs.filter(t => t.reason === 'BOOKING_COMPLETED' && !!t.referenceId).map(t => t.referenceId as string);
      let bookingById: Record<string, { customerId: string }> = {};
      if (bookingIds.length > 0) {
        const bookings = await prisma.booking.findMany({ where: { id: { in: bookingIds } }, select: { id: true, customerId: true } });
        bookingById = bookings.reduce((acc, b) => { acc[b.id] = { customerId: b.customerId }; return acc; }, {} as any);
      }
      return txs.reduce((sum, t) => {
        if (t.points > 0 && t.reason === 'BOOKING_COMPLETED' && t.referenceId) {
          const b = bookingById[t.referenceId];
          if (!b || b.customerId !== userId) return sum;
        }
        return sum + (t.points > 0 ? t.points : 0);
      }, 0);
    };

    const [monthlyPoints, yearlyPoints] = await Promise.all([filterTx(txMonth), filterTx(txYear)]);
    const totalSpentPoints = Math.abs(totalSpentAgg._sum.points || 0); // Convert to positive number

    // Determine current and next tier from configured tiers and/or DB tiers
    let tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' } });
    if (!tiers || tiers.length === 0) {
      // Ensure default tiers exist
      await LoyaltyService.createDefaultTiers();
      tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' } });
    }
    const totalPoints = baseStats.totalPoints;

    const currentTierRec = [...tiers].reverse().find(t => totalPoints >= t.minPoints) || null;
    const nextTierRec = tiers.find(t => totalPoints < t.minPoints) || null;

    const mapTier = (t: typeof currentTierRec) => t && ({
      id: t.id,
      name: t.name,
      slug: t.name.toLowerCase(),
      minPoints: t.minPoints,
      maxPoints: t.maxPoints || undefined,
      benefits: (() => { try { return JSON.parse(t.benefits); } catch { return []; } })(),
      discountPercentage: undefined as number | undefined,
      prioritySupport: false,
      exclusiveOffers: false,
      createdAt: t.createdAt
    });

    const currentTier = mapTier(currentTierRec) || null;
    const nextTier = mapTier(nextTierRec) || null;
    const pointsToNextTier = nextTierRec ? Math.max(0, nextTierRec.minPoints - totalPoints) : 0;

    // Shape response to match frontend LoyaltyStats
    const responsePayload = {
      totalPoints,
      totalTransactions: baseStats.totalTransactions,
      totalBadges: baseStats.badges?.length || 0,
      totalReferrals: baseStats.successfulReferrals || 0,
      currentTier,
      nextTier,
      pointsToNextTier,
      monthlyPoints,
      yearlyPoints,
      totalSpentPoints
    };

    res.json(createSuccessResponse(responsePayload));
  } catch (error) {
    logger.error('Get loyalty stats (frontend) error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get loyalty statistics',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get loyalty tiers (public, shape mapped for frontend)
router.get('/tiers', async (req: Request, res: Response) => {
  try {
    let tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' } });
    if (!tiers || tiers.length === 0) {
      await LoyaltyService.createDefaultTiers();
      tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' } });
    }

    const mapped = tiers.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.name.toLowerCase(),
      minPoints: t.minPoints,
      maxPoints: t.maxPoints || undefined,
      benefits: (() => { try { return JSON.parse(t.benefits); } catch { return []; } })(),
      discountPercentage: undefined as number | undefined,
      prioritySupport: false,
      exclusiveOffers: false,
      createdAt: t.createdAt
    }));

    res.json(createSuccessResponse({ tiers: mapped }));
  } catch (error) {
    logger.error('Get loyalty tiers (frontend) error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get loyalty tiers',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get user's loyalty profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    const stats = await LoyaltyService.getUserLoyaltyStats(userId);
    if (!stats) {
      // User exists but has no loyalty data yet - create default profile
      logger.info('Creating default loyalty profile for user:', userId);

      // Return default loyalty profile for new users
      return res.json(createSuccessResponse({
        profile: {
          currentPoints: 0,
          totalEarned: 0,
          totalRedeemed: 0,
          totalTransactions: 0,
          totalBookings: 0,
          totalSpent: 0,
          totalSaved: 0,
          currentTier: 'BRONZE',
          tierName: 'Bronze',
          nextTier: 'SILVER',
          pointsToNextTier: LOYALTY_CONFIG.TIERS.SILVER.min,
          progressToNext: 0,
          memberSince: new Date().toISOString(),
          badges: [],
          availableDiscounts: [],
          recentActivity: []
        }
      }));
    }

    const availableDiscounts = await LoyaltyService.getAvailableDiscounts(stats.totalPoints);
    
    // Calculate next tier progress
    let nextTier = null;
    let progressToNext = 0;
    if (stats.totalPoints < LOYALTY_CONFIG.TIERS.SILVER.min) {
      nextTier = 'SILVER';
      progressToNext = stats.totalPoints / LOYALTY_CONFIG.TIERS.SILVER.min;
    } else if (stats.totalPoints < LOYALTY_CONFIG.TIERS.GOLD.min) {
      nextTier = 'GOLD';
      progressToNext = (stats.totalPoints - LOYALTY_CONFIG.TIERS.SILVER.min) / 
                      (LOYALTY_CONFIG.TIERS.GOLD.min - LOYALTY_CONFIG.TIERS.SILVER.min);
    } else if (stats.totalPoints < LOYALTY_CONFIG.TIERS.PLATINUM.min) {
      nextTier = 'PLATINUM';
      progressToNext = (stats.totalPoints - LOYALTY_CONFIG.TIERS.GOLD.min) / 
                      (LOYALTY_CONFIG.TIERS.PLATINUM.min - LOYALTY_CONFIG.TIERS.GOLD.min);
    } else {
      progressToNext = 1;
    }

    res.json(createSuccessResponse({
      profile: {
        totalPoints: stats.totalPoints,
        tier: stats.tier,
        badges: stats.badges,
        nextTier,
        progressToNext: Math.min(progressToNext, 1),
        availableDiscounts,
        stats: {
          totalBookings: stats.totalBookings,
          totalReviews: stats.totalReviews,
          successfulReferrals: stats.successfulReferrals,
          totalTransactions: stats.totalTransactions
        }
      }
    }));

  } catch (error) {
    logger.error('Get loyalty profile error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get loyalty profile',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get loyalty transactions history
router.get('/transactions', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['EARNED', 'REDEEMED', 'EXPIRED', 'BONUS']).withMessage('Invalid transaction type')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    const { page = 1, limit = 20, type } = req.query;
    const offset = calculatePaginationOffset(Number(page), Number(limit));

    const whereClause: any = { userId };
    if (type) {
      whereClause.type = type;
    }

    const totalCount = await prisma.loyaltyTransaction.count({ where: whereClause });

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const paginationMeta = createPaginationMeta(Number(page), Number(limit), totalCount);

    res.json(createSuccessResponse({
      transactions,
      pagination: paginationMeta
    }));

  } catch (error) {
    logger.error('Get loyalty transactions error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get loyalty transactions',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get available discount options
router.get('/discounts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found', req.headers['x-request-id'] as string)
      );
    }

    const availableDiscounts = await LoyaltyService.getAvailableDiscounts(user.loyaltyPoints);

    res.json(createSuccessResponse({
      currentPoints: user.loyaltyPoints,
      availableDiscounts,
      discountTiers: LOYALTY_CONFIG.DISCOUNT_TIERS
    }));

  } catch (error) {
    logger.error('Get available discounts error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get available discounts',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Apply discount to booking amount
router.post('/apply-discount', [
  authenticateToken,
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    const { amount, points } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyPoints: true }
    });

    if (!user || user.loyaltyPoints < points) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.INSUFFICIENT_POINTS,
          'Insufficient loyalty points',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Find applicable discount tier
    const availableDiscounts = await LoyaltyService.getAvailableDiscounts(points);
    const applicableDiscount = availableDiscounts.find(d => d.points <= points);

    if (!applicableDiscount) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.INVALID_DISCOUNT,
          'No applicable discount for the specified points',
          req.headers['x-request-id'] as string
        )
      );
    }

    const discountedAmount = LoyaltyService.calculateDiscountedAmount(amount, applicableDiscount.discount);
    const savedAmount = amount - discountedAmount;

    res.json(createSuccessResponse({
      originalAmount: amount,
      discountPercent: applicableDiscount.discount * 100,
      discountedAmount,
      savedAmount,
      pointsRequired: applicableDiscount.points
    }));

  } catch (error) {
    logger.error('Apply discount error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to apply discount',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get user's badges
router.get('/badges', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' }
    });

    // Get all available badges for progress tracking
    const allBadges = await prisma.badge.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    const earnedBadgeIds = userBadges.map(ub => ub.badge.id);
    const availableBadges = allBadges.filter(badge => !earnedBadgeIds.includes(badge.id));

    res.json(createSuccessResponse({
      earnedBadges: userBadges.map(ub => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
        progress: ub.progress
      })),
      availableBadges: availableBadges.map(badge => ({
        ...badge,
        earnedAt: null,
        progress: 0
      }))
    }));

  } catch (error) {
    logger.error('Get user badges error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get user badges',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Create referral code
router.post('/referrals/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    // Generate unique referral code
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    let referralCode = generateCode();
    
    // Ensure uniqueness
    let existingCode = await prisma.loyaltyReferral.findUnique({ where: { referralCode } });
    while (existingCode) {
      referralCode = generateCode();
      existingCode = await prisma.loyaltyReferral.findUnique({ where: { referralCode } });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6); // 6 months expiry

    const referral = await prisma.loyaltyReferral.create({
      data: {
        referrerId: userId,
        referralCode,
        referrerPoints: LOYALTY_CONFIG.REFERRER_POINTS,
        referredPoints: LOYALTY_CONFIG.REFERRED_POINTS,
        expiresAt
      }
    });

    res.json(createSuccessResponse({
      referralCode: referral.referralCode,
      referrerPoints: referral.referrerPoints,
      referredPoints: referral.referredPoints,
      expiresAt: referral.expiresAt
    }));

  } catch (error) {
    logger.error('Create referral code error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to create referral code',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get user's referrals
router.get('/referrals', [
  authenticateToken,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = calculatePaginationOffset(Number(page), Number(limit));

    const totalCount = await prisma.loyaltyReferral.count({
      where: { referrerId: userId }
    });

    const referrals = await prisma.loyaltyReferral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const paginationMeta = createPaginationMeta(Number(page), Number(limit), totalCount);

    res.json(createSuccessResponse({
      referrals,
      pagination: paginationMeta
    }));

  } catch (error) {
    logger.error('Get user referrals error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get user referrals',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Use referral code (for new users)
router.post('/referrals/use', [
  authenticateToken,
  body('referralCode').isString().isLength({ min: 4, max: 10 }).withMessage('Invalid referral code format')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    const { referralCode } = req.body;

    const referral = await prisma.loyaltyReferral.findUnique({
      where: { referralCode },
      include: { referrer: true }
    });

    if (!referral) {
      return res.status(404).json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'Referral code not found', req.headers['x-request-id'] as string)
      );
    }

    if (referral.expiresAt < new Date()) {
      return res.status(400).json(
        createErrorResponse(ErrorCodes.EXPIRED_CODE, 'Referral code has expired', req.headers['x-request-id'] as string)
      );
    }

    if (referral.referrerId === userId) {
      return res.status(400).json(
        createErrorResponse(ErrorCodes.INVALID_OPERATION, 'Cannot use your own referral code', req.headers['x-request-id'] as string)
      );
    }

    if (referral.referredId) {
      return res.status(400).json(
        createErrorResponse(ErrorCodes.ALREADY_USED, 'Referral code already used', req.headers['x-request-id'] as string)
      );
    }

    // Update referral with referred user
    await prisma.loyaltyReferral.update({
      where: { id: referral.id },
      data: {
        referredId: userId,
        status: 'PENDING' // Will be completed after first booking
      }
    });

    res.json(createSuccessResponse({
      message: 'Referral code applied successfully',
      referrerName: `${referral.referrer.firstName} ${referral.referrer.lastName}`,
      bonusPoints: referral.referredPoints
    }));

  } catch (error) {
    logger.error('Use referral code error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to use referral code',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get active loyalty campaigns
router.get('/campaigns', authenticateToken, async (req: Request, res: Response) => {
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
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedCampaigns = activeCampaigns.map(campaign => ({
      ...campaign,
      rules: JSON.parse(campaign.rules),
      targetTiers: campaign.targetTiers ? JSON.parse(campaign.targetTiers) : null,
      specialistIds: campaign.specialistIds ? JSON.parse(campaign.specialistIds) : null
    }));

    res.json(createSuccessResponse({
      campaigns: formattedCampaigns
    }));

  } catch (error) {
    logger.error('Get loyalty campaigns error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get loyalty campaigns',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get loyalty program configuration (public)
router.get('/config', async (req: Request, res: Response) => {
  try {
    res.json(createSuccessResponse({
      pointsPerDollar: LOYALTY_CONFIG.POINTS_PER_DOLLAR,
      firstBookingBonus: LOYALTY_CONFIG.FIRST_BOOKING_BONUS,
      streakBonus: {
        points: LOYALTY_CONFIG.STREAK_BONUS_POINTS,
        requiredBookings: LOYALTY_CONFIG.STREAK_REQUIRED_BOOKINGS
      },
      reviewRewards: {
        customerPoints: LOYALTY_CONFIG.CUSTOMER_REVIEW_POINTS,
        specialistPointsPerStar: LOYALTY_CONFIG.SPECIALIST_POINTS_PER_STAR,
        monthlyLimit: LOYALTY_CONFIG.MAX_REVIEW_REWARDS_PER_MONTH,
        minCommentLength: LOYALTY_CONFIG.MIN_REVIEW_COMMENT_LENGTH
      },
      referralRewards: {
        referrer: LOYALTY_CONFIG.REFERRER_POINTS,
        referred: LOYALTY_CONFIG.REFERRED_POINTS
      },
      discountTiers: LOYALTY_CONFIG.DISCOUNT_TIERS,
      tiers: LOYALTY_CONFIG.TIERS,
      pointsExpiryMonths: LOYALTY_CONFIG.POINTS_EXPIRY_MONTHS
    }));

  } catch (error) {
    logger.error('Get loyalty config error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get loyalty configuration',
        req.headers['x-request-id'] as string
      )
    );
  }
});

export default router;
