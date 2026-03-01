import { Router } from 'express';
import { AuthController } from '@/controllers/auth';
import { authenticateToken } from '@/middleware/auth/jwt';
import { authRateLimit } from '@/middleware/security';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import {
  validateRegister,
  validateLogin,
  validateTelegramAuth,
  validateRefreshToken,
  validateEmailVerification,
  validatePasswordResetRequest,
  validatePasswordReset,
  validateChangePassword,
  validateSetInitialPassword,
} from '@/middleware/validation/auth';

const router = Router();


// Proxy old registration to enhanced route to avoid hanging middleware
router.post('/register', async (req, res) => {
  try {
    // Import enhanced auth service to handle registration
    const { AuthService } = await import('@/services/auth');
    
    // Simple validation for the proxy
    if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName || !req.body.userType) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Missing required fields', req.id));
    }

    // Sanitize names - strip HTML tags and validate
    const nameRegex = /^[a-zA-Z\u0400-\u04FF\u0100-\u017F\s\-']+$/;
    req.body.firstName = req.body.firstName.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    req.body.lastName = req.body.lastName.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    if (!nameRegex.test(req.body.firstName) || !nameRegex.test(req.body.lastName)) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Names can only contain letters, spaces, hyphens, and apostrophes', req.id));
    }

    const result = await AuthService.register(req.body);
    return res.status(201).json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Registration proxy error:', error);

    let errorCode = 'REGISTRATION_FAILED';
    let errorMessage = 'Registration failed';

    if (err.message === 'EMAIL_ALREADY_EXISTS') {
      errorCode = 'EMAIL_ALREADY_EXISTS';
      errorMessage = 'Email address is already registered';
    }

    return res.status(400).json(createErrorResponse(errorCode, errorMessage, req.id));
  }
});
router.post('/login', validateLogin, AuthController.login);
router.post('/google', AuthController.googleAuth);
router.post('/telegram', validateTelegramAuth, AuthController.telegramAuth);
router.post('/refresh', validateRefreshToken, AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Email verification
router.post('/verify-email', validateEmailVerification, AuthController.verifyEmail);

// Password reset (rate limited)
router.post('/request-password-reset', authRateLimit, validatePasswordResetRequest, AuthController.requestPasswordReset);
router.post('/reset-password', authRateLimit, validatePasswordReset, AuthController.resetPassword);

// Password management (authenticated routes)
router.post('/change-password', authenticateToken, validateChangePassword, AuthController.changePassword);
router.post('/set-initial-password', authenticateToken, validateSetInitialPassword, AuthController.setInitialPassword);

// Protected routes
router.get('/me', authenticateToken, AuthController.me);

export default router;