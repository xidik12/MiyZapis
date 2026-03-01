import { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from './database';
import { redis } from './redis';
import { logger } from '@/utils/logger';

// Multi-platform API configuration
export interface APIConfig {
  version: string;
  platforms: {
    web: PlatformConfig;
    telegram_bot: PlatformConfig;
    telegram_miniapp: PlatformConfig;
  };
  endpoints: EndpointConfig[];
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

interface PlatformConfig {
  rateLimit: {
    windowMs: number;
    max: number;
  };
  fileUpload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  features: string[];
}

interface EndpointConfig {
  path: string;
  methods: string[];
  auth: 'required' | 'optional' | 'none';
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  platforms: string[];
  description: string;
}

interface SecurityConfig {
  cors: {
    origins: string[];
    credentials: boolean;
  };
  headers: {
    [key: string]: string;
  };
  validation: {
    strict: boolean;
    sanitize: boolean;
  };
}

interface MonitoringConfig {
  logging: {
    requests: boolean;
    errors: boolean;
    performance: boolean;
  };
  analytics: {
    enabled: boolean;
    realtime: boolean;
  };
}

// Complete API configuration
export const API_CONFIG: APIConfig = {
  version: 'v1',
  platforms: {
    web: {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000 // requests per windowMs
      },
      fileUpload: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: ['image/*', 'application/pdf', 'application/msword']
      },
      features: ['full_api', 'oauth', 'file_upload', 'websockets', 'push_notifications']
    },
    telegram_bot: {
      rateLimit: {
        windowMs: 60 * 1000, // 1 minute
        max: 30 // requests per minute
      },
      fileUpload: {
        maxFileSize: 20 * 1024 * 1024, // 20MB
        allowedTypes: ['image/*', 'application/pdf']
      },
      features: ['core_api', 'telegram_auth', 'limited_upload', 'bot_commands']
    },
    telegram_miniapp: {
      rateLimit: {
        windowMs: 60 * 1000,
        max: 100
      },
      fileUpload: {
        maxFileSize: 30 * 1024 * 1024, // 30MB
        allowedTypes: ['image/*', 'application/pdf']
      },
      features: ['full_api', 'telegram_auth', 'file_upload', 'websockets', 'telegram_payments']
    }
  },
  endpoints: [
    // Authentication endpoints
    {
      path: '/auth/register',
      methods: ['POST'],
      auth: 'none',
      rateLimit: { windowMs: 15 * 60 * 1000, max: 5 },
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'User registration'
    },
    {
      path: '/auth/login',
      methods: ['POST'],
      auth: 'none',
      rateLimit: { windowMs: 15 * 60 * 1000, max: 5 },
      platforms: ['web'],
      description: 'User login with email/password'
    },
    {
      path: '/auth/telegram/bot',
      methods: ['POST'],
      auth: 'none',
      rateLimit: { windowMs: 60 * 1000, max: 10 },
      platforms: ['telegram_bot'],
      description: 'Telegram bot authentication'
    },
    {
      path: '/auth/telegram/miniapp',
      methods: ['POST'],
      auth: 'none',
      rateLimit: { windowMs: 60 * 1000, max: 10 },
      platforms: ['telegram_miniapp'],
      description: 'Telegram mini app authentication'
    },
    {
      path: '/auth/google',
      methods: ['POST'],
      auth: 'none',
      rateLimit: { windowMs: 15 * 60 * 1000, max: 10 },
      platforms: ['web'],
      description: 'Google OAuth authentication'
    },
    
    // User management endpoints
    {
      path: '/users/profile',
      methods: ['GET', 'PUT'],
      auth: 'required',
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'User profile management'
    },
    {
      path: '/users/settings',
      methods: ['GET', 'PUT'],
      auth: 'required',
      platforms: ['web', 'telegram_miniapp'],
      description: 'User settings and preferences'
    },
    
    // Service endpoints
    {
      path: '/services',
      methods: ['GET', 'POST'],
      auth: 'optional',
      rateLimit: { windowMs: 60 * 1000, max: 100 },
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'Service listing and creation'
    },
    {
      path: '/services/:id',
      methods: ['GET', 'PUT', 'DELETE'],
      auth: 'optional',
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'Individual service management'
    },
    
    // Search endpoints
    {
      path: '/search/services',
      methods: ['GET'],
      auth: 'optional',
      rateLimit: { windowMs: 60 * 1000, max: 200 },
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'Service search with filters'
    },
    {
      path: '/search/specialists',
      methods: ['GET'],
      auth: 'optional',
      rateLimit: { windowMs: 60 * 1000, max: 200 },
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'Specialist search'
    },
    
    // Booking endpoints
    {
      path: '/bookings',
      methods: ['GET', 'POST'],
      auth: 'required',
      rateLimit: { windowMs: 60 * 1000, max: 50 },
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'Booking management'
    },
    {
      path: '/bookings/:id',
      methods: ['GET', 'PUT', 'DELETE'],
      auth: 'required',
      platforms: ['web', 'telegram_bot', 'telegram_miniapp'],
      description: 'Individual booking management'
    },
    
    // Payment endpoints
    {
      path: '/payments/create-intent',
      methods: ['POST'],
      auth: 'required',
      rateLimit: { windowMs: 60 * 1000, max: 10 },
      platforms: ['web', 'telegram_miniapp'],
      description: 'Create payment intent'
    },
    {
      path: '/payments/telegram/invoice',
      methods: ['POST'],
      auth: 'required',
      rateLimit: { windowMs: 60 * 1000, max: 5 },
      platforms: ['telegram_bot', 'telegram_miniapp'],
      description: 'Create Telegram payment invoice'
    },
    
    // File upload endpoints
    {
      path: '/files/upload',
      methods: ['POST'],
      auth: 'required',
      rateLimit: { windowMs: 60 * 1000, max: 20 },
      platforms: ['web', 'telegram_miniapp'],
      description: 'File upload'
    },
    {
      path: '/files/upload/signed',
      methods: ['POST'],
      auth: 'required',
      rateLimit: { windowMs: 60 * 1000, max: 10 },
      platforms: ['web'],
      description: 'Generate signed upload URL'
    },
    
    // Messaging endpoints
    {
      path: '/conversations',
      methods: ['GET', 'POST'],
      auth: 'required',
      platforms: ['web', 'telegram_miniapp'],
      description: 'Conversation management'
    },
    {
      path: '/conversations/:id/messages',
      methods: ['GET', 'POST'],
      auth: 'required',
      platforms: ['web', 'telegram_miniapp'],
      description: 'Message management'
    },
    
    // Notification endpoints
    {
      path: '/notifications',
      methods: ['GET'],
      auth: 'required',
      platforms: ['web', 'telegram_miniapp'],
      description: 'User notifications'
    },
    {
      path: '/notifications/preferences',
      methods: ['GET', 'PUT'],
      auth: 'required',
      platforms: ['web', 'telegram_miniapp'],
      description: 'Notification preferences'
    },
    
    // Analytics endpoints
    {
      path: '/analytics/dashboard',
      methods: ['GET'],
      auth: 'required',
      platforms: ['web'],
      description: 'Analytics dashboard data'
    },
    
    // Telegram-specific endpoints
    {
      path: '/telegram/webhook',
      methods: ['POST'],
      auth: 'none',
      rateLimit: { windowMs: 60 * 1000, max: 1000 },
      platforms: ['telegram_bot'],
      description: 'Telegram bot webhook'
    },
    {
      path: '/telegram/miniapp/init',
      methods: ['GET'],
      auth: 'required',
      platforms: ['telegram_miniapp'],
      description: 'Mini app initialization data'
    },
    
    // Admin endpoints (web only)
    {
      path: '/admin/users',
      methods: ['GET', 'PUT'],
      auth: 'required',
      platforms: ['web'],
      description: 'Admin user management'
    },
    {
      path: '/admin/analytics',
      methods: ['GET'],
      auth: 'required',
      platforms: ['web'],
      description: 'Admin analytics'
    }
  ],
  security: {
    cors: {
      origins: [
        // Configured via CORS_ORIGIN environment variable
        // Defaults: http://localhost:3000 (dev), https://miyzapis.com (prod)
        'https://miyzapis.com',
        'https://www.miyzapis.com',
        'https://miyzapis-frontend-production.up.railway.app'
      ],
      credentials: true
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
    validation: {
      strict: true,
      sanitize: true
    }
  },
  monitoring: {
    logging: {
      requests: true,
      errors: true,
      performance: true
    },
    analytics: {
      enabled: true,
      realtime: true
    }
  }
};

// Platform detection utility
export function detectPlatform(req: Request): keyof APIConfig['platforms'] {
  const userAgent = req.get('User-Agent') || '';
  const telegramWebApp = req.get('X-Telegram-Web-App');
  const telegramBot = req.get('X-Telegram-Bot');
  
  if (telegramWebApp) return 'telegram_miniapp';
  if (telegramBot || userAgent.includes('Telegram')) return 'telegram_bot';
  return 'web';
}

// Endpoint validation utility
export function validateEndpointAccess(endpoint: string, method: string, platform: string): boolean {
  const endpointConfig = API_CONFIG.endpoints.find(ep => 
    ep.path === endpoint && ep.methods.includes(method.toUpperCase())
  );
  
  if (!endpointConfig) return false;
  return endpointConfig.platforms.includes(platform);
}

// Rate limiting utility
export function createPlatformRateLimit(platform: keyof APIConfig['platforms'], endpoint?: string) {
  const config = API_CONFIG.platforms[platform];
  const endpointConfig = API_CONFIG.endpoints.find(ep => ep.path === endpoint);
  
  const rateLimitConfig = endpointConfig?.rateLimit || config.rateLimit;
  
  return rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.max,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests from ${platform}. Please try again later.`,
        retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000)
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const userId = req.user?.id;
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      return userId ? `user:${userId}:${platform}` : `ip:${ip}:${platform}`;
    }
  });
}

// Feature availability checker
export function hasFeature(platform: keyof APIConfig['platforms'], feature: string): boolean {
  return API_CONFIG.platforms[platform].features.includes(feature);
}

// API documentation generator
export function generateAPIDocumentation() {
  const docs = {
    version: API_CONFIG.version,
    title: 'BookingBot Multi-Platform API',
    description: 'Unified API supporting web applications, Telegram bots, and Telegram mini apps',
    platforms: Object.keys(API_CONFIG.platforms),
    endpoints: API_CONFIG.endpoints.map(endpoint => ({
      path: `/api/${API_CONFIG.version}${endpoint.path}`,
      methods: endpoint.methods,
      authentication: endpoint.auth,
      platforms: endpoint.platforms,
      description: endpoint.description,
      rateLimit: endpoint.rateLimit || 'Platform default'
    })),
    authentication: {
      web: {
        type: 'JWT Bearer Token',
        methods: ['email/password', 'Google OAuth']
      },
      telegram_bot: {
        type: 'JWT Bearer Token',
        methods: ['Telegram Bot Auth']
      },
      telegram_miniapp: {
        type: 'JWT Bearer Token',
        methods: ['Telegram Web App initData']
      }
    },
    rateLimits: API_CONFIG.platforms,
    security: API_CONFIG.security
  };
  
  return docs;
}

// Health check endpoint configuration
export function configureHealthCheck(app: Express) {
  app.get('/health', async (req, res) => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'healthy';
      
      // Check Redis connection
      let redisStatus = 'not_configured';
      if (redis) {
        try {
          await redis.ping();
          redisStatus = 'healthy';
        } catch {
          redisStatus = 'unhealthy';
        }
      }
      
      // Get system stats
      const stats = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        version: process.version
      };
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus,
          redis: redisStatus
        },
        system: stats
      });
      
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // API info endpoint
  app.get('/api/info', (req, res) => {
    res.json(generateAPIDocumentation());
  });
}

// Request logging middleware
export function requestLogger(req: Request & { user?: { id: string } }, res: Response, next: NextFunction) {
  const start = Date.now();
  const platform = detectPlatform(req);
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      platform,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    };
    
    if (res.statusCode >= 400) {
      logger.error('API request error', logData);
    } else {
      logger.info('API request', logData);
    }
    
    // Log to analytics if enabled
    if (API_CONFIG.monitoring.analytics.enabled) {
      // This would integrate with your analytics service
      logAPIUsage(logData).catch(err => 
        logger.error('Failed to log API usage:', err)
      );
    }
  });
  
  next();
}

// Analytics logging function
async function logAPIUsage(logData: { userId?: string; url: string; method: string; platform: string; statusCode: number; duration: number; ip: string }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: logData.userId || null,
        entityType: 'API_USAGE',
        entityId: logData.url.split('?')[0], // Use endpoint as entityId
        action: logData.method,
        changes: JSON.stringify({
          platform: logData.platform,
          statusCode: logData.statusCode,
          responseTime: logData.duration,
          url: logData.url
        }),
        ipAddress: logData.ip,
        userAgent: logData.userAgent
      }
    });
  } catch (error) {
    logger.error('Failed to log API usage to database:', error);
  }
}