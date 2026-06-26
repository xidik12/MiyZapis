// Booking policy helpers.
//
// Deposit and no-show fee logic has been removed — the platform does not require
// deposits or charge no-show fees. These functions are kept as stubs so callers
// compile without changes; they always return 0.

import { Service } from '@prisma/client';

/**
 * Deposit computation — always returns 0.
 * Deposit requirement has been removed from the platform.
 */
export function computeDeposit(
  _service: Pick<Service, 'requireDeposit' | 'depositType' | 'depositValue'>,
  _totalAmount: number,
): number {
  return 0;
}

/**
 * No-show fee computation — always returns 0.
 * No-show fee charging has been removed from the platform.
 */
export function computeNoShowFee(
  _service: Pick<Service, 'noShowFeeType' | 'noShowFeeValue'>,
  _totalAmount: number,
): number {
  return 0;
}
