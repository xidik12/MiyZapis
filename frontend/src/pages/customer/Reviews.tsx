import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpTip } from '@/components/common/HelpTip';
import { reviewsService, ReviewStats, Review } from '@/services/reviews.service';
import { ReviewFeed } from '@/components/reviews/ReviewFeed';
import { ReviewCardData } from '@/components/reviews/ReviewCard';
import { ReviewFiltersData } from '@/components/reviews/ReviewFilters';
import { ReviewReportModal } from '@/components/reviews/ReviewReportModal';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';

const CustomerReviews: React.FC = () => {
  const { t, language } = useLanguage();
  const currentUser = useAppSelector(selectUser);

  const HELP = {
    en: {
      overview: 'All the reviews you\'ve written for specialists you\'ve visited.\n\n• Stats bar at the top shows your average rating across all reviews and the total count.\n• Each card shows the rating (1–5 stars), your comment, the specialist\'s name and the service.\n• Reactions — you can like or dislike a review to show agreement.\n• Specialist response — if a specialist replied to your review, their response appears below your comment.\n• Report — flag a review if the content is incorrect or inappropriate.\n• Filters — sort by rating, date, or filter to show only reviews with comments.\n\nYou can leave a review from My Bookings → any Completed booking → Leave Review.',
    },
    uk: {
      overview: 'Усі відгуки, які ви написали про відвіданих спеціалістів.\n\n• Статистика вгорі показує вашу середню оцінку та загальну кількість відгуків.\n• Кожна картка містить оцінку (1–5 зірок), ваш коментар, ім\'я спеціаліста та назву послуги.\n• Реакції — ви можете лайкнути або дизлайкнути відгук.\n• Відповідь спеціаліста — якщо спеціаліст відповів на ваш відгук, відповідь показується нижче.\n• Поскаржитись — позначте відгук, якщо вміст некоректний або неприйнятний.\n• Фільтри — сортуйте за оцінкою, датою або показуйте лише відгуки з коментарями.\n\nЗалишити відгук можна в Моїх записах → будь-який завершений запис → Залишити відгук.',
    },
    ru: {
      overview: 'Все отзывы, которые вы написали о посещённых специалистах.\n\n• Статистика вверху показывает вашу среднюю оценку и общее количество отзывов.\n• Каждая карточка содержит оценку (1–5 звёзд), ваш комментарий, имя специалиста и название услуги.\n• Реакции — вы можете лайкнуть или дизлайкнуть отзыв.\n• Ответ специалиста — если специалист ответил на ваш отзыв, ответ отображается ниже.\n• Пожаловаться — отметьте отзыв, если содержимое некорректно или неприемлемо.\n• Фильтры — сортируйте по оценке, дате или показывайте только отзывы с комментариями.\n\nОставить отзыв можно в разделе «Мои записи» → любая завершённая запись → Оставить отзыв.',
    },
  };
  const h = (HELP as any)[language] || HELP.en;

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

        const response = await reviewsService.getMyReviews(page, 10, filters);

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

          // True average over ALL reviews, from the backend aggregate (not just this page).
          const avgRating = Number((response as any).averageRating) || 0;
          const verifiedReviewsCount = response.reviews.filter((r: any) => r.isVerified).length;
          const recommendationRate = response.reviews.length > 0
            ? response.reviews.filter((r: any) => (r.rating || 0) >= 4).length / response.reviews.length
            : 0;

          setReviewStats({
            averageRating: avgRating,
            totalReviews,
            ratingDistribution: distribution as ReviewStats['ratingDistribution'],
            verifiedReviewsCount,
            recommendationRate
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Reviews] Error loading reviews:', error);
        setError(message || 'Failed to load reviews');
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
    } catch (error: unknown) {
      console.error('Error reacting to review:', error);
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
    } catch (error: unknown) {
      console.error('Error reacting to response:', error);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('customer.nav.reviews')}
            </h1>
            <HelpTip title={language === 'uk' ? 'Мої відгуки' : language === 'ru' ? 'Мои отзывы' : 'My Reviews'} content={h.overview} />
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 mt-1">
            <p className="text-gray-600 dark:text-gray-400">
              {t('reviews.subtitle') || 'View and manage your reviews'}
            </p>
            <Link
              to="/customer/bookings"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.96]"
            >
              {t('reviews.writeReview') || 'Write a Review'}
            </Link>
          </div>
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
