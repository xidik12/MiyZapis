import { Telegraf } from 'telegraf';
import { config } from './config';
import { BotContext } from './types';
import { logger } from './utils/logger';
import { sessionManager } from './services/session';
import { apiService } from './services/api';

// Handlers
import { CommandHandler } from './handlers/commands';
import { CallbackHandler } from './handlers/callbacks';
import { MessageHandler } from './handlers/messages';

// Middleware
import {
  sessionMiddleware,
  errorMiddleware,
  loggingMiddleware,
  rateLimitMiddleware,
  languageMiddleware,
  analyticsMiddleware
} from './middleware';

class BookingBot {
  private bot: Telegraf<BotContext>;

  constructor() {
    this.bot = new Telegraf<BotContext>(config.botToken);
    this.setupMiddleware();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // Apply middleware in order
    this.bot.use(loggingMiddleware);
    this.bot.use(errorMiddleware);
    this.bot.use(sessionMiddleware);
    this.bot.use(rateLimitMiddleware);
    this.bot.use(languageMiddleware);
    this.bot.use(analyticsMiddleware);
  }

  private setupHandlers() {
    // Command handlers
    this.bot.start(CommandHandler.start);
    this.bot.help(CommandHandler.help);
    this.bot.command('settings', CommandHandler.settings);
    this.bot.command('bookings', CommandHandler.myBookings);
    this.bot.command('services', CommandHandler.browseServices);
    this.bot.command('specialists', CommandHandler.browseSpecialists);
    this.bot.command('search', CommandHandler.searchServices);
    this.bot.command('location', CommandHandler.location);
    this.bot.command('cancel', CommandHandler.cancel);
    this.bot.command('profile', CommandHandler.profile);
    this.bot.command('earnings', CommandHandler.earnings);
    this.bot.command('analytics', CommandHandler.analytics);

    // Callback query handlers
    this.bot.on('callback_query', CallbackHandler.handle);

    // Message handlers
    this.bot.on('text', MessageHandler.handleText);
    this.bot.on('location', MessageHandler.handleLocation);
    this.bot.on('contact', MessageHandler.handleContact);

    // Handle unknown commands
    this.bot.on('message', async (ctx) => {
      const userId = ctx.from?.id;
      if (userId) {
        const language = await sessionManager.getUserLanguage(userId);
        await ctx.reply('Sorry, I don\'t understand that command. Type /help for assistance.');
      }
    });
  }

  private setupErrorHandling() {
    // Handle bot errors
    this.bot.catch(async (err, ctx) => {
      logger.error('Bot error:', err);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    });

    // Handle process errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle shutdown signals
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully');
      this.gracefulShutdown();
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      this.gracefulShutdown();
    });
  }

  private async gracefulShutdown() {
    try {
      logger.info('Starting graceful shutdown...');
      
      // Stop the bot
      await this.bot.stop();
      
      // Clean up expired sessions
      const cleanedSessions = await sessionManager.cleanupExpiredSessions();
      logger.info(`Cleaned up ${cleanedSessions} expired sessions`);
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  async start() {
    try {
      // Test API connection
      logger.info('Testing API connection...');
      const healthCheck = await apiService.healthCheck();
      
      if (!healthCheck.success) {
        logger.warn('API health check failed, but starting bot anyway');
      } else {
        logger.info('API connection successful');
      }

      // Start the bot
      if (config.nodeEnv === 'production' && config.webhookUrl) {
        // Production with webhook
        await this.bot.telegram.setWebhook(config.webhookUrl);
        logger.info(`Webhook set to: ${config.webhookUrl}`);
        
        // Start webhook server
        await this.bot.launch({
          webhook: {
            domain: config.webhookUrl,
            port: config.port
          }
        });
      } else {
        // Development or production without webhook: use polling
        await this.bot.launch();
        logger.info(`Bot started with polling in ${config.nodeEnv} mode`);
        
        if (config.nodeEnv === 'production') {
          logger.warn('Production bot using polling - consider setting WEBHOOK_URL for better performance');
        }
      }

      logger.info(`Booking Bot started successfully in ${config.nodeEnv} mode`);
      
      // Log active sessions count
      const activeSessions = await sessionManager.getActiveSessionsCount();
      logger.info(`Active sessions: ${activeSessions}`);

    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  // Webhook handler for production
  getWebhookCallback() {
    return this.bot.webhookCallback('/webhook');
  }
}

// Start the bot if this file is run directly
if (require.main === module) {
  const bot = new BookingBot();
  bot.start().catch((error) => {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  });
}

export { BookingBot };
export default BookingBot;