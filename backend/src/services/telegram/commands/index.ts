import { Telegraf, Markup } from 'telegraf';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { consumeLinkCode } from '@/utils/telegram-link-codes';
import { AuthService } from '@/services/auth';
import { BotContext } from '../types';
import { messages } from '../messages';
import { getUserLanguage, getSiteUrl, msg } from '../utils';
import {
  getCustomerMenuKeyboard,
  getSpecialistMenuKeyboard,
  getAdminMenuKeyboard,
} from '../keyboards';

// ── Navigation helpers ──

export async function showMainMenu(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user || !ctx.session.userType) {
    await handleNewUser(ctx);
    return;
  }

  let message: string;
  let keyboard: unknown;

  switch (ctx.session.userType) {
    case 'CUSTOMER':
      message = messages[lang].customerMainMenu;
      keyboard = getCustomerMenuKeyboard(lang);
      break;
    case 'SPECIALIST':
      message = messages[lang].specialistMainMenu;
      keyboard = getSpecialistMenuKeyboard(lang);
      break;
    case 'ADMIN':
      message = messages[lang].adminMainMenu;
      keyboard = getAdminMenuKeyboard(lang);
      break;
    default:
      await showUserTypeSelection(ctx);
      return;
  }

  await ctx.reply(message, keyboard);
}

export async function handleNewUser(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  // Show welcome message
  await ctx.reply(messages[lang].welcome);

  // Show language selection first
  await showLanguageSelection(ctx);
}

export async function showLanguageSelection(ctx: BotContext) {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('\ud83c\uddfa\ud83c\uddf8 English', 'lang_en')],
    [Markup.button.callback('\ud83c\uddfa\ud83c\udde6 \u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430', 'lang_uk')],
    [Markup.button.callback('\ud83c\uddf7\ud83c\uddfa \u0420\u0443\u0441\u0441\u043a\u0438\u0439', 'lang_ru')]
  ]);

  await ctx.reply(
    'Please choose your preferred language / \u0411\u0443\u0434\u044c \u043b\u0430\u0441\u043a\u0430, \u043e\u0431\u0435\u0440\u0456\u0442\u044c \u043c\u043e\u0432\u0443 / \u041f\u043e\u0436\u0430\u043b\u0443\u0439\u0441\u0442\u0430, \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u044f\u0437\u044b\u043a:',
    keyboard
  );
}

export async function setUserLanguage(ctx: BotContext, language: string) {
  ctx.session.language = language;
  const lang = language as keyof typeof messages;

  // Update user language in database if user exists
  if (ctx.session.user) {
    await prisma.user.update({
      where: { id: ctx.session.user.id },
      data: { language }
    });
  }

  await ctx.editMessageText(messages[lang].langSet);

  // If user doesn't exist yet, show user type selection
  if (!ctx.session.user) {
    setTimeout(async () => {
      await showUserTypeSelection(ctx);
    }, 1000);
  } else {
    setTimeout(async () => {
      await showMainMenu(ctx);
    }, 1000);
  }
}

export async function showUserTypeSelection(ctx: BotContext, switching = false) {
  const lang = getUserLanguage(ctx);

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('\ud83d\udc64 Customer', 'usertype_customer')],
    [Markup.button.callback('\ud83c\udfe2 Specialist', 'usertype_specialist')]
  ]);

  const message = switching
    ? 'Select user type to switch to:'
    : messages[lang].selectUserType;

  await ctx.reply(message, keyboard);
}

export async function setUserType(ctx: BotContext, userType: string) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user) {
    // Create new user
    await createNewUser(ctx, userType as 'CUSTOMER' | 'SPECIALIST');
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
    ? messages[lang].customerSelected
    : messages[lang].specialistSelected;

  await ctx.editMessageText(message);

  setTimeout(async () => {
    await showMainMenu(ctx);
  }, 1000);
}

async function createNewUser(ctx: BotContext, userType: 'CUSTOMER' | 'SPECIALIST') {
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
    const result = await AuthService.authenticateWithTelegram(authData);
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
    const lang = getUserLanguage(ctx);
    await ctx.reply(messages[lang].error);
  }
}

// ── Link code handler ──

export async function handleLinkCode(ctx: BotContext, code: string) {
  const telegramId = ctx.from!.id.toString();
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  try {
    const linkedUserId = consumeLinkCode(code);

    if (!linkedUserId) {
      await ctx.reply(
        lang === 'uk'
          ? '\u0426\u0435\u0439 \u043a\u043e\u0434 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0437\u0430\u043a\u0456\u043d\u0447\u0438\u0432\u0441\u044f \u0430\u0431\u043e \u043d\u0435\u0434\u0456\u0439\u0441\u043d\u0438\u0439.\n\n\u041f\u0435\u0440\u0435\u0439\u0434\u0456\u0442\u044c \u0434\u043e \u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u044c > \u041f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0456 \u0430\u043a\u0430\u0443\u043d\u0442\u0438 \u0456 \u043d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c "\u041f\u0456\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0438 Telegram", \u0449\u043e\u0431 \u043e\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u043d\u043e\u0432\u0438\u0439 \u043a\u043e\u0434.'
          : lang === 'ru'
          ? '\u042d\u0442\u043e\u0442 \u043a\u043e\u0434 \u0441\u0441\u044b\u043b\u043a\u0438 \u0438\u0441\u0442\u0451\u043a \u0438\u043b\u0438 \u043d\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u0435\u043d.\n\n\u041f\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u0432 \u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 > \u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d\u043d\u044b\u0435 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u044b \u0438 \u043d\u0430\u0436\u043c\u0438\u0442\u0435 "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c Telegram", \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043d\u043e\u0432\u044b\u0439 \u043a\u043e\u0434.'
          : 'This link code is expired or invalid.\n\nGo back to Settings > Connected Accounts and click "Link Telegram" to get a fresh code.',
        Markup.inlineKeyboard([
          [Markup.button.url('\ud83c\udf10 Open Settings', `${siteUrl}/settings`)]
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
            ? '\u0426\u0435\u0439 Telegram \u0430\u043a\u0430\u0443\u043d\u0442 \u0432\u0436\u0435 \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e \u0434\u043e \u0456\u043d\u0448\u043e\u0433\u043e \u043f\u0440\u043e\u0444\u0456\u043b\u044e MiyZapis. \u0421\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u0432\u0456\u0434\u043a\u043b\u044e\u0447\u0456\u0442\u044c \u0439\u043e\u0433\u043e \u0432 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f\u0445 \u0456\u043d\u0448\u043e\u0433\u043e \u0430\u043a\u0430\u0443\u043d\u0442\u0430.'
            : lang === 'ru'
            ? '\u042d\u0442\u043e\u0442 Telegram \u0430\u043a\u043a\u0430\u0443\u043d\u0442 \u0443\u0436\u0435 \u043f\u0440\u0438\u0432\u044f\u0437\u0430\u043d \u043a \u0434\u0440\u0443\u0433\u043e\u043c\u0443 \u043f\u0440\u043e\u0444\u0438\u043b\u044e MiyZapis. \u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043e\u0442\u043a\u043b\u044e\u0447\u0438\u0442\u0435 \u0435\u0433\u043e \u0432 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430\u0445 \u0434\u0440\u0443\u0433\u043e\u0433\u043e \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430.'
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
        ? `Telegram \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e \u0443\u0441\u043f\u0456\u0448\u043d\u043e!\n\n${linkedUser?.firstName || '\u0412\u0430\u0448 \u0430\u043a\u0430\u0443\u043d\u0442'} \u0442\u0435\u043f\u0435\u0440 \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0439.\n\u0412\u0438 \u0431\u0443\u0434\u0435\u0442\u0435 \u043e\u0442\u0440\u0438\u043c\u0443\u0432\u0430\u0442\u0438 \u0441\u043f\u043e\u0432\u0456\u0449\u0435\u043d\u043d\u044f \u043f\u0440\u043e \u0431\u0440\u043e\u043d\u044e\u0432\u0430\u043d\u043d\u044f \u0442\u0443\u0442.`
        : lang === 'ru'
        ? `Telegram \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d \u0443\u0441\u043f\u0435\u0448\u043d\u043e!\n\n${linkedUser?.firstName || '\u0412\u0430\u0448 \u0430\u043a\u043a\u0430\u0443\u043d\u0442'} \u0442\u0435\u043f\u0435\u0440\u044c \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d.\n\u0412\u044b \u0431\u0443\u0434\u0435\u0442\u0435 \u043f\u043e\u043b\u0443\u0447\u0430\u0442\u044c \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u043e \u0431\u0440\u043e\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u044f\u0445 \u0437\u0434\u0435\u0441\u044c.`
        : `Telegram linked successfully!\n\n${linkedUser?.firstName || 'Your account'} is now connected.\nYou will receive booking notifications here.`,
      Markup.inlineKeyboard([
        [Markup.button.url('\ud83c\udf10 Open Website', siteUrl)],
        [Markup.button.callback('\ud83c\udfe0 Main Menu', 'main_menu')]
      ])
    );

    logger.info('Telegram account linked via enhanced bot', { telegramId, userId: linkedUserId });
  } catch (error) {
    logger.error('Enhanced bot link error:', error);
    await ctx.reply(
      lang === 'uk'
        ? '\u0429\u043e\u0441\u044c \u043f\u0456\u0448\u043b\u043e \u043d\u0435 \u0442\u0430\u043a \u043f\u0440\u0438 \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043d\u0456. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437.'
        : lang === 'ru'
        ? '\u0427\u0442\u043e-\u0442\u043e \u043f\u043e\u0448\u043b\u043e \u043d\u0435 \u0442\u0430\u043a \u043f\u0440\u0438 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.'
        : 'Something went wrong while linking. Please try again.'
    );
  }
}

// ── /start handler with login/link payload support ──

export async function handleStartCommand(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const payload = (ctx.message as any)?.text?.split(' ')[1];
  const siteUrl = getSiteUrl();

  // Handle /start link_CODE
  if (payload && payload.startsWith('link_')) {
    await handleLinkCode(ctx, payload.slice(5));
    return;
  }

  // Handle /start link
  if (payload === 'link') {
    await ctx.reply(
      lang === 'uk'
        ? `\ud83d\udd17 \u0429\u043e\u0431 \u043f\u0456\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0438 Telegram, \u043d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c "\u041f\u0456\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u0438 Telegram" \u043d\u0430 \u0441\u0442\u043e\u0440\u0456\u043d\u0446\u0456 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u044c \u0441\u0430\u0439\u0442\u0443 \u2014 \u0432\u0430\u043c \u0431\u0443\u0434\u0435 \u0437\u0433\u0435\u043d\u0435\u0440\u043e\u0432\u0430\u043d\u043e \u043a\u043e\u0434 \u0434\u043b\u044f \u0432\u0456\u0434\u043f\u0440\u0430\u0432\u043a\u0438 \u0441\u044e\u0434\u0438.`
        : lang === 'ru'
        ? `\ud83d\udd17 \u0427\u0442\u043e\u0431\u044b \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c Telegram, \u043d\u0430\u0436\u043c\u0438\u0442\u0435 "\u041f\u043e\u0434\u043a\u043b\u044e\u0447\u0438\u0442\u044c Telegram" \u043d\u0430 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043a \u0441\u0430\u0439\u0442\u0430 \u2014 \u0432\u0430\u043c \u0431\u0443\u0434\u0435\u0442 \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d \u043a\u043e\u0434 \u0434\u043b\u044f \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438 \u0441\u044e\u0434\u0430.`
        : `\ud83d\udd17 To link your Telegram to MiyZapis, click "Link Telegram" on the website settings page \u2014 it will generate a code for you to send here.`,
      Markup.inlineKeyboard([
        [Markup.button.url('\ud83c\udf10 Open Settings', `${siteUrl}/settings`)],
        [Markup.button.callback('\ud83c\udfe0 Main Menu', 'main_menu')]
      ])
    );
    return;
  }

  // Handle /start login
  if (payload === 'login') {
    try {
      const user = ctx.from;
      const telegramId = user!.id.toString();

      let dbUser = await prisma.user.findUnique({
        where: { telegramId }
      });

      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            telegramId,
            firstName: user!.first_name || 'User',
            lastName: user!.last_name || '',
            email: `telegram_${user!.id}@temp.com`,
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
          ? `\u0412\u0456\u0442\u0430\u0454\u043c\u043e, ${user!.first_name}! \u041d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c \u043d\u0438\u0436\u0447\u0435, \u0449\u043e\u0431 \u0443\u0432\u0456\u0439\u0442\u0438.`
          : lang === 'ru'
          ? `\u0414\u043e\u0431\u0440\u043e \u043f\u043e\u0436\u0430\u043b\u043e\u0432\u0430\u0442\u044c, ${user!.first_name}! \u041d\u0430\u0436\u043c\u0438\u0442\u0435 \u043d\u0438\u0436\u0435, \u0447\u0442\u043e\u0431\u044b \u0432\u043e\u0439\u0442\u0438.`
          : `Welcome, ${user!.first_name}! Click below to sign in.`,
        Markup.inlineKeyboard([
          [Markup.button.url('\ud83d\udd11 Sign in to MiyZapis', loginUrl)]
        ])
      );

      logger.info('Enhanced bot login token generated', { telegramId, userId: dbUser.id });
    } catch (error) {
      logger.error('Enhanced bot login error:', error);
      await ctx.reply(
        lang === 'uk'
          ? '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0443\u0432\u0456\u0439\u0442\u0438. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437 \u0430\u0431\u043e \u0441\u043a\u043e\u0440\u0438\u0441\u0442\u0430\u0439\u0442\u0435\u0441\u044c \u0432\u0445\u043e\u0434\u043e\u043c \u0447\u0435\u0440\u0435\u0437 email.'
          : lang === 'ru'
          ? '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0432\u043e\u0439\u0442\u0438. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437 \u0438\u043b\u0438 \u0432\u043e\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u0439\u0442\u0435\u0441\u044c \u0432\u0445\u043e\u0434\u043e\u043c \u0447\u0435\u0440\u0435\u0437 email.'
          : 'Could not sign in. Please try again or use email login.',
        Markup.inlineKeyboard([
          [Markup.button.url('\ud83c\udf10 Open Login Page', `${siteUrl}/auth/login`)]
        ])
      );
    }
    return;
  }

  if (!ctx.session.user) {
    await handleNewUser(ctx);
    return;
  }

  await showMainMenu(ctx);
}

// ── Show help ──

export async function showHelp(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  let helpText = `**Help & Support**\n\n` +
    `\ud83d\udcde Support: +380 123 456 789\n` +
    `\ud83d\udce7 Email: support@miyzapis.com\n` +
    `\ud83c\udf10 Website: miyzapis.com\n\n` +
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
    [Markup.button.url('\ud83c\udf10 Open Website', siteUrl)],
    [Markup.button.callback(messages[lang].back, 'main_menu')]
  ]);

  await ctx.reply(helpText, { parse_mode: 'Markdown', ...keyboard });
}

// ── Show settings ──

export async function showSettings(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  const currentLang = lang === 'uk' ? '\ud83c\uddfa\ud83c\udde6 \u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430' : lang === 'ru' ? '\ud83c\uddf7\ud83c\uddfa \u0420\u0443\u0441\u0441\u043a\u0438\u0439' : '\ud83c\uddfa\ud83c\uddf8 English';
  const currentType = ctx.session.userType === 'SPECIALIST' ? '\ud83c\udfe2 Specialist' : ctx.session.userType === 'ADMIN' ? '\ud83d\udc68\u200d\ud83d\udcbc Admin' : '\ud83d\udc64 Customer';

  const settingsText = `\u2699\ufe0f **Settings**\n\n` +
    `\ud83c\udf10 Language: ${currentLang}\n` +
    `\ud83d\udc64 User type: ${currentType}`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('\ud83c\udf10 Change Language', 'lang_select')],
    [Markup.button.callback('\ud83d\udd04 Switch User Type', 'usertype_select')],
    [Markup.button.url('\ud83c\udf10 Website Settings', `${siteUrl}/settings`)],
    [Markup.button.callback(messages[lang].back, 'main_menu')]
  ]);

  await ctx.reply(settingsText, { parse_mode: 'Markdown', ...keyboard });
}

// ── Show profile (router) ──

export async function showProfile(ctx: BotContext) {
  if (ctx.session.userType === 'SPECIALIST') {
    // Import dynamically to avoid circular deps
    const { showSpecialistProfileView } = await import('../handlers/specialist');
    await showSpecialistProfileView(ctx);
  } else {
    const { showCustomerProfile } = await import('../handlers/customer');
    await showCustomerProfile(ctx);
  }
}

// ── Register all commands on bot ──

export function registerCommands(bot: Telegraf<BotContext>) {
  const { startServiceSearch } = require('../handlers/customer');
  const { showSpecialistServices, showScheduleManagement } = require('../handlers/specialist');
  const { showAdminPanel, showSystemStats } = require('../handlers/admin');
  const { showBookings } = require('../handlers/booking');

  bot.command('start', async (ctx) => {
    await handleStartCommand(ctx);
  });

  bot.command('menu', async (ctx) => {
    await showMainMenu(ctx);
  });

  bot.command('switch', async (ctx) => {
    await showUserTypeSelection(ctx, true);
  });

  bot.command('language', async (ctx) => {
    await showLanguageSelection(ctx);
  });

  bot.command('search', async (ctx) => {
    if (ctx.session.userType === 'CUSTOMER') {
      await startServiceSearch(ctx);
    } else {
      await ctx.reply('This command is only available for customers.');
    }
  });

  bot.command('bookings', async (ctx) => {
    await showBookings(ctx);
  });

  bot.command('profile', async (ctx) => {
    await showProfile(ctx);
  });

  bot.command('help', async (ctx) => {
    await showHelp(ctx);
  });

  bot.command('services', async (ctx) => {
    if (ctx.session.userType === 'SPECIALIST') {
      await showSpecialistServices(ctx);
    }
  });

  bot.command('schedule', async (ctx) => {
    if (ctx.session.userType === 'SPECIALIST') {
      await showScheduleManagement(ctx);
    }
  });

  bot.command('analytics', async (ctx) => {
    if (['SPECIALIST', 'ADMIN'].includes(ctx.session.userType!)) {
      const { showAnalytics } = require('../handlers/specialist');
      await showAnalytics(ctx);
    }
  });

  bot.command('admin', async (ctx) => {
    if (ctx.session.userType === 'ADMIN') {
      await showAdminPanel(ctx);
    } else {
      await ctx.reply('Access denied. Admin privileges required.');
    }
  });

  bot.command('stats', async (ctx) => {
    if (ctx.session.userType === 'ADMIN') {
      await showSystemStats(ctx);
    }
  });
}
