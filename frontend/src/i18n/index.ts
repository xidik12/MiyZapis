import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import en from './translations/en';
import uk from './translations/uk';
import ru from './translations/ru';
import type { Language, LanguageContextType } from './types';

export type { Language, LanguageContextType } from './types';
export type { TFunction } from './types';

const translationsByLang: Record<Language, Record<string, string>> = { en, uk, ru };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('booking-language');
    return (stored === 'uk' || stored === 'en' || stored === 'ru') ? stored : 'uk';
  });

  const t = useCallback((key: string): string => {
    const value = translationsByLang[language]?.[key];
    if (value !== undefined) return value;

    // Fallback to English
    const fallback = translationsByLang.en[key];
    if (fallback !== undefined) return fallback;

    console.warn(`Translation missing for key: ${key}`);
    return key;
  }, [language]);

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('booking-language', lang);
  }, []);

  const value = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t
  }), [language, handleSetLanguage, t]);

  return React.createElement(
    LanguageContext.Provider,
    { value },
    children
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
