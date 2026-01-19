export type SupportedCurrency = 'USD' | 'KHR';

export const normalizeCurrency = (value?: string | null): SupportedCurrency => {
  const normalized = (value || '').toUpperCase();
  return normalized === 'KHR' ? 'KHR' : 'USD';
};
