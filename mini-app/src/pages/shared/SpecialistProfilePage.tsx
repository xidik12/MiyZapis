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
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { specialistProfileStrings, commonStrings } from '@/utils/translations';

export const SpecialistProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, user, isAuthenticated } = useTelegram();
  const locale = useLocale();

  const { selectedSpecialist } = useSelector((state: RootState) => state.specialists);
  const { reviews, isLoading: reviewsLoading } = useSelector(
    (state: RootState) => state.reviews
  );

  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'portfolio' | 'reviews'>('about');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showPortfolioItem, setShowPortfolioItem] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Prevent specialists from booking their own services
  const userRole = (user?.role || (user as any)?.userType || '').toLowerCase();
  const isOwnProfile = Boolean(
    isAuthenticated &&
    user?.id &&
    userRole === 'specialist' &&
    selectedSpecialist &&
    ((selectedSpecialist as any)?.userId === user.id || (selectedSpecialist as any)?.user?.id === user.id)
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchSpecialistAsync(id));
      dispatch(fetchSpecialistServicesAsync(id));
      dispatch(fetchReviewsAsync({ specialistId: id, limit: 10 }));
    }
  }, [id, dispatch]);

  if (!selectedSpecialist) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
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
        text: t(specialistProfileStrings, 'shareText', locale),
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
          ? 'border-accent-primary text-accent-primary'
          : 'border-transparent text-text-secondary'
      }`}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

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

      <div className="flex-1 overflow-y-auto pb-36 page-stagger">
        {/* Profile Header */}
        <div className="px-4 py-6 bg-gradient-to-b from-accent-primary to-accent-primary/80 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
              {selectedSpecialist.avatar ? (
                <img
                  src={selectedSpecialist.avatar}
                  alt={selectedSpecialist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={32} className="text-white/60" />
              )}
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
                  ({selectedSpecialist.reviewCount} {t(commonStrings, 'reviews', locale)})
                </span>
              </div>
              {selectedSpecialist.location && (
                <div className="flex items-center gap-1 opacity-80">
                  <MapPin size={14} />
                  <span className="text-sm">
                    {selectedSpecialist.location.city}{selectedSpecialist.location.state ? `, ${selectedSpecialist.location.state}` : ''}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <div className="w-3 h-3 rounded-full bg-green-400 mx-auto mb-1"></div>
              <span className="text-xs opacity-80">
                {selectedSpecialist.isOnline ? t(specialistProfileStrings, 'online', locale) : t(specialistProfileStrings, 'offline', locale)}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white border-opacity-20">
            <div className="text-center">
              <div className="text-lg font-bold">{selectedSpecialist.experience}</div>
              <div className="text-xs opacity-80">{t(specialistProfileStrings, 'yearsExperience', locale)}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{selectedSpecialist.services?.length || 0}</div>
              <div className="text-xs opacity-80">{t(specialistProfileStrings, 'services', locale)}</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{selectedSpecialist.reviewCount}</div>
              <div className="text-xs opacity-80">{t(specialistProfileStrings, 'reviews', locale)}</div>
            </div>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="px-4 py-4 bg-bg-secondary">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleContact('message')}
            >
              <MessageCircle size={16} className="mr-1" />
              {t(specialistProfileStrings, 'message', locale)}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleContact('phone')}
            >
              <Phone size={16} className="mr-1" />
              {t(specialistProfileStrings, 'call', locale)}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleContact('email')}
            >
              <Mail size={16} className="mr-1" />
              {t(specialistProfileStrings, 'email', locale)}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-bg-secondary border-b border-white/5 sticky top-0 z-10">
          <div className="flex">
            <TabButton
              tab="about"
              label={t(specialistProfileStrings, 'about', locale)}
              icon={<User size={16} />}
            />
            <TabButton
              tab="services"
              label={t(specialistProfileStrings, 'services', locale)}
              icon={<Calendar size={16} />}
            />
            <TabButton
              tab="portfolio"
              label={t(specialistProfileStrings, 'portfolio', locale)}
              icon={<Grid3X3 size={16} />}
            />
            <TabButton
              tab="reviews"
              label={t(specialistProfileStrings, 'reviews', locale)}
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
                <h3 className="font-semibold mb-2">{t(specialistProfileStrings, 'about', locale)}</h3>
                <p className="text-text-secondary leading-relaxed">
                  {selectedSpecialist.bio}
                </p>
              </Card>

              {/* Specialties */}
              {selectedSpecialist.specialties && selectedSpecialist.specialties.length > 0 && (
                <Card>
                  <h3 className="font-semibold mb-3">{t(specialistProfileStrings, 'specialties', locale)}</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpecialist.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-sm"
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
                  <h3 className="font-semibold mb-3">{t(specialistProfileStrings, 'certifications', locale)}</h3>
                  <div className="space-y-2">
                    {selectedSpecialist.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award size={16} className="text-accent-primary" />
                        <span className="text-text-secondary">{cert}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Location */}
              {selectedSpecialist.location && (
                <Card>
                  <h3 className="font-semibold mb-2">{t(specialistProfileStrings, 'location', locale)}</h3>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-text-secondary mt-1" />
                    <div className="text-text-secondary">
                      {selectedSpecialist.location.address && <p>{selectedSpecialist.location.address}</p>}
                      <p>
                        {selectedSpecialist.location.city}{selectedSpecialist.location.state ? `, ${selectedSpecialist.location.state}` : ''}{' '}
                        {selectedSpecialist.location.zipCode || ''}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-3">
              {selectedSpecialist.services?.map((service) => (
                <Card key={service.id} hover>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary mb-1">
                        {service.name}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-text-secondary">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {service.duration}min
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} />
                          {formatCurrency(service.price, undefined, locale)}
                        </div>
                      </div>
                    </div>
                    {isOwnProfile ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="opacity-50 cursor-not-allowed"
                        title={t(specialistProfileStrings, 'cannotBookOwn', locale)}
                      >
                        {t(specialistProfileStrings, 'book', locale)}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleBookService(service)}
                      >
                        {t(specialistProfileStrings, 'book', locale)}
                      </Button>
                    )}
                  </div>
                </Card>
              )) || (
                <p className="text-center text-text-secondary py-8">
                  {t(specialistProfileStrings, 'noServicesAvailable', locale)}
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
                      <div className="aspect-square bg-bg-hover">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-text-secondary py-8">
                  {t(specialistProfileStrings, 'noPortfolio', locale)}
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
                <p className="text-center text-text-secondary py-8">
                  {t(specialistProfileStrings, 'noReviewsYet', locale)}
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
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
                          <p className="text-xs text-text-secondary mb-2">
                            {review.service.name} • {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          {review.comment && (
                            <p className="text-text-secondary leading-relaxed">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}

                  {reviews.length >= 10 && (
                    <button
                      onClick={() => setShowAllReviews(true)}
                      className="w-full py-3 text-accent-primary text-center"
                    >
                      {t(specialistProfileStrings, 'viewAllReviews', locale)}
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
            <div className="aspect-video bg-bg-hover rounded-lg overflow-hidden mb-4">
              <img
                src={showPortfolioItem.image}
                alt={showPortfolioItem.title}
                className="w-full h-full object-cover"
              />
            </div>
            {showPortfolioItem.description && (
              <p className="text-text-secondary leading-relaxed">
                {showPortfolioItem.description}
              </p>
            )}
          </div>
        )}
      </Sheet>

      {/* Fixed Bottom Action — above bottom nav (h-14) */}
      <div className="fixed bottom-14 left-0 right-0 bg-bg-secondary border-t border-white/5 p-4 z-40">
        {isOwnProfile ? (
          <Button
            size="lg"
            className="w-full opacity-50 cursor-not-allowed"
            disabled
            variant="secondary"
          >
            <Calendar size={18} className="mr-2" />
            {t(specialistProfileStrings, 'cannotBookOwn', locale)}
          </Button>
        ) : (
          <Button
            onClick={() => {
              if (selectedSpecialist.services && selectedSpecialist.services.length === 1) {
                handleBookService(selectedSpecialist.services[0]);
              } else if (selectedSpecialist.services && selectedSpecialist.services.length > 1) {
                // Multiple services — switch to services tab so user can pick
                setActiveTab('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                hapticFeedback.impactLight();
              }
            }}
            size="lg"
            className="w-full"
            disabled={!selectedSpecialist.services || selectedSpecialist.services.length === 0}
          >
            <Calendar size={18} className="mr-2" />
            {selectedSpecialist.services && selectedSpecialist.services.length > 1
              ? t(specialistProfileStrings, 'services', locale)
              : t(specialistProfileStrings, 'bookAppointment', locale)}
          </Button>
        )}
      </div>
    </div>
  );
};
