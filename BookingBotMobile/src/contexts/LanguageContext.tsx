/**
 * Language Context - Adapted for React Native with full translations
 * Now loads complete translations from JSON files (2,233 keys)
 */
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translationsEn from '../locales/en.json';
import translationsKh from '../locales/kh.json';

export type Language = 'en' | 'kh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Full translations loaded from JSON files
const translations: Record<Language, Record<string, string>> = {
  en: translationsEn as Record<string, string>,
  kh: translationsKh as Record<string, string>,
};

const STORAGE_KEY = 'language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load language from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'kh' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const handleSetLanguage = useCallback(
    async (lang: Language) => {
      setLanguageState(lang);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, lang);
      } catch (error) {
        console.error('Failed to save language:', error);
      }
    },
    []
  );

  const t = useCallback(
    (key: string): string => {
      const translation = translations[language]?.[key];
      if (translation) {
        return translation;
      }
      // Fallback to English if translation not found
      const fallback = translations.en?.[key];
      if (fallback) {
        return fallback;
      }
      // Return key if no translation found
      return key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      t,
    }),
    [language, handleSetLanguage, t]
  );

  // Don't render until language is loaded
  if (!isLoaded) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

