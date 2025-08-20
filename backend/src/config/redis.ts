import Redis from 'ioredis';
import { config } from './index';
import { logger } from '@/utils/logger';

// Create Redis client only if URL is provided and Redis is not explicitly disabled
let redis: Redis | null = null;

const isRedisDisabled = process.env.REDIS_DISABLED === 'true' || !config.redis.url || config.redis.url === '' || config.redis.url === 'disabled';

if (!isRedisDisabled && config.redis.url) {
  try {
    redis = new Redis(config.redis.url, {
      password: config.redis.password,
      maxRetriesPerRequest: 3, // Allow more retries for better reliability
      connectTimeout: 10000, // Increase timeout for Railway Redis
      commandTimeout: 5000, // Increase command timeout
      enableReadyCheck: true, // Enable ready check for better connection handling
      lazyConnect: true,
      connectionName: 'booking-platform-api',
      // Add Redis-specific options for Railway
      family: 4, // Force IPv4
      keepAlive: 30000, // Keep alive timeout in milliseconds
      // Reconnect on connection loss
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      },
    });
    
    logger.info('Redis client initialized with URL:', config.redis.url?.replace(/\/\/.*@/, '//***:***@'));
  } catch (error) {
    logger.error('Failed to initialize Redis client:', error);
    redis = null;
  }
} else {
  logger.info('Redis disabled - no Redis URL provided or Redis explicitly disabled');
}

// Redis event handlers (only if Redis is enabled)
if (redis) {
  redis.on('connect', () => {
    logger.info('✅ Redis connection established');
  });

  redis.on('ready', () => {
    logger.info('Redis client ready for commands');
  });

  redis.on('error', (error) => {
    logger.warn('⚠️ Redis connection error (continuing without cache):', error);
  });

  redis.on('close', () => {
    logger.info('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });
}

// Test Redis connection
export const testRedisConnection = async (): Promise<boolean> => {
  if (!redis) {
    logger.info('Redis is disabled');
    return true; // Return true to indicate no error
  }
  
  try {
    // Test connection with ping
    const result = await redis.ping();
    if (result === 'PONG') {
      logger.info('✅ Redis connection successful');
      
      // Test basic operations
      const testKey = 'test:connection';
      await redis.set(testKey, 'test-value', 'EX', 10);
      const testValue = await redis.get(testKey);
      
      if (testValue === 'test-value') {
        logger.info('✅ Redis read/write operations successful');
        await redis.del(testKey); // Clean up
        return true;
      } else {
        logger.warn('⚠️ Redis ping successful but read/write operations failed');
        return false;
      }
    }
    return false;
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    return false;
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