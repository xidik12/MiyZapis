import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';
import { logger } from '@/utils/logger';

// Maximum content length in bytes (10MB by default)
const DEFAULT_MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10MB

// Stricter limits for specific content types
const CONTENT_TYPE_LIMITS: Record<string, number> = {
  'application/json': 1 * 1024 * 1024,      // 1MB for JSON
  'application/x-www-form-urlencoded': 512 * 1024, // 512KB for form data
  'text/plain': 512 * 1024,                 // 512KB for text
  'text/html': 512 * 1024,                  // 512KB for HTML
  'multipart/form-data': 50 * 1024 * 1024,  // 50MB for file uploads
};

// ✅ SECURITY FIX: Content-Length validation middleware
export const validateContentLength = (options?: {
  maxLength?: number;
  customLimits?: Record<string, number>;
}) => {
  const maxLength = options?.maxLength || DEFAULT_MAX_CONTENT_LENGTH;
  const customLimits = { ...CONTENT_TYPE_LIMITS, ...(options?.customLimits || {}) };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Only validate for methods that typically have a body
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];
    if (!methodsWithBody.includes(req.method)) {
      next();
      return;
    }

    // Get Content-Length header
    const contentLength = req.headers['content-length'];

    // Require Content-Length for methods with body
    if (!contentLength) {
      logger.warn('Missing Content-Length header', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: (req as any).user?.id
      });

      res.status(411).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Content-Length header is required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    // Parse Content-Length as integer
    const length = parseInt(contentLength, 10);

    // Validate Content-Length is a valid number
    if (isNaN(length) || length < 0) {
      logger.warn('Invalid Content-Length header', {
        method: req.method,
        path: req.path,
        contentLength,
        ip: req.ip,
        userId: (req as any).user?.id
      });

      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid Content-Length header',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    // Get content type specific limit
    const contentType = req.headers['content-type']?.split(';')[0]?.trim() || '';
    const limit = customLimits[contentType] || maxLength;

    // Check if Content-Length exceeds the limit
    if (length > limit) {
      logger.warn('Content-Length exceeds maximum allowed size', {
        method: req.method,
        path: req.path,
        contentLength: length,
        maxAllowed: limit,
        contentType,
        ip: req.ip,
        userId: (req as any).user?.id
      });

      res.status(413).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          `Request payload too large. Maximum allowed: ${formatBytes(limit)}`,
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    // Validate that Content-Length is reasonable (not zero for methods expecting body)
    if (length === 0 && methodsWithBody.includes(req.method)) {
      logger.warn('Zero Content-Length for method expecting body', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: (req as any).user?.id
      });

      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Request body cannot be empty',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    // Log large payloads for monitoring
    if (length > 5 * 1024 * 1024) { // Log payloads > 5MB
      logger.info('Large payload detected', {
        method: req.method,
        path: req.path,
        contentLength: length,
        contentType,
        ip: req.ip,
        userId: (req as any).user?.id
      });
    }

    next();
  };
};

// Helper function to format bytes
const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Export content type limits for testing/configuration
export { CONTENT_TYPE_LIMITS, DEFAULT_MAX_CONTENT_LENGTH };
