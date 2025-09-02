import { Response } from 'express';
import { UserService } from '@/services/user';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class UserController {
  // Update user profile
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

      const updateData = req.body;
      const updatedUser = await UserService.updateProfile(req.user.id, updateData);

      res.json(
        createSuccessResponse({
          user: updatedUser,
        })
      );
    } catch (error: any) {
      logger.error('Update profile controller error:', error);

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

      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Email address is already in use',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get user profile by ID
  static async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Users can only view their own profile unless they're admin
      if (req.user?.userType !== 'ADMIN' && req.user?.id !== id) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You can only view your own profile',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const user = await UserService.getProfile(id);

      res.json(
        createSuccessResponse({
          user,
        })
      );
    } catch (error: any) {
      logger.error('Get profile controller error:', error);

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
          'Failed to get profile',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Upload avatar
  static async uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (!req.file) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Avatar file is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // This endpoint should not be used - avatar uploads should go through /files/upload
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Please use /files/upload?purpose=avatar endpoint for avatar uploads',
          req.headers['x-request-id'] as string
        )
      );
    } catch (error: any) {
      logger.error('Upload avatar controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to upload avatar',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Delete user account
  static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      await UserService.deleteAccount(req.user.id);

      res.json(
        createSuccessResponse({
          message: 'Account deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete account controller error:', error);

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

      if (error.message === 'ACTIVE_BOOKINGS_EXIST') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Cannot delete account with active bookings',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete account',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get user notifications preferences
  static async getNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const preferences = await UserService.getNotificationPreferences(req.user.id);

      res.json(
        createSuccessResponse({
          preferences,
        })
      );
    } catch (error: any) {
      logger.error('Get notification preferences controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get notification preferences',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update user notifications preferences
  static async updateNotificationPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const preferences = await UserService.updateNotificationPreferences(req.user.id, req.body);

      res.json(
        createSuccessResponse({
          preferences,
        })
      );
    } catch (error: any) {
      logger.error('Update notification preferences controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update notification preferences',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get user loyalty points
  static async getLoyaltyPoints(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const loyaltyData = await UserService.getLoyaltyPoints(req.user.id);

      res.json(
        createSuccessResponse(loyaltyData)
      );
    } catch (error: any) {
      logger.error('Get loyalty points controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get loyalty points',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}