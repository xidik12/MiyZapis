import { useState, useEffect, useCallback } from 'react';
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
 * Get the user's saved currency preference, defaulting to UAH.
 */
export function getSavedCurrency(): string {
  try {
    return localStorage.getItem('miyzapis_currency') || 'UAH';
  } catch {
    return 'UAH';
  }
}

/**
 * Hook that returns the user's saved currency preference and a setter.
 */
export function useCurrency(): [string, (currency: string) => void] {
  const [currency, setCurrencyState] = useState<string>(() => getSavedCurrency());

  const setCurrency = useCallback((code: string) => {
    const upper = code.toUpperCase();
    try {
      localStorage.setItem('miyzapis_currency', upper);
    } catch { /* ignore */ }
    setCurrencyState(upper);
  }, []);

  return [currency, setCurrency];
}

/**
 * Approximate exchange rates from UAH (base currency in DB) to other currencies.
 * All amounts in the database are stored in UAH.
 */
const UAH_EXCHANGE_RATES: Record<string, number> = {
  UAH: 1,
  USD: 41.5,   // 1 USD ≈ 41.5 UAH
  EUR: 43.5,   // 1 EUR ≈ 43.5 UAH
  GBP: 52,
  RUB: 0.45,
};

/**
 * Format a monetary amount with currency symbol.
 * Amounts in DB are in UAH — this converts to the user's preferred display currency.
 *
 * @param amount - Amount in the source currency (default: UAH from DB)
 * @param sourceCurrency - The currency the amount is already in (e.g. 'UAH' from DB).
 *                         If omitted, assumes UAH and converts to user preference.
 * @param locale - Display locale
 */
export function formatCurrency(
  amount: number | string,
  sourceCurrency?: string,
  locale?: Locale
): string {
  const num = Number(amount) || 0;
  const displayCur = getSavedCurrency();
  const source = (sourceCurrency || 'UAH').toUpperCase();

  // Convert: source → UAH → display currency
  let converted = num;
  if (source !== displayCur) {
    // First convert source to UAH
    const sourceRate = UAH_EXCHANGE_RATES[source] || 1;
    const uahAmount = source === 'UAH' ? num : num * sourceRate;
    // Then convert UAH to display currency
    const displayRate = UAH_EXCHANGE_RATES[displayCur] || 1;
    converted = displayCur === 'UAH' ? uahAmount : uahAmount / displayRate;
  }

  const symbol = CURRENCY_SYMBOLS[displayCur] || displayCur;
  const loc = locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';

  // Round to 2 decimal places for non-UAH, 0 for UAH
  const decimals = displayCur === 'UAH' ? 0 : 2;
  const formatted = converted.toLocaleString(loc, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol}${formatted}`;
}
