import { logger } from '@/utils/logger';

interface CurrencyRates {
  [key: string]: number;
}

// Exchange rates (in production, these should come from a real API like exchangerate-api.com)
const CURRENCY_RATES: CurrencyRates = {
  'USD_UAH': 37,
  'EUR_UAH': 40,
  'UAH_USD': 0.027,
  'UAH_EUR': 0.025,
  'USD_EUR': 0.93,
  'EUR_USD': 1.08,
  'UAH_PLN': 0.10,
  'PLN_UAH': 10.0,
  'USD_PLN': 3.9,
  'PLN_USD': 0.26,
  'EUR_PLN': 4.2,
  'PLN_EUR': 0.24,
};

// Supported currencies
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'UAH', 'PLN'] as const;
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export function isSupportedCurrency(currency: string): currency is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency);
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = CURRENCY_RATES[rateKey];

  if (!rate) {
    logger.warn(`Currency conversion rate not found for ${rateKey}`);
    return amount; // Return original amount if no conversion rate
  }

  const convertedAmount = amount * rate;
  
  // Round to 2 decimal places
  return Math.round(convertedAmount * 100) / 100;
}

/**
 * Convert price object with currency information
 */
export interface PriceInfo {
  amount: number;
  currency: string;
  originalAmount?: number;
  originalCurrency?: string;
}

export function convertPrice(
  originalAmount: number,
  originalCurrency: string,
  targetCurrency: string
): PriceInfo {
  if (originalCurrency === targetCurrency) {
    return {
      amount: originalAmount,
      currency: originalCurrency,
    };
  }

  const convertedAmount = convertCurrency(originalAmount, originalCurrency, targetCurrency);
  
  return {
    amount: convertedAmount,
    currency: targetCurrency,
    originalAmount,
    originalCurrency,
  };
}

/**
 * Format price for display
 */
export function formatPrice(price: PriceInfo, showOriginal: boolean = false): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'UAH': '₴',
    'PLN': 'zł',
  };

  const symbol = symbols[price.currency] || price.currency;
  const formattedAmount = price.amount.toLocaleString('en-US', {
    minimumFractionDigits: price.amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  let result = `${symbol}${formattedAmount}`;

  if (showOriginal && price.originalAmount && price.originalCurrency) {
    const originalSymbol = symbols[price.originalCurrency] || price.originalCurrency;
    const originalFormatted = price.originalAmount.toLocaleString('en-US', {
      minimumFractionDigits: price.originalAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
    result += ` (${originalSymbol}${originalFormatted})`;
  }

  return result;
}

/**
 * Get default currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'UAH': '₴',
    'PLN': 'zł',
  };
  
  return symbols[currency] || currency;
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): boolean {
  return typeof currency === 'string' && 
         currency.length === 3 && 
         isSupportedCurrency(currency);
}

/**
 * Get available exchange rates for debugging
 */
export function getAvailableRates(): CurrencyRates {
  return { ...CURRENCY_RATES };
}