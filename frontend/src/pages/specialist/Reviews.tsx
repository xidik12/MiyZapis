import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { reviewsService, Review, ReviewStats } from '@/services/reviews.service';
import { specialistService } from '@/services/specialist.service';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { ReviewCardData } from '@/components/reviews/ReviewCard';
import { ReviewFiltersData } from '@/components/reviews/ReviewFilters';
import { ReviewResponseModal } from '@/components/reviews/ReviewResponseModal';
import { ReviewReportModal } from '@/components/reviews/ReviewReportModal';

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
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [respondingToReview, setRespondingToReview] = useState<Review | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

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

  const handleReact = async (reviewId: string, reaction: 'like' | 'dislike' | null) => {
    try {
      // Get current reaction from local state
      const review = reviews.find(r => r.id === reviewId);
      const prevReaction = review?.userReaction;

      // Optimistically update UI
      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? {
              ...r,
              userReaction: reaction,
              likeCount: reaction === 'like'
                ? (prevReaction === 'like' ? (r.likeCount || 0) : (r.likeCount || 0) + 1)
                : (prevReaction === 'like' ? Math.max(0, (r.likeCount || 0) - 1) : (r.likeCount || 0)),
              dislikeCount: reaction === 'dislike'
                ? (prevReaction === 'dislike' ? (r.dislikeCount || 0) : (r.dislikeCount || 0) + 1)
                : (prevReaction === 'dislike' ? Math.max(0, (r.dislikeCount || 0) - 1) : (r.dislikeCount || 0))
            }
          : r
      ));

      // Call backend API
      await reviewsService.reactToReview(reviewId, reaction);
    } catch (err: any) {
      console.error('Error reacting to review:', err);
      // Revert optimistic update on error
      loadReviews();
    }
  };

  const handleReactToResponse = async (responseId: string, reaction: 'like' | 'dislike' | null) => {
    try {
      // Find the review with this response
      const review = reviews.find(r => r.response?.id === responseId);
      if (!review) return;

      const prevReaction = review.response?.userReaction;

      // Optimistically update UI
      setReviews(prev => prev.map(r =>
        r.response?.id === responseId && r.response
          ? {
              ...r,
              response: {
                ...r.response,
                userReaction: reaction,
                likeCount: reaction === 'like'
                  ? (prevReaction === 'like' ? (r.response.likeCount || 0) : (r.response.likeCount || 0) + 1)
                  : (prevReaction === 'like' ? Math.max(0, (r.response.likeCount || 0) - 1) : (r.response.likeCount || 0)),
                dislikeCount: reaction === 'dislike'
                  ? (prevReaction === 'dislike' ? (r.response.dislikeCount || 0) : (r.response.dislikeCount || 0) + 1)
                  : (prevReaction === 'dislike' ? Math.max(0, (r.response.dislikeCount || 0) - 1) : (r.response.dislikeCount || 0))
              }
            }
          : r
      ));

      // Call backend API
      await reviewsService.reactToResponse(review.id, reaction);
    } catch (err: any) {
      console.error('Error reacting to response:', err);
      // Revert optimistic update on error
      loadReviews();
    }
  };

  const handleReport = async (reviewId: string) => {
    setReportingReviewId(reviewId);
    setReportModalOpen(true);
  };

  const handleSubmitReport = async (reason: string, details?: string) => {
    try {
      if (!reportingReviewId) return;
      await reviewsService.reportReview(reportingReviewId, reason, details);
    } catch (error: any) {
      throw error; // Re-throw to let modal handle it
    }
  };

  const handleRespondToReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setRespondingToReview(review);
      setResponseModalOpen(true);
    }
  };

  const handleSubmitResponse = async (responseText: string) => {
    if (!respondingToReview) return;

    try {
      const result = await reviewsService.respondToReview(respondingToReview.id, responseText);

      // Update the review in local state with the new response
      setReviews(prev => prev.map(review =>
        review.id === respondingToReview.id
          ? {
              ...review,
              response: result.response || {
                id: result.response?.id || 'temp',
                message: responseText,
                createdAt: new Date().toISOString()
              }
            }
          : review
      ));
    } catch (error: any) {
      console.error('[Reviews] Error responding to review:', error);
      throw error; // Re-throw to let modal handle it
    }
  };

  // Transform reviews to ReviewCardData format
  const transformedReviews: ReviewCardData[] = reviews.map(review => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    tags: review.tags,
    isVerified: review.isVerified,
    likeCount: review.likeCount || 0,
    dislikeCount: review.dislikeCount || 0,
    userReaction: review.userReaction || null,
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
          onReact={handleReact}
          onReactToResponse={handleReactToResponse}
          onRespondToReview={handleRespondToReview}
          onReport={handleReport}
          filters={filters}
          onFilterChange={handleFilterChange}
          emptyTitle={t('reviews.empty.title') || 'No reviews yet'}
          emptyDescription={t('reviews.empty.description') || 'Your reviews will appear here once customers leave feedback'}
          showRespondButton={true}
        />

        {/* Response Modal */}
        {respondingToReview && (
          <ReviewResponseModal
            isOpen={responseModalOpen}
            onClose={() => {
              setResponseModalOpen(false);
              setRespondingToReview(null);
            }}
            onSubmit={handleSubmitResponse}
            reviewerName={`${respondingToReview.customer.firstName} ${respondingToReview.customer.lastName}`}
            reviewText={respondingToReview.comment}
            rating={respondingToReview.rating}
          />
        )}

        {/* Report Modal */}
        {reportingReviewId && (
          <ReviewReportModal
            isOpen={reportModalOpen}
            onClose={() => {
              setReportModalOpen(false);
              setReportingReviewId(null);
            }}
            onSubmit={handleSubmitReport}
            reviewId={reportingReviewId}
          />
        )}
      </div>
    </div>
  );
};

export default SpecialistReviews;
