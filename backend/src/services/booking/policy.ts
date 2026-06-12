// No-show protection — deposit & cancellation policy helpers.
//
// IMPORTANT: MiyZapis has NO live payment processing yet (the platform is
// currently free). Everything here is the POLICY + TRACKING layer: we COMPUTE
// and RECORD deposit / no-show-fee amounts and their statuses on the booking,
// but we NEVER actually charge a card or move money. A later payments module
// will read these recorded amounts/statuses and collect them.

import { Service } from '@prisma/client';

/** Coerce Prisma Decimal | number | string | null/undefined to a JS number. */
function num(v: unknown): number {
  if (v === null || v === undefined) return 0;
  // Prisma.Decimal has a toNumber(); fall back to Number() for plain values.
  const anyV = v as { toNumber?: () => number };
  if (typeof anyV.toNumber === 'function') return anyV.toNumber();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Compute the deposit amount required for a booking of `totalAmount` under the
 * given service's policy.
 *
 * - requireDeposit === false → 0
 * - depositType === 'PERCENT' → totalAmount * depositValue / 100
 * - depositType === 'FIXED'   → depositValue (capped at totalAmount)
 *
 * The result is clamped to [0, totalAmount]. No money is moved — the caller
 * records this as `depositAmount` with `depositStatus = 'REQUIRED'`.
 */
export function computeDeposit(
  service: Pick<Service, 'requireDeposit' | 'depositType' | 'depositValue'>,
  totalAmount: number,
): number {
  if (!service.requireDeposit) return 0;
  const total = Math.max(0, num(totalAmount));
  const value = num(service.depositValue);
  let amount = 0;
  if (service.depositType === 'PERCENT') {
    amount = (total * value) / 100;
  } else if (service.depositType === 'FIXED') {
    amount = value;
  }
  // Clamp: never exceed the booking total, never negative.
  amount = Math.min(Math.max(0, amount), total);
  // Round to 2 dp to avoid float noise in recorded amounts.
  return Math.round(amount * 100) / 100;
}

/**
 * Compute the no-show fee for a booking of `totalAmount` under the service's
 * no-show policy.
 *
 * - noShowFeeType === 'PERCENT' → totalAmount * noShowFeeValue / 100
 * - noShowFeeType === 'FIXED'   → noShowFeeValue (capped at totalAmount)
 * - no type set                 → 0
 *
 * Clamped to [0, totalAmount]. No money is moved — the caller records this as
 * `noShowFeeAmount` with `noShowFeeStatus = 'CHARGED'`.
 */
export function computeNoShowFee(
  service: Pick<Service, 'noShowFeeType' | 'noShowFeeValue'>,
  totalAmount: number,
): number {
  const total = Math.max(0, num(totalAmount));
  const value = num(service.noShowFeeValue);
  let amount = 0;
  if (service.noShowFeeType === 'PERCENT') {
    amount = (total * value) / 100;
  } else if (service.noShowFeeType === 'FIXED') {
    amount = value;
  }
  amount = Math.min(Math.max(0, amount), total);
  return Math.round(amount * 100) / 100;
}
