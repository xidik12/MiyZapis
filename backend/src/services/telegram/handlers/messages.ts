import { Telegraf } from 'telegraf';
import { BotContext } from '../types';
import { handleLinkCode, showMainMenu } from '../commands';
import { handleServiceSearch, handleProfileSetup, handleLocation, handleContact, handlePhoto, handleDocument } from './customer';
import { handleAddServiceStep } from './specialist';
import { handleBookingFlow } from './booking';
import { handleBroadcastCompose } from './admin';

export function registerMessageHandlers(
  bot: Telegraf<BotContext>,
  broadcastMessage: (message: string, userType?: 'CUSTOMER' | 'SPECIALIST' | 'ADMIN') => Promise<void>,
  getBotTelegram: () => any
) {
  // Handle text messages based on current state
  bot.on('text', async (ctx) => {
    const state = ctx.session.state;
    const step = ctx.session.step;
    const text = ctx.message.text;

    // Handle link codes sent as plain text
    if (/^(link_)?[a-f0-9]{8}$/i.test(text.trim())) {
      const code = text.trim().replace(/^link_/i, '');
      await handleLinkCode(ctx, code);
      return;
    }

    // Route text messages based on current state
    switch (state) {
      case 'service_search':
        await handleServiceSearch(ctx, text);
        break;
      case 'add_service':
        await handleAddServiceStep(ctx, text, step!);
        break;
      case 'profile_setup':
        await handleProfileSetup(ctx, text, step!);
        break;
      case 'booking_flow':
        await handleBookingFlow(ctx, text, step!);
        break;
      case 'broadcast_compose':
        await handleBroadcastCompose(ctx, text, broadcastMessage, getBotTelegram());
        break;
      default:
        await showMainMenu(ctx);
    }
  });

  // Handle location sharing
  bot.on('location', async (ctx) => {
    await handleLocation(ctx, ctx.message.location as any);
  });

  // Handle contact sharing
  bot.on('contact', async (ctx) => {
    await handleContact(ctx, ctx.message.contact);
  });

  // Handle photos
  bot.on('photo', async (ctx) => {
    await handlePhoto(ctx, ctx.message.photo);
  });

  // Handle documents
  bot.on('document', async (ctx) => {
    await handleDocument(ctx, ctx.message.document);
  });
}
