import { PrismaClient } from '@prisma/client';
import { config } from './index';
import { logger } from '@/utils/logger';

// Extend the global namespace for Prisma in development
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Create Prisma client with proper configuration
const createPrismaClient = () => {
  logger.info('🔍 Database Configuration Check:', {
    databaseUrlProvided: !!config.database.url,
    databaseUrlLength: config.database.url?.length || 0,
    isDevelopment: config.isDevelopment,
    environment: process.env.NODE_ENV || 'unknown'
  });

  return new PrismaClient({
    datasources: {
      db: {
        url: config.database.url,
      },
    },
    log: config.isDevelopment 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: 'pretty',
  });
};

// Singleton pattern for Prisma client
const prisma = globalThis.__prisma ?? createPrismaClient();

if (config.isDevelopment) {
  globalThis.__prisma = prisma;
}

// Database connection event handlers
// Note: beforeExit is not supported in Prisma 5.0+, using process events instead
process.on('beforeExit', async () => {
  logger.info('Database connection closing...');
});

// Test database connection
export const testDatabaseConnection = async (): Promise<boolean> => {
  const startTime = Date.now();
  logger.info('🔍 Starting database connection test...', {
    timestamp: new Date().toISOString()
  });

  try {
    // Validate DATABASE_URL first
    const dbUrl = config.database.url;
    if (!dbUrl || dbUrl === '') {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    logger.info('🔗 Attempting database connection...', {
      databaseProvider: 'postgresql',
      connectionAttempt: 1,
      timestamp: new Date().toISOString()
    });
    
    await prisma.$connect();
    logger.info('✅ Prisma client connected successfully');

    logger.info('🔍 Testing database query...', {
      query: 'SELECT 1',
      timestamp: new Date().toISOString()
    });
    
    await prisma.$queryRaw`SELECT 1`;
    
    const duration = Date.now() - startTime;
    logger.info('✅ Database connection successful', {
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('❌ Database connection failed', {
      error: error.message,
      errorName: error.constructor.name,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
    // For development, continue without database
    if (config.isDevelopment) {
      logger.warn('Continuing in development mode without database');
      return true;
    }
    return false;
  }
};

// Graceful shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
};

export { prisma };
export default prisma;