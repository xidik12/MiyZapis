import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

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
  trustProxy,
  defaultRateLimit 
} from '@/middleware/security';
import { errorHandler, notFoundHandler } from '@/middleware/error';

// Routes
import apiRoutes from '@/routes';

// Telegram Bot
import { bot } from '@/bot';

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

// Rate limiting - temporarily disabled for development
// app.use(defaultRateLimit);

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
  // TODO: Implement socket authentication
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

  // TODO: Implement WebSocket event handlers
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Close server
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Stop Telegram bot
      if (bot && bot.botInfo) {
        try {
          await bot.stop('SIGTERM');
          logger.info('🤖 Telegram bot stopped');
        } catch (botError) {
          logger.warn('Bot stop error (bot may not have been running):', botError instanceof Error ? botError.message : botError);
        }
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
  try {
    // Test connections
    const dbConnected = await testDatabaseConnection();
    const redisConnected = await testRedisConnection();

    if (!dbConnected || !redisConnected) {
      logger.error('❌ Failed to connect to required services');
      process.exit(1);
    }

    // Start server
    server.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📖 API documentation: http://localhost:${config.port}/api/${config.apiVersion}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🔌 WebSocket server running on port ${config.port}`);
      
      // Start Telegram bot in development mode
      if (bot && config.env === 'development') {
        bot.launch().then(() => {
          logger.info('🤖 Telegram bot started in polling mode');
        }).catch((error) => {
          logger.warn('Failed to start Telegram bot:', error.message);
        });
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