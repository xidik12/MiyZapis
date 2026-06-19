// Money helpers — ALWAYS use these to read/sum monetary values.
//
// WHY: Prisma `Decimal` columns (amount, total, totalAmount, salePrice,
// walletBalance, netPay, …) deserialize as objects whose `valueOf()` returns a
// STRING. So `a + row.amount` does STRING CONCATENATION, not addition
// ("666" + "21000" → "66621000"). Subtraction/multiplication silently coerce,
// which is why only `+` sums break. `num()` / `sumBy()` coerce every value to a
// real number so this whole class of bug can't happen.

/** Coerce any numeric-ish value (number, numeric string, or Prisma Decimal) to
 *  a real JS number. Returns 0 for null/undefined/NaN. */
export const num = (v: unknown): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : Number(v as never);
  return Number.isFinite(n) ? n : 0;
};

/** Sum a list of money values safely (always coerces — never concatenates). */
export function sumBy<T>(items: readonly T[], pick: (item: T) => unknown): number {
  return items.reduce<number>((acc, it) => acc + num(pick(it)), 0);
}

/** Add money values safely. */
export const addMoney = (...vals: unknown[]): number => vals.reduce<number>((a, v) => a + num(v), 0);
