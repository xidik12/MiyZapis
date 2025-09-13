import { Request, Response } from 'express';
import { 
  LoyaltyService, 
  CreateLoyaltyTransactionData, 
  LoyaltyFilters, 
  RedeemPointsData 
} from '@/services/loyalty';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class LoyaltyController {
  /**
   * Get user's loyalty balance
   * GET /loyalty/balance
   */
  static async getLoyaltyBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const balance = await LoyaltyService.getLoyaltyBalance(req.user.id);

      res.json(
        createSuccessResponse({
          balance,
        })
      );
    } catch (error: any) {
      logger.error('Get loyalty balance error:', error);

      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get loyalty balance',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get loyalty transaction history
   * GET /loyalty/transactions
   */
  static async getLoyaltyTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        type,
        startDate,
        endDate,
        minPoints,
        maxPoints,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: LoyaltyFilters = {
        userId: req.user.id, // Always filter by current user
      };

      if (type) filters.type = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (minPoints) filters.minPoints = parseInt(minPoints as string, 10);
      if (maxPoints) filters.maxPoints = parseInt(maxPoints as string, 10);

      const result = await LoyaltyService.getLoyaltyTransactions(
        filters,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: parseInt(limit as string, 10),
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get loyalty transactions error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get loyalty transactions',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Award loyalty points (Admin only)
   * POST /loyalty/award
   */
  static async awardPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
              message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check admin permissions
      if (req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only administrators can award loyalty points',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { userId, points, reason, description, type = 'BONUS', expiresAt } = req.body;

      const data: CreateLoyaltyTransactionData = {
        userId,
        type,
        points,
        reason,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      };

      const transaction = await LoyaltyService.awardPoints(data);

      res.status(201).json(
        createSuccessResponse({
          transaction,
          message: `Successfully awarded ${points} points`,
        })
      );
    } catch (error: any) {
      logger.error('Award loyalty points error:', error);

      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'POINTS_MUST_BE_POSITIVE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Points must be a positive number',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to award loyalty points',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Redeem loyalty points
   * POST /loyalty/redeem
   */
  static async redeemPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
              message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { points, reason, description, referenceId } = req.body;

      const data: RedeemPointsData = {
        userId: req.user.id,
        points,
        reason,
        description,
        referenceId,
      };

      const transaction = await LoyaltyService.redeemPoints(data);

      res.json(
        createSuccessResponse({
          transaction,
          message: `Successfully redeemed ${points} points`,
        })
      );
    } catch (error: any) {
      logger.error('Redeem loyalty points error:', error);

      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'POINTS_MUST_BE_POSITIVE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Points must be a positive number',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INSUFFICIENT_POINTS') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.INSUFFICIENT_BALANCE,
            'Insufficient loyalty points',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to redeem loyalty points',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get loyalty program statistics
   * GET /loyalty/stats
   */
  static async getLoyaltyStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // For non-admin users, only show their own stats
      const stats = await LoyaltyService.getLoyaltyStats(req.user.id);

      res.json(
        createSuccessResponse({
          stats,
        })
      );
    } catch (error: any) {
      logger.error('Get loyalty stats error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get loyalty statistics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get loyalty tiers and benefits
   * GET /loyalty/tiers
   */
  static async getLoyaltyTiers(req: Request, res: Response): Promise<void> {
    try {
      const tiers = LoyaltyService.getLoyaltyTiers();

      res.json(
        createSuccessResponse({
          tiers,
        })
      );
    } catch (error: any) {
      logger.error('Get loyalty tiers error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get loyalty tiers',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get user's loyalty tier
   * GET /loyalty/tier
   */
  static async getUserTier(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const tierInfo = await LoyaltyService.getUserTier(req.user.id);

      res.json(
        createSuccessResponse({
          tier: tierInfo,
        })
      );
    } catch (error: any) {
      logger.error('Get user tier error:', error);

      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get user tier',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get all loyalty transactions (Admin only)
   * GET /loyalty/transactions/all
   */
  static async getAllLoyaltyTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check admin permissions
      if (req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only administrators can view all loyalty transactions',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        userId,
        type,
        startDate,
        endDate,
        minPoints,
        maxPoints,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: LoyaltyFilters = {};

      if (userId) filters.userId = userId as string;
      if (type) filters.type = type as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (minPoints) filters.minPoints = parseInt(minPoints as string, 10);
      if (maxPoints) filters.maxPoints = parseInt(maxPoints as string, 10);

      const result = await LoyaltyService.getLoyaltyTransactions(
        filters,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: parseInt(limit as string, 10),
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get all loyalty transactions error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get loyalty transactions',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}