import React from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ListBulletsIcon,
  SquaresFourIcon
} from '@/components/icons';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

export type ViewMode = 'week' | 'month' | 'day';

interface CalendarToolbarProps {
  currentDate: Date;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onNavigate
}) => {
  const { t } = useLanguage();
  const getDateRange = () => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Date Range and Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('today')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 active:scale-95"
          >
            {t('calendar.today')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="min-w-[200px] text-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {getDateRange()}
              </h2>
            </div>
            <button
              onClick={() => onNavigate('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button
            onClick={() => onViewModeChange('month')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              viewMode === 'month'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <SquaresFourIcon className="w-4 h-4" />
            {t('calendar.month')}
          </button>
          <button
            onClick={() => onViewModeChange('week')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              viewMode === 'week'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ListBulletsIcon className="w-4 h-4" />
            {t('calendar.back')}
          </button>
          <button
            onClick={() => onViewModeChange('day')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
              viewMode === 'day'
                ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            {t('calendar.next')}
          </button>
        </div>
      </div>
    </div>
  );
};
