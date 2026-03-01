import DOMPurify from 'dompurify';

/**
 * Sanitization utilities to prevent XSS attacks
 * All user-generated content should be sanitized before rendering
 */

// Configure DOMPurify for strict sanitization
const sanitizerConfig: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u', 'p', 'br', 'span',
    'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
};

// Strict config for plain text only (no HTML tags)
const strictConfig: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
};

/**
 * Sanitize HTML content - allows basic formatting tags
 * Use for: reviews, descriptions, bio
 */
export const sanitizeHTML = (dirty: string | undefined | null): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, sanitizerConfig);
};

/**
 * Sanitize to plain text only - strips all HTML
 * Use for: names, titles, search queries
 */
export const sanitizeText = (dirty: string | undefined | null): string => {
  if (!dirty || typeof dirty !== 'string') return '';
  return DOMPurify.sanitize(dirty, strictConfig);
};

/**
 * Sanitize URL - ensures it's safe and valid
 * Use for: user profile links, social media URLs
 */
export const sanitizeURL = (url: string | undefined | null): string => {
  if (!url || typeof url !== 'string') return '';

  // Remove potentially dangerous protocols
  const cleaned = url.trim();

  // Allow only http, https, and mailto protocols
  const allowedProtocols = /^(https?:\/\/|mailto:)/i;

  if (!allowedProtocols.test(cleaned)) {
    // If no protocol, assume https
    if (!cleaned.includes('://') && !cleaned.startsWith('mailto:')) {
      return `https://${cleaned}`;
    }
    return ''; // Invalid protocol
  }

  return DOMPurify.sanitize(cleaned, { ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):)/ });
};

/**
 * Sanitize filename - removes path traversal attempts and dangerous characters
 * Use for: file uploads
 */
export const sanitizeFilename = (filename: string | undefined | null): string => {
  if (!filename || typeof filename !== 'string') return '';

  return filename
    .replace(/[^\w\s.-]/g, '') // Remove special chars except dots, dashes, underscores
    .replace(/\.\./g, '') // Remove path traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .trim()
    .substring(0, 255); // Limit length
};

/**
 * Sanitize email - basic validation and sanitization
 * Use for: email inputs
 */
export const sanitizeEmail = (email: string | undefined | null): string => {
  if (!email || typeof email !== 'string') return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, ''); // Keep only valid email characters
};

/**
 * Sanitize phone number - removes non-numeric characters except + and -
 * Use for: phone number inputs
 */
export const sanitizePhone = (phone: string | undefined | null): string => {
  if (!phone || typeof phone !== 'string') return '';

  return phone
    .trim()
    .replace(/[^\d+\-\s()]/g, ''); // Keep only digits, +, -, spaces, and parentheses
};

/**
 * Validate and sanitize search query
 * Use for: search inputs
 */
export const sanitizeSearchQuery = (query: string | undefined | null): string => {
  if (!query || typeof query !== 'string') return '';

  return query
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 200); // Limit length
};

/**
 * Sanitize number input - ensures it's a valid number
 * Use for: price, duration, etc.
 */
export const sanitizeNumber = (value: unknown, defaultValue: number = 0): number => {
  const num = Number(value);
  return isFinite(num) && num >= 0 ? num : defaultValue;
};

/**
 * Sanitize JSON string - safely parse and validate
 * Use for: JSON data from user
 */
export const sanitizeJSON = <T = unknown>(json: string | undefined | null, defaultValue: T): T => {
  if (!json || typeof json !== 'string') return defaultValue;

  try {
    const parsed = JSON.parse(json);
    // Recursively sanitize string values in the parsed object
    return sanitizeObjectStrings(parsed);
  } catch {
    return defaultValue;
  }
};

/**
 * Recursively sanitize all string values in an object
 * Use for: complex user input objects
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
        sanitized[key] = sanitizeObjectStrings((obj as Record<string, unknown>)[key]);
      }
    }
    return sanitized;
  }

  return obj;
};

/**
 * Escape HTML entities for safe display
 * Use for: displaying user content in text nodes
 */
export const escapeHTML = (text: string | undefined | null): string => {
  if (!text || typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Check if a string contains potentially dangerous content
 * Returns true if dangerous content is detected
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
  ];

  return dangerousPatterns.some(pattern => pattern.test(text));
};

/**
 * Sanitize and validate array input
 * Use for: tags, categories, etc.
 */
export const sanitizeArray = (
  arr: unknown[] | undefined | null,
  maxLength: number = 50,
  itemSanitizer: (item: unknown) => unknown = sanitizeText
): unknown[] => {
  if (!Array.isArray(arr)) return [];

  return arr
    .slice(0, maxLength)
    .map(itemSanitizer)
    .filter(item => item !== null && item !== undefined && item !== '');
};

/**
 * Create a safe React component that renders sanitized HTML
 * Use this sparingly and only when HTML rendering is absolutely necessary
 */
export const createSafeHTML = (html: string): { __html: string } => {
  return { __html: sanitizeHTML(html) };
};
