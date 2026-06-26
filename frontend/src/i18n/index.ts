import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { setDefaultOptions } from 'date-fns';
import { enUS, uk as ukDateLocale, ru as ruDateLocale } from 'date-fns/locale';
import en from './translations/en';
import uk from './translations/uk';
import ru from './translations/ru';
import type { Language, LanguageContextType } from './types';

// Map the app language → date-fns locale so all format()/formatDistance() calls
// render month names, weekdays and AM/PM in the user's language (not English).
const dateFnsLocales = { en: enUS, uk: ukDateLocale, ru: ruDateLocale } as const;
// Set it immediately at module load (from the stored language) so the very first
// render is already localized, before the provider's effect runs.
try {
  const stored = (typeof localStorage !== 'undefined' && localStorage.getItem('booking-language')) || 'uk';
  const lang = (stored === 'en' || stored === 'ru') ? stored : 'uk';
  setDefaultOptions({ locale: dateFnsLocales[lang as Language] });
} catch { /* SSR / no localStorage — default locale applies */ }

export type { Language, LanguageContextType } from './types';
export type { TFunction } from './types';

const translationsByLang: Record<Language, Record<string, string>> = { en, uk, ru };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('booking-language');
    return (stored === 'uk' || stored === 'en' || stored === 'ru') ? stored : 'uk';
  });

  // Keep date-fns formatting in sync with the selected language.
  useEffect(() => {
    setDefaultOptions({ locale: dateFnsLocales[language] });
  }, [language]);

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
