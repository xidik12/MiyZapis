import { BotContext } from './types';
import { messages, Lang } from './messages';
import { config } from '@/config';

export function getUserLanguage(ctx: BotContext): Lang {
  return (ctx.session.language || 'en') as Lang;
}

export function msg(ctx: BotContext): (typeof messages)['en'] {
  const lang = getUserLanguage(ctx);
  return messages[lang] as (typeof messages)['en'];
}

export function getSiteUrl(): string {
  return config.frontend?.url || 'https://miyzapis.com';
}

export function getMiniAppUrl(): string {
  return process.env.TELEGRAM_MINI_APP_URL || 'https://miyzapis-telegram-miniapp-production.up.railway.app';
}

export function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    'PENDING': '\u23f3',
    'PENDING_PAYMENT': '\ud83d\udcb3',
    'CONFIRMED': '\u2705',
    'IN_PROGRESS': '\ud83d\udd04',
    'COMPLETED': '\u2705',
    'CANCELLED': '\u274c',
    'REFUNDED': '\ud83d\udcb8'
  };

  return emojis[status] || '\u2753';
}

export function formatMessage(template: string, data: Record<string, any>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] || match;
  });
}

export function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function isAdmin(ctx: BotContext): boolean {
  return ctx.session.user?.userType === 'ADMIN';
}
