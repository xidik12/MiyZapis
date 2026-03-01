import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

/**
 * Server-side sanitization utilities to prevent XSS and injection attacks
 * All user input should be sanitized before storage or processing
 */

// Configuration for HTML sanitization - allows basic formatting
const htmlSanitizerConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span',
    'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'span': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    'a': ['http', 'https', 'mailto']
  },
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
};

// Strict configuration - plain text only
const strictConfig: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

/**
 * Sanitize HTML content - allows basic formatting tags
 * Use for: reviews, descriptions, bio
 */
export const sanitizeHTML = (dirty: string | undefined | null): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, htmlSanitizerConfig);
};

/**
 * Sanitize to plain text only - strips all HTML
 * Use for: names, titles, search queries
 */
export const sanitizeText = (dirty: string | undefined | null): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  return sanitizeHtml(dirty, strictConfig).trim();
};

/**
 * Sanitize and validate email
 * Use for: email inputs
 */
export const sanitizeEmail = (email: string | undefined | null): string => {
  if (!email || typeof email !== 'string') return '';

  const cleaned = email.toLowerCase().trim();

  // Validate email format
  if (!validator.isEmail(cleaned)) {
    return '';
  }

  // Normalize email
  return validator.normalizeEmail(cleaned) || cleaned;
};

/**
 * Sanitize and validate URL
 * Use for: user profile links, social media URLs
 */
export const sanitizeURL = (url: string | undefined | null): string => {
  if (!url || typeof url !== 'string') return '';

  const cleaned = url.trim();

  // Validate URL
  if (!validator.isURL(cleaned, {
    protocols: ['http', 'https'],
    require_protocol: false,
    require_valid_protocol: true,
  })) {
    return '';
  }

  // Add https if no protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    return `https://${cleaned}`;
  }

  return validator.escape(cleaned);
};

/**
 * Sanitize phone number
 * Use for: phone number inputs
 */
export const sanitizePhone = (phone: string | undefined | null): string => {
  if (!phone || typeof phone !== 'string') return '';

  // Remove all non-numeric characters except + at the start
  let cleaned = phone.trim().replace(/[^\d+]/g, '');

  // Ensure + only at the start
  if (cleaned.includes('+')) {
    cleaned = '+' + cleaned.replace(/\+/g, '');
  }

  return cleaned;
};

/**
 * Sanitize filename - removes path traversal and dangerous characters
 * Use for: file uploads
 */
export const sanitizeFilename = (filename: string | undefined | null): string => {
  if (!filename || typeof filename !== 'string') return '';

  return filename
    .replace(/[^\w\s.-]/g, '') // Remove special chars except dots, dashes, underscores
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Sanitize search query
 * Use for: search inputs
 */
export const sanitizeSearchQuery = (query: string | undefined | null): string => {
  if (!query || typeof query !== 'string') return '';

  return sanitizeText(query)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 200); // Limit length
};

/**
 * Sanitize and validate number
 * Use for: price, duration, quantities
 */
export const sanitizeNumber = (
  value: unknown,
  options: { min?: number; max?: number; default?: number } = {}
): number => {
  const num = Number(value);
  const defaultValue = options.default ?? 0;

  if (!isFinite(num)) return defaultValue;

  let sanitized = num;

  if (options.min !== undefined && sanitized < options.min) {
    sanitized = options.min;
  }

  if (options.max !== undefined && sanitized > options.max) {
    sanitized = options.max;
  }

  return sanitized;
};

/**
 * Sanitize boolean value
 */
export const sanitizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
};

/**
 * Sanitize JSON string
 */
export const sanitizeJSON = <T = unknown>(json: string | undefined | null, defaultValue: T): T => {
  if (!json || typeof json !== 'string') return defaultValue;

  try {
    const parsed = JSON.parse(json);
    return sanitizeObjectStrings(parsed);
  } catch {
    return defaultValue;
  }
};

/**
 * Recursively sanitize all string values in an object
 */
export const sanitizeObjectStrings = (obj: unknown): unknown => {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectStrings);
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Sanitize key as well
        const cleanKey = sanitizeText(key);
        sanitized[cleanKey] = sanitizeObjectStrings((obj as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Sanitize array
 */
export const sanitizeArray = (
  arr: unknown[] | undefined | null,
  maxLength: number = 100,
  itemSanitizer: (item: unknown) => unknown = sanitizeText as (item: unknown) => unknown
): unknown[] => {
  if (!Array.isArray(arr)) return [];

  return arr
    .slice(0, maxLength)
    .map(itemSanitizer)
    .filter(item => item !== null && item !== undefined && item !== '');
};

/**
 * Check if content contains dangerous patterns
 */
export const containsDangerousContent = (text: string | undefined | null): boolean => {
  if (!text || typeof text !== 'string') return false;

  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /vbscript:/i,
    /eval\(/i,
    /expression\(/i,
    /import\s+/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(text));
};

/**
 * Sanitize database input to prevent SQL injection
 * Note: This is a backup - Prisma already handles this
 */
export const sanitizeDatabaseInput = (input: string | undefined | null): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, ''); // Remove multi-line comment end
};

/**
 * Validate and sanitize UUID
 */
export const sanitizeUUID = (uuid: string | undefined | null): string | null => {
  if (!uuid || typeof uuid !== 'string') return null;

  if (!validator.isUUID(uuid)) {
    return null;
  }

  return uuid.toLowerCase().trim();
};

/**
 * Validate and sanitize date string
 */
export const sanitizeDate = (date: string | undefined | null): Date | null => {
  if (!date || typeof date !== 'string') return null;

  if (!validator.isISO8601(date)) {
    return null;
  }

  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Sanitize object by applying appropriate sanitizers to each field
 */
export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T,
  schema: Record<keyof T, (value: unknown) => unknown>
): Partial<T> => {
  const sanitized: Partial<T> = {};

  for (const key in schema) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = schema[key](obj[key]);
    }
  }

  return sanitized;
};

/**
 * Create a sanitization schema for common user input
 */
export const commonSanitizers = {
  text: sanitizeText,
  html: sanitizeHTML,
  email: sanitizeEmail,
  url: sanitizeURL,
  phone: sanitizePhone,
  number: sanitizeNumber,
  boolean: sanitizeBoolean,
  filename: sanitizeFilename,
  searchQuery: sanitizeSearchQuery,
  uuid: sanitizeUUID,
  date: sanitizeDate,
};
