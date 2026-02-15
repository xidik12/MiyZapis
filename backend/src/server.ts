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
import { startBookingReminderWorker } from '@/workers/bookingReminderWorker';
import { subscriptionWorker } from '@/workers/subscription.worker';
import { initializeVapid } from '@/services/push';

// Create Express app
const app = express();

// Trust proxy in production
app.use(trustProxy);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(requestId);

// Body parsing middleware with raw body preservation for webhooks
// For webhook routes, we need the raw body for signature verification
app.use((req, res, next) => {
  if (req.path.includes('/webhooks/')) {
    // For webhooks, capture raw body before parsing
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      (req as any).rawBody = data;
      try {
        req.body = JSON.parse(data);
      } catch (error) {
        req.body = {};
      }
      next();
    });
  } else {
    // For non-webhooks, use standard JSON parsing
    next();
  }
});

// Apply express.json() only for non-webhook routes
app.use((req, res, next) => {
  if (req.path.includes('/webhooks/')) {
    // Skip express.json() for webhooks - already parsed above
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

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

// Static file serving for uploads with fallback directories
// Railway permission fix: Try multiple upload directories in order of preference
const uploadOptions = isRailway ? [
  '/app/uploads',  // Preferred: persistent volume
  '/tmp/uploads',  // Fallback 1: tmp directory
  './uploads',     // Fallback 2: local directory
  '/tmp'           // Last resort: directly in tmp
] : [
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
  './uploads',
  '/tmp/uploads'
];

let uploadsDir = uploadOptions[0]; // Default to first option

// Find a working uploads directory
for (const testDir of uploadOptions) {
  try {
    const fs = require('fs');
    
    // Try to create directory if it doesn't exist
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true, mode: 0o755 });
    }
    
    // Test write permissions
    const testFile = path.join(testDir, 'server-test-' + Date.now() + '.txt');
    fs.writeFileSync(testFile, 'test', { mode: 0o644 });
    fs.unlinkSync(testFile);
    
    uploadsDir = testDir;
    logger.info('Found working uploads directory', { uploadsDir });
    break;
  } catch (error) {
    logger.warn(`Upload directory ${testDir} not available:`, error instanceof Error ? error.message : error);
    continue;
  }
}

// Setup static file serving with multiple directory support
app.use('/uploads', (req, res, next) => {
  // Try to serve from the determined uploads directory first
  express.static(uploadsDir, {
    maxAge: '1y', // Cache uploaded files for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Ensure proper MIME types for image formats
      if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      } else if (path.endsWith('.avif')) {
        res.setHeader('Content-Type', 'image/avif');
      }
      // Add Cache-Control header for better caching
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  })(req, res, (err) => {
    if (err) {
      // If file not found in primary directory, try fallback directories
      let foundFile = false;
      
      for (const fallbackDir of uploadOptions) {
        if (fallbackDir === uploadsDir) continue; // Skip already tried directory
        
        try {
          const fs = require('fs');
          const filePath = path.join(fallbackDir, req.path);
          
          if (fs.existsSync(filePath)) {
            express.static(fallbackDir, {
              maxAge: '1y',
              etag: true,
              lastModified: true,
              setHeaders: (res, path) => {
                if (path.endsWith('.webp')) {
                  res.setHeader('Content-Type', 'image/webp');
                } else if (path.endsWith('.avif')) {
                  res.setHeader('Content-Type', 'image/avif');
                }
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              }
            })(req, res, next);
            foundFile = true;
            break;
          }
        } catch (fallbackError) {
          continue;
        }
      }
      
      if (!foundFile) {
        next(err); // File not found in any directory
      }
    } else {
      next(err);
    }
  });
});

logger.info('Static file serving configured', { 
  uploadsDir,
  uploadOptions,
  route: '/uploads',
  isRailwayEnvironment: isRailway
});


// API routes
app.use(`/api/${config.apiVersion}`, apiRoutes);

// SEO: serve sitemap.xml and robots.txt if frontend static not serving
app.get('/sitemap.xml', (req, res) => {
  const base = config.frontend?.url || 'https://miyzapis.com';
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${base}/auth/register</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${base}/search</loc><changefreq>daily</changefreq><priority>0.7</priority></url>
  <url><loc>${base}/loyalty</loc><changefreq>weekly</changefreq><priority>0.5</priority></url>
</urlset>`;
  res.type('application/xml').send(xml);
});

app.get('/robots.txt', (req, res) => {
  const base = config.frontend?.url || 'https://miyzapis.com';
  const robots = `User-agent: *\nAllow: /\nDisallow: /assets/\nSitemap: ${base}/sitemap.xml\n`;
  res.type('text/plain').send(robots);
});

// Serve frontend static files (built by Vite into ../frontend/dist)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDist)) {
  logger.info('Serving frontend from', { frontendDist });
  app.use(express.static(frontendDist, {
    maxAge: '1d',
    etag: true,
    index: 'index.html',
  }));
  // SPA catch-all: any non-API, non-upload route → index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // No frontend build available — serve API root info
  app.get('/', (req, res) => {
    res.json({
      name: 'Booking Platform API',
      version: config.apiVersion,
      environment: config.env,
      status: 'running',
      timestamp: new Date().toISOString(),
    });
  });
}

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

// Import and initialize enhanced WebSocket service
import { EnhancedWebSocketService } from '@/services/websocket/enhanced-websocket';
import { WebSocketManager } from '@/services/websocket/websocket-manager';

// Initialize enhanced WebSocket service and singleton manager
const enhancedWebSocketService = new EnhancedWebSocketService(io);
WebSocketManager.initialize(enhancedWebSocketService);

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
      
      // Stop workers
      subscriptionWorker.stop();

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

    // Initialize Web Push VAPID keys
    const vapidReady = initializeVapid();
    logger.info(vapidReady ? '✅ Web Push VAPID initialized' : '⚠️ Web Push VAPID not configured - push notifications disabled', {
      timestamp: new Date().toISOString()
    });

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
      
      // Start Telegram bots (polling mode)
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

      // Start background workers (stateless, safe to run once per instance)
      try {
        startBookingReminderWorker();
        logger.info('⏰ Booking reminder worker started');
      } catch (e) {
        logger.warn('Failed to start booking reminder worker', { error: (e as any)?.message });
      }

      // Start subscription worker
      try {
        subscriptionWorker.start();
        logger.info('💳 Subscription worker started');
      } catch (e) {
        logger.warn('Failed to start subscription worker', { error: (e as any)?.message });
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
