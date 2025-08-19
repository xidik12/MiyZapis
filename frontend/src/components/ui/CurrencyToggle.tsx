import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface CurrencyToggleProps {
  className?: string;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ className = '' }) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={`flex items-center bg-white/10 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-md border border-white/20 dark:border-gray-700/50 ${className}`}>
      <button
        onClick={() => setCurrency('USD')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
          currency === 'USD'
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        $
      </button>
      <button
        onClick={() => setCurrency('EUR')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
          currency === 'EUR'
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        €
      </button>
      <button
        onClick={() => setCurrency('UAH')}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
          currency === 'UAH'
            ? 'bg-secondary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        ₴
      </button>
    </div>
  );
};