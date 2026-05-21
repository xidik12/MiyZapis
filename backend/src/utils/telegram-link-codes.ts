import crypto from 'crypto';
import { cacheUtils } from '@/config/redis';
import { logger } from '@/utils/logger';

/**
 * Telegram account-link codes — short-lived (5 min) one-time tokens that
 * pair the user's web session with their Telegram identity.
 *
 * Storage: Redis (so the API server and the bot — which may run in
 * separate processes or replicas — share state). A small in-memory
 * fallback keeps things working in dev or when Redis is briefly down.
 */

interface LinkCodeData {
  userId: string;
}

const TTL_SECONDS = 5 * 60;
const KEY_PREFIX = 'tg-link:';

// Fallback in-memory store — only used if Redis is unavailable.
// Codes carry their own expiry so even the fallback enforces TTL.
const memoryFallback = new Map<string, { userId: string; expiresAt: number }>();

function cleanFallbackExpired(): void {
  const now = Date.now();
  for (const [code, data] of memoryFallback) {
    if (data.expiresAt < now) memoryFallback.delete(code);
  }
}

/**
 * Generate a one-time 8-hex-char link code, store it with a 5-minute TTL,
 * and return it. Caller sends this to the Telegram bot via deep link.
 */
export async function generateLinkCode(userId: string): Promise<string> {
  const code = crypto.randomBytes(4).toString('hex'); // 8 chars

  const key = `${KEY_PREFIX}${code}`;
  const payload: LinkCodeData = { userId };

  try {
    await cacheUtils.set(key, payload, TTL_SECONDS);
  } catch (err) {
    logger.warn('Telegram link code: Redis set failed, using in-memory fallback', err);
    cleanFallbackExpired();
    memoryFallback.set(code, { userId, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }

  return code;
}

/**
 * Verify and consume a link code. Returns the userId on success, null if
 * the code is invalid or expired. One-time use: a successful consume
 * deletes the code.
 */
export async function consumeLinkCode(code: string): Promise<string | null> {
  const key = `${KEY_PREFIX}${code}`;

  // Try Redis first.
  try {
    const data = await cacheUtils.get<LinkCodeData>(key);
    if (data?.userId) {
      await cacheUtils.del(key);
      return data.userId;
    }
  } catch (err) {
    logger.warn('Telegram link code: Redis get failed, checking in-memory fallback', err);
  }

  // Fallback to in-memory.
  cleanFallbackExpired();
  const entry = memoryFallback.get(code);
  if (entry && entry.expiresAt > Date.now()) {
    memoryFallback.delete(code);
    return entry.userId;
  }

  return null;
}
