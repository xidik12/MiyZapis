import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '@/services/auth';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, LoginRequest, RegisterRequest, TelegramAuthRequest, JwtPayload } from '@/types';
import { validationResult } from 'express-validator';
import { config } from '@/config';
import { redis } from '@/config/redis';

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
      const authHeader = req.headers.authorization;
      
      // Extract user ID from JWT token if available
      let userId: string | null = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
          userId = decoded.userId;
        } catch (tokenError) {
          // Token might be expired or invalid, that's OK for logout
          logger.debug('Token verification failed during logout (expected):', tokenError);
        }
      }

      // Always attempt to logout from refresh token service
      if (refreshToken) {
        try {
          await AuthService.logout(refreshToken);
          logger.debug('Refresh token revoked successfully');
        } catch (refreshError) {
          logger.debug('Refresh token revocation failed (token may not exist):', refreshError);
        }
      }

      // Clear user cache if userId is available and Redis is connected
      if (userId && redis) {
        try {
          // Clear specific user cache keys
          const userCacheKey = `user:${userId}`;
          const sessionCacheKey = `session:*`;
          
          await redis.del(userCacheKey);
          logger.debug('User cache cleared for logout', { userId });
          
          // Clear session cache keys that may contain the user ID
          // Note: Redis del with wildcards requires a different approach
          try {
            const keys = await redis.keys(`session:*`);
            const userSessionKeys = [];
            for (const key of keys) {
              const sessionData = await redis.get(key);
              if (sessionData && sessionData.includes(userId)) {
                userSessionKeys.push(key);
              }
            }
            if (userSessionKeys.length > 0) {
              await redis.del(...userSessionKeys);
              logger.debug('Session cache cleared for logout', { userId, keys: userSessionKeys.length });
            }
          } catch (sessionError) {
            logger.debug('Session cache clearing failed (non-critical):', sessionError);
          }
        } catch (cacheError) {
          logger.debug('Cache clearing failed during logout (non-critical):', cacheError);
        }
      }

      // Always return success for logout
      res.status(200).json(
        createSuccessResponse({
          message: 'Logged out successfully',
        })
      );
    } catch (error: any) {
      logger.debug('Logout controller error (returning success anyway):', error);

      // Always return success to client - logout should never fail from user perspective
      res.status(200).json(
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