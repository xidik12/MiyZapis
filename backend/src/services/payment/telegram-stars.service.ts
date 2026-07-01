import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from '@/config';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { specialistSubscriptionService } from './subscription.service';
import { PromoteService } from '@/services/promote/promote.service';
import { redis } from '@/config/redis';

// ---------------------------------------------------------------------------
// Telegram Stars — recurring specialist subscription billing.
//
// Flow:
//   1. Specialist taps "Subscribe" → POST /crypto-payments/telegram-stars/invoice
//      → createSubscriptionInvoiceLink() returns a tg invoice link (currency XTR,
//      subscription_period = 30d → Telegram auto-renews monthly).
//   2. They pay inside Telegram. The bot receives pre_checkout_query (we approve)
//      then a successful_payment message (we activate the subscription).
//   3. Each renewal cycle Telegram sends another successful_payment → we extend.
//   4. Cancel → editUserStarSubscription(is_canceled=true): auto-renew off, stays
//      active until the current period ends.
//
// Stars are priced in whole Stars (XTR). Default 500/mo (~$6–7), override with
// TELEGRAM_STARS_MONTHLY.
// ---------------------------------------------------------------------------

const PAYLOAD_MONTHLY = 'sub:'; // recurring monthly → `sub:<specialist User.id>`
const PAYLOAD_SIXMONTH = 'sub6:'; // one-time 6-month → `sub6:<specialist User.id>`
const PAYLOAD_ANNUAL = 'subyr:'; // one-time annual → `subyr:<specialist User.id>`
const PAYLOAD_BOOST = 'boost:'; // one-time boost → `boost:<days>:<specialist User.id>`
const PAYLOAD_AI = 'ai:'; // recurring monthly AI Premium → `ai:<User.id>` (any user)
const AI_PREMIUM_ACCESS_DAYS = 31; // grant per payment (slight overlap so no gap between cycles)
const BOOST_VALID_DAYS = [7, 30, 90] as const;
type BoostDays = (typeof BOOST_VALID_DAYS)[number];
const SUBSCRIPTION_PERIOD_SECONDS = 2592000; // 30 days — the only value Telegram allows
// Prepaid bundles grant bonus months on top of what you pay for:
//   6 months paid → 7 months access (+1 free)
//   12 months paid → 15 months access (+3 free)
// (The 2-month signup trial is separate — granted at registration.)
export const SIXMONTH_ACCESS_MONTHS = 7;
export const ANNUAL_ACCESS_MONTHS = 15;

// Monthly ≈ $10 to the buyer. 500 Stars ≈ $9.99 in the iOS Stars bundle.
function monthlyStars(): number {
  const n = Number(process.env.TELEGRAM_STARS_MONTHLY);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 500;
}

function sixMonthStars(): number {
  const n = Number(process.env.TELEGRAM_STARS_SIXMONTH);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : monthlyStars() * 6; // pay 6, get 7
}

function annualStars(): number {
  const n = Number(process.env.TELEGRAM_STARS_ANNUAL);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : monthlyStars() * 12; // pay 12, get 15
}

// AI Concierge Premium — customer-facing. Default 150 Stars/mo (~$3).
function aiPremiumStars(): number {
  const n = Number(process.env.TELEGRAM_STARS_AI);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 150;
}

export function starsPricing() {
  return {
    monthly: monthlyStars(),
    sixMonth: sixMonthStars(),
    annual: annualStars(),
    sixMonthAccessMonths: SIXMONTH_ACCESS_MONTHS,
    annualAccessMonths: ANNUAL_ACCESS_MONTHS,
    aiPremium: aiPremiumStars(),
    aiPremiumDays: AI_PREMIUM_ACCESS_DAYS,
  };
}

function boostStars(days: number): number {
  if (!BOOST_VALID_DAYS.includes(days as BoostDays)) {
    throw new Error(`Invalid boost days: ${days}. Must be one of ${BOOST_VALID_DAYS.join(', ')}.`);
  }
  const envKey = days === 7 ? 'TELEGRAM_STARS_BOOST_7' : days === 30 ? 'TELEGRAM_STARS_BOOST_30' : 'TELEGRAM_STARS_BOOST_90';
  const defaults: Record<number, number> = { 7: 100, 30: 350, 90: 900 };
  const n = Number(process.env[envKey]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : defaults[days];
}

export function boostPricing() {
  return {
    7: boostStars(7),
    30: boostStars(30),
    90: boostStars(90),
  };
}

export class TelegramStarsService {
  private _tg: Telegraf['telegram'] | null = null;

  // Lazy client for outbound API calls (kept separate from the running bot to
  // avoid a circular import; it is never launched).
  private get tg(): Telegraf['telegram'] {
    if (!this._tg) {
      if (!config.telegram.botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN not configured');
      }
      this._tg = new Telegraf(config.telegram.botToken).telegram;
    }
    return this._tg;
  }

  /** Create a Stars subscription invoice link for a specialist (by User.id). */
  async createSubscriptionInvoiceLink(specialistUserId: string): Promise<string> {
    const stars = monthlyStars();
    // createInvoiceLink with XTR + subscription_period. Cast: subscription_period
    // isn't in Telegraf 4.16's typings yet but the Bot API accepts it.
    const link = await this.tg.createInvoiceLink({
      title: 'MiyZapis — Monthly subscription',
      description: 'Unlimited bookings, 0% per-booking fee. Renews monthly, cancel anytime.',
      payload: `${PAYLOAD_MONTHLY}${specialistUserId}`,
      provider_token: '', // empty for Telegram Stars (XTR)
      currency: 'XTR',
      prices: [{ label: 'Monthly subscription', amount: stars }],
      subscription_period: SUBSCRIPTION_PERIOD_SECONDS,
    } as unknown as Parameters<Telegraf['telegram']['createInvoiceLink']>[0]);

    logger.info('Telegram Stars monthly invoice link created', { specialistUserId, stars });
    return link;
  }

  /** Recurring monthly AI Concierge Premium invoice link (by User.id, any user). */
  async createAiPremiumInvoiceLink(userId: string): Promise<string> {
    const stars = aiPremiumStars();
    const link = await this.tg.createInvoiceLink({
      title: 'MiyZapis — AI Concierge Premium',
      description: 'Unlimited AI concierge: find services & products near you, availability, routes, and one-tap booking. Renews monthly, cancel anytime.',
      payload: `${PAYLOAD_AI}${userId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: 'AI Premium (monthly)', amount: stars }],
      subscription_period: SUBSCRIPTION_PERIOD_SECONDS,
    } as unknown as Parameters<Telegraf['telegram']['createInvoiceLink']>[0]);
    logger.info('Telegram Stars AI Premium invoice link created', { userId, stars });
    return link;
  }

  /** One-time 6-month invoice (no auto-renew) → grants 7 months of access. */
  async createSixMonthInvoiceLink(specialistUserId: string): Promise<string> {
    const stars = sixMonthStars();
    const link = await this.tg.createInvoiceLink({
      title: `MiyZapis — 6 months (get ${SIXMONTH_ACCESS_MONTHS})`,
      description: `Pay for 6 months, get ${SIXMONTH_ACCESS_MONTHS} (1 bonus month). One-time, no auto-renew.`,
      payload: `${PAYLOAD_SIXMONTH}${specialistUserId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: `6 months (${SIXMONTH_ACCESS_MONTHS} months access)`, amount: stars }],
    } as unknown as Parameters<Telegraf['telegram']['createInvoiceLink']>[0]);

    logger.info('Telegram Stars 6-month invoice link created', { specialistUserId, stars });
    return link;
  }

  /** One-time annual invoice (no auto-renew) → grants 15 months of access. */
  async createAnnualInvoiceLink(specialistUserId: string): Promise<string> {
    const stars = annualStars();
    const link = await this.tg.createInvoiceLink({
      title: `MiyZapis — 1 year (get ${ANNUAL_ACCESS_MONTHS})`,
      description: `Pay for a year, get ${ANNUAL_ACCESS_MONTHS} months (3 bonus months). One-time, no auto-renew.`,
      payload: `${PAYLOAD_ANNUAL}${specialistUserId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: `1 year (${ANNUAL_ACCESS_MONTHS} months access)`, amount: stars }],
    } as unknown as Parameters<Telegraf['telegram']['createInvoiceLink']>[0]);

    logger.info('Telegram Stars annual invoice link created', { specialistUserId, stars });
    return link;
  }

  /** One-time boost invoice — activates isFeatured + Promotion ACTIVE for `days` days. */
  async createBoostInvoiceLink(specialistUserId: string, days: number): Promise<string> {
    const stars = boostStars(days); // validates days
    const link = await this.tg.createInvoiceLink({
      title: `MiyZapis — Boost ${days} days`,
      description: `Featured placement in search + discovery showcase for ${days} days. One-time, no auto-renew.`,
      payload: `${PAYLOAD_BOOST}${days}:${specialistUserId}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: `Boost ${days} days`, amount: stars }],
      // NO subscription_period — this is a one-time payment
    } as unknown as Parameters<Telegraf['telegram']['createInvoiceLink']>[0]);

    logger.info('Telegram Stars boost invoice link created', { specialistUserId, days, stars });
    return link;
  }

  /** Cancel auto-renewal (stays active until period end). */
  async cancelSubscription(specialistUserId: string): Promise<void> {
    const sub = await prisma.specialistSubscription.findFirst({
      where: { specialistId: specialistUserId },
      select: { id: true, telegramChargeId: true, telegramPayerId: true },
    });
    if (!sub) {
      throw new Error('No active subscription to cancel');
    }
    // A real Telegram Stars recurring subscription → ask Telegram to stop renewing.
    // Legacy / Dodo / default-seeded subscriptions have no Telegram charge — there's
    // no external recurring billing to cancel, so we just turn off local auto-renew.
    if (sub.telegramChargeId && sub.telegramPayerId) {
      // editUserStarSubscription is newer than Telegraf 4.16 typings → raw callApi.
      await (this.tg as unknown as {
        callApi: (m: string, p: Record<string, unknown>) => Promise<unknown>;
      }).callApi('editUserStarSubscription', {
        user_id: Number(sub.telegramPayerId),
        telegram_payment_charge_id: sub.telegramChargeId,
        is_canceled: true,
      });
    }
    // Clearing nextBillingDate stops auto-renew and lets the lifecycle worker
    // downgrade the plan once the current period ends.
    await prisma.specialistSubscription.update({
      where: { id: sub.id },
      data: { nextBillingDate: null },
    });
    logger.info('Subscription auto-renew cancelled', { specialistUserId, telegram: !!sub.telegramChargeId });
  }

  /**
   * Register the payment update handlers on the running bot. Called once from
   * the bot's initializeBot().
   */
  registerHandlers(bot: Telegraf<any>): void {
    // 1) pre_checkout_query — must be answered within 10s, else payment fails.
    const parsePayload = (
      payload: string,
    ): { kind: 'monthly' | 'sixmonth' | 'annual' | 'ai'; userId: string } | { kind: 'boost'; days: number; userId: string } | null => {
      if (payload.startsWith(PAYLOAD_AI)) return { kind: 'ai', userId: payload.slice(PAYLOAD_AI.length) };
      // Check the longer 6-month prefix before the monthly prefix (both start with "sub").
      if (payload.startsWith(PAYLOAD_SIXMONTH)) return { kind: 'sixmonth', userId: payload.slice(PAYLOAD_SIXMONTH.length) };
      if (payload.startsWith(PAYLOAD_ANNUAL)) return { kind: 'annual', userId: payload.slice(PAYLOAD_ANNUAL.length) };
      if (payload.startsWith(PAYLOAD_MONTHLY)) return { kind: 'monthly', userId: payload.slice(PAYLOAD_MONTHLY.length) };
      if (payload.startsWith(PAYLOAD_BOOST)) {
        // format: boost:<days>:<userId>
        const rest = payload.slice(PAYLOAD_BOOST.length);
        const colonIdx = rest.indexOf(':');
        if (colonIdx < 1) return null;
        const days = Number(rest.slice(0, colonIdx));
        const userId = rest.slice(colonIdx + 1);
        if (!BOOST_VALID_DAYS.includes(days as BoostDays) || !userId) return null;
        return { kind: 'boost', days, userId };
      }
      return null;
    };

    bot.on('pre_checkout_query', async (ctx) => {
      try {
        const parsed = parsePayload(ctx.preCheckoutQuery?.invoice_payload || '');
        if (!parsed) {
          await ctx.answerPreCheckoutQuery(false, 'Invalid payment.');
          return;
        }
        // AI Premium is for any user; other kinds require a specialist account.
        if (parsed.kind === 'ai') {
          const user = await prisma.user.findUnique({ where: { id: parsed.userId }, select: { id: true } });
          if (!user) {
            await ctx.answerPreCheckoutQuery(false, 'Account not found.');
            return;
          }
        } else {
          const specialist = await prisma.specialist.findUnique({ where: { userId: parsed.userId }, select: { id: true } });
          if (!specialist) {
            await ctx.answerPreCheckoutQuery(false, 'Subscription account not found.');
            return;
          }
        }
        await ctx.answerPreCheckoutQuery(true);
      } catch (err) {
        logger.error('pre_checkout_query handling failed', err);
        try { await ctx.answerPreCheckoutQuery(false, 'Temporary error, please retry.'); } catch { /* noop */ }
      }
    });

    // 2) successful_payment — activate / renew the subscription.
    bot.on(message('successful_payment'), async (ctx) => {
      try {
        const sp = ctx.message.successful_payment as {
          invoice_payload: string;
          total_amount: number;
          telegram_payment_charge_id: string;
          subscription_expiration_date?: number;
          is_recurring?: boolean;
        };
        const parsed = parsePayload(sp.invoice_payload || '');
        if (!parsed) return; // not ours
        const { kind, userId: specialistUserId } = parsed;
        const payerId = ctx.from?.id ? String(ctx.from.id) : undefined;

        // Idempotency: Telegram can redeliver the same successful_payment. Dedup by
        // charge id so a boost isn't double-extended / a sub double-activated.
        const chargeId = sp.telegram_payment_charge_id;
        if (chargeId && redis) {
          try {
            const fresh = await redis.set(`tg-charge:${chargeId}`, '1', 'EX', 7 * 24 * 3600, 'NX');
            if (fresh !== 'OK') {
              logger.info('Duplicate Telegram successful_payment ignored', { chargeId });
              return;
            }
          } catch {
            // Redis unavailable — fall through and process (better than dropping a real payment).
          }
        }

        if (kind === 'ai') {
          // Extend AI Premium: from the later of now / current access + one cycle.
          try {
            const u = await prisma.user.findUnique({ where: { id: specialistUserId }, select: { aiAccessUntil: true } });
            const base = u?.aiAccessUntil && u.aiAccessUntil > new Date() ? u.aiAccessUntil : new Date();
            const next = new Date(base.getTime() + AI_PREMIUM_ACCESS_DAYS * 24 * 3600 * 1000);
            await prisma.user.update({ where: { id: specialistUserId }, data: { aiAccessUntil: next } });
            await ctx.reply('✨ AI Concierge Premium is active! Ask me to find services & products near you, check availability, and book — right from chat.');
          } catch (aiErr) {
            logger.error('AI Premium activation failed after successful_payment', { userId: specialistUserId, aiErr });
            await ctx.reply('✨ Payment received. Your AI Premium will be activated shortly.');
          }
        } else if (kind === 'boost') {
          const days = (parsed as { kind: 'boost'; days: number; userId: string }).days;
          try {
            await PromoteService.activatePaidBoost(specialistUserId, days);
            await ctx.reply(
              `⭐ Boost active for ${days} days! Your listing is now Featured in search and shown in the discovery showcase.`,
            );
          } catch (boostErr) {
            logger.error('activatePaidBoost failed after successful_payment', { specialistUserId, days, boostErr });
            // Payment already charged — don't rethrow; best-effort notification.
            await ctx.reply('⭐ Payment received. Your boost will be activated shortly.');
          }
        } else if (kind === 'annual' || kind === 'sixmonth') {
          const months = kind === 'annual' ? ANNUAL_ACCESS_MONTHS : SIXMONTH_ACCESS_MONTHS;
          await specialistSubscriptionService.activateFixedTermFromTelegram(specialistUserId, {
            months,
            telegramChargeId: sp.telegram_payment_charge_id,
            telegramPayerId: payerId,
            amountStars: sp.total_amount,
          });
          await ctx.reply(
            `✅ Plan active — ${months} months of unlimited bookings with 0% per-booking fee. ` +
              'No auto-renew; we will remind you before it ends.',
          );
        } else {
          const periodEnd = sp.subscription_expiration_date
            ? new Date(sp.subscription_expiration_date * 1000)
            : undefined;
          await specialistSubscriptionService.activateMonthlyFromTelegram(specialistUserId, {
            telegramChargeId: sp.telegram_payment_charge_id,
            telegramPayerId: payerId,
            periodEnd,
            amountStars: sp.total_amount,
          });
          await ctx.reply(
            '✅ Subscription active. Unlimited bookings with 0% per-booking fee. ' +
              'It renews automatically each month — manage or cancel anytime in your dashboard.',
          );
        }
        logger.info('Telegram Stars payment processed', {
          specialistUserId,
          kind,
          recurring: !!sp.is_recurring,
          chargeId: sp.telegram_payment_charge_id,
        });
      } catch (err) {
        logger.error('successful_payment handling failed', err);
      }
    });
  }
}

export const telegramStarsService = new TelegramStarsService();
