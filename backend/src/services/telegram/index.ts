import { Telegraf, session } from 'telegraf';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { BotContext } from './types';
import { ensureUserAndType } from './middleware';
import { registerCommands, showUserTypeSelection } from './commands';
import { registerCallbacks } from './handlers/callbacks';
import { registerMessageHandlers } from './handlers/messages';
import { createBooking as createBookingHandler } from './handlers/booking';

export class EnhancedTelegramBot {
  private bot!: Telegraf<BotContext>;
  private isInitialized = false;

  constructor() {
    if (config.telegram.botToken) {
      this.initialize();
    } else {
      logger.warn('Telegram bot token not configured');
    }
  }

  public initialize() {
    if (!config.telegram.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    if (this.isInitialized) {
      return;
    }

    this.bot = new Telegraf<BotContext>(config.telegram.botToken);
    this.initializeBot();
  }

  private async initializeBot() {
    try {
      // Setup session middleware
      this.bot.use(session({
        defaultSession: () => ({
          user: null,
          userType: null,
          state: null,
          data: {},
          language: 'en',
          step: null,
          tempData: {}
        })
      }));

      // Setup middleware for user authentication and type detection
      this.bot.use(async (ctx, next) => {
        if (ctx.from) {
          await ensureUserAndType(ctx, showUserTypeSelection);
        }
        return next();
      });

      // Setup command handlers
      registerCommands(this.bot);

      // Setup callback query handlers
      registerCallbacks(this.bot, async (ctx) => {
        await createBookingHandler(ctx, this.sendNotification.bind(this));
      });

      // Setup message handlers
      registerMessageHandlers(
        this.bot,
        this.broadcastMessage.bind(this),
        () => this.bot.telegram
      );

      this.isInitialized = true;
      logger.info('Enhanced Telegram bot initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Enhanced Telegram bot:', error);
    }
  }

  // ── Public methods ──

  public async launch() {
    if (!this.isInitialized) {
      throw new Error('Enhanced bot not initialized');
    }

    await this.bot.launch();
    logger.info('Enhanced Telegram bot launched successfully');
  }

  public async stop() {
    if (this.bot) {
      this.bot.stop();
      logger.info('Enhanced Telegram bot stopped');
    }
  }

  public getBot() {
    return this.bot;
  }

  // ── Webhook methods ──

  public async setWebhook() {
    if (!config.telegram.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const webhookOptions: Record<string, any> = {};
    if (config.telegram.webhookSecret) {
      webhookOptions.secret_token = config.telegram.webhookSecret;
    }

    await this.bot.telegram.setWebhook(config.telegram.webhookUrl, webhookOptions);
    logger.info('Enhanced Telegram webhook set successfully', {
      url: config.telegram.webhookUrl,
      hasSecret: !!config.telegram.webhookSecret,
    });
  }

  public getWebhookCallback() {
    return this.bot.webhookCallback('/webhook/telegram-enhanced');
  }

  // ── Notification methods ──

  public async sendNotification(userId: string, message: string, keyboard?: Record<string, unknown>) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true, language: true }
      });

      if (!user?.telegramId) {
        return false;
      }

      await this.bot.telegram.sendMessage(
        user.telegramId,
        message,
        keyboard ? { reply_markup: keyboard } : undefined
      );

      return true;

    } catch (error) {
      logger.error('Error sending Enhanced Telegram notification:', error);
      return false;
    }
  }

  // ── Broadcast methods ──

  public async broadcastMessage(message: string, userType?: 'CUSTOMER' | 'SPECIALIST' | 'ADMIN') {
    try {
      const whereClause = userType ? { userType } : {};
      const users = await prisma.user.findMany({
        where: {
          ...whereClause,
          telegramId: { not: null },
          isActive: true
        },
        select: { telegramId: true }
      });

      const sendPromises = users.map(user =>
        this.bot.telegram.sendMessage(user.telegramId!, message).catch(error => {
          logger.debug(`Failed to send broadcast to ${user.telegramId}:`, error);
        })
      );

      await Promise.allSettled(sendPromises);
      logger.info(`Broadcast sent to ${users.length} users`);

    } catch (error) {
      logger.error('Error broadcasting message:', error);
    }
  }
}

// Export singleton instance
export const enhancedTelegramBot = new EnhancedTelegramBot();
