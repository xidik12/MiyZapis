import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { reviewsService, ReviewStats, Review } from '@/services/reviews.service';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { ReviewCardData } from '@/components/reviews/ReviewCard';
import { ReviewFiltersData } from '@/components/reviews/ReviewFilters';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
const CustomerReviews: React.FC = () => {
  const { t } = useLanguage();
  const currentUser = useAppSelector(selectUser);

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
          const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

          response.reviews.forEach((r: any) => {
            if (distribution[r.rating] !== undefined) {
              distribution[r.rating] += 1;
            }
          });

          const totalForAverage = response.reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
          const avgRating = totalReviews > 0 ? totalForAverage / totalReviews : 0;
          const verifiedReviewsCount = response.reviews.filter((r: any) => r.isVerified).length;
          const recommendationRate = totalReviews > 0
            ? response.reviews.filter((r: any) => (r.rating || 0) >= 4).length / totalReviews
            : 0;

          setReviewStats({
            averageRating: avgRating,
            totalReviews,
            ratingDistribution: distribution as ReviewStats['ratingDistribution'],
            verifiedReviewsCount,
            recommendationRate
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

  const handleMarkHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      await reviewsService.markReviewHelpful(reviewId, helpful);

      // Update local state
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? {
              ...review,
              isHelpful: helpful,
              helpfulCount: helpful
                ? (review.helpfulCount || 0) + 1
                : Math.max((review.helpfulCount || 1) - 1, 0)
            }
          : review
      ));
    } catch (error: any) {
      console.error('[Reviews] Error marking review as helpful:', error);
    }
  };

  const handleMarkResponseHelpful = async (responseId: string, helpful: boolean) => {
    try {
      await reviewsService.markReviewHelpful(responseId, helpful);

      // Update local state for the response
      setReviews(prev => prev.map(review => {
        if (review.response && review.response.id === responseId) {
          return {
            ...review,
            response: {
              ...review.response,
              isHelpful: helpful,
              helpfulCount: helpful
                ? (review.response.helpfulCount || 0) + 1
                : Math.max((review.response.helpfulCount || 1) - 1, 0)
            }
          };
        }
        return review;
      }));
    } catch (error: any) {
      console.error('[Reviews] Error marking response as helpful:', error);
    }
  };

  // Transform reviews to ReviewCardData format
  const transformedReviews: ReviewCardData[] = reviews.map((review: any) => {
    const customer = review.customer || {
      id: currentUser?.id || 'me',
      firstName: currentUser?.firstName || 'You',
      lastName: currentUser?.lastName || '',
      avatar: currentUser?.avatar
    };

    const service =
      review.service ||
      (review.booking?.service
        ? { id: review.booking.service.id, name: review.booking.service.name }
        : undefined);

    const response = review.response
      ? {
          id: review.response.id,
          responseText:
            review.response.responseText ||
            review.response.content ||
            review.response.message ||
            '',
          createdAt: review.response.createdAt || review.updatedAt,
          respondedBy:
            review.response.respondedBy || {
              id: review.response.specialistId || review.specialist?.id || '',
              firstName: review.specialist?.firstName || '',
              lastName: review.specialist?.lastName || '',
              avatar: review.specialist?.avatar
            },
          helpfulCount: review.response.helpfulCount ?? 0,
          isHelpful: review.response.isHelpful ?? false
        }
      : undefined;

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tags: review.tags || [],
      isVerified: !!review.isVerified,
      helpfulCount: review.helpfulCount || 0,
      isHelpful: review.isHelpful || false,
      createdAt: review.createdAt || new Date().toISOString(),
      customer,
      service,
      response
    };
  });

  const defaultStats: ReviewStats = {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verifiedReviewsCount: 0,
    recommendationRate: 0
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
