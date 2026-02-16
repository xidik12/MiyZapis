import { useState, useEffect } from 'react';
import type { Locale } from '@/utils/categories';

/**
 * Reads the user's language from Telegram WebApp or browser,
 * and returns one of the supported locales: 'en' | 'uk' | 'ru'.
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(() => detectLocale());

  useEffect(() => {
    // Re-check when Telegram theme/language changes
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      const handler = () => setLocale(detectLocale());
      webApp.onEvent('themeChanged', handler);
      return () => webApp.offEvent('themeChanged', handler);
    }
  }, []);

  return locale;
}

function detectLocale(): Locale {
  // 1. User's explicit choice from settings (highest priority)
  const stored = localStorage.getItem('miyzapis_locale');
  if (stored) {
    return mapToLocale(stored);
  }

  // 2. Telegram WebApp language code
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang) {
    return mapToLocale(tgLang);
  }

  // 3. Browser language
  const browserLang = navigator.language || (navigator as any).userLanguage || '';
  return mapToLocale(browserLang);
}

function mapToLocale(code: string): Locale {
  const lower = code.toLowerCase();
  if (lower.startsWith('uk')) return 'uk';
  if (lower.startsWith('ru')) return 'ru';
  return 'en';
}

/**
 * Simple translation helper — looks up a key in a string map for the given locale.
 */
export function t(
  strings: Record<string, Record<Locale, string>>,
  key: string,
  locale: Locale
): string {
  const entry = strings[key];
  if (!entry) return key;
  return entry[locale] || entry.en || key;
}

/**
 * Currency symbols map
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  UAH: '₴',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  KZT: '₸',
  UZS: 'сўм',
};

/**
 * Format a monetary amount with currency symbol.
 * Uses the currency from the data or defaults to UAH.
 */
export function formatCurrency(
  amount: number | string,
  currency?: string,
  locale?: Locale
): string {
  const num = Number(amount) || 0;
  const cur = (currency || 'UAH').toUpperCase();
  const symbol = CURRENCY_SYMBOLS[cur] || cur;
  const loc = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
  return `${symbol}${num.toLocaleString(loc)}`;
}
