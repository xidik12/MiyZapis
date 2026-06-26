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
router.post('/register', authRateLimit, async (req, res) => {
  try {
    // Import enhanced auth service to handle registration
    const { AuthService } = await import('@/services/auth');
    
    // Simple validation for the proxy
    if (!req.body.email || !req.body.password || !req.body.firstName || !req.body.lastName || !req.body.userType) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Missing required fields', req.id));
    }

    // Sanitize names: strip HTML tags, collapse whitespace, then accept any
    // Unicode letter, hyphen, apostrophe, or space. The previous regex was
    // Cyrillic + Latin Extended-A only, which rejected Vietnamese, Khmer,
    // Chinese, Arabic, and a long tail of other scripts our users actually use.
    req.body.firstName = req.body.firstName.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    req.body.lastName = req.body.lastName.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const nameRegex = /^[\p{L}\p{M}\s\-'\u2019.]+$/u;
    if (
      req.body.firstName.length < 1 || req.body.firstName.length > 80 ||
      req.body.lastName.length < 1 || req.body.lastName.length > 80 ||
      !nameRegex.test(req.body.firstName) || !nameRegex.test(req.body.lastName)
    ) {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Names must be 1-80 characters of letters, spaces, hyphens, or apostrophes', req.id));
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
router.post('/login', authRateLimit, validateLogin, AuthController.login);
router.post('/google', authRateLimit, AuthController.googleAuth);
router.post('/telegram', authRateLimit, validateTelegramAuth, AuthController.telegramAuth);
router.post('/refresh', validateRefreshToken, AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Email verification
router.post('/verify-email', validateEmailVerification, AuthController.verifyEmail);

// Resend verification email (rate-limited to prevent abuse)
router.post('/resend-verification', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Email is required', req.id));
    }
    const { AuthService } = await import('@/services/auth');
    const result = await AuthService.resendVerificationEmail(email);
    if (!result.success) {
      return res.status(400).json(createErrorResponse('RESEND_FAILED', result.message, req.id));
    }
    return res.json(createSuccessResponse({ message: result.message }));
  } catch (error: unknown) {
    logger.error('Resend verification error:', error);
    return res.status(500).json(createErrorResponse('RESEND_FAILED', 'Failed to resend verification email', req.id));
  }
});

// Password reset (rate limited)
router.post('/request-password-reset', authRateLimit, validatePasswordResetRequest, AuthController.requestPasswordReset);
router.post('/reset-password', authRateLimit, validatePasswordReset, AuthController.resetPassword);

// Password management (authenticated routes)
router.post('/request-password-change-otp', authenticateToken, authRateLimit, AuthController.requestPasswordChangeOtp);
router.post('/change-password', authenticateToken, validateChangePassword, AuthController.changePassword);
router.post('/set-initial-password', authenticateToken, validateSetInitialPassword, AuthController.setInitialPassword);

// Protected routes
router.get('/me', authenticateToken, AuthController.me);

export default router;