import { Router, Request, Response } from 'express';
import { RewardsService, CreateRewardData, UpdateRewardData, RedeemRewardData } from '../services/rewards';
import { authenticateToken } from '@/middleware/auth/jwt';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createRewardSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  type: z.enum(['DISCOUNT_VOUCHER', 'SERVICE_CREDIT', 'FREE_SERVICE', 'PERCENTAGE_OFF']),
  pointsRequired: z.number().int().positive(),
  discountPercent: z.number().min(1).max(100).optional(),
  discountAmount: z.number().positive().optional(),
  serviceIds: z.array(z.string()).optional(),
  maxRedemptions: z.number().int().positive().optional(),
  usageLimit: z.enum(['UNLIMITED', 'ONCE_PER_USER', 'LIMITED_TOTAL']).optional(),
  validFrom: z.string().transform((val) => new Date(val)).optional(),
  validUntil: z.string().transform((val) => new Date(val)).optional(),
  termsConditions: z.string().max(2000).optional(),
  minimumTier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional()
});

const updateRewardSchema = createRewardSchema.partial().extend({
  isActive: z.boolean().optional()
});

const redeemRewardSchema = z.object({
  rewardId: z.string(),
  bookingId: z.string().optional()
});

// Helper function to check if user is specialist
const requireSpecialist = async (req: Request, res: Response, next: any) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.userType !== 'SPECIALIST') {
      return res.status(403).json(createErrorResponse('FORBIDDEN', 'Access denied. Specialists only.'));
    }
    next();
  } catch (error) {
    return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
  }
};

// Note: Specialists should also be able to redeem rewards for their own bookings.
// We therefore do not restrict redemption to customers only.

// Specialist Routes (for creating and managing rewards)

/**
 * POST /api/v1/rewards
 * Create a new reward (specialists only)
 */
router.post('/', authenticateToken, requireSpecialist, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const specialistId = user?.id;

    if (!specialistId) {
      return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    // Validate request body
    const validationResult = createRewardSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid reward data'));
    }

    const data: CreateRewardData = validationResult.data;
    const reward = await RewardsService.createReward(specialistId, data);

    logger.info('Reward created successfully', {
      rewardId: reward.id,
      specialistId,
      title: reward.title
    });

    res.status(201).json(createSuccessResponse({ reward }));
  } catch (error) {
    logger.error('Failed to create reward:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to create reward'));
  }
});

/**
 * GET /api/v1/rewards/specialist
 * Get rewards for current specialist
 */
router.get('/specialist', authenticateToken, requireSpecialist, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const specialistId = user?.id;

    if (!specialistId) {
      return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    const includeInactive = req.query.includeInactive === 'true';
    logger.info('Fetching specialist rewards', { specialistId, includeInactive });
    const rewards = await RewardsService.getSpecialistRewards(specialistId, includeInactive);

    res.json(createSuccessResponse({ rewards }));
  } catch (error) {
    logger.error('Failed to get specialist rewards', {
      errorName: (error as any)?.name,
      errorMessage: (error as any)?.message,
      errorCode: (error as any)?.code,
      errorStack: (error as any)?.stack,
    });
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to get rewards'));
  }
});

/**
 * GET /api/v1/rewards/specialist/:specialistId
 * Get rewards for specific specialist (public)
 */
router.get('/specialist/:specialistId', async (req: Request, res: Response) => {
  try {
    const { specialistId } = req.params;
    logger.info('Fetching public specialist rewards', { specialistId });
    const rewards = await RewardsService.getSpecialistRewards(specialistId, false);

    res.json(createSuccessResponse({ rewards }));
  } catch (error) {
    logger.error('Failed to get public specialist rewards', {
      errorName: (error as any)?.name,
      errorMessage: (error as any)?.message,
      errorCode: (error as any)?.code,
      errorStack: (error as any)?.stack,
    });
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to get rewards'));
  }
});

/**
 * PUT /api/v1/rewards/:rewardId
 * Update a reward (specialist owner only)
 */
router.put('/:rewardId', authenticateToken, requireSpecialist, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const specialistId = user?.id;
    const { rewardId } = req.params;

    if (!specialistId) {
      return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    // Validate request body
    const validationResult = updateRewardSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid reward data'));
    }

    const data: UpdateRewardData = validationResult.data;
    const reward = await RewardsService.updateReward(rewardId, specialistId, data);

    logger.info('Reward updated successfully', {
      rewardId,
      specialistId,
      title: reward.title
    });

    res.json(createSuccessResponse({ reward }));
  } catch (error) {
    logger.error('Failed to update reward:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Reward not found'));
    } else if (error instanceof Error && error.message.includes('not authorized')) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Not authorized to update this reward'));
    } else {
      res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to update reward'));
    }
  }
});

/**
 * DELETE /api/v1/rewards/:rewardId
 * Delete a reward (specialist owner only)
 */
router.delete('/:rewardId', authenticateToken, requireSpecialist, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const specialistId = user?.id;
    const { rewardId } = req.params;

    if (!specialistId) {
      return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    await RewardsService.deleteReward(rewardId, specialistId);

    logger.info('Reward deleted successfully', {
      rewardId,
      specialistId
    });

    res.json(createSuccessResponse({ message: 'Reward deleted successfully' }));
  } catch (error) {
    logger.error('Failed to delete reward:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Reward not found'));
    } else if (error instanceof Error && error.message.includes('not authorized')) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'Not authorized to delete this reward'));
    } else {
      res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to delete reward'));
    }
  }
});

// Customer Routes (for browsing and redeeming rewards)

/**
 * GET /api/v1/rewards/available
 * Get available rewards for customers
 */
router.get('/available', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const userId = user?.id;

    if (!userId) {
      return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    const specialistId = req.query.specialistId as string;
    logger.info('Fetching available rewards', { userId, specialistId });
    const rewards = await RewardsService.getAvailableRewards(userId, specialistId);

    res.json(createSuccessResponse({ rewards }));
  } catch (error) {
    logger.error('Failed to get available rewards', {
      errorName: (error as any)?.name,
      errorMessage: (error as any)?.message,
      errorCode: (error as any)?.code,
      errorStack: (error as any)?.stack,
    });
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to get available rewards'));
  }
});

/**
 * POST /api/v1/rewards/redeem
 * Redeem a reward (customers only)
 */
router.post('/redeem', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const userId = user?.id;

    if (!userId) {
      return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    // Validate request body
    const validationResult = redeemRewardSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid redemption data'));
    }

    const { rewardId, bookingId } = validationResult.data;
    const redemptionData: RedeemRewardData = {
      userId,
      rewardId,
      bookingId
    };

    const redemption = await RewardsService.redeemReward(redemptionData);

    logger.info('Reward redeemed successfully', {
      redemptionId: redemption.id,
      rewardId,
      userId
    });

    res.status(201).json(createSuccessResponse({ redemption }));
  } catch (error) {
    logger.error('Failed to redeem reward:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Reward not found'));
    } else if (error instanceof Error && error.message.includes('insufficient points')) {
      res.status(400).json(createErrorResponse('INSUFFICIENT_POINTS', 'Insufficient loyalty points'));
    } else if (error instanceof Error && error.message.includes('not available')) {
      res.status(400).json(createErrorResponse('REWARD_UNAVAILABLE', 'Reward is not available'));
    } else {
      res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to redeem reward'));
    }
  }
});

/**
 * GET /api/v1/rewards/redemptions
 * Get user's reward redemptions (customers only)
 */
router.get('/redemptions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    const userId = user?.id;

    if (!userId) {
      return res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    logger.info('Fetching user redemptions', { userId });
    const redemptions = await RewardsService.getUserRedemptions(userId);

    res.json(createSuccessResponse({ redemptions }));
  } catch (error) {
    logger.error('Failed to get user redemptions', {
      errorName: (error as any)?.name,
      errorMessage: (error as any)?.message,
      errorCode: (error as any)?.code,
      errorStack: (error as any)?.stack,
    });
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to get redemptions'));
  }
});

/**
 * GET /api/v1/rewards/:rewardId
 * Get a specific reward by ID
 */
router.get('/:rewardId', async (req: Request, res: Response) => {
  try {
    const { rewardId } = req.params;
    const reward = await RewardsService.getRewardById(rewardId);

    if (!reward) {
      return res.status(404).json(createErrorResponse('NOT_FOUND', 'Reward not found'));
    }

    res.json(createSuccessResponse({ reward }));
  } catch (error) {
    logger.error('Failed to get reward:', error);
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Failed to get reward'));
  }
});

export default router;
