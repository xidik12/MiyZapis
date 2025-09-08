import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';

// Enhanced validation chains
export const validationChains = {
  // User validation
  user: {
    register: [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
      body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
      body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/)
        .withMessage('First name must be 2-50 characters, letters only'),
      body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/)
        .withMessage('Last name must be 2-50 characters, letters only'),
      body('userType')
        .isIn(['CUSTOMER', 'SPECIALIST'])
        .withMessage('User type must be CUSTOMER or SPECIALIST'),
      body('phoneNumber')
        .optional()
        .isMobilePhone(['uk-UA', 'en-US'])
        .withMessage('Valid phone number is required'),
      body('language')
        .optional()
        .isIn(['en', 'uk', 'ru'])
        .withMessage('Language must be en, uk, or ru'),
      body('currency')
        .optional()
        .isIn(['USD', 'UAH', 'EUR'])
        .withMessage('Currency must be USD, UAH, or EUR'),
      body('telegramId')
        .optional()
        .isString()
        .isLength({ min: 1, max: 50 })
        .withMessage('Invalid Telegram ID')
    ],
    
    login: [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
      body('password')
        .notEmpty()
        .withMessage('Password is required'),
      body('platform')
        .optional()
        .isIn(['web', 'mobile', 'telegram'])
        .withMessage('Platform must be web, mobile, or telegram')
    ],

    updateProfile: [
      body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/)
        .withMessage('First name must be 2-50 characters, letters only'),
      body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/)
        .withMessage('Last name must be 2-50 characters, letters only'),
      body('phoneNumber')
        .optional()
        .isMobilePhone(['uk-UA', 'en-US'])
        .withMessage('Valid phone number is required'),
      body('language')
        .optional()
        .isIn(['en', 'uk', 'ru'])
        .withMessage('Language must be en, uk, or ru'),
      body('currency')
        .optional()
        .isIn(['USD', 'UAH', 'EUR'])
        .withMessage('Currency must be USD, UAH, or EUR'),
      body('timezone')
        .optional()
        .isString()
        .isLength({ min: 1, max: 100 })
        .withMessage('Invalid timezone')
    ]
  },

  // Specialist validation
  specialist: {
    createProfile: [
      body('businessName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Business name must be 2-100 characters'),
      body('bio')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Bio must not exceed 1000 characters'),
      body('specialties')
        .isArray({ min: 1 })
        .withMessage('At least one specialty is required')
        .custom((specialties) => {
          if (!Array.isArray(specialties) || specialties.length === 0) {
            throw new Error('Specialties must be a non-empty array');
          }
          const validSpecialties = [
            'haircut', 'massage', 'fitness', 'beauty', 'tattoo', 
            'therapy', 'automotive', 'home', 'photography', 'education'
          ];
          for (const specialty of specialties) {
            if (!validSpecialties.includes(specialty)) {
              throw new Error(`Invalid specialty: ${specialty}`);
            }
          }
          return true;
        }),
      body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be 5-200 characters'),
      body('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be 2-50 characters'),
      body('country')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Country must be 2-50 characters'),
      body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),
      body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),
      body('workingHours')
        .optional()
        .isObject()
        .withMessage('Working hours must be an object')
    ],

    updateProfile: [
      body('businessName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Business name must be 2-100 characters'),
      body('bio')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Bio must not exceed 1000 characters'),
      body('specialties')
        .optional()
        .isArray({ min: 1 })
        .withMessage('At least one specialty is required'),
      body('address')
        .optional()
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Address must be 5-200 characters'),
      body('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be 2-50 characters')
    ]
  },

  // Service validation
  service: {
    create: [
      body('name')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Service name must be 3-100 characters'),
      body('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be 10-2000 characters'),
      body('category')
        .isIn(['haircut', 'massage', 'fitness', 'beauty', 'tattoo', 'therapy', 'automotive', 'home', 'photography', 'education'])
        .withMessage('Invalid service category'),
      body('basePrice')
        .isFloat({ min: 0.01, max: 100000 })
        .withMessage('Base price must be between 0.01 and 100000'),
      body('currency')
        .optional()
        .isIn(['USD', 'UAH', 'EUR'])
        .withMessage('Currency must be USD, UAH, or EUR'),
      body('duration')
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes'),
      body('requirements')
        .optional()
        .isArray()
        .withMessage('Requirements must be an array'),
      body('deliverables')
        .optional()
        .isArray()
        .withMessage('Deliverables must be an array'),
      body('maxAdvanceBooking')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Max advance booking must be between 1 and 365 days'),
      body('minAdvanceBooking')
        .optional()
        .isInt({ min: 1, max: 72 })
        .withMessage('Min advance booking must be between 1 and 72 hours')
    ],

    update: [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Service name must be 3-100 characters'),
      body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be 10-2000 characters'),
      body('basePrice')
        .optional()
        .isFloat({ min: 0.01, max: 100000 })
        .withMessage('Base price must be between 0.01 and 100000'),
      body('duration')
        .optional()
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes')
    ]
  },

  // Booking validation
  booking: {
    create: [
      body('serviceId')
        .isUUID()
        .withMessage('Valid service ID is required'),
      body('scheduledAt')
        .isISO8601()
        .custom((value) => {
          const bookingDate = new Date(value);
          const now = new Date();
          const minBookingTime = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now
          const maxBookingTime = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now

          if (bookingDate < minBookingTime) {
            throw new Error('Booking must be at least 1 hour in the future');
          }
          if (bookingDate > maxBookingTime) {
            throw new Error('Booking cannot be more than 90 days in the future');
          }
          return true;
        }),
      body('duration')
        .isInt({ min: 15, max: 480 })
        .withMessage('Duration must be between 15 and 480 minutes'),
      body('customerNotes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Customer notes must not exceed 1000 characters'),
      body('loyaltyPointsUsed')
        .optional()
        .isInt({ min: 0, max: 100000 })
        .withMessage('Loyalty points used must be between 0 and 100000'),
      body('promoCodeId')
        .optional()
        .isUUID()
        .withMessage('Invalid promo code ID')
    ],

    update: [
      body('status')
        .optional()
        .isIn(['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'])
        .withMessage('Invalid booking status'),
      body('scheduledAt')
        .optional()
        .isISO8601()
        .withMessage('Valid date and time is required'),
      body('specialistNotes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Specialist notes must not exceed 1000 characters'),
      body('preparationNotes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Preparation notes must not exceed 1000 characters'),
      body('completionNotes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Completion notes must not exceed 1000 characters')
    ],

    cancel: [
      body('reason')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Cancellation reason must be 5-500 characters')
    ]
  },

  // Payment validation
  payment: {
    createIntent: [
      body('bookingId')
        .isUUID()
        .withMessage('Valid booking ID is required'),
      body('amount')
        .isFloat({ min: 0.01, max: 100000 })
        .withMessage('Amount must be between 0.01 and 100000'),
      body('currency')
        .isIn(['USD', 'UAH', 'EUR'])
        .withMessage('Currency must be USD, UAH, or EUR'),
      body('paymentMethodType')
        .optional()
        .isIn(['card', 'liqpay', 'monobank', 'privatbank', 'wayforpay'])
        .withMessage('Invalid payment method type')
    ],

    refund: [
      body('paymentId')
        .isUUID()
        .withMessage('Valid payment ID is required'),
      body('amount')
        .optional()
        .isFloat({ min: 0.01, max: 100000 })
        .withMessage('Refund amount must be between 0.01 and 100000'),
      body('reason')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Refund reason must be 5-500 characters')
    ]
  },

  // Review validation
  review: {
    create: [
      body('bookingId')
        .isUUID()
        .withMessage('Valid booking ID is required'),
      body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
      body('comment')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Comment must be 10-2000 characters'),
      body('tags')
        .optional()
        .isArray()
        .custom((tags) => {
          if (!Array.isArray(tags)) return true;
          const validTags = [
            'professional', 'punctual', 'friendly', 'skilled', 'clean', 
            'organized', 'creative', 'patient', 'helpful', 'experienced'
          ];
          for (const tag of tags) {
            if (!validTags.includes(tag)) {
              throw new Error(`Invalid tag: ${tag}`);
            }
          }
          return true;
        })
    ],

    update: [
      body('rating')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
      body('comment')
        .optional()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Comment must be 10-2000 characters'),
      body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
    ]
  },

  // Message validation
  message: {
    send: [
      body('conversationId')
        .isUUID()
        .withMessage('Valid conversation ID is required'),
      body('content')
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Message content must be 1-5000 characters'),
      body('messageType')
        .optional()
        .isIn(['TEXT', 'IMAGE', 'FILE', 'SYSTEM'])
        .withMessage('Invalid message type'),
      body('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array')
    ]
  },

  // Notification validation
  notification: {
    updatePreferences: [
      body('emailNotifications')
        .optional()
        .isBoolean()
        .withMessage('Email notifications must be boolean'),
      body('pushNotifications')
        .optional()
        .isBoolean()
        .withMessage('Push notifications must be boolean'),
      body('telegramNotifications')
        .optional()
        .isBoolean()
        .withMessage('Telegram notifications must be boolean'),
      body('notificationTypes')
        .optional()
        .isObject()
        .withMessage('Notification types must be an object')
    ]
  },

  // File validation
  file: {
    purpose: [
      query('purpose')
        .isIn(['avatar', 'service_image', 'portfolio', 'message_attachment', 'document'])
        .withMessage('Invalid file purpose')
    ]
  },

  // Common parameter validations
  params: {
    id: [
      param('id')
        .isUUID()
        .withMessage('Invalid ID format')
    ],
    
    bookingId: [
      param('bookingId')
        .isUUID()
        .withMessage('Invalid booking ID format')
    ],

    specialistId: [
      param('specialistId')
        .isUUID()
        .withMessage('Invalid specialist ID format')
    ],

    serviceId: [
      param('serviceId')
        .isUUID()
        .withMessage('Invalid service ID format')
    ],

    conversationId: [
      param('conversationId')
        .isUUID()
        .withMessage('Invalid conversation ID format')
    ]
  },

  // Query parameter validations
  query: {
    pagination: [
      query('page')
        .optional()
        .isInt({ min: 1, max: 1000 })
        .withMessage('Page must be between 1 and 1000'),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
    ],

    search: [
      query('query')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be 1-100 characters'),
      query('category')
        .optional()
        .isIn(['haircut', 'massage', 'fitness', 'beauty', 'tattoo', 'therapy', 'automotive', 'home', 'photography', 'education'])
        .withMessage('Invalid category'),
      query('city')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('City must be 2-50 characters'),
      query('minRating')
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage('Minimum rating must be between 0 and 5'),
      query('minPrice')
        .optional()
        .isFloat({ min: 0, max: 100000 })
        .withMessage('Minimum price must be between 0 and 100000'),
      query('maxPrice')
        .optional()
        .isFloat({ min: 0, max: 100000 })
        .withMessage('Maximum price must be between 0 and 100000'),
      query('sortBy')
        .optional()
        .isIn(['price', 'rating', 'reviews', 'newest', 'distance'])
        .withMessage('Invalid sort option')
    ],

    dateRange: [
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO date'),
      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO date')
        .custom((endDate, { req }) => {
          if (req.query.startDate && endDate) {
            const start = new Date(req.query.startDate as string);
            const end = new Date(endDate);
            if (end <= start) {
              throw new Error('End date must be after start date');
            }
          }
          return true;
        })
    ]
  }
};

// Middleware to handle validation results
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
      message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
      code: 'INVALID_VALUE',
      value: 'value' in error ? error.value : undefined
    }));

    return res.status(400).json(
      createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Validation failed',
        req.headers['x-request-id'] as string,
        formattedErrors
      )
    );
  }

  next();
};

// Combined validation middleware creator
export const validate = (validations: any[]) => {
  return [
    ...validations,
    handleValidationErrors
  ];
};

// Sanitization helpers
export const sanitizers = {
  // Remove HTML tags and dangerous characters
  sanitizeHtml: (value: string): string => {
    return value
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  },

  // Normalize Ukrainian phone numbers
  normalizePhoneUkraine: (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (digits.startsWith('380')) {
      return '+' + digits;
    } else if (digits.startsWith('80')) {
      return '+3' + digits;
    } else if (digits.startsWith('0')) {
      return '+38' + digits;
    } else if (digits.length === 9) {
      return '+380' + digits;
    }
    
    return phone; // Return original if can't normalize
  },

  // Normalize currency amounts
  normalizeCurrency: (amount: number, currency: string): number => {
    // Convert to cents/kopecks for precise calculations
    const multiplier = currency === 'UAH' ? 100 : 100;
    return Math.round(amount * multiplier) / multiplier;
  }
};

// Rate limiting validation
export const rateLimitValidation = {
  // Strict rate limiting for sensitive operations
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many requests, please try again later'
  },

  // Standard rate limiting for normal operations
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later'
  },

  // Lenient rate limiting for read operations
  lenient: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: 'Too many requests, please try again later'
  }
};