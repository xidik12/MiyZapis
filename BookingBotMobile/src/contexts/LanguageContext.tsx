/**
 * Language Context - Adapted for React Native with AsyncStorage
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

export type Language = 'en' | 'kh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

interface TranslationValue {
  en: string;
  kh: string;
}

type Translations = Record<string, TranslationValue>;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Basic translations - matching web version structure
const createTranslations = (): Translations => {
  const map: Translations = {};

  const normalize = (value: string) =>
    value
      .replace(/MiyZap[iy]s/gi, 'Panhaha')
      .replace(/Miyzapis/gi, 'Panhaha')
      .replace(/VicheaPro/gi, 'Panhaha');

  // Basic translations - can be expanded with full translations-en.json later
  const basicTranslations: Record<string, string> = {
    'brand.name': 'Panhaha',
    'brand.tagline': 'Professional Services Marketplace',
    'hero.title': 'Find Expert Services in Cambodia',
    'hero.title1': 'Book trusted Cambodian specialists',
    'hero.title2': 'Elevate every appointment with Panhaha',
    'hero.subtitle': 'Connect with verified specialists and businesses. Book appointments instantly.',
    'hero.searchPlaceholder': 'Search for services...',
    'hero.searchButton': 'Search',
    'cta.title': 'Ready to Get Started?',
    'cta.subtitle.loggedOut': 'Join thousands of satisfied customers and businesses',
    'cta.subtitle.loggedIn': 'Find your next professional service',
    'cta.browseServices': 'Browse Services',
    'cta.signUpCustomer': 'Sign Up as Customer',
    'cta.joinSpecialist': 'Join as Specialist',
    'cta.joinBusiness': 'Register Your Business',
    'currency.usd': 'US Dollar',
    'currency.khr': 'Khmer Riel',
    'settings.language': 'Language',
    'settings.languageDescription': 'Set your preferred language and currency',
    'settings.languagePreferences': 'Language Preferences',
    'settings.interfaceLanguage': 'Interface Language',
    'settings.theme': 'Theme',
    'settings.theme.light': 'Light',
    'settings.theme.dark': 'Dark',
    'settings.theme.system': 'System',
    'settings.currency': 'Currency',
    'auth.register.individualSpecialist': 'Individual Specialist',
    'auth.register.individualSpecialistDesc': 'I offer services independently',
    'auth.register.businessAccount': 'Business Account',
    'auth.register.businessAccountDesc': 'Clinic, salon, spa with multiple staff',
    'common.any': 'Any',
    'common.clear': 'Clear',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
  };

  const ensure = (key: string, en: string, kh?: string) => {
    const normalized = normalize(en);
    map[key] = { en: normalized, kh: kh ?? normalized };
  };

  // Load basic translations
  for (const [key, value] of Object.entries(basicTranslations)) {
    ensure(key, value);
  }

  return map;
};

const translations = createTranslations();

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
      const entry = translations[key];
      if (!entry) {
        return key;
      }
      return entry[language] || entry.en || key;
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

