import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Early logging to track configuration loading
console.log('📋 Loading configuration...', {
  nodeEnv: process.env.NODE_ENV || 'undefined',
  port: process.env.PORT || 'undefined',
  databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'undefined',
  redisUrl: process.env.REDIS_URL ? 'provided' : 'not provided',
  timestamp: new Date().toISOString()
});

// Environment validation schema
const envSchema = z.object({
  // Environment
  NODE_ENV: z.string().default('production'),
  PORT: z.string().transform(Number).default('3000'),
  API_VERSION: z.string().default('v1'),

  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),

  // Redis (optional for development)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // Stripe (optional for development)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Coinbase Commerce (optional for development)
  COINBASE_COMMERCE_API_KEY: z.string().optional(),
  COINBASE_COMMERCE_WEBHOOK_SECRET: z.string().optional(),

  // Telegram (optional for development)
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),

  // Email (optional for development)
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform(val => val === 'true').default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@miyzapis.com'),

  // AWS S3 (optional for development)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  AWS_S3_URL: z.string().optional(),

  // Logging
  LOG_LEVEL: z.string().default('info'),
  LOG_FILE_ENABLED: z.string().transform(val => val === 'true').default('false'),
  LOG_FILE_PATH: z.string().default('/tmp/logs'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: z.string().transform(val => val === 'true').default('false'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters').default('miyzapis-default-session-secret-change-in-production-32chars'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // External APIs
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // Frontend URL
  FRONTEND_URL: z.string().optional(),
  
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  // WebSocket
  WEBSOCKET_PORT: z.string().transform(Number).default('3001'),
  WEBSOCKET_CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Monitoring
  SENTRY_DSN: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),

  // Development
  DEBUG: z.string().optional(),
  SEED_DATABASE: z.string().transform(val => val === 'true').default('false'),
});

// Validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  parseResult.error.issues.forEach(issue => {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const env = parseResult.data;

// Configuration object
export const config = {
  // Environment
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',

  // Database
  database: {
    url: env.DATABASE_URL,
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    maxRetriesPerRequest: 1,
    connectTimeout: 5000,
    lazyConnect: true,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // Stripe
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },

  // Coinbase Commerce
  coinbaseCommerce: {
    apiKey: env.COINBASE_COMMERCE_API_KEY,
    webhookSecret: env.COINBASE_COMMERCE_WEBHOOK_SECRET,
    baseUrl: 'https://api.commerce.coinbase.com',
  },

  // Telegram
  telegram: {
    botToken: env.TELEGRAM_BOT_TOKEN,
    webhookUrl: env.TELEGRAM_WEBHOOK_URL,
    webhookSecret: env.TELEGRAM_WEBHOOK_SECRET,
  },

  // Email
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    },
    from: env.EMAIL_FROM,
  },

  // AWS S3
  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: env.AWS_S3_BUCKET,
      url: env.AWS_S3_URL,
    },
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    fileEnabled: env.LOG_FILE_ENABLED,
    filePath: env.LOG_FILE_PATH,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    skipSuccessfulRequests: env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
  },

  // Security
  security: {
    bcryptRounds: env.BCRYPT_ROUNDS,
    sessionSecret: env.SESSION_SECRET,
    corsOrigin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  },

  // External APIs
  externalApis: {
    googleMaps: env.GOOGLE_MAPS_API_KEY,
  },

  // Frontend
  frontend: {
    url: env.FRONTEND_URL,
  },

  // Google OAuth
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  },

  // WebSocket
  websocket: {
    port: env.WEBSOCKET_PORT,
    corsOrigin: env.WEBSOCKET_CORS_ORIGIN.split(',').map(origin => origin.trim()),
  },

  // Monitoring
  monitoring: {
    sentryDsn: env.SENTRY_DSN,
    newRelicLicenseKey: env.NEW_RELIC_LICENSE_KEY,
  },

  // Development
  development: {
    debug: env.DEBUG,
    seedDatabase: env.SEED_DATABASE,
  },
} as const;

export type Config = typeof config;