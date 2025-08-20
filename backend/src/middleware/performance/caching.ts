import { Request, Response, NextFunction } from 'express';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  varyBy?: string[]; // Headers to vary cache by (e.g., ['authorization', 'accept-language'])
  tags?: string[]; // Cache tags for invalidation
  skipCache?: boolean; // Skip cache for this request
}

// Default cache configurations for different types of data
export const cacheConfigs = {
  // Static/rarely changing data - long cache
  static: {
    ttl: 24 * 60 * 60, // 24 hours
    keyPrefix: 'static'
  },
  
  // User-specific data - medium cache
  user: {
    ttl: 15 * 60, // 15 minutes
    keyPrefix: 'user',
    varyBy: ['authorization']
  },
  
  // Frequently changing data - short cache
  dynamic: {
    ttl: 5 * 60, // 5 minutes
    keyPrefix: 'dynamic'
  },
  
  // Search results - short cache
  search: {
    ttl: 10 * 60, // 10 minutes
    keyPrefix: 'search'
  },
  
  // Public data - medium cache
  public: {
    ttl: 30 * 60, // 30 minutes
    keyPrefix: 'public'
  }
};

/**
 * Cache middleware factory
 */
export function createCacheMiddleware(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix = 'api',
    varyBy = [],
    tags = [],
    skipCache = false
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or if explicitly disabled
    if (req.method !== 'GET' || skipCache) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = generateCacheKey(req, keyPrefix, varyBy);
      
      // Try to get from cache
      const cachedData = await getFromCache(cacheKey);
      
      if (cachedData) {
        logger.debug('Cache hit', { cacheKey, url: req.url });
        
        // Set cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        return res.json(cachedData);
      }

      // Cache miss - continue to route handler
      logger.debug('Cache miss', { cacheKey, url: req.url });
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, ttl, tags).catch(err => {
            logger.error('Failed to cache response:', err);
          });
        }
        
        return originalJson(data);
      };

      next();

    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without cache on error
      next();
    }
  };
}

/**
 * Generate cache key based on request
 */
function generateCacheKey(req: Request, prefix: string, varyBy: string[]): string {
  const parts = [prefix];
  
  // Add URL path and query
  parts.push(req.path);
  
  if (Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    parts.push(sortedQuery);
  }

  // Add varying headers
  for (const header of varyBy) {
    const value = req.get(header);
    if (value) {
      // For auth headers, hash them to avoid storing sensitive data in keys
      if (header.toLowerCase() === 'authorization') {
        parts.push(`auth:${crypto.createHash('md5').update(value).digest('hex').substring(0, 8)}`);
      } else {
        parts.push(`${header}:${value}`);
      }
    }
  }

  return parts.join(':').replace(/[^a-zA-Z0-9:_-]/g, '_');
}

/**
 * Get data from cache
 */
async function getFromCache(key: string): Promise<any | null> {
  try {
    const cached = await redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set data in cache
 */
async function setCache(key: string, data: any, ttl: number, tags: string[] = []): Promise<void> {
  try {
    const serialized = JSON.stringify(data);
    
    // Set the main cache entry
    if (ttl > 0) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }

    // Add to tag sets for invalidation
    if (tags.length > 0) {
      const pipeline = redis.pipeline();
      
      for (const tag of tags) {
        pipeline.sadd(`tag:${tag}`, key);
        if (ttl > 0) {
          pipeline.expire(`tag:${tag}`, ttl + 300); // Tags live slightly longer
        }
      }
      
      await pipeline.exec();
    }

    logger.debug('Data cached successfully', { key, ttl, tags });

  } catch (error) {
    logger.error('Cache set error:', error);
    throw error;
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`Invalidated ${keys.length} cache entries`, { pattern });
    }

  } catch (error) {
    logger.error('Cache pattern invalidation error:', error);
    throw error;
  }
}

/**
 * Invalidate cache by tags
 */
export async function invalidateCacheByTags(tags: string[]): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    const keysToDelete: string[] = [];

    // Get all keys for each tag
    for (const tag of tags) {
      const keys = await redis.smembers(`tag:${tag}`);
      keysToDelete.push(...keys);
      
      // Remove the tag set
      pipeline.del(`tag:${tag}`);
    }

    // Remove duplicate keys
    const uniqueKeys = [...new Set(keysToDelete)];
    
    if (uniqueKeys.length > 0) {
      pipeline.del(...uniqueKeys);
    }

    await pipeline.exec();
    
    logger.info(`Invalidated cache for tags`, { tags, keysCount: uniqueKeys.length });

  } catch (error) {
    logger.error('Cache tag invalidation error:', error);
    throw error;
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    await redis.flushdb();
    logger.info('All cache cleared');
  } catch (error) {
    logger.error('Cache clear all error:', error);
    throw error;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  info: any;
  keyCount: number;
  memoryUsage: any;
}> {
  try {
    const [info, keyCount] = await Promise.all([
      redis.info('memory'),
      redis.dbsize()
    ]);

    return {
      info: parseRedisInfo(info),
      keyCount,
      memoryUsage: {
        used: parseRedisInfo(info).used_memory_human,
        peak: parseRedisInfo(info).used_memory_peak_human,
        rss: parseRedisInfo(info).used_memory_rss_human
      }
    };

  } catch (error) {
    logger.error('Cache stats error:', error);
    throw error;
  }
}

/**
 * Parse Redis INFO output
 */
function parseRedisInfo(info: string): Record<string, any> {
  const parsed: Record<string, any> = {};
  
  info.split('\r\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split(':');
      if (key && value !== undefined) {
        // Try to parse as number
        const numValue = Number(value);
        parsed[key] = isNaN(numValue) ? value : numValue;
      }
    }
  });

  return parsed;
}

/**
 * Middleware to vary cache by user
 */
export const cacheByUser = createCacheMiddleware({
  ...cacheConfigs.user,
  varyBy: ['authorization']
});

/**
 * Middleware to cache public data
 */
export const cachePublic = createCacheMiddleware(cacheConfigs.public);

/**
 * Middleware to cache search results
 */
export const cacheSearch = createCacheMiddleware(cacheConfigs.search);

/**
 * Middleware to cache static data
 */
export const cacheStatic = createCacheMiddleware(cacheConfigs.static);

/**
 * Wrapper for caching function results
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    ttl?: number;
    keyGenerator?: (...args: Parameters<T>) => string;
    tags?: string[];
  } = {}
): T {
  const {
    ttl = 300,
    keyGenerator = (...args) => `memoize:${fn.name}:${crypto.createHash('md5').update(JSON.stringify(args)).digest('hex')}`,
    tags = []
  } = options;

  return (async (...args: Parameters<T>) => {
    const cacheKey = keyGenerator(...args);

    try {
      // Try cache first
      const cached = await getFromCache(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Execute function
      const result = await fn(...args);

      // Cache result
      await setCache(cacheKey, result, ttl, tags);

      return result;

    } catch (error) {
      logger.error('Memoization error:', error);
      // Fall back to direct function call
      return fn(...args);
    }
  }) as T;
}

/**
 * Cache warm-up utilities
 */
export class CacheWarmer {
  private static tasks: Array<{
    name: string;
    handler: () => Promise<void>;
    interval?: number;
  }> = [];

  static addTask(name: string, handler: () => Promise<void>, interval?: number) {
    this.tasks.push({ name, handler, interval });
  }

  static async warmUp() {
    logger.info('Starting cache warm-up...');

    for (const task of this.tasks) {
      try {
        await task.handler();
        logger.info(`Cache warm-up completed for ${task.name}`);

        // Schedule recurring warm-up if interval specified
        if (task.interval) {
          setInterval(async () => {
            try {
              await task.handler();
              logger.debug(`Recurring cache warm-up completed for ${task.name}`);
            } catch (error) {
              logger.error(`Recurring cache warm-up failed for ${task.name}:`, error);
            }
          }, task.interval);
        }

      } catch (error) {
        logger.error(`Cache warm-up failed for ${task.name}:`, error);
      }
    }

    logger.info('Cache warm-up completed');
  }
}

// Add common cache warm-up tasks
CacheWarmer.addTask('popular-services', async () => {
  // Warm up popular services cache
  const { ServiceService } = await import('@/services/service');
  await ServiceService.getPopularServices(20);
}, 30 * 60 * 1000); // Every 30 minutes

CacheWarmer.addTask('service-categories', async () => {
  // Warm up categories cache
  const { ServiceService } = await import('@/services/service');
  await ServiceService.getCategories();
}, 60 * 60 * 1000); // Every hour