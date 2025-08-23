import Redis from 'ioredis';
import { config } from './index';
import { logger } from '@/utils/logger';

// Create Redis client only if URL is provided and Redis is not explicitly disabled
let redis: Redis | null = null;

// Redis is enabled by default, can be disabled with REDIS_DISABLED=true
const isRedisDisabled = process.env.REDIS_DISABLED === 'true' || !config.redis.url || config.redis.url === '' || config.redis.url === 'disabled';

logger.info('🔍 Redis Configuration Check:', {
  redisUrlProvided: !!config.redis.url,
  redisUrlLength: config.redis.url?.length || 0,
  redisDisabled: isRedisDisabled,
  redisDisabledEnv: process.env.REDIS_DISABLED,
  environment: process.env.NODE_ENV || 'unknown'
});

if (!isRedisDisabled && config.redis.url) {
  try {
    redis = new Redis(config.redis.url, {
      // Connection settings optimized for Railway
      connectTimeout: 10000, // 10 seconds for Railway's network
      commandTimeout: 5000, // 5 seconds for commands
      lazyConnect: true, // Connect when first command is issued
      enableReadyCheck: true,
      
      // Retry and reconnection settings
      maxRetriesPerRequest: 3, // Allow retries for reliability
      retryDelayOnFailover: 1000, // 1 second delay
      retryDelayOnClusterDown: 1000, // 1 second delay
      
      // Connection metadata
      connectionName: 'booking-platform-api',
      family: 4, // Force IPv4
      keepAlive: 30000, // 30 seconds keepalive
      
      // Smart reconnection logic
      reconnectOnError: (err: any) => {
        logger.warn('Redis error, checking if should reconnect:', {
          error: err?.message || 'Unknown error',
          code: err?.code || 'UNKNOWN'
        });
        
        // Reconnect on network errors but not on auth errors
        const errorMessage = err?.message || '';
        if (errorMessage.includes('READONLY') || 
            errorMessage.includes('NOAUTH') || 
            errorMessage.includes('WRONGPASS')) {
          return false; // Don't reconnect on auth issues
        }
        
        // Reconnect on connection issues
        return errorMessage.includes('ETIMEDOUT') || 
               errorMessage.includes('ECONNREFUSED') ||
               errorMessage.includes('ENOTFOUND');
      },
      
      // Additional Railway-specific settings
      ...(config.redis.password && { password: config.redis.password }),
    });
    
    const maskedUrl = config.redis.url?.replace(/\/\/.*@/, '//***:***@') || 'undefined';
    logger.info('✅ Redis client initialized successfully', {
      maskedUrl,
      connectTimeout: 10000, // Match actual config value
      commandTimeout: 5000,  // Match actual config value
      maxRetries: 3          // Match actual config value
    });
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    redis = null;
  }
} else {
  logger.info('⚠️ Redis disabled', {
    reason: !config.redis.url ? 'No Redis URL provided' : 
           config.redis.url === 'disabled' ? 'Explicitly disabled' :
           process.env.REDIS_DISABLED === 'true' ? 'Environment variable REDIS_DISABLED=true' :
           'Unknown reason',
    redisUrl: config.redis.url || 'undefined'
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

  redis.on('error', (error: any) => {
    logger.warn('⚠️ Redis connection error (continuing without cache)', {
      error: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
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
    logger.info('🔍 Testing Redis connection with ping...');
    
    // Use a promise with reasonable timeout
    const testPromise = Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Redis ping timeout after 8 seconds')), 8000)
      )
    ]);
    
    const result = await testPromise;
    if (result === 'PONG') {
      logger.info('✅ Redis ping successful');
      
      // Test basic operations with timeout
      logger.info('🔍 Testing Redis read/write operations...');
      const testKey = 'test:connection:' + Date.now();
      const opsPromise = Promise.race([
        (async () => {
          await redis!.set(testKey, 'test-value', 'EX', 30);
          const testValue = await redis!.get(testKey);
          await redis!.del(testKey);
          return testValue;
        })(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Redis operations timeout after 5 seconds')), 5000)
        )
      ]);
      
      const testValue = await opsPromise;
      if (testValue === 'test-value') {
        logger.info('✅ Redis read/write operations successful');
        return true;
      } else {
        logger.warn('⚠️ Redis ping successful but read/write operations failed', {
          expectedValue: 'test-value',
          actualValue: testValue
        });
        return false;
      }
    }
    return false;
  } catch (error: any) {
    logger.error('❌ Redis connection test failed', {
      error: error?.message || 'Unknown error',
      errorType: error?.constructor?.name || 'Unknown',
      willContinueWithoutRedis: true
    });
    
    // Don't disconnect Redis here - let it retry in background
    // Just return false to indicate Redis is not ready yet
    return false;
  }
};

// Graceful shutdown
export const closeRedisConnection = async (): Promise<void> => {
  if (!redis) return;
  
  try {
    await redis.quit();
    logger.info('Redis connection closed');
  } catch (error: any) {
    logger.warn('Error closing Redis connection (non-fatal):', {
      error: error?.message || 'Unknown error',
      errorType: error?.constructor?.name || 'Unknown'
    });
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