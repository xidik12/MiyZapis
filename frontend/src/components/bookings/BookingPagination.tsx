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
    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 animate-fade-in">
      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center sm:text-left px-4 py-2 bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50">
        {t('pagination.showing')} <span className="text-primary-600 dark:text-primary-400">{startItem}</span> {t('pagination.to')} <span className="text-primary-600 dark:text-primary-400">{endItem}</span> {t('pagination.of')} <span className="text-primary-600 dark:text-primary-400">{totalItems}</span> {t('pagination.results')}
      </div>
      <div className="flex flex-wrap justify-center sm:justify-end gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80 dark:disabled:hover:bg-gray-700/80 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 transition-all duration-200 active:scale-95 backdrop-blur-sm shadow-sm hover:shadow-md"
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
              className={`min-w-[2.75rem] px-3 py-2.5 text-sm font-bold border rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm ${
                page === currentPage
                  ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:bg-primary-700'
                  : 'text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 border-gray-200 dark:border-gray-600 hover:bg-primary-50/80 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 shadow-sm hover:shadow-md'
              }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-primary-50/80 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 dark:hover:border-primary-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/80 dark:disabled:hover:bg-gray-700/80 disabled:hover:text-gray-700 dark:disabled:hover:text-gray-300 transition-all duration-200 active:scale-95 backdrop-blur-sm shadow-sm hover:shadow-md"
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
};

export default BookingPagination;