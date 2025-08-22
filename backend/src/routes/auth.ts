import { Router } from 'express';
import { AuthController } from '@/controllers/auth';
import { authenticateToken } from '@/middleware/auth/jwt';
import { authRateLimit } from '@/middleware/security';
import { logger } from '@/utils/logger';
import {
  validateRegister,
  validateLogin,
  validateTelegramAuth,
  validateRefreshToken,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
} from '@/middleware/validation/auth';

const router = Router();

// Temporarily disable auth rate limiting due to Redis hanging issue
// TODO: Re-enable after investigating Redis connectivity in rate limiter
// if (process.env.NODE_ENV === 'production') {
//   router.use(authRateLimit);
// }

// Proxy old registration to enhanced route to avoid hanging middleware
router.post('/register', async (req, res) => {
  try {
    // Import enhanced auth service to handle registration
    const { EnhancedAuthService } = await import('@/services/auth/enhanced');
    const { createSuccessResponse, createErrorResponse } = await import('@/utils/response');
    const { body, validationResult } = await import('express-validator');
    
    // Simple validation for the proxy
    if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName || !req.body.userType) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Missing required fields', req.id));
    }

    const result = await EnhancedAuthService.register(req.body);
    res.status(201).json(createSuccessResponse(result));
  } catch (error: any) {
    logger.error('Registration proxy error:', error);
    
    let errorCode = 'REGISTRATION_FAILED';
    let errorMessage = 'Registration failed';

    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      errorCode = 'EMAIL_ALREADY_EXISTS';
      errorMessage = 'Email address is already registered';
    }

    res.status(400).json(createErrorResponse(errorCode, errorMessage, req.id));
  }
});
router.post('/login', validateLogin, AuthController.login);
router.post('/google', AuthController.googleAuth);
router.post('/telegram', validateTelegramAuth, AuthController.telegramAuth);
router.post('/refresh', validateRefreshToken, AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Email verification
router.post('/verify-email', validateEmailVerification, AuthController.verifyEmail);

// Password reset
router.post('/request-password-reset', validatePasswordResetRequest, AuthController.requestPasswordReset);
router.post('/reset-password', validatePasswordReset, AuthController.resetPassword);

// Protected routes
router.get('/me', authenticateToken, AuthController.me);

export default router;