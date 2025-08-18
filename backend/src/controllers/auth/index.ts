import { Request, Response } from 'express';
import { AuthService } from '@/services/auth';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, LoginRequest, RegisterRequest, TelegramAuthRequest } from '@/types';
import { validationResult } from 'express-validator';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
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

      const data: RegisterRequest = req.body;
      const result = await AuthService.register(data);

      res.status(201).json(
        createSuccessResponse({
          user: result.user,
          tokens: result.tokens,
        })
      );
    } catch (error: any) {
      logger.error('Registration controller error:', error);

      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Email address is already registered',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'TELEGRAM_ID_ALREADY_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Telegram account is already linked to another user',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Registration failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
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

      const data: LoginRequest = req.body;
      const result = await AuthService.login(data);

      res.json(
        createSuccessResponse({
          user: result.user,
          tokens: result.tokens,
        })
      );
    } catch (error: any) {
      logger.error('Login controller error:', error);

      if (error.message === 'INVALID_CREDENTIALS') {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.INVALID_CREDENTIALS,
            'Invalid email or password',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'ACCOUNT_DEACTIVATED') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Account is deactivated',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Login failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Telegram authentication
  static async telegramAuth(req: Request, res: Response): Promise<void> {
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

      const data: TelegramAuthRequest = req.body;
      const result = await AuthService.authenticateTelegram(data);

      res.json(
        createSuccessResponse({
          user: result.user,
          tokens: result.tokens,
          isNewUser: result.isNewUser,
        })
      );
    } catch (error: any) {
      logger.error('Telegram auth controller error:', error);

      if (error.message === 'INVALID_TELEGRAM_AUTH') {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.INVALID_CREDENTIALS,
            'Invalid Telegram authentication data',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'ACCOUNT_DEACTIVATED') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Account is deactivated',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Telegram authentication failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Refresh access token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Refresh token is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.json(
        createSuccessResponse({
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        })
      );
    } catch (error: any) {
      logger.error('Token refresh controller error:', error);

      if (error.message === 'INVALID_REFRESH_TOKEN' || error.name === 'JsonWebTokenError') {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.REFRESH_TOKEN_INVALID,
            'Invalid or expired refresh token',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'ACCOUNT_DEACTIVATED') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Account is deactivated',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Token refresh failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Logout user
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      res.json(
        createSuccessResponse({
          message: 'Logged out successfully',
        })
      );
    } catch (error: any) {
      logger.error('Logout controller error:', error);

      // Even if logout fails, return success to client
      res.json(
        createSuccessResponse({
          message: 'Logged out successfully',
        })
      );
    }
  }

  // Get current user (from token)
  static async me(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          user,
        })
      );
    } catch (error: any) {
      logger.error('Me controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get user information',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement email verification logic
      res.json(
        createSuccessResponse({
          message: 'Email verification not yet implemented',
        })
      );
    } catch (error: any) {
      logger.error('Email verification controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Email verification failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Request password reset
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement password reset logic
      res.json(
        createSuccessResponse({
          message: 'Password reset not yet implemented',
        })
      );
    } catch (error: any) {
      logger.error('Password reset controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Password reset failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Implement password reset logic
      res.json(
        createSuccessResponse({
          message: 'Password reset not yet implemented',
        })
      );
    } catch (error: any) {
      logger.error('Password reset controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Password reset failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}