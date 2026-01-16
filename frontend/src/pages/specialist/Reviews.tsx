import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { reviewsService, Review, ReviewStats } from '@/services/reviews.service';
import { specialistService } from '@/services/specialist.service';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { ReviewCardData } from '@/components/reviews/ReviewCard';
import { ReviewFiltersData } from '@/components/reviews/ReviewFilters';

const SpecialistReviews: React.FC = () => {
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<ReviewFiltersData>({
    rating: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    withComment: undefined,
    verified: undefined
  });

  // Load specialist profile to get specialist ID
  useEffect(() => {
    const loadSpecialistProfile = async () => {
      try {
        const profile = await specialistService.getProfile();
        const specialistData = profile.specialist || profile;
        setSpecialistId(specialistData.id);
      } catch (err: any) {
        console.error('[Reviews] Error loading specialist profile:', err);
        setError(err.message || 'Failed to load specialist profile');
      }
    };

    loadSpecialistProfile();
  }, []);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!specialistId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await reviewsService.getSpecialistReviews(
          specialistId,
          page,
          20,
          {
            rating: filters.rating,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            withComment: filters.withComment,
            verified: filters.verified
          }
        );

        const reviewsData = response.reviews || [];
        const paginationData = response.pagination || null;

        if (page === 1) {
          setReviews(reviewsData);
        } else {
          setReviews(prev => [...prev, ...reviewsData]);
        }

        // Set stats
        const statsData = response.stats;
        if (statsData) {
          const totalReviews = statsData.totalReviews ?? reviewsData.length ?? 0;
          const averageRating = Number.isFinite(statsData.averageRating)
            ? statsData.averageRating
            : (reviewsData.length > 0
                ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length
                : 0);
          const ratingDistribution = statsData.ratingDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          const verifiedReviewsCount = statsData.verifiedReviewsCount ?? reviewsData.filter(r => r.isVerified).length;
          const recommendationRate = Number.isFinite(statsData.recommendationRate) ? statsData.recommendationRate : 0;

          setReviewStats({
            totalReviews,
            averageRating,
            ratingDistribution,
            verifiedReviewsCount,
            recommendationRate,
          });

          // Try to get more accurate stats from dedicated endpoint
          if (page === 1) {
            try {
              const fullStats = await reviewsService.getSpecialistReviewStats(specialistId);
              setReviewStats({
                totalReviews: fullStats.totalReviews ?? totalReviews,
                averageRating: Number.isFinite(fullStats.averageRating) ? fullStats.averageRating : averageRating,
                ratingDistribution: fullStats.ratingDistribution || ratingDistribution,
                verifiedReviewsCount: fullStats.verifiedReviewsCount ?? verifiedReviewsCount,
                recommendationRate: Number.isFinite(fullStats.recommendationRate) ? fullStats.recommendationRate : recommendationRate,
              });
            } catch (e) {
              // Ignore if stats endpoint fails
            }
          }
        }

        setHasMore(paginationData?.hasNext || false);

      } catch (err: any) {
        console.error('[Reviews] Error loading reviews:', err);
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [specialistId, page, filters]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (newFilters: ReviewFiltersData) => {
    setFilters(newFilters);
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
                ? review.helpfulCount + 1
                : Math.max(0, review.helpfulCount - 1)
            }
          : review
      ));
    } catch (err: any) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const handleMarkResponseHelpful = async (responseId: string, helpful: boolean) => {
    try {
      // TODO: Implement response helpful API when available
      console.log('Mark response helpful:', responseId, helpful);
    } catch (err: any) {
      console.error('Error marking response as helpful:', err);
    }
  };

  // Transform reviews to ReviewCardData format
  const transformedReviews: ReviewCardData[] = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    tags: review.tags,
    isVerified: review.isVerified,
    helpfulCount: review.helpfulCount,
    isHelpful: review.isHelpful,
    createdAt: review.createdAt,
    customer: review.customer,
    service: review.service,
    response: review.response
  }));

  // Provide default stats if none available
  const defaultStats: ReviewStats = {
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    verifiedReviewsCount: 0,
    recommendationRate: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.nav.reviews')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reviews.subtitle') || 'See what your customers are saying'}
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
          emptyDescription={t('reviews.empty.description') || 'Your reviews will appear here once customers leave feedback'}
        />
      </div>
    </div>
  );
};

export default SpecialistReviews;
