import React from 'react';
import { motion } from 'framer-motion';
import {
  StarIcon,
  CheckCircleIcon as CheckBadgeIcon,
  FunnelIcon,
  XIcon
} from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ReviewFiltersData {
  rating?: number;
  sortBy: 'createdAt' | 'rating' | 'helpful';
  sortOrder: 'asc' | 'desc';
  withComment?: boolean;
  verified?: boolean;
}

interface ReviewFiltersProps {
  filters: ReviewFiltersData;
  onFilterChange: (filters: ReviewFiltersData) => void;
}

export const ReviewFilters: React.FC<ReviewFiltersProps> = ({
  filters,
  onFilterChange
}) => {
  const { t } = useLanguage();
  const hasActiveFilters = filters.rating !== undefined || filters.verified !== undefined || filters.withComment !== undefined;

  const handleRatingFilter = (rating?: number) => {
    onFilterChange({ ...filters, rating });
  };

  const handleSortChange = (sortBy: ReviewFiltersData['sortBy'], sortOrder: ReviewFiltersData['sortOrder']) => {
    onFilterChange({ ...filters, sortBy, sortOrder });
  };

  const handleVerifiedToggle = () => {
    onFilterChange({
      ...filters,
      verified: filters.verified === true ? undefined : true
    });
  };

  const handleWithCommentToggle = () => {
    onFilterChange({
      ...filters,
      withComment: filters.withComment === true ? undefined : true
    });
  };

  const clearFilters = () => {
    onFilterChange({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border border-gray-200/50 dark:border-gray-700/50 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('reviews.filters.all')}
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
          >
            <XIcon className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Filter by Rating
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleRatingFilter(undefined)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
              filters.rating === undefined
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('reviews.filters.all')}
          </button>
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRatingFilter(rating)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
                filters.rating === rating
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <StarIcon className="w-4 h-4 text-yellow-500" active />
              <span>{rating}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Sort By
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={() => handleSortChange('createdAt', 'desc')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              filters.sortBy === 'createdAt' && filters.sortOrder === 'desc'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('reviews.filters.newest')}
          </button>
          <button
            onClick={() => handleSortChange('rating', 'desc')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              filters.sortBy === 'rating' && filters.sortOrder === 'desc'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('reviews.filters.5stars')}
          </button>
          <button
            onClick={() => handleSortChange('helpful', 'desc')}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              filters.sortBy === 'helpful' && filters.sortOrder === 'desc'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('reviews.filters.verified')}
          </button>
        </div>
      </div>

      {/* Additional Filters */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Additional Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleVerifiedToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
              filters.verified === true
                ? 'bg-green-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <CheckBadgeIcon className="w-4 h-4" />
            {t('reviews.filters.verified')}
          </button>
          <button
            onClick={handleWithCommentToggle}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
              filters.withComment === true
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('reviews.filters.withPhotos')}
          </button>
        </div>
      </div>
    </div>
  );
};
