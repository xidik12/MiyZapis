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

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
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

  if (!selectedService) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

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
        if (selectedService.specialist.phone) {
          window.open(`tel:${selectedService.specialist.phone}`);
        }
        break;
      case 'email':
        if (selectedService.specialist.email) {
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

  const nextImage = () => {
    setCurrentImageIndex(
      (prev) => (prev + 1) % selectedService.images.length
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + selectedService.images.length) % selectedService.images.length
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-primary">
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
                  isFavorite ? 'text-red-500 fill-current' : 'text-secondary'
                }`}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2 touch-manipulation"
            >
              <Share size={20} className="text-secondary" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Image Gallery */}
        <div className="relative h-64 bg-gray-200">
          {selectedService.images.length > 0 ? (
            <>
              <img
                src={selectedService.images[currentImageIndex]}
                alt={selectedService.name}
                className="w-full h-full object-cover"
              />
              {selectedService.images.length > 1 && (
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
                    {selectedService.images.map((_, index) => (
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
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-secondary">No image available</span>
            </div>
          )}
        </div>

        {/* Service Info */}
        <div className="px-4 py-4">
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-primary">
                  {selectedService.name}
                </h1>
                <p className="text-sm text-secondary">
                  {selectedService.category}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-accent">
                  ${selectedService.price}
                </div>
                <div className="flex items-center gap-1 text-sm text-secondary">
                  <Clock size={14} />
                  {selectedService.duration}min
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-400 fill-current" />
                <span className="font-medium">
                  {selectedService.specialist.rating}
                </span>
                <span className="text-secondary">
                  ({selectedService.specialist.reviewCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <Card className="mb-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-secondary leading-relaxed">
              {showFullDescription
                ? selectedService.description
                : `${selectedService.description.slice(0, 150)}${
                    selectedService.description.length > 150 ? '...' : ''
                  }`}
            </p>
            {selectedService.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-accent mt-2 text-sm"
              >
                {showFullDescription ? 'Show less' : 'Read more'}
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
                    className="px-3 py-1 bg-secondary bg-opacity-10 rounded-full text-sm text-secondary"
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
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={selectedService.specialist.avatar || '/api/placeholder/64/64'}
                  alt={selectedService.specialist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{selectedService.specialist.name}</h3>
                <div className="flex items-center gap-1 mb-1">
                  <Star size={14} className="text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">
                    {selectedService.specialist.rating}
                  </span>
                  <span className="text-sm text-secondary">
                    ({selectedService.specialist.reviewCount} reviews)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-500" />
                  <span className="text-sm text-secondary">Verified specialist</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/specialist/${selectedService.specialistId}`)}
                className="text-accent text-sm"
              >
                View Profile
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
                Message
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleContact('phone')}
                className="flex-1"
              >
                <Phone size={16} className="mr-1" />
                Call
              </Button>
            </div>
          </Card>

          {/* Reviews Section */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Reviews</h3>
              <button
                onClick={() => setShowAllReviews(true)}
                className="text-accent text-sm"
              >
                View all
              </button>
            </div>

            {reviewsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-secondary text-sm">No reviews yet</p>
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        <img
                          src={review.customer.avatar || '/api/placeholder/32/32'}
                          alt={`${review.customer.firstName} ${review.customer.lastName}`}
                          className="w-full h-full object-cover"
                        />
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
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-secondary">{review.comment}</p>
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

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-header border-t border-gray-200 p-4">
        <Button onClick={handleBookNow} size="lg" className="w-full">
          <Calendar size={18} className="mr-2" />
          Book Now - ${selectedService.price}
        </Button>
      </div>

      {/* All Reviews Sheet */}
      <Sheet
        isOpen={showAllReviews}
        onClose={() => setShowAllReviews(false)}
        title="All Reviews"
      >
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                  <img
                    src={review.customer.avatar || '/api/placeholder/40/40'}
                    alt={`${review.customer.firstName} ${review.customer.lastName}`}
                    className="w-full h-full object-cover"
                  />
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
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-secondary mb-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  {review.comment && (
                    <p className="text-secondary leading-relaxed">{review.comment}</p>
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