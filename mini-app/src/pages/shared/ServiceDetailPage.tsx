import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star,
  Clock,
  MapPin,
  Heart,
  Share,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Mail,
  Award,
  CheckCircle,
  User,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Sheet } from '@/components/ui/Sheet';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchServiceAsync } from '@/store/slices/servicesSlice';
import { fetchReviewsAsync } from '@/store/slices/reviewsSlice';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { serviceDetailStrings, commonStrings } from '@/utils/translations';
import { getCategoryInfo } from '@/utils/categories';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback, user, isAuthenticated } = useTelegram();

  const { selectedService } = useSelector((state: RootState) => state.services);
  const { reviews, isLoading: reviewsLoading } = useSelector(
    (state: RootState) => state.reviews
  );
  const { isAuthenticated: authState } = useSelector(
    (state: RootState) => state.auth
  );

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchServiceAsync(id));
      dispatch(fetchReviewsAsync({ serviceId: id, limit: 5 }));
    }
  }, [id, dispatch]);

  const s = (key: string) => t(serviceDetailStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  if (!selectedService) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <LoadingSpinner />
      </div>
    );
  }

  const specialistName = selectedService.specialist?.name || '';
  const specialistRating = selectedService.specialist?.rating || 0;
  const specialistReviewCount = selectedService.specialist?.reviewCount || 0;

  const handleBookNow = () => {
    if (!isAuthenticated && !authState) {
      navigate('/auth');
    } else {
      navigate('/booking', {
        state: {
          serviceId: selectedService.id,
          specialistId: selectedService.specialistId,
        },
      });
    }
    hapticFeedback.impactMedium();
  };

  const handleContact = (method: 'phone' | 'email' | 'message') => {
    hapticFeedback.impactLight();

    switch (method) {
      case 'phone':
        if (selectedService.specialist?.phone) {
          window.open(`tel:${selectedService.specialist.phone}`);
        }
        break;
      case 'email':
        if (selectedService.specialist?.email) {
          window.open(`mailto:${selectedService.specialist.email}`);
        }
        break;
      case 'message':
        // Open chat with specialist (integrate with Telegram)
        break;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedService.name,
        text: `Check out this service: ${selectedService.name}`,
        url: window.location.href,
      });
    }
    hapticFeedback.selectionChanged();
  };

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    hapticFeedback.impactLight();
    // TODO: Implement favorite functionality
  };

  const images = selectedService.images || [];

  const nextImage = () => {
    setCurrentImageIndex(
      (prev) => (prev + 1) % (images.length || 1)
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + (images.length || 1)) % (images.length || 1)
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        showBackButton
        rightContent={
          <div className="flex gap-2">
            <button
              onClick={handleFavoriteToggle}
              className="p-2 touch-manipulation"
            >
              <Heart
                size={20}
                className={`${
                  isFavorite ? 'text-accent-red fill-current' : 'text-text-secondary'
                }`}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2 touch-manipulation"
            >
              <Share size={20} className="text-text-secondary" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Image Gallery */}
        <div className="relative h-64 bg-bg-hover">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={selectedService.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex
                            ? 'bg-white'
                            : 'bg-white bg-opacity-50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : selectedService.specialist?.avatar ? (
            <img
              src={selectedService.specialist.avatar}
              alt={specialistName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${getCategoryInfo(selectedService.category).color}33, ${getCategoryInfo(selectedService.category).color}11)` }}
            >
              <span className="text-4xl font-bold text-white/80">
                {(specialistName || '?')[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Service Info */}
        <div className="px-4 py-4">
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-text-primary">
                  {selectedService.name}
                </h1>
                <p className="text-sm text-text-secondary">
                  {selectedService.category}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-accent-primary">
                  {formatCurrency(selectedService.price, undefined, locale)}
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary">
                  <Clock size={14} />
                  {selectedService.duration}{c('min')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-accent-yellow fill-current" />
                <span className="font-medium">
                  {specialistRating}
                </span>
                <span className="text-text-secondary">
                  ({specialistReviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card className="mb-4">
            <h3 className="font-semibold mb-2">{s('description')}</h3>
            <p className="text-text-secondary leading-relaxed">
              {showFullDescription
                ? (selectedService.description || '')
                : `${(selectedService.description || '').slice(0, 150)}${
                    (selectedService.description || '').length > 150 ? '...' : ''
                  }`}
            </p>
            {(selectedService.description || '').length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-accent-primary mt-2 text-sm"
              >
                {showFullDescription ? s('showLess') : s('readMore')}
              </button>
            )}
          </Card>

          {/* Tags */}
          {selectedService.tags && selectedService.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedService.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-bg-secondary rounded-full text-sm text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Specialist Info */}
          <Card className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-hover flex items-center justify-center">
                {selectedService.specialist?.avatar ? (
                  <img
                    src={selectedService.specialist.avatar}
                    alt={specialistName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={28} className="text-text-muted" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{specialistName}</h3>
                <div className="flex items-center gap-1 mb-1">
                  <Star size={14} className="text-accent-yellow fill-current" />
                  <span className="text-sm font-medium">
                    {specialistRating}
                  </span>
                  <span className="text-sm text-text-secondary">
                    ({specialistReviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-accent-green" />
                  <span className="text-sm text-text-secondary">{s('verifiedSpecialist')}</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/specialist/${selectedService.specialistId}`)}
                className="text-accent-primary text-sm"
              >
                {s('viewProfile')}
              </button>
            </div>

            {/* Contact Options */}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleContact('message')}
                className="flex-1"
              >
                <MessageCircle size={16} className="mr-1" />
                {s('message')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleContact('phone')}
                className="flex-1"
              >
                <Phone size={16} className="mr-1" />
                {s('call')}
              </Button>
            </div>
          </Card>

          {/* Reviews Section */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{s('reviews')}</h3>
              <button
                onClick={() => setShowAllReviews(true)}
                className="text-accent-primary text-sm"
              >
                {c('viewAll')}
              </button>
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-text-secondary text-sm">{s('noReviews')}</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b border-white/5 pb-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-bg-hover overflow-hidden flex items-center justify-center">
                        {review.customer.avatar ? (
                          <img
                            src={review.customer.avatar}
                            alt={`${review.customer.firstName} ${review.customer.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={14} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {review.customer.firstName} {review.customer.lastName}
                          </span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={12}
                                className={
                                  i < review.rating
                                    ? 'text-accent-yellow fill-current'
                                    : 'text-text-muted'
                                }
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-text-secondary">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Action — above BottomNavigation (h-14) */}
      <div className="fixed bottom-14 left-0 right-0 bg-bg-secondary border-t border-white/5 p-4 z-40">
        <Button onClick={handleBookNow} size="lg" className="w-full">
          <Calendar size={18} className="mr-2" />
          {s('bookNow')} - {formatCurrency(selectedService.price, undefined, locale)}
        </Button>
      </div>

      {/* All Reviews Sheet */}
      <Sheet
        isOpen={showAllReviews}
        onClose={() => setShowAllReviews(false)}
        title={s('allReviews')}
      >
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-white/5 pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-bg-hover overflow-hidden flex items-center justify-center">
                  {review.customer.avatar ? (
                    <img
                      src={review.customer.avatar}
                      alt={`${review.customer.firstName} ${review.customer.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {review.customer.firstName} {review.customer.lastName}
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < review.rating
                              ? 'text-accent-yellow fill-current'
                              : 'text-text-muted'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  {review.comment && (
                    <p className="text-text-secondary leading-relaxed">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Sheet>
    </div>
  );
};
