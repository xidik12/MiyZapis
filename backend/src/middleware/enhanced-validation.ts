import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '@/utils/logger';
import { detectPlatform } from '@/config/api-configuration';

// Common validation schemas
const commonSchemas = {
  id: z.string().cuid(),
  email: z.string().email().max(255),
  phone: z.string().regex(/^\+380\d{9}$/, 'Invalid Ukrainian phone number'),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).trim(),
  currency: z.enum(['UAH', 'USD', 'EUR']),
  language: z.enum(['uk', 'ru', 'en']),
  userType: z.enum(['CUSTOMER', 'SPECIALIST', 'ADMIN']),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }),
  dateRange: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime()
  }).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: 'Start date must be before end date'
  })
};

// Platform-specific validation schemas
const platformSchemas = {
  web: {
    register: z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      firstName: commonSchemas.name,
      lastName: commonSchemas.name,
      userType: commonSchemas.userType,
      phoneNumber: commonSchemas.phone.optional(),
      language: commonSchemas.language.default('en'),
      acceptedTerms: z.boolean().refine(val => val === true, {
        message: 'Terms and conditions must be accepted'
      }),
      marketingConsent: z.boolean().optional()
    }),
    login: z.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      rememberMe: z.boolean().optional()
    })
  },
  
  telegram_bot: {
    auth: z.object({
      telegramId: z.number().int().positive(),
      firstName: commonSchemas.name,
      lastName: commonSchemas.name.optional(),
      username: z.string().min(1).max(50).optional(),
      photoUrl: z.string().url().optional(),
      languageCode: z.string().length(2).optional(),
      chatId: z.number().int().optional()
    }),
    message: z.object({
      content: z.string().min(1).max(4000),
      messageType: z.enum(['TEXT', 'PHOTO', 'DOCUMENT']).default('TEXT'),
      recipientId: commonSchemas.id
    })
  },
  
  telegram_miniapp: {
    auth: z.object({
      initData: z.string().min(1),
      platform: z.literal('telegram_miniapp')
    }),
    initDataParsed: z.object({
      user: z.object({
        id: z.number().int().positive(),
        first_name: commonSchemas.name,
        last_name: commonSchemas.name.optional(),
        username: z.string().min(1).max(50).optional(),
        photo_url: z.string().url().optional(),
        language_code: z.string().length(2).optional()
      }),
      auth_date: z.number().int().positive(),
      hash: z.string().length(64)
    })
  }
};

// Booking validation schemas
export const bookingSchemas = {
  create: z.object({
    serviceId: commonSchemas.id,
    specialistId: commonSchemas.id,
    scheduledAt: z.string().datetime(),
    customerNotes: z.string().max(1000).optional(),
    promoCodeId: commonSchemas.id.optional()
  }).refine((data) => {
    const scheduledDate = new Date(data.scheduledAt);
    const now = new Date();
    return scheduledDate > now;
  }, {
    message: 'Booking must be scheduled for a future date',
    path: ['scheduledAt']
  }),
  
  update: z.object({
    scheduledAt: z.string().datetime().optional(),
    customerNotes: z.string().max(1000).optional(),
    specialistNotes: z.string().max(1000).optional(),
    status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()
  }),
  
  reschedule: z.object({
    newDateTime: z.string().datetime(),
    reason: z.string().max(500)
  }).refine((data) => {
    const newDate = new Date(data.newDateTime);
    const now = new Date();
    return newDate > now;
  }, {
    message: 'New booking date must be in the future'
  }),
  
  cancel: z.object({
    reason: z.string().min(5).max(500)
  })
};

// Service validation schemas
export const serviceSchemas = {
  create: z.object({
    name: z.string().min(3).max(200),
    description: z.string().min(10).max(2000),
    categoryId: commonSchemas.id,
    basePrice: z.number().positive().max(999999),
    currency: commonSchemas.currency,
    duration: z.number().int().min(15).max(480), // 15 minutes to 8 hours
    requirements: z.array(z.string().max(200)).optional(),
    deliverables: z.array(z.string().max(200)).optional(),
    images: z.array(z.string().url()).optional(),
    isActive: z.boolean().default(true),
    requiresApproval: z.boolean().default(true),
    maxAdvanceBooking: z.number().int().min(1).max(365).default(30),
    minAdvanceBooking: z.number().int().min(1).max(72).default(1)
  }),
  
  update: z.object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(2000).optional(),
    basePrice: z.number().positive().max(999999).optional(),
    duration: z.number().int().min(15).max(480).optional(),
    requirements: z.array(z.string().max(200)).optional(),
    deliverables: z.array(z.string().max(200)).optional(),
    isActive: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    maxAdvanceBooking: z.number().int().min(1).max(365).optional(),
    minAdvanceBooking: z.number().int().min(1).max(72).optional()
  }),
  
  search: z.object({
    query: z.string().max(200).optional(),
    categoryId: commonSchemas.id.optional(),
    specialistId: commonSchemas.id.optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    minDuration: z.coerce.number().int().min(15).optional(),
    maxDuration: z.coerce.number().int().max(480).optional(),
    city: z.string().max(100).optional(),
    coordinates: commonSchemas.coordinates.optional(),
    radius: z.coerce.number().min(1).max(100).optional(), // km
    sortBy: z.enum(['price', 'rating', 'distance', 'duration', 'created_at']).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
    ...commonSchemas.pagination.shape
  })
};

// Payment validation schemas
export const paymentSchemas = {
  createIntent: z.object({
    bookingId: commonSchemas.id,
    amount: z.number().positive().max(999999),
    currency: commonSchemas.currency,
    paymentMethod: z.enum(['card', 'liqpay', 'fondy', 'wayforpay', 'telegram']),
    savePaymentMethod: z.boolean().default(false)
  }),
  
  confirm: z.object({
    paymentIntentId: z.string().min(1),
    paymentMethodId: z.string().min(1).optional(),
    returnUrl: z.string().url().optional()
  }),
  
  telegramInvoice: z.object({
    bookingId: commonSchemas.id,
    amount: z.number().positive().max(999999),
    currency: commonSchemas.currency,
    description: z.string().min(5).max(200),
    chatId: z.string().min(1)
  })
};

// File upload validation schemas
export const fileSchemas = {
  upload: z.object({
    purpose: z.enum(['avatar', 'service_image', 'portfolio', 'message_attachment', 'document']),
    entityType: z.string().optional(),
    entityId: commonSchemas.id.optional()
  }),
  
  signedUpload: z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(100),
    purpose: z.enum(['avatar', 'service_image', 'portfolio', 'message_attachment', 'document'])
  })
};

// Review validation schemas
export const reviewSchemas = {
  create: z.object({
    bookingId: commonSchemas.id,
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(10).max(2000).optional(),
    tags: z.array(z.string().max(50)).optional()
  }),
  
  update: z.object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().min(10).max(2000).optional(),
    tags: z.array(z.string().max(50)).optional()
  })
};

// Validation error formatter
export class CustomValidationError extends Error {
  public statusCode: number = 400;
  public code: string = 'VALIDATION_ERROR';
  public details: any[];

  constructor(zodError: z.ZodError) {
    super('Validation failed');
    this.details = zodError.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  }
}

// Platform-aware validation middleware
export function validateRequest(schemaName: string, location: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const platform = detectPlatform(req);
      
      // Get appropriate schema
      let schema: z.ZodSchema<any>;
      
      // First check platform-specific schemas
      if (platformSchemas[platform]?.[schemaName]) {
        schema = platformSchemas[platform][schemaName];
      } 
      // Then check common schemas
      else if (commonSchemas[schemaName]) {
        schema = commonSchemas[schemaName];
      }
      // Then check specific validation schemas
      else if (bookingSchemas[schemaName]) {
        schema = bookingSchemas[schemaName];
      } else if (serviceSchemas[schemaName]) {
        schema = serviceSchemas[schemaName];
      } else if (paymentSchemas[schemaName]) {
        schema = paymentSchemas[schemaName];
      } else if (fileSchemas[schemaName]) {
        schema = fileSchemas[schemaName];
      } else if (reviewSchemas[schemaName]) {
        schema = reviewSchemas[schemaName];
      } else {
        throw new Error(`Unknown validation schema: ${schemaName}`);
      }

      // Validate the request data
      const dataToValidate = req[location];
      const validatedData = schema.parse(dataToValidate);
      
      // Replace the original data with validated data
      req[location] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new CustomValidationError(error);
        
        logger.warn('Validation error', {
          schema: schemaName,
          platform: detectPlatform(req),
          errors: validationError.details,
          url: req.originalUrl,
          method: req.method
        });
        
        return res.status(400).json({
          success: false,
          error: {
            code: validationError.code,
            message: validationError.message,
            details: validationError.details
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id']
        });
      }
      
      logger.error('Validation middleware error:', error);
      next(error);
    }
  };
}

// Sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize strings in body, query, and params
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

// Business logic validation middleware
export function validateBusinessRules(ruleName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      switch (ruleName) {
        case 'booking_availability':
          await validateBookingAvailability(req);
          break;
          
        case 'specialist_ownership':
          await validateSpecialistOwnership(req);
          break;
          
        case 'booking_modification_allowed':
          await validateBookingModification(req);
          break;
          
        case 'payment_amount':
          await validatePaymentAmount(req);
          break;
          
        case 'review_eligibility':
          await validateReviewEligibility(req);
          break;
          
        default:
          throw new Error(`Unknown business rule: ${ruleName}`);
      }
      
      next();
    } catch (error) {
      logger.error('Business rule validation failed:', error);
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'BUSINESS_RULE_VIOLATION',
          message: error instanceof Error ? error.message : 'Business rule validation failed'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Business rule validation functions
async function validateBookingAvailability(req: Request) {
  // Implementation would check specialist availability, service availability, etc.
  // This is a placeholder for the actual implementation
}

async function validateSpecialistOwnership(req: Request) {
  // Check if the current user owns the specialist profile being modified
  // Implementation placeholder
}

async function validateBookingModification(req: Request) {
  // Check if booking can still be modified (not too close to appointment time, etc.)
  // Implementation placeholder
}

async function validatePaymentAmount(req: Request) {
  // Validate that payment amount matches booking amount
  // Implementation placeholder
}

async function validateReviewEligibility(req: Request) {
  // Check if user can leave a review (booking completed, no existing review, etc.)
  // Implementation placeholder
}

// Platform feature validation
export function requireFeature(feature: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const platform = detectPlatform(req);
    
    // This would integrate with your API configuration
    const platformConfig = {
      web: ['full_api', 'oauth', 'file_upload', 'websockets', 'push_notifications'],
      telegram_bot: ['core_api', 'telegram_auth', 'limited_upload', 'bot_commands'],
      telegram_miniapp: ['full_api', 'telegram_auth', 'file_upload', 'websockets', 'telegram_payments']
    };
    
    if (!platformConfig[platform]?.includes(feature)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: `Feature '${feature}' is not available for platform '${platform}'`
        }
      });
    }
    
    next();
  };
}

export {
  commonSchemas,
  platformSchemas,
  CustomValidationError as ValidationError
};