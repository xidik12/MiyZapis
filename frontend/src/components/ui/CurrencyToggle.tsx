import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';

interface CurrencyToggleProps {
  className?: string;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({ className = '' }) => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className={`flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-800 ${className}`}>
      <button
        onClick={() => setCurrency('USD')}
        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 mobile-touch-target ${
          currency === 'USD'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        $
      </button>
      <button
        onClick={() => setCurrency('EUR')}
        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 mobile-touch-target ${
          currency === 'EUR'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        €
      </button>
      <button
        onClick={() => setCurrency('UAH')}
        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 mobile-touch-target ${
          currency === 'UAH'
            ? 'bg-primary-600 text-white'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        ₴
      </button>
    </div>
  );
};