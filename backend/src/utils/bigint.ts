/**
 * Recursively converts BigInt values to Numbers for JSON serialization.
 * PostgreSQL aggregate functions (COUNT, SUM, AVG) return BigInt in Node.js,
 * which cannot be serialized by JSON.stringify() by default.
 *
 * @param obj - Any value that might contain BigInt values
 * @returns Value with all BigInts converted to Numbers
 *
 * @example
 * const data = { count: 5n, total: 100n };
 * serializeBigInt(data); // { count: 5, total: 100 }
 */
export function serializeBigInt(obj: unknown): unknown {
  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Convert BigInt to Number
  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  // Recursively handle arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  // Recursively handle objects
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeBigInt((obj as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  // Return primitive values as-is
  return obj;
}
