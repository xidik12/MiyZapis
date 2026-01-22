import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StarIcon } from '@/components/icons';
import { ReviewCard, ReviewCardData } from './ReviewCard';
import { ReviewStats, ReviewStatsData } from './ReviewStats';
import { ReviewFilters, ReviewFiltersData } from './ReviewFilters';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';

interface ReviewFeedProps {
  reviews: ReviewCardData[];
  stats: ReviewStatsData;
  loading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onReact?: (reviewId: string, reaction: 'like' | 'dislike' | null) => void;
  onReactToResponse?: (responseId: string, reaction: 'like' | 'dislike' | null) => void;
  onRespondToReview?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  filters?: ReviewFiltersData;
  onFilterChange?: (filters: ReviewFiltersData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  showRespondButton?: boolean;
}

export const ReviewFeed: React.FC<ReviewFeedProps> = ({
  reviews,
  stats,
  loading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  onReact,
  onReactToResponse,
  onRespondToReview,
  onReport,
  filters = {
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  onFilterChange,
  emptyTitle = 'No Reviews Yet',
  emptyDescription = 'Be the first to leave a review!',
  showRespondButton = false
}) => {
  // Show loading screen only on initial load
  if (loading && reviews.length === 0) {
    return <FullScreenHandshakeLoader message="Loading reviews..." />;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Stats Dashboard */}
      {stats.totalReviews > 0 && <ReviewStats stats={stats} />}

      {/* Filters */}
      {onFilterChange && stats.totalReviews > 0 && (
        <ReviewFilters filters={filters} onFilterChange={onFilterChange} />
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6 flex items-center gap-3"
        >
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Reviews Feed */}
      <div className="space-y-6">
        {/* Empty State */}
        {reviews.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-md border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
              <StarIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" active />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {emptyTitle}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              {emptyDescription}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {reviews.map((review, index) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReact={onReact}
                onReactToResponse={onReactToResponse}
                onRespondToReview={showRespondButton ? onRespondToReview : undefined}
                onReport={onReport}
                index={index}
              />
            ))}
          </AnimatePresence>
        )}

        {/* Load More Button */}
        {hasMore && onLoadMore && (
          <div className="flex justify-center pt-4">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Loading...
                </span>
              ) : (
                'Load More Reviews'
              )}
            </button>
          </div>
        )}

        {/* Loading indicator for pagination */}
        {loading && reviews.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
};
