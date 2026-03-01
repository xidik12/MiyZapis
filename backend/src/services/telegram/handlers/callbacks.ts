import { Telegraf } from 'telegraf';
import { BotContext } from '../types';
import { messages } from '../messages';
import {
  showMainMenu,
  showLanguageSelection,
  setUserLanguage,
  showUserTypeSelection,
  setUserType,
  showHelp,
  showSettings,
} from '../commands';
import {
  startServiceSearch,
  showServiceDetails,
  searchByCategory,
  requestLocation,
  toggleFavorite,
  showFavorites,
  showLoyaltyPoints,
  showPaymentMethodsView,
  showCustomerProfile,
  handlePagination,
} from './customer';
import {
  showSpecialistServices,
  startAddService,
  showScheduleManagement,
  showSpecialistProfileView,
  showEarnings,
  showReviews,
  showAnalytics,
} from './specialist';
import {
  showBookings,
  showBookingsByStatus,
  showSpecialistBookings,
  showBookingHistory,
  startBookingFlow,
  showTimeSelection,
  confirmBooking,
  handleBookingAction,
  handleRating,
} from './booking';
import {
  showAdminPanel,
  handleAdminUsers,
  handleAdminSpecialists,
  handleAdminBookings,
  handleAdminServices,
  handleAdminAnalytics,
  handleAdminBroadcast,
  handleAdminSystem,
  showUserManagement,
  showServiceModeration,
  showSystemStats,
  showPaymentManagement,
} from './admin';

export function registerCallbacks(bot: Telegraf<BotContext>, createBookingFn: (ctx: BotContext) => Promise<void>) {
  // Language selection
  bot.action(/^lang_(.+)$/, async (ctx) => {
    const language = ctx.match[1];
    await setUserLanguage(ctx, language);
  });

  // User type selection
  bot.action(/^usertype_(.+)$/, async (ctx) => {
    const userType = ctx.match[1].toUpperCase();
    await setUserType(ctx, userType);
  });

  // Navigation
  bot.action('main_menu', async (ctx) => {
    await showMainMenu(ctx);
  });

  bot.action('back', async (ctx) => {
    if (ctx.session.state) {
      ctx.session.state = null;
      ctx.session.step = null;
      ctx.session.tempData = {};
    }
    await showMainMenu(ctx);
  });

  // ── Customer callbacks ──

  bot.action('search_services', async (ctx) => {
    await startServiceSearch(ctx);
  });

  bot.action('my_bookings', async (ctx) => {
    await showBookings(ctx);
  });

  bot.action('booking_history', async (ctx) => {
    await showBookingHistory(ctx);
  });

  bot.action('favorites', async (ctx) => {
    await showFavorites(ctx);
  });

  bot.action('loyalty_points', async (ctx) => {
    await showLoyaltyPoints(ctx);
  });

  // ── Specialist callbacks ──

  bot.action('my_services', async (ctx) => {
    await showSpecialistServices(ctx);
  });

  bot.action('add_service', async (ctx) => {
    await startAddService(ctx);
  });

  bot.action('manage_schedule', async (ctx) => {
    await showScheduleManagement(ctx);
  });

  bot.action('specialist_bookings', async (ctx) => {
    await showSpecialistBookings(ctx);
  });

  bot.action('earnings', async (ctx) => {
    await showEarnings(ctx);
  });

  bot.action('reviews', async (ctx) => {
    await showReviews(ctx);
  });

  bot.action('analytics', async (ctx) => {
    await showAnalytics(ctx);
  });

  // ── Admin callbacks ──

  bot.action('user_management', async (ctx) => {
    await showUserManagement(ctx);
  });

  bot.action('service_moderation', async (ctx) => {
    await showServiceModeration(ctx);
  });

  bot.action('system_stats', async (ctx) => {
    await showSystemStats(ctx);
  });

  bot.action('payment_management', async (ctx) => {
    await showPaymentManagement(ctx);
  });

  bot.action('admin_panel', async (ctx) => {
    await showAdminPanel(ctx);
  });

  bot.action('admin_users', async (ctx) => {
    await handleAdminUsers(ctx);
  });

  bot.action('admin_specialists', async (ctx) => {
    await handleAdminSpecialists(ctx);
  });

  bot.action('admin_bookings', async (ctx) => {
    await handleAdminBookings(ctx);
  });

  bot.action('admin_services', async (ctx) => {
    await handleAdminServices(ctx);
  });

  bot.action('admin_analytics', async (ctx) => {
    await handleAdminAnalytics(ctx);
  });

  bot.action('admin_broadcast', async (ctx) => {
    await handleAdminBroadcast(ctx);
  });

  bot.action('admin_system', async (ctx) => {
    await handleAdminSystem(ctx);
  });

  // ── Admin broadcast target callbacks ──

  bot.action('broadcast_all', async (ctx) => {
    ctx.session.state = 'broadcast_compose';
    ctx.session.broadcastTarget = 'all';
    await ctx.reply('\ud83d\udcdd Type your message to broadcast to all users:');
  });

  bot.action('broadcast_customers', async (ctx) => {
    ctx.session.state = 'broadcast_compose';
    ctx.session.broadcastTarget = 'CUSTOMER';
    await ctx.reply('\ud83d\udcdd Type your message to broadcast to all customers:');
  });

  bot.action('broadcast_specialists', async (ctx) => {
    ctx.session.state = 'broadcast_compose';
    ctx.session.broadcastTarget = 'SPECIALIST';
    await ctx.reply('\ud83d\udcdd Type your message to broadcast to all specialists:');
  });

  bot.action('broadcast_telegram', async (ctx) => {
    ctx.session.state = 'broadcast_compose';
    ctx.session.broadcastTarget = 'telegram';
    await ctx.reply('\ud83d\udcdd Type your message to broadcast to all Telegram users:');
  });

  // ── Service & booking dynamic callbacks ──

  bot.action(/^service_(.+)$/, async (ctx) => {
    const serviceId = ctx.match[1];
    await showServiceDetails(ctx, serviceId);
  });

  bot.action(/^book_(.+)$/, async (ctx) => {
    const serviceId = ctx.match[1];
    await startBookingFlow(ctx, serviceId);
  });

  bot.action(/^booking_action_(.+)_(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    const bookingId = ctx.match[2];
    await handleBookingAction(ctx, action, bookingId);
  });

  // Pagination
  bot.action(/^page_(.+)_(.+)$/, async (ctx) => {
    const page = parseInt(ctx.match[1]);
    const type = ctx.match[2];
    await handlePagination(ctx, page, type);
  });

  // Date and time selection
  bot.action(/^select_date_(.+)$/, async (ctx) => {
    const selectedDate = ctx.match[1];
    await showTimeSelection(ctx, selectedDate);
  });

  bot.action(/^select_time_(.+)$/, async (ctx) => {
    const selectedTime = ctx.match[1];
    await confirmBooking(ctx, selectedTime);
  });

  // Booking confirmation
  bot.action('confirm_booking', async (ctx) => {
    await createBookingFn(ctx);
  });

  bot.action('cancel_booking', async (ctx) => {
    ctx.session.state = null;
    ctx.session.tempData = {};
    await showMainMenu(ctx);
  });

  // Rating
  bot.action(/^rate_(.+)$/, async (ctx) => {
    const rating = parseInt(ctx.match[1]);
    await handleRating(ctx, rating);
  });

  // Category search
  bot.action(/^category_(.+)$/, async (ctx) => {
    const category = ctx.match[1];
    await searchByCategory(ctx, category);
  });

  bot.action('search_keyword', async (ctx) => {
    const lang = (ctx.session.language || 'en') as keyof typeof messages;
    ctx.session.state = 'service_search';
    await ctx.reply(messages[lang].enterSearchTerm);
  });

  bot.action('search_nearby', async (ctx) => {
    await requestLocation(ctx);
  });

  // Favorites
  bot.action(/^favorite_(.+)$/, async (ctx) => {
    const serviceId = ctx.match[1];
    await toggleFavorite(ctx, serviceId);
  });

  // Common callbacks
  bot.action('lang_select', async (ctx) => {
    await showLanguageSelection(ctx);
  });

  bot.action('usertype_select', async (ctx) => {
    await showUserTypeSelection(ctx, true);
  });

  bot.action('settings', async (ctx) => {
    await showSettings(ctx);
  });

  bot.action('specialist_profile', async (ctx) => {
    await showSpecialistProfileView(ctx);
  });

  bot.action('my_profile', async (ctx) => {
    await showCustomerProfile(ctx);
  });

  bot.action('help', async (ctx) => {
    await showHelp(ctx);
  });

  bot.action('payment_methods', async (ctx) => {
    await showPaymentMethodsView(ctx);
  });

  // Booking category filter
  bot.action(/^bookings_filter_(.+)$/, async (ctx) => {
    const status = ctx.match[1];
    await showBookingsByStatus(ctx, status);
  });
}
