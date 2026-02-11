import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'USD' | 'EUR' | 'UAH';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number, fromCurrency?: Currency) => number;
  formatPrice: (price: number | undefined | null, fromCurrency?: Currency) => string;
  getCurrencySymbol: (currency?: Currency) => string;
  getCurrencyCode: (currency?: Currency) => string;
  normalizeMixedCurrencyAmount: (amount: number, assumedMixedCurrencies?: { 'UAH': number, 'USD': number, 'EUR': number }) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates relative to UAH (Ukrainian Hryvnia)
// 1 USD = 41 UAH, 1 EUR = 40 UAH (current realistic rates)
const EXCHANGE_RATES: Record<Currency, number> = {
  UAH: 1,      // Base currency
  USD: 41,     // 1 USD = 41 UAH
  EUR: 40,     // 1 EUR = 40 UAH
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  UAH: '₴',
};

const CURRENCY_CODES: Record<Currency, string> = {
  USD: 'USD',
  EUR: 'EUR',
  UAH: 'UAH',
};

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>(() => {
    const stored = localStorage.getItem('booking-currency');
    return (stored === 'USD' || stored === 'EUR' || stored === 'UAH') ? stored : 'UAH';
  });

  const handleSetCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('booking-currency', newCurrency);
  };
  // Backend stores prices in USD, so default fromCurrency is 'USD'
  const convertPrice = (price: number, fromCurrency: Currency = 'USD'): number => {
    if (fromCurrency === currency) return price;

    // Convert to UAH first (base currency)
    const priceInUAH = fromCurrency === 'UAH' ? price : price * EXCHANGE_RATES[fromCurrency];

    // Convert from UAH to target currency
    if (currency === 'UAH') return Math.round(priceInUAH * 100) / 100;
    return Math.round((priceInUAH / EXCHANGE_RATES[currency]) * 100) / 100;
  };

  // Format price with currency symbol
  // Changed default fromCurrency to 'USD' because backend stores prices in USD
  const formatPrice = (price: number | undefined | null, fromCurrency: Currency = 'USD'): string => {
    // Handle undefined/null prices
    if (price == null || isNaN(price)) {
      return `${getCurrencySymbol(currency)}0`;
    }

    const convertedPrice = convertPrice(price, fromCurrency);
    const symbol = getCurrencySymbol(currency);

    // Smart formatting: whole numbers when no cents, .XX only when there are real cents
    const isWholeNumber = convertedPrice === Math.floor(convertedPrice);

    if (currency === 'UAH') {
      // Ukrainian Hryvnia: always whole numbers with locale separator for large amounts
      const rounded = Math.round(convertedPrice);
      return rounded >= 1000
        ? `${symbol}${rounded.toLocaleString('uk-UA')}`
        : `${symbol}${rounded}`;
    } else {
      // USD/EUR: show .XX only when there are actual cents, otherwise whole number
      if (isWholeNumber) {
        const rounded = Math.round(convertedPrice);
        return rounded >= 1000
          ? `${symbol}${rounded.toLocaleString('en-US')}`
          : `${symbol}${rounded}`;
      } else {
        return `${symbol}${convertedPrice.toFixed(2)}`;
      }
    }
  };

  const getCurrencySymbol = (targetCurrency?: Currency): string => {
    return CURRENCY_SYMBOLS[targetCurrency || currency];
  };

  const getCurrencyCode = (targetCurrency?: Currency): string => {
    return CURRENCY_CODES[targetCurrency || currency];
  };

  // Helper function to normalize mixed currency amounts (when backend doesn't convert)
  const normalizeMixedCurrencyAmount = (amount: number, assumedMixedCurrencies: { 'UAH': number, 'USD': number, 'EUR': number } = { UAH: 0.8, USD: 0.15, EUR: 0.05 }): number => {
    // This is a heuristic for mixed currency data from backend
    // Assumes percentage breakdown based on your typical service distribution
    const uahPortion = amount * assumedMixedCurrencies.UAH;
    const usdPortion = amount * assumedMixedCurrencies.USD;
    const eurPortion = amount * assumedMixedCurrencies.EUR;
    
    // Convert all to user's preferred currency
    return convertPrice(uahPortion, 'UAH') + 
           convertPrice(usdPortion, 'USD') + 
           convertPrice(eurPortion, 'EUR');
  };

  return (
    <CurrencyContext.Provider 
      value={{ 
        currency, 
        setCurrency: handleSetCurrency, 
        convertPrice, 
        formatPrice,
        getCurrencySymbol,
        getCurrencyCode,
        normalizeMixedCurrencyAmount
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};