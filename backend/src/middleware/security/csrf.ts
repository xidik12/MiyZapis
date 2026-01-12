import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '@/config';
import { redis } from '@/config/redis';
import { createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';
import { logger } from '@/utils/logger';

// CSRF token storage (Redis when available, in-memory fallback)
class CSRFTokenStore {
  private memoryStore: Map<string, { token: string; expiresAt: number }> = new Map();
  private readonly tokenExpiry = 3600; // 1 hour in seconds

  async generateToken(sessionId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (this.tokenExpiry * 1000);

    const key = `csrf:${sessionId}`;

    if (redis) {
      try {
        await redis.setex(key, this.tokenExpiry, token);
      } catch (error) {
        logger.error('Redis CSRF token storage error:', error);
        // Fall back to memory store
        this.memoryStore.set(key, { token, expiresAt });
      }
    } else {
      this.memoryStore.set(key, { token, expiresAt });
    }

    return token;
  }

  async validateToken(sessionId: string, token: string): Promise<boolean> {
    const key = `csrf:${sessionId}`;

    if (redis) {
      try {
        const storedToken = await redis.get(key);
        return storedToken === token;
      } catch (error) {
        logger.error('Redis CSRF token validation error:', error);
        // Fall back to memory store
      }
    }

    // Memory store validation
    const entry = this.memoryStore.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return false;
    }

    return entry.token === token;
  }

  async deleteToken(sessionId: string): Promise<void> {
    const key = `csrf:${sessionId}`;

    if (redis) {
      try {
        await redis.del(key);
      } catch (error) {
        logger.error('Redis CSRF token deletion error:', error);
      }
    }

    this.memoryStore.delete(key);
  }

  // Cleanup expired tokens from memory store
  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryStore.entries()) {
      if (now > value.expiresAt) {
        this.memoryStore.delete(key);
      }
    }
  }
}

const csrfStore = new CSRFTokenStore();

// Cleanup expired tokens every 10 minutes
setInterval(() => {
  csrfStore.cleanupExpiredTokens();
}, 10 * 60 * 1000);

// Generate session ID for CSRF tokens
const getSessionId = (req: Request): string => {
  // Use user ID if authenticated, otherwise use IP + User-Agent
  const userId = (req as any).user?.id;

  if (userId) {
    return `user:${userId}`;
  }

  // For unauthenticated users, use IP + User-Agent hash
  const userAgent = req.get('User-Agent') || 'unknown';
  const ip = req.ip || 'unknown';
  const sessionData = `${ip}:${userAgent}`;

  return crypto
    .createHash('sha256')
    .update(sessionData)
    .digest('hex')
    .substring(0, 32);
};

// Middleware to generate and attach CSRF token
export const generateCSRFToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = getSessionId(req);
    const token = await csrfStore.generateToken(sessionId);

    // Attach token to response locals for use in views
    res.locals.csrfToken = token;

    next();
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    next(error);
  }
};

// Middleware to validate CSRF token
export const validateCSRFToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip CSRF validation for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      next();
      return;
    }

    // Get token from header or body
    const token =
      req.headers['x-csrf-token'] as string ||
      req.headers['x-xsrf-token'] as string ||
      req.body?._csrf;

    if (!token) {
      logger.warn('CSRF token missing', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: (req as any).user?.id
      });

      res.status(403).json(
        createErrorResponse(
          ErrorCodes.ACCESS_DENIED,
          'CSRF token is required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    const sessionId = getSessionId(req);
    const isValid = await csrfStore.validateToken(sessionId, token);

    if (!isValid) {
      logger.warn('Invalid CSRF token', {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: (req as any).user?.id
      });

      res.status(403).json(
        createErrorResponse(
          ErrorCodes.ACCESS_DENIED,
          'Invalid CSRF token',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    next();
  } catch (error) {
    logger.error('CSRF token validation error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'CSRF validation failed',
        req.headers['x-request-id'] as string
      )
    );
  }
};

// Endpoint to get CSRF token
export const getCSRFToken = (req: Request, res: Response): void => {
  const token = res.locals.csrfToken;

  res.json({
    success: true,
    data: {
      csrfToken: token
    }
  });
};

// Export the store for testing purposes
export { csrfStore };
