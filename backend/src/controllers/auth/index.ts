import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { EnhancedAuthService as AuthService } from '@/services/auth/enhanced';
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
              field: (error as any).param || (error as any).path || 'unknown',
              message: (error as any).msg || error.toString(),
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      const data: RegisterRequest = req.body;
      const result = await AuthService.register(data);

      // Enhanced service returns verification requirement
      res.status(201).json(
        createSuccessResponse({
          message: result.message,
          requiresVerification: result.requiresVerification,
          user: result.user,
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

  // Login user with multi-role support
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
              field: (error as any).param || (error as any).path || 'unknown',
              message: (error as any).msg || error.toString(),
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      const data: LoginRequest = req.body;
      const { userType } = req.body; // Extract userType from request body
      const result = await AuthService.login(data, userType);

      // Check if user type selection is required
      if ('requiresUserTypeSelection' in result) {
        res.status(200).json(
          createSuccessResponse({
            requiresUserTypeSelection: true,
            loginData: result.loginData,
            message: 'Please select your role to continue',
          })
        );
        return;
      }

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

      if (error.message === 'EMAIL_NOT_VERIFIED') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Please verify your email address before logging in',
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
              field: (error as any).param || (error as any).path || 'unknown',
              message: (error as any).msg || error.toString(),
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      const data: TelegramAuthRequest = req.body;
      const result = await AuthService.authenticateWithTelegram(data);

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

  // Google OAuth authentication with multi-role support
  static async googleAuth(req: Request, res: Response): Promise<void> {
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
              field: (error as any).param || (error as any).path || 'unknown',
              message: (error as any).msg || error.toString(),
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      const { googleData, userType } = req.body;
      const result = await AuthService.authenticateWithGoogle(googleData, userType);

      // Check if user type selection is required
      if ('requiresUserTypeSelection' in result) {
        res.status(200).json(
          createSuccessResponse({
            requiresUserTypeSelection: true,
            googleData: result.googleData,
            message: 'Please select your role to continue',
          })
        );
        return;
      }

      res.json(
        createSuccessResponse({
          user: result.user,
          tokens: result.tokens,
          isNewUser: result.isNewUser,
        })
      );
    } catch (error: any) {
      logger.error('Google auth controller error:', error);

      if (error.message === 'INVALID_GOOGLE_TOKEN') {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.INVALID_CREDENTIALS,
            'Invalid Google authentication token',
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
          'Google authentication failed',
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

      const result = await AuthService.refreshAuthToken(refreshToken);

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
    // Immediately return success to client - don't wait for cleanup operations
    res.status(200).json(
      createSuccessResponse({
        message: 'Logged out successfully',
      })
    );

    // Perform cleanup operations asynchronously in the background
    // This ensures the client gets an immediate response
    setImmediate(async () => {
      try {
        const { refreshToken } = req.body;
        const authHeader = req.headers.authorization;
        
        logger.debug('Logout cleanup started', { 
          hasRefreshToken: !!refreshToken,
          hasAuthHeader: !!authHeader,
          refreshTokenLength: refreshToken?.length || 0
        });
        
        // Extract user ID from JWT token if available
        let userId: string | null = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
            userId = decoded.userId;
            logger.debug('User ID extracted from token', { userId });
          } catch (tokenError) {
            // Token might be expired or invalid, that's OK for logout
            logger.debug('Token verification failed during logout (expected):', tokenError);
          }
        }

        // Cleanup operations in background - don't block the response
        const cleanupPromises = [];

        // Revoke refresh token
        if (refreshToken && typeof refreshToken === 'string' && refreshToken.trim()) {
          cleanupPromises.push(
            AuthService.revokeRefreshToken(refreshToken.trim())
              .then(() => logger.debug('Refresh token revoked successfully'))
              .catch((error) => logger.debug('Refresh token revocation failed (non-critical):', error))
          );
        }

        // Clear user cache
        if (userId && redis) {
          cleanupPromises.push(
            redis.del(`user:${userId}`)
              .then(() => logger.debug('User cache cleared', { userId }))
              .catch((error) => logger.debug('User cache clearing failed (non-critical):', error))
          );

          // Clear session cache (simplified - just delete the most likely keys)
          cleanupPromises.push(
            redis.keys(`session:*`)
              .then(async (keys) => {
                const keysToDelete = [];
                // Limit to first 10 keys to avoid performance issues
                for (const key of keys.slice(0, 10)) {
                  try {
                    const sessionData = await redis.get(key);
                    if (sessionData && sessionData.includes(userId)) {
                      keysToDelete.push(key);
                    }
                  } catch (error) {
                    // Skip this key
                    continue;
                  }
                }
                if (keysToDelete.length > 0) {
                  await redis.del(...keysToDelete);
                  logger.debug('Session cache cleared', { userId, keys: keysToDelete.length });
                }
              })
              .catch((error) => logger.debug('Session cache clearing failed (non-critical):', error))
          );
        }

        // Wait for all cleanup operations to complete (or timeout after 5 seconds)
        await Promise.race([
          Promise.allSettled(cleanupPromises),
          new Promise(resolve => setTimeout(resolve, 5000))
        ]);

        logger.debug('Logout cleanup completed');
      } catch (error: any) {
        logger.debug('Logout cleanup error (non-critical):', error);
      }
    });
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
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: (error as any).param || (error as any).path || 'unknown',
              message: (error as any).msg || error.toString(),
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      const { token } = req.body;
      const result = await AuthService.verifyEmail(token);

      if (!result.success) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            result.message,
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          message: result.message,
          user: result.user,
          tokens: result.tokens,
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