import React from 'react';
import { ListBulletsIcon, SquaresFourIcon } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';

export type ViewMode = 'table' | 'kanban';

interface BookingViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export const BookingViewToggle: React.FC<BookingViewToggleProps> = ({
  viewMode,
  onViewModeChange
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
      <button
        onClick={() => onViewModeChange('table')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
          viewMode === 'table'
            ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <ListBulletsIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{t('booking.toggle.list')}</span>
      </button>
      <button
        onClick={() => onViewModeChange('kanban')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
          viewMode === 'kanban'
            ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <SquaresFourIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{t('booking.toggle.kanban')}</span>
      </button>
    </div>
  );
};
