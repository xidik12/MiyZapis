import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { reviewsService, Review, ReviewStats } from '@/services/reviews.service';
import { specialistService } from '@/services/specialist.service';
import { reputationService, ReputationSettings } from '@/services/reputation.service';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { ReviewCardData } from '@/components/reviews/ReviewCard';
import { ReviewFiltersData } from '@/components/reviews/ReviewFilters';
import { ReviewResponseModal } from '@/components/reviews/ReviewResponseModal';
import { ReviewReportModal } from '@/components/reviews/ReviewReportModal';

// Reviews & reputation settings — Google/Facebook review URLs. Completed
// bookings automatically trigger a review request to the customer (platform +
// these external pages when set). Mirrors the dark-mode / azure styling used
// across the specialist dashboard.
const ReputationSettingsCard: React.FC = () => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<ReputationSettings | null>(null);
  const [google, setGoogle] = useState('');
  const [facebook, setFacebook] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await reputationService.getSettings();
        if (!active) return;
        setSettings(s);
        setGoogle(s.googleReviewUrl || '');
        setFacebook(s.facebookReviewUrl || '');
      } catch {
        // Non-fatal — leave fields empty.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await reputationService.setSettings({
        googleReviewUrl: google.trim() || null,
        facebookReviewUrl: facebook.trim() || null,
      });
      setSettings(updated);
      setGoogle(updated.googleReviewUrl || '');
      setFacebook(updated.facebookReviewUrl || '');
      toast.success(t('reputation.saved'));
    } catch (error: unknown) {
      const code = (error as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
      toast.error(code === 'INVALID_URL' ? t('reputation.invalidUrl') : t('reputation.saveError'));
    } finally {
      setSaving(false);
    }
  };

  // Live preview of the request message the customer will receive.
  const previewLines = [
    t('reputation.previewIntro'),
    '',
    t('reputation.previewPlatform'),
    ...(google.trim() ? [t('reputation.previewGoogle').replace('{{url}}', google.trim())] : []),
    ...(facebook.trim() ? [t('reputation.previewFacebook').replace('{{url}}', facebook.trim())] : []),
  ].join('\n');

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        {t('reputation.title')}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('reputation.explainer')}
      </p>

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">{t('common.loading') || 'Loading…'}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('reputation.googleReviewUrl')}
              </label>
              <input
                type="url"
                value={google}
                onChange={(e) => setGoogle(e.target.value)}
                placeholder="https://g.page/r/..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('reputation.facebookReviewUrl')}
              </label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/.../reviews"
                className={inputClass}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              {t('reputation.previewLabel')}
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 font-sans">
{previewLines}
            </pre>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-sky-600 dark:text-sky-400">
              {settings?.autoRequestEnabled ? t('reputation.autoRequestOn') : t('reputation.autoRequestOff')}
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {saving ? (t('common.saving') || 'Saving…') : t('reputation.save')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

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
        const specialistData = (profile as any).specialist || profile;
        setSpecialistId(specialistData.id);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Reviews] Error loading specialist profile:', error);
        setError(message || 'Failed to load specialist profile');
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

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Reviews] Error loading reviews:', error);
        setError(message || 'Failed to load reviews');
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
    } catch (error: unknown) {
      console.error('Error reacting to review:', error);
      // Revert optimistic update on error by resetting page to trigger useEffect reload
      setPage(1);
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
    } catch (error: unknown) {
      console.error('Error reacting to response:', error);
      // Revert optimistic update on error by resetting page to trigger useEffect reload
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
              response: (result as any).response || {
                id: (result as any).response?.id || 'temp',
                message: responseText,
                createdAt: new Date().toISOString()
              }
            } as Review
          : review
      ));
    } catch (error: unknown) {
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
    likeCount: (review as any).likeCount || 0,
    dislikeCount: (review as any).dislikeCount || 0,
    commentCount: (review as any).commentCount || 0,
    userReaction: (review as any).userReaction || null,
    createdAt: review.createdAt,
    customer: review.customer,
    service: review.service,
    response: review.response,
  } as ReviewCardData));

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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard.nav.reviews')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('reviews.subtitle') || 'See what your customers are saying'}
          </p>
        </div>

        {/* Reviews & reputation settings */}
        <div className="max-w-5xl mx-auto px-4">
          <ReputationSettingsCard />
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
