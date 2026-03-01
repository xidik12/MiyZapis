/**
 * Re-export from the modular structure for backward compatibility.
 * All imports from '@/services/telegram/enhanced-bot' continue to work.
 *
 * The bot code has been split into:
 *   - types.ts          — BotContext, TelegramBotUser interfaces
 *   - messages.ts       — i18n message dictionaries (en, uk, ru)
 *   - keyboards.ts      — inline keyboard builders
 *   - utils.ts          — shared helpers (getUserLanguage, getStatusEmoji, etc.)
 *   - middleware.ts      — session & auth middleware
 *   - commands/index.ts  — /start, /menu, /help, /settings, etc.
 *   - handlers/callbacks.ts — all callback_query handlers
 *   - handlers/messages.ts  — text, location, contact, photo, document handlers
 *   - handlers/customer.ts  — customer-specific features
 *   - handlers/specialist.ts — specialist-specific features
 *   - handlers/booking.ts    — booking flow & management
 *   - handlers/admin.ts      — admin dashboard & management
 *   - index.ts               — EnhancedTelegramBot class (orchestrator)
 */
export { EnhancedTelegramBot, enhancedTelegramBot } from './index';
