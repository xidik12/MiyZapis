import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken } from '@/middleware/auth/jwt';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { ErrorCodes, formatValidationErrors } from '@/types';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { ReferralService, CreateReferralData, ProcessReferralData, REFERRAL_CONFIG } from '@/services/referral';
import { ReferralProcessingService } from '@/services/referral/processing.service';
import { prisma } from '@/config/database';

const router = Router();

// Validation schemas
const createReferralValidation = [
  body('referralType')
    .isIn(['CUSTOMER_TO_CUSTOMER', 'SPECIALIST_TO_CUSTOMER', 'CUSTOMER_TO_SPECIALIST'])
    .withMessage('Invalid referral type'),
  body('targetUserType')
    .isIn(['CUSTOMER', 'SPECIALIST'])
    .withMessage('Invalid target user type'),
  body('inviteChannel')
    .optional()
    .isIn(['EMAIL', 'SMS', 'SOCIAL', 'DIRECT', 'LINK'])
    .withMessage('Invalid invite channel'),
  body('customMessage')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Custom message too long'),
  body('specialistId')
    .optional()
    .isString()
    .withMessage('Invalid specialist ID'),
  body('expiresInDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiry days must be between 1 and 365'),
];

const processReferralValidation = [
  body('referralCode')
    .isLength({ min: 10, max: 20 })
    .withMessage('Invalid referral code format'),
  body('referredUserId')
    .isString()
    .withMessage('Referred user ID is required'),
  body('firstBookingId')
    .optional()
    .isString()
    .withMessage('Invalid booking ID'),
];

// Get referral configuration and stats
router.get('/config', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    // Get user info to determine available referral types
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { specialist: true }
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found', req.headers['x-request-id'] as string)
      );
    }

    const isSpecialist = !!user.specialist;

    // Calculate daily and pending limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [dailyCount, pendingCount] = await Promise.all([
      prisma.loyaltyReferral.count({
        where: {
          referrerId: userId,
          createdAt: { gte: today, lt: tomorrow }
        }
      }),
      prisma.loyaltyReferral.count({
        where: {
          referrerId: userId,
          status: 'PENDING'
        }
      })
    ]);

    res.json(createSuccessResponse({
      config: REFERRAL_CONFIG,
      userType: user.userType,
      isSpecialist,
      availableTypes: isSpecialist
        ? ['CUSTOMER_TO_CUSTOMER', 'SPECIALIST_TO_CUSTOMER', 'CUSTOMER_TO_SPECIALIST']
        : ['CUSTOMER_TO_CUSTOMER', 'CUSTOMER_TO_SPECIALIST'],
      limits: {
        dailyUsed: dailyCount,
        dailyLimit: REFERRAL_CONFIG.MAX_REFERRALS_PER_USER_PER_DAY,
        pendingUsed: pendingCount,
        pendingLimit: REFERRAL_CONFIG.MAX_PENDING_REFERRALS_PER_USER
      }
    }));

  } catch (error) {
    logger.error('Get referral config error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get referral configuration',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Create a new referral
router.post('/create', authenticateToken, createReferralValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_FAILED,
          'Validation failed',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    const createData: CreateReferralData = {
      referrerId: userId,
      ...req.body
    };

    const referral = await ReferralService.createReferral(createData);

    res.status(201).json(createSuccessResponse({
      referral: {
        id: referral.id,
        referralCode: referral.referralCode,
        referralType: referral.referralType,
        targetUserType: referral.targetUserType,
        status: referral.status,
        referrerRewardType: referral.referrerRewardType,
        referrerRewardValue: referral.referrerRewardValue,
        referredRewardType: referral.referredRewardType,
        referredRewardValue: referral.referredRewardValue,
        expiresAt: referral.expiresAt,
        createdAt: referral.createdAt,
        customMessage: referral.customMessage,
        inviteChannel: referral.inviteChannel,
        shareUrl: `${process.env.FRONTEND_URL}/register?ref=${referral.referralCode}`
      }
    }));

  } catch (error) {
    logger.error('Create referral error:', error);

    // Handle specific business logic errors
    if (error instanceof Error) {
      switch (error.message) {
        case 'REFERRER_NOT_FOUND_OR_INACTIVE':
          return res.status(404).json(
            createErrorResponse(ErrorCodes.NOT_FOUND, 'Referrer account not found or inactive', req.headers['x-request-id'] as string)
          );
        case 'INVALID_REFERRAL_TYPE_FOR_USER':
          return res.status(400).json(
            createErrorResponse(ErrorCodes.VALIDATION_FAILED, 'Invalid referral type for your account type', req.headers['x-request-id'] as string)
          );
        case 'DAILY_REFERRAL_LIMIT_EXCEEDED':
          return res.status(429).json(
            createErrorResponse(ErrorCodes.RATE_LIMIT_EXCEEDED, 'Daily referral limit exceeded', req.headers['x-request-id'] as string)
          );
        case 'PENDING_REFERRALS_LIMIT_EXCEEDED':
          return res.status(429).json(
            createErrorResponse(ErrorCodes.RATE_LIMIT_EXCEEDED, 'Too many pending referrals', req.headers['x-request-id'] as string)
          );
        case 'FAILED_TO_GENERATE_UNIQUE_CODE':
          return res.status(500).json(
            createErrorResponse(ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to generate unique referral code', req.headers['x-request-id'] as string)
          );
      }
    }

    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to create referral',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get my referrals (sent by user)
router.get('/my-referrals', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    // Check if user exists first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found', req.headers['x-request-id'] as string)
      );
    }

    const { status, type, limit = '10', offset = '0' } = req.query;

    const whereClause: any = { referrerId: userId };
    if (status) whereClause.status = status;
    if (type) whereClause.referralType = type;

    // Try to get referrals with graceful fallback
    let referrals: any[] = [];
    let total = 0;

    try {
      [referrals, total] = await Promise.all([
        prisma.loyaltyReferral.findMany({
          where: whereClause,
          include: {
            referred: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                userType: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit as string),
          skip: parseInt(offset as string)
        }),
        prisma.loyaltyReferral.count({ where: whereClause })
      ]);
    } catch (dbError) {
      logger.error('Database error fetching referrals:', dbError);
      // Return empty result set instead of 500 error
      referrals = [];
      total = 0;
    }

    const formattedReferrals = referrals.map(referral => ({
      id: referral.id,
      referralCode: referral.referralCode,
      referralType: referral.referralType,
      targetUserType: referral.targetUserType,
      status: referral.status,
      referrerRewardType: referral.referrerRewardType,
      referrerRewardValue: referral.referrerRewardValue,
      referredRewardType: referral.referredRewardType,
      referredRewardValue: referral.referredRewardValue,
      pointsAwarded: referral.pointsAwarded,
      inviteChannel: referral.inviteChannel,
      customMessage: referral.customMessage,
      clickCount: referral.clickCount,
      viewCount: referral.viewCount,
      createdAt: referral.createdAt,
      expiresAt: referral.expiresAt,
      completedAt: referral.completedAt,
      referred: referral.referred,
      shareUrl: `${process.env.FRONTEND_URL}/register?ref=${referral.referralCode}`,
      isExpired: referral.expiresAt < new Date()
    }));

    res.json(createSuccessResponse({
      referrals: formattedReferrals,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      }
    }));

  } catch (error) {
    logger.error('Get my referrals error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get referrals',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get referral by code (public endpoint for verification)
router.get('/code/:referralCode', async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.params;

    const referral = await ReferralService.getReferralByCode(referralCode);

    // Track view
    await ReferralService.trackReferralActivity(referralCode, 'VIEW');

    res.json(createSuccessResponse({
      referral: {
        id: referral.id,
        referralCode: referral.referralCode,
        referralType: referral.referralType,
        targetUserType: referral.targetUserType,
        status: referral.status,
        referredRewardType: referral.referredRewardType,
        referredRewardValue: referral.referredRewardValue,
        customMessage: referral.customMessage,
        expiresAt: referral.expiresAt,
        referrer: referral.referrer,
        isExpired: referral.expiresAt < new Date()
      }
    }));

  } catch (error) {
    logger.error('Get referral by code error:', error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'REFERRAL_NOT_FOUND':
          return res.status(404).json(
            createErrorResponse(ErrorCodes.NOT_FOUND, 'Referral code not found', req.headers['x-request-id'] as string)
          );
        case 'REFERRAL_EXPIRED':
          return res.status(410).json(
            createErrorResponse(ErrorCodes.EXPIRED, 'Referral code has expired', req.headers['x-request-id'] as string)
          );
      }
    }

    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get referral information',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Process referral completion (used during registration/first booking)
router.post('/process', authenticateToken, processReferralValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_FAILED,
          'Validation failed',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const processData: ProcessReferralData = req.body;

    const result = await ReferralService.processReferralCompletion(processData);

    res.json(createSuccessResponse({
      success: true,
      referral: result,
      message: 'Referral processed successfully'
    }));

  } catch (error) {
    logger.error('Process referral error:', error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'REFERRAL_NOT_FOUND':
          return res.status(404).json(
            createErrorResponse(ErrorCodes.NOT_FOUND, 'Referral code not found', req.headers['x-request-id'] as string)
          );
        case 'REFERRAL_ALREADY_PROCESSED':
          return res.status(409).json(
            createErrorResponse(ErrorCodes.CONFLICT, 'Referral already processed', req.headers['x-request-id'] as string)
          );
        case 'REFERRAL_EXPIRED':
          return res.status(410).json(
            createErrorResponse(ErrorCodes.EXPIRED, 'Referral code has expired', req.headers['x-request-id'] as string)
          );
        case 'REFERRED_USER_NOT_FOUND':
          return res.status(404).json(
            createErrorResponse(ErrorCodes.NOT_FOUND, 'Referred user not found', req.headers['x-request-id'] as string)
          );
        case 'REFERRED_USER_TYPE_MISMATCH':
          return res.status(400).json(
            createErrorResponse(ErrorCodes.VALIDATION_FAILED, 'User type does not match referral target', req.headers['x-request-id'] as string)
          );
      }
    }

    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to process referral',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get referral analytics
router.get('/analytics', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    const analytics = await ReferralService.getReferralAnalytics(userId);

    res.json(createSuccessResponse({ analytics }));

  } catch (error) {
    logger.error('Get referral analytics error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get referral analytics',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Track referral link click
router.post('/track/:referralCode/click', async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.params;

    await ReferralService.trackReferralActivity(referralCode, 'CLICK');

    res.json(createSuccessResponse({
      success: true,
      message: 'Click tracked successfully'
    }));

  } catch (error) {
    logger.error('Track referral click error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to track referral click',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Validate referral link (public endpoint for registration page)
router.get('/validate/:referralCode', async (req: Request, res: Response) => {
  try {
    const { referralCode } = req.params;

    const result = await ReferralProcessingService.validateAndTrackReferralLink(referralCode);

    if (result.isValid) {
      res.json(createSuccessResponse({
        valid: true,
        referral: result.referral
      }));
    } else {
      res.status(400).json(createErrorResponse(
        ErrorCodes.VALIDATION_FAILED,
        result.error || 'Invalid referral code',
        req.headers['x-request-id'] as string
      ));
    }

  } catch (error) {
    logger.error('Validate referral error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to validate referral',
        req.headers['x-request-id'] as string
      )
    );
  }
});

export default router;