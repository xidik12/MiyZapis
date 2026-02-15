import { BotContext } from '../types';
import { sessionManager } from '../services/session';
import { logger } from '../utils/logger';

export async function sessionMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const userId = ctx.from?.id;
  
  if (!userId) {
    logger.warn('Message received without user ID');
    return;
  }

  try {
    // Get or create session
    let session = await sessionManager.getSession(userId);
    
    if (!session) {
      const languageCode = ctx.from?.language_code;
      session = await sessionManager.createSession(userId, languageCode as any || 'km');
      logger.info(`Created new session for user ${userId}`);
    } else {
      // Update last activity
      await sessionManager.updateSession(userId, { lastActivity: new Date() });
    }

    // Attach session to context
    ctx.session = session;
    
    await next();
  } catch (error) {
    logger.error('Error in session middleware:', error);
    await ctx.reply('Sorry, something went wrong. Please try again.');
  }
}

export async function errorMiddleware(ctx: BotContext, next: () => Promise<void>) {
  try {
    await next();
  } catch (error) {
    logger.error('Unhandled error in bot:', error);
    
    const userId = ctx.from?.id;
    if (userId) {
      const language = await sessionManager.getUserLanguage(userId);
      await ctx.reply('Sorry, an unexpected error occurred. Our team has been notified.');
    } else {
      await ctx.reply('Sorry, an unexpected error occurred.');
    }
  }
}

export async function loggingMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const start = Date.now();
  const userId = ctx.from?.id;
  const messageType = ctx.updateType;
  
  logger.info(`Incoming ${messageType} from user ${userId}`);
  
  try {
    await next();
    const duration = Date.now() - start;
    logger.info(`Processed ${messageType} for user ${userId} in ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Error processing ${messageType} for user ${userId} after ${duration}ms:`, error);
    throw error;
  }
}

export async function rateLimitMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const userId = ctx.from?.id;
  
  if (!userId) {
    return;
  }

  // Simple rate limiting - 30 messages per minute
  const rateLimitKey = `rate_limit_${userId}`;
  const currentCount = await sessionManager.getSessionData(userId, rateLimitKey) || 0;
  
  if (currentCount >= 30) {
    logger.warn(`Rate limit exceeded for user ${userId}`);
    await ctx.reply('Please slow down. You\'re sending messages too quickly.');
    return;
  }

  // Increment counter
  await sessionManager.setSessionData(userId, rateLimitKey, currentCount + 1);
  
  // Reset counter after 1 minute
  setTimeout(async () => {
    await sessionManager.setSessionData(userId, rateLimitKey, 0);
  }, 60000);

  await next();
}

export async function languageMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const userId = ctx.from?.id;
  
  if (userId) {
    const userLanguage = ctx.from?.language_code;
    const sessionLanguage = await sessionManager.getUserLanguage(userId);
    
    // Update session language if user's Telegram language changed
    if (userLanguage && userLanguage !== sessionLanguage && ['en', 'uk', 'ru', 'km'].includes(userLanguage)) {
      await sessionManager.setUserLanguage(userId, userLanguage as any);
      logger.info(`Updated language for user ${userId} to ${userLanguage}`);
    }
  }

  await next();
}

export async function analyticsMiddleware(ctx: BotContext, next: () => Promise<void>) {
  const userId = ctx.from?.id;
  const messageType = ctx.updateType;
  
  // Log analytics data
  logger.info('Analytics', {
    userId,
    messageType,
    timestamp: new Date().toISOString(),
    text: (ctx.message as any)?.text?.substring(0, 100), // First 100 chars for privacy
    callbackData: (ctx.callbackQuery as any)?.data
  });

  await next();
}