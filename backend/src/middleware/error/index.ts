import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '@/utils/logger';
import { createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';

// Fields to redact from logged request bodies
const SENSITIVE_FIELDS = new Set([
  'password', 'newPassword', 'oldPassword', 'currentPassword', 'confirmPassword',
  'token', 'refreshToken', 'accessToken', 'authToken',
  'secret', 'apiKey', 'apiSecret',
  'creditCard', 'cardNumber', 'cvv', 'cvc', 'expiryDate',
  'bankDetails', 'accountNumber', 'routingNumber', 'iban', 'swiftCode',
  'ssn', 'socialSecurityNumber',
  'providerToken', 'stripeToken', 'paypalToken',
]);

// Redact sensitive fields from an object (shallow + nested)
const redactSensitiveFields = (obj: Record<string, unknown>): Record<string, unknown> => {
  if (!obj || typeof obj !== 'object') return obj;
  const redacted: Record<string, unknown> = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.has(key)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      redacted[key] = redactSensitiveFields(obj[key] as Record<string, unknown>);
    } else {
      redacted[key] = obj[key];
    }
  }
  return redacted;
};

// Redact authorization header
const redactHeaders = (headers: Record<string, unknown>): Record<string, unknown> => {
  if (!headers) return headers;
  const redacted = { ...headers };
  if (redacted.authorization) redacted.authorization = '[REDACTED]';
  if (redacted.cookie) redacted.cookie = '[REDACTED]';
  return redacted;
};

// Global error handler
export const errorHandler = (
  error: Error & { type?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Unhandled error:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: redactHeaders(req.headers as unknown as Record<string, unknown>),
      body: redactSensitiveFields(req.body as Record<string, unknown>),
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as Request & { user?: { id: string } }).user?.id,
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

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json(
      createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.message,
        req.headers['x-request-id'] as string
      )
    );
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json(
      createErrorResponse(
        ErrorCodes.AUTHENTICATION_REQUIRED,
        'Invalid token',
        req.headers['x-request-id'] as string
      )
    );
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json(
      createErrorResponse(
        ErrorCodes.TOKEN_EXPIRED,
        'Token has expired',
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

  // Default error response
  res.status(500).json(
    createErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
      req.headers['x-request-id'] as string
    )
  );
};

// Handle Prisma errors
const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response
): void => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      res.status(409).json(
        createErrorResponse(
          ErrorCodes.DUPLICATE_RESOURCE,
          'A record with this data already exists',
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
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid reference to related resource',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'P2011':
      // Null constraint violation
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Required field is missing',
          req.headers['x-request-id'] as string
        )
      );
      break;

    default:
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.DATABASE_ERROR,
          'Database operation failed',
          req.headers['x-request-id'] as string
        )
      );
  }
};

// Handle Stripe errors
const handleStripeError = (error: Error & { type?: string }, req: Request, res: Response): void => {
  switch (error.type) {
    case 'StripeCardError':
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.PAYMENT_FAILED,
          error.message || 'Payment failed',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'StripeRateLimitError':
      res.status(429).json(
        createErrorResponse(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Too many requests to payment processor',
          req.headers['x-request-id'] as string
        )
      );
      break;

    case 'StripeInvalidRequestError':
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid payment request',
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
          'Payment processing is temporarily unavailable',
          req.headers['x-request-id'] as string
        )
      );
  }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    createErrorResponse(
      ErrorCodes.RESOURCE_NOT_FOUND,
      `Route ${req.method} ${req.originalUrl} not found`,
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