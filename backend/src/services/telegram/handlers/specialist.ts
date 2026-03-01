import { Markup } from 'telegraf';
import { logger } from '@/utils/logger';
import { SpecialistService } from '@/services/specialist';
import { ServiceService } from '@/services/service';
import { BotContext } from '../types';
import { messages } from '../messages';
import { getUserLanguage, getSiteUrl } from '../utils';

// ── Specialist Services ──

export async function showSpecialistServices(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user?.specialist) {
    await ctx.reply(messages[lang].accessDenied);
    return;
  }

  try {
    const specialistId = ctx.session.user.specialist.id;
    const services = await ServiceService.getSpecialistServices(
      ctx.session.user.id,
      false
    ) as any;

    // Handle both array and object with services property
    const serviceList = Array.isArray(services) ? services : (services?.services || []);
    const total = Array.isArray(services) ? services.length : (services?.total || serviceList.length);

    if (serviceList.length === 0) {
      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback(messages[lang].addService, 'add_service')],
        [Markup.button.callback(messages[lang].back, 'main_menu')]
      ]);

      await ctx.reply('You have no services yet. Would you like to add one?', keyboard);
      return;
    }

    await ctx.reply(`\ud83d\udee0\ufe0f **Your Services** (${total})\n`, { parse_mode: 'Markdown' });

    for (const service of serviceList) {
      const serviceText = `\ud83c\udfea **${service.name}**\n` +
        `\ud83d\udcdd ${service.description}\n` +
        `\ud83d\udcb0 ${service.basePrice} ${service.currency}\n` +
        `\u23f1\ufe0f ${service.duration} min\n` +
        `\ud83d\udcca Status: ${service.isActive ? '\u2705 Active' : '\u274c Inactive'}`;

      const keyboard = Markup.inlineKeyboard([
        [
          Markup.button.callback('\ud83d\udcdd Edit', `edit_service_${service.id}`),
          Markup.button.callback(service.isActive ? '\u274c Deactivate' : '\u2705 Activate', `toggle_service_${service.id}`)
        ],
        [Markup.button.callback('\ud83d\udcca Statistics', `service_stats_${service.id}`)]
      ]);

      await ctx.reply(serviceText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    }

    const mainKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback(messages[lang].addService, 'add_service')],
      [Markup.button.callback(messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply('Service management:', mainKeyboard);

  } catch (error) {
    logger.error('Error showing specialist services:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Add Service Flow ──

export async function startAddService(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user?.specialist) {
    await ctx.reply(messages[lang].accessDenied);
    return;
  }

  ctx.session.state = 'add_service';
  ctx.session.step = 'name';
  ctx.session.tempData = {};

  await ctx.reply(messages[lang].serviceName);
}

export async function handleAddServiceStep(ctx: BotContext, text: string, step: string) {
  const lang = getUserLanguage(ctx);

  switch (step) {
    case 'name':
      ctx.session.tempData!.serviceName = text;
      ctx.session.step = 'description';
      await ctx.reply(messages[lang].serviceDescription);
      break;

    case 'description':
      ctx.session.tempData!.serviceDescription = text;
      ctx.session.step = 'price';
      await ctx.reply(messages[lang].servicePrice);
      break;

    case 'price':
      const price = parseFloat(text);
      if (isNaN(price) || price <= 0) {
        await ctx.reply(messages[lang].invalidInput);
        return;
      }
      ctx.session.tempData!.servicePrice = price;
      ctx.session.step = 'duration';
      await ctx.reply(messages[lang].serviceDuration);
      break;

    case 'duration':
      const duration = parseInt(text);
      if (isNaN(duration) || duration <= 0) {
        await ctx.reply(messages[lang].invalidInput);
        return;
      }
      ctx.session.tempData!.serviceDuration = duration;
      await finishAddService(ctx);
      break;
  }
}

async function finishAddService(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  try {
    const { serviceName, serviceDescription, servicePrice, serviceDuration } = ctx.session.tempData!;

    await ServiceService.createService(
      ctx.session.user.id,
      {
        name: serviceName,
        description: serviceDescription,
        basePrice: servicePrice,
        currency: 'UAH',
        duration: serviceDuration,
        category: 'OTHER',
        isActive: true
      } as any
    );

    await ctx.reply(messages[lang].serviceCreated);

    // Clear session
    ctx.session.state = null;
    ctx.session.step = null;
    ctx.session.tempData = {};

    const { showMainMenu } = await import('../commands');
    await showMainMenu(ctx);

  } catch (error) {
    logger.error('Error creating service:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Schedule Management ──

export async function showScheduleManagement(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user?.specialist) {
    await ctx.reply(messages[lang].accessDenied);
    return;
  }

  try {
    const specialist = await SpecialistService.getProfile(ctx.session.user.specialist.id) as any;
    const workingHours = typeof specialist.workingHours === 'string'
      ? JSON.parse(specialist.workingHours)
      : specialist.workingHours;

    let scheduleText = '\ud83d\udcc5 **Your Schedule**\n\n';

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < days.length; i++) {
      const day = workingHours[days[i]];
      const status = day?.isWorking ? `${day.start} - ${day.end}` : 'Closed';
      scheduleText += `${dayNames[i]}: ${status}\n`;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('\u23f0 Update Schedule', 'update_schedule')],
      [Markup.button.callback('\ud83d\udcc5 View Availability', 'view_availability')],
      [Markup.button.callback('\ud83d\udeab Block Time Slots', 'block_time_slots')],
      [Markup.button.callback(messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(scheduleText, {
      parse_mode: 'Markdown',
      ...keyboard
    });

  } catch (error) {
    logger.error('Error showing schedule management:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Specialist Profile ──

export async function showSpecialistProfileView(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  if (!ctx.session.user?.specialist) {
    await ctx.reply(messages[lang].accessDenied);
    return;
  }

  try {
    const specialist = await SpecialistService.getProfile(ctx.session.user.specialist.id) as any;

    const specialties = Array.isArray(specialist.specialties) ? specialist.specialties.join(', ') : 'Not set';
    const verified = specialist.isVerified ? '\u2705 Verified' : '\u274c Not verified';
    const rating = specialist.rating ? `\u2b50 ${Number(specialist.rating).toFixed(1)} (${specialist.reviewCount || 0} reviews)` : 'No reviews yet';

    let hoursText = '';
    if (specialist.workingHours && typeof specialist.workingHours === 'object') {
      const wh = specialist.workingHours as Record<string, any>;
      const workDays = Object.entries(wh)
        .filter(([_, v]) => v?.isWorking)
        .map(([day, v]) => `${day.charAt(0).toUpperCase() + day.slice(1, 3)}: ${v.start}-${v.end}`);
      hoursText = workDays.length > 0 ? workDays.join(', ') : 'No schedule set';
    }

    const profileText = `\ud83c\udfe2 **Specialist Profile**\n\n` +
      `\ud83d\udcdb ${specialist.businessName || 'No business name'}\n` +
      `\ud83d\udcdd ${specialist.bio || 'No bio'}\n\n` +
      `\ud83c\udff7\ufe0f Specialties: ${specialties}\n` +
      `${rating}\n` +
      `${verified}\n` +
      `\ud83d\udd50 Hours: ${hoursText}\n` +
      `\ud83d\udcca Active services: ${specialist._count?.services || 0}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('\ud83d\udcdd Edit on Website', `${siteUrl}/specialist/profile`)],
      [Markup.button.callback(messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(profileText, { parse_mode: 'Markdown', ...keyboard });

  } catch (error) {
    logger.error('Error showing specialist profile:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Earnings ──

export async function showEarnings(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user?.specialist) {
    await ctx.reply(messages[lang].accessDenied);
    return;
  }

  try {
    // Mock data - replace with real service calls
    const earningsData = {
      today: { amount: 1250, bookings: 3 },
      thisWeek: { amount: 4800, bookings: 12 },
      thisMonth: { amount: 18500, bookings: 45 },
      lastMonth: { amount: 16200, bookings: 38 },
      total: { amount: 125000, bookings: 320 }
    };

    const earningsText = `\ud83d\udcb0 **Your Earnings**\n\n` +
      `\ud83d\udcc5 Today: ${earningsData.today.amount} UAH (${earningsData.today.bookings} bookings)\n` +
      `\ud83d\udcca This Week: ${earningsData.thisWeek.amount} UAH (${earningsData.thisWeek.bookings} bookings)\n` +
      `\ud83d\udcc8 This Month: ${earningsData.thisMonth.amount} UAH (${earningsData.thisMonth.bookings} bookings)\n` +
      `\ud83d\udcc9 Last Month: ${earningsData.lastMonth.amount} UAH (${earningsData.lastMonth.bookings} bookings)\n\n` +
      `\ud83c\udfc6 Total Earned: ${earningsData.total.amount} UAH (${earningsData.total.bookings} total bookings)`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('\ud83d\udcca Detailed Report', 'earnings_report')],
      [Markup.button.callback('\ud83d\udcb3 Payout History', 'payout_history')],
      [Markup.button.callback('\u2699\ufe0f Payment Settings', 'payment_settings')],
      [Markup.button.callback(messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(earningsText, {
      parse_mode: 'Markdown',
      ...keyboard
    });

  } catch (error) {
    logger.error('Error showing earnings:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Reviews ──

export async function showReviews(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user?.specialist) {
    await ctx.reply(messages[lang].accessDenied);
    return;
  }

  try {
    // Mock reviews
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

    await ctx.reply(`\u2b50 **Your Reviews**\n\nAverage Rating: ${avgRating.toFixed(1)}/5.0 (${reviews.length} reviews)\n`, {
      parse_mode: 'Markdown'
    });

    for (const review of reviews) {
      const stars = '\u2b50'.repeat(review.rating);
      const reviewText = `${stars} **${review.customer.firstName} ${review.customer.lastName}**\n` +
        `Service: ${review.service.name}\n` +
        `"${review.comment}"\n` +
        `\ud83d\udcc5 ${review.createdAt.toLocaleDateString()}`;

      await ctx.reply(reviewText, { parse_mode: 'Markdown' });
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('\ud83d\udcca Review Analytics', 'review_analytics')],
      [Markup.button.callback(messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply('Review management:', keyboard);

  } catch (error) {
    logger.error('Error showing reviews:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Analytics ──

export async function showAnalytics(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!['SPECIALIST', 'ADMIN'].includes(ctx.session.userType!)) {
    await ctx.reply(messages[lang].accessDenied);
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

    const analyticsText = `\ud83d\udcca **Analytics Dashboard**\n\n` +
      `\ud83d\udccb Total Bookings: ${analytics.totalBookings}\n` +
      `\u2705 Completed: ${analytics.completedBookings}\n` +
      `\u274c Cancelled: ${analytics.cancelledBookings}\n` +
      `\u2b50 Average Rating: ${analytics.averageRating}/5.0\n\n` +
      `\ud83d\udcb0 Total Revenue: ${analytics.totalRevenue} UAH\n` +
      `\ud83d\udcc5 This Month: ${analytics.thisMonthBookings} bookings, ${analytics.thisMonthRevenue} UAH\n\n` +
      `\ud83c\udfc6 Top Service: ${analytics.topService}\n` +
      `\ud83d\udcc8 Peak Day: ${analytics.peakDay}\n` +
      `\u23f0 Peak Hour: ${analytics.peakHour}`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('\ud83d\udcc8 Weekly Report', 'analytics_weekly'),
        Markup.button.callback('\ud83d\udcca Monthly Report', 'analytics_monthly')
      ],
      [
        Markup.button.callback('\ud83c\udfaf Service Performance', 'service_performance'),
        Markup.button.callback('\ud83d\udc65 Customer Insights', 'customer_insights')
      ],
      [Markup.button.callback(messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(analyticsText, {
      parse_mode: 'Markdown',
      ...keyboard
    });

  } catch (error) {
    logger.error('Error showing analytics:', error);
    await ctx.reply(messages[lang].error);
  }
}
