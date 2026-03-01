import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { body, validationResult } from 'express-validator';
import { AuthService } from '@/services/auth';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { ValidatorError } from '@/types';

const router = express.Router();

// Enhanced CORS options for OAuth routes
const oauthCorsOptions = {
  origin: [
    ...config.security.corsOrigin,
    'https://miyzapis.com',
    'https://www.miyzapis.com',
    'https://miyzapis-frontend-production.up.railway.app',
    'https://accounts.google.com',
    'https://oauth2.googleapis.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-Correlation-ID',
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply enhanced CORS to all auth-enhanced routes
router.use(cors(oauthCorsOptions));

// Initialize Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Validation middleware
const validateRegistration = [
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('First name is required (max 50 characters)')
    .matches(/^[a-zA-Z\u0400-\u04FF\u0100-\u017F\s\-']+$/).withMessage('First name can only contain letters, spaces, hyphens, and apostrophes')
    .customSanitizer((value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Last name is required (max 50 characters)')
    .matches(/^[a-zA-Z\u0400-\u04FF\u0100-\u017F\s\-']+$/).withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes')
    .customSanitizer((value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['CUSTOMER', 'SPECIALIST']).withMessage('Valid user type is required'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number required'),
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

const validateEmailVerification = [
  body('token').isLength({ min: 1 }).withMessage('Verification token is required'),
];

const validateGoogleAuth = [
  body('credential').isLength({ min: 1 }).withMessage('Google credential is required'),
];

const validateTelegramAuth = [
  body('telegramId').isLength({ min: 1 }).withMessage('Telegram ID is required'),
  body('firstName')
    .isLength({ min: 1, max: 50 }).withMessage('First name is required')
    .customSanitizer((value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()),
  body('authDate').isNumeric().withMessage('Auth date is required'),
  body('hash').isLength({ min: 1 }).withMessage('Hash is required'),
];

// Register with email verification
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          req.id,
          errors.array().map(error => ({
            field: 'location' in error ? error.location : 'param' in error ? (error as ValidatorError).param : undefined,
            message: 'msg' in error ? error.msg : (error as ValidatorError).message || 'Validation error',
          }))
        )
      );
    }

    const result = await AuthService.register(req.body);

    res.status(201).json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Registration error:', error);

    let errorCode = 'REGISTRATION_FAILED';
    let errorMessage = 'Registration failed';

    if (err.message === 'EMAIL_ALREADY_EXISTS') {
      errorCode = 'EMAIL_ALREADY_EXISTS';
      errorMessage = 'Email address is already registered';
    } else if (err.message === 'TELEGRAM_ID_ALREADY_EXISTS') {
      errorCode = 'TELEGRAM_ID_ALREADY_EXISTS';
      errorMessage = 'Telegram account is already linked to another user';
    }

    res.status(400).json(createErrorResponse(errorCode, errorMessage, req.id));
  }
});

// Login with email verification check
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          req.id,
          errors.array().map(error => ({
            field: 'location' in error ? error.location : 'param' in error ? (error as ValidatorError).param : undefined,
            message: 'msg' in error ? error.msg : (error as ValidatorError).message || 'Validation error',
          }))
        )
      );
    }

    const result = await AuthService.login(req.body);

    res.json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Login error:', error);

    let errorCode = 'LOGIN_FAILED';
    let errorMessage = 'Login failed';

    if (err.message === 'INVALID_CREDENTIALS') {
      errorCode = 'INVALID_CREDENTIALS';
      errorMessage = 'Invalid email or password';
    } else if (err.message === 'EMAIL_NOT_VERIFIED') {
      errorCode = 'EMAIL_NOT_VERIFIED';
      errorMessage = 'Please verify your email address before logging in';
    } else if (err.message === 'ACCOUNT_DEACTIVATED') {
      errorCode = 'ACCOUNT_DEACTIVATED';
      errorMessage = 'Your account has been deactivated';
    }

    res.status(401).json(createErrorResponse(errorCode, errorMessage, req.id));
  }
});

// Verify email address
router.post('/verify-email', validateEmailVerification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          req.id,
          errors.array().map(error => ({
            field: 'location' in error ? error.location : 'param' in error ? (error as ValidatorError).param : undefined,
            message: 'msg' in error ? error.msg : (error as ValidatorError).message || 'Validation error',
          }))
        )
      );
    }

    const { token } = req.body;
    const result = await AuthService.verifyEmail(token);

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('EMAIL_VERIFICATION_FAILED', result.message, req.id)
      );
    }

    res.json(createSuccessResponse({
      message: result.message,
      user: result.user,
      tokens: result.tokens,
    }));
  } catch (error: unknown) {
    logger.error('Email verification error:', error);
    res.status(500).json(
      createErrorResponse('EMAIL_VERIFICATION_FAILED', 'Email verification failed', req.id)
    );
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'Email is required', req.id)
      );
    }

    const result = await AuthService.resendVerificationEmail(email);

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('RESEND_FAILED', result.message, req.id)
      );
    }

    return res.json(createSuccessResponse({ message: result.message }));
  } catch (error: unknown) {
    logger.error('Resend verification error:', error);
    return res.status(500).json(
      createErrorResponse('RESEND_FAILED', 'Failed to resend verification email', req.id)
    );
  }
});

// Google OAuth authentication
router.post('/google', validateGoogleAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          req.id,
          errors.array().map(error => ({
            field: 'location' in error ? error.location : 'param' in error ? (error as ValidatorError).param : undefined,
            message: 'msg' in error ? error.msg : (error as ValidatorError).message || 'Validation error',
          }))
        )
      );
    }

    const { credential, userType } = req.body;

    // Verify Google credential
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json(
        createErrorResponse('GOOGLE_AUTH_FAILED', 'Invalid Google credential', req.id)
      );
    }

    // Authenticate with Google data
    const googleData = {
      id: payload.sub,
      email: payload.email!,
      verified_email: payload.email_verified || false,
      name: payload.name!,
      given_name: payload.given_name!,
      family_name: payload.family_name!,
      picture: payload.picture!,
    };

    const result = await AuthService.authenticateWithGoogle(googleData, userType);

    res.json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Google authentication error:', {
      error: err.message,
      stack: err.stack,
      googleEmail: payload?.email,
      userType,
      requestId: req.id
    });

    // Return more specific error message
    const errorMessage = err.message || 'Google authentication failed';
    res.status(500).json(
      createErrorResponse('GOOGLE_AUTH_FAILED', errorMessage, req.id)
    );
  }
});

// Telegram authentication
router.post('/telegram', validateTelegramAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          req.id,
          errors.array().map(error => ({
            field: 'location' in error ? error.location : 'param' in error ? (error as ValidatorError).param : undefined,
            message: 'msg' in error ? error.msg : (error as ValidatorError).message || 'Validation error',
          }))
        )
      );
    }

    const result = await AuthService.authenticateWithTelegram(req.body);

    res.json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Telegram authentication error:', error);

    let errorCode = 'TELEGRAM_AUTH_FAILED';
    let errorMessage = 'Telegram authentication failed';

    if (err.message === 'INVALID_TELEGRAM_AUTH') {
      errorCode = 'INVALID_TELEGRAM_AUTH';
      errorMessage = 'Invalid Telegram authentication data';
    } else if (err.message === 'TELEGRAM_AUTH_EXPIRED') {
      errorCode = 'TELEGRAM_AUTH_EXPIRED';
      errorMessage = 'Telegram authentication data has expired';
    } else if (err.message === 'ACCOUNT_DEACTIVATED') {
      errorCode = 'ACCOUNT_DEACTIVATED';
      errorMessage = 'Your account has been deactivated';
    }

    res.status(400).json(createErrorResponse(errorCode, errorMessage, req.id));
  }
});

// Telegram WebApp authentication (mini-app sends raw initData string)
router.post('/telegram/webapp', async (req, res): Promise<void> => {
  try {
    const { initData } = req.body;

    if (!initData || typeof initData !== 'string') {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'initData is required', req.id)
      );
      return;
    }

    if (!config.telegram.botToken) {
      res.status(500).json(
        createErrorResponse('CONFIG_ERROR', 'Telegram bot token not configured', req.id)
      );
      return;
    }

    // Validate WebApp initData using HMAC-SHA256 with "WebAppData" key
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    if (!hash) {
      res.status(400).json(
        createErrorResponse('INVALID_TELEGRAM_AUTH', 'Hash parameter missing', req.id)
      );
      return;
    }

    const dataCheckArray: string[] = [];
    for (const [key, value] of params.entries()) {
      dataCheckArray.push(`${key}=${value}`);
    }
    dataCheckArray.sort();
    const dataCheckString = dataCheckArray.join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(config.telegram.botToken)
      .digest();

    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      logger.warn('WebApp initData hash mismatch');
      res.status(400).json(
        createErrorResponse('INVALID_TELEGRAM_AUTH', 'Invalid Telegram authentication data', req.id)
      );
      return;
    }

    // Check auth date
    const authDate = parseInt(params.get('auth_date') || '0');
    if (Date.now() / 1000 - authDate > 86400) {
      res.status(400).json(
        createErrorResponse('TELEGRAM_AUTH_EXPIRED', 'Telegram authentication data has expired', req.id)
      );
      return;
    }

    // Extract user from initData
    const userStr = params.get('user');
    if (!userStr) {
      res.status(400).json(
        createErrorResponse('VALIDATION_ERROR', 'User data not found in initData', req.id)
      );
      return;
    }

    const telegramUser = JSON.parse(userStr);

    // Delegate to existing authenticateWithTelegram, passing the hash so it passes verification
    // We need to compute the Login Widget hash for the user data so the existing method accepts it
    const telegramData = {
      telegramId: telegramUser.id.toString(),
      firstName: telegramUser.first_name || 'User',
      lastName: telegramUser.last_name || '',
      username: telegramUser.username || '',
      authDate,
      hash: '', // will be computed below
    };

    // Compute the Login Widget style hash so authenticateWithTelegram's verification passes
    const loginSecretKey = crypto.createHash('sha256').update(config.telegram.botToken).digest();
    const fieldMap: Record<string, string> = {
      telegramId: 'id',
      firstName: 'first_name',
      lastName: 'last_name',
      authDate: 'auth_date',
    };
    const telegramFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(telegramData)) {
      if (key === 'hash' || value === undefined || value === null || value === '') continue;
      const tgKey = fieldMap[key] || key;
      telegramFields[tgKey] = String(value);
    }
    const loginCheckString = Object.keys(telegramFields).sort().map(k => `${k}=${telegramFields[k]}`).join('\n');
    telegramData.hash = crypto.createHmac('sha256', loginSecretKey).update(loginCheckString).digest('hex');

    const result = await AuthService.authenticateWithTelegram(telegramData);

    res.json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Telegram WebApp authentication error:', error);

    let errorCode = 'TELEGRAM_AUTH_FAILED';
    let errorMessage = 'Telegram authentication failed';

    if (err.message === 'ACCOUNT_DEACTIVATED') {
      errorCode = 'ACCOUNT_DEACTIVATED';
      errorMessage = 'Your account has been deactivated';
    }

    res.status(400).json(createErrorResponse(errorCode, errorMessage, req.id));
  }
});

// Get Google OAuth URL for frontend
router.get('/google/url', (req, res) => {
  try {
    const redirectUri = config.google.redirectUri || `${config.frontend.url}/auth/google/callback`;
    
    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      redirect_uri: redirectUri,
    });

    res.json(createSuccessResponse({ url }));
  } catch (error: unknown) {
    logger.error('Google URL generation error:', error);
    res.status(500).json(
      createErrorResponse('URL_GENERATION_FAILED', 'Failed to generate Google OAuth URL', req.id)
    );
  }
});

export default router;