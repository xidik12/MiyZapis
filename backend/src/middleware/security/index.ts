import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { redis } from '@/config/redis';
import { RateLimitConfigs, ErrorCodes } from '@/types';
import { createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import DOMPurify from 'isomorphic-dompurify';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "'unsafe-eval'", // Allow eval for Stripe and Google OAuth
        "https://accounts.google.com", 
        "https://apis.google.com",
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
  crossOriginOpenerPolicy: false, // Disable for OAuth popups
  crossOriginResourcePolicy: false, // Disable to allow cross-origin resources
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

// ✅ SECURITY FIX: File upload rate limiter
export const uploadRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 uploads per 15 minutes per user
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id;
    return userId ? `upload:${userId}` : `upload:${req.ip}`;
  },
  skipSuccessfulRequests: false, // Count all upload attempts
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
      // New Panhaha frontend domains
      'https://panhaha-website-production.up.railway.app',
      'https://panhaha.com',
      'https://www.panhaha.com',
      // Add Google OAuth domain for OAuth flows
      'https://accounts.google.com',
      'https://oauth2.googleapis.com',
      ...config.security.corsOrigin
    ];

    const normalizedOrigin = origin?.toLowerCase();
    const isPanhahaSubdomain =
      normalizedOrigin?.startsWith('https://') &&
      (normalizedOrigin === 'https://panhaha.com' ||
        normalizedOrigin === 'https://www.panhaha.com' ||
        normalizedOrigin.endsWith('.panhaha.com'));

    if (allowedOrigins.includes(origin) || isPanhahaSubdomain) {
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
    'X-CSRF-Token', // Allow CSRF token header
    'X-XSRF-Token', // Allow alternative CSRF token header
    'x-platform', // Allow x-platform header for frontend platform identification
    'x-client-version', // Allow x-client-version header for client version tracking
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204, // Set proper OPTIONS response status
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }

  next();
};

// Fields that should allow limited HTML (like descriptions, bio, etc.)
const HTML_ALLOWED_FIELDS = [
  'description',
  'bio',
  'about',
  'content',
  'message',
  'notes',
  'details'
];

// Sanitize a single string value
const sanitizeString = (value: string, fieldName: string = ''): string => {
  // Check if this field allows HTML
  const allowHtml = HTML_ALLOWED_FIELDS.some(field =>
    fieldName.toLowerCase().includes(field.toLowerCase())
  );

  if (allowHtml) {
    // ✅ SECURITY FIX: Use DOMPurify for HTML content with limited tags
    return DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });
  } else {
    // ✅ SECURITY FIX: For non-HTML fields, strip all tags and encode special chars
    // First pass: Remove all HTML tags
    let sanitized = value.replace(/<[^>]*>/g, '');

    // Second pass: Use DOMPurify to clean any remaining dangerous content
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });

    // Third pass: Additional encoding for extra safety
    sanitized = sanitized
      .replace(/&(?!#?\w+;)/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized;
  }
};

// Recursive object sanitization with DOMPurify
const sanitizeObject = (obj: any, parentKey: string = ''): void => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;

      if (typeof obj[key] === 'string') {
        // ✅ SECURITY FIX: Enhanced sanitization with DOMPurify
        obj[key] = sanitizeString(obj[key], fullKey);
      } else if (Array.isArray(obj[key])) {
        // Sanitize arrays
        obj[key] = obj[key].map((item: any, index: number) => {
          if (typeof item === 'string') {
            return sanitizeString(item, `${fullKey}[${index}]`);
          } else if (typeof item === 'object' && item !== null) {
            sanitizeObject(item, `${fullKey}[${index}]`);
            return item;
          }
          return item;
        });
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively sanitize nested objects
        sanitizeObject(obj[key], fullKey);
      }
    }
  }
};

// Trust proxy middleware for production
export const trustProxy = (req: Request, res: Response, next: NextFunction): void => {
  if (config.isProduction) {
    // Trust first proxy (load balancer)
    req.app.set('trust proxy', 1);
  }
  next();
};

// Export CSRF protection
export { generateCSRFToken, validateCSRFToken, getCSRFToken } from './csrf';

// Export Content-Length validation
export { validateContentLength, CONTENT_TYPE_LIMITS, DEFAULT_MAX_CONTENT_LENGTH } from './content-length';
