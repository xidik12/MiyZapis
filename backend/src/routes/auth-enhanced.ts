import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import { body, validationResult } from 'express-validator';
import { EnhancedAuthService } from '@/services/auth/enhanced';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const router = express.Router();

// Enhanced CORS options for OAuth routes
const oauthCorsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
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
  (req, res, next) => {
    logger.info('Starting validation middleware', { email: req.body?.email });
    next();
  },
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('userType').isIn(['CUSTOMER', 'SPECIALIST']).withMessage('Valid user type is required'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  (req, res, next) => {
    logger.info('Validation middleware completed', { email: req.body?.email });
    next();
  },
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
  body('firstName').isLength({ min: 1 }).withMessage('First name is required'),
  body('authDate').isNumeric().withMessage('Auth date is required'),
  body('hash').isLength({ min: 1 }).withMessage('Hash is required'),
];

// Debug middleware for registration
router.post('/register', (req, res, next) => {
  logger.info('Registration request received', {
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.url
  });
  next();
}, validateRegistration, async (req, res) => {
  try {
    logger.info('Registration validation passed, processing...', { email: req.body?.email });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          req.id,
          errors.array().map(error => ({
            field: error.param,
            message: error.msg,
          }))
        )
      );
    }

    const result = await EnhancedAuthService.register(req.body);

    res.status(201).json(createSuccessResponse(result));
  } catch (error: any) {
    logger.error('Registration error:', error);

    let errorCode = 'REGISTRATION_FAILED';
    let errorMessage = 'Registration failed';

    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      errorCode = 'EMAIL_ALREADY_EXISTS';
      errorMessage = 'Email address is already registered';
    } else if (error.message === 'TELEGRAM_ID_ALREADY_EXISTS') {
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
            field: error.param,
            message: error.msg,
          }))
        )
      );
    }

    const result = await EnhancedAuthService.login(req.body);

    res.json(createSuccessResponse(result));
  } catch (error: any) {
    logger.error('Login error:', error);

    let errorCode = 'LOGIN_FAILED';
    let errorMessage = 'Login failed';

    if (error.message === 'INVALID_CREDENTIALS') {
      errorCode = 'INVALID_CREDENTIALS';
      errorMessage = 'Invalid email or password';
    } else if (error.message === 'EMAIL_NOT_VERIFIED') {
      errorCode = 'EMAIL_NOT_VERIFIED';
      errorMessage = 'Please verify your email address before logging in';
    } else if (error.message === 'ACCOUNT_DEACTIVATED') {
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
            field: error.param,
            message: error.msg,
          }))
        )
      );
    }

    const { token } = req.body;
    const result = await EnhancedAuthService.verifyEmail(token);

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
  } catch (error: any) {
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

    const result = await EnhancedAuthService.resendVerificationEmail(email);

    if (!result.success) {
      return res.status(400).json(
        createErrorResponse('RESEND_FAILED', result.message, req.id)
      );
    }

    res.json(createSuccessResponse({ message: result.message }));
  } catch (error: any) {
    logger.error('Resend verification error:', error);
    res.status(500).json(
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
            field: error.param,
            message: error.msg,
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

    const result = await EnhancedAuthService.authenticateWithGoogle(googleData, userType);

    res.json(createSuccessResponse(result));
  } catch (error: any) {
    logger.error('Google authentication error:', error);
    res.status(500).json(
      createErrorResponse('GOOGLE_AUTH_FAILED', 'Google authentication failed', req.id)
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
            field: error.param,
            message: error.msg,
          }))
        )
      );
    }

    const result = await EnhancedAuthService.authenticateWithTelegram(req.body);

    res.json(createSuccessResponse(result));
  } catch (error: any) {
    logger.error('Telegram authentication error:', error);

    let errorCode = 'TELEGRAM_AUTH_FAILED';
    let errorMessage = 'Telegram authentication failed';

    if (error.message === 'INVALID_TELEGRAM_AUTH') {
      errorCode = 'INVALID_TELEGRAM_AUTH';
      errorMessage = 'Invalid Telegram authentication data';
    } else if (error.message === 'TELEGRAM_AUTH_EXPIRED') {
      errorCode = 'TELEGRAM_AUTH_EXPIRED';
      errorMessage = 'Telegram authentication data has expired';
    } else if (error.message === 'ACCOUNT_DEACTIVATED') {
      errorCode = 'ACCOUNT_DEACTIVATED';
      errorMessage = 'Your account has been deactivated';
    }

    res.status(400).json(createErrorResponse(errorCode, errorMessage, req.id));
  }
});

// Get Google OAuth URL for frontend
router.get('/google/url', (req, res) => {
  try {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
    
    const url = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      redirect_uri: redirectUri,
    });

    res.json(createSuccessResponse({ url }));
  } catch (error: any) {
    logger.error('Google URL generation error:', error);
    res.status(500).json(
      createErrorResponse('URL_GENERATION_FAILED', 'Failed to generate Google OAuth URL', req.id)
    );
  }
});

export default router;