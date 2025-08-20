import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center bg-white/10 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-md border border-white/20 dark:border-gray-700/50 ${className}`}>
      {/* Ukrainian - First */}
      <button
        onClick={() => setLanguage('uk')}
        className={`px-1.5 sm:px-2 md:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap mobile-touch-target ${
          language === 'uk'
            ? 'bg-secondary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        <span className="hidden xs:inline">🇺🇦 </span>UK
      </button>
      
      {/* English - Second with flag and circle */}
      <button
        onClick={() => setLanguage('en')}
        className={`px-1.5 sm:px-2 md:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap mobile-touch-target ${
          language === 'en'
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        <span className="hidden xs:inline">🇬🇧 </span>EN
      </button>
      
      {/* Russian - Third */}
      <button
        onClick={() => setLanguage('ru')}
        className={`px-1.5 sm:px-2 md:px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap mobile-touch-target ${
          language === 'ru'
            ? 'bg-red-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        <span className="hidden xs:inline">🇷🇺 </span>RU
      </button>
    </div>
  );
};