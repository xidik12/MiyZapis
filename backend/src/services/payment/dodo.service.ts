import DodoPayments from 'dodopayments';
import { config } from '@/config';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { specialistSubscriptionService } from './subscription.service';

// ---------------------------------------------------------------------------
// Dodo Payments — card subscription with a free trial that auto-converts.
//
// Flow (the "2 months free → auto-charge unless cancelled" model):
//   1. Specialist clicks "Start free trial (card)" → createTrialCheckout()
//      makes a Dodo checkout session with subscription_data.trial_period_days
//      = 60. Returns checkout_url; we redirect them there.
//   2. They enter a card on Dodo's hosted checkout. Card is stored, trial
//      starts, NO charge for 60 days.
//   3. Webhook subscription.active → we mark them active (provider=DODO).
//   4. After 60 days Dodo auto-charges the card → payment.succeeded /
//      subscription.renewed → we extend the period.
//   5. Cancel → subscriptions.update(cancel_at_next_billing_date:true): stays
//      active until period end, then subscription.cancelled → downgrade.
//
// Dodo is a Merchant of Record: it handles global cards, tax/VAT, and payouts
// (incl. to Ukraine, where Stripe can't). Config-gated: if keys/product are
// absent the feature is simply unavailable (isConfigured() === false).
// ---------------------------------------------------------------------------

const TRIAL_DAYS = (() => {
  const n = Number(process.env.DODO_TRIAL_DAYS);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 60; // 2 months
})();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://miyzapis.com';

export class DodoService {
  private _client: DodoPayments | null = null;

  isConfigured(): boolean {
    return Boolean(config.dodo.enabled && config.dodo.apiKey && config.dodo.productMonthly);
  }

  private get client(): DodoPayments {
    if (!this._client) {
      if (!config.dodo.apiKey) throw new Error('Dodo Payments not configured (DODO_PAYMENTS_API_KEY)');
      this._client = new DodoPayments({
        bearerToken: config.dodo.apiKey,
        environment: (config.dodo.environment as 'test_mode' | 'live_mode') || 'test_mode',
        webhookKey: config.dodo.webhookKey,
      });
    }
    return this._client;
  }

  trialDays(): number {
    return TRIAL_DAYS;
  }

  /** Create a hosted-checkout session for the 2-month-free card subscription. */
  async createTrialCheckout(specialist: { id: string; email: string; name: string }): Promise<string> {
    if (!config.dodo.productMonthly) throw new Error('Dodo product not configured (DODO_PRODUCT_MONTHLY)');

    const session = await this.client.checkoutSessions.create({
      product_cart: [{ product_id: config.dodo.productMonthly, quantity: 1 }],
      subscription_data: { trial_period_days: TRIAL_DAYS },
      customer: { email: specialist.email, name: specialist.name || specialist.email },
      // Carried through to the subscription + every webhook so we can map back.
      metadata: { specialistId: specialist.id },
      return_url: `${FRONTEND_URL}/specialist/billing?dodo=return`,
    } as Parameters<DodoPayments['checkoutSessions']['create']>[0]);

    const url = (session as { checkout_url?: string }).checkout_url;
    if (!url) throw new Error('Dodo did not return a checkout_url');
    logger.info('Dodo trial checkout created', { specialistId: specialist.id });
    return url;
  }

  /** Cancel at period end (card model: stays active until the paid period ends). */
  async cancelSubscription(specialistUserId: string): Promise<void> {
    const sub = await prisma.specialistSubscription.findFirst({
      where: { specialistId: specialistUserId },
      select: { dodoSubscriptionId: true },
    });
    if (!sub?.dodoSubscriptionId) throw new Error('No active Dodo subscription to cancel');
    await this.client.subscriptions.update(sub.dodoSubscriptionId, {
      cancel_at_next_billing_date: true,
    } as Parameters<DodoPayments['subscriptions']['update']>[1]);
    logger.info('Dodo subscription set to cancel at period end', { specialistUserId });
  }

  /** Verify + parse an incoming webhook (Standard Webhooks). Throws on bad sig. */
  verifyAndParse(rawBody: string, headers: Record<string, string | undefined>): { type: string; data: Record<string, unknown> } {
    const evt = (this.client.webhooks as unknown as {
      unwrap: (body: string, opts: { headers: Record<string, string | undefined> }) => unknown;
    }).unwrap(rawBody, { headers });
    return evt as { type: string; data: Record<string, unknown> };
  }

  /** Apply a verified webhook event to our subscription state. */
  async handleEvent(event: { type: string; data: Record<string, unknown> }): Promise<void> {
    const type = event.type || '';
    const data = (event.data || {}) as Record<string, unknown>;
    const meta = (data.metadata || {}) as Record<string, string>;
    const specialistId = meta.specialistId;
    if (!specialistId) {
      logger.warn('Dodo webhook without specialistId metadata', { type });
      return;
    }

    const dodoSubscriptionId = (data.subscription_id as string) || undefined;
    const dodoCustomerId =
      ((data.customer as { customer_id?: string })?.customer_id as string) ||
      (data.customer_id as string) ||
      undefined;
    const nextBilling = (data.next_billing_date as string) || (data.previous_billing_date as string) || undefined;
    const periodEnd = nextBilling ? new Date(nextBilling) : undefined;

    if (['subscription.active', 'subscription.renewed', 'payment.succeeded'].includes(type)) {
      await specialistSubscriptionService.activateFromDodo(specialistId, {
        dodoSubscriptionId,
        dodoCustomerId,
        periodEnd,
      });
      logger.info('Dodo subscription activated/renewed', { specialistId, type });
    } else if (['subscription.cancelled', 'subscription.expired', 'subscription.failed'].includes(type)) {
      await specialistSubscriptionService.deactivateProviderSubscription(specialistId, 'DODO');
      logger.info('Dodo subscription ended → downgraded', { specialistId, type });
    } else {
      logger.info('Dodo webhook ignored', { type, specialistId });
    }
  }
}

export const dodoService = new DodoService();
