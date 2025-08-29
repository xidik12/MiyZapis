import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';

import { config } from '@/config';
import { testDatabaseConnection, closeDatabaseConnection } from '@/config/database';
import { testRedisConnection, closeRedisConnection } from '@/config/redis';
import { logger, requestLogger } from '@/utils/logger';

// Middleware imports
import { 
  securityHeaders, 
  corsOptions, 
  requestId, 
  sanitizeInput, 
  trustProxy
} from '@/middleware/security';
import { errorHandler, notFoundHandler } from '@/middleware/error';

// Routes
import apiRoutes from '@/routes';

// Telegram Bot
import { bot } from '@/bot';
import { enhancedTelegramBot } from '@/services/telegram/enhanced-bot';

// Create Express app
const app = express();

// Trust proxy in production
app.use(trustProxy);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(requestId);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));

// Input sanitization
app.use(sanitizeInput);

// Request logging
app.use(requestLogger);

// Railway environment detection (for debugging)
const railwayDetectionResults = {
  RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
  RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
  RAILWAY_PROJECT_NAME: process.env.RAILWAY_PROJECT_NAME,
  RAILWAY_SERVICE: process.env.RAILWAY_SERVICE,
  RAILWAY_PROJECT: process.env.RAILWAY_PROJECT,
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  VERCEL: process.env.VERCEL,
  NETLIFY: process.env.NETLIFY
};

const isRailway = !!(
  process.env.RAILWAY_ENVIRONMENT || 
  process.env.RAILWAY_SERVICE_NAME || 
  process.env.RAILWAY_PROJECT_NAME ||
  process.env.RAILWAY_SERVICE ||
  process.env.RAILWAY_PROJECT ||
  (process.env.PORT && process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY)
);

logger.info('🏗️ Railway environment detection results', {
  isDetectedAsRailway: isRailway,
  environmentVariables: railwayDetectionResults,
  cwd: process.cwd()
});

// Static file serving for uploads
// Force /tmp/uploads on Railway regardless of UPLOAD_DIR env var
const uploadsDir = isRailway ? '/tmp/uploads' : (process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
app.use('/uploads', express.static(uploadsDir, {
  maxAge: '1y', // Cache uploaded files for 1 year
  etag: true,
  lastModified: true
}));

logger.info('Static file serving configured', { 
  uploadsDir,
  route: '/uploads',
  isRailwayEnvironment: isRailway
});


// API routes
app.use(`/api/${config.apiVersion}`, apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Booking Platform API',
    version: config.apiVersion,
    environment: config.env,
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: config.websocket.corsOrigin,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket.IO middleware and handlers
io.use((socket, next) => {
  next();
});

io.on('connection', (socket) => {
  logger.info('Client connected to WebSocket', { socketId: socket.id });

  socket.on('disconnect', (reason) => {
    logger.info('Client disconnected from WebSocket', { 
      socketId: socket.id, 
      reason 
    });
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Stop Telegram bots
      if (bot && bot.botInfo) {
        try {
          await bot.stop('SIGTERM');
          logger.info('🤖 Basic Telegram bot stopped');
        } catch (botError) {
          logger.warn('Basic bot stop error (bot may not have been running):', botError instanceof Error ? botError.message : botError);
        }
      }
      
      try {
        await enhancedTelegramBot.stop();
        logger.info('🚀 Enhanced Telegram bot stopped');
      } catch (botError) {
        logger.warn('Enhanced bot stop error (bot may not have been running):', botError instanceof Error ? botError.message : botError);
      }
      
      // Close database connections
      await closeDatabaseConnection();
      await closeRedisConnection();

      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start server
const startServer = async () => {
  const startTime = Date.now();
  logger.info('🚀 Starting server initialization...', {
    environment: config.env,
    port: config.port,
    apiVersion: config.apiVersion,
    timestamp: new Date().toISOString()
  });

  try {
    logger.info('🔍 Testing service connections...', {
      step: 'connection_testing',
      timestamp: new Date().toISOString()
    });

    // Test connections
    const dbConnected = await testDatabaseConnection();
    const redisConnected = await testRedisConnection();

    logger.info('📊 Service connection results:', {
      database: dbConnected ? 'connected' : 'failed',
      redis: redisConnected ? 'connected' : 'failed',
      timestamp: new Date().toISOString()
    });

    if (!dbConnected) {
      logger.error('❌ Failed to connect to database - this is required', {
        exitCode: 1,
        timestamp: new Date().toISOString()
      });
      process.exit(1);
    }

    if (!redisConnected) {
      logger.warn('⚠️ Redis connection failed - continuing without cache', {
        impact: 'No caching available',
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info('✅ All services connected successfully', {
        database: 'connected',
        redis: 'connected',
        timestamp: new Date().toISOString()
      });
    }

    // Start server
    logger.info('🌐 Starting HTTP server...', {
      port: config.port,
      timestamp: new Date().toISOString()
    });

    server.listen(config.port, () => {
      const totalStartTime = Date.now() - startTime;
      logger.info('✅ Server started successfully', {
        port: config.port,
        environment: config.env,
        apiVersion: config.apiVersion,
        totalStartupTime: `${totalStartTime}ms`,
        apiEndpoint: `/api/${config.apiVersion}`,
        websocketEnabled: true,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📖 API documentation: http://localhost:${config.port}/api/${config.apiVersion}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔌 WebSocket server running on port ${config.port}`);
      
      // Start Telegram bots in development mode
      if (config.env === 'development') {
        // Start basic bot
        if (bot) {
          bot.launch().then(() => {
            logger.info('🤖 Basic Telegram bot started in polling mode');
          }).catch((error) => {
            logger.warn('Failed to start basic Telegram bot:', error.message);
          });
        }
        
        // Initialize and start enhanced bot
        try {
          enhancedTelegramBot.initialize();
          enhancedTelegramBot.launch().then(() => {
            logger.info('🚀 Enhanced Telegram bot started in polling mode');
          }).catch((error) => {
            logger.warn('Failed to start enhanced Telegram bot:', error.message);
          });
        } catch (error) {
          logger.warn('Failed to initialize enhanced Telegram bot:', error instanceof Error ? error.message : error);
        }
      }
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Export for testing
export { app, server, io };

// Start server if not in test environment
if (config.env !== 'test') {
  startServer();
}