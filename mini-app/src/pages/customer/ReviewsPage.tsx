import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  MessageCircle,
  Calendar,
  User,
  ThumbsUp,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useAppSelector } from '@/hooks/redux';
import apiService from '@/services/api.service';

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
  createdAt: string;
}

export const ReviewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegram();
  const { user } = useAppSelector(state => state.auth);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number, append = false) => {
    try {
      if (!append) setLoading(true);
      const data = await apiService.getReviews({ page: pageNum, limit: 10 }) as any;
      const items = data.items || data || [];
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

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
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
    <div className="flex flex-col min-h-screen bg-primary">
      <Header title="My Reviews" />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Stats */}
        {reviews.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="grid grid-cols-3 gap-3">
              <Card className="text-center py-3">
                <div className="text-xl font-bold text-primary">{reviews.length}</div>
                <div className="text-xs text-secondary">Total</div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-xl font-bold text-primary">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="text-xs text-secondary">Avg Rating</div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-xl font-bold text-primary">
                  {reviews.filter(r => r.response).length}
                </div>
                <div className="text-xs text-secondary">Responses</div>
              </Card>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="px-4 py-3 space-y-3">
          {reviews.length === 0 ? (
            <Card className="text-center py-12">
              <Star size={40} className="text-secondary mx-auto mb-3" />
              <p className="text-primary font-medium">No reviews yet</p>
              <p className="text-secondary text-sm mt-1">
                After completing a booking, you can leave a review
              </p>
              <Button size="sm" onClick={() => navigate('/bookings')} className="mt-4">
                View Bookings
              </Button>
            </Card>
          ) : (
            <>
              {reviews.map(review => (
                <Card key={review.id}>
                  {/* Specialist Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                      {review.booking.specialist.user.avatar ? (
                        <img src={review.booking.specialist.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={18} className="text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-primary truncate">
                        {review.booking.specialist.businessName ||
                          `${review.booking.specialist.user.firstName} ${review.booking.specialist.user.lastName}`}
                      </h3>
                      <p className="text-xs text-secondary truncate">{review.booking.service.name}</p>
                    </div>
                    {review.isVerified && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Verified</span>
                    )}
                  </div>

                  {/* Rating & Comment */}
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-xs text-secondary">{formatDate(review.createdAt)}</span>
                  </div>

                  {review.comment && (
                    <p className="text-sm text-primary mb-3">{review.comment}</p>
                  )}

                  {/* Specialist Response */}
                  {review.response && (
                    <div className="bg-secondary rounded-xl p-3 mt-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageCircle size={12} className="text-accent" />
                        <span className="text-xs font-medium text-accent">Specialist Response</span>
                      </div>
                      <p className="text-xs text-primary">{review.response.response}</p>
                    </div>
                  )}
                </Card>
              ))}

              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={() => { const n = page + 1; setPage(n); fetchReviews(n, true); }}
                  className="w-full"
                >
                  Load More
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
