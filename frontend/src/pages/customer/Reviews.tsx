import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { reviewsService } from '@/services/reviews.service';
import {
  StarIcon,
  ClockIcon,
  CheckBadgeIcon,
  EyeIcon,
  EyeSlashIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface CustomerReview {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isVerified: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const CustomerReviews: React.FC = () => {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'createdAt' | 'rating'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchReviews = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await reviewsService.getMyReviews(page, 20);
      setReviews(response.reviews);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [sortBy, sortOrder]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && pagination && page <= pagination.totalPages) {
      fetchReviews(page);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US',
      { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const ratingDistribution = reviews.reduce((acc, review) => {
    acc[review.rating] = (acc[review.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  if (loading && reviews.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('customer.nav.reviews')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your reviews and ratings
          </p>
        </div>

        {/* Stats Overview */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <StarIconSolid className="h-8 w-8 text-yellow-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {averageRating.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <CheckBadgeIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Verified Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reviews.filter(r => r.isVerified).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
              <div className="flex items-center">
                <EyeIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Public Reviews</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reviews.filter(r => r.isPublic).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Sorting */}
        {reviews.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-700 dark:text-gray-300">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'rating')}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="createdAt">Date</option>
                  <option value="rating">Rating</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button 
              onClick={() => fetchReviews(currentPage)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 && !loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow">
              <StarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Reviews Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You haven't written any reviews yet. Complete a booking to leave your first review!
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div>{renderStars(review.rating)}</div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(review.createdAt)}</span>
                      <ClockIcon className="h-4 w-4 ml-2" />
                      <span>{formatTime(review.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.isVerified && (
                      <CheckBadgeIcon className="h-5 w-5 text-green-600" title="Verified Review" />
                    )}
                    {review.isPublic ? (
                      <EyeIcon className="h-5 w-5 text-blue-600" title="Public Review" />
                    ) : (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" title="Private Review" />
                    )}
                  </div>
                </div>

                {review.comment && (
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                  </div>
                )}

                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {review.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-md text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {review.createdAt !== review.updatedAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {formatDate(review.updatedAt)} at {formatTime(review.updatedAt)}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
              Page {currentPage} of {pagination.totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        )}

        {/* Loading State for Pagination */}
        {loading && reviews.length > 0 && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;