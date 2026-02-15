import { Telegraf, Context, session } from 'telegraf';
import { Update } from 'typegram';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { AuthService } from '@/services/auth';
import { SpecialistService } from '@/services/specialist';
import { ServiceService } from '@/services/service';
import { BookingService } from '@/services/booking';

interface BotContext extends Context {
  session: {
    user?: any;
    state?: string;
    data?: any;
    language?: string;
  };
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export class TelegramBotService {
  private bot: Telegraf<BotContext>;
  private isInitialized = false;

  // Localization strings
  private messages = {
    en: {
      welcome: '🎉 Welcome to Panhaha!\n\nYour personal booking assistant for finding and booking services in Cambodia.',
      chooseLang: 'Please choose your preferred language:',
      langSet: 'Language set to English 🇺🇸',
      mainMenu: '📋 Main Menu\n\nChoose an option:',
      loginRequired: '🔐 Please log in to your account first.',
      loginSuccess: '✅ Successfully logged in!',
      searchServices: '🔍 Search for services...',
      myBookings: '📅 My bookings',
      profile: '👤 My profile',
      help: '❓ Help & Support',
      back: '◀️ Back',
      cancel: '❌ Cancel',
      done: '✅ Done',
      loading: '⏳ Loading...',
      error: '❌ Something went wrong. Please try again.',
      notFound: '🤷‍♂️ Nothing found.',
      bookingConfirmed: '✅ Your booking has been confirmed!',
      bookingCancelled: '❌ Your booking has been cancelled.',
      enterSearchTerm: 'Enter what you\'re looking for (e.g., "haircut", "massage", "cleaning"):',
      selectService: 'Select a service:',
      selectDate: 'Select a date:',
      selectTime: 'Select a time:',
      confirmBooking: 'Confirm your booking:',
      bookingDetails: '📋 Booking Details:\n\n🏪 Service: {serviceName}\n👤 Specialist: {specialistName}\n📅 Date: {date}\n⏰ Time: {time}\n💰 Price: {price} {currency}',
      registerPrompt: '👤 To use all features, please complete your profile:',
      phoneNumber: '📱 Phone number',
      location: '📍 Location',
      settings: '⚙️ Settings',
      notifications: '🔔 Notifications'
    },
    uk: {
      welcome: '🎉 Ласкаво просимо до МійЗапис!\n\nВаш персональний асистент для пошуку та бронювання послуг по всій Україні.',
      chooseLang: 'Будь ласка, оберіть вашу мову:',
      langSet: 'Встановлено українську мову 🇺🇦',
      mainMenu: '📋 Головне меню\n\nОберіть опцію:',
      loginRequired: '🔐 Спершу увійдіть до вашого акаунту.',
      loginSuccess: '✅ Успішно увійшли!',
      searchServices: '🔍 Пошук послуг...',
      myBookings: '📅 Мої записи',
      profile: '👤 Мій профіль',
      help: '❓ Допомога',
      back: '◀️ Назад',
      cancel: '❌ Скасувати',
      done: '✅ Готово',
      loading: '⏳ Завантаження...',
      error: '❌ Щось пішло не так. Спробуйте ще раз.',
      notFound: '🤷‍♂️ Нічого не знайдено.',
      bookingConfirmed: '✅ Ваш запис підтверджено!',
      bookingCancelled: '❌ Ваш запис скасовано.',
      enterSearchTerm: 'Введіть що ви шукаєте (наприклад, "стрижка", "масаж", "прибирання"):',
      selectService: 'Оберіть послугу:',
      selectDate: 'Оберіть дату:',
      selectTime: 'Оберіть час:',
      confirmBooking: 'Підтвердьте ваш запис:',
      bookingDetails: '📋 Деталі запису:\n\n🏪 Послуга: {serviceName}\n👤 Спеціаліст: {specialistName}\n📅 Дата: {date}\n⏰ Час: {time}\n💰 Ціна: {price} {currency}',
      registerPrompt: '👤 Для використання всіх функцій, будь ласка, заповніть ваш профіль:',
      phoneNumber: '📱 Номер телефону',
      location: '📍 Місцезнаходження',
      settings: '⚙️ Налаштування',
      notifications: '🔔 Сповіщення'
    },
    ru: {
      welcome: '🎉 Добро пожаловать в МойЗапись!\n\nВаш персональный ассистент для поиска и бронирования услуг по всей Украине.',
      chooseLang: 'Пожалуйста, выберите ваш язык:',
      langSet: 'Установлен русский язык 🇷🇺',
      mainMenu: '📋 Главное меню\n\nВыберите опцию:',
      loginRequired: '🔐 Сначала войдите в ваш аккаунт.',
      loginSuccess: '✅ Успешно вошли!',
      searchServices: '🔍 Поиск услуг...',
      myBookings: '📅 Мои записи',
      profile: '👤 Мой профиль',
      help: '❓ Помощь',
      back: '◀️ Назад',
      cancel: '❌ Отменить',
      done: '✅ Готово',
      loading: '⏳ Загрузка...',
      error: '❌ Что-то пошло не так. Попробуйте снова.',
      notFound: '🤷‍♂️ Ничего не найдено.',
      bookingConfirmed: '✅ Ваша запись подтверждена!',
      bookingCancelled: '❌ Ваша запись отменена.',
      enterSearchTerm: 'Введите что вы ищете (например, "стрижка", "массаж", "уборка"):',
      selectService: 'Выберите услугу:',
      selectDate: 'Выберите дату:',
      selectTime: 'Выберите время:',
      confirmBooking: 'Подтвердите вашу запись:',
      bookingDetails: '📋 Детали записи:\n\n🏪 Услуга: {serviceName}\n👤 Специалист: {specialistName}\n📅 Дата: {date}\n⏰ Время: {time}\n💰 Цена: {price} {currency}',
      registerPrompt: '👤 Для использования всех функций, пожалуйста, заполните ваш профиль:',
      phoneNumber: '📱 Номер телефона',
      location: '📍 Местоположение',
      settings: '⚙️ Настройки',
      notifications: '🔔 Уведомления'
    }
  };

  constructor() {
    if (!config.telegram.botToken) {
      logger.warn('Telegram bot token not configured');
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
          state: null,
          data: {},
          language: 'en'
        })
      }));

      // Setup middleware for user authentication
      this.bot.use(async (ctx, next) => {
        if (ctx.from) {
          await this.ensureUser(ctx);
        }
        return next();
      });

      // Setup command handlers
      this.setupCommands();
      
      // Setup callback query handlers
      this.setupCallbacks();

      // Setup message handlers
      this.setupMessages();

      this.isInitialized = true;
      logger.info('Telegram bot initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
    }
  }

  private setupCommands() {
    // Start command
    this.bot.command('start', async (ctx) => {
      const lang = this.getUserLanguage(ctx);
      
      // Show language selection if not set
      if (!ctx.session.language) {
        await this.showLanguageSelection(ctx);
        return;
      }

      await ctx.reply(
        this.messages[lang].welcome,
        this.getMainMenuKeyboard(lang)
      );
    });

    // Menu command
    this.bot.command('menu', async (ctx) => {
      const lang = this.getUserLanguage(ctx);
      await ctx.reply(
        this.messages[lang].mainMenu,
        this.getMainMenuKeyboard(lang)
      );
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      const lang = this.getUserLanguage(ctx);
      const helpText = this.getHelpText(lang);
      await ctx.reply(helpText);
    });

    // Language command
    this.bot.command('language', async (ctx) => {
      await this.showLanguageSelection(ctx);
    });

    // Login command
    this.bot.command('login', async (ctx) => {
      const lang = this.getUserLanguage(ctx);
      const loginUrl = `${config.frontend.url}/auth/telegram?user_id=${ctx.from?.id}`;
      
      await ctx.reply(
        this.messages[lang].loginRequired,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🔐 Login', url: loginUrl }
            ]]
          }
        }
      );
    });

    // My bookings command
    this.bot.command('bookings', async (ctx) => {
      await this.showUserBookings(ctx);
    });
  }

  private setupCallbacks() {
    // Language selection
    this.bot.action(/^lang_(.+)$/, async (ctx) => {
      const language = ctx.match[1];
      ctx.session.language = language;
      
      // Update user language in database
      if (ctx.session.user) {
        await prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { language }
        });
      }

      await ctx.editMessageText(
        this.messages[language as keyof typeof this.messages].langSet
      );

      setTimeout(async () => {
        await ctx.reply(
          this.messages[language as keyof typeof this.messages].mainMenu,
          this.getMainMenuKeyboard(language)
        );
      }, 1000);
    });

    // Main menu actions
    this.bot.action('search_services', async (ctx) => {
      const lang = this.getUserLanguage(ctx);
      ctx.session.state = 'awaiting_search';
      await ctx.reply(this.messages[lang].enterSearchTerm);
    });

    this.bot.action('my_bookings', async (ctx) => {
      await this.showUserBookings(ctx);
    });

    this.bot.action('my_profile', async (ctx) => {
      await this.showUserProfile(ctx);
    });

    // Service selection
    this.bot.action(/^service_(.+)$/, async (ctx) => {
      const serviceId = ctx.match[1];
      await this.showServiceDetails(ctx, serviceId);
    });

    // Booking flow
    this.bot.action(/^book_service_(.+)$/, async (ctx) => {
      const serviceId = ctx.match[1];
      await this.startBookingFlow(ctx, serviceId);
    });

    this.bot.action(/^date_(.+)$/, async (ctx) => {
      const date = ctx.match[1];
      ctx.session.data.selectedDate = date;
      await this.showTimeSlots(ctx);
    });

    this.bot.action(/^time_(.+)$/, async (ctx) => {
      const time = ctx.match[1];
      ctx.session.data.selectedTime = time;
      await this.confirmBooking(ctx);
    });

    this.bot.action('confirm_booking', async (ctx) => {
      await this.createBooking(ctx);
    });

    // Booking management
    this.bot.action(/^booking_(.+)_(.+)$/, async (ctx) => {
      const action = ctx.match[1];
      const bookingId = ctx.match[2];
      
      if (action === 'cancel') {
        await this.cancelBooking(ctx, bookingId);
      } else if (action === 'reschedule') {
        await this.rescheduleBooking(ctx, bookingId);
      }
    });
  }

  private setupMessages() {
    // Handle text messages based on current state
    this.bot.on('text', async (ctx) => {
      const state = ctx.session.state;

      switch (state) {
        case 'awaiting_search':
          await this.handleSearch(ctx, ctx.message.text);
          break;
        default:
          // Default response
          const lang = this.getUserLanguage(ctx);
          await ctx.reply(
            this.messages[lang].mainMenu,
            this.getMainMenuKeyboard(lang)
          );
      }
    });

    // Handle location sharing
    this.bot.on('location', async (ctx) => {
      await this.handleLocation(ctx, ctx.message.location);
    });

    // Handle contact sharing
    this.bot.on('contact', async (ctx) => {
      await this.handleContact(ctx, ctx.message.contact);
    });
  }

  private async ensureUser(ctx: BotContext) {
    if (!ctx.from) return;

    try {
      const telegramUser = ctx.from;
      
      // Try to find existing user
      let user = await prisma.user.findUnique({
        where: { telegramId: telegramUser.id.toString() }
      });

      if (!user) {
        // Create new user via AuthService
        const authData = {
          telegramId: telegramUser.id.toString(),
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name || '',
          username: telegramUser.username,
          authDate: Math.floor(Date.now() / 1000),
          hash: 'telegram_bot_auth' // Special hash for bot users
        };

        const authResult = await AuthService.authenticateTelegram(authData);
        user = authResult.user;
        
        // Set language from Telegram if available
        if (telegramUser.language_code) {
          const language = ['uk', 'ru'].includes(telegramUser.language_code) 
            ? telegramUser.language_code 
            : 'en';
          
          await prisma.user.update({
            where: { id: user.id },
            data: { language }
          });

          ctx.session.language = language;
        }
      }

      ctx.session.user = user;
      
      // Set language from user preferences
      if (user.language && !ctx.session.language) {
        ctx.session.language = user.language;
      }

    } catch (error) {
      logger.error('Error ensuring user in Telegram bot:', error);
    }
  }

  private async showLanguageSelection(ctx: BotContext) {
    await ctx.reply(
      'Please choose your preferred language / សូមជ្រើសរើសភាសា:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🇰🇭 ភាសាខ្មែរ', callback_data: 'lang_km' }],
            [{ text: '🇬🇧 English', callback_data: 'lang_en' }]
          ]
        }
      }
    );
  }

  private async handleSearch(ctx: BotContext, query: string) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      await ctx.reply(this.messages[lang].loading);
      
      const services = await ServiceService.searchServices(
        query,
        undefined, // category
        undefined, // minPrice
        undefined, // maxPrice
        'rating', // sortBy
        1, // page
        10 // limit
      );

      if (services.services.length === 0) {
        await ctx.reply(this.messages[lang].notFound);
        ctx.session.state = null;
        return;
      }

      const keyboard = services.services.map(service => ([
        {
          text: `${service.name} - ${service.basePrice} ${service.currency}`,
          callback_data: `service_${service.id}`
        }
      ]));

      await ctx.reply(
        this.messages[lang].selectService,
        {
          reply_markup: {
            inline_keyboard: keyboard
          }
        }
      );

      ctx.session.state = null;

    } catch (error) {
      logger.error('Search error in Telegram bot:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showServiceDetails(ctx: BotContext, serviceId: string) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      const service = await ServiceService.getService(serviceId);
      
      const text = `🏪 **${service.name}**\n\n` +
                  `📝 ${service.description}\n\n` +
                  `👤 Specialist: ${service.specialist.user.firstName} ${service.specialist.user.lastName}\n` +
                  `⭐ Rating: ${service.specialist.rating}/5 (${service.specialist.reviewCount} reviews)\n` +
                  `⏱️ Duration: ${service.duration} minutes\n` +
                  `💰 Price: ${service.basePrice} ${service.currency}`;

      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📅 Book Now', callback_data: `book_service_${serviceId}` }],
            [{ text: '◀️ Back', callback_data: 'search_services' }]
          ]
        }
      });

    } catch (error) {
      logger.error('Error showing service details:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async startBookingFlow(ctx: BotContext, serviceId: string) {
    const lang = this.getUserLanguage(ctx);

    // Check if user is logged in
    if (!ctx.session.user) {
      await this.showLoginPrompt(ctx);
      return;
    }

    ctx.session.state = 'booking_flow';
    ctx.session.data.serviceId = serviceId;

    // Show available dates (next 30 days)
    const dates = this.getAvailableDates();
    const keyboard = dates.map(date => ([
      {
        text: date.display,
        callback_data: `date_${date.value}`
      }
    ]));

    await ctx.reply(
      this.messages[lang].selectDate,
      {
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  }

  private async showTimeSlots(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    // Mock time slots (in real implementation, check specialist availability)
    const timeSlots = [
      '09:00', '10:00', '11:00', '12:00', 
      '14:00', '15:00', '16:00', '17:00'
    ];

    const keyboard = timeSlots.map(time => ([
      {
        text: time,
        callback_data: `time_${time}`
      }
    ]));

    await ctx.reply(
      this.messages[lang].selectTime,
      {
        reply_markup: {
          inline_keyboard: keyboard
        }
      }
    );
  }

  private async confirmBooking(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      const service = await ServiceService.getService(ctx.session.data.serviceId);
      const date = ctx.session.data.selectedDate;
      const time = ctx.session.data.selectedTime;

      const text = this.formatMessage(
        this.messages[lang].bookingDetails,
        {
          serviceName: service.name,
          specialistName: `${service.specialist.user.firstName} ${service.specialist.user.lastName}`,
          date,
          time,
          price: service.basePrice,
          currency: service.currency
        }
      );

      await ctx.reply(text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Confirm', callback_data: 'confirm_booking' }],
            [{ text: '❌ Cancel', callback_data: 'cancel_booking' }]
          ]
        }
      });

    } catch (error) {
      logger.error('Error confirming booking:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async createBooking(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      const { serviceId, selectedDate, selectedTime } = ctx.session.data;
      
      // Parse date and time
      const bookingDateTime = new Date(`${selectedDate} ${selectedTime}`);
      
      const service = await ServiceService.getService(serviceId);
      
      const booking = await BookingService.createBooking({
        customerId: ctx.session.user.id,
        serviceId,
        scheduledAt: bookingDateTime,
        duration: service.duration
      });

      await ctx.reply(this.messages[lang].bookingConfirmed);
      
      // Clear session data
      ctx.session.state = null;
      ctx.session.data = {};

      // Show booking details and payment link if needed
      const paymentUrl = `${config.frontend.url}/booking/${booking.id}/payment`;
      
      await ctx.reply(
        `Payment required: ${booking.depositAmount} ${booking.customer.currency}`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '💳 Pay Now', url: paymentUrl }
            ]]
          }
        }
      );

    } catch (error) {
      logger.error('Error creating booking:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showUserBookings(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);

    if (!ctx.session.user) {
      await this.showLoginPrompt(ctx);
      return;
    }

    try {
      const bookings = await BookingService.getUserBookings(
        ctx.session.user.id,
        'customer',
        undefined,
        1,
        5
      );

      if (bookings.bookings.length === 0) {
        await ctx.reply(this.messages[lang].notFound);
        return;
      }

      for (const booking of bookings.bookings) {
        const text = this.formatBookingInfo(booking, lang);
        const keyboard = this.getBookingKeyboard(booking, lang);

        await ctx.reply(text, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      }

    } catch (error) {
      logger.error('Error showing user bookings:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showUserProfile(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);

    if (!ctx.session.user) {
      await this.showLoginPrompt(ctx);
      return;
    }

    const user = ctx.session.user;
    
    const text = `👤 **Your Profile**\n\n` +
                `Name: ${user.firstName} ${user.lastName}\n` +
                `Email: ${user.email}\n` +
                `Phone: ${user.phoneNumber || 'Not provided'}\n` +
                `Language: ${user.language}\n` +
                `Loyalty Points: ${user.loyaltyPoints}`;

    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚙️ Settings', url: `${config.frontend.url}/profile/settings` }],
          [{ text: '◀️ Back to Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  }

  private async showLoginPrompt(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const loginUrl = `${config.frontend.url}/auth/telegram?user_id=${ctx.from?.id}`;
    
    await ctx.reply(
      this.messages[lang].loginRequired,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '🔐 Login', url: loginUrl }
          ]]
        }
      }
    );
  }

  // Helper methods
  private getUserLanguage(ctx: BotContext): keyof typeof this.messages {
    return (ctx.session.language || 'en') as keyof typeof this.messages;
  }

  private getMainMenuKeyboard(language: string) {
    const lang = language as keyof typeof this.messages;
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: this.messages[lang].searchServices, callback_data: 'search_services' }],
          [{ text: this.messages[lang].myBookings, callback_data: 'my_bookings' }],
          [{ text: this.messages[lang].profile, callback_data: 'my_profile' }],
          [{ text: this.messages[lang].help, callback_data: 'help' }]
        ]
      }
    };
  }

  private getAvailableDates() {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      dates.push({
        value: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      });
    }
    
    return dates;
  }

  private formatMessage(template: string, data: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  private formatBookingInfo(booking: any, lang: keyof typeof this.messages): string {
    const status = this.getStatusEmoji(booking.status);
    const date = new Date(booking.scheduledAt).toLocaleDateString();
    const time = new Date(booking.scheduledAt).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `${status} **${booking.service.name}**\n\n` +
           `👤 ${booking.specialist.firstName} ${booking.specialist.lastName}\n` +
           `📅 ${date} at ${time}\n` +
           `💰 ${booking.totalAmount} ${booking.customer.currency}\n` +
           `📋 Status: ${booking.status}`;
  }

  private getBookingKeyboard(booking: any, lang: keyof typeof this.messages) {
    const keyboard = [];
    
    if (['PENDING', 'CONFIRMED'].includes(booking.status)) {
      keyboard.push([
        { text: '❌ Cancel', callback_data: `booking_cancel_${booking.id}` }
      ]);
      
      keyboard.push([
        { text: '📅 Reschedule', callback_data: `booking_reschedule_${booking.id}` }
      ]);
    }
    
    keyboard.push([
      { text: '💬 Chat', url: `${config.frontend.url}/messages/booking/${booking.id}` }
    ]);
    
    return keyboard;
  }

  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      'PENDING': '⏳',
      'PENDING_PAYMENT': '💳',
      'CONFIRMED': '✅',
      'IN_PROGRESS': '🔄',
      'COMPLETED': '✅',
      'CANCELLED': '❌',
      'REFUNDED': '💸'
    };
    
    return emojis[status] || '❓';
  }

  private getHelpText(lang: keyof typeof this.messages): string {
    // Return help text based on language
    return `**Help & Support**\n\n` +
           `📞 Support: +380 123 456 789\n` +
           `📧 Email: support@miyzapis.com\n` +
           `🌐 Website: miyzapis.com\n\n` +
           `**Commands:**\n` +
           `/start - Main menu\n` +
           `/menu - Show main menu\n` +
           `/bookings - My bookings\n` +
           `/language - Change language\n` +
           `/help - This help message`;
  }

  private async handleLocation(ctx: BotContext, location: any) {
    // Handle location sharing for finding nearby services
    const lang = this.getUserLanguage(ctx);
    
    try {
      // Store user location
      if (ctx.session.user) {
        await prisma.user.update({
          where: { id: ctx.session.user.id },
          data: {
            // Store location in user profile or separate table
          }
        });
      }

      await ctx.reply('📍 Location saved! Searching for nearby services...');
      
      // Search for services near the location
      // This would require implementing geolocation search in ServiceService
      
    } catch (error) {
      logger.error('Error handling location:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleContact(ctx: BotContext, contact: any) {
    // Handle contact sharing for profile completion
    const lang = this.getUserLanguage(ctx);
    
    try {
      if (ctx.session.user && contact.phone_number) {
        await prisma.user.update({
          where: { id: ctx.session.user.id },
          data: {
            phoneNumber: contact.phone_number,
            isPhoneVerified: true
          }
        });

        await ctx.reply('📱 Phone number updated successfully!');
      }

    } catch (error) {
      logger.error('Error handling contact:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async cancelBooking(ctx: BotContext, bookingId: string) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      await BookingService.cancelBooking(bookingId, ctx.session.user.id, 'Cancelled via Telegram');
      await ctx.reply(this.messages[lang].bookingCancelled);
      
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async rescheduleBooking(ctx: BotContext, bookingId: string) {
    // This would start a reschedule flow similar to booking flow
    const lang = this.getUserLanguage(ctx);
    ctx.session.state = 'reschedule_booking';
    ctx.session.data.bookingId = bookingId;
    
    await ctx.reply('📅 Select new date:');
    // Show date picker...
  }

  // Public methods
  public async launch() {
    if (!this.isInitialized) {
      throw new Error('Bot not initialized');
    }
    
    await this.bot.launch();
    logger.info('Telegram bot launched successfully');
  }

  public async stop() {
    if (this.bot) {
      this.bot.stop();
      logger.info('Telegram bot stopped');
    }
  }

  public getBot() {
    return this.bot;
  }

  // Webhook methods for production
  public async setWebhook() {
    if (!config.telegram.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }
    
    await this.bot.telegram.setWebhook(config.telegram.webhookUrl);
    logger.info('Telegram webhook set successfully');
  }

  public getWebhookCallback() {
    return this.bot.webhookCallback('/webhook/telegram');
  }

  // Send notifications to users
  public async sendNotification(userId: string, message: string, keyboard?: any) {
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
      logger.error('Error sending Telegram notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const telegramBot = new TelegramBotService();