/**
 * Re-export from the new i18n module.
 *
 * This file exists for backward compatibility — all 100+ imports across the
 * codebase reference `@/contexts/LanguageContext` or relative paths to this file.
 *
 * The actual implementation now lives in `src/i18n/index.ts` with translations
 * split into per-language files under `src/i18n/translations/`.
 */
export { LanguageProvider, useLanguage } from '../i18n';
export type { TFunction, Language, LanguageContextType } from '../i18n';
