import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  MessageCircle,
  User,
  Send,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { specialistReviewsStrings, commonStrings } from '@/utils/translations';

interface ReviewItem {
  id: string;
  rating: number;
  comment?: string;
  customer: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  response?: {
    response: string;
    createdAt: string;
  };
  createdAt: string;
}

interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  distribution: Record<number, number>; // star -> count
}

export const SpecialistReviewsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingReview, setRespondingReview] = useState<ReviewItem | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const s = (key: string) => t(specialistReviewsStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = (await apiService.getSpecialistReviews({ limit: 100 })) as any;
      const items = data?.items || data || [];
      setReviews(items);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Compute stats
  const stats: ReviewStats = React.useMemo(() => {
    const total = reviews.length;
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    let sum = 0;
    reviews.forEach((r) => {
      sum += r.rating;
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    return {
      avgRating: total > 0 ? Math.round((sum / total) * 10) / 10 : 0,
      totalReviews: total,
      distribution,
    };
  }, [reviews]);

  const handleOpenRespond = (review: ReviewItem) => {
    hapticFeedback.impactLight();
    setRespondingReview(review);
    setResponseText('');
  };

  const handleSubmitResponse = async () => {
    if (!respondingReview || !responseText.trim()) return;

    try {
      setSubmitting(true);
      await apiService.respondToReview(respondingReview.id, responseText.trim());
      hapticFeedback.notificationSuccess();
      dispatch(
        addToast({
          type: 'success',
          title: c('success'),
          message: s('responseAdded'),
        })
      );

      // Update review in local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === respondingReview.id
            ? {
                ...r,
                response: {
                  response: responseText.trim(),
                  createdAt: new Date().toISOString(),
                },
              }
            : r
        )
      );
      setRespondingReview(null);
      setResponseText('');
    } catch {
      hapticFeedback.notificationError();
      dispatch(
        addToast({
          type: 'error',
          title: c('error'),
          message: s('responseFailed'),
        })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, size = 14) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={
            star <= rating
              ? 'text-accent-yellow fill-accent-yellow'
              : 'text-text-muted'
          }
        />
      ))}
    </div>
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(
      locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US',
      { month: 'short', day: 'numeric', year: 'numeric' }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        <div className="px-4 pt-4 space-y-4">
          {/* Rating Overview Card */}
          {stats.totalReviews > 0 && (
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
              <div className="flex items-start gap-5">
                {/* Big Rating Number */}
                <div className="text-center flex-shrink-0">
                  <div className="text-4xl font-bold text-text-primary">
                    {stats.avgRating}
                  </div>
                  <div className="mt-1">{renderStars(Math.round(stats.avgRating), 16)}</div>
                  <div className="text-xs text-text-muted mt-1">
                    {stats.totalReviews} {s('totalReviews').toLowerCase()}
                  </div>
                </div>

                {/* Star Distribution Bars */}
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((starNum) => {
                    const count = stats.distribution[starNum] || 0;
                    const barWidth =
                      stats.totalReviews > 0
                        ? Math.max((count / stats.totalReviews) * 100, 0)
                        : 0;

                    return (
                      <div key={starNum} className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5 w-4">
                          <span className="text-xs text-text-muted font-medium">
                            {starNum}
                          </span>
                        </div>
                        <Star size={10} className="text-accent-yellow fill-accent-yellow flex-shrink-0" />
                        <div className="flex-1 bg-bg-secondary/50 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-accent-yellow rounded-full h-2 transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="text-xs text-text-muted w-6 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <Card className="text-center py-12">
              <Star size={48} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{s('noReviews')}</p>
              <p className="text-text-secondary text-sm mt-1">
                {s('noReviewsDesc')}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card"
                >
                  {/* Customer Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                      {review.customer.avatar ? (
                        <img
                          src={review.customer.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={18} className="text-text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-text-primary truncate">
                        {review.customer.firstName} {review.customer.lastName}
                      </h4>
                      <div className="text-xs text-text-muted">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-text-primary mb-3 leading-relaxed">
                      {review.comment}
                    </p>
                  )}

                  {/* Specialist Response */}
                  {review.response ? (
                    <div className="bg-bg-secondary/50 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MessageCircle
                          size={12}
                          className="text-accent-primary"
                        />
                        <span className="text-xs font-medium text-accent-primary">
                          {s('yourResponse')}
                        </span>
                      </div>
                      <p className="text-xs text-text-primary leading-relaxed">
                        {review.response.response}
                      </p>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-white/5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenRespond(review)}
                      >
                        <MessageCircle size={14} className="mr-1.5" />
                        {s('respond')}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Respond Sheet */}
      <Sheet
        isOpen={!!respondingReview}
        onClose={() => setRespondingReview(null)}
        title={s('respond')}
      >
        {respondingReview && (
          <div className="space-y-4">
            {/* Review Preview */}
            <div className="bg-bg-secondary/50 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-text-primary">
                  {respondingReview.customer.firstName}{' '}
                  {respondingReview.customer.lastName}
                </span>
                {renderStars(respondingReview.rating, 12)}
              </div>
              {respondingReview.comment && (
                <p className="text-xs text-text-secondary">
                  {respondingReview.comment}
                </p>
              )}
            </div>

            {/* Response Textarea */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                {s('yourResponse')}
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="input-telegram w-full rounded-xl text-sm resize-none"
                placeholder={s('responsePlaceholder')}
                autoFocus
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setRespondingReview(null)}
                className="flex-1"
              >
                {c('cancel')}
              </Button>
              <Button
                onClick={handleSubmitResponse}
                className="flex-1"
                disabled={submitting || !responseText.trim()}
                loading={submitting}
              >
                <Send size={16} className="mr-1.5" />
                {s('submitResponse')}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
};
