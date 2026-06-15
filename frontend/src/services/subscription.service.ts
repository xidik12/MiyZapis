import { apiClient } from './api';

// ---------------------------------------------------------------------------
// Specialist subscription billing via Telegram Stars.
// Backend routes mounted at /crypto-payments.
// ---------------------------------------------------------------------------

export interface StarsPricing {
  monthly: number; // Stars / month (recurring)
  annual: number; // Stars one-time → annualAccessMonths of access
  annualAccessMonths: number; // 18
}

export interface SubscriptionStatus {
  planType: 'PAY_PER_USE' | 'MONTHLY_SUBSCRIPTION';
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'PENDING';
  provider?: string | null;
  currentPeriodEnd?: string | null;
  nextBillingDate?: string | null;
}

class SubscriptionService {
  async getPricing(): Promise<StarsPricing> {
    const res = await apiClient.get<StarsPricing>('/crypto-payments/telegram-stars/pricing');
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load pricing');
    return res.data;
  }

  /** Returns a Telegram invoice link the specialist opens to pay with Stars. */
  async createInvoice(plan: 'monthly' | 'annual'): Promise<string> {
    const res = await apiClient.post<{ invoiceLink: string }>(
      '/crypto-payments/telegram-stars/invoice',
      { plan },
    );
    if (!res.success || !res.data?.invoiceLink) {
      throw new Error(res.error?.message || 'Failed to create invoice');
    }
    return res.data.invoiceLink;
  }

  async cancel(): Promise<void> {
    const res = await apiClient.post('/crypto-payments/telegram-stars/cancel', {});
    if (!res.success) throw new Error(res.error?.message || 'Failed to cancel');
  }

  async getStatus(specialistUserId: string): Promise<SubscriptionStatus | null> {
    try {
      const res = await apiClient.get<SubscriptionStatus>(
        `/crypto-payments/specialists/${specialistUserId}/plan`,
      );
      return res.success && res.data ? res.data : null;
    } catch {
      return null;
    }
  }
}

export const subscriptionService = new SubscriptionService();
