import { Telegraf, Markup } from 'telegraf';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

const SITE_URL = config.frontend?.url || 'https://miyzapis.com';

if (!config.telegram.botToken) {
  logger.warn('Telegram bot token not provided, bot will not start');
}

const bot = config.telegram.botToken ? new Telegraf(config.telegram.botToken) : null;

if (bot) {
  // Start command
  bot.start(async (ctx) => {
    const user = ctx.from;
    const payload = (ctx as any).startPayload || ctx.message?.text?.split(' ')[1] || '';

    // Handle /start link — account linking from web Settings page
    if (payload === 'link') {
      const telegramId = user.id.toString();
      await ctx.reply(
        `🔗 *Telegram Account Linking*\n\nYour Telegram ID: \`${telegramId}\`\n\nTo link this Telegram account to your MiyZapis profile, use the Telegram Login widget on the website settings page.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('🌐 Open Settings', `${SITE_URL}/settings`)],
            [Markup.button.callback('🏠 Main Menu', 'main_menu')]
          ])
        }
      );
      return;
    }

    // Handle /start login — web login via Telegram
    if (payload === 'login') {
      await ctx.reply(
        `🔐 *Login via Telegram*\n\nTo sign in to MiyZapis with your Telegram account, use the Telegram Login widget on the website.`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('🌐 Open Login Page', `${SITE_URL}/auth/login`)],
            [Markup.button.callback('🏠 Main Menu', 'main_menu')]
          ])
        }
      );
      return;
    }

    try {
      // Check if user exists in database
      let dbUser = await prisma.user.findUnique({
        where: { telegramId: user.id.toString() }
      });

      if (!dbUser) {
        // Create new user
        dbUser = await prisma.user.create({
          data: {
            telegramId: user.id.toString(),
            firstName: user.first_name || 'User',
            lastName: user.last_name || '',
            email: `telegram_${user.id}@temp.com`,
            userType: 'CUSTOMER',
            isEmailVerified: false
          }
        });

        await ctx.reply(
          `🎉 *Welcome to MiyZapis, ${user.first_name}!*\n\nYour account has been created. You can now:\n• 📅 Browse and book services\n• 🔍 Find specialists near you\n• ⭐ Leave reviews and ratings\n• 🎁 Earn loyalty points\n\nLet's get started!`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🔍 Browse Services', 'browse_services')],
              [Markup.button.url('🌐 Open Website', SITE_URL)],
              [Markup.button.callback('👤 My Profile', 'my_profile')],
              [Markup.button.callback('❓ Help', 'help')]
            ])
          }
        );
      } else {
        await ctx.reply(
          `Welcome back, ${user.first_name}! 👋\n\nWhat would you like to do today?`,
          Markup.inlineKeyboard([
            [Markup.button.callback('🔍 Browse Services', 'browse_services')],
            [Markup.button.callback('📅 My Bookings', 'my_bookings')],
            [Markup.button.callback('👤 My Profile', 'my_profile')],
            [Markup.button.url('🌐 Open Website', SITE_URL)]
          ])
        );
      }
    } catch (error) {
      logger.error('Bot start error:', error);
      await ctx.reply('Sorry, something went wrong. Please try again later.');
    }
  });

  // Browse services
  bot.action('browse_services', async (ctx) => {
    await ctx.answerCbQuery();

    try {
      const categories = [
        { id: 'haircut', name: 'Hair & Beauty', icon: '✂️' },
        { id: 'massage', name: 'Massage & Spa', icon: '💆‍♀️' },
        { id: 'fitness', name: 'Fitness & Training', icon: '🏋️‍♂️' },
        { id: 'beauty', name: 'Beauty & Nails', icon: '💅' },
        { id: 'tattoo', name: 'Tattoo & Piercing', icon: '🎨' },
        { id: 'therapy', name: 'Therapy & Wellness', icon: '🧘‍♀️' }
      ];

      const keyboard = categories.map(cat => [
        Markup.button.callback(`${cat.icon} ${cat.name}`, `category_${cat.id}`)
      ]);

      keyboard.push([Markup.button.callback('🏠 Main Menu', 'main_menu')]);

      await ctx.editMessageText(
        '🔍 *Browse Service Categories*\n\nChoose a category to find specialists:',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard(keyboard)
        }
      );
    } catch (error) {
      logger.error('Browse services error:', error);
      await ctx.reply('Error loading categories. Please try again.');
    }
  });

  // My bookings
  bot.action('my_bookings', async (ctx) => {
    await ctx.answerCbQuery();

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from?.id.toString() },
        include: {
          customerBookings: {
            include: {
              service: {
                include: {
                  specialist: {
                    include: {
                      user: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!user || user.customerBookings.length === 0) {
        await ctx.editMessageText(
          '📅 *My Bookings*\n\nYou don\'t have any bookings yet.\n\nWould you like to browse services?',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('🔍 Browse Services', 'browse_services')],
              [Markup.button.callback('🏠 Main Menu', 'main_menu')]
            ])
          }
        );
        return;
      }

      let message = '📅 *My Recent Bookings*\n\n';

      user.customerBookings.forEach((booking, index) => {
        const date = new Date(booking.scheduledAt).toLocaleDateString();
        const time = new Date(booking.scheduledAt).toLocaleTimeString();
        message += `${index + 1}. *${booking.service.name}*\n`;
        message += `   👤 ${booking.service.specialist.user.firstName} ${booking.service.specialist.user.lastName}\n`;
        message += `   📅 ${date} at ${time}\n`;
        message += `   💰 $${booking.totalAmount}\n`;
        message += `   📊 Status: ${booking.status}\n\n`;
      });

      await ctx.editMessageText(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔍 Browse More Services', 'browse_services')],
            [Markup.button.callback('🏠 Main Menu', 'main_menu')]
          ])
        }
      );
    } catch (error) {
      logger.error('My bookings error:', error);
      await ctx.reply('Error loading bookings. Please try again.');
    }
  });

  // My profile
  bot.action('my_profile', async (ctx) => {
    await ctx.answerCbQuery();

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from?.id.toString() }
      });

      if (!user) {
        await ctx.reply('User not found. Please start the bot again with /start');
        return;
      }

      const message = `👤 *My Profile*\n\n` +
        `📝 Name: ${user.firstName} ${user.lastName}\n` +
        `📧 Email: ${user.email}\n` +
        `🎁 Loyalty Points: ${user.loyaltyPoints}\n` +
        `👤 Account Type: ${user.userType}\n` +
        `📅 Member since: ${new Date(user.createdAt).toLocaleDateString()}`;

      await ctx.editMessageText(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('📅 My Bookings', 'my_bookings')],
            [Markup.button.url('🌐 Open Website', SITE_URL)],
            [Markup.button.callback('🏠 Main Menu', 'main_menu')]
          ])
        }
      );
    } catch (error) {
      logger.error('My profile error:', error);
      await ctx.reply('Error loading profile. Please try again.');
    }
  });

  // Category selection
  bot.action(/category_(.+)/, async (ctx) => {
    await ctx.answerCbQuery();

    const category = ctx.match[1];

    try {
      const services = await prisma.service.findMany({
        where: {
          category,
          isActive: true
        },
        include: {
          specialist: {
            include: {
              user: true
            }
          }
        },
        take: 5
      });

      if (services.length === 0) {
        await ctx.editMessageText(
          `No services found in this category yet.\n\nWould you like to browse other categories?`,
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Categories', 'browse_services')],
            [Markup.button.callback('🏠 Main Menu', 'main_menu')]
          ])
        );
        return;
      }

      let message = `🔍 *Services in ${category}*\n\n`;

      services.forEach((service, index) => {
        message += `${index + 1}. *${service.name}*\n`;
        message += `   👤 ${service.specialist.user.firstName} ${service.specialist.user.lastName}\n`;
        message += `   💰 $${service.basePrice} • ⏱️ ${service.duration}min\n`;
        message += `   ⭐ ${service.specialist.rating}/5 (${service.specialist.reviewCount} reviews)\n\n`;
      });

      message += `💡 *To book a service, visit our website!*`;

      await ctx.editMessageText(
        message,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.url('🌐 Book on Website', SITE_URL)],
            [Markup.button.callback('🔙 Back to Categories', 'browse_services')],
            [Markup.button.callback('🏠 Main Menu', 'main_menu')]
          ])
        }
      );
    } catch (error) {
      logger.error('Category services error:', error);
      await ctx.reply('Error loading services. Please try again.');
    }
  });

  // Main menu
  bot.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();

    await ctx.editMessageText(
      `🏠 *Main Menu*\n\nWhat would you like to do?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔍 Browse Services', 'browse_services')],
          [Markup.button.callback('📅 My Bookings', 'my_bookings')],
          [Markup.button.callback('👤 My Profile', 'my_profile')],
          [Markup.button.url('🌐 Open Website', SITE_URL)]
        ])
      }
    );
  });

  // Help command
  bot.action('help', async (ctx) => {
    await ctx.answerCbQuery();

    const helpText = `❓ *Help & Support*\n\n` +
      `🔍 *Browse Services* - Find and explore available services\n` +
      `📅 *My Bookings* - View your booking history\n` +
      `👤 *My Profile* - View your account information\n` +
      `🌐 *Website* - Full booking functionality at miyzapis.com\n\n` +
      `📞 *Need help?* Contact our support team through the website.`;

    await ctx.editMessageText(
      helpText,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.url('🌐 Open Website', SITE_URL)],
          [Markup.button.callback('🏠 Main Menu', 'main_menu')]
        ])
      }
    );
  });

  // Error handling
  bot.catch((err: any, ctx: any) => {
    logger.error('Bot error:', err);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  });

  logger.info('Telegram bot configured successfully');
} else {
  logger.warn('Telegram bot not initialized - missing bot token');
}

export { bot };
