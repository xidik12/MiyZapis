import { body, param, query } from 'express-validator';

// Update user profile validation
export const validateUpdateProfile = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  
  body('phoneNumber')
    .optional()
    .custom((value) => {
      // Allow null or empty string
      if (value === null || value === '' || value === undefined) {
        return true;
      }
      // If provided, must be a valid international phone number
      if (typeof value === 'string' && value.length > 0) {
        // More flexible international phone validation
        // Allows formats like: +855 10 374 007, +1 555 123 4567, etc.
        const phoneRegex = /^[\+]?[1-9]\d{0,3}[\s\-]?(\d[\s\-]?){8,14}$/;
        if (!phoneRegex.test(value.replace(/\s+/g, ' ').trim())) {
          throw new Error('Phone number format is invalid');
        }
      }
      return true;
    })
    .withMessage('Valid international phone number is required'),
  
  body('language')
    .optional()
    .isIn(['en', 'uk', 'ru'])
    .withMessage('Valid language is required'),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'RUB', 'UAH'])
    .withMessage('Valid currency is required'),
  
  body('timezone')
    .optional()
    .isString()
    .withMessage('Valid timezone is required'),
  
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  
  body('telegramNotifications')
    .optional()
    .isBoolean()
    .withMessage('Telegram notifications must be a boolean'),
];

// Upload avatar validation
export const validateUploadAvatar = [
  body('avatar')
    .custom((value, { req }) => {
      if (!req.file && !value) {
        throw new Error('Avatar image is required');
      }
      
      if (req.file) {
        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new Error('Avatar must be a valid image file (JPEG, PNG, GIF, or WebP)');
        }
        
        // Validate file size (max 5MB)
        if (req.file.size > 5 * 1024 * 1024) {
          throw new Error('Avatar file size must be less than 5MB');
        }
      }
      
      // If it's a URL (for external avatars)
      if (typeof value === 'string' && value.match(/^https?:\/\/.+/)) {
        return true;
      }
      
      return true;
    }),
];

// Update password validation
export const validateUpdatePassword = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
];

// Link Telegram account validation
export const validateLinkTelegram = [
  body('telegramId')
    .isString()
    .isLength({ min: 1, max: 20 })
    .withMessage('Valid Telegram ID is required'),
  
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  
  body('username')
    .optional()
    .trim()
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

// Unlink Telegram account validation
export const validateUnlinkTelegram = [
  body('confirmPassword')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Password confirmation may be required'),
];

// Delete account validation
export const validateDeleteAccount = [
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required to delete account'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Deletion reason must be between 1 and 500 characters'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters'),
];

// Get user activity validation
export const validateGetUserActivity = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  
  query('type')
    .optional()
    .isIn(['booking', 'payment', 'review', 'login', 'profile_update'])
    .withMessage('Valid activity type is required'),
];

// Export user data validation
export const validateExportUserData = [
  body('includeBookings')
    .optional()
    .isBoolean()
    .withMessage('Include bookings must be a boolean'),
  
  body('includePayments')
    .optional()
    .isBoolean()
    .withMessage('Include payments must be a boolean'),
  
  body('includeReviews')
    .optional()
    .isBoolean()
    .withMessage('Include reviews must be a boolean'),
  
  body('format')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('Export format must be json, csv, or pdf'),
];

// Update notification preferences validation
export const validateUpdateNotifications = [
  body('emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('pushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean'),
  
  body('telegramNotifications')
    .optional()
    .isBoolean()
    .withMessage('Telegram notifications must be a boolean'),
  
  body('bookingReminders')
    .optional()
    .isBoolean()
    .withMessage('Booking reminders must be a boolean'),
  
  body('promotionalEmails')
    .optional()
    .isBoolean()
    .withMessage('Promotional emails must be a boolean'),
  
  body('reviewRequests')
    .optional()
    .isBoolean()
    .withMessage('Review requests must be a boolean'),
];

// User search validation
export const validateUserSearch = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('userType')
    .optional()
    .isIn(['CUSTOMER', 'SPECIALIST', 'ADMIN'])
    .withMessage('Valid user type is required'),
  
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  
  query('isVerified')
    .optional()
    .isBoolean()
    .withMessage('Is verified must be a boolean'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
];

// User ID param validation
export const validateUserId = [
  param('id')
    .isUUID()
    .withMessage('Valid user ID is required'),
];