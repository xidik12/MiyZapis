/**
 * Shared date formatting utilities.
 *
 * Consolidates the ~40+ inline `formatDate` implementations scattered across
 * frontend pages and components. Each function covers a common pattern found
 * in the codebase. Import the one you need instead of re-implementing it.
 */

type SupportedLanguage = 'en' | 'uk' | 'ru' | string;

/** Map a language code to a BCP-47 locale string. */
function toLocale(lang?: SupportedLanguage): string {
  if (!lang) return 'en-US';
  if (lang.startsWith('uk')) return 'uk-UA';
  if (lang.startsWith('ru')) return 'ru-RU';
  return 'en-US';
}

/**
 * Standard date format: "Jan 5, 2025" (locale-aware).
 *
 * Replaces the most common pattern found in the codebase:
 *   `new Date(dateString).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })`
 *
 * Used in: Loyalty pages, Finances, Reviews, Clients, Wallet, etc.
 */
export function formatDate(dateString: string, language?: SupportedLanguage): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(toLocale(language), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Short date format: "Jan 5" (no year).
 *
 * Used in: chart labels, notification cards, compact lists.
 */
export function formatDateShort(dateString: string, language?: SupportedLanguage): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(toLocale(language), {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Relative / "time ago" format with locale-aware strings.
 *
 * Returns: "Just now", "3h ago", "Yesterday", or falls back to short date.
 *
 * Replaces the repeated pattern found in CommunityPage, PostDetailPage, WalletPage, etc.
 */
export function formatDateRelative(
  dateString: string,
  language?: SupportedLanguage,
  translations?: {
    justNow?: string;
    ago?: string;
    yesterday?: string;
  }
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  const t = {
    justNow: translations?.justNow || 'Just now',
    ago: translations?.ago || 'ago',
    yesterday: translations?.yesterday || 'Yesterday',
  };

  if (diffHours < 1) return t.justNow;
  if (diffHours < 24) return `${diffHours}h ${t.ago}`;
  if (diffHours < 48) return t.yesterday;

  return formatDateShort(dateString, language);
}

/**
 * Date with weekday: "Mon, Jan 5".
 *
 * Used in: PaymentProcessingPage, BookingFlow.
 */
export function formatDateWithWeekday(dateString: string, language?: SupportedLanguage): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(toLocale(language), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Time-only format: "14:30" or "2:30 PM".
 *
 * Used in: PaymentProcessingPage, BookingFlow, Schedule.
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Full date with time: "Jan 5, 2025 at 14:30".
 *
 * Combines date and time for detailed views.
 */
export function formatDateTime(dateString: string, language?: SupportedLanguage): string {
  return `${formatDate(dateString, language)} ${formatTime(dateString)}`;
}
