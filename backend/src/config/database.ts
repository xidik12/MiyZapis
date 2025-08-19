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
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
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