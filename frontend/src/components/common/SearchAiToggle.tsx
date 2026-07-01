import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';

// Segmented "Search / Ask AI" switch (matches the marketplace pattern). Search
// is the classic marketplace search; Ask AI opens the concierge chat. Rendered on
// both /search and /concierge so the toggle stays visible and content swaps.
interface Props {
  active: 'search' | 'ai';
  className?: string;
}

export const SearchAiToggle: React.FC<Props> = ({ active, className = '' }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const tr = (uk: string, ru: string, en: string) => (language === 'uk' ? uk : language === 'ru' ? ru : en);

  const seg = (isActive: boolean) =>
    `relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
      isActive
        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
    }`;

  return (
    <div className={`inline-flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${className}`}>
      <button type="button" onClick={() => active !== 'search' && navigate('/search')} className={seg(active === 'search')}>
        <MagnifyingGlassIcon className="w-4 h-4" />
        {tr('Пошук', 'Поиск', 'Search')}
      </button>
      <button type="button" onClick={() => active !== 'ai' && navigate('/concierge')} className={seg(active === 'ai')}>
        <span aria-hidden className="text-primary-600 dark:text-primary-400">✦</span>
        {tr('Запитати AI', 'Спросить AI', 'Ask AI')}
        <span className="ml-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-1.5 py-0.5 rounded-full leading-none">Beta</span>
      </button>
    </div>
  );
};

export default SearchAiToggle;
