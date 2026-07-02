import { Request, Response, NextFunction } from 'express';

/**
 * Payment-provider kill switch. The card/PayPal/crypto rails are not live
 * (VITE_PAYMENTS_ENABLED=false on the client), but their mutation + webhook
 * routes are mounted unconditionally — and several had weak/forgeable
 * verification. Until real verification is in place and payments are turned on,
 * block those routes at the edge. Telegram Stars (subscriptions) is a separate,
 * live rail and is NOT gated by this.
 *
 * Enable with PAYMENTS_ENABLED=true once the provider integrations are hardened.
 */
export const paymentsEnabled = (): boolean => process.env.PAYMENTS_ENABLED === 'true';

export function requirePaymentsEnabled(_req: Request, res: Response, next: NextFunction): void {
  if (!paymentsEnabled()) {
    res.status(503).json({ success: false, code: 'PAYMENTS_DISABLED', error: 'Payments are not currently enabled.' });
    return;
  }
  next();
}
