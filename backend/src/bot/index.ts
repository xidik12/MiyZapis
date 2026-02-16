import { Telegraf, Markup } from 'telegraf';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';
import { consumeLinkCode } from '@/utils/telegram-link-codes';

const SITE_URL = config.frontend?.url || 'https://miyzapis.com';

if (!config.telegram.botToken) {
  logger.warn('Telegram bot token not provided, bot will not start');
}

const bot = config.telegram.botToken ? new Telegraf(config.telegram.botToken) : null;

// Helper: safely edit or send a new message (editMessageText fails if message was already edited/deleted)
async function safeEdit(ctx: any, text: string, extra?: any) {
  try {
    await ctx.editMessageText(text, extra);
  } catch {
    await ctx.reply(text, extra);
  }
}

if (bot) {

  // ── /start command ──────────────────────────────────────────────────
  bot.start(async (ctx) => {
    const user = ctx.from;
    const payload = (ctx as any).startPayload || ctx.message?.text?.split(' ')[1] || '';

    logger.info('Bot /start received', { telegramId: user.id, payload });

    // Handle /start link_CODE — token-based account linking
    if (payload.startsWith('link_')) {
      await handleLinkCode(ctx, payload.slice(5));
      return;
    }

    // Handle /start link (without code) — redirect to website
    if (payload === 'link') {
      await ctx.reply(
        `To link your Telegram to MiyZapis, click "Link Telegram" on the website settings page — it will generate a code for you to send here.`,
        Markup.inlineKeyboard([
          [Markup.button.url('Open Settings', `${SITE_URL}/settings`)]
        ])
      );
      return;
    }

    // Handle /start login
    if (payload === 'login') {
      await ctx.reply(
        `To sign in with Telegram, visit the MiyZapis website.`,
        Markup.inlineKeyboard([
          [Markup.button.url('Open Login Page', `${SITE_URL}/auth/login`)]
        ])
      );
      return;
    }

    // Regular /start — welcome or welcome back
    try {
      let dbUser = await prisma.user.findUnique({
        where: { telegramId: user.id.toString() }
      });

      if (!dbUser) {
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
          [
            `Welcome to MiyZapis, ${user.first_name}!`,
            '',
            'Your account is ready. You can:',
            '- Browse and book services',
            '- Find specialists near you',
            '- Leave reviews and earn points',
          ].join('\n'),
          Markup.inlineKeyboard([
            [Markup.button.callback('Browse Services', 'browse_services')],
            [Markup.button.url('Open Website', SITE_URL)],
            [Markup.button.callback('Help', 'help')]
          ])
        );
      } else {
        await ctx.reply(
          `Welcome back, ${user.first_name}! What would you like to do?`,
          Markup.inlineKeyboard([
            [Markup.button.callback('Browse Services', 'browse_services')],
            [Markup.button.callback('My Bookings', 'my_bookings'), Markup.button.callback('My Profile', 'my_profile')],
            [Markup.button.url('Open Website', SITE_URL)]
          ])
        );
      }
    } catch (error) {
      logger.error('Bot start error:', error);
      await ctx.reply('Something went wrong. Please try /start again.');
    }
  });

  // ── Text messages — handle link codes sent as plain text ────────────
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();

    // Accept link codes in formats: "link_abc123", "LINK_abc123", or just the code
    if (/^(link_)?[a-f0-9]{8}$/i.test(text)) {
      const code = text.replace(/^link_/i, '');
      await handleLinkCode(ctx, code);
      return;
    }

    // Default response for unrecognized text
    await ctx.reply(
      'Use /start to see the main menu, or send a link code from the website to connect your account.',
      Markup.inlineKeyboard([
        [Markup.button.callback('Main Menu', 'main_menu')]
      ])
    );
  });

  // ── Link code handler (shared by /start link_CODE and text messages) ──
  async function handleLinkCode(ctx: any, code: string) {
    const telegramId = ctx.from.id.toString();

    try {
      const linkedUserId = consumeLinkCode(code);

      if (!linkedUserId) {
        await ctx.reply(
          'This link code is expired or invalid.\n\nGo back to Settings > Connected Accounts and click "Link Telegram" to get a fresh code.',
          Markup.inlineKeyboard([
            [Markup.button.url('Open Settings', `${SITE_URL}/settings`)]
          ])
        );
        return;
      }

      // Check if this Telegram is already linked to a different account
      const existingUser = await prisma.user.findFirst({
        where: { telegramId, id: { not: linkedUserId } }
      });

      if (existingUser) {
        await ctx.reply(
          'This Telegram account is already linked to a different MiyZapis account. Unlink it from the other account first.'
        );
        return;
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
        [
          'Telegram linked successfully!',
          '',
          `${linkedUser?.firstName || 'Your account'} is now connected.`,
          'You will receive booking notifications here.',
        ].join('\n'),
        Markup.inlineKeyboard([
          [Markup.button.url('Open Website', SITE_URL)],
          [Markup.button.callback('Main Menu', 'main_menu')]
        ])
      );

      logger.info('Telegram account linked via bot', { telegramId, userId: linkedUserId });
    } catch (error) {
      logger.error('Bot link error:', error);
      await ctx.reply('Something went wrong while linking. Please try again.');
    }
  }

  // ── Browse Services ─────────────────────────────────────────────────
  bot.action('browse_services', async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch {}

    try {
      const categories = [
        { id: 'haircut', name: 'Hair & Beauty', icon: '✂' },
        { id: 'massage', name: 'Massage & Spa', icon: '💆' },
        { id: 'fitness', name: 'Fitness', icon: '💪' },
        { id: 'beauty', name: 'Nails & Beauty', icon: '💅' },
        { id: 'tattoo', name: 'Tattoo & Piercing', icon: '🎨' },
        { id: 'therapy', name: 'Therapy & Wellness', icon: '🧘' }
      ];

      const keyboard = categories.map(cat => [
        Markup.button.callback(`${cat.icon} ${cat.name}`, `category_${cat.id}`)
      ]);
      keyboard.push([Markup.button.callback('< Back', 'main_menu')]);

      await safeEdit(ctx,
        'Browse Service Categories\n\nChoose a category:',
        Markup.inlineKeyboard(keyboard)
      );
    } catch (error) {
      logger.error('Browse services error:', error);
      await ctx.reply('Could not load categories. Try /start.');
    }
  });

  // ── My Bookings ─────────────────────────────────────────────────────
  bot.action('my_bookings', async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch {}

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from?.id.toString() },
        include: {
          customerBookings: {
            include: {
              service: true
            },
            orderBy: { scheduledAt: 'desc' },
            take: 5
          }
        }
      });

      if (!user || user.customerBookings.length === 0) {
        await safeEdit(ctx,
          'You don\'t have any bookings yet.\n\nBrowse services to book your first appointment!',
          Markup.inlineKeyboard([
            [Markup.button.callback('Browse Services', 'browse_services')],
            [Markup.button.callback('< Back', 'main_menu')]
          ])
        );
        return;
      }

      const lines = ['Your Recent Bookings\n'];

      for (const booking of user.customerBookings) {
        const date = new Date(booking.scheduledAt).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        const time = new Date(booking.scheduledAt).toLocaleTimeString('en-GB', {
          hour: '2-digit', minute: '2-digit'
        });
        const status = booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase();
        lines.push(`${booking.service.name}`);
        lines.push(`  ${date} at ${time} — ${status}`);
        lines.push(`  $${booking.totalAmount}\n`);
      }

      await safeEdit(ctx,
        lines.join('\n'),
        Markup.inlineKeyboard([
          [Markup.button.callback('Browse Services', 'browse_services')],
          [Markup.button.callback('< Back', 'main_menu')]
        ])
      );
    } catch (error) {
      logger.error('My bookings error:', error);
      await ctx.reply('Could not load bookings. Try /start.');
    }
  });

  // ── My Profile ──────────────────────────────────────────────────────
  bot.action('my_profile', async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch {}

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId: ctx.from?.id.toString() }
      });

      if (!user) {
        await ctx.reply('Account not found. Press /start to create one.');
        return;
      }

      const memberSince = new Date(user.createdAt).toLocaleDateString('en-GB', {
        month: 'long', year: 'numeric'
      });

      await safeEdit(ctx,
        [
          'Your Profile',
          '',
          `Name: ${user.firstName} ${user.lastName || ''}`.trim(),
          `Email: ${user.email}`,
          `Type: ${user.userType}`,
          `Points: ${user.loyaltyPoints}`,
          `Member since: ${memberSince}`,
        ].join('\n'),
        Markup.inlineKeyboard([
          [Markup.button.callback('My Bookings', 'my_bookings')],
          [Markup.button.url('Edit on Website', `${SITE_URL}/settings`)],
          [Markup.button.callback('< Back', 'main_menu')]
        ])
      );
    } catch (error) {
      logger.error('My profile error:', error);
      await ctx.reply('Could not load profile. Try /start.');
    }
  });

  // ── Category Selection ──────────────────────────────────────────────
  bot.action(/category_(.+)/, async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch {}

    const category = ctx.match[1];

    try {
      const services = await prisma.service.findMany({
        where: { category, isActive: true },
        include: {
          specialist: {
            include: { user: true }
          }
        },
        take: 5
      });

      if (services.length === 0) {
        await safeEdit(ctx,
          `No services in "${category}" yet.`,
          Markup.inlineKeyboard([
            [Markup.button.callback('< Back to Categories', 'browse_services')],
            [Markup.button.callback('Main Menu', 'main_menu')]
          ])
        );
        return;
      }

      const lines = [`Services — ${category}\n`];

      for (const service of services) {
        lines.push(`${service.name}`);
        lines.push(`  by ${service.specialist.user.firstName} ${service.specialist.user.lastName || ''}`);
        lines.push(`  $${service.basePrice} / ${service.duration}min\n`);
      }

      lines.push('Visit the website to book!');

      await safeEdit(ctx,
        lines.join('\n'),
        Markup.inlineKeyboard([
          [Markup.button.url('Book on Website', SITE_URL)],
          [Markup.button.callback('< Back to Categories', 'browse_services')],
          [Markup.button.callback('Main Menu', 'main_menu')]
        ])
      );
    } catch (error) {
      logger.error('Category services error:', error);
      await ctx.reply('Could not load services. Try /start.');
    }
  });

  // ── Main Menu ───────────────────────────────────────────────────────
  bot.action('main_menu', async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch {}

    try {
      await safeEdit(ctx,
        'What would you like to do?',
        Markup.inlineKeyboard([
          [Markup.button.callback('Browse Services', 'browse_services')],
          [Markup.button.callback('My Bookings', 'my_bookings'), Markup.button.callback('My Profile', 'my_profile')],
          [Markup.button.url('Open Website', SITE_URL)]
        ])
      );
    } catch (error) {
      await ctx.reply(
        'What would you like to do?',
        Markup.inlineKeyboard([
          [Markup.button.callback('Browse Services', 'browse_services')],
          [Markup.button.callback('My Bookings', 'my_bookings'), Markup.button.callback('My Profile', 'my_profile')],
          [Markup.button.url('Open Website', SITE_URL)]
        ])
      );
    }
  });

  // ── Help ────────────────────────────────────────────────────────────
  bot.action('help', async (ctx) => {
    try {
      await ctx.answerCbQuery();
    } catch {}

    try {
      await safeEdit(ctx,
        [
          'Help',
          '',
          'Browse Services — discover specialists',
          'My Bookings — view your appointments',
          'My Profile — your account info',
          '',
          'For full features, visit miyzapis.com',
        ].join('\n'),
        Markup.inlineKeyboard([
          [Markup.button.url('Open Website', SITE_URL)],
          [Markup.button.callback('< Back', 'main_menu')]
        ])
      );
    } catch (error) {
      await ctx.reply('Visit miyzapis.com for help and support.');
    }
  });

  // ── Global error handler ────────────────────────────────────────────
  bot.catch((err: any, ctx: any) => {
    logger.error('Bot unhandled error:', err);
    try {
      ctx.reply('Something went wrong. Try /start.');
    } catch {}
  });

  logger.info('Telegram bot configured successfully');
} else {
  logger.warn('Telegram bot not initialized - missing bot token');
}

export { bot };
