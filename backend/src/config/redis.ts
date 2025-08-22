import Redis from 'ioredis';
import { config } from './index';
import { logger } from '@/utils/logger';

// Create Redis client only if URL is provided and Redis is not explicitly disabled
let redis: Redis | null = null;

// Force disable Redis in production until connection issues are resolved
const forceDisableRedis = process.env.NODE_ENV === 'production' && process.env.FORCE_ENABLE_REDIS !== 'true';
const isRedisDisabled = forceDisableRedis || process.env.REDIS_DISABLED === 'true' || !config.redis.url || config.redis.url === '' || config.redis.url === 'disabled';

logger.info('🔍 Redis Configuration Check:', {
  redisUrlProvided: !!config.redis.url,
  redisUrlLength: config.redis.url?.length || 0,
  redisDisabled: isRedisDisabled,
  forceDisableRedis: forceDisableRedis,
  redisDisabledEnv: process.env.REDIS_DISABLED,
  forceEnableRedis: process.env.FORCE_ENABLE_REDIS,
  environment: process.env.NODE_ENV || 'unknown'
});

if (!isRedisDisabled && config.redis.url) {
  try {
    redis = new Redis(config.redis.url, {
      password: config.redis.password,
      maxRetriesPerRequest: 1, // Minimal retries to prevent blocking
      connectTimeout: 3000, // Short timeout to fail fast
      commandTimeout: 2000, // Very short command timeout
      enableReadyCheck: true,
      lazyConnect: true,
      connectionName: 'booking-platform-api',
      family: 4, // Force IPv4
      keepAlive: 10000, // Shorter keepalive
      // Disable automatic reconnection to prevent infinite loops
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 1,
      // Only retry on specific errors, not connection timeouts
      reconnectOnError: (err) => {
        // Don't reconnect on timeout errors to prevent infinite loops
        if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
          logger.warn('Redis connection failed permanently, disabling reconnection', {
            error: err.message,
            code: err.code
          });
          return false;
        }
        return err.message.includes('READONLY');
      },
      // Limit total reconnection attempts
      retryDelayOnClusterDown: 300,
      retryDelayOnFailover: 100,
    });
    
    const maskedUrl = config.redis.url?.replace(/\/\/.*@/, '//***:***@') || 'undefined';
    logger.info('✅ Redis client initialized successfully', {
      maskedUrl,
      connectTimeout: 5000,
      commandTimeout: 3000,
      maxRetries: 2
    });
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    redis = null;
  }
} else {
  logger.info('⚠️ Redis disabled', {
    reason: forceDisableRedis ? 'Force disabled in production' :
           !config.redis.url ? 'No Redis URL provided' : 
           config.redis.url === 'disabled' ? 'Explicitly disabled' :
           process.env.REDIS_DISABLED === 'true' ? 'Environment variable REDIS_DISABLED=true' :
           'Unknown reason',
    redisUrl: config.redis.url || 'undefined',
    forceDisabled: forceDisableRedis
  });
}

// Redis event handlers (only if Redis is enabled)
if (redis) {
  redis.on('connect', () => {
    logger.info('✅ Redis connection established', {
      status: 'connected',
      timestamp: new Date().toISOString()
    });
  });

  redis.on('ready', () => {
    logger.info('✅ Redis client ready for commands', {
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  redis.on('error', (error) => {
    logger.warn('⚠️ Redis connection error (continuing without cache)', {
      error: error.message,
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
  });

  redis.on('close', () => {
    logger.info('Redis connection closed', {
      status: 'closed',
      timestamp: new Date().toISOString()
    });
  });

  redis.on('reconnecting', (retryDelayTime) => {
    logger.info('Redis reconnecting...', {
      status: 'reconnecting',
      retryDelay: retryDelayTime,
      timestamp: new Date().toISOString()
    });
  });
}

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  if (!redis) {
    logger.info('Redis is disabled');
    return true; // Return true to indicate no error
  }
  
  try {
    // Use a promise with timeout to prevent blocking
    const testPromise = Promise.race([
      redis.ping(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis test timeout')), 2000)
      )
    ]);
    
    const result = await testPromise;
    if (result === 'PONG') {
      logger.info('✅ Redis connection successful');
      
      // Test basic operations with timeout
      const testKey = 'test:connection';
      const opsPromise = Promise.race([
        (async () => {
          await redis.set(testKey, 'test-value', 'EX', 10);
          const testValue = await redis.get(testKey);
          await redis.del(testKey);
          return testValue;
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis operations timeout')), 1000)
        )
      ]);
      
      const testValue = await opsPromise;
      if (testValue === 'test-value') {
        logger.info('✅ Redis read/write operations successful');
        return true;
      } else {
        logger.warn('⚠️ Redis ping successful but read/write operations failed');
        return false;
      }
    }
    return false;
  } catch (error) {
    logger.warn('⚠️ Redis connection test failed, continuing without Redis', {
      error: error.message,
      willDisableRedis: true
    });
    
    // Disconnect failed Redis connection to prevent infinite loops
    if (redis) {
      try {
        redis.disconnect();
        redis = null;
      } catch (disconnectError) {
        logger.warn('Failed to disconnect Redis, setting to null');
        redis = null;
      }
    }
    
    return true; // Return true to allow server to continue without Redis
  }
};

// Graceful shutdown
export const closeRedisConnection = async (): Promise<void> => {
  if (!redis) return;
  
  try {
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (error) {
    logger.warn('Error closing Redis connection (non-fatal):', error);
  }
};

// Cache utility functions
export const cacheUtils = {
  // Set cache with expiration
  set: async (key: string, value: unknown, ttlSeconds = 3600): Promise<void> => {
    if (!redis) {
      logger.warn(`Redis not available, cannot set cache key: ${key}`);
      return;
    }
    
    try {
      const serializedValue = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, serializedValue);
      logger.debug(`Cache set successfully: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
    }
  },

  // Get cache value
  get: async <T>(key: string): Promise<T | null> => {
    if (!redis) return null;
    
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) as T : null;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  },

  // Delete cache key
  del: async (key: string): Promise<void> => {
    if (!redis) return;
    
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
    }
  },

  // Delete multiple keys by pattern
  delPattern: async (pattern: string): Promise<void> => {
    if (!redis) return;
    
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Error deleting cache pattern ${pattern}:`, error);
    }
  },

  // Check if key exists
  exists: async (key: string): Promise<boolean> => {
    if (!redis) return false;
    
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking cache key ${key}:`, error);
      return false;
    }
  },

  // Set expiration on existing key
  expire: async (key: string, ttlSeconds: number): Promise<void> => {
    if (!redis) return;
    
    try {
      await redis.expire(key, ttlSeconds);
    } catch (error) {
      logger.error(`Error setting expiration on key ${key}:`, error);
    }
  },
};

export { redis };
export default redis;