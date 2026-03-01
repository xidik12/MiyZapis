export type Language = 'uk' | 'ru' | 'en';

export type TFunction = (key: string) => string;

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TFunction;
}
