import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Bot Configuration
  botToken: process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '',
  webhookUrl: process.env.WEBHOOK_URL,
  
  // API Configuration
  apiBaseUrl: process.env.API_BASE_URL || process.env.BACKEND_URL || 'https://miyzapis-backend-production.up.railway.app',
  apiTimeout: parseInt(process.env.API_TIMEOUT || '10000'),
  
  // Server Configuration
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || 'sqlite:./bot_sessions.db',
  
  // Security
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30'),
  
  // Features
  enablePayments: process.env.ENABLE_PAYMENTS === 'true',
  enableLocation: process.env.ENABLE_LOCATION === 'true',
  enableFileUploads: process.env.ENABLE_FILE_UPLOADS === 'true',
};

// Validate required configuration
if (!config.botToken && config.nodeEnv !== 'test') {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export default config;