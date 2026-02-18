import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { redis } from '@/config/redis';
import { RateLimitConfigs, ErrorCodes } from '@/types';
import { createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://*.google.com",
        "https://apis.google.com",
        "https://*.googleapis.com",
        "https://js.stripe.com",
        "https://checkout.stripe.com"
      ],
      imgSrc: ["'self'", "data:", "https:", "https://*.googleusercontent.com", "https://*.stripe.com"],
      fontSrc: ["'self'", "https:", "https://fonts.gstatic.com"],
      connectSrc: [
        "'self'", 
        "wss:", 
        "https:", 
        "https://accounts.google.com", 
        "https://oauth2.googleapis.com",
        "https://api.stripe.com",
        "https://checkout.stripe.com"
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", "https://accounts.google.com", "https://checkout.stripe.com"],
      frameAncestors: ["'none'"],
      frameSrc: [
        "https://accounts.google.com",
        "https://*.google.com",
        "https://js.stripe.com",
        "https://checkout.stripe.com",
        "https://hooks.stripe.com"
      ],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'sameorigin' }, // Allow same-origin framing for OAuth
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false, // Disable for third-party integrations
  crossOriginOpenerPolicy: { policy: 'unsafe-none' }, // Allow OAuth popups
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resources
});

// Rate limiter store (Redis when available, in-memory fallback)
class RateLimitStore {
  private prefix: string;
  private resetTime: number;
  private memoryStore: Map<string, { hits: number; resetTime: number }> = new Map();

  constructor(prefix = 'rl:', resetTime = 60) {
    this.prefix = prefix;
    this.resetTime = resetTime;
  }

  async increment(key: string): Promise<{ totalHits: number; timeToExpire?: number }> {
    const storeKey = `${this.prefix}${key}`;
    
    if (redis) {
      // Use Redis when available
      try {
        const current = await redis.get(storeKey);
        const totalHits = current ? parseInt(current, 10) + 1 : 1;
        
        if (totalHits === 1) {
          await redis.setex(storeKey, this.resetTime, '1');
        } else {
          await redis.set(storeKey, totalHits.toString());
        }

        const ttl = await redis.ttl(storeKey);
        
        return {
          totalHits,
          timeToExpire: ttl > 0 ? ttl * 1000 : undefined,
        };
      } catch (error) {
        logger.error('Redis rate limit error:', error);
        // Fall back to memory store on Redis error
      }
    }
    
    // Use in-memory store
    const now = Date.now();
    const entry = this.memoryStore.get(storeKey);
    
    if (!entry || now > entry.resetTime) {
      // New window or expired
      const resetTime = now + (this.resetTime * 1000);
      this.memoryStore.set(storeKey, { hits: 1, resetTime });
      return { totalHits: 1, timeToExpire: this.resetTime * 1000 };
    } else {
      // Increment existing
      entry.hits += 1;
      const timeToExpire = entry.resetTime - now;
      return { totalHits: entry.hits, timeToExpire: Math.max(0, timeToExpire) };
    }
  }

  async decrement(key: string): Promise<void> {
    const storeKey = `${this.prefix}${key}`;
    
    if (redis) {
      try {
        await redis.decr(storeKey);
        return;
      } catch (error) {
        logger.error('Redis rate limit decrement error:', error);
      }
    }
    
    // Memory store decrement
    const entry = this.memoryStore.get(storeKey);
    if (entry && entry.hits > 0) {
      entry.hits -= 1;
    }
  }

  async resetKey(key: string): Promise<void> {
    const storeKey = `${this.prefix}${key}`;
    
    if (redis) {
      try {
        await redis.del(storeKey);
        return;
      } catch (error) {
        logger.error('Redis rate limit reset error:', error);
      }
    }
    
    // Memory store reset
    this.memoryStore.delete(storeKey);
  }
}

// Create rate limiter with Redis store
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) => {
  const store = new RateLimitStore('rl:', Math.ceil(options.windowMs / 1000));

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    keyGenerator: options.keyGenerator || ((req: Request) => {
      return req.ip || 'anonymous';
    }),
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,
    store: {
      incr: async (key: string) => {
        const result = await store.increment(key);
        return result;
      },
      decrement: async (key: string) => {
        await store.decrement(key);
      },
      resetKey: async (key: string) => {
        await store.resetKey(key);
      },
    } as any,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        userId: (req as any).user?.id,
      });

      res.status(429).json(
        createErrorResponse(
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          'Too many requests, please try again later',
          req.headers['x-request-id'] as string
        )
      );
    },
  });
};

// Default rate limiter
export const defaultRateLimit = createRateLimiter(RateLimitConfigs.DEFAULT);

// Authentication rate limiter
export const authRateLimit = createRateLimiter({
  ...RateLimitConfigs.AUTH,
  keyGenerator: (req: Request) => {
    const email = req.body?.email;
    return email ? `auth:${email}` : `auth:${req.ip}`;
  },
});

// Booking rate limiter
export const bookingRateLimit = createRateLimiter({
  ...RateLimitConfigs.BOOKINGS,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `booking:${userId}` : `booking:${req.ip}`;
  },
});

// Payment rate limiter
export const paymentRateLimit = createRateLimiter({
  ...RateLimitConfigs.PAYMENTS,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `payment:${userId}` : `payment:${req.ip}`;
  },
});

// Search rate limiter
export const searchRateLimit = createRateLimiter({
  ...RateLimitConfigs.SEARCH,
  skipSuccessfulRequests: true,
});

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
                   req.headers['x-correlation-id'] as string ||
                   generateRequestId();
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Generate unique request ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173', 
      'https://miyzapis.com',
      'https://www.miyzapis.com',
      'https://miyzapis-frontend-production.up.railway.app',
      // Add Google OAuth domain for OAuth flows
      'https://accounts.google.com',
      'https://oauth2.googleapis.com',
      ...config.security.corsOrigin
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
    'x-platform', // Allow x-platform header for frontend platform identification
    'x-client-version', // Allow x-client-version header for client version tracking
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204, // Set proper OPTIONS response status
};

// Enhanced input sanitization middleware using sanitize-html
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObjectRecursive(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObjectRecursive(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObjectRecursive(req.params);
    }

    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    // Continue even if sanitization fails - better to process than block
    next();
  }
};

// Recursive object sanitization with comprehensive XSS prevention
const sanitizeObjectRecursive = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectRecursive(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key itself
        const cleanKey = sanitizeString(key);
        sanitized[cleanKey] = sanitizeObjectRecursive(obj[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

// Comprehensive string sanitization
const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;

  return str
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object/embed tags
    .replace(/<(object|embed|applet)[^>]*>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove dangerous attributes
    .replace(/\s*(onerror|onload|onclick|onmouseover|onfocus|onblur)\s*=/gi, '')
    // Remove eval and expression
    .replace(/eval\s*\(/gi, '')
    .replace(/expression\s*\(/gi, '')
    // Remove import statements
    .replace(/import\s+/gi, '')
    // Limit string length to prevent DoS
    .substring(0, 10000);
};

// Trust proxy middleware for production
export const trustProxy = (req: Request, res: Response, next: NextFunction): void => {
  if (config.isProduction) {
    // Trust first proxy (load balancer)
    req.app.set('trust proxy', 1);
  }
  next();
};