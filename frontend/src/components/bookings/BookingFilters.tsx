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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-3 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('bookings.status')}
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value })}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('filters.dateRange')}
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFiltersChange({ dateRange: e.target.value })}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="all">{t('filters.allTime')}</option>
            <option value="today">{t('filters.today')}</option>
            <option value="week">{t('filters.thisWeek')}</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('filters.search')}
          </label>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder={t('filters.searchPlaceholder')}
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('filters.sortBy')}
          </label>
          <div className="flex space-x-2">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'date' | 'amount' | 'status')}
              className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="date">{t('filters.date')}</option>
              <option value="amount">{t('filters.amount')}</option>
              <option value="status">{t('filters.status')}</option>
            </select>
            <button
              onClick={onSortOrderToggle}
              className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white text-sm min-w-[3rem] flex items-center justify-center"
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