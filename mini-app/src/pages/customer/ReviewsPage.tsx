import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  MessageCircle,
  User,
  ThumbsUp,
  ThumbsDown,
  Flag,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useAppSelector } from '@/hooks/redux';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { reviewsStrings, commonStrings } from '@/utils/translations';

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  booking: {
    id: string;
    service: { name: string };
    specialist: { businessName: string; user: { firstName: string; lastName: string; avatar?: string } };
    date: string;
  };
  response?: { response: string; createdAt: string };
  isVerified: boolean;
  likeCount?: number;
  dislikeCount?: number;
  userReaction?: 'LIKE' | 'DISLIKE' | null;
  createdAt: string;
}

const RATING_FILTERS = [0, 5, 4, 3, 2, 1]; // 0 = All
const SORT_OPTIONS = ['newest', 'oldest', 'highest', 'lowest'] as const;

export const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const { user } = useAppSelector(state => state.auth);
  const locale = useLocale();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState<typeof SORT_OPTIONS[number]>('newest');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);

  const s = (key: string) => t(reviewsStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchReviews = useCallback(async (pageNum: number, append = false) => {
    try {
      if (!append) setLoading(true);
      const data = await apiService.getReviews({ page: pageNum, limit: 10 }) as any;
      const items = data.reviews || data.items || (Array.isArray(data) ? data : []);
      if (append) {
        setReviews(prev => [...prev, ...items]);
      } else {
        setReviews(items);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
    } catch {
      if (!append) setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(1); }, [fetchReviews]);

  // Apply local filtering and sorting
  const filteredReviews = reviews
    .filter(r => ratingFilter === 0 || r.rating === ratingFilter)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });

  const handleReaction = async (review: ReviewItem, reactionType: 'LIKE' | 'DISLIKE') => {
    hapticFeedback.impactLight();
    const prevReaction = review.userReaction;
    const isToggleOff = prevReaction === reactionType;

    // Optimistic update
    setReviews(prev => prev.map(r => {
      if (r.id !== review.id) return r;
      let likeCount = r.likeCount || 0;
      let dislikeCount = r.dislikeCount || 0;

      // Remove previous reaction
      if (prevReaction === 'LIKE') likeCount--;
      if (prevReaction === 'DISLIKE') dislikeCount--;

      // Add new reaction (unless toggling off)
      if (!isToggleOff) {
        if (reactionType === 'LIKE') likeCount++;
        if (reactionType === 'DISLIKE') dislikeCount++;
      }

      return {
        ...r,
        likeCount: Math.max(0, likeCount),
        dislikeCount: Math.max(0, dislikeCount),
        userReaction: isToggleOff ? null : reactionType,
      };
    }));

    try {
      await apiService.reactToReview(review.id, reactionType);
    } catch {
      // Revert on error
      setReviews(prev => prev.map(r =>
        r.id === review.id
          ? { ...r, likeCount: review.likeCount || 0, dislikeCount: review.dislikeCount || 0, userReaction: review.userReaction }
          : r
      ));
    }
  };

  const handleReport = async (reason: string) => {
    if (!reportingReviewId) return;
    try {
      await apiService.reportReview(reportingReviewId, reason);
      dispatch(addToast({ type: 'success', title: c('success'), message: s('reportSent') }));
      hapticFeedback.notificationSuccess();
    } catch {
      dispatch(addToast({ type: 'error', title: c('error'), message: '' }));
    }
    setShowReportSheet(false);
    setReportingReviewId(null);
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'text-accent-yellow fill-yellow-500' : 'text-text-muted'}
        />
      ))}
    </div>
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Stats */}
        {reviews.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center py-3">
                <div className="text-xl font-bold text-text-primary">{reviews.length}</div>
                <div className="text-xs text-text-secondary">{s('total')}</div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-xl font-bold text-text-primary">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="text-xs text-text-secondary">{s('avgRating')}</div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-xl font-bold text-text-primary">
                  {reviews.filter(r => r.response).length}
                </div>
                <div className="text-xs text-text-secondary">{s('responses')}</div>
              </Card>
            </div>
          </div>
        )}

        {/* Rating Filter + Sort */}
        {reviews.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-1.5 min-w-max">
                  {RATING_FILTERS.map(r => (
                    <button
                      key={r}
                      onClick={() => { setRatingFilter(r); hapticFeedback.selectionChanged(); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                        ratingFilter === r
                          ? 'bg-accent-primary text-white'
                          : 'bg-bg-secondary text-text-secondary'
                      }`}
                    >
                      {r === 0 ? s('allRatings') : `${r}★`}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setShowSortSheet(true); hapticFeedback.impactLight(); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-secondary text-text-secondary text-xs font-medium flex-shrink-0"
              >
                <SlidersHorizontal size={12} />
                {s('sortBy')}
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="px-4 py-1 space-y-3">
          {filteredReviews.length === 0 && reviews.length === 0 ? (
            <Card className="text-center py-12">
              <Star size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{s('noReviews')}</p>
              <p className="text-text-secondary text-sm mt-1">{s('leaveReview')}</p>
              <Button size="sm" onClick={() => navigate('/bookings')} className="mt-4">
                {s('viewBookings')}
              </Button>
            </Card>
          ) : filteredReviews.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-text-secondary text-sm">{c('noResults')}</p>
            </Card>
          ) : (
            <>
              {filteredReviews.map(review => (
                <Card key={review.id}>
                  {/* Specialist Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                      {review.booking.specialist.user.avatar ? (
                        <img src={review.booking.specialist.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={18} className="text-text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary truncate">
                        {review.booking.specialist.businessName ||
                          `${review.booking.specialist.user.firstName} ${review.booking.specialist.user.lastName}`}
                      </h3>
                      <p className="text-xs text-text-secondary truncate">{review.booking.service.name}</p>
                    </div>
                    {review.isVerified && (
                      <span className="px-2 py-0.5 bg-accent-green/15 text-accent-green text-xs rounded-full">
                        {c('verified')}
                      </span>
                    )}
                  </div>

                  {/* Rating & Comment */}
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-xs text-text-secondary">{formatDate(review.createdAt)}</span>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-text-primary mb-3">{review.comment}</p>
                  )}

                  {/* Specialist Response */}
                  {review.response && (
                    <div className="bg-bg-secondary rounded-xl p-3 mt-2 mb-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageCircle size={12} className="text-accent-primary" />
                        <span className="text-xs font-medium text-accent-primary">
                          {s('specialistResponse')}
                        </span>
                      </div>
                      <p className="text-xs text-text-primary">{review.response.response}</p>
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleReaction(review, 'LIKE')}
                      className={`flex items-center gap-1.5 text-xs ${
                        review.userReaction === 'LIKE' ? 'text-accent-primary' : 'text-text-secondary'
                      }`}
                    >
                      <ThumbsUp size={14} className={review.userReaction === 'LIKE' ? 'fill-accent-primary' : ''} />
                      <span>{review.likeCount || 0}</span>
                    </button>
                    <button
                      onClick={() => handleReaction(review, 'DISLIKE')}
                      className={`flex items-center gap-1.5 text-xs ${
                        review.userReaction === 'DISLIKE' ? 'text-accent-red' : 'text-text-secondary'
                      }`}
                    >
                      <ThumbsDown size={14} className={review.userReaction === 'DISLIKE' ? 'fill-accent-red' : ''} />
                      <span>{review.dislikeCount || 0}</span>
                    </button>
                    <button
                      onClick={() => {
                        setReportingReviewId(review.id);
                        setShowReportSheet(true);
                        hapticFeedback.impactLight();
                      }}
                      className="flex items-center gap-1.5 text-xs text-text-muted ml-auto"
                    >
                      <Flag size={12} />
                    </button>
                  </div>
                </Card>
              ))}

              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={() => { const n = page + 1; setPage(n); fetchReviews(n, true); }}
                  className="w-full"
                >
                  {c('loadMore')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sort Sheet */}
      <Sheet isOpen={showSortSheet} onClose={() => setShowSortSheet(false)} title={s('sortBy')}>
        <div className="space-y-2">
          {SORT_OPTIONS.map(option => (
            <button
              key={option}
              onClick={() => {
                setSortBy(option);
                setShowSortSheet(false);
                hapticFeedback.selectionChanged();
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                sortBy === option
                  ? 'bg-accent-primary/10 text-accent-primary font-medium'
                  : 'bg-bg-secondary text-text-primary hover:bg-bg-hover'
              }`}
            >
              {s(option)}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Report Sheet */}
      <Sheet isOpen={showReportSheet} onClose={() => { setShowReportSheet(false); setReportingReviewId(null); }} title={s('report')}>
        <div className="space-y-2">
          {(['inappropriate', 'spam', 'fake', 'other'] as const).map(reason => (
            <button
              key={reason}
              onClick={() => handleReport(reason.toUpperCase())}
              className="w-full text-left px-4 py-3 rounded-xl bg-bg-secondary text-text-primary hover:bg-bg-hover transition-colors"
            >
              {s(reason)}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
};
