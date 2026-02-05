/**
 * Enhanced serialization utilities for admin analytics
 * Handles BigInt, Date objects, and PostgreSQL numeric types
 */

/**
 * Serialize data for JSON response, handling:
 * - BigInt values (convert to number)
 * - Date objects (convert to ISO string)
 * - PostgreSQL numeric types (convert to proper numbers)
 * - Nested objects and arrays
 */
export function serializeData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeData(item));
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle BigInt
  if (typeof obj === 'bigint') {
    return Number(obj);
  }

  // Handle PostgreSQL numeric types (they come as objects with 's', 'e', 'd' properties)
  if (obj && typeof obj === 'object' && 's' in obj && 'e' in obj && 'd' in obj) {
    // This is a PostgreSQL numeric type
    const { s, e, d } = obj;
    if (Array.isArray(d) && d.length > 0) {
      // Convert to number: sign * digit * 10^exponent
      const sign = s === 1 ? 1 : -1;
      const mantissa = d[0];
      const exponent = e || 0;
      return sign * mantissa * Math.pow(10, exponent);
    }
    return 0;
  }

  // Handle plain objects
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeData(obj[key]);
      }
    }
    return serialized;
  }

  // Return primitive values as-is
  return obj;
}

/**
 * Legacy function - redirects to serializeData
 * @deprecated Use serializeData instead
 */
export function serializeBigInt(obj: any): any {
  return serializeData(obj);
}

/**
 * Serialize query results specifically for analytics endpoints
 * Handles common PostgreSQL patterns used in raw queries
 */
export function serializeQueryResult(result: any[]): any[] {
  return result.map(row => {
    const serialized: any = {};

    for (const [key, value] of Object.entries(row)) {
      // Handle date fields
      if (key === 'date' || key.endsWith('_date') || key.endsWith('_at')) {
        serialized[key] = value instanceof Date
          ? value.toISOString()
          : value;
      }
      // Handle numeric fields from EXTRACT, COUNT, SUM, AVG
      else if (
        key === 'count' ||
        key === 'hour' ||
        key === 'total' ||
        key.includes('_count') ||
        key.includes('_amount') ||
        key.includes('_total') ||
        key.includes('_avg')
      ) {
        serialized[key] = serializeNumericValue(value);
      }
      // Handle all other fields
      else {
        serialized[key] = serializeData(value);
      }
    }

    return serialized;
  });
}

/**
 * Serialize PostgreSQL numeric values to JavaScript numbers
 */
function serializeNumericValue(value: any): number {
  // Already a number
  if (typeof value === 'number') {
    return value;
  }

  // BigInt
  if (typeof value === 'bigint') {
    return Number(value);
  }

  // PostgreSQL numeric object { s, e, d }
  if (value && typeof value === 'object' && 's' in value && 'e' in value && 'd' in value) {
    const { s, e, d } = value;
    if (Array.isArray(d) && d.length > 0) {
      const sign = s === 1 ? 1 : -1;
      const mantissa = d[0];
      const exponent = e || 0;
      return sign * mantissa * Math.pow(10, exponent);
    }
    return 0;
  }

  // String that can be parsed as number
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Default to 0 for invalid values
  return 0;
}

/**
 * Sanitize HTML/XSS from user input
 * Used for names, descriptions, etc.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return input;

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  return sanitized.trim();
}

/**
 * Validate and sanitize user names
 * Allows letters (including Cyrillic), spaces, hyphens, apostrophes
 */
export function sanitizeName(name: string): string {
  if (!name) return name;

  // Remove HTML tags first
  let sanitized = sanitizeHtml(name);

  // Remove any remaining special characters except allowed ones
  // Allow: letters (Latin, Cyrillic), spaces, hyphens, apostrophes
  sanitized = sanitized.replace(/[^a-zA-Z\u0400-\u04FF\u0100-\u017F\s\-']/g, '');

  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim
  return sanitized.trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Check if a string contains potential XSS
 */
export function containsXSS(input: string): boolean {
  if (!input) return false;

  // Check for common XSS patterns
  const xssPatterns = [
    /<script/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload, etc.
    /<img[^>]+src\s*=\s*['"]*x/i, // <img src=x
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}
