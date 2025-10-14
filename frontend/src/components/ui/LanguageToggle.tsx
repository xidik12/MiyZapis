import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center bg-white/10 dark:bg-gray-800/50 rounded-full p-1 backdrop-blur-md border border-white/20 dark:border-gray-700/50 ${className}`}>
      {/* English - First */}
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 sm:px-3 md:px-4 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap mobile-touch-target ${
          language === 'en'
            ? 'bg-primary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        <span className="hidden xs:inline">🇬🇧 </span>EN
      </button>

      {/* Khmer - Second with Cambodia flag */}
      <button
        onClick={() => setLanguage('kh')}
        className={`px-2 sm:px-3 md:px-4 py-1 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap mobile-touch-target ${
          language === 'kh'
            ? 'bg-secondary-500 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-white/20'
        }`}
      >
        <span className="hidden xs:inline">🇰🇭 </span>ខ្មែរ
      </button>
    </div>
  );
};