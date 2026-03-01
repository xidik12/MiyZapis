/**
 * Logger utility for development and production environments
 * In production, only warnings and errors are logged
 * In development, all log levels are available
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Debug-level logging - only in development
   * Use for detailed debugging information
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },

  /**
   * Info-level logging - only in development
   * Use for general informational messages
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Warning-level logging - always logged
   * Use for potentially problematic situations
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error-level logging - always logged
   * Use for error conditions
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};
