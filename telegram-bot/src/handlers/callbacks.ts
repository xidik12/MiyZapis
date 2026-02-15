import { BotContext } from '../types';
import { sessionManager } from '../services/session';
import { apiService } from '../services/api';
import { getMessage } from '../locales';
import { KeyboardBuilder } from '../utils/keyboards';
import { MessageFormatter } from '../utils/formatters';
import { logger } from '../utils/logger';

export class CallbackHandler {
  static async handle(ctx: BotContext) {
    const callbackData = (ctx.callbackQuery as any)?.data;
    const userId = ctx.from?.id;

    if (!callbackData || !userId) return;

    try {
      await ctx.answerCbQuery();
      
      // Parse callback data
      const [action, ...params] = callbackData.split('_');

      switch (action) {
        case 'main':
          await this.handleMainMenu(ctx);
          break;
        case 'browse':
          await this.handleBrowseServices(ctx);
          break;
        case 'my':
          await this.handleMyBookings(ctx);
          break;
        case 'category':
          await this.handleServiceCategory(ctx, params);
          break;
        case 'specialist':
          await this.handleSpecialistProfile(ctx, params);
          break;
        case 'book':
          await this.handleBookSpecialist(ctx, params);
          break;
        case 'select':
          await this.handleSelection(ctx, params);
          break;
        case 'confirm':
          await this.handleConfirmation(ctx, params);
          break;
        case 'lang':
          await this.handleLanguageChange(ctx, params);
          break;
        case 'location':
          await this.handleLocationSearch(ctx);
          break;
        case 'call':
          await this.handleCallSpecialist(ctx, params);
          break;
        case 'message':
          await this.handleMessageSpecialist(ctx, params);
          break;
        case 'portfolio':
          await this.handleViewPortfolio(ctx, params);
          break;
        case 'reviews':
          await this.handleViewReviews(ctx, params);
          break;
        case 'cancel':
          await this.handleCancelBooking(ctx, params);
          break;
        default:
          logger.warn(`Unknown callback action: ${action}`);
      }
    } catch (error) {
      logger.error('Error handling callback:', error);
      await ctx.reply('Sorry, something went wrong. Please try again.');
    }
  }

  private static async handleMainMenu(ctx: BotContext) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    const welcomeMessage = getMessage('main_menu.welcome', language);
    const keyboard = KeyboardBuilder.mainMenu(language);

    await ctx.editMessageText(welcomeMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleBrowseServices(ctx: BotContext) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    const categoriesMessage = getMessage('categories.choose', language);
    const keyboard = KeyboardBuilder.serviceCategories(language);

    await ctx.editMessageText(categoriesMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleMyBookings(ctx: BotContext) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    // Get user bookings
    const response = await apiService.getUserBookings(userId);
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const bookings = response.data || [];
    const bookingsMessage = MessageFormatter.formatBookingsList(bookings, language);
    
    let keyboard;
    if (bookings.length > 0) {
      keyboard = [
        ...bookings.slice(0, 5).map((booking, index) => [
          { text: `📋 #${booking.id.slice(-8)}`, callback_data: `booking_details_${booking.id}` }
        ]),
        [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
      ];
    } else {
      keyboard = KeyboardBuilder.serviceCategories(language);
    }

    await ctx.editMessageText(bookingsMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleServiceCategory(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const categoryType = params.join('_');
    
    // Get specialists in this category
    const response = await apiService.getSpecialists({ 
      categoryId: categoryType,
      page: 1,
      limit: 10 
    });
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const specialists = response.data || [];
    const specialistsMessage = MessageFormatter.formatSpecialistsList(specialists, language);
    
    const keyboard = [
      ...specialists.slice(0, 5).map(specialist => [
        { text: `👤 ${specialist.name} - $${specialist.priceFrom}+`, callback_data: `specialist_${specialist.id}` }
      ]),
      [
        { text: getMessage('buttons.back', language), callback_data: 'browse_services' },
        { text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }
      ]
    ];

    await ctx.editMessageText(specialistsMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleSpecialistProfile(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const specialistId = params[0];
    
    if (!specialistId) {
      await ctx.editMessageText(getMessage('specialist.not_found', language));
      return;
    }
    
    // Get specialist details
    const response = await apiService.getSpecialistById(specialistId);
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const specialist = response.data;
    if (!specialist) {
      await ctx.editMessageText(getMessage('specialist.not_found', language));
      return;
    }

    const profileMessage = MessageFormatter.formatSpecialistProfile(specialist, language);
    const keyboard = KeyboardBuilder.specialistActions(specialistId, language);

    await ctx.editMessageText(profileMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleBookSpecialist(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const specialistId = params[0];
    
    // Get specialist services
    const response = await apiService.getServicesBySpecialist(specialistId);
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const services = response.data || [];
    const servicesMessage = MessageFormatter.formatServiceList(services, language);
    const keyboard = KeyboardBuilder.serviceSelection(specialistId, services, language);

    // Set booking flow
    await sessionManager.setFlow(userId, 'booking', 'select_service');
    await sessionManager.updateBookingFlow(userId, { specialistId });

    await ctx.editMessageText(servicesMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleSelection(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const [type, ...selectionParams] = params;

    switch (type) {
      case 'service':
        await this.handleServiceSelection(ctx, selectionParams);
        break;
      case 'date':
        await this.handleDateSelection(ctx, selectionParams);
        break;
      case 'time':
        await this.handleTimeSelection(ctx, selectionParams);
        break;
    }
  }

  private static async handleServiceSelection(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const [specialistId, serviceId] = params;
    
    // Update booking flow
    await sessionManager.updateBookingFlow(userId, { serviceId });
    
    // Get available dates
    const response = await apiService.getSpecialistAvailability(specialistId);
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const availability = response.data || [];
    const availableDates = availability.map(slot => slot.date);
    
    const dateMessage = getMessage('booking.select_date', language);
    const keyboard = KeyboardBuilder.dateSelection(specialistId, serviceId, availableDates, language);

    await ctx.editMessageText(dateMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleDateSelection(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const [specialistId, serviceId, date] = params;
    
    // Update booking flow
    await sessionManager.updateBookingFlow(userId, { date });
    
    // Get available times for the selected date
    const response = await apiService.getSpecialistAvailability(specialistId, date);
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const availability = response.data || [];
    const dayAvailability = availability.find(slot => slot.date === date);
    const availableTimes = dayAvailability?.slots
      .filter(slot => slot.available)
      .map(slot => slot.time) || [];
    
    const timeMessage = getMessage('booking.select_time', language);
    const keyboard = KeyboardBuilder.timeSelection(specialistId, serviceId, date, availableTimes, language);

    await ctx.editMessageText(timeMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleTimeSelection(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const [specialistId, serviceId, date, time] = params;
    
    // Update booking flow
    await sessionManager.updateBookingFlow(userId, { time });
    
    // Get specialist and service details for confirmation
    const [specialistResponse, serviceResponse] = await Promise.all([
      apiService.getSpecialistById(specialistId),
      apiService.getServiceById(serviceId)
    ]);

    if (!specialistResponse.success || !serviceResponse.success) {
      const errorMessage = MessageFormatter.formatErrorMessage('api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const specialist = specialistResponse.data!;
    const service = serviceResponse.data!;
    
    const confirmationMessage = MessageFormatter.formatBookingConfirmation(
      specialist, service, date, time, language
    );
    const keyboard = KeyboardBuilder.bookingConfirmation(specialistId, serviceId, date, time, language);

    await ctx.editMessageText(confirmationMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleConfirmation(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    if (params[0] === 'booking') {
      const [, specialistId, serviceId, date, time] = params;
      
      // Create the booking
      const bookingResponse = await apiService.createBooking({
        specialistId,
        serviceId,
        date,
        time,
        userId: userId.toString()
      });

      if (!bookingResponse.success) {
        const errorMessage = MessageFormatter.formatErrorMessage(bookingResponse.error || 'booking_failed', language);
        await ctx.editMessageText(errorMessage);
        return;
      }

      const booking = bookingResponse.data!;
      const successMessage = getMessage('booking.confirmed', language, { 
        bookingId: booking.id.slice(-8) 
      });
      
      const keyboard = [
        [{ text: '📋 View Booking Details', callback_data: `booking_details_${booking.id}` }],
        [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
      ];

      // Clear booking flow
      await sessionManager.clearBookingFlow(userId);
      await sessionManager.clearFlow(userId);

      await ctx.editMessageText(successMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });

      logger.info(`Booking created: ${booking.id} for user ${userId}`);
    }
  }

  private static async handleLanguageChange(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const newLanguage = params[0] as any;
    
    if (['en', 'uk', 'ru', 'km'].includes(newLanguage)) {
      await sessionManager.setUserLanguage(userId, newLanguage);
      
      const confirmMessage = getMessage('settings.language_changed', newLanguage);
      const keyboard = KeyboardBuilder.mainMenu(newLanguage);

      await ctx.editMessageText(confirmMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });

      logger.info(`User ${userId} changed language to ${newLanguage}`);
    }
  }

  private static async handleLocationSearch(ctx: BotContext) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    const locationMessage = getMessage('location.request', language);
    
    await ctx.editMessageText(locationMessage, {
      reply_markup: {
        inline_keyboard: [
          [{ text: getMessage('location.share_button', language), callback_data: 'request_location' }],
          [{ text: getMessage('buttons.main_menu', language), callback_data: 'main_menu' }]
        ]
      }
    });

    // Set flow to location sharing
    await sessionManager.setFlow(userId, 'location_sharing');
  }

  private static async handleCallSpecialist(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const specialistId = params[0];
    
    const callMessage = getMessage('specialist.call_info', language);
    const keyboard = KeyboardBuilder.backAndMain(`specialist_${specialistId}`, language);

    await ctx.editMessageText(callMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleMessageSpecialist(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const specialistId = params[0];
    
    const messageInfo = getMessage('specialist.message_info', language);
    const keyboard = KeyboardBuilder.backAndMain(`specialist_${specialistId}`, language);

    await ctx.editMessageText(messageInfo, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleViewPortfolio(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const specialistId = params[0];
    
    const portfolioMessage = getMessage('specialist.portfolio', language);
    const keyboard = KeyboardBuilder.backAndMain(`specialist_${specialistId}`, language);

    await ctx.editMessageText(portfolioMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleViewReviews(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    const specialistId = params[0];
    
    // Get specialist reviews
    const response = await apiService.getSpecialistReviews(specialistId);
    
    if (!response.success) {
      const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'api_error', language);
      await ctx.editMessageText(errorMessage);
      return;
    }

    const reviews = response.data || [];
    const reviewsMessage = MessageFormatter.formatReviewsList(reviews, language);
    const keyboard = KeyboardBuilder.backAndMain(`specialist_${specialistId}`, language);

    await ctx.editMessageText(reviewsMessage, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private static async handleCancelBooking(ctx: BotContext, params: string[]) {
    const userId = ctx.from?.id!;
    const language = await sessionManager.getUserLanguage(userId);
    
    if (params[0] === 'booking') {
      const bookingId = params[1];
      
      // Cancel the booking
      const response = await apiService.cancelBooking(bookingId);
      
      if (!response.success) {
        const errorMessage = MessageFormatter.formatErrorMessage(response.error || 'cancel_failed', language);
        await ctx.editMessageText(errorMessage);
        return;
      }

      const successMessage = getMessage('booking.cancelled', language);
      const keyboard = KeyboardBuilder.mainMenu(language);

      await ctx.editMessageText(successMessage, {
        reply_markup: { inline_keyboard: keyboard }
      });

      logger.info(`Booking cancelled: ${bookingId} by user ${userId}`);
    }
  }
}

export default CallbackHandler;