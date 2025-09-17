export type AppLanguage = 'en' | 'uk' | 'ru';

export function parseAcceptLanguage(header?: string | string[]): AppLanguage {
  const raw = Array.isArray(header) ? header.join(',') : header || '';
  const lower = raw.toLowerCase();
  if (lower.includes('uk') || lower.includes('uk-ua')) return 'uk';
  if (lower.includes('ru') || lower.includes('ru-ru')) return 'ru';
  return 'en';
}

export function resolveLanguage(preferred?: string | null, header?: string | string[]): AppLanguage {
  if (preferred && ['en', 'uk', 'ru'].includes(preferred)) return preferred as AppLanguage;
  return parseAcceptLanguage(header);
}

