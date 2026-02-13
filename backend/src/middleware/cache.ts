import { Request, Response, NextFunction } from 'express';
import { cacheUtils } from '@/config/redis';
import { logger } from '@/utils/logger';

/**
 * Express middleware for Redis-based response caching.
 * Only caches GET requests that return 200.
 */
export function cacheMiddleware(ttlSeconds: number, keyPrefix?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${keyPrefix || 'api'}:${req.originalUrl}`;

    try {
      const cached = await cacheUtils.get<{ body: any; statusCode: number }>(key);
      if (cached) {
        logger.debug(`Cache hit: ${key}`);
        return res.status(cached.statusCode).json(cached.body);
      }
    } catch {
      // Cache miss or error - proceed normally
    }

    // Intercept res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200) {
        cacheUtils.set(key, { body, statusCode: 200 }, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}
