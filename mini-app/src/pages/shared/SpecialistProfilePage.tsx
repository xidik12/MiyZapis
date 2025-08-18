import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Star,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronRight,
  Heart,
  Share,
  Grid3X3,
  User,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Sheet } from '@/components/ui/Sheet';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import {
  fetchSpecialistAsync,
  fetchSpecialistServicesAsync,
} from '@/store/slices/specialistsSlice';
import { fetchReviewsAsync } from '@/store/slices/reviewsSlice';

export const SpecialistProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, user, isAuthenticated } = useTelegram();

  // Simple language detection based on browser/user language
  const getLanguage = () => {
    if (user?.language_code) {
      if (user.language_code.startsWith('uk')) return 'uk';
      if (user.language_code.startsWith('ru')) return 'ru';
    }
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('uk')) return 'uk';
    if (browserLang.startsWith('ru')) return 'ru';
    return 'en';
  };

  const language = getLanguage();
  
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'portfolio.noItems': {
        en: 'No portfolio items available',
        uk: 'Немає елементів портфоліо',
        ru: 'Нет элементов портфолио'
      }
    };
    return translations[key]?.[language] || key;
  };

  const { selectedSpecialist } = useSelector((state: RootState) => state.specialists);
  const { reviews, isLoading: reviewsLoading } = useSelector(
    (state: RootState) => state.reviews
  );

  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'portfolio' | 'reviews'>('about');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showPortfolioItem, setShowPortfolioItem] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchSpecialistAsync(id));
      dispatch(fetchSpecialistServicesAsync(id));
      dispatch(fetchReviewsAsync({ specialistId: id, limit: 10 }));
    }
  }, [id, dispatch]);

  if (!selectedSpecialist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const handleContact = (method: 'phone' | 'email' | 'message') => {
    hapticFeedback.impactLight();
    
    switch (method) {
      case 'phone':
        if (selectedSpecialist.phone) {
          window.open(`tel:${selectedSpecialist.phone}`);
        }
        break;
      case 'email':
        if (selectedSpecialist.email) {
          window.open(`mailto:${selectedSpecialist.email}`);
        }
        break;
      case 'message':
        // Open chat with specialist (integrate with Telegram)
        break;
    }
  };

  const handleBookService = (service: any) => {
    if (!isAuthenticated) {
      navigate('/auth');
    } else {
      navigate('/booking', {
        state: {
          serviceId: service.id,
          specialistId: selectedSpecialist.id,
        },
      });
    }
    hapticFeedback.impactMedium();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedSpecialist.name,
        text: `Check out ${selectedSpecialist.name}'s profile`,
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

  const TabButton: React.FC<{
    tab: typeof activeTab;
    label: string;
    icon: React.ReactNode;
  }> = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-1 py-3 px-2 border-b-2 transition-colors ${
        activeTab === tab
          ? 'border-accent text-accent'
          : 'border-transparent text-secondary'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

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
        {/* Profile Header */}
        <div className="px-4 py-6 bg-gradient-to-b from-accent to-accent-dark text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white bg-opacity-20">
              <img
                src={selectedSpecialist.avatar || '/api/placeholder/80/80'}
                alt={selectedSpecialist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold">{selectedSpecialist.name}</h1>
                {selectedSpecialist.isVerified && (
                  <CheckCircle size={18} className="text-green-300" />
                )}
              </div>
              <div className="flex items-center gap-1 mb-2">
                <Star size={16} className="text-yellow-300 fill-current" />
                <span className="font-semibold">{selectedSpecialist.rating}</span>
                <span className="opacity-80">
                  ({selectedSpecialist.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-80">
                <MapPin size={14} />
                <span className="text-sm">
                  {selectedSpecialist.location.city}, {selectedSpecialist.location.state}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mx-auto mb-1"></div>
              <span className="text-xs opacity-80">
                {selectedSpecialist.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white border-opacity-20">
            <div className="text-center">
              <div className="text-lg font-bold">{selectedSpecialist.experience}</div>
              <div className="text-xs opacity-80">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{selectedSpecialist.services?.length || 0}</div>
              <div className="text-xs opacity-80">Services</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{selectedSpecialist.reviewCount}</div>
              <div className="text-xs opacity-80">Reviews</div>
            </div>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="px-4 py-4 bg-header">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleContact('message')}
            >
              <MessageCircle size={16} className="mr-1" />
              Message
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleContact('phone')}
            >
              <Phone size={16} className="mr-1" />
              Call
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleContact('email')}
            >
              <Mail size={16} className="mr-1" />
              Email
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-header border-b border-gray-200 sticky top-0 z-10">
          <div className="flex">
            <TabButton
              tab="about"
              label="About"
              icon={<User size={16} />}
            />
            <TabButton
              tab="services"
              label="Services"
              icon={<Calendar size={16} />}
            />
            <TabButton
              tab="portfolio"
              label="Portfolio"
              icon={<Grid3X3 size={16} />}
            />
            <TabButton
              tab="reviews"
              label="Reviews"
              icon={<Star size={16} />}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 py-4">
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Bio */}
              <Card>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-secondary leading-relaxed">
                  {selectedSpecialist.bio}
                </p>
              </Card>

              {/* Specialties */}
              {selectedSpecialist.specialties && selectedSpecialist.specialties.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecialist.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-accent bg-opacity-10 text-accent rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {/* Certifications */}
              {selectedSpecialist.certifications && selectedSpecialist.certifications.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3">Certifications</h3>
                  <div className="space-y-2">
                    {selectedSpecialist.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award size={16} className="text-accent" />
                        <span className="text-secondary">{cert}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Location */}
              <Card>
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-secondary mt-1" />
                  <div className="text-secondary">
                    <p>{selectedSpecialist.location.address}</p>
                    <p>
                      {selectedSpecialist.location.city}, {selectedSpecialist.location.state}{' '}
                      {selectedSpecialist.location.zipCode}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3">
              {selectedSpecialist.services?.map((service) => (
                <Card key={service.id} hover>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary mb-1">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-secondary">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {service.duration}min
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} />
                          ${service.price}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleBookService(service)}
                    >
                      Book
                    </Button>
                  </div>
                </Card>
              )) || (
                <p className="text-center text-secondary py-8">
                  No services available
                </p>
              )}
            </div>
          )}

          {activeTab === 'portfolio' && (
            <div>
              {selectedSpecialist.portfolio && selectedSpecialist.portfolio.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {selectedSpecialist.portfolio.map((item) => (
                    <Card
                      key={item.id}
                      hover
                      onClick={() => setShowPortfolioItem(item)}
                      className="p-0 overflow-hidden"
                    >
                      <div className="aspect-square bg-gray-200">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-secondary mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-secondary py-8">
                  {t('portfolio.noItems')}
                </p>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              {reviewsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-center text-secondary py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
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
                          <p className="text-xs text-secondary mb-2">
                            {review.service.name} • {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          {review.comment && (
                            <p className="text-secondary leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {reviews.length >= 10 && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="w-full py-3 text-accent text-center"
                    >
                      View all reviews
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Item Modal */}
      <Sheet
        isOpen={!!showPortfolioItem}
        onClose={() => setShowPortfolioItem(null)}
        title={showPortfolioItem?.title || ''}
      >
        {showPortfolioItem && (
          <div>
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-4">
              <img
                src={showPortfolioItem.image}
                alt={showPortfolioItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            {showPortfolioItem.description && (
              <p className="text-secondary leading-relaxed">
                {showPortfolioItem.description}
              </p>
            )}
          </div>
        )}
      </Sheet>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-header border-t border-gray-200 p-4">
        <Button
          onClick={() => {
            if (selectedSpecialist.services && selectedSpecialist.services.length > 0) {
              handleBookService(selectedSpecialist.services[0]);
            }
          }}
          size="lg"
          className="w-full"
          disabled={!selectedSpecialist.services || selectedSpecialist.services.length === 0}
        >
          <Calendar size={18} className="mr-2" />
          Book an Appointment
        </Button>
      </div>
    </div>
  );
};