import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { config } from '@/config';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { specialistSubscriptionService } from './subscription.service';

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

export function starsPricing() {
  return {
    monthly: monthlyStars(),
    sixMonth: sixMonthStars(),
    annual: annualStars(),
    sixMonthAccessMonths: SIXMONTH_ACCESS_MONTHS,
    annualAccessMonths: ANNUAL_ACCESS_MONTHS,
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

  /** Cancel auto-renewal (stays active until period end). */
  async cancelSubscription(specialistUserId: string): Promise<void> {
    const sub = await prisma.specialistSubscription.findFirst({
      where: { specialistId: specialistUserId },
      select: { telegramChargeId: true, telegramPayerId: true },
    });
    if (!sub?.telegramChargeId || !sub.telegramPayerId) {
      throw new Error('No active Telegram Stars subscription to cancel');
    }
    // editUserStarSubscription is newer than Telegraf 4.16 typings → raw callApi.
    await (this.tg as unknown as {
      callApi: (m: string, p: Record<string, unknown>) => Promise<unknown>;
    }).callApi('editUserStarSubscription', {
      user_id: Number(sub.telegramPayerId),
      telegram_payment_charge_id: sub.telegramChargeId,
      is_canceled: true,
    });
    logger.info('Telegram Stars subscription auto-renew cancelled', { specialistUserId });
  }

  /**
   * Register the payment update handlers on the running bot. Called once from
   * the bot's initializeBot().
   */
  registerHandlers(bot: Telegraf<any>): void {
    // 1) pre_checkout_query — must be answered within 10s, else payment fails.
    const parsePayload = (payload: string): { kind: 'monthly' | 'sixmonth' | 'annual'; userId: string } | null => {
      // Check the longer 6-month prefix before the monthly prefix (both start with "sub").
      if (payload.startsWith(PAYLOAD_SIXMONTH)) return { kind: 'sixmonth', userId: payload.slice(PAYLOAD_SIXMONTH.length) };
      if (payload.startsWith(PAYLOAD_ANNUAL)) return { kind: 'annual', userId: payload.slice(PAYLOAD_ANNUAL.length) };
      if (payload.startsWith(PAYLOAD_MONTHLY)) return { kind: 'monthly', userId: payload.slice(PAYLOAD_MONTHLY.length) };
      return null;
    };

    bot.on('pre_checkout_query', async (ctx) => {
      try {
        const parsed = parsePayload(ctx.preCheckoutQuery?.invoice_payload || '');
        const specialist = parsed?.userId
          ? await prisma.specialist.findUnique({ where: { userId: parsed.userId }, select: { id: true } })
          : null;
        if (!specialist) {
          await ctx.answerPreCheckoutQuery(false, 'Subscription account not found.');
          return;
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

        if (kind === 'annual' || kind === 'sixmonth') {
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
