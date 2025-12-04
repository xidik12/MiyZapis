import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { AppDispatch } from '../store';
import { fetchBookings } from '../store/slices/bookingSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { reviewsService } from '../services/reviews.service';
import { validateReviewTags } from '../constants/reviewTags';
import { Booking } from '../types';

export const useReviewOperations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLanguage();
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);

  const handleLeaveReview = useCallback((bookingId: string, bookings: Booking[]) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setBookingToReview(booking);
      setShowReviewModal(true);
    }
  }, []);

  const handleSubmitReview = useCallback(async (reviewData: {
    rating: number;
    comment: string;
    tags: string[];
  }) => {
    if (!bookingToReview) return;

    setReviewLoading(true);
    try {
      const validTags = validateReviewTags(reviewData.tags);

      const createData = {
        bookingId: bookingToReview.id,
        rating: reviewData.rating,
        comment: reviewData.comment || undefined,
        tags: validTags.length > 0 ? validTags : undefined,
        isPublic: true,
        wouldRecommend: reviewData.rating >= 4
      };

      await reviewsService.createReview(createData);

      setShowReviewModal(false);
      setBookingToReview(null);

      dispatch(fetchBookings({ filters: {}, userType: 'customer' }));

      toast.success(t('reviews.reviewSubmitted'));
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(t('reviews.submitError'));
    } finally {
      setReviewLoading(false);
    }
  }, [bookingToReview, dispatch, t]);

  const closeReviewModal = useCallback(() => {
    setShowReviewModal(false);
    setBookingToReview(null);
  }, []);

  return {
    reviewLoading,
    showReviewModal,
    bookingToReview,
    handleLeaveReview,
    handleSubmitReview,
    closeReviewModal
  };
};