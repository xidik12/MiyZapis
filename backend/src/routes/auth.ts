import { Router } from 'express';
import { AuthController } from '@/controllers/auth';
import { authenticateToken } from '@/middleware/auth/jwt';
import { authRateLimit } from '@/middleware/security';
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

// Apply auth rate limiting to all auth routes - use simpler rate limiter for development
if (process.env.NODE_ENV === 'production') {
  router.use(authRateLimit);
}

// Public routes
router.post('/register', validateRegister, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
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