import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface FilterState {
  status: string;
  dateRange: string;
  serviceType: string;
  searchTerm: string;
}

interface BookingFiltersProps {
  filters: FilterState;
  sortBy: 'date' | 'amount' | 'status';
  sortOrder: 'asc' | 'desc';
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onSortByChange: (sortBy: 'date' | 'amount' | 'status') => void;
  onSortOrderToggle: () => void;
}

const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  sortBy,
  sortOrder,
  onFiltersChange,
  onSortByChange,
  onSortOrderToggle
}) => {
  const { t } = useLanguage();

  return (
    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-glass border border-gray-200/50 dark:border-gray-700/50 mb-6 p-4 sm:p-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Status Filter */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
            {t('bookings.status')}
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 dark:text-white font-medium backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <option value="all">{t('filters.all')}</option>
            <option value="PENDING">{t('status.pending')}</option>
            <option value="CONFIRMED">{t('status.confirmed')}</option>
            <option value="IN_PROGRESS">{t('status.inProgress')}</option>
            <option value="COMPLETED">{t('status.completed')}</option>
            <option value="CANCELLED">{t('status.cancelled')}</option>
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
            {t('filters.dateRange')}
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ dateRange: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 dark:text-white font-medium backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <option value="all">{t('filters.allTime')}</option>
            <option value="today">{t('filters.today')}</option>
            <option value="week">{t('filters.thisWeek')}</option>
          </select>
        </div>

        {/* Search */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
            {t('filters.search')}
          </label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder={t('filters.searchPlaceholder')}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 dark:text-white font-medium backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:shadow-md placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        {/* Sort */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 transition-colors duration-200 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400">
            {t('filters.sortBy')}
          </label>
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'date' | 'amount' | 'status')}
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 dark:text-white font-medium backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:shadow-md cursor-pointer"
            >
              <option value="date">{t('filters.date')}</option>
              <option value="amount">{t('filters.amount')}</option>
              <option value="status">{t('filters.status')}</option>
            </select>
            <button
              onClick={onSortOrderToggle}
              className="px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white/80 dark:bg-gray-700/80 hover:bg-primary-50/80 dark:hover:bg-primary-900/30 dark:text-white text-sm min-w-[3rem] flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200 hover:scale-110 active:scale-95 hover:shadow-md backdrop-blur-sm"
              title={sortOrder === 'asc' ? t('filters.ascending') : t('filters.descending')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingFilters;