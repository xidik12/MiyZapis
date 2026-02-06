import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center bg-white/10 dark:bg-gray-800/50 rounded-full p-0.5 backdrop-blur-md border border-white/20 dark:border-gray-700/50 ${className}`}>
      {/* Ukrainian */}
      <button
        onClick={() => setLanguage('uk')}
        className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap ${
          language === 'uk'
            ? 'bg-secondary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        UK
      </button>

      {/* English */}
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap ${
          language === 'en'
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        EN
      </button>

      {/* Russian */}
      <button
        onClick={() => setLanguage('ru')}
        className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap ${
          language === 'ru'
            ? 'bg-red-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        RU
      </button>
    </div>
  );
};
