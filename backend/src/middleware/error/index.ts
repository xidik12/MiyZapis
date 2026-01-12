import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';
import { createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';
import { config } from '@/config';

// Sanitize headers to remove sensitive information
const sanitizeHeaders = (headers: any): any => {
  const sanitized = { ...headers };

  // Remove sensitive headers
  delete sanitized.authorization;
  delete sanitized.cookie;
  delete sanitized['x-api-key'];
  delete sanitized['x-csrf-token'];
  delete sanitized['x-xsrf-token'];

  return sanitized;
};

// Sanitize body to remove sensitive fields
const sanitizeBody = (body: any): any => {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };

  // List of sensitive field names (case-insensitive check)
  const sensitiveFields = [
    'password',
    'newPassword',
    'oldPassword',
    'confirmPassword',
    'token',
    'refreshToken',
    'accessToken',
    'secret',
    'apiKey',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurity'
  ];

  // Recursively sanitize all keys
  for (const key in sanitized) {
    if (sanitized.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();

      // Check if key matches sensitive field
      if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeBody(sanitized[key]);
      }
    }
  }

  return sanitized;
};

// Global error handler
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: {
      name: error.name,
      message: error.message,
      stack: config.isDevelopment ? error.stack : undefined, // Only log stack traces in development
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: sanitizeHeaders(req.headers), // ✅ Sanitized
      body: sanitizeBody(req.body),          // ✅ Sanitized
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
    },
  });

  // Handle specific error types
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, req, res);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json(
      createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Invalid data provided',
        req.headers['x-request-id'] as string
      )
    );
    return;
  }

  // ✅ SECURITY FIX: Handle validation errors with controlled messages
  if (error.name === 'ValidationError') {
    // Log detailed validation error
    logger.warn('Validation error', {
      message: error.message,
      requestId: req.headers['x-request-id'],
      method: req.method,
      path: req.path,
      userId: (req as any).user?.id
    });

    // ✅ Show detailed message in dev, generic in production
    const validationMessage = config.isDevelopment
      ? error.message
      : 'Invalid data provided';

    res.status(400).json(
      createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        validationMessage,
        req.headers['x-request-id'] as string
      )
    );
    return;
  }

  // ✅ SECURITY FIX: Handle JWT errors (already generic)
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json(
      createErrorResponse(
        ErrorCodes.AUTHENTICATION_REQUIRED,
        'Invalid authentication token',
        req.headers['x-request-id'] as string
      )
    );
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json(
      createErrorResponse(
        ErrorCodes.TOKEN_EXPIRED,
        'Authentication token has expired',
        req.headers['x-request-id'] as string
      )
    );
    return;
  }

  // Handle Stripe errors
  if (error.type && error.type.startsWith('Stripe')) {
    handleStripeError(error, req, res);
    return;
  }

  // ✅ SECURITY FIX: Generic default error response
  res.status(500).json(
    createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      config.isDevelopment
        ? 'An unexpected error occurred'
        : 'An error occurred while processing your request',
      req.headers['x-request-id'] as string
    )
  );
};

// ✅ SECURITY FIX: Handle Prisma errors with generic messages
const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response
): void => {
  // Log detailed error for debugging (with sanitized data)
  logger.error('Prisma database error', {
    code: error.code,
    meta: config.isDevelopment ? error.meta : undefined,
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id
  });

  // Return generic error messages to prevent information disclosure
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      // ✅ Generic message - don't reveal which field is duplicate
      res.status(409).json(
        createErrorResponse(
          ErrorCodes.DUPLICATE_RESOURCE,
          config.isDevelopment
            ? 'A record with this data already exists'
            : 'This resource already exists',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'P2025':
      // Record not found
      res.status(404).json(
        createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          'Requested resource not found',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'P2003':
      // Foreign key constraint violation
      // ✅ Generic message - don't reveal database relationships
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          config.isDevelopment
            ? 'Invalid reference to related resource'
            : 'Invalid data provided',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'P2011':
    case 'P2012':
    case 'P2013':
    case 'P2014':
      // Null/required field violations
      // ✅ Generic message - don't reveal schema structure
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          config.isDevelopment
            ? 'Required field is missing'
            : 'Invalid data provided',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'P2015':
    case 'P2016':
    case 'P2017':
    case 'P2018':
    case 'P2019':
    case 'P2020':
    case 'P2021':
    case 'P2022':
      // Query-related errors
      // ✅ Generic message - don't reveal query structure
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request parameters',
          req.headers['x-request-id'] as string
        )
      );
      break;

    default:
      // ✅ Generic message for all other database errors
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.DATABASE_ERROR,
          config.isDevelopment
            ? 'Database operation failed'
            : 'An error occurred while processing your request',
          req.headers['x-request-id'] as string
        )
      );
  }
};

// ✅ SECURITY FIX: Handle Stripe errors with generic messages
const handleStripeError = (error: any, req: Request, res: Response): void => {
  // Log detailed error for debugging
  logger.error('Stripe payment error', {
    type: error.type,
    code: error.code,
    declineCode: config.isDevelopment ? error.decline_code : undefined,
    requestId: req.headers['x-request-id'],
    method: req.method,
    path: req.path,
    userId: (req as any).user?.id
  });

  switch (error.type) {
    case 'StripeCardError':
      // ✅ Show user-friendly message, hide technical details in production
      const cardErrorMessage = config.isDevelopment
        ? error.message || 'Payment failed'
        : 'Payment could not be processed. Please check your card details and try again.';

      res.status(400).json(
        createErrorResponse(
          ErrorCodes.PAYMENT_FAILED,
          cardErrorMessage,
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'StripeRateLimitError':
      res.status(429).json(
        createErrorResponse(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Too many payment requests. Please try again later.',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'StripeInvalidRequestError':
      // ✅ Generic message - don't reveal Stripe API details
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          config.isDevelopment
            ? 'Invalid payment request'
            : 'Payment information is invalid',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'StripeAPIError':
    case 'StripeConnectionError':
    case 'StripeAuthenticationError':
    default:
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.PAYMENT_FAILED,
          'Payment processing is temporarily unavailable. Please try again later.',
          req.headers['x-request-id'] as string
        )
      );
  }
};

// ✅ SECURITY FIX: 404 handler with generic message
export const notFoundHandler = (req: Request, res: Response): void => {
  // Log 404 for monitoring
  logger.warn('404 Not Found', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id
  });

  // ✅ Generic message in production - don't reveal route structure
  const message = config.isDevelopment
    ? `Route ${req.method} ${req.originalUrl} not found`
    : 'The requested resource was not found';

  res.status(404).json(
    createErrorResponse(
      ErrorCodes.RESOURCE_NOT_FOUND,
      message,
      req.headers['x-request-id'] as string
    )
  );
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};