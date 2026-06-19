// Money helpers — ALWAYS use these to read/sum monetary values from the API.
//
// WHY: money fields (amount, total, totalAmount, salePrice, balance, …) come
// from Prisma `Decimal` columns and serialize to JSON as STRINGS — even when
// the TS type says `number` (the type lies). So `sum + tx.amount` does STRING
// CONCATENATION, not addition ("666" + "21000" → "66621000"). `num()` /
// `sumBy()` coerce every value to a real number, killing this class of bug.

/** Coerce any numeric-ish value (number or numeric string) to a real number.
 *  Returns 0 for null/undefined/NaN. */
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
