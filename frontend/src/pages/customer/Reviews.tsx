import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { reviewsService, ReviewStats, Review } from '@/services/reviews.service';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { ReviewCardData } from '@/components/reviews/ReviewCard';
import { ReviewFiltersData } from '@/components/reviews/ReviewFilters';
const CustomerReviews: React.FC = () => {
  const { t } = useLanguage();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<ReviewFiltersData>({
    rating: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    withComment: undefined,
    verified: undefined
  });

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await reviewsService.getMyReviews(page, 10);

        if (page === 1) {
          setReviews(response.reviews as Review[]);
        } else {
          setReviews(prev => [...prev, ...(response.reviews as Review[])]);
        }

        setHasMore(response.pagination.hasNext);

        // Calculate stats from reviews
        if (response.reviews.length > 0) {
          const totalReviews = response.pagination.totalItems;
          const avgRating = response.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / response.reviews.length;
          const distribution: Record<number, number> = {};
          response.reviews.forEach((r: any) => {
            distribution[r.rating] = (distribution[r.rating] || 0) + 1;
          });

          setReviewStats({
            averageRating: avgRating,
            totalReviews,
            ratingDistribution: distribution,
            verifiedCount: response.reviews.filter((r: any) => r.isVerified).length,
            withCommentCount: response.reviews.filter((r: any) => r.comment).length
          });
        }
      } catch (err: any) {
        console.error('[Reviews] Error loading reviews:', err);
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [page, filters]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (newFilters: Partial<ReviewFiltersData>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const handleMarkHelpful = async (reviewId: string) => {
    // Customer reviews don't need helpful marking
    console.log('Mark helpful:', reviewId);
  };

  const handleMarkResponseHelpful = async (responseId: string) => {
    // Customer reviews don't need response helpful marking
    console.log('Mark response helpful:', responseId);
  };

  // Transform reviews to ReviewCardData format
  const transformedReviews: ReviewCardData[] = reviews.map((review: any) => ({
    id: review.id,
    author: {
      name: review.specialist ? `${review.specialist.firstName || ''} ${review.specialist.lastName || ''}`.trim() : 'Specialist',
      avatar: review.specialist?.avatar,
      isVerified: review.isVerified || false,
      tier: review.specialist?.tier
    },
    rating: review.rating,
    date: new Date(review.createdAt),
    comment: review.comment,
    tags: review.tags || [],
    helpfulCount: review.helpfulCount || 0,
    hasResponse: !!review.response,
    response: review.response ? {
      id: review.response.id,
      content: review.response.content,
      date: new Date(review.response.createdAt),
      helpfulCount: review.response.helpfulCount || 0
    } : undefined,
    service: review.service ? {
      name: review.service.name,
      icon: review.service.icon
    } : undefined
  }));

  const defaultStats: ReviewStats = {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: {},
    verifiedCount: 0,
    withCommentCount: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('customer.nav.reviews')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reviews.subtitle') || 'View and manage your reviews'}
          </p>
        </div>

        {/* Review Feed */}
        <ReviewFeed
          reviews={transformedReviews}
          stats={reviewStats || defaultStats}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onMarkHelpful={handleMarkHelpful}
          onMarkResponseHelpful={handleMarkResponseHelpful}
          filters={filters}
          onFilterChange={handleFilterChange}
          emptyTitle={t('reviews.empty.title') || 'No reviews yet'}
          emptyDescription={t('reviews.empty.description') || 'You haven\'t written any reviews yet'}
        />
      </div>
    </div>
  );
};

export default CustomerReviews;
