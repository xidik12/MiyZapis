import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { reviewsService, ReviewStats, Review } from '@/services/reviews.service';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { ReviewCardData } from '@/components/reviews/ReviewCard';
import { ReviewFiltersData } from '@/components/reviews/ReviewFilters';
import { ReviewReportModal } from '@/components/reviews/ReviewReportModal';
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

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

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

          response.reviews.forEach((r: Record<string, unknown>) => {
            if (distribution[r.rating] !== undefined) {
              distribution[r.rating] += 1;
            }
          });

          const totalForAverage = response.reviews.reduce((sum: number, r: Record<string, unknown>) => sum + r.rating, 0);
          const avgRating = totalReviews > 0 ? totalForAverage / totalReviews : 0;
          const verifiedReviewsCount = response.reviews.filter((r: Record<string, unknown>) => r.isVerified).length;
          const recommendationRate = totalReviews > 0
            ? response.reviews.filter((r: Record<string, unknown>) => (r.rating || 0) >= 4).length / totalReviews
            : 0;

          setReviewStats({
            averageRating: avgRating,
            totalReviews,
            ratingDistribution: distribution as ReviewStats['ratingDistribution'],
            verifiedReviewsCount,
            recommendationRate
          });
        }
      } catch (err: unknown) {
        const err = err instanceof Error ? err : new Error(String(err));
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

  const handleReact = async (reviewId: string, reaction: 'like' | 'dislike' | null) => {
    try {
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

      await reviewsService.reactToReview(reviewId, reaction);
    } catch (err: unknown) {
      console.error('Error reacting to review:', err);
      // Reload reviews on error to revert optimistic update
      setPage(1);
    }
  };

  const handleReactToResponse = async (reviewId: string, reaction: 'like' | 'dislike' | null) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      const prevReaction = review?.response?.userReaction;

      // Optimistically update UI
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId && r.response) {
          return {
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
          };
        }
        return r;
      }));

      await reviewsService.reactToResponse(reviewId, reaction);
    } catch (err: unknown) {
      console.error('Error reacting to response:', err);
      // Reload reviews on error to revert optimistic update
      setPage(1);
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
    } catch (error: unknown) {
      throw error;
    }
  };

  // Transform reviews to ReviewCardData format
  const transformedReviews: ReviewCardData[] = reviews.map((review: Record<string, unknown>) => {
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
          likeCount: review.response.likeCount ?? 0,
          dislikeCount: review.response.dislikeCount ?? 0,
          userReaction: review.response.userReaction ?? null
        }
      : undefined;

    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tags: review.tags || [],
      isVerified: !!review.isVerified,
      likeCount: review.likeCount || 0,
      dislikeCount: review.dislikeCount || 0,
      commentCount: review.commentCount || 0,
      userReaction: review.userReaction || null,
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
          onReact={handleReact}
          onReactToResponse={handleReactToResponse}
          onReport={handleReport}
          filters={filters}
          onFilterChange={handleFilterChange}
          emptyTitle={t('reviews.empty.title') || 'No reviews yet'}
          emptyDescription={t('reviews.empty.description') || 'You haven\'t written any reviews yet'}
        />

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

export default CustomerReviews;
