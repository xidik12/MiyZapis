import { Markup } from 'telegraf';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { ServiceService } from '@/services/service';
import { BotContext } from '../types';
import { messages } from '../messages';
import { getUserLanguage, getSiteUrl, getStatusEmoji } from '../utils';

// ── Service Search ──

export async function startServiceSearch(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  ctx.session.state = 'service_search';

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('\ud83c\udfe0 Home Services', 'category_home')],
    [Markup.button.callback('\ud83d\udc85 Beauty & Wellness', 'category_beauty')],
    [Markup.button.callback('\ud83d\udd27 Repair & Maintenance', 'category_repair')],
    [Markup.button.callback('\ud83c\udf93 Education & Training', 'category_education')],
    [Markup.button.callback('\ud83c\udfe5 Health & Medical', 'category_health')],
    [Markup.button.callback('\ud83d\ude97 Automotive', 'category_automotive')],
    [Markup.button.callback('\ud83d\udd0d Search by keyword', 'search_keyword')],
    [Markup.button.callback('\ud83d\udccd Search nearby', 'search_nearby')],
    [Markup.button.callback(messages[lang].back, 'main_menu')]
  ]);

  await ctx.reply('How would you like to search for services?', keyboard);
}

export async function handleServiceSearch(ctx: BotContext, query: string) {
  const lang = getUserLanguage(ctx);

  try {
    await ctx.reply(messages[lang].loading);

    const services = await ServiceService.searchServices(
      query,
      undefined,
      undefined,
      undefined,
      'rating',
      1,
      10
    );

    if (services.services.length === 0) {
      await ctx.reply(messages[lang].notFound);
      ctx.session.state = null;
      return;
    }

    await displayServices(ctx, services.services, 1, query);
    ctx.session.state = null;

  } catch (error) {
    logger.error('Service search error:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function displayServices(ctx: BotContext, services: Record<string, unknown>[], page: number, query?: string) {
  const lang = getUserLanguage(ctx);

  const pageSize = 5;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageServices = services.slice(startIndex, endIndex);

  for (const service of pageServices) {
    const specialistUser = service.specialist?.user;
    const serviceText = `\ud83c\udfea **${service.name}**\n\n` +
      `\ud83d\udcdd ${service.description}\n` +
      `\ud83d\udc64 ${specialistUser?.firstName || ''} ${specialistUser?.lastName || ''}\n` +
      `\u2b50 ${service.specialist?.rating || 0}/5 (${service.specialist?.reviewCount || 0} reviews)\n` +
      `\u23f1\ufe0f ${service.duration} min\n` +
      `\ud83d\udcb0 ${service.basePrice} ${service.currency}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('\ud83d\udcc5 Book Now', `book_${service.id}`)],
      [
        Markup.button.callback('\u2764\ufe0f Add to Favorites', `favorite_${service.id}`),
        Markup.button.callback('\u2139\ufe0f Details', `service_${service.id}`)
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
        Markup.button.callback('\u2b05\ufe0f Previous', `page_${page - 1}_services`)
      );
    }

    if (endIndex < services.length) {
      paginationButtons.push(
        Markup.button.callback('\u27a1\ufe0f Next', `page_${page + 1}_services`)
      );
    }

    if (paginationButtons.length > 0) {
      const paginationKeyboard = Markup.inlineKeyboard([
        paginationButtons,
        [Markup.button.callback(messages[lang].back, 'search_services')]
      ]);

      await ctx.reply(
        `Page ${page} of ${Math.ceil(services.length / pageSize)}`,
        paginationKeyboard
      );
    }
  }
}

export async function showServiceDetails(ctx: BotContext, serviceId: string) {
  const lang = getUserLanguage(ctx);

  try {
    const service = await ServiceService.getService(serviceId) as any;

    const detailsText = `\ud83c\udfea **${service.name}**\n\n` +
      `\ud83d\udcdd ${service.description}\n\n` +
      `\ud83d\udc64 **Specialist:** ${service.specialist?.user?.firstName || ''} ${service.specialist?.user?.lastName || ''}\n` +
      `\ud83c\udfe2 ${service.specialist?.businessName || ''}\n` +
      `\u2b50 ${service.specialist?.rating || 0}/5 (${service.specialist?.reviewCount || 0} reviews)\n\n` +
      `\u23f1\ufe0f **Duration:** ${service.duration} minutes\n` +
      `\ud83d\udcb0 **Price:** ${service.basePrice} ${service.currency}\n` +
      `\ud83d\udccd **Location:** ${service.specialist?.address || 'To be arranged'}\n\n` +
      `\ud83d\udccb **Category:** ${service.category}\n` +
      `\ud83c\udff7\ufe0f **Tags:** ${service.tags || ''}`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('\ud83d\udcc5 Book This Service', `book_${serviceId}`)],
      [
        Markup.button.callback('\u2764\ufe0f Add to Favorites', `favorite_${serviceId}`),
        Markup.button.callback('\ud83d\udc64 View Specialist', `specialist_${service.specialist?.id}`)
      ],
      [Markup.button.callback(messages[lang].back, 'search_services')]
    ]);

    await ctx.reply(detailsText, {
      parse_mode: 'Markdown',
      ...keyboard
    });

  } catch (error) {
    logger.error('Error showing service details:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function searchByCategory(ctx: BotContext, category: string) {
  const lang = getUserLanguage(ctx);

  try {
    await ctx.reply(messages[lang].loading);

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
      undefined,
      fullCategory,
      undefined,
      undefined,
      'rating',
      1,
      10
    );

    if (services.services.length === 0) {
      await ctx.reply(messages[lang].notFound);
      return;
    }

    await displayServices(ctx, services.services, 1);

  } catch (error) {
    logger.error('Error searching by category:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function requestLocation(ctx: BotContext) {
  const keyboard = Markup.keyboard([
    [Markup.button.locationRequest('\ud83d\udccd Share Location')]
  ]).resize();

  await ctx.reply(
    'Please share your location to find nearby services:',
    keyboard
  );
}

// ── Customer Profile ──

export async function showCustomerProfile(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  const user = ctx.session.user;
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown';

  const profileText = `\ud83d\udc64 **My Profile**\n\n` +
    `\ud83d\udcdb ${user.firstName || ''} ${user.lastName || ''}\n` +
    `\ud83d\udce7 ${user.email || 'Not set'}\n` +
    `\ud83d\udcf1 ${user.phoneNumber || 'Not set'}\n` +
    `\ud83c\udf81 Loyalty points: ${user.loyaltyPoints || 0}\n` +
    `\ud83d\udcc5 Member since: ${memberSince}`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('\ud83d\udcdd Edit on Website', `${siteUrl}/profile`)],
    [Markup.button.callback(messages[lang].back, 'main_menu')]
  ]);

  await ctx.reply(profileText, { parse_mode: 'Markdown', ...keyboard });
}

// ── Payment Methods ──

export async function showPaymentMethodsView(ctx: BotContext) {
  const lang = getUserLanguage(ctx);
  const siteUrl = getSiteUrl();

  const text = `\ud83d\udcb3 **Payment Methods**\n\n` +
    `Payment methods are managed on the website for security.\n` +
    `Tap below to manage your cards and payment options.`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('\ud83d\udcb3 Manage on Website', `${siteUrl}/settings/payments`)],
    [Markup.button.callback(messages[lang].back, 'main_menu')]
  ]);

  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

// ── Favorites ──

export async function showFavorites(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  try {
    const favorites = await (prisma as any).favoriteService.findMany({
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
      await ctx.reply('\u2764\ufe0f No favorites yet. Start exploring services to add them to your favorites!');
      return;
    }

    await ctx.reply(`\u2764\ufe0f **Your Favorites** (${favorites.length})\n`, { parse_mode: 'Markdown' });

    for (const favorite of favorites) {
      const service = favorite.service;
      const serviceText = `\ud83c\udfea **${service.name}**\n` +
        `\ud83d\udc64 ${service.specialist?.user?.firstName || ''} ${service.specialist?.user?.lastName || ''}\n` +
        `\ud83d\udcb0 ${service.basePrice} ${service.currency}\n` +
        `\u23f1\ufe0f ${service.duration} min`;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('\ud83d\udcc5 Book Now', `book_${service.id}`)],
        [
          Markup.button.callback('\ud83d\udc94 Remove', `favorite_${service.id}`),
          Markup.button.callback('\u2139\ufe0f Details', `service_${service.id}`)
        ]
      ]);

      await ctx.reply(serviceText, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    }

  } catch (error) {
    logger.error('Error showing favorites:', error);
    await ctx.reply(messages[lang].error);
  }
}

export async function toggleFavorite(ctx: BotContext, serviceId: string) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  try {
    const existingFavorite = await (prisma as any).favoriteService.findFirst({
      where: {
        userId: ctx.session.user.id,
        serviceId
      }
    });

    if (existingFavorite) {
      await (prisma as any).favoriteService.delete({
        where: { id: existingFavorite.id }
      });
      await ctx.reply('\ud83d\udc94 Removed from favorites');
    } else {
      await (prisma as any).favoriteService.create({
        data: {
          userId: ctx.session.user.id,
          serviceId
        }
      });
      await ctx.reply('\u2764\ufe0f Added to favorites');
    }

  } catch (error) {
    logger.error('Error toggling favorite:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Loyalty Points ──

export async function showLoyaltyPoints(ctx: BotContext) {
  const lang = getUserLanguage(ctx);

  if (!ctx.session.user) {
    await ctx.reply(messages[lang].loginRequired);
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { loyaltyPoints: true }
    });

    const points: number = user?.loyaltyPoints || 0;

    const rewards = [
      { points: 100, reward: '5% discount on next booking' },
      { points: 250, reward: '10% discount on next booking' },
      { points: 500, reward: 'Free service consultation' },
      { points: 1000, reward: '15% discount on next booking' }
    ];

    let rewardsText = `\ud83c\udf81 **Loyalty Points: ${points}**\n\n**Available Rewards:**\n\n`;

    for (const reward of rewards) {
      const status = points >= reward.points ? '\u2705' : '\ud83d\udd12';
      rewardsText += `${status} ${reward.points} points - ${reward.reward}\n`;
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('\ud83c\udfc6 Redeem Rewards', 'redeem_rewards')],
      [Markup.button.callback('\ud83d\udcca Points History', 'points_history')],
      [Markup.button.callback(messages[lang].back, 'main_menu')]
    ]);

    await ctx.reply(rewardsText, {
      parse_mode: 'Markdown',
      ...keyboard
    });

  } catch (error) {
    logger.error('Error showing loyalty points:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Profile Setup Flow ──

export async function handleProfileSetup(ctx: BotContext, text: string, step: string) {
  const lang = getUserLanguage(ctx);

  switch (step) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        await ctx.reply(messages[lang].invalidInput);
        return;
      }

      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { email: text }
      });

      await ctx.reply('\u2705 Email updated successfully!');
      ctx.session.state = null;
      const { showMainMenu } = await import('../commands');
      await showMainMenu(ctx);
      break;
  }
}

// ── Location handler ──

export async function handleLocation(ctx: BotContext, location: { latitude: number; longitude: number }) {
  const lang = getUserLanguage(ctx);

  try {
    if (ctx.session.user) {
      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {}
      });
    }

    await ctx.reply('\ud83d\udccd Location saved! Searching for nearby services...');

    const nearbyServices = await ServiceService.searchServices(
      undefined,
      undefined,
      undefined,
      undefined,
      'rating',
      1,
      10
    );

    if (nearbyServices.services.length > 0) {
      await displayServices(ctx, nearbyServices.services, 1);
    } else {
      await ctx.reply(messages[lang].notFound);
    }

  } catch (error) {
    logger.error('Error handling location:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Contact handler ──

export async function handleContact(ctx: BotContext, contact: { phone_number?: string; first_name?: string; last_name?: string; user_id?: number }) {
  const lang = getUserLanguage(ctx);

  try {
    if (ctx.session.user && contact.phone_number) {
      await prisma.user.update({
        where: { id: ctx.session.user.id },
        data: {
          phoneNumber: contact.phone_number,
          isPhoneVerified: true
        }
      });

      await ctx.reply('\ud83d\udcf1 Phone number updated successfully!');
    }

  } catch (error) {
    logger.error('Error handling contact:', error);
    await ctx.reply(messages[lang].error);
  }
}

// ── Photo handler ──

export async function handlePhoto(ctx: BotContext, photos: { file_id: string; width?: number; height?: number }[]) {
  const lang = getUserLanguage(ctx);

  if (ctx.session.state === 'profile_setup' && ctx.session.step === 'avatar') {
    try {
      const photo = photos[photos.length - 1];
      const fileId = photo.file_id;

      await ctx.reply('\u2705 Profile picture updated successfully!');
      ctx.session.state = null;
      const { showMainMenu } = await import('../commands');
      await showMainMenu(ctx);

    } catch (error) {
      logger.error('Error handling photo:', error);
      await ctx.reply(messages[lang].error);
    }
  }
}

// ── Document handler ──

export async function handleDocument(ctx: BotContext, document: { file_id: string; file_name?: string; mime_type?: string }) {
  const lang = getUserLanguage(ctx);

  if (ctx.session.userType === 'SPECIALIST') {
    try {
      const fileId = document.file_id;
      const fileName = document.file_name;

      await ctx.reply(`\ud83d\udcc4 Document "${fileName}" received. Our team will review it shortly.`);

    } catch (error) {
      logger.error('Error handling document:', error);
      await ctx.reply(messages[lang].error);
    }
  }
}

// ── Pagination handler ──

export async function handlePagination(ctx: BotContext, page: number, type: string) {
  switch (type) {
    case 'services':
      if (ctx.session.tempData?.lastQuery) {
        await handleServiceSearch(ctx, ctx.session.tempData.lastQuery);
      }
      break;
    case 'bookings':
      const { showBookings } = await import('./booking');
      await showBookings(ctx);
      break;
    default:
      const { showMainMenu } = await import('../commands');
      await showMainMenu(ctx);
  }
}
