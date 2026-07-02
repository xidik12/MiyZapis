import crypto from 'crypto';
import { config } from '@/config';

export interface TelegramWebAppUser {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
}

/**
 * Verify a Telegram Mini App `initData` string (HMAC-SHA256 with the "WebAppData"
 * key + 24h freshness) and return the authenticated Telegram user. Throws on any
 * failure. This is the ONLY trustworthy source of a caller's telegramId — never
 * trust a client-supplied telegramId directly.
 */
export function verifyTelegramInitData(initDataString: string): TelegramWebAppUser {
  if (!initDataString || typeof initDataString !== 'string') throw new Error('INIT_DATA_MISSING');
  const botToken = config.telegram.botToken;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN_NOT_CONFIGURED');

  const params = new URLSearchParams(initDataString);
  const hash = params.get('hash');
  if (!hash) throw new Error('INIT_DATA_HASH_MISSING');
  params.delete('hash');

  const dataCheckArray: string[] = [];
  for (const [k, v] of params.entries()) dataCheckArray.push(`${k}=${v}`);
  dataCheckArray.sort();
  const dataCheckString = dataCheckArray.join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (calculated !== hash) throw new Error('INIT_DATA_INVALID');

  const authDate = parseInt(params.get('auth_date') || '0', 10);
  if (!authDate || Math.floor(Date.now() / 1000) - authDate > 86400) throw new Error('INIT_DATA_EXPIRED');

  const userJson = params.get('user');
  if (!userJson) throw new Error('INIT_DATA_NO_USER');
  const u = JSON.parse(userJson);
  if (!u?.id) throw new Error('INIT_DATA_NO_USER_ID');

  return { id: String(u.id), first_name: u.first_name, last_name: u.last_name, username: u.username };
}
