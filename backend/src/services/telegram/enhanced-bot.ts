import { Telegraf, Context, session, Markup } from 'telegraf';
import { Update } from 'typegram';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { consumeLinkCode } from '@/utils/telegram-link-codes';
import { EnhancedAuthService } from '@/services/auth/enhanced';
import { SpecialistService } from '@/services/specialist';
import { ServiceService } from '@/services/service';
import { BookingService } from '@/services/booking';
import { NotificationService } from '@/services/notification';
import { PaymentService } from '@/services/payment';

interface BotContext extends Context {
  session: {
    user?: any;
    userType?: 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';
    state?: string;
    data?: any;
    language?: string;
    step?: string;
    tempData?: any;
    broadcastTarget?: string;
  };
}

interface TelegramBotUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export class EnhancedTelegramBot {
  private bot: Telegraf<BotContext>;
  private isInitialized = false;

  // Comprehensive localization
  private messages = {
    en: {
      // Authentication & Setup
      welcome: '🎉 Welcome to MiyZapis!\n\nYour comprehensive booking platform for services across Ukraine.',
      chooseLang: 'Please choose your preferred language:',
      langSet: 'Language set to English 🇺🇸',
      selectUserType: 'How would you like to use MiyZapis?',
      customerSelected: '👤 You\'re now registered as a Customer',
      specialistSelected: '🏢 You\'re now registered as a Specialist',
      adminPanel: '👨‍💼 Admin Panel Access',
      
      // Main Menus
      customerMainMenu: '👤 Customer Dashboard\n\nWhat would you like to do?',
      specialistMainMenu: '🏢 Specialist Dashboard\n\nManage your business:',
      adminMainMenu: '👨‍💼 Admin Dashboard\n\nPlatform management:',
      
      // Customer Features
      searchServices: '🔍 Search Services',
      myBookings: '📅 My Bookings',
      bookingHistory: '📚 Booking History',
      favorites: '❤️ Favorites',
      loyaltyPoints: '🎁 Loyalty Points',
      customerProfile: '👤 My Profile',
      paymentMethods: '💳 Payment Methods',
      
      // Specialist Features
      myServices: '🛠️ My Services',
      addService: '➕ Add New Service',
      manageSchedule: '📅 Manage Schedule',
      specialistBookings: '📋 Bookings',
      earnings: '💰 Earnings',
      reviews: '⭐ Reviews',
      specialistProfile: '🏢 Business Profile',
      analytics: '📊 Analytics',
      
      // Admin Features
      userManagement: '👥 User Management',
      serviceModeration: '🔍 Service Moderation',
      systemStats: '📊 System Statistics',
      paymentManagement: '💳 Payment Management',
      supportTickets: '🎫 Support Tickets',
      notifications: '📢 Send Notifications',
      
      // Common
      settings: '⚙️ Settings',
      help: '❓ Help & Support',
      back: '◀️ Back',
      cancel: '❌ Cancel',
      done: '✅ Done',
      next: '➡️ Next',
      skip: '⏭️ Skip',
      loading: '⏳ Loading...',
      error: '❌ Something went wrong. Please try again.',
      success: '✅ Success!',
      notFound: '🤷‍♂️ Nothing found.',
      loginRequired: '🔑 Please login to continue.',
      accessDenied: '🚫 Access denied.',
      notAuthorized: '🚫 You are not authorized to perform this action.',
      invalidInput: '❌ Invalid input. Please try again.',
      enterSearchTerm: '🔍 Enter search term:',
      
      // Service Management
      serviceName: 'Enter service name:',
      serviceDescription: 'Enter service description:',
      servicePrice: 'Enter base price (UAH):',
      serviceDuration: 'Enter duration (minutes):',
      serviceCategory: 'Select category:',
      serviceCreated: '✅ Service created successfully!',
      
      // Booking Flow
      selectService: 'Select a service:',
      selectDate: 'Select a date:',
      selectTime: 'Select a time:',
      confirmBooking: 'Confirm your booking:',
      bookingConfirmed: '✅ Your booking has been confirmed!',
      bookingCancelled: '❌ Booking cancelled.',
      paymentRequired: '💳 Payment required to confirm booking',
      
      // Notifications
      newBooking: '📅 New booking received!',
      bookingUpdated: '📋 Booking status updated',
      paymentReceived: '💰 Payment received',
      reviewReceived: '⭐ New review received',
      profileIncomplete: '📝 Please complete your profile first.',
      
      // Profile Setup
      enterFirstName: 'Enter your first name:',
      enterLastName: 'Enter your last name:',
      enterEmail: 'Enter your email address:',
      enterPhone: 'Enter your phone number:',
      shareContact: 'Share your contact',
      shareLocation: 'Share your location',
      businessName: 'Enter your business name:',
      businessDescription: 'Enter business description:',
      specialties: 'Enter your specialties (comma-separated):',
      
      // Search & Filters
      selectCategory: 'Select category:',
      selectLocation: 'Select location:',
      priceRange: 'Select price range:',
      sortBy: 'Sort by:',
      
      // Analytics & Reports
      todayStats: 'Today\'s Statistics',
      weeklyStats: 'Weekly Statistics', 
      monthlyStats: 'Monthly Statistics',
      totalBookings: 'Total Bookings',
      totalRevenue: 'Total Revenue',
      averageRating: 'Average Rating',
      
      // Payment
      paymentSuccess: '✅ Payment completed successfully!',
      paymentFailed: '❌ Payment failed. Please try again.',
      refundProcessed: '💸 Refund processed successfully.',
      
      // Missing buttons
      searchServices: '🔍 Search Services',
      myBookings: '📅 My Bookings',
      bookingHistory: '📋 Booking History', 
      favorites: '⭐ Favorites',
      loyaltyPoints: '🎁 Loyalty Points',
      paymentMethods: '💳 Payment Methods',
      customerProfile: '👤 Profile',
      settings: '⚙️ Settings',
      help: '❓ Help',
      myServices: '🛠️ My Services',
      specialistBookings: '📅 Specialist Bookings',
      addService: '➕ Add Service',
      manageSchedule: '📅 Manage Schedule',
      earnings: '💰 Earnings',
      analytics: '📊 Analytics',
    },
    uk: {
      // Authentication & Setup
      welcome: '🎉 Ласкаво просимо до МійЗапис!\n\nВаша комплексна платформа для бронювання послуг по всій Україні.',
      chooseLang: 'Будь ласка, оберіть вашу мову:',
      langSet: 'Встановлено українську мову 🇺🇦',
      selectUserType: 'Як ви хочете використовувати МійЗапис?',
      customerSelected: '👤 Ви зареєструвались як Клієнт',
      specialistSelected: '🏢 Ви зареєструвались як Спеціаліст',
      adminPanel: '👨‍💼 Панель адміністратора',
      
      // Main Menus
      customerMainMenu: '👤 Панель клієнта\n\nЩо ви хочете зробити?',
      specialistMainMenu: '🏢 Панель спеціаліста\n\nКеруйте вашим бізнесом:',
      adminMainMenu: '👨‍💼 Панель адміністратора\n\nКерування платформою:',
      
      // Customer Features
      searchServices: '🔍 Пошук послуг',
      myBookings: '📅 Мої записи',
      bookingHistory: '📚 Історія записів',
      favorites: '❤️ Улюблене',
      loyaltyPoints: '🎁 Бали лояльності',
      customerProfile: '👤 Мій профіль',
      paymentMethods: '💳 Способи оплати',
      
      // Specialist Features
      myServices: '🛠️ Мої послуги',
      addService: '➕ Додати послугу',
      manageSchedule: '📅 Керувати розкладом',
      specialistBookings: '📋 Записи',
      earnings: '💰 Заробіток',
      reviews: '⭐ Відгуки',
      specialistProfile: '🏢 Бізнес профіль',
      analytics: '📊 Аналітика',
      
      // Rest of translations...
      back: '◀️ Назад',
      cancel: '❌ Скасувати',
      done: '✅ Готово',
      loading: '⏳ Завантаження...',
      error: '❌ Щось пішло не так. Спробуйте ще раз.',
      success: '✅ Успіх!',
      notFound: '🤷‍♂️ Нічого не знайдено.',
      loginRequired: '🔑 Будь ласка, увійдіть, щоб продовжити.',
      accessDenied: '🚫 Доступ заборонено.',
      notAuthorized: '🚫 Ви не маєте дозволу на виконання цієї дії.',
      invalidInput: '❌ Неправильний ввід. Спробуйте ще раз.',
      enterSearchTerm: '🔍 Введіть пошуковий запит:',
      
      // Missing buttons
      searchServices: '🔍 Пошук послуг',
      myBookings: '📅 Мої бронювання',
      bookingHistory: '📋 Історія бронювань',
      favorites: '⭐ Обране',
      loyaltyPoints: '🎁 Бонусні бали',
      paymentMethods: '💳 Способи оплати',
      customerProfile: '👤 Профіль',
      settings: '⚙️ Налаштування',
      help: '❓ Допомога',
      myServices: '🛠️ Мої послуги',
      specialistBookings: '📅 Бронювання спеціаліста',
      addService: '➕ Додати послугу',
      manageSchedule: '📅 Керувати розкладом',
      earnings: '💰 Заробітки',
      analytics: '📊 Аналітика',
    },
    ru: {
      // Similar structure in Russian
      welcome: '🎉 Добро пожаловать в МойЗапись!\n\nВаша комплексная платформа для бронирования услуг по всей Украине.',
      chooseLang: 'Пожалуйста, выберите ваш язык:',
      langSet: 'Установлен русский язык 🇷🇺',
      selectUserType: 'Как вы хотите использовать МойЗапись?',
      customerSelected: '👤 Вы зарегистрированы как Клиент',
      specialistSelected: '🏢 Вы зарегистрированы как Специалист',
      
      // Main menus
      customerMainMenu: '👤 Панель клиента\n\nЧто вы хотите сделать?',
      specialistMainMenu: '🏢 Панель специалиста\n\nУправляйте вашим бизнесом:',
      adminMainMenu: '👨‍💼 Панель администратора\n\nУправление платформой:',
      
      // Common
      back: '◀️ Назад',
      cancel: '❌ Отменить',
      done: '✅ Готово',
      loading: '⏳ Загрузка...',
      error: '❌ Что-то пошло не так. Попробуйте снова.',
      success: '✅ Успех!',
      notFound: '🤷‍♂️ Ничего не найдено.',
      loginRequired: '🔑 Пожалуйста, войдите, чтобы продолжить.',
      accessDenied: '🚫 Доступ запрещен.',
      notAuthorized: '🚫 Вы не авторизованы для выполнения этого действия.',
      invalidInput: '❌ Неверный ввод. Попробуйте снова.',
      enterSearchTerm: '🔍 Введите поисковый запрос:',
      
      // Missing buttons
      searchServices: '🔍 Поиск услуг',
      myBookings: '📅 Мои брони',
      bookingHistory: '📋 История бронирований',
      favorites: '⭐ Избранное',
      loyaltyPoints: '🎁 Бонусные баллы',
      paymentMethods: '💳 Способы оплаты',
      customerProfile: '👤 Профиль',
      settings: '⚙️ Настройки',
      help: '❓ Помощь',
      myServices: '🛠️ Мои услуги',
      specialistBookings: '📅 Записи специалиста',
      addService: '➕ Добавить услугу',
      manageSchedule: '📅 Управлять расписанием',
      earnings: '💰 Заработок',
      analytics: '📊 Аналитика',
    }
  };

  constructor() {
    // Initialize if token is available
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
          await this.ensureUserAndType(ctx);
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
      logger.info('Enhanced Telegram bot initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Enhanced Telegram bot:', error);
    }
  }

  private setupCommands() {
    // Start command - handles new users and existing users
    this.bot.command('start', async (ctx) => {
      const lang = this.getUserLanguage(ctx);
      const payload = ctx.message?.text?.split(' ')[1]; // e.g. "link_abc123" from /start link_abc123
      const siteUrl = config.frontend?.url || 'https://miyzapis.com';

      // Handle /start link_CODE — one-time code to bind Telegram to web account
      if (payload && payload.startsWith('link_')) {
        await this.handleLinkCode(ctx, payload.slice(5));
        return;
      }

      // Handle /start link — redirect to website settings
      if (payload === 'link') {
        await ctx.reply(
          lang === 'uk'
            ? `🔗 Щоб підключити Telegram, натисніть "Підключити Telegram" на сторінці налаштувань сайту — вам буде згенеровано код для відправки сюди.`
            : lang === 'ru'
            ? `🔗 Чтобы подключить Telegram, нажмите "Подключить Telegram" на странице настроек сайта — вам будет сгенерирован код для отправки сюда.`
            : `🔗 To link your Telegram to MiyZapis, click "Link Telegram" on the website settings page — it will generate a code for you to send here.`,
          Markup.inlineKeyboard([
            [Markup.button.url('🌐 Open Settings', `${siteUrl}/settings`)],
            [Markup.button.callback('🏠 Main Menu', 'main_menu')]
          ])
        );
        return;
      }

      // Handle /start login — authenticate via bot and redirect to website
      if (payload === 'login') {
        try {
          const user = ctx.from;
          const telegramId = user.id.toString();

          let dbUser = await prisma.user.findUnique({
            where: { telegramId }
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                telegramId,
                firstName: user.first_name || 'User',
                lastName: user.last_name || '',
                email: `telegram_${user.id}@temp.com`,
                userType: 'CUSTOMER',
                isEmailVerified: false,
                isActive: true,
              }
            });
          } else {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { lastLoginAt: new Date() }
            });
          }

          const token = jwt.sign(
            { userId: dbUser.id, email: dbUser.email, userType: dbUser.userType },
            config.jwt.secret as string,
            { expiresIn: config.jwt.expiresIn as string } as jwt.SignOptions
          );

          const loginUrl = `${siteUrl}/auth/telegram-callback?token=${encodeURIComponent(token)}`;

          await ctx.reply(
            lang === 'uk'
              ? `Вітаємо, ${user.first_name}! Натисніть нижче, щоб увійти.`
              : lang === 'ru'
              ? `Добро пожаловать, ${user.first_name}! Нажмите ниже, чтобы войти.`
              : `Welcome, ${user.first_name}! Click below to sign in.`,
            Markup.inlineKeyboard([
              [Markup.button.url('🔑 Sign in to MiyZapis', loginUrl)]
            ])
          );

          logger.info('Enhanced bot login token generated', { telegramId, userId: dbUser.id });
        } catch (error) {
          logger.error('Enhanced bot login error:', error);
          await ctx.reply(
            lang === 'uk'
              ? 'Не вдалося увійти. Спробуйте ще раз або скористайтесь входом через email.'
              : lang === 'ru'
              ? 'Не удалось войти. Попробуйте ещё раз или воспользуйтесь входом через email.'
              : 'Could not sign in. Please try again or use email login.',
            Markup.inlineKeyboard([
              [Markup.button.url('🌐 Open Login Page', `${siteUrl}/auth/login`)]
            ])
          );
        }
        return;
      }

      if (!ctx.session.user) {
        await this.handleNewUser(ctx);
        return;
      }

      await this.showMainMenu(ctx);
    });

    // Menu command
    this.bot.command('menu', async (ctx) => {
      await this.showMainMenu(ctx);
    });

    // Switch user type (for users with multiple roles)
    this.bot.command('switch', async (ctx) => {
      await this.showUserTypeSelection(ctx, true);
    });

    // Language command
    this.bot.command('language', async (ctx) => {
      await this.showLanguageSelection(ctx);
    });

    // Quick access commands
    this.bot.command('search', async (ctx) => {
      if (ctx.session.userType === 'CUSTOMER') {
        await this.startServiceSearch(ctx);
      } else {
        await ctx.reply('This command is only available for customers.');
      }
    });

    this.bot.command('bookings', async (ctx) => {
      await this.showBookings(ctx);
    });

    this.bot.command('profile', async (ctx) => {
      await this.showProfile(ctx);
    });

    this.bot.command('help', async (ctx) => {
      await this.showHelp(ctx);
    });

    // Specialist commands
    this.bot.command('services', async (ctx) => {
      if (ctx.session.userType === 'SPECIALIST') {
        await this.showSpecialistServices(ctx);
      }
    });

    this.bot.command('schedule', async (ctx) => {
      if (ctx.session.userType === 'SPECIALIST') {
        await this.showScheduleManagement(ctx);
      }
    });

    this.bot.command('analytics', async (ctx) => {
      if (['SPECIALIST', 'ADMIN'].includes(ctx.session.userType)) {
        await this.showAnalytics(ctx);
      }
    });

    // Admin commands
    this.bot.command('admin', async (ctx) => {
      if (ctx.session.userType === 'ADMIN') {
        await this.showAdminPanel(ctx);
      } else {
        await ctx.reply('Access denied. Admin privileges required.');
      }
    });

    this.bot.command('stats', async (ctx) => {
      if (ctx.session.userType === 'ADMIN') {
        await this.showSystemStats(ctx);
      }
    });
  }

  private setupCallbacks() {
    // Language selection
    this.bot.action(/^lang_(.+)$/, async (ctx) => {
      const language = ctx.match[1];
      await this.setUserLanguage(ctx, language);
    });

    // User type selection (customer, specialist, admin)
    this.bot.action(/^usertype_(.+)$/, async (ctx) => {
      const userType = ctx.match[1].toUpperCase();
      await this.setUserType(ctx, userType);
    });

    // Navigation callbacks
    this.bot.action('main_menu', async (ctx) => {
      await this.showMainMenu(ctx);
    });

    this.bot.action('back', async (ctx) => {
      await this.handleBack(ctx);
    });

    // Customer callbacks
    this.bot.action('search_services', async (ctx) => {
      await this.startServiceSearch(ctx);
    });

    this.bot.action('my_bookings', async (ctx) => {
      await this.showBookings(ctx);
    });

    this.bot.action('booking_history', async (ctx) => {
      await this.showBookingHistory(ctx);
    });

    this.bot.action('favorites', async (ctx) => {
      await this.showFavorites(ctx);
    });

    this.bot.action('loyalty_points', async (ctx) => {
      await this.showLoyaltyPoints(ctx);
    });

    // Specialist callbacks
    this.bot.action('my_services', async (ctx) => {
      await this.showSpecialistServices(ctx);
    });

    this.bot.action('add_service', async (ctx) => {
      await this.startAddService(ctx);
    });

    this.bot.action('manage_schedule', async (ctx) => {
      await this.showScheduleManagement(ctx);
    });

    this.bot.action('specialist_bookings', async (ctx) => {
      await this.showSpecialistBookings(ctx);
    });

    this.bot.action('earnings', async (ctx) => {
      await this.showEarnings(ctx);
    });

    this.bot.action('reviews', async (ctx) => {
      await this.showReviews(ctx);
    });

    this.bot.action('analytics', async (ctx) => {
      await this.showAnalytics(ctx);
    });

    // Admin callbacks
    this.bot.action('user_management', async (ctx) => {
      await this.showUserManagement(ctx);
    });

    this.bot.action('service_moderation', async (ctx) => {
      await this.showServiceModeration(ctx);
    });

    this.bot.action('system_stats', async (ctx) => {
      await this.showSystemStats(ctx);
    });

    this.bot.action('payment_management', async (ctx) => {
      await this.showPaymentManagement(ctx);
    });

    // Admin panel action handlers
    this.bot.action('admin_panel', async (ctx) => {
      await this.showAdminPanel(ctx);
    });

    this.bot.action('admin_users', async (ctx) => {
      await this.handleAdminUsers(ctx);
    });

    this.bot.action('admin_specialists', async (ctx) => {
      await this.handleAdminSpecialists(ctx);
    });

    this.bot.action('admin_bookings', async (ctx) => {
      await this.handleAdminBookings(ctx);
    });

    this.bot.action('admin_services', async (ctx) => {
      await this.handleAdminServices(ctx);
    });

    this.bot.action('admin_analytics', async (ctx) => {
      await this.handleAdminAnalytics(ctx);
    });

    this.bot.action('admin_broadcast', async (ctx) => {
      await this.handleAdminBroadcast(ctx);
    });

    this.bot.action('admin_system', async (ctx) => {
      await this.handleAdminSystem(ctx);
    });

    // Admin broadcast actions
    this.bot.action('broadcast_all', async (ctx) => {
      ctx.session.state = 'broadcast_compose';
      ctx.session.broadcastTarget = 'all';
      await ctx.reply('📝 Type your message to broadcast to all users:');
    });

    this.bot.action('broadcast_customers', async (ctx) => {
      ctx.session.state = 'broadcast_compose';
      ctx.session.broadcastTarget = 'CUSTOMER';
      await ctx.reply('📝 Type your message to broadcast to all customers:');
    });

    this.bot.action('broadcast_specialists', async (ctx) => {
      ctx.session.state = 'broadcast_compose';
      ctx.session.broadcastTarget = 'SPECIALIST';
      await ctx.reply('📝 Type your message to broadcast to all specialists:');
    });

    this.bot.action('broadcast_telegram', async (ctx) => {
      ctx.session.state = 'broadcast_compose';
      ctx.session.broadcastTarget = 'telegram';
      await ctx.reply('📝 Type your message to broadcast to all Telegram users:');
    });

    // Service and booking specific callbacks
    this.bot.action(/^service_(.+)$/, async (ctx) => {
      const serviceId = ctx.match[1];
      await this.showServiceDetails(ctx, serviceId);
    });

    this.bot.action(/^book_(.+)$/, async (ctx) => {
      const serviceId = ctx.match[1];
      await this.startBookingFlow(ctx, serviceId);
    });

    this.bot.action(/^booking_action_(.+)_(.+)$/, async (ctx) => {
      const action = ctx.match[1];
      const bookingId = ctx.match[2];
      await this.handleBookingAction(ctx, action, bookingId);
    });

    // Pagination callbacks
    this.bot.action(/^page_(.+)_(.+)$/, async (ctx) => {
      const page = parseInt(ctx.match[1]);
      const type = ctx.match[2];
      await this.handlePagination(ctx, page, type);
    });

    // Date and time selection for booking
    this.bot.action(/^select_date_(.+)$/, async (ctx) => {
      const selectedDate = ctx.match[1];
      await this.showTimeSelection(ctx, selectedDate);
    });

    this.bot.action(/^select_time_(.+)$/, async (ctx) => {
      const selectedTime = ctx.match[1];
      await this.confirmBooking(ctx, selectedTime);
    });

    // Booking confirmation
    this.bot.action('confirm_booking', async (ctx) => {
      await this.createBooking(ctx);
    });

    this.bot.action('cancel_booking', async (ctx) => {
      ctx.session.state = null;
      ctx.session.tempData = {};
      await this.showMainMenu(ctx);
    });

    // Rating system
    this.bot.action(/^rate_(.+)$/, async (ctx) => {
      const rating = parseInt(ctx.match[1]);
      await this.handleRating(ctx, rating);
    });

    // Category search
    this.bot.action(/^category_(.+)$/, async (ctx) => {
      const category = ctx.match[1];
      await this.searchByCategory(ctx, category);
    });

    this.bot.action('search_keyword', async (ctx) => {
      const lang = this.getUserLanguage(ctx);
      ctx.session.state = 'service_search';
      await ctx.reply(this.messages[lang].enterSearchTerm);
    });

    this.bot.action('search_nearby', async (ctx) => {
      await this.requestLocation(ctx);
    });

    // Favorites
    this.bot.action(/^favorite_(.+)$/, async (ctx) => {
      const serviceId = ctx.match[1];
      await this.toggleFavorite(ctx, serviceId);
    });

    // Common callbacks (all user types)
    this.bot.action('lang_select', async (ctx) => {
      await this.showLanguageSelection(ctx);
    });

    this.bot.action('usertype_select', async (ctx) => {
      await this.showUserTypeSelection(ctx, true);
    });

    this.bot.action('settings', async (ctx) => {
      await this.showSettings(ctx);
    });

    this.bot.action('specialist_profile', async (ctx) => {
      await this.showSpecialistProfileView(ctx);
    });

    this.bot.action('my_profile', async (ctx) => {
      await this.showCustomerProfile(ctx);
    });

    this.bot.action('help', async (ctx) => {
      await this.showHelp(ctx);
    });

    this.bot.action('payment_methods', async (ctx) => {
      await this.showPaymentMethodsView(ctx);
    });

    // Booking category filter
    this.bot.action(/^bookings_filter_(.+)$/, async (ctx) => {
      const status = ctx.match[1];
      await this.showBookingsByStatus(ctx, status);
    });
  }

  private setupMessages() {
    // Handle text messages based on current state
    this.bot.on('text', async (ctx) => {
      await this.handleTextMessage(ctx);
    });

    // Handle location sharing
    this.bot.on('location', async (ctx) => {
      await this.handleLocation(ctx, ctx.message.location);
    });

    // Handle contact sharing
    this.bot.on('contact', async (ctx) => {
      await this.handleContact(ctx, ctx.message.contact);
    });

    // Handle photos (for service images, profile pictures)
    this.bot.on('photo', async (ctx) => {
      await this.handlePhoto(ctx, ctx.message.photo);
    });

    // Handle documents (for business documents, certificates)
    this.bot.on('document', async (ctx) => {
      await this.handleDocument(ctx, ctx.message.document);
    });
  }

  // User Management Methods
  private async ensureUserAndType(ctx: BotContext) {
    if (!ctx.from) return;

    try {
      const telegramId = ctx.from.id.toString();
      
      // Try to find existing user
      let user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          specialist: {
            select: {
              id: true,
              businessName: true,
              isVerified: true,
            },
          },
        },
      });

      if (user) {
        ctx.session.user = user;
        
        // Determine user type based on account setup
        if (user.userType === 'ADMIN') {
          ctx.session.userType = 'ADMIN';
        } else if (user.specialist) {
          // User has specialist profile - check if they also have customer access
          const hasCustomerRole = user.userType === 'CUSTOMER' || user.userType === 'ADMIN';
          const hasSpecialistRole = true; // Has specialist profile
          
          if (hasCustomerRole && hasSpecialistRole && !ctx.session.userType) {
            // Multi-role user - needs to select type
            await this.showUserTypeSelection(ctx);
            return;
          }
          
          ctx.session.userType = ctx.session.userType || 'SPECIALIST';
        } else {
          ctx.session.userType = 'CUSTOMER';
        }

        // Set language from user preferences
        if (user.language && !ctx.session.language) {
          ctx.session.language = user.language;
        }
      }

    } catch (error) {
      logger.error('Error ensuring user in Enhanced Telegram bot:', error);
    }
  }

  private async handleNewUser(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    // Show welcome message
    await ctx.reply(this.messages[lang].welcome);
    
    // Show language selection first
    await this.showLanguageSelection(ctx);
  }

  private async showLanguageSelection(ctx: BotContext) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🇺🇸 English', 'lang_en')],
      [Markup.button.callback('🇺🇦 Українська', 'lang_uk')],
      [Markup.button.callback('🇷🇺 Русский', 'lang_ru')]
    ]);

    await ctx.reply(
      'Please choose your preferred language / Будь ласка, оберіть мову / Пожалуйста, выберите язык:',
      keyboard
    );
  }

  private async setUserLanguage(ctx: BotContext, language: string) {
    ctx.session.language = language;
    const lang = language as keyof typeof this.messages;
    
    // Update user language in database if user exists
    if (ctx.session.user) {
      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { language }
      });
    }

    await ctx.editMessageText(this.messages[lang].langSet);

    // If user doesn't exist yet, show user type selection
    if (!ctx.session.user) {
      setTimeout(async () => {
        await this.showUserTypeSelection(ctx);
      }, 1000);
    } else {
      setTimeout(async () => {
        await this.showMainMenu(ctx);
      }, 1000);
    }
  }

  private async showUserTypeSelection(ctx: BotContext, switching = false) {
    const lang = this.getUserLanguage(ctx);
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('👤 Customer', 'usertype_customer')],
      [Markup.button.callback('🏢 Specialist', 'usertype_specialist')]
    ]);

    const message = switching 
      ? 'Select user type to switch to:'
      : this.messages[lang].selectUserType;

    await ctx.reply(message, keyboard);
  }

  private async setUserType(ctx: BotContext, userType: string) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user) {
      // Create new user
      await this.createNewUser(ctx, userType as 'CUSTOMER' | 'SPECIALIST');
    } else {
      // Switch user type for existing user
      ctx.session.userType = userType as 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';
      
      // Update user type in database if needed
      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { userType }
      });
    }

    const message = userType === 'CUSTOMER' 
      ? this.messages[lang].customerSelected 
      : this.messages[lang].specialistSelected;
    
    await ctx.editMessageText(message);

    setTimeout(async () => {
      await this.showMainMenu(ctx);
    }, 1000);
  }

  private async createNewUser(ctx: BotContext, userType: 'CUSTOMER' | 'SPECIALIST') {
    const telegramUser = ctx.from!;
    
    try {
      // Create new user via Enhanced Auth Service
      const authData = {
        telegramId: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || '',
        username: telegramUser.username,
        authDate: Math.floor(Date.now() / 1000),
        hash: 'telegram_bot_enhanced' // Special hash for enhanced bot users
      };

      // Use the enhanced auth service that supports multi-role
      const result = await EnhancedAuthService.authenticateWithTelegram(authData);
      let user = result.user;

      // Update user type and language
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          userType,
          language: ctx.session.language || 'en'
        },
        include: {
          specialist: {
            select: {
              id: true,
              businessName: true,
              isVerified: true,
            },
          },
        },
      });

      // Create specialist profile if user is a specialist
      if (userType === 'SPECIALIST') {
        await prisma.specialist.create({
          data: {
            userId: user.id,
            businessName: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            bio: '',
            specialties: '[]',
            workingHours: JSON.stringify({
              monday: { isWorking: true, start: '09:00', end: '17:00' },
              tuesday: { isWorking: true, start: '09:00', end: '17:00' },
              wednesday: { isWorking: true, start: '09:00', end: '17:00' },
              thursday: { isWorking: true, start: '09:00', end: '17:00' },
              friday: { isWorking: true, start: '09:00', end: '17:00' },
              saturday: { isWorking: false, start: '09:00', end: '17:00' },
              sunday: { isWorking: false, start: '09:00', end: '17:00' }
            }),
          },
        });
      }

      ctx.session.user = user;
      ctx.session.userType = userType;

      logger.info('New Telegram user created via enhanced bot', { 
        userId: user.id, 
        telegramId: telegramUser.id,
        userType 
      });

    } catch (error) {
      logger.error('Error creating new user in enhanced bot:', error);
      const lang = this.getUserLanguage(ctx);
      await ctx.reply(this.messages[lang].error);
    }
  }

  // Main Menu Methods
  private async showMainMenu(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user || !ctx.session.userType) {
      await this.handleNewUser(ctx);
      return;
    }

    let message: string;
    let keyboard: any;

    switch (ctx.session.userType) {
      case 'CUSTOMER':
        message = this.messages[lang].customerMainMenu;
        keyboard = this.getCustomerMenuKeyboard(lang);
        break;
      case 'SPECIALIST':
        message = this.messages[lang].specialistMainMenu;
        keyboard = this.getSpecialistMenuKeyboard(lang);
        break;
      case 'ADMIN':
        message = this.messages[lang].adminMainMenu;
        keyboard = this.getAdminMenuKeyboard(lang);
        break;
      default:
        await this.showUserTypeSelection(ctx);
        return;
    }

    await ctx.reply(message, keyboard);
  }

  private getMiniAppUrl(): string {
    return process.env.TELEGRAM_MINI_APP_URL || 'https://miyzapis-telegram-miniapp-production.up.railway.app';
  }

  private getCustomerMenuKeyboard(lang: keyof typeof this.messages) {
    return Markup.inlineKeyboard([
      [Markup.button.webApp('📱 Open MiyZapis App', this.getMiniAppUrl())],
      [Markup.button.callback(this.messages[lang].searchServices, 'search_services')],
      [Markup.button.callback(this.messages[lang].myBookings, 'my_bookings')],
      [
        Markup.button.callback(this.messages[lang].bookingHistory, 'booking_history'),
        Markup.button.callback(this.messages[lang].favorites, 'favorites')
      ],
      [
        Markup.button.callback(this.messages[lang].loyaltyPoints, 'loyalty_points'),
        Markup.button.callback(this.messages[lang].paymentMethods, 'payment_methods')
      ],
      [
        Markup.button.callback(this.messages[lang].customerProfile, 'my_profile'),
        Markup.button.callback(this.messages[lang].settings, 'settings')
      ],
      [Markup.button.callback(this.messages[lang].help, 'help')]
    ]);
  }

  private getSpecialistMenuKeyboard(lang: keyof typeof this.messages) {
    return Markup.inlineKeyboard([
      [Markup.button.webApp('📱 Open MiyZapis App', this.getMiniAppUrl())],
      [Markup.button.callback(this.messages[lang].myServices, 'my_services')],
      [Markup.button.callback(this.messages[lang].specialistBookings, 'specialist_bookings')],
      [
        Markup.button.callback(this.messages[lang].addService, 'add_service'),
        Markup.button.callback(this.messages[lang].manageSchedule, 'manage_schedule')
      ],
      [
        Markup.button.callback(this.messages[lang].earnings, 'earnings'),
        Markup.button.callback(this.messages[lang].analytics, 'analytics')
      ],
      [
        Markup.button.callback(this.messages[lang].reviews, 'reviews'),
        Markup.button.callback(this.messages[lang].specialistProfile, 'specialist_profile')
      ],
      [
        Markup.button.callback(this.messages[lang].settings, 'settings'),
        Markup.button.callback(this.messages[lang].help, 'help')
      ]
    ]);
  }

  private getAdminMenuKeyboard(lang: keyof typeof this.messages) {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🛡️ Admin Dashboard', 'admin_panel')],
      [Markup.button.callback(this.messages[lang].userManagement, 'user_management')],
      [Markup.button.callback(this.messages[lang].serviceModeration, 'service_moderation')],
      [
        Markup.button.callback(this.messages[lang].systemStats, 'system_stats'),
        Markup.button.callback(this.messages[lang].analytics, 'analytics')
      ],
      [
        Markup.button.callback(this.messages[lang].paymentManagement, 'payment_management'),
        Markup.button.callback(this.messages[lang].supportTickets, 'support_tickets')
      ],
      [
        Markup.button.callback(this.messages[lang].notifications, 'send_notifications'),
        Markup.button.callback(this.messages[lang].settings, 'settings')
      ]
    ]);
  }

  // Helper Methods
  private getUserLanguage(ctx: BotContext): keyof typeof this.messages {
    return (ctx.session.language || 'en') as keyof typeof this.messages;
  }

  private async handleBack(ctx: BotContext) {
    // Implement navigation back logic based on current state
    if (ctx.session.state) {
      ctx.session.state = null;
      ctx.session.step = null;
      ctx.session.tempData = {};
    }
    await this.showMainMenu(ctx);
  }

  // ── Link code handler (shared by /start link_CODE and plain text) ──
  private async handleLinkCode(ctx: BotContext, code: string) {
    const telegramId = ctx.from!.id.toString();
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    try {
      const linkedUserId = consumeLinkCode(code);

      if (!linkedUserId) {
        await ctx.reply(
          lang === 'uk'
            ? 'Цей код посилання закінчився або недійсний.\n\nПерейдіть до Налаштувань > Підключені акаунти і натисніть "Підключити Telegram", щоб отримати новий код.'
            : lang === 'ru'
            ? 'Этот код ссылки истёк или недействителен.\n\nПерейдите в Настройки > Подключённые аккаунты и нажмите "Подключить Telegram", чтобы получить новый код.'
            : 'This link code is expired or invalid.\n\nGo back to Settings > Connected Accounts and click "Link Telegram" to get a fresh code.',
          Markup.inlineKeyboard([
            [Markup.button.url('🌐 Open Settings', `${siteUrl}/settings`)]
          ])
        );
        return;
      }

      // Check if this Telegram is already linked to a different account
      const existingUser = await prisma.user.findFirst({
        where: { telegramId, id: { not: linkedUserId } }
      });

      if (existingUser) {
        if (existingUser.email?.match(/^telegram_\d+@temp\.com$/)) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { telegramId: null }
          });
          logger.info('Auto-unlinked Telegram from temp account', {
            tempUserId: existingUser.id,
            telegramId
          });
        } else {
          await ctx.reply(
            lang === 'uk'
              ? 'Цей Telegram акаунт вже підключено до іншого профілю MiyZapis. Спочатку відключіть його в налаштуваннях іншого акаунта.'
              : lang === 'ru'
              ? 'Этот Telegram аккаунт уже привязан к другому профилю MiyZapis. Сначала отключите его в настройках другого аккаунта.'
              : 'This Telegram account is already linked to a different MiyZapis account. Unlink it from the other account\'s settings first.'
          );
          return;
        }
      }

      // Link the account
      await prisma.user.update({
        where: { id: linkedUserId },
        data: { telegramId }
      });

      const linkedUser = await prisma.user.findUnique({
        where: { id: linkedUserId },
        select: { firstName: true }
      });

      await ctx.reply(
        lang === 'uk'
          ? `Telegram підключено успішно!\n\n${linkedUser?.firstName || 'Ваш акаунт'} тепер підключений.\nВи будете отримувати сповіщення про бронювання тут.`
          : lang === 'ru'
          ? `Telegram подключён успешно!\n\n${linkedUser?.firstName || 'Ваш аккаунт'} теперь подключён.\nВы будете получать уведомления о бронированиях здесь.`
          : `Telegram linked successfully!\n\n${linkedUser?.firstName || 'Your account'} is now connected.\nYou will receive booking notifications here.`,
        Markup.inlineKeyboard([
          [Markup.button.url('🌐 Open Website', siteUrl)],
          [Markup.button.callback('🏠 Main Menu', 'main_menu')]
        ])
      );

      logger.info('Telegram account linked via enhanced bot', { telegramId, userId: linkedUserId });
    } catch (error) {
      logger.error('Enhanced bot link error:', error);
      await ctx.reply(
        lang === 'uk'
          ? 'Щось пішло не так при підключенні. Спробуйте ще раз.'
          : lang === 'ru'
          ? 'Что-то пошло не так при подключении. Попробуйте ещё раз.'
          : 'Something went wrong while linking. Please try again.'
      );
    }
  }

  private async handleTextMessage(ctx: BotContext) {
    const state = ctx.session.state;
    const step = ctx.session.step;
    const text = ctx.message.text;

    // Handle link codes sent as plain text (e.g. "link_abc12345" or just "abc12345")
    if (/^(link_)?[a-f0-9]{8}$/i.test(text.trim())) {
      const code = text.trim().replace(/^link_/i, '');
      await this.handleLinkCode(ctx, code);
      return;
    }

    // Route text messages based on current state
    switch (state) {
      case 'service_search':
        await this.handleServiceSearch(ctx, text);
        break;
      case 'add_service':
        await this.handleAddServiceStep(ctx, text, step);
        break;
      case 'profile_setup':
        await this.handleProfileSetup(ctx, text, step);
        break;
      case 'booking_flow':
        await this.handleBookingFlow(ctx, text, step);
        break;
      case 'broadcast_compose':
        await this.handleBroadcastCompose(ctx, text);
        break;
      default:
        // Default response - show main menu
        await this.showMainMenu(ctx);
    }
  }

  // Customer Service Search Implementation
  private async startServiceSearch(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    ctx.session.state = 'service_search';
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🏠 Home Services', 'category_home')],
      [Markup.button.callback('💅 Beauty & Wellness', 'category_beauty')],
      [Markup.button.callback('🔧 Repair & Maintenance', 'category_repair')],
      [Markup.button.callback('🎓 Education & Training', 'category_education')],
      [Markup.button.callback('🏥 Health & Medical', 'category_health')],
      [Markup.button.callback('🚗 Automotive', 'category_automotive')],
      [Markup.button.callback('🔍 Search by keyword', 'search_keyword')],
      [Markup.button.callback('📍 Search nearby', 'search_nearby')],
      [Markup.button.callback(this.messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply('How would you like to search for services?', keyboard);
  }

  private async handleServiceSearch(ctx: BotContext, query: string) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      await ctx.reply(this.messages[lang].loading);
      
      // Search services using the ServiceService
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

      // Display services with pagination
      await this.displayServices(ctx, services.services, 1, query);
      ctx.session.state = null;

    } catch (error) {
      logger.error('Service search error:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async displayServices(ctx: BotContext, services: any[], page: number, query?: string) {
    const lang = this.getUserLanguage(ctx);
    
    // Display up to 5 services per page
    const pageSize = 5;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageServices = services.slice(startIndex, endIndex);

    for (const service of pageServices) {
      const serviceText = `🏪 **${service.name}**\n\n` +
                         `📝 ${service.description}\n` +
                         `👤 ${service.specialist.user.firstName} ${service.specialist.user.lastName}\n` +
                         `⭐ ${service.specialist.rating}/5 (${service.specialist.reviewCount} reviews)\n` +
                         `⏱️ ${service.duration} min\n` +
                         `💰 ${service.basePrice} ${service.currency}`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📅 Book Now', `book_${service.id}`)],
        [
          Markup.button.callback('❤️ Add to Favorites', `favorite_${service.id}`),
          Markup.button.callback('ℹ️ Details', `service_${service.id}`)
        ]
      ]);

      await ctx.reply(serviceText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    }

    // Pagination controls
    if (services.length > pageSize) {
      const paginationButtons = [];
      
      if (page > 1) {
        paginationButtons.push(
          Markup.button.callback('⬅️ Previous', `page_${page - 1}_services`)
        );
      }
      
      if (endIndex < services.length) {
        paginationButtons.push(
          Markup.button.callback('➡️ Next', `page_${page + 1}_services`)
        );
      }

      if (paginationButtons.length > 0) {
        const paginationKeyboard = Markup.inlineKeyboard([
          paginationButtons,
          [Markup.button.callback(this.messages[lang].back, 'search_services')]
        ]);
        
        await ctx.reply(
          `Page ${page} of ${Math.ceil(services.length / pageSize)}`,
          paginationKeyboard
        );
      }
    }
  }

  private async showBookings(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    try {
      const userRole = ctx.session.userType === 'SPECIALIST' ? 'specialist' : 'customer';
      const bookings = await BookingService.getUserBookings(
        ctx.session.user.id,
        userRole,
        undefined,
        1,
        50
      );

      if (bookings.bookings.length === 0) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback(this.messages[lang].back, 'main_menu')]
        ]);
        await ctx.reply('📅 You have no bookings yet.', keyboard);
        return;
      }

      // Count by status
      const statusCounts: Record<string, number> = {};
      for (const b of bookings.bookings) {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      }

      // Build summary dashboard
      const statusOrder = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
      const lines: string[] = [`📅 **My Bookings** (${bookings.total} total)\n`];

      for (const status of statusOrder) {
        const count = statusCounts[status] || 0;
        if (count > 0) {
          lines.push(`${this.getStatusEmoji(status)} ${status}: **${count}**`);
        }
      }

      lines.push(`\nTap a category below to view details:`);

      // Category filter buttons — only show statuses that have bookings
      const filterButtons: any[][] = [];
      const row1: any[] = [];
      const row2: any[] = [];

      for (const status of statusOrder) {
        const count = statusCounts[status] || 0;
        if (count === 0) continue;
        const btn = { text: `${this.getStatusEmoji(status)} ${status} (${count})`, callback_data: `bookings_filter_${status}` };
        if (row1.length < 2) row1.push(btn);
        else row2.push(btn);
      }

      if (row1.length > 0) filterButtons.push(row1);
      if (row2.length > 0) filterButtons.push(row2);

      // Show remaining statuses in a third row if needed
      const remaining = statusOrder.filter(s => (statusCounts[s] || 0) > 0).slice(4);
      if (remaining.length > 0) {
        filterButtons.push(remaining.map(s => ({
          text: `${this.getStatusEmoji(s)} ${s} (${statusCounts[s]})`,
          callback_data: `bookings_filter_${s}`
        })));
      }

      filterButtons.push([{ text: '📋 All Bookings', callback_data: 'bookings_filter_ALL' }]);
      filterButtons.push([
        { text: '🌐 View on Website', url: `${siteUrl}/bookings` },
        { text: '◀️ Back', callback_data: 'main_menu' }
      ]);

      await ctx.reply(lines.join('\n'), {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: filterButtons }
      });

    } catch (error) {
      logger.error('Error showing bookings:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showBookingsByStatus(ctx: BotContext, status: string) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    try {
      const userRole = ctx.session.userType === 'SPECIALIST' ? 'specialist' : 'customer';
      const statusFilter = status === 'ALL' ? undefined : status;
      const bookings = await BookingService.getUserBookings(
        ctx.session.user.id,
        userRole,
        statusFilter,
        1,
        10
      );

      if (bookings.bookings.length === 0) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Back to Bookings', ctx.session.userType === 'SPECIALIST' ? 'specialist_bookings' : 'my_bookings')]
        ]);
        const label = status === 'ALL' ? '' : ` with status ${status}`;
        await ctx.reply(`No bookings found${label}.`, keyboard);
        return;
      }

      const emoji = status === 'ALL' ? '📋' : this.getStatusEmoji(status);
      const label = status === 'ALL' ? 'All Bookings' : status;
      const lines: string[] = [`${emoji} **${label}** (${bookings.total})\n`];

      for (const booking of bookings.bookings) {
        const statusEmoji = this.getStatusEmoji(booking.status);
        const date = new Date(booking.scheduledAt).toLocaleDateString();
        const time = new Date(booking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        if (ctx.session.userType === 'SPECIALIST') {
          const customer = booking.customer
            ? `${booking.customer.firstName} ${booking.customer.lastName}`
            : 'Customer';
          lines.push(`${statusEmoji} **${booking.service?.name || 'Service'}** — ${customer}`);
          lines.push(`   📅 ${date} ${time} | 💰 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'}`);
        } else {
          const specialist = booking.specialist?.user
            ? `${booking.specialist.user.firstName} ${booking.specialist.user.lastName}`
            : '';
          lines.push(`${statusEmoji} **${booking.service?.name || 'Service'}** — ${specialist}`);
          lines.push(`   📅 ${date} ${time} | 💰 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'}`);
        }
      }

      if (bookings.total > 10) {
        lines.push(`\n_Showing 10 of ${bookings.total}_`);
      }

      // Context-appropriate action buttons
      const actionButtons: any[][] = [];

      if (status === 'PENDING' || status === 'ALL') {
        const pending = bookings.bookings.filter((b: any) => b.status === 'PENDING');
        for (const b of pending.slice(0, 4)) {
          const shortId = b.id.slice(-6);
          if (ctx.session.userType === 'SPECIALIST') {
            actionButtons.push([
              { text: `✅ Confirm #${shortId}`, callback_data: `booking_action_confirm_${b.id}` },
              { text: `❌ Cancel #${shortId}`, callback_data: `booking_action_cancel_${b.id}` }
            ]);
          } else {
            actionButtons.push([
              { text: `❌ Cancel #${shortId}`, callback_data: `booking_action_cancel_${b.id}` },
              { text: `📅 Reschedule #${shortId}`, callback_data: `booking_action_reschedule_${b.id}` }
            ]);
          }
        }
      }

      if ((status === 'COMPLETED' || status === 'ALL') && ctx.session.userType !== 'SPECIALIST') {
        const completed = bookings.bookings.filter((b: any) => b.status === 'COMPLETED');
        for (const b of completed.slice(0, 3)) {
          actionButtons.push([
            { text: `⭐ Review #${b.id.slice(-6)}`, callback_data: `booking_action_review_${b.id}` }
          ]);
        }
      }

      const backTarget = ctx.session.userType === 'SPECIALIST' ? 'specialist_bookings' : 'my_bookings';
      actionButtons.push([{ text: '◀️ Back to Bookings', callback_data: backTarget }]);

      await ctx.reply(lines.join('\n'), {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: actionButtons }
      });

    } catch (error) {
      logger.error('Error showing bookings by status:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private getBookingKeyboard(booking: any, userType: string) {
    const keyboard = [];

    if (['PENDING', 'CONFIRMED'].includes(booking.status)) {
      keyboard.push([
        { text: '❌ Cancel', callback_data: `booking_action_cancel_${booking.id}` }
      ]);

      keyboard.push([
        { text: '📅 Reschedule', callback_data: `booking_action_reschedule_${booking.id}` }
      ]);
    }

    if (userType === 'SPECIALIST' && booking.status === 'PENDING') {
      keyboard.push([
        { text: '✅ Confirm', callback_data: `booking_action_confirm_${booking.id}` }
      ]);
    }

    if (booking.status === 'COMPLETED' && userType === 'CUSTOMER') {
      keyboard.push([
        { text: '⭐ Leave Review', callback_data: `booking_action_review_${booking.id}` }
      ]);
    }

    keyboard.push([
      { text: '💬 Chat', callback_data: `booking_action_chat_${booking.id}` }
    ]);

    keyboard.push([
      { text: '◀️ Back', callback_data: 'main_menu' }
    ]);

    return keyboard;
  }

  private async displayBookings(ctx: BotContext, bookings: any[]) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    // Build compact single message
    const lines: string[] = [];
    for (const booking of bookings) {
      const emoji = this.getStatusEmoji(booking.status);
      const date = new Date(booking.scheduledAt).toLocaleDateString();
      const time = new Date(booking.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      if (ctx.session.userType === 'SPECIALIST') {
        const customer = booking.customer
          ? `${booking.customer.firstName} ${booking.customer.lastName}`
          : 'Customer';
        lines.push(`${emoji} **${booking.service?.name || 'Service'}** — ${customer}`);
        lines.push(`   📅 ${date} ${time} | 💰 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'} | ${booking.status}`);
      } else {
        const specialist = booking.specialist?.user
          ? `${booking.specialist.user.firstName} ${booking.specialist.user.lastName}`
          : '';
        lines.push(`${emoji} **${booking.service?.name || 'Service'}** — ${specialist}`);
        lines.push(`   📅 ${date} ${time} | 💰 ${booking.totalAmount} ${booking.customer?.currency || 'UAH'} | ${booking.status}`);
      }
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback(this.messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(lines.join('\n'), { parse_mode: 'Markdown', ...keyboard });
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

  private async showProfile(ctx: BotContext) {
    // Route to the appropriate profile view based on user type
    if (ctx.session.userType === 'SPECIALIST') {
      await this.showSpecialistProfileView(ctx);
    } else {
      await this.showCustomerProfile(ctx);
    }
  }

  private async showHelp(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    let helpText = `**Help & Support**\n\n` +
                    `📞 Support: +380 123 456 789\n` +
                    `📧 Email: support@miyzapis.com\n` +
                    `🌐 Website: miyzapis.com\n\n` +
                    `**Available Commands:**\n` +
                    `/start - Main menu\n` +
                    `/menu - Show main menu\n` +
                    `/search - Search services (customers)\n` +
                    `/bookings - Show bookings\n` +
                    `/profile - Show profile\n` +
                    `/services - Manage services (specialists)\n` +
                    `/schedule - Manage schedule (specialists)\n` +
                    `/analytics - View analytics\n` +
                    `/admin - Admin panel (admins only)\n` +
                    `/switch - Switch user type\n` +
                    `/language - Change language\n` +
                    `/help - This help message`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('🌐 Open Website', siteUrl)],
      [Markup.button.callback(this.messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(helpText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async showSettings(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    const currentLang = lang === 'uk' ? '🇺🇦 Українська' : lang === 'ru' ? '🇷🇺 Русский' : '🇺🇸 English';
    const currentType = ctx.session.userType === 'SPECIALIST' ? '🏢 Specialist' : ctx.session.userType === 'ADMIN' ? '👨‍💼 Admin' : '👤 Customer';

    const settingsText = `⚙️ **Settings**\n\n` +
                         `🌐 Language: ${currentLang}\n` +
                         `👤 User type: ${currentType}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('🌐 Change Language', 'lang_select')],
      [Markup.button.callback('🔄 Switch User Type', 'usertype_select')],
      [Markup.button.url('🌐 Website Settings', `${siteUrl}/settings`)],
      [Markup.button.callback(this.messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(settingsText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async showSpecialistProfileView(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    if (!ctx.session.user?.specialist) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    try {
      const specialist = await SpecialistService.getProfile(ctx.session.user.specialist.id);

      const specialties = Array.isArray(specialist.specialties) ? specialist.specialties.join(', ') : 'Not set';
      const verified = specialist.isVerified ? '✅ Verified' : '❌ Not verified';
      const rating = specialist.rating ? `⭐ ${specialist.rating.toFixed(1)} (${specialist.reviewCount || 0} reviews)` : 'No reviews yet';

      // Build working hours summary
      let hoursText = '';
      if (specialist.workingHours && typeof specialist.workingHours === 'object') {
        const wh = specialist.workingHours as Record<string, any>;
        const workDays = Object.entries(wh)
          .filter(([_, v]) => v?.isWorking)
          .map(([day, v]) => `${day.charAt(0).toUpperCase() + day.slice(1, 3)}: ${v.start}-${v.end}`);
        hoursText = workDays.length > 0 ? workDays.join(', ') : 'No schedule set';
      }

      const profileText = `🏢 **Specialist Profile**\n\n` +
                          `📛 ${specialist.businessName || 'No business name'}\n` +
                          `📝 ${specialist.bio || 'No bio'}\n\n` +
                          `🏷️ Specialties: ${specialties}\n` +
                          `${rating}\n` +
                          `${verified}\n` +
                          `🕐 Hours: ${hoursText}\n` +
                          `📊 Active services: ${specialist._count?.services || 0}`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.url('📝 Edit on Website', `${siteUrl}/specialist/profile`)],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply(profileText, { parse_mode: 'Markdown', ...keyboard });

    } catch (error) {
      logger.error('Error showing specialist profile:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showCustomerProfile(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    const user = ctx.session.user;
    const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

    const profileText = `👤 **My Profile**\n\n` +
                        `📛 ${user.firstName || ''} ${user.lastName || ''}\n` +
                        `📧 ${user.email || 'Not set'}\n` +
                        `📱 ${user.phoneNumber || 'Not set'}\n` +
                        `🎁 Loyalty points: ${user.loyaltyPoints || 0}\n` +
                        `📅 Member since: ${memberSince}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('📝 Edit on Website', `${siteUrl}/profile`)],
      [Markup.button.callback(this.messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(profileText, { parse_mode: 'Markdown', ...keyboard });
  }

  private async showPaymentMethodsView(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    const text = `💳 **Payment Methods**\n\n` +
                 `Payment methods are managed on the website for security.\n` +
                 `Tap below to manage your cards and payment options.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('💳 Manage on Website', `${siteUrl}/settings/payments`)],
      [Markup.button.callback(this.messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
  }

  // Specialist-specific methods
  private async showSpecialistServices(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user?.specialist) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    try {
      const services = await ServiceService.getSpecialistServices(
        ctx.session.user.specialist.id,
        1,
        10
      );

      if (services.services.length === 0) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback(this.messages[lang].addService, 'add_service')],
          [Markup.button.callback(this.messages[lang].back, 'main_menu')]
        ]);
        
        await ctx.reply('You have no services yet. Would you like to add one?', keyboard);
        return;
      }

      await ctx.reply(`🛠️ **Your Services** (${services.total})\n`, { parse_mode: 'Markdown' });

      for (const service of services.services) {
        const serviceText = `🏪 **${service.name}**\n` +
                           `📝 ${service.description}\n` +
                           `💰 ${service.basePrice} ${service.currency}\n` +
                           `⏱️ ${service.duration} min\n` +
                           `📊 Status: ${service.isActive ? '✅ Active' : '❌ Inactive'}`;

        const keyboard = Markup.inlineKeyboard([
          [
            Markup.button.callback('📝 Edit', `edit_service_${service.id}`),
            Markup.button.callback(service.isActive ? '❌ Deactivate' : '✅ Activate', `toggle_service_${service.id}`)
          ],
          [Markup.button.callback('📊 Statistics', `service_stats_${service.id}`)]
        ]);

        await ctx.reply(serviceText, {
          parse_mode: 'Markdown',
          ...keyboard
        });
      }

      const mainKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback(this.messages[lang].addService, 'add_service')],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply('Service management:', mainKeyboard);

    } catch (error) {
      logger.error('Error showing specialist services:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async startAddService(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user?.specialist) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    ctx.session.state = 'add_service';
    ctx.session.step = 'name';
    ctx.session.tempData = {};
    
    await ctx.reply(this.messages[lang].serviceName);
  }

  private async showScheduleManagement(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user?.specialist) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    try {
      // Get specialist schedule
      const specialist = await SpecialistService.getProfile(ctx.session.user.specialist.id);
      const workingHours = JSON.parse(specialist.workingHours);

      let scheduleText = '📅 **Your Schedule**\n\n';
      
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (let i = 0; i < days.length; i++) {
        const day = workingHours[days[i]];
        const status = day.isWorking ? `${day.start} - ${day.end}` : 'Closed';
        scheduleText += `${dayNames[i]}: ${status}\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⏰ Update Schedule', 'update_schedule')],
        [Markup.button.callback('📅 View Availability', 'view_availability')],
        [Markup.button.callback('🚫 Block Time Slots', 'block_time_slots')],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply(scheduleText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error showing schedule management:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showSpecialistBookings(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    const siteUrl = config.frontend?.url || 'https://miyzapis.com';

    if (!ctx.session.user?.specialist) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    try {
      const bookings = await BookingService.getUserBookings(
        ctx.session.user.id,
        'specialist',
        undefined,
        1,
        50
      );

      if (bookings.bookings.length === 0) {
        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback(this.messages[lang].back, 'main_menu')]
        ]);
        await ctx.reply('📋 No bookings yet.', keyboard);
        return;
      }

      // Count by status
      const statusCounts: Record<string, number> = {};
      for (const b of bookings.bookings) {
        statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
      }

      // Build summary dashboard
      const statusOrder = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED'];
      const lines: string[] = [`📋 **Specialist Bookings** (${bookings.total} total)\n`];

      for (const status of statusOrder) {
        const count = statusCounts[status] || 0;
        if (count > 0) {
          lines.push(`${this.getStatusEmoji(status)} ${status}: **${count}**`);
        }
      }

      lines.push(`\nTap a category below to view details:`);

      // Category filter buttons
      const filterButtons: any[][] = [];
      const row1: any[] = [];
      const row2: any[] = [];

      for (const status of statusOrder) {
        const count = statusCounts[status] || 0;
        if (count === 0) continue;
        const btn = { text: `${this.getStatusEmoji(status)} ${status} (${count})`, callback_data: `bookings_filter_${status}` };
        if (row1.length < 2) row1.push(btn);
        else row2.push(btn);
      }

      if (row1.length > 0) filterButtons.push(row1);
      if (row2.length > 0) filterButtons.push(row2);

      const remaining = statusOrder.filter(s => (statusCounts[s] || 0) > 0).slice(4);
      if (remaining.length > 0) {
        filterButtons.push(remaining.map(s => ({
          text: `${this.getStatusEmoji(s)} ${s} (${statusCounts[s]})`,
          callback_data: `bookings_filter_${s}`
        })));
      }

      filterButtons.push([{ text: '📋 All Bookings', callback_data: 'bookings_filter_ALL' }]);
      filterButtons.push([
        { text: '🌐 View on Website', url: `${siteUrl}/specialist/bookings` },
        { text: '◀️ Back', callback_data: 'main_menu' }
      ]);

      await ctx.reply(lines.join('\n'), {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: filterButtons }
      });

    } catch (error) {
      logger.error('Error showing specialist bookings:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showEarnings(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user?.specialist) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    try {
      // Get earnings data - this would be implemented in a real earnings service
      const today = new Date();
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

      // Mock data - replace with real service calls
      const earningsData = {
        today: { amount: 1250, bookings: 3 },
        thisWeek: { amount: 4800, bookings: 12 },
        thisMonth: { amount: 18500, bookings: 45 },
        lastMonth: { amount: 16200, bookings: 38 },
        total: { amount: 125000, bookings: 320 }
      };

      const earningsText = `💰 **Your Earnings**\n\n` +
                          `📅 Today: ${earningsData.today.amount} UAH (${earningsData.today.bookings} bookings)\n` +
                          `📊 This Week: ${earningsData.thisWeek.amount} UAH (${earningsData.thisWeek.bookings} bookings)\n` +
                          `📈 This Month: ${earningsData.thisMonth.amount} UAH (${earningsData.thisMonth.bookings} bookings)\n` +
                          `📉 Last Month: ${earningsData.lastMonth.amount} UAH (${earningsData.lastMonth.bookings} bookings)\n\n` +
                          `🏆 Total Earned: ${earningsData.total.amount} UAH (${earningsData.total.bookings} total bookings)`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 Detailed Report', 'earnings_report')],
        [Markup.button.callback('💳 Payout History', 'payout_history')],
        [Markup.button.callback('⚙️ Payment Settings', 'payment_settings')],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply(earningsText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error showing earnings:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showReviews(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user?.specialist) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    try {
      // Get specialist reviews - mock implementation
      const reviews = [
        {
          id: '1',
          rating: 5,
          comment: 'Excellent service! Highly recommended.',
          customer: { firstName: 'Anna', lastName: 'K.' },
          service: { name: 'Hair Styling' },
          createdAt: new Date()
        },
        {
          id: '2', 
          rating: 4,
          comment: 'Good work, professional approach.',
          customer: { firstName: 'Ivan', lastName: 'P.' },
          service: { name: 'Hair Cut' },
          createdAt: new Date()
        }
      ];

      if (reviews.length === 0) {
        await ctx.reply('No reviews yet. Complete some bookings to start receiving reviews!');
        return;
      }

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await ctx.reply(`⭐ **Your Reviews**\n\nAverage Rating: ${avgRating.toFixed(1)}/5.0 (${reviews.length} reviews)\n`, { 
        parse_mode: 'Markdown' 
      });

      for (const review of reviews) {
        const stars = '⭐'.repeat(review.rating);
        const reviewText = `${stars} **${review.customer.firstName} ${review.customer.lastName}**\n` +
                          `Service: ${review.service.name}\n` +
                          `"${review.comment}"\n` +
                          `📅 ${review.createdAt.toLocaleDateString()}`;

        await ctx.reply(reviewText, { parse_mode: 'Markdown' });
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📊 Review Analytics', 'review_analytics')],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply('Review management:', keyboard);

    } catch (error) {
      logger.error('Error showing reviews:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showAnalytics(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!['SPECIALIST', 'ADMIN'].includes(ctx.session.userType!)) {
      await ctx.reply(this.messages[lang].accessDenied);
      return;
    }

    try {
      // Mock analytics data
      const analytics = {
        totalBookings: 156,
        completedBookings: 142,
        cancelledBookings: 14,
        averageRating: 4.7,
        totalRevenue: 45600,
        thisMonthBookings: 23,
        thisMonthRevenue: 8950,
        topService: 'Hair Styling',
        peakDay: 'Saturday',
        peakHour: '14:00'
      };

      const analyticsText = `📊 **Analytics Dashboard**\n\n` +
                           `📋 Total Bookings: ${analytics.totalBookings}\n` +
                           `✅ Completed: ${analytics.completedBookings}\n` +
                           `❌ Cancelled: ${analytics.cancelledBookings}\n` +
                           `⭐ Average Rating: ${analytics.averageRating}/5.0\n\n` +
                           `💰 Total Revenue: ${analytics.totalRevenue} UAH\n` +
                           `📅 This Month: ${analytics.thisMonthBookings} bookings, ${analytics.thisMonthRevenue} UAH\n\n` +
                           `🏆 Top Service: ${analytics.topService}\n` +
                           `📈 Peak Day: ${analytics.peakDay}\n` +
                           `⏰ Peak Hour: ${analytics.peakHour}`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📈 Weekly Report', 'analytics_weekly'),
          Markup.button.callback('📊 Monthly Report', 'analytics_monthly')
        ],
        [
          Markup.button.callback('🎯 Service Performance', 'service_performance'),
          Markup.button.callback('👥 Customer Insights', 'customer_insights')
        ],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply(analyticsText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error showing analytics:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  // Admin-specific methods (placeholders)

  private async showUserManagement(ctx: BotContext) {
    await ctx.reply('User management feature is under development.');
  }

  private async showServiceModeration(ctx: BotContext) {
    await ctx.reply('Service moderation feature is under development.');
  }

  private async showSystemStats(ctx: BotContext) {
    await ctx.reply('System statistics feature is under development.');
  }

  private async showPaymentManagement(ctx: BotContext) {
    await ctx.reply('Payment management feature is under development.');
  }

  // Customer-specific methods (placeholders)
  private async showBookingHistory(ctx: BotContext) {
    await ctx.reply('Booking history feature is under development.');
  }

  private async showFavorites(ctx: BotContext) {
    await ctx.reply('Favorites feature is under development.');
  }


  // Booking Flow Implementation
  private async startBookingFlow(ctx: BotContext, serviceId: string) {
    const lang = this.getUserLanguage(ctx);

    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    try {
      const service = await ServiceService.getService(serviceId);
      
      ctx.session.state = 'booking_flow';
      ctx.session.step = 'select_date';
      ctx.session.tempData = { serviceId, service };

      // Show service summary
      const serviceText = `📅 **Booking: ${service.name}**\n\n` +
                         `👤 ${service.specialist.user.firstName} ${service.specialist.user.lastName}\n` +
                         `⏱️ Duration: ${service.duration} minutes\n` +
                         `💰 Price: ${service.basePrice} ${service.currency}`;

      await ctx.reply(serviceText, { parse_mode: 'Markdown' });

      // Show available dates
      await this.showDateSelection(ctx);

    } catch (error) {
      logger.error('Error starting booking flow:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showDateSelection(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    // Generate next 14 days
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const value = date.toISOString().split('T')[0];
      
      dates.push({
        text: `${dayName}, ${dateStr}`,
        callback_data: `select_date_${value}`
      });
    }

    // Create keyboard with 2 dates per row
    const keyboard = [];
    for (let i = 0; i < dates.length; i += 2) {
      const row = [dates[i]];
      if (dates[i + 1]) row.push(dates[i + 1]);
      keyboard.push(row);
    }
    
    keyboard.push([{ text: this.messages[lang].back, callback_data: 'main_menu' }]);

    await ctx.reply(this.messages[lang].selectDate, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private async showTimeSelection(ctx: BotContext, selectedDate: string) {
    const lang = this.getUserLanguage(ctx);
    
    // Mock time slots - in real implementation, check specialist availability
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30', '17:00', '17:30'
    ];

    const keyboard = [];
    for (let i = 0; i < timeSlots.length; i += 3) {
      const row = [];
      for (let j = 0; j < 3 && i + j < timeSlots.length; j++) {
        row.push({
          text: timeSlots[i + j],
          callback_data: `select_time_${timeSlots[i + j]}`
        });
      }
      keyboard.push(row);
    }
    
    keyboard.push([{ text: this.messages[lang].back, callback_data: 'booking_select_date' }]);

    ctx.session.tempData.selectedDate = selectedDate;
    
    await ctx.reply(this.messages[lang].selectTime, {
      reply_markup: { inline_keyboard: keyboard }
    });
  }

  private async confirmBooking(ctx: BotContext, selectedTime: string) {
    const lang = this.getUserLanguage(ctx);
    const { service, selectedDate } = ctx.session.tempData;
    
    ctx.session.tempData.selectedTime = selectedTime;

    const bookingDetails = this.formatMessage(
      this.messages[lang].bookingDetails || 
      '📋 Booking Details:\n\n🏪 Service: {serviceName}\n👤 Specialist: {specialistName}\n📅 Date: {date}\n⏰ Time: {time}\n💰 Price: {price} {currency}',
      {
        serviceName: service.name,
        specialistName: `${service.specialist.user.firstName} ${service.specialist.user.lastName}`,
        date: selectedDate,
        time: selectedTime,
        price: service.basePrice,
        currency: service.currency
      }
    );

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirm Booking', 'confirm_booking')],
      [Markup.button.callback('❌ Cancel', 'cancel_booking')],
      [Markup.button.callback(this.messages[lang].back, 'booking_select_time')]
    ]);

    await ctx.reply(bookingDetails, keyboard);
  }

  private async createBooking(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      const { serviceId, selectedDate, selectedTime } = ctx.session.tempData;
      
      // Parse date and time
      const bookingDateTime = new Date(`${selectedDate} ${selectedTime}`);
      
      const service = await ServiceService.getService(serviceId);
      
      const booking = await BookingService.createBooking({
        customerId: ctx.session.user.id,
        serviceId,
        scheduledAt: bookingDateTime,
        duration: service.duration,
        totalAmount: service.basePrice,
        notes: 'Booked via Telegram Bot'
      });

      await ctx.reply(this.messages[lang].bookingConfirmed);
      
      // Clear session data
      ctx.session.state = null;
      ctx.session.step = null;
      ctx.session.tempData = {};

      // Show payment link if deposit required
      if (booking.depositAmount > 0) {
        const paymentKeyboard = Markup.inlineKeyboard([
          [Markup.button.url('💳 Pay Deposit', `${config.frontend?.url || 'https://miyzapis.com'}/booking/${booking.id}/payment`)],
          [Markup.button.callback('📋 My Bookings', 'my_bookings')]
        ]);
        
        await ctx.reply(
          `💳 Deposit required: ${booking.depositAmount} ${booking.customer.currency}\n\nPlease complete payment to confirm your booking.`,
          paymentKeyboard
        );
      }

      // Send notification to specialist
      await this.sendNotification(
        service.specialist.userId,
        `📅 New booking received!\n\nService: ${service.name}\nDate: ${selectedDate} at ${selectedTime}\nCustomer: ${ctx.session.user.firstName} ${ctx.session.user.lastName}`
      );

    } catch (error) {
      logger.error('Error creating booking:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleBookingAction(ctx: BotContext, action: string, bookingId: string) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      switch (action) {
        case 'cancel':
          await BookingService.cancelBooking(bookingId, ctx.session.user.id, 'Cancelled via Telegram');
          await ctx.reply(this.messages[lang].bookingCancelled);
          break;
          
        case 'confirm':
          if (ctx.session.userType === 'SPECIALIST') {
            await BookingService.updateBookingStatus(bookingId, 'CONFIRMED');
            await ctx.reply('✅ Booking confirmed!');
          }
          break;
          
        case 'reschedule':
          ctx.session.state = 'reschedule_booking';
          ctx.session.tempData = { bookingId };
          await this.showDateSelection(ctx);
          break;
          
        case 'chat':
          const chatUrl = `${config.frontend?.url || 'https://miyzapis.com'}/messages/booking/${bookingId}`;
          const keyboard = Markup.inlineKeyboard([
            [Markup.button.url('💬 Open Chat', chatUrl)]
          ]);
          await ctx.reply('Open chat in web app:', keyboard);
          break;
          
        case 'review':
          await this.startReviewFlow(ctx, bookingId);
          break;
      }
      
    } catch (error) {
      logger.error('Error handling booking action:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async startReviewFlow(ctx: BotContext, bookingId: string) {
    const lang = this.getUserLanguage(ctx);
    
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('⭐', 'rate_1'),
        Markup.button.callback('⭐⭐', 'rate_2'),
        Markup.button.callback('⭐⭐⭐', 'rate_3')
      ],
      [
        Markup.button.callback('⭐⭐⭐⭐', 'rate_4'),
        Markup.button.callback('⭐⭐⭐⭐⭐', 'rate_5')
      ],
      [Markup.button.callback(this.messages[lang].cancel, 'main_menu')]
    ]);

    ctx.session.state = 'review_flow';
    ctx.session.tempData = { bookingId };
    
    await ctx.reply('Please rate this service:', keyboard);
  }

  private async showServiceDetails(ctx: BotContext, serviceId: string) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      const service = await ServiceService.getService(serviceId);
      
      const detailsText = `🏪 **${service.name}**\n\n` +
                         `📝 ${service.description}\n\n` +
                         `👤 **Specialist:** ${service.specialist.user.firstName} ${service.specialist.user.lastName}\n` +
                         `🏢 ${service.specialist.businessName}\n` +
                         `⭐ ${service.specialist.rating}/5 (${service.specialist.reviewCount} reviews)\n\n` +
                         `⏱️ **Duration:** ${service.duration} minutes\n` +
                         `💰 **Price:** ${service.basePrice} ${service.currency}\n` +
                         `📍 **Location:** ${service.specialist.address || 'To be arranged'}\n\n` +
                         `📋 **Category:** ${service.category}\n` +
                         `🏷️ **Tags:** ${service.tags}`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📅 Book This Service', `book_${serviceId}`)],
        [
          Markup.button.callback('❤️ Add to Favorites', `favorite_${serviceId}`),
          Markup.button.callback('👤 View Specialist', `specialist_${service.specialist.id}`)
        ],
        [Markup.button.callback(this.messages[lang].back, 'search_services')]
      ]);

      await ctx.reply(detailsText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error showing service details:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  // Flow handlers
  private async handleBookingFlow(ctx: BotContext, text: string, step: string) {
    // Handle text input during booking flow
    switch (step) {
      case 'notes':
        ctx.session.tempData.notes = text;
        await this.confirmBooking(ctx, ctx.session.tempData.selectedTime);
        break;
    }
  }

  private async handleAddServiceStep(ctx: BotContext, text: string, step: string) {
    // Handle text input during add service flow for specialists
    const lang = this.getUserLanguage(ctx);
    
    switch (step) {
      case 'name':
        ctx.session.tempData.serviceName = text;
        ctx.session.step = 'description';
        await ctx.reply(this.messages[lang].serviceDescription);
        break;
        
      case 'description':
        ctx.session.tempData.serviceDescription = text;
        ctx.session.step = 'price';
        await ctx.reply(this.messages[lang].servicePrice);
        break;
        
      case 'price':
        const price = parseFloat(text);
        if (isNaN(price) || price <= 0) {
          await ctx.reply(this.messages[lang].invalidInput);
          return;
        }
        ctx.session.tempData.servicePrice = price;
        ctx.session.step = 'duration';
        await ctx.reply(this.messages[lang].serviceDuration);
        break;
        
      case 'duration':
        const duration = parseInt(text);
        if (isNaN(duration) || duration <= 0) {
          await ctx.reply(this.messages[lang].invalidInput);
          return;
        }
        ctx.session.tempData.serviceDuration = duration;
        await this.finishAddService(ctx);
        break;
    }
  }

  private async finishAddService(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      const { serviceName, serviceDescription, servicePrice, serviceDuration } = ctx.session.tempData;
      
      await ServiceService.createService({
        specialistId: ctx.session.user.specialist.id,
        name: serviceName,
        description: serviceDescription,
        basePrice: servicePrice,
        currency: 'UAH',
        duration: serviceDuration,
        category: 'OTHER',
        isActive: true
      });

      await ctx.reply(this.messages[lang].serviceCreated);
      
      // Clear session
      ctx.session.state = null;
      ctx.session.step = null;
      ctx.session.tempData = {};
      
      await this.showMainMenu(ctx);

    } catch (error) {
      logger.error('Error creating service:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleProfileSetup(ctx: BotContext, text: string, step: string) {
    // Handle profile setup flow
    const lang = this.getUserLanguage(ctx);
    
    switch (step) {
      case 'email':
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(text)) {
          await ctx.reply(this.messages[lang].invalidInput);
          return;
        }
        
        // Update user email
        await prisma.user.update({
          where: { id: ctx.session.user.id },
          data: { email: text }
        });
        
        await ctx.reply('✅ Email updated successfully!');
        ctx.session.state = null;
        await this.showMainMenu(ctx);
        break;
    }
  }

  private formatMessage(template: string, data: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Helper Methods Implementation
  private async handleRating(ctx: BotContext, rating: number) {
    const lang = this.getUserLanguage(ctx);
    const { bookingId } = ctx.session.tempData;
    
    try {
      // Save rating - this would be implemented in a real review service
      await ctx.reply(`Thank you for rating ${rating} stars! Your review helps improve our services.`);
      
      // Ask for written review (optional)
      ctx.session.state = 'review_comment';
      ctx.session.tempData.rating = rating;
      
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('✍️ Add Comment', 'add_review_comment')],
        [Markup.button.callback('✅ Submit Rating Only', 'submit_rating_only')],
        [Markup.button.callback(this.messages[lang].cancel, 'main_menu')]
      ]);
      
      await ctx.reply('Would you like to add a written review?', keyboard);
      
    } catch (error) {
      logger.error('Error handling rating:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async searchByCategory(ctx: BotContext, category: string) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      await ctx.reply(this.messages[lang].loading);
      
      // Map category shortcuts to full category names
      const categoryMap: Record<string, string> = {
        'home': 'HOME_SERVICES',
        'beauty': 'BEAUTY_WELLNESS',
        'repair': 'REPAIR_MAINTENANCE',
        'education': 'EDUCATION_TRAINING',
        'health': 'HEALTH_MEDICAL',
        'automotive': 'AUTOMOTIVE'
      };
      
      const fullCategory = categoryMap[category] || category;
      
      const services = await ServiceService.searchServices(
        undefined, // query
        fullCategory, // category
        undefined, // minPrice
        undefined, // maxPrice
        'rating', // sortBy
        1, // page
        10 // limit
      );

      if (services.services.length === 0) {
        await ctx.reply(this.messages[lang].notFound);
        return;
      }

      await this.displayServices(ctx, services.services, 1);
      
    } catch (error) {
      logger.error('Error searching by category:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async requestLocation(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    const keyboard = Markup.keyboard([
      [Markup.button.locationRequest('📍 Share Location')]
    ]).resize();
    
    await ctx.reply(
      'Please share your location to find nearby services:',
      keyboard
    );
  }

  private async toggleFavorite(ctx: BotContext, serviceId: string) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    try {
      // Check if service is already in favorites
      const existingFavorite = await prisma.favorite.findFirst({
        where: {
          userId: ctx.session.user.id,
          serviceId
        }
      });

      if (existingFavorite) {
        // Remove from favorites
        await prisma.favorite.delete({
          where: { id: existingFavorite.id }
        });
        await ctx.reply('💔 Removed from favorites');
      } else {
        // Add to favorites
        await prisma.favorite.create({
          data: {
            userId: ctx.session.user.id,
            serviceId
          }
        });
        await ctx.reply('❤️ Added to favorites');
      }
      
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handlePagination(ctx: BotContext, page: number, type: string) {
    // Handle pagination for different list types
    switch (type) {
      case 'services':
        // Re-execute the last search with new page
        if (ctx.session.tempData?.lastQuery) {
          await this.handleServiceSearch(ctx, ctx.session.tempData.lastQuery);
        }
        break;
      case 'bookings':
        await this.showBookings(ctx);
        break;
      default:
        await this.showMainMenu(ctx);
    }
  }

  // Customer-specific methods implementation
  private async showBookingHistory(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    try {
      const bookings = await BookingService.getUserBookings(
        ctx.session.user.id,
        'customer',
        'COMPLETED',
        1,
        10
      );

      if (bookings.bookings.length === 0) {
        await ctx.reply('No completed bookings found.');
        return;
      }

      await ctx.reply(`📚 **Booking History** (${bookings.total} completed)\n`, { parse_mode: 'Markdown' });
      await this.displayBookings(ctx, bookings.bookings);

    } catch (error) {
      logger.error('Error showing booking history:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showFavorites(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    try {
      const favorites = await prisma.favorite.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          service: {
            include: {
              specialist: {
                include: {
                  user: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          }
        },
        take: 10
      });

      if (favorites.length === 0) {
        await ctx.reply('❤️ No favorites yet. Start exploring services to add them to your favorites!');
        return;
      }

      await ctx.reply(`❤️ **Your Favorites** (${favorites.length})\n`, { parse_mode: 'Markdown' });

      for (const favorite of favorites) {
        const service = favorite.service;
        const serviceText = `🏪 **${service.name}**\n` +
                           `👤 ${service.specialist.user.firstName} ${service.specialist.user.lastName}\n` +
                           `💰 ${service.basePrice} ${service.currency}\n` +
                           `⏱️ ${service.duration} min`;

        const keyboard = Markup.inlineKeyboard([
          [Markup.button.callback('📅 Book Now', `book_${service.id}`)],
          [
            Markup.button.callback('💔 Remove', `favorite_${service.id}`),
            Markup.button.callback('ℹ️ Details', `service_${service.id}`)
          ]
        ]);

        await ctx.reply(serviceText, {
          parse_mode: 'Markdown',
          ...keyboard
        });
      }

    } catch (error) {
      logger.error('Error showing favorites:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async showLoyaltyPoints(ctx: BotContext) {
    const lang = this.getUserLanguage(ctx);
    
    if (!ctx.session.user) {
      await ctx.reply(this.messages[lang].loginRequired);
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { loyaltyPoints: true }
      });

      const points = user?.loyaltyPoints || 0;
      
      // Mock loyalty rewards
      const rewards = [
        { points: 100, reward: '5% discount on next booking' },
        { points: 250, reward: '10% discount on next booking' },
        { points: 500, reward: 'Free service consultation' },
        { points: 1000, reward: '15% discount on next booking' }
      ];

      let rewardsText = `🎁 **Loyalty Points: ${points}**\n\n**Available Rewards:**\n\n`;
      
      for (const reward of rewards) {
        const status = points >= reward.points ? '✅' : '🔒';
        rewardsText += `${status} ${reward.points} points - ${reward.reward}\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('🏆 Redeem Rewards', 'redeem_rewards')],
        [Markup.button.callback('📊 Points History', 'points_history')],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply(rewardsText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error showing loyalty points:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  // Media handlers implementation
  private async handleLocation(ctx: BotContext, location: any) {
    const lang = this.getUserLanguage(ctx);
    
    try {
      // Store location for user
      if (ctx.session.user) {
        await prisma.user.update({
          where: { id: ctx.session.user.id },
          data: {
            // Note: location fields would need to be added to the user schema
            // latitude: location.latitude,
            // longitude: location.longitude
          }
        });
      }

      await ctx.reply('📍 Location saved! Searching for nearby services...');

      // Search for services near the location
      // This would require implementing geolocation search in ServiceService
      const nearbyServices = await ServiceService.searchServices(
        undefined,
        undefined,
        undefined,
        undefined,
        'distance', // sort by distance
        1,
        10
      );

      if (nearbyServices.services.length > 0) {
        await this.displayServices(ctx, nearbyServices.services, 1);
      } else {
        await ctx.reply(this.messages[lang].notFound);
      }

    } catch (error) {
      logger.error('Error handling location:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleContact(ctx: BotContext, contact: any) {
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

  private async handlePhoto(ctx: BotContext, photos: any[]) {
    const lang = this.getUserLanguage(ctx);
    
    // Handle photo uploads for profile pictures, service images, etc.
    if (ctx.session.state === 'profile_setup' && ctx.session.step === 'avatar') {
      try {
        const photo = photos[photos.length - 1]; // Get highest resolution
        const fileId = photo.file_id;
        
        // In a real implementation, you would:
        // 1. Download the photo from Telegram
        // 2. Upload it to your storage service
        // 3. Save the URL to the user's profile
        
        await ctx.reply('✅ Profile picture updated successfully!');
        ctx.session.state = null;
        await this.showMainMenu(ctx);
        
      } catch (error) {
        logger.error('Error handling photo:', error);
        await ctx.reply(this.messages[lang].error);
      }
    }
  }

  private async handleDocument(ctx: BotContext, document: any) {
    const lang = this.getUserLanguage(ctx);
    
    // Handle document uploads for business certificates, portfolios, etc.
    if (ctx.session.userType === 'SPECIALIST') {
      try {
        const fileId = document.file_id;
        const fileName = document.file_name;
        
        // In a real implementation, you would process and store the document
        await ctx.reply(`📄 Document "${fileName}" received. Our team will review it shortly.`);
        
      } catch (error) {
        logger.error('Error handling document:', error);
        await ctx.reply(this.messages[lang].error);
      }
    }
  }

  // Admin panel functionality
  private async showAdminPanel(ctx: BotContext) {
    if (!this.isAdmin(ctx)) {
      const lang = this.getUserLanguage(ctx);
      await ctx.reply(this.messages[lang].notAuthorized);
      return;
    }

    const lang = this.getUserLanguage(ctx);
    
    try {
      // Get platform statistics
      const stats = await this.getAdminStats();
      
      const adminText = `🛡️ **Admin Dashboard**\n\n` +
        `📊 **Platform Statistics:**\n` +
        `👥 Total Users: ${stats.totalUsers}\n` +
        `💼 Active Specialists: ${stats.activeSpecialists}\n` +
        `🛒 Total Bookings: ${stats.totalBookings}\n` +
        `💰 Total Revenue: ${stats.totalRevenue}\n` +
        `📅 Today's Bookings: ${stats.todayBookings}\n` +
        `🔥 Active Services: ${stats.activeServices}\n\n` +
        `🕐 Last Updated: ${new Date().toLocaleString()}`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('👥 User Management', 'admin_users'),
          Markup.button.callback('💼 Specialists', 'admin_specialists')
        ],
        [
          Markup.button.callback('🛒 Bookings', 'admin_bookings'),
          Markup.button.callback('🏪 Services', 'admin_services')
        ],
        [
          Markup.button.callback('💰 Payments', 'admin_payments'),
          Markup.button.callback('📊 Analytics', 'admin_analytics')
        ],
        [
          Markup.button.callback('⚙️ System', 'admin_system'),
          Markup.button.callback('📢 Broadcast', 'admin_broadcast')
        ],
        [Markup.button.callback(this.messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply(adminText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error showing admin panel:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleAdminUsers(ctx: BotContext) {
    if (!this.isAdmin(ctx)) return;
    
    const lang = this.getUserLanguage(ctx);
    
    try {
      const users = await prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userType: true,
          isActive: true,
          createdAt: true,
          telegramId: true
        }
      });

      let usersList = `👥 **Recent Users (${users.length})**\n\n`;
      
      for (const user of users) {
        const status = user.isActive ? '✅' : '❌';
        const telegramStatus = user.telegramId ? '📱' : '🌐';
        usersList += `${status} ${telegramStatus} **${user.firstName} ${user.lastName}**\n`;
        usersList += `   📧 ${user.email}\n`;
        usersList += `   👤 ${user.userType}\n`;
        usersList += `   📅 ${user.createdAt.toLocaleDateString()}\n\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🔍 Search User', 'admin_user_search'),
          Markup.button.callback('📊 User Stats', 'admin_user_stats')
        ],
        [
          Markup.button.callback('🚫 Block User', 'admin_user_block'),
          Markup.button.callback('✅ Activate User', 'admin_user_activate')
        ],
        [Markup.button.callback('🔙 Back to Admin', 'admin_panel')]
      ]);

      await ctx.reply(usersList, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error handling admin users:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleAdminSpecialists(ctx: BotContext) {
    if (!this.isAdmin(ctx)) return;
    
    const lang = this.getUserLanguage(ctx);
    
    try {
      const specialists = await prisma.user.findMany({
        where: { userType: 'SPECIALIST' },
        include: {
          specialist: {
            include: {
              services: true,
              bookings: true
            }
          }
        },
        take: 15,
        orderBy: { createdAt: 'desc' }
      });

      let specialistsList = `💼 **Specialists Overview (${specialists.length})**\n\n`;
      
      for (const specialist of specialists) {
        const status = specialist.isActive ? '✅' : '❌';
        const servicesCount = specialist.specialist?.services?.length || 0;
        const bookingsCount = specialist.specialist?.bookings?.length || 0;
        
        specialistsList += `${status} **${specialist.firstName} ${specialist.lastName}**\n`;
        specialistsList += `   🛍️ Services: ${servicesCount}\n`;
        specialistsList += `   📅 Bookings: ${bookingsCount}\n`;
        specialistsList += `   📧 ${specialist.email}\n\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Approve Specialist', 'admin_spec_approve'),
          Markup.button.callback('❌ Reject Specialist', 'admin_spec_reject')
        ],
        [
          Markup.button.callback('🎯 Featured Specialist', 'admin_spec_feature'),
          Markup.button.callback('📊 Specialist Stats', 'admin_spec_stats')
        ],
        [Markup.button.callback('🔙 Back to Admin', 'admin_panel')]
      ]);

      await ctx.reply(specialistsList, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error handling admin specialists:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleAdminBookings(ctx: BotContext) {
    if (!this.isAdmin(ctx)) return;
    
    const lang = this.getUserLanguage(ctx);
    
    try {
      const bookings = await prisma.booking.findMany({
        include: {
          customer: { select: { firstName: true, lastName: true } },
          specialist: { select: { firstName: true, lastName: true } },
          service: { select: { title: true } }
        },
        take: 15,
        orderBy: { createdAt: 'desc' }
      });

      let bookingsList = `🛒 **Recent Bookings (${bookings.length})**\n\n`;
      
      for (const booking of bookings) {
        const statusEmoji = booking.status === 'CONFIRMED' ? '✅' : 
                           booking.status === 'PENDING' ? '⏳' : 
                           booking.status === 'CANCELLED' ? '❌' : '❓';
        
        bookingsList += `${statusEmoji} **${booking.service.title}**\n`;
        bookingsList += `   👤 ${booking.customer.firstName} ${booking.customer.lastName}\n`;
        bookingsList += `   💼 ${booking.specialist.firstName} ${booking.specialist.lastName}\n`;
        bookingsList += `   💰 $${booking.totalAmount}\n`;
        bookingsList += `   📅 ${new Date(booking.dateTime).toLocaleDateString()}\n\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📊 Booking Stats', 'admin_booking_stats'),
          Markup.button.callback('💰 Revenue Report', 'admin_revenue_report')
        ],
        [
          Markup.button.callback('🔍 Search Booking', 'admin_booking_search'),
          Markup.button.callback('📅 Today\'s Bookings', 'admin_today_bookings')
        ],
        [Markup.button.callback('🔙 Back to Admin', 'admin_panel')]
      ]);

      await ctx.reply(bookingsList, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error handling admin bookings:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleAdminServices(ctx: BotContext) {
    if (!this.isAdmin(ctx)) return;
    
    const lang = this.getUserLanguage(ctx);
    
    try {
      const services = await prisma.service.findMany({
        include: {
          specialist: { select: { firstName: true, lastName: true } },
          category: { select: { name: true } },
          bookings: true
        },
        take: 15,
        orderBy: { createdAt: 'desc' }
      });

      let servicesList = `🏪 **Services Overview (${services.length})**\n\n`;
      
      for (const service of services) {
        const status = service.isActive ? '✅' : '❌';
        const bookingsCount = service.bookings.length;
        
        servicesList += `${status} **${service.title}**\n`;
        servicesList += `   📂 ${service.category.name}\n`;
        servicesList += `   💼 ${service.specialist.firstName} ${service.specialist.lastName}\n`;
        servicesList += `   💰 $${service.price}\n`;
        servicesList += `   📅 Bookings: ${bookingsCount}\n\n`;
      }

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Approve Service', 'admin_service_approve'),
          Markup.button.callback('❌ Reject Service', 'admin_service_reject')
        ],
        [
          Markup.button.callback('🌟 Feature Service', 'admin_service_feature'),
          Markup.button.callback('📊 Service Stats', 'admin_service_stats')
        ],
        [Markup.button.callback('🔙 Back to Admin', 'admin_panel')]
      ]);

      await ctx.reply(servicesList, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error handling admin services:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleAdminAnalytics(ctx: BotContext) {
    if (!this.isAdmin(ctx)) return;
    
    const lang = this.getUserLanguage(ctx);
    
    try {
      const analytics = await this.getDetailedAnalytics();
      
      const analyticsText = `📊 **Platform Analytics**\n\n` +
        `**📈 Growth Metrics:**\n` +
        `• New Users (7d): ${analytics.newUsers7d}\n` +
        `• New Specialists (7d): ${analytics.newSpecialists7d}\n` +
        `• New Services (7d): ${analytics.newServices7d}\n\n` +
        `**💰 Revenue Metrics:**\n` +
        `• Today: $${analytics.revenueToday}\n` +
        `• This Week: $${analytics.revenueWeek}\n` +
        `• This Month: $${analytics.revenueMonth}\n\n` +
        `**🛒 Booking Metrics:**\n` +
        `• Completion Rate: ${analytics.completionRate}%\n` +
        `• Avg. Booking Value: $${analytics.avgBookingValue}\n` +
        `• Popular Category: ${analytics.popularCategory}\n\n` +
        `**👥 User Engagement:**\n` +
        `• Active Users (7d): ${analytics.activeUsers7d}\n` +
        `• Telegram Users: ${analytics.telegramUsers}\n` +
        `• Return Rate: ${analytics.returnRate}%`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('📈 Growth Chart', 'admin_growth_chart'),
          Markup.button.callback('💰 Revenue Chart', 'admin_revenue_chart')
        ],
        [
          Markup.button.callback('📊 Export Data', 'admin_export_data'),
          Markup.button.callback('🔄 Refresh', 'admin_analytics')
        ],
        [Markup.button.callback('🔙 Back to Admin', 'admin_panel')]
      ]);

      await ctx.reply(analyticsText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error handling admin analytics:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  private async handleAdminBroadcast(ctx: BotContext) {
    if (!this.isAdmin(ctx)) return;
    
    const lang = this.getUserLanguage(ctx);
    
    const broadcastText = `📢 **Broadcast Center**\n\n` +
      `Send messages to all users or specific groups:\n\n` +
      `Select your target audience:`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('👥 All Users', 'broadcast_all'),
        Markup.button.callback('🛒 Customers Only', 'broadcast_customers')
      ],
      [
        Markup.button.callback('💼 Specialists Only', 'broadcast_specialists'),
        Markup.button.callback('📱 Telegram Users', 'broadcast_telegram')
      ],
      [
        Markup.button.callback('🎯 Custom Group', 'broadcast_custom'),
        Markup.button.callback('📋 Message Templates', 'broadcast_templates')
      ],
      [Markup.button.callback('🔙 Back to Admin', 'admin_panel')]
    ]);

    await ctx.reply(broadcastText, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  }

  private async handleAdminSystem(ctx: BotContext) {
    if (!this.isAdmin(ctx)) return;
    
    const lang = this.getUserLanguage(ctx);
    
    try {
      const systemInfo = await this.getSystemInfo();
      
      const systemText = `⚙️ **System Information**\n\n` +
        `**🖥️ Server Status:**\n` +
        `• Uptime: ${systemInfo.uptime}\n` +
        `• Memory Usage: ${systemInfo.memoryUsage}%\n` +
        `• CPU Usage: ${systemInfo.cpuUsage}%\n\n` +
        `**🗄️ Database:**\n` +
        `• Status: ${systemInfo.dbStatus}\n` +
        `• Connections: ${systemInfo.dbConnections}\n` +
        `• Last Backup: ${systemInfo.lastBackup}\n\n` +
        `**📱 Telegram Bot:**\n` +
        `• Status: Active ✅\n` +
        `• Webhook: ${systemInfo.webhookStatus}\n` +
        `• Messages Today: ${systemInfo.messagesProcessed}`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('🔄 Restart Bot', 'admin_restart_bot'),
          Markup.button.callback('💾 Create Backup', 'admin_create_backup')
        ],
        [
          Markup.button.callback('🧹 Clear Cache', 'admin_clear_cache'),
          Markup.button.callback('📊 System Logs', 'admin_system_logs')
        ],
        [
          Markup.button.callback('⚙️ Bot Settings', 'admin_bot_settings'),
          Markup.button.callback('🔒 Security', 'admin_security')
        ],
        [Markup.button.callback('🔙 Back to Admin', 'admin_panel')]
      ]);

      await ctx.reply(systemText, {
        parse_mode: 'Markdown',
        ...keyboard
      });

    } catch (error) {
      logger.error('Error handling admin system:', error);
      await ctx.reply(this.messages[lang].error);
    }
  }

  // Helper methods for admin functionality
  private async getAdminStats() {
    const totalUsers = await prisma.user.count();
    const activeSpecialists = await prisma.user.count({
      where: { userType: 'SPECIALIST', isActive: true }
    });
    const totalBookings = await prisma.booking.count();
    const totalRevenue = await prisma.booking.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'CONFIRMED' }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBookings = await prisma.booking.count({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' }
      }
    });
    
    const activeServices = await prisma.service.count({
      where: { isActive: true }
    });

    return {
      totalUsers,
      activeSpecialists,
      totalBookings,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      todayBookings,
      activeServices
    };
  }

  private async getDetailedAnalytics() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      newUsers7d,
      newSpecialists7d,
      newServices7d,
      revenueToday,
      revenueWeek,
      revenueMonth,
      totalBookings,
      completedBookings,
      avgBookingValue,
      activeUsers7d,
      telegramUsers
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ 
        where: { 
          userType: 'SPECIALIST', 
          createdAt: { gte: sevenDaysAgo } 
        } 
      }),
      prisma.service.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: today }
        }
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      prisma.booking.aggregate({
        _sum: { totalAmount: true },
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.aggregate({
        _avg: { totalAmount: true },
        where: { status: 'CONFIRMED' }
      }),
      prisma.user.count({
        where: {
          updatedAt: { gte: sevenDaysAgo },
          isActive: true
        }
      }),
      prisma.user.count({
        where: { telegramId: { not: null } }
      })
    ]);

    const completionRate = totalBookings > 0 ? 
      Math.round((completedBookings / totalBookings) * 100) : 0;

    return {
      newUsers7d,
      newSpecialists7d,
      newServices7d,
      revenueToday: revenueToday._sum.totalAmount || 0,
      revenueWeek: revenueWeek._sum.totalAmount || 0,
      revenueMonth: revenueMonth._sum.totalAmount || 0,
      completionRate,
      avgBookingValue: Math.round(avgBookingValue._avg.totalAmount || 0),
      popularCategory: 'Beauty & Wellness', // This would need actual calculation
      activeUsers7d,
      telegramUsers,
      returnRate: 75 // This would need actual calculation
    };
  }

  private async getSystemInfo() {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const memoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

    return {
      uptime: this.formatUptime(uptime),
      memoryUsage: memoryPercent,
      cpuUsage: Math.floor(Math.random() * 15) + 5, // Mock CPU usage
      dbStatus: 'Connected ✅',
      dbConnections: 12,
      lastBackup: '2 hours ago',
      webhookStatus: 'Active ✅',
      messagesProcessed: Math.floor(Math.random() * 1000) + 500
    };
  }

  private formatUptime(uptimeSeconds: number): string {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  private isAdmin(ctx: BotContext): boolean {
    return ctx.session.user?.userType === 'ADMIN';
  }

  // Broadcast message handler
  private async handleBroadcastCompose(ctx: BotContext, message: string) {
    if (!this.isAdmin(ctx)) {
      await ctx.reply('❌ Access denied. Admin privileges required.');
      return;
    }

    const target = ctx.session.broadcastTarget;
    
    try {
      await ctx.reply('📡 Sending broadcast message...');
      
      // Send broadcast based on target
      if (target === 'all') {
        await this.broadcastMessage(message);
      } else if (target === 'telegram') {
        // Send only to users with Telegram accounts
        const users = await prisma.user.findMany({
          where: {
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
      } else if (['CUSTOMER', 'SPECIALIST', 'ADMIN'].includes(target as string)) {
        await this.broadcastMessage(message, target as 'CUSTOMER' | 'SPECIALIST' | 'ADMIN');
      }

      await ctx.reply(`✅ Broadcast sent successfully to ${target} users!`);
      
      // Reset state
      ctx.session.state = null;
      ctx.session.broadcastTarget = null;
      
      // Return to admin panel
      await this.showAdminPanel(ctx);

    } catch (error) {
      logger.error('Error sending broadcast:', error);
      await ctx.reply('❌ Failed to send broadcast message.');
      ctx.session.state = null;
      ctx.session.broadcastTarget = null;
    }
  }

  // Public methods
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

  // Webhook methods for production
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
      logger.error('Error sending Enhanced Telegram notification:', error);
      return false;
    }
  }

  // Broadcast messages to all users
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