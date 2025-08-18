import { Request, Response } from 'express';
import { SpecialistService } from '@/services/specialist';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class SpecialistController {
  // Create specialist profile
  static async createProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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
              field: error.param,
              message: error.msg,
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

      const specialist = await SpecialistService.createProfile(req.user.id, req.body);

      res.status(201).json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Create specialist profile error:', error);

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

      if (error.message === 'USER_NOT_SPECIALIST') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'User must be a specialist to create a specialist profile',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_PROFILE_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Specialist profile already exists',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update specialist profile
  static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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
              field: error.param,
              message: error.msg,
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

      const specialist = await SpecialistService.updateProfile(req.user.id, req.body);

      res.json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Update specialist profile error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get own specialist profile
  static async getMyProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const specialist = await SpecialistService.getProfileByUserId(req.user.id);

      res.json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Get my specialist profile error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get specialist profile by ID
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { specialistId } = req.params;

      if (!specialistId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const specialist = await SpecialistService.getProfile(specialistId);

      res.json(
        createSuccessResponse({
          specialist,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist profile error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Search specialists
  static async searchSpecialists(req: Request, res: Response): Promise<void> {
    try {
      const {
        query,
        specialties,
        city,
        minRating,
        sortBy = 'rating',
        page = 1,
        limit = 20,
      } = req.query;

      const parsedSpecialties = specialties 
        ? (typeof specialties === 'string' ? [specialties] : specialties as string[])
        : undefined;

      const result = await SpecialistService.searchSpecialists(
        query as string,
        parsedSpecialties,
        city as string,
        minRating ? parseFloat(minRating as string) : undefined,
        sortBy as 'rating' | 'reviews' | 'newest',
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
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        })
      );
    } catch (error: any) {
      logger.error('Search specialists error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to search specialists',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get specialist analytics
  static async getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { startDate, endDate } = req.query;

      // Get specialist ID from user
      const specialist = await SpecialistService.getProfileByUserId(req.user.id);

      const analytics = await SpecialistService.getAnalytics(
        specialist.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(
        createSuccessResponse({
          analytics,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist analytics error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Toggle verification (admin only)
  static async toggleVerification(req: Request, res: Response): Promise<void> {
    try {
      const { specialistId } = req.params;

      if (!specialistId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const specialist = await SpecialistService.toggleVerification(specialistId);

      res.json(
        createSuccessResponse({
          specialist,
          message: `Specialist ${specialist.isVerified ? 'verified' : 'unverified'} successfully`,
        })
      );
    } catch (error: any) {
      logger.error('Toggle specialist verification error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to toggle specialist verification',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}