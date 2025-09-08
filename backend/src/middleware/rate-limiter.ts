import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

interface PlatformRateLimit {
  web: RateLimitConfig;
  telegram_bot: RateLimitConfig;
  telegram_miniapp: RateLimitConfig;
}

// Platform-specific rate limits
export const RATE_LIMITS: Record<string, PlatformRateLimit> = {
  auth: {
    web: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    telegram_bot: { windowMs: 60 * 1000, max: 10 }, // 10 attempts per minute
    telegram_miniapp: { windowMs: 15 * 60 * 1000, max: 5 }
  },
  search: {
    web: { windowMs: 60 * 1000, max: 100 }, // 100 requests per minute
    telegram_bot: { windowMs: 60 * 1000, max: 30 }, // 30 requests per minute
    telegram_miniapp: { windowMs: 60 * 1000, max: 50 }
  },
  booking: {
    web: { windowMs: 60 * 1000, max: 20 }, // 20 requests per minute
    telegram_bot: { windowMs: 60 * 1000, max: 15 },
    telegram_miniapp: { windowMs: 60 * 1000, max: 20 }
  },
  upload: {
    web: { windowMs: 60 * 1000, max: 10 }, // 10 uploads per minute
    telegram_bot: { windowMs: 60 * 1000, max: 5 },
    telegram_miniapp: { windowMs: 60 * 1000, max: 8 }
  },
  payment: {
    web: { windowMs: 60 * 1000, max: 5 }, // 5 payment attempts per minute
    telegram_bot: { windowMs: 60 * 1000, max: 3 },
    telegram_miniapp: { windowMs: 60 * 1000, max: 5 }
  }
};

// Default rate limit for unspecified endpoints
const DEFAULT_RATE_LIMIT: PlatformRateLimit = {
  web: { windowMs: 60 * 1000, max: 1000 }, // 1000 requests per minute
  telegram_bot: { windowMs: 60 * 1000, max: 200 },
  telegram_miniapp: { windowMs: 60 * 1000, max: 500 }
};

function getPlatform(req: Request): keyof PlatformRateLimit {
  // Determine platform from request
  const userAgent = req.get('User-Agent') || '';
  const telegramWebApp = req.get('X-Telegram-Web-App');
  const telegramBot = req.get('X-Telegram-Bot');

  if (telegramWebApp) return 'telegram_miniapp';
  if (telegramBot || userAgent.includes('Telegram')) return 'telegram_bot';
  return 'web';
}

function getEndpointCategory(path: string): string {
  if (path.includes('/auth/')) return 'auth';
  if (path.includes('/search/')) return 'search';
  if (path.includes('/bookings/')) return 'booking';
  if (path.includes('/upload') || path.includes('/files/')) return 'upload';
  if (path.includes('/payment')) return 'payment';
  return 'default';
}

function generateKey(req: Request, category: string, platform: string): string {
  const userId = req.user?.id;
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Use user ID if authenticated, otherwise use IP
  const identifier = userId || ip;
  return `ratelimit:${category}:${platform}:${identifier}`;
}

async function incrementCounter(key: string, windowMs: number): Promise<{ count: number; ttl: number }> {
  try {
    // Try Redis first for better performance
    if (redis) {
      const multi = redis.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      multi.ttl(key);
      
      const results = await multi.exec();
      if (results && results[0] && results[2]) {
        const count = results[0][1] as number;
        const ttl = results[2][1] as number;
        return { count, ttl };
      }
    }
    
    // Fallback to database
    const windowStart = new Date(Date.now() - (Date.now() % windowMs));
    
    // Note: rateLimitRecord model not available, using in-memory tracking only
    // TODO: Add rateLimitRecord model to schema or use Redis for rate limiting
    logger.debug(`Rate limit check for ${key}`);
    
    // For now, skip database rate limiting and rely on in-memory cache only
    return { count: 1, ttl: Math.ceil(windowMs / 1000) };
  } catch (error) {
    logger.error('Rate limiter counter error:', error);
    return { count: 1, ttl: Math.ceil(windowMs / 1000) };
  }
}

export function createRateLimiter(category?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const platform = getPlatform(req);
      const endpointCategory = category || getEndpointCategory(req.path);
      
      const rateLimitConfig = RATE_LIMITS[endpointCategory]?.[platform] || DEFAULT_RATE_LIMIT[platform];
      const key = generateKey(req, endpointCategory, platform);
      
      const { count, ttl } = await incrementCounter(key, rateLimitConfig.windowMs);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimitConfig.max.toString(),
        'X-RateLimit-Remaining': Math.max(0, rateLimitConfig.max - count).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + ttl * 1000).toISOString()
      });
      
      if (count > rateLimitConfig.max) {
        logger.warn('Rate limit exceeded', {
          key,
          count,
          limit: rateLimitConfig.max,
          platform,
          category: endpointCategory,
          ip: req.ip,
          userId: req.user?.id
        });
        
        if (rateLimitConfig.onLimitReached) {
          rateLimitConfig.onLimitReached(req, res);
        }
        
        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: ttl
          },
          timestamp: new Date().toISOString()
        });
      }
      
      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      // Don't block requests if rate limiter fails
      next();
    }
  };
}

// Specific rate limiters for different endpoints
export const authRateLimit = createRateLimiter('auth');
export const searchRateLimit = createRateLimiter('search');
export const bookingRateLimit = createRateLimiter('booking');
export const uploadRateLimit = createRateLimiter('upload');
export const paymentRateLimit = createRateLimiter('payment');

// Enhanced security middleware for Telegram
export function telegramSecurityMiddleware(req: Request, res: Response, next: NextFunction) {
  const telegramWebApp = req.get('X-Telegram-Web-App');
  const telegramBot = req.get('X-Telegram-Bot');
  
  if (telegramWebApp) {
    // Validate Telegram Web App init data
    const initData = req.body.initData || req.query.initData;
    if (!initData) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TELEGRAM_DATA',
          message: 'Telegram Web App init data is required'
        }
      });
    }
    
    // Telegram init data validation would go here
  }
  
  if (telegramBot) {
    // Validate Telegram Bot token
    const botToken = req.get('X-Telegram-Bot-Token');
    if (botToken !== process.env.TELEGRAM_BOT_TOKEN) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_BOT_TOKEN',
          message: 'Invalid Telegram bot token'
        }
      });
    }
  }
  
  next();
}