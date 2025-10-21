import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { EnhancedAuthService as AuthService } from '@/services/auth/enhanced';
import { emailService as templatedEmailService } from '@/services/email/enhanced-email';
import { resolveLanguage } from '@/utils/language';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, LoginRequest, RegisterRequest, TelegramAuthRequest, JwtPayload } from '@/types';
import { validationResult } from 'express-validator';
import { config } from '@/config';
import { redis } from '@/config/redis';
import { prisma } from '@/config/database';

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
      // Fallback language resolution from Accept-Language if not supplied
      if (!data.language) {
        data.language = resolveLanguage(undefined, req.headers['accept-language']);
      }
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

      const { email } = req.body;

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal whether the email exists for security
        res.json(
          createSuccessResponse({
            message: 'If your email is registered, you will receive a password reset link shortly.',
          })
        );
        return;
      }

      // Check if user has a password (Google/Telegram users might not have passwords)
      if (!user.password) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.INVALID_OPERATION,
            'This account was created with Google/Telegram. Please use the same method to sign in.',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Remove existing password reset tokens for this user
      await prisma.emailVerificationToken.deleteMany({
        where: {
          userId: user.id,
          type: 'PASSWORD_RESET'
        }
      });

      // Create new reset token
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token,
          type: 'PASSWORD_RESET',
          expiresAt
        }
      });

      // Send localized password reset email
      try {
        const lang = resolveLanguage(user.language, req.headers['accept-language']);
        const resetUrl = `${config.frontend.url}/auth/reset-password?token=${token}`;

        logger.info('Sending password reset email', {
          userId: user.id,
          email: user.email,
          language: lang,
          resetUrl: resetUrl.replace(token, '[TOKEN]'),
          expiresAt
        });

        const emailSent = await templatedEmailService.sendPasswordReset(user.id, token, lang);

        if (emailSent) {
          logger.info('Password reset email sent successfully', {
            userId: user.id,
            email: user.email
          });
        } else {
          logger.error('Password reset email failed to send', {
            userId: user.id,
            email: user.email,
            reason: 'Email service returned false'
          });
        }
      } catch (emailError) {
        logger.error('Failed to send password reset email - exception:', {
          userId: user.id,
          email: user.email,
          error: emailError instanceof Error ? emailError.message : emailError,
          stack: emailError instanceof Error ? emailError.stack : undefined
        });
        // Don't fail the request if email sending fails
      }

      logger.info('Password reset requested', { userId: user.id, email: user.email });

      res.json(
        createSuccessResponse({
          message: 'If your email is registered, you will receive a password reset link shortly.',
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

      const { token, password } = req.body;

      // Find the reset token
      const resetToken = await prisma.emailVerificationToken.findFirst({
        where: {
          token,
          type: 'PASSWORD_RESET',
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!resetToken) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.INVALID_CREDENTIALS,
            'Invalid or expired reset token',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update user password and mark token as used
      await prisma.$transaction([
        prisma.user.update({
          where: { id: resetToken.userId },
          data: { password: hashedPassword }
        }),
        prisma.emailVerificationToken.update({
          where: { id: resetToken.id },
          data: {
            isUsed: true,
            usedAt: new Date()
          }
        })
      ]);

      // Invalidate all existing refresh tokens for this user (force re-login)
      await prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { 
          isRevoked: true,
          revokedAt: new Date()
        }
      });

      logger.info('Password reset completed', { 
        userId: resetToken.userId, 
        email: resetToken.user.email 
      });

      res.json(
        createSuccessResponse({
          message: 'Password has been reset successfully. Please sign in with your new password.',
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

  // Change password (for users with existing passwords)
  static async changePassword(req: Request, res: Response): Promise<void> {
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

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.UNAUTHORIZED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { currentPassword, newPassword } = req.body;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, password: true, authProvider: true }
      });

      if (!user) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // For Google OAuth users who don't have a password set, currentPassword is not required
      if (user.password && currentPassword) {
        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
          res.status(400).json(
            createErrorResponse(
              ErrorCodes.INVALID_CREDENTIALS,
              'Current password is incorrect',
              req.headers['x-request-id'] as string
            )
          );
          return;
        }
      } else if (user.password && !currentPassword) {
        // User has existing password but didn't provide current password
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Current password is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update user password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordLastChanged: new Date()
        }
      });

      logger.info('Password changed successfully', { userId, email: user.email });

      res.status(200).json(
        createSuccessResponse({
          message: 'Password changed successfully',
        })
      );
    } catch (error: any) {
      logger.error('Change password controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Password change failed',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Set initial password (for Google OAuth users)
  static async setInitialPassword(req: Request, res: Response): Promise<void> {
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

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.UNAUTHORIZED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { password } = req.body;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, password: true, authProvider: true }
      });

      if (!user) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user already has a password
      if (user.password) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.INVALID_OPERATION,
            'User already has a password set. Use change password instead.',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Hash the new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Update user with initial password
      await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          passwordLastChanged: new Date()
        }
      });

      logger.info('Initial password set successfully', { userId, email: user.email });

      res.status(200).json(
        createSuccessResponse({
          message: 'Password set successfully',
        })
      );
    } catch (error: any) {
      logger.error('Set initial password controller error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to set initial password',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
