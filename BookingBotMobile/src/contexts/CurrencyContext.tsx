/**
 * Currency Context - Adapted for React Native with AsyncStorage
 */
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Currency = 'USD' | 'KHR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number, fromCurrency?: Currency | 'UAH' | 'EUR') => number;
  formatPrice: (price: number | undefined | null, fromCurrency?: Currency | 'UAH' | 'EUR') => string;
  getCurrencySymbol: (currency?: Currency) => string;
  getCurrencyCode: (currency?: Currency) => string;
  normalizeMixedCurrencyAmount: (amount: number, assumedMixedCurrencies?: { USD: number; KHR: number }) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Exchange rates relative to USD (approximate averages)
// 1 USD = 4100 KHR
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1, // Base currency
  KHR: 4100, // 1 USD = 4100 KHR
};

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  KHR: '៛',
};

const CURRENCY_CODES: Record<Currency, string> = {
  USD: 'USD',
  KHR: 'KHR',
};

const STORAGE_KEY = 'booking-currency';

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load currency from storage on mount
  useEffect(() => {
    const loadCurrency = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'USD' || stored === 'KHR') {
          setCurrencyState(stored);
        }
      } catch (error) {
        console.error('Failed to load currency:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadCurrency();
  }, []);

  const handleSetCurrency = useCallback(
    async (newCurrency: Currency) => {
      setCurrencyState(newCurrency);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, newCurrency);
      } catch (error) {
        console.error('Failed to save currency:', error);
      }
    },
    []
  );

  const convertPrice = useCallback(
    (price: number, fromCurrency: Currency | 'UAH' | 'EUR' = 'USD'): number => {
      if (fromCurrency === currency) return price;

      // Convert any currency to USD first
      let priceInUSD = price;

      if (fromCurrency === 'USD') {
        priceInUSD = price;
      } else if (fromCurrency === 'KHR') {
        priceInUSD = price / EXCHANGE_RATES.KHR;
      } else if (fromCurrency === 'UAH') {
        // Legacy support for historical data (approximate 1 USD ≈ 41 UAH)
        priceInUSD = price / 41;
      } else if (fromCurrency === 'EUR') {
        // Legacy support for historical data (approximate 1 EUR ≈ 1.08 USD)
        priceInUSD = price * 1.08;
      }

      if (currency === 'USD') return Math.round(priceInUSD * 100) / 100;
      // Convert from USD to target currency (currently only KHR)
      const converted = priceInUSD * EXCHANGE_RATES[currency];
      return Math.round(converted);
    },
    [currency]
  );

  const getCurrencySymbol = useCallback(
    (targetCurrency?: Currency): string => {
      return CURRENCY_SYMBOLS[targetCurrency || currency];
    },
    [currency]
  );

  const getCurrencyCode = useCallback(
    (targetCurrency?: Currency): string => {
      return CURRENCY_CODES[targetCurrency || currency];
    },
    [currency]
  );

  // Format price with currency symbol
  const formatPrice = useCallback(
    (price: number | undefined | null, fromCurrency: Currency | 'UAH' | 'EUR' = 'USD'): string => {
      // Handle undefined/null prices
      if (price == null || isNaN(price)) {
        return `${getCurrencySymbol(currency)}0`;
      }

      const convertedPrice = convertPrice(price, fromCurrency);
      const symbol = getCurrencySymbol(currency);

      // Format numbers appropriately for each currency
      if (currency === 'KHR') {
        // Khmer Riels: typically displayed as whole numbers
        return `${symbol}${Math.round(convertedPrice).toLocaleString('km-KH')}`;
      }

      // USD: maintain cents for smaller amounts
      return convertedPrice >= 100
        ? `${symbol}${Math.round(convertedPrice).toLocaleString('en-US')}`
        : `${symbol}${convertedPrice.toFixed(2)}`;
    },
    [currency, convertPrice, getCurrencySymbol]
  );

  // Helper function to normalize mixed currency amounts (when backend doesn't convert)
  const normalizeMixedCurrencyAmount = useCallback(
    (
      amount: number,
      assumedMixedCurrencies: { USD: number; KHR: number } = { USD: 0.5, KHR: 0.5 }
    ): number => {
      // Heuristic for mixed currency data from backend
      const usdPortion = amount * assumedMixedCurrencies.USD;
      const khrPortion = amount * assumedMixedCurrencies.KHR;

      // Convert all to user's preferred currency
      return convertPrice(usdPortion, 'USD') + convertPrice(khrPortion, 'KHR');
    },
    [convertPrice]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency: handleSetCurrency,
      convertPrice,
      formatPrice,
      getCurrencySymbol,
      getCurrencyCode,
      normalizeMixedCurrencyAmount,
    }),
    [
      currency,
      handleSetCurrency,
      convertPrice,
      formatPrice,
      getCurrencySymbol,
      getCurrencyCode,
      normalizeMixedCurrencyAmount,
    ]
  );

  // Don't render until currency is loaded
  if (!isLoaded) {
    return null;
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

