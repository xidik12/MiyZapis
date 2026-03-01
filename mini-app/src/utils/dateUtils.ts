/**
 * Shared date formatting utilities for the mini-app.
 *
 * Consolidates the ~15 inline `formatDate` implementations scattered across
 * mini-app pages. Import the function you need instead of re-implementing.
 */

import type { Locale } from '@/utils/categories';

/** Map a Locale to a BCP-47 locale string. */
function toLocaleStr(locale?: Locale): string {
  if (locale === 'uk') return 'uk-UA';
  if (locale === 'ru') return 'ru-RU';
  return 'en-US';
}

/**
 * Standard date format: "Jan 5, 2025" (locale-aware).
 *
 * Replaces: `new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`
 *
 * Used in: ReviewsPage, SpecialistReviewsPage, ClientsPage, etc.
 */
export function formatDate(dateStr: string, locale?: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(toLocaleStr(locale), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Short date format: "Jan 5" (no year).
 *
 * Used in: compact lists, profile booking lists, community posts.
 */
export function formatDateShort(dateStr: string, locale?: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(toLocaleStr(locale), {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Relative / "time ago" format.
 *
 * Returns locale-aware strings: "Just now", "3h ago", "Yesterday",
 * or falls back to short date format.
 *
 * Replaces the repeated pattern found in CommunityPage, PostDetailPage,
 * WalletPage, etc. Accepts a translator function for localized labels.
 *
 * @param dateStr   - ISO date string
 * @param locale    - Display locale
 * @param t         - Optional function to get translated labels.
 *                    Expected keys: 'justNow', 'hoursAgo', 'yesterday'.
 *                    If not provided, falls back to English.
 */
export function formatDateRelative(
  dateStr: string,
  locale?: Locale,
  t?: (key: string) => string
): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = diffMs / (1000 * 60 * 60);

  const label = (key: string, fallback: string) => (t ? t(key) : null) || fallback;

  if (diffHrs < 1) return label('justNow', 'Just now');
  if (diffHrs < 24) {
    const hrs = Math.floor(diffHrs);
    return `${hrs}${label('hoursAgo', 'h ago')}`;
  }
  if (diffHrs < 48) return label('yesterday', 'Yesterday');

  return date.toLocaleDateString(toLocaleStr(locale), { month: 'short', day: 'numeric' });
}

/**
 * Date with weekday: "Mon, Jan 5".
 *
 * Used in: BookingFlow, PaymentProcessingPage.
 */
export function formatDateWithWeekday(dateStr: string, locale?: Locale): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(toLocaleStr(locale), {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Time-only format: "14:30".
 *
 * Used in: PaymentProcessingPage, BookingFlow.
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
