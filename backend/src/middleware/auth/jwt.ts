import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { prisma } from '@/config/database';
import { AuthenticatedRequest, JwtPayload, ErrorCodes } from '@/types';
import { logger } from '@/utils/logger';
import { createErrorResponse } from '@/utils/response';

// In-memory user cache with 30s TTL to avoid DB hit on every request
const USER_CACHE_TTL = 30_000;
const userCache = new Map<string, { data: any; expiresAt: number }>();

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  userType: true,
  isActive: true,
  avatar: true,
  loyaltyPoints: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function getCachedUser(userId: string) {
  const now = Date.now();
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (user) {
    userCache.set(userId, { data: user, expiresAt: now + USER_CACHE_TTL });
  } else {
    userCache.delete(userId);
  }
  return user;
}

// Invalidate cache entry (call on user update/deactivation)
export function invalidateUserCache(userId: string) {
  userCache.delete(userId);
}

// Periodic cleanup of expired entries (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of userCache) {
    if (val.expiresAt <= now) userCache.delete(key);
  }
}, 300_000);

// Verify JWT token and attach user to request
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'Access token is required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Fetch user (cached for 30s)
    const user = await getCachedUser(decoded.userId);

    if (!user) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'User not found',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    if (!user.isActive) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.ACCESS_DENIED,
          'Account is deactivated',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    // Attach user to request
    req.user = user as any;
    req.userId = user.id;

    next();
  } catch (error) {
    logger.error('JWT authentication error:', error);

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.TOKEN_EXPIRED,
          'Access token has expired',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'Invalid access token',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Authentication failed',
        req.headers['x-request-id'] as string
      )
    );
  }
};

// Optional authentication - don't fail if no token
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      next();
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Fetch user (cached for 30s)
    const user = await getCachedUser(decoded.userId);

    if (user && user.isActive) {
      req.user = user as any;
      req.userId = user.id;
    }

    next();
  } catch (error) {
    // For optional auth, continue even if token is invalid
    logger.warn('Optional auth failed:', error);
    next();
  }
};

// Require specific user types
export const requireUserType = (...userTypes: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'Authentication required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    if (!userTypes.includes(req.user.userType)) {
      res.status(403).json(
        createErrorResponse(
          ErrorCodes.INSUFFICIENT_PERMISSIONS,
          `Access denied. Required user type: ${userTypes.join(' or ')}`,
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    next();
  };
};

// Require specialist access
export const requireSpecialist = requireUserType('SPECIALIST');

// Require customer access
export const requireCustomer = requireUserType('CUSTOMER');

// Require admin access
export const requireAdmin = requireUserType('ADMIN');

// Resource ownership middleware
export const requireOwnership = (resourceIdParam: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            `Resource ID parameter '${resourceIdParam}' is required`,
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check resource ownership based on resource type
      let hasAccess = false;

      // For bookings
      if (resourceIdParam === 'bookingId') {
        const booking = await prisma.booking.findUnique({
          where: { id: resourceId },
          select: { customerId: true, specialistId: true },
        });

        if (booking) {
          hasAccess = 
            booking.customerId === req.user.id || 
            booking.specialistId === req.user.id ||
            req.user.userType === 'ADMIN';
        }
      }

      // For services
      if (resourceIdParam === 'serviceId') {
        const service = await prisma.service.findUnique({
          where: { id: resourceId },
          include: { specialist: { select: { userId: true } } },
        });

        if (service) {
          hasAccess = 
            service.specialist.userId === req.user.id ||
            req.user.userType === 'ADMIN';
        }
      }

      // For reviews
      if (resourceIdParam === 'reviewId') {
        const review = await prisma.review.findUnique({
          where: { id: resourceId },
          select: { customerId: true, specialistId: true },
        });

        if (review) {
          hasAccess = 
            review.customerId === req.user.id ||
            review.specialistId === req.user.id ||
            req.user.userType === 'ADMIN';
        }
      }

      if (!hasAccess) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to access this resource',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to verify resource ownership',
          req.headers['x-request-id'] as string
        )
      );
    }
  };
};

// Optional authentication - doesn't fail if no token provided
export const authenticateTokenOptional = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      next();
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Fetch user (cached for 30s)
    const user = await getCachedUser(decoded.userId);

    if (!user || !user.isActive) {
      // Invalid user, continue without authentication
      req.user = null;
      next();
      return;
    }

    req.user = user as any; // Type assertion for compatibility
    next();
  } catch (error) {
    // Token invalid or expired, continue without authentication
    logger.warn('Optional authentication failed:', error);
    req.user = null;
    next();
  }
};