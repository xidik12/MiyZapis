import { BotContext } from '../types';
import { sessionManager } from '../services/session';
import { apiService } from '../services/api';
import { getMessage } from '../locales';
import { KeyboardBuilder } from '../utils/keyboards';
import { MessageFormatter } from '../utils/formatters';
import { logger } from '../utils/logger';

export class MessageHandler {
  static async handleText(ctx: BotContext) {
    const userId = ctx.from?.id;
    const text = (ctx.message as any)?.text;

    if (!userId || !text) return;

    try {
      const language = await sessionManager.getUserLanguage(userId);
      const { flow, step } = await sessionManager.getCurrentFlow(userId);

      // Handle flow-based messages
      if (flow) {
        await this.handleFlowMessage(ctx, flow, step, text);
        return;
      }

      // Handle general text messages
      if (text.toLowerCase().includes('help')) {
        await this.sendHelpMessage(ctx);
      } else if (text.toLowerCase().includes('book')) {
        await this.handleBookingIntent(ctx);
      } else if (text.toLowerCase().includes('cancel')) {
        await this.handleCancelIntent(ctx);
      } else {
        // Try to search for specialists or services
        await this.handleSearchQuery(ctx, text);
      }
    } catch (error) {
      logger.error('Error handling text message:', error);
      await ctx.reply('Sorry, I didn\'t understand that. Type /help for assistance.');
    }
  }

  static async handleLocation(ctx: BotContext) {
    const userId = ctx.from?.id;
    const location = (ctx.message as any)?.location;

    if (!userId || !location) return;

    try {
      const language = await sessionManager.getUserLanguage(userId);
      const { flow } = await sessionManager.getCurrentFlow(userId);

      if (flow === 'location_sharing') {
        // Search for nearby specialists
        const response = await apiService.getNearbySpecialists(
          location.latitude,
          location.longitude,
          5 // 5km radius
        );

        if (!response.success) {
          const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
          await ctx.reply(errorMessage);
          return;
        }

        const specialists = response.data || [];
        const locationMessage = MessageFormatter.formatLocationSearch(
          location.latitude,
          location.longitude,
          language
        );
        const specialistsMessage = MessageFormatter.formatSpecialistsList(specialists, language);
        
        const keyboard = [
          ...specialists.slice(0, 5).map(specialist => [
            { text: `👤 ${specialist.name} - $${specialist.priceFrom}+`, callback_data: `specialist_${specialist.id}` }
          ]),
          [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
        ];

        await ctx.reply(`${locationMessage}\n\n${specialistsMessage}`, {
          reply_markup: { 
            inline_keyboard: keyboard,
            remove_keyboard: true 
          }
        });

        // Clear location flow
        await sessionManager.clearFlow(userId);
        
        logger.info(`Location search performed by user ${userId}: ${location.latitude}, ${location.longitude}`);
      } else {
        await ctx.reply(getMessage('location.not_requested', language));
      }
    } catch (error) {
      logger.error('Error handling location message:', error);
      await ctx.reply('Sorry, something went wrong while processing your location.');
    }
  }

  static async handleContact(ctx: BotContext) {
    const userId = ctx.from?.id;
    const contact = (ctx.message as any)?.contact;

    if (!userId || !contact) return;

    try {
      const language = await sessionManager.getUserLanguage(userId);
      
      // Update user profile with phone number
      await apiService.updateUserProfile(userId, {
        phone: contact.phone_number
      });

      const successMessage = getMessage('profile.phone_updated', language);
      const keyboard = KeyboardBuilder.mainMenu(language);

      await ctx.reply(successMessage, {
        reply_markup: { 
          inline_keyboard: keyboard,
          remove_keyboard: true 
        }
      });

      logger.info(`Phone number updated for user ${userId}: ${contact.phone_number}`);
    } catch (error) {
      logger.error('Error handling contact message:', error);
      await ctx.reply('Sorry, something went wrong while updating your phone number.');
    }
  }

  private static async handleFlowMessage(ctx: BotContext, flow: string, step: string | undefined, text: string) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);

    switch (flow) {
      case 'booking':
        await this.handleBookingFlowMessage(ctx, step, text);
        break;
      case 'profile_edit':
        await this.handleProfileEditFlow(ctx, step, text);
        break;
      case 'search':
        await this.handleSearchFlow(ctx, step, text);
        break;
      case 'support':
        await this.handleSupportFlow(ctx, step, text);
        break;
      default:
        await ctx.reply(getMessage('flow.unknown', language));
        await sessionManager.clearFlow(userId);
    }
  }

  private static async handleBookingFlowMessage(ctx: BotContext, step: string | undefined, text: string) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);

    switch (step) {
      case 'add_notes':
        // Save booking notes
        await sessionManager.updateBookingFlow(userId, { notes: text });
        
        const notesMessage = getMessage('booking.notes_added', language);
        const keyboard = [
          [{ text: '✅ Confirm Booking', callback_data: 'confirm_booking' }],
          [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
        ];

        await ctx.reply(notesMessage, {
          reply_markup: { inline_keyboard: keyboard }
        });
        break;
      
      default:
        await ctx.reply(getMessage('booking.invalid_step', language));
    }
  }

  private static async handleProfileEditFlow(ctx: BotContext, step: string | undefined, text: string) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);

    switch (step) {
      case 'name':
        const [firstName, ...lastNameParts] = text.split(' ');
        const lastName = lastNameParts.join(' ');
        
        await apiService.updateUserProfile(userId, {
          firstName,
          lastName: lastName || undefined
        });

        await ctx.reply(getMessage('profile.name_updated', language));
        await sessionManager.clearFlow(userId);
        break;

      case 'email':
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          await ctx.reply(getMessage('profile.invalid_email', language));
          return;
        }

        await apiService.updateUserProfile(userId, { email: text });
        await ctx.reply(getMessage('profile.email_updated', language));
        await sessionManager.clearFlow(userId);
        break;

      default:
        await ctx.reply(getMessage('profile.edit_invalid_step', language));
    }
  }

  private static async handleSearchFlow(ctx: BotContext, step: string | undefined, text: string) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);

    // Search for specialists or services
    const response = await apiService.searchSpecialists(text);
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'search_failed', language);
      await ctx.reply(errorMessage);
      return;
    }

    const specialists = response.data || [];
    const searchMessage = `🔍 Search results for "${text}":\n\n${MessageFormatter.formatSpecialistsList(specialists, language)}`;
    
    const keyboard = [
      ...specialists.slice(0, 5).map(specialist => [
        { text: `👤 ${specialist.name}`, callback_data: `specialist_${specialist.id}` }
      ]),
      [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
    ];

    await ctx.reply(searchMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });

    await sessionManager.clearFlow(userId);
  }

  private static async handleSupportFlow(ctx: BotContext, step: string | undefined, text: string) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);

    // Log the support message
    logger.info(`Support message from user ${userId}: ${text}`);

    const supportMessage = getMessage('support.message_received', language);
    const keyboard = KeyboardBuilder.mainMenu(language);

    await ctx.reply(supportMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });

    await sessionManager.clearFlow(userId);
  }

  private static async sendHelpMessage(ctx: BotContext) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    const helpMessage = getMessage('help.main', language);
    const keyboard = KeyboardBuilder.mainMenu(language);

    await ctx.reply(helpMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleBookingIntent(ctx: BotContext) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    const bookingMessage = getMessage('booking.start_intent', language);
    const keyboard = KeyboardBuilder.serviceCategories(language);

    await ctx.reply(bookingMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleCancelIntent(ctx: BotContext) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    // Clear any active flows
    await sessionManager.clearFlow(userId);
    await sessionManager.clearSessionData(userId);

    const cancelMessage = getMessage('actions.cancelled', language);
    const keyboard = KeyboardBuilder.mainMenu(language);

    await ctx.reply(cancelMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleSearchQuery(ctx: BotContext, query: string) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);

    // Set search flow and perform search
    await sessionManager.setFlow(userId, 'search');
    await this.handleSearchFlow(ctx, undefined, query);
  }
}

export default MessageHandler;