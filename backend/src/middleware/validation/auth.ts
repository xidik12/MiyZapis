import { body } from 'express-validator';

// Define user types as constants since we're using strings in SQLite
const USER_TYPES = ['CUSTOMER', 'SPECIALIST', 'ADMIN'] as const;

// Register validation
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('firstName')
    .trim()
    .customSanitizer((value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\u0400-\u04FF\u0100-\u017F\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('lastName')
    .trim()
    .customSanitizer((value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\u0400-\u04FF\u0100-\u017F\s\-']+$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required'),
  
  body('userType')
    .isIn(USER_TYPES)
    .withMessage('Valid user type is required (CUSTOMER or SPECIALIST)'),
  
  body('telegramId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('Valid Telegram ID is required'),
];

// Login validation
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  
  body('platform')
    .optional()
    .isIn(['web', 'telegram_bot', 'telegram_mini_app'])
    .withMessage('Valid platform is required'),
];

// Telegram auth validation
export const validateTelegramAuth = [
  body('telegramId')
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('Valid Telegram ID is required'),
  
  body('firstName')
    .trim()
    .customSanitizer((value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim())
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required'),

  body('lastName')
    .optional()
    .trim()
    .customSanitizer((value: string) => value ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() : value)
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),

  body('username')
    .optional()
    .trim()
    .customSanitizer((value: string) => value ? value.replace(/<[^>]*>/g, '').trim() : value)
    .isLength({ max: 50 })
    .withMessage('Username must be less than 50 characters'),
  
  body('authDate')
    .isInt({ min: 1 })
    .withMessage('Valid auth date is required'),
  
  body('hash')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Valid hash is required'),
];

// Refresh token validation
export const validateRefreshToken = [
  body('refreshToken')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Refresh token is required'),
];

// Email verification validation
export const validateEmailVerification = [
  body('token')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Verification token is required'),
];

// Password reset request validation
export const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

// Password reset validation
export const validatePasswordReset = [
  body('token')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Reset token is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // confirmPassword is validated on frontend - optional on backend for backwards compatibility
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => {
      if (value && value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
];

// Change password validation
export const validateChangePassword = [
  body('currentPassword')
    .optional()  // Optional for Google OAuth users who don't have a current password
    .isLength({ min: 1 })
    .withMessage('Current password is required if you have one set'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol')
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]*$/)
    .withMessage('Password must contain only English characters and symbols'),
];

// Set initial password validation
export const validateSetInitialPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:,.<>?])/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, one number, and one symbol')
    .matches(/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]*$/)
    .withMessage('Password must contain only English characters and symbols'),
];