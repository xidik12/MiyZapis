import { Context } from 'telegraf';
import { BotContext } from '../types';
import { sessionManager } from '../services/session';
import { apiService } from '../services/api';
import { getMessage } from '../locales';
import { KeyboardBuilder } from '../utils/keyboards';
import { MessageFormatter } from '../utils/formatters';
import { logger } from '../utils/logger';

export class CommandHandler {
  static async start(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const firstName = ctx.from?.first_name || 'User';
      const lastName = ctx.from?.last_name;
      const username = ctx.from?.username;
      const languageCode = ctx.from?.language_code;

      // Create or get user session
      let session = await sessionManager.getSession(userId);
      let isNewUser = false;

      if (!session) {
        session = await sessionManager.createSession(userId, languageCode as any || 'km');
        isNewUser = true;

        // Register user with API backend
        await apiService.createTelegramUser({
          telegramId: userId,
          firstName,
          lastName,
          username,
          languageCode
        });
      }

      const language = session.language;
      const welcomeMessage = MessageFormatter.formatWelcomeMessage(firstName, isNewUser, language);
      const keyboard = KeyboardBuilder.mainMenu(language);

      await ctx.reply(welcomeMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });

      logger.info(`User started bot: ${userId} (${firstName})`);
    } catch (error) {
      logger.error('Error in start command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async help(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      const helpMessage = getMessage('help.main', language);
      const keyboard = KeyboardBuilder.mainMenu(language);

      await ctx.reply(helpMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in help command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async settings(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      const settingsMessage = getMessage('settings.main', language);
      const keyboard = [
        [{ text: getMessage('settings.change_language', language), callback_data: 'change_language' }],
        [{ text: getMessage('settings.notification_preferences', language), callback_data: 'notifications' }],
        [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
      ];

      await ctx.reply(settingsMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in settings command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async myBookings(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      
      // Get user bookings from API
      const response = await apiService.getUserBookings(userId);
      
      if (!response.success) {
        const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
        await ctx.reply(errorMessage);
        return;
      }

      const bookings = response.data || [];
      const bookingsMessage = MessageFormatter.formatBookingsList(bookings, language);
      
      let keyboard;
      if (bookings.length > 0) {
        keyboard = [
          [
            { text: '📋 ' + getMessage('bookings.view_all', language), callback_data: 'view_all_bookings' },
            { text: '➕ ' + getMessage('bookings.create_new', language), callback_data: 'create_booking' }
          ],
          [
            { text: '🔍 ' + getMessage('bookings.search', language), callback_data: 'search_services' },
            { text: '⭐ ' + getMessage('bookings.specialists', language), callback_data: 'browse_specialists' }
          ],
          [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
        ];
      } else {
        keyboard = [
          [{ text: '➕ ' + getMessage('bookings.create_first', language), callback_data: 'create_booking' }],
          [{ text: '🔍 ' + getMessage('services.browse', language), callback_data: 'browse_services' }],
          [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
        ];
      }

      await ctx.reply(bookingsMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in myBookings command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async location(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      const locationMessage = getMessage('location.request', language);
      
      await ctx.reply(locationMessage, {
        reply_markup: {
          keyboard: [
            [{ text: getMessage('location.share_button', language), request_location: true }],
            [{ text: getMessage('buttons.cancel', language) }]
          ],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });

      // Set flow to location sharing
      await sessionManager.setFlow(userId, 'location_sharing');
    } catch (error) {
      logger.error('Error in location command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async cancel(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      
      // Clear any active flow
      await sessionManager.clearFlow(userId);
      await sessionManager.clearSessionData(userId);

      const cancelMessage = getMessage('actions.cancelled', language);
      const keyboard = KeyboardBuilder.mainMenu(language);

      await ctx.reply(cancelMessage, {
        reply_markup: { 
          inline_keyboard: keyboard,
          remove_keyboard: true 
        }
      });
    } catch (error) {
      logger.error('Error in cancel command:', error);
      await ctx.reply('Operation cancelled.');
    }
  }

  static async profile(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      
      // Get user profile from API
      const response = await apiService.getUserProfile(userId);
      
      if (!response.success) {
        const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
        await ctx.reply(errorMessage);
        return;
      }

      const profile = response.data;
      if (!profile) {
        await ctx.reply(getMessage('profile.not_found', language));
        return;
      }

      const profileMessage = `👤 ${getMessage('profile.title', language)}\n\n` +
        `${getMessage('profile.name', language)}: ${profile.firstName} ${profile.lastName || ''}\n` +
        `${getMessage('profile.email', language)}: ${profile.email || 'Not set'}\n` +
        `${getMessage('profile.phone', language)}: ${profile.phone || 'Not set'}\n` +
        `${getMessage('profile.language', language)}: ${language.toUpperCase()}\n` +
        `${getMessage('profile.member_since', language)}: ${new Date(profile.createdAt).toLocaleDateString()}`;

      const keyboard = [
        [{ text: getMessage('profile.edit', language), callback_data: 'edit_profile' }],
        [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
      ];

      await ctx.reply(profileMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in profile command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async browseServices(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      const servicesMessage = getMessage('services.browse_title', language);
      const keyboard = KeyboardBuilder.serviceCategories(language);

      await ctx.reply(servicesMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in browseServices command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async browseSpecialists(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      
      // Get specialists from API
      const response = await apiService.getSpecialists({ limit: 10 });
      
      if (!response.success) {
        const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
        await ctx.reply(errorMessage);
        return;
      }

      const specialists = response.data || [];
      const specialistsMessage = MessageFormatter.formatSpecialistsList(specialists, language);
      
      const keyboard = [
        [{ text: '🔍 ' + getMessage('specialists.search', language), callback_data: 'search_specialists' }],
        [{ text: '📍 ' + getMessage('specialists.nearby', language), callback_data: 'specialists_nearby' }],
        [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
      ];

      await ctx.reply(specialistsMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in browseSpecialists command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async searchServices(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      const searchMessage = getMessage('search.prompt', language);
      
      await ctx.reply(searchMessage, {
        reply_markup: {
          force_reply: true,
          input_field_placeholder: getMessage('search.placeholder', language)
        }
      });

      await sessionManager.setFlow(userId, 'search_services');
    } catch (error) {
      logger.error('Error in searchServices command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async earnings(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      
      // Get earnings data from API
      const response = await apiService.getSpecialistEarnings(userId);
      
      if (!response.success) {
        const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
        await ctx.reply(errorMessage);
        return;
      }

      const earnings = response.data;
      const earningsMessage = MessageFormatter.formatEarnings(earnings, language);
      
      const keyboard = [
        [
          { text: '📊 ' + getMessage('earnings.analytics', language), callback_data: 'earnings_analytics' },
          { text: '💰 ' + getMessage('earnings.payout', language), callback_data: 'request_payout' }
        ],
        [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
      ];

      await ctx.reply(earningsMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in earnings command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  static async analytics(ctx: BotContext) {
    try {
      const userId = ctx.from?.id;
      if (!userId) return;

      const language = await sessionManager.getUserLanguage(userId);
      
      // Get analytics data from API
      const response = await apiService.getSpecialistAnalytics(userId);
      
      if (!response.success) {
        const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
        await ctx.reply(errorMessage);
        return;
      }

      const analytics = response.data;
      const analyticsMessage = MessageFormatter.formatAnalytics(analytics, language);
      
      const keyboard = [
        [
          { text: '📈 ' + getMessage('analytics.detailed', language), callback_data: 'detailed_analytics' },
          { text: '📊 ' + getMessage('analytics.export', language), callback_data: 'export_analytics' }
        ],
        [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
      ];

      await ctx.reply(analyticsMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });
    } catch (error) {
      logger.error('Error in analytics command:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }
}

export default CommandHandler;