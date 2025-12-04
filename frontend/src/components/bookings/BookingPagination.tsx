import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BookingPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const BookingPagination: React.FC<BookingPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}) => {
  const { t } = useLanguage();

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
      <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
        {t('pagination.showing')} {startItem} {t('pagination.to')} {endItem} {t('pagination.of')} {totalItems} {t('pagination.results')}
      </div>
      <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('pagination.previous')}
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let page;
          if (totalPages <= 5) {
            page = i + 1;
          } else if (currentPage <= 3) {
            page = i + 1;
          } else if (currentPage >= totalPages - 2) {
            page = totalPages - 4 + i;
          } else {
            page = currentPage - 2 + i;
          }

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium border rounded-lg ${
                page === currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
};

export default BookingPagination;