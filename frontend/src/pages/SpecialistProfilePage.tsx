import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { specialistService, reviewService } from '../services';
import { profileViewService } from '../services/profileView.service';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { 
  selectIsSpecialistFavorited, 
  addSpecialistToFavorites, 
  removeSpecialistFromFavorites,
  checkSpecialistFavoriteStatus,
  optimisticAddSpecialist,
  optimisticRemoveSpecialist
} from '../store/slices/favoritesSlice';
import { selectUser } from '../store/slices/authSlice';
import { StarIcon, MapPinIcon, ClockIcon, SealCheckIcon as CheckBadgeIcon, CalendarIcon, ChatBubbleLeftRightIcon, HeartIcon, ShareIcon, PlayIcon } from '@/components/icons';
;
import { Avatar, PageLoader } from '../components/ui';
import { translateProfession } from '@/utils/profession';
import { getAbsoluteImageUrl } from '../utils/imageUrl';
// Note: Use active prop for filled icons: <Icon active />

const SpecialistProfilePage: React.FC = () => {
  const { specialistId } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isFavorite = useAppSelector(selectIsSpecialistFavorited(specialistId || ''));
  
  const [specialist, setSpecialist] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; images: string[]; index: number }>({ open: false, images: [], index: 0 });

  // Helper function to get localized description with fallbacks
  const getLocalizedDescription = (specialist: any) => {
    if (!specialist) return null;
    
    // Try to get description based on current language
    if (language === 'uk' && specialist.bioUk) return specialist.bioUk;
    if (language === 'ru' && specialist.bioRu) return specialist.bioRu;
    if (specialist.bio) return specialist.bio;
    
    // Fallback order: bio -> bioUk -> bioRu
    return specialist.bio || specialist.bioUk || specialist.bioRu || null;
  };

  // Helper function to format location from specialist data
  const getFormattedLocation = (specialist: any) => {
    if (!specialist) return null;
    
    const parts = [];
    if (specialist.city) parts.push(specialist.city);
    if (specialist.state && specialist.state !== specialist.city) parts.push(specialist.state);
    if (specialist.country && specialist.country !== specialist.city && specialist.country !== specialist.state) {
      parts.push(specialist.country);
    }
    
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getBankDetails = (specialist: any) => {
    if (!specialist?.bankDetails) return null;
    if (typeof specialist.bankDetails === 'string') {
      try {
        return JSON.parse(specialist.bankDetails);
      } catch {
        return null;
      }
    }
    return specialist.bankDetails;
  };

  // Helper function to format experience
  const formatExperience = (experience: number) => {
    if (!experience || experience === 0) return t('specialist.notSpecified');
    
    if (language === 'uk') {
      if (experience === 1) return '1 рік';
      if (experience < 5) return `${experience} роки`;
      return `${experience} років`;
    } else if (language === 'ru') {
      if (experience === 1) return '1 год';
      if (experience < 5) return `${experience} года`;
      return `${experience} лет`;
    } else {
      return experience === 1 ? '1 year' : `${experience} years`;
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async () => {
    if (!user || !specialistId || favoriteLoading) return;
    
    setFavoriteLoading(true);
    
    try {
      if (isFavorite) {
        // Optimistic update
        dispatch(optimisticRemoveSpecialist(specialistId));
        // Make API call
        await dispatch(removeSpecialistFromFavorites(specialistId)).unwrap();
      } else {
        // Optimistic update
        dispatch(optimisticAddSpecialist(specialistId));
        // Make API call
        await dispatch(addSpecialistToFavorites(specialistId)).unwrap();
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        console.log('🚫 Conflict error - likely trying to favorite own profile or already favorited');
        // Show user-friendly message
        toast.info(t('specialist.favorites.conflict') || 'You cannot favorite your own profile or this specialist is already in your favorites.');
      } else if (error.response?.status === 401) {
        console.log('🔒 Authentication required');
        toast.info(t('specialist.favorites.loginRequired') || 'Please log in to add favorites.');
      } else {
        console.log('❌ Generic favorites error:', error.message);
        toast.error(t('specialist.favorites.updateError') || 'Failed to update favorites. Please try again.');
      }
      
      // The Redux slice will automatically revert optimistic updates on error
    } finally {
      setFavoriteLoading(false);
    }
  };

  useEffect(() => {
    const fetchSpecialistData = async () => {
      if (!specialistId) return;

      try {
        setLoading(true);
        
        // Fetch specialist profile
        const specialistData = await specialistService.getPublicProfile(specialistId);
        console.log('🔍 Specialist data received:', specialistData);
        console.log('🏢 Bio fields:', { 
          bio: specialistData.bio, 
          bioUk: specialistData.bioUk, 
          bioRu: specialistData.bioRu 
        });
        console.log('📍 Location fields:', { 
          city: specialistData.city, 
          state: specialistData.state, 
          country: specialistData.country, 
          address: specialistData.address 
        });
        console.log('📷 Portfolio images:', specialistData.portfolioImages);
        console.log('🏷️ Specialties:', specialistData.specialties);
        console.log('👤 User data:', specialistData.user);
        console.log('🖼️ Avatar paths:', {
          userAvatar: specialistData.user?.avatar,
          directAvatar: specialistData.avatar
        });
        setSpecialist(specialistData);

        // Fetch specialist reviews with basic parameters
        try {
          const reviewsData = await reviewService.getSpecialistReviews(specialistId, {
            page: 1,
            limit: 10,
            sortBy: 'createdAt'
          });
          setReviews(reviewsData.reviews || []);
        } catch (reviewError) {
          console.warn('Failed to load reviews, continuing without them:', reviewError);
          setReviews([]);
        }

        // Fetch specialist services
        const servicesData = await specialistService.getSpecialistServices(specialistId);
        setServices(servicesData || []);

      } catch (error) {
        console.error('Error fetching specialist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialistData();
  }, [specialistId]);

  // Build lightbox images when specialist changes
  useEffect(() => {
    if (!specialist) return;
    try {
      let imgs: string[] = [];
      if (specialist.portfolioImages) {
        const raw = Array.isArray(specialist.portfolioImages)
          ? specialist.portfolioImages
          : (typeof specialist.portfolioImages === 'string' ? JSON.parse(specialist.portfolioImages) : []);
        imgs = raw.map((it: any) => it?.imageUrl || it).filter(Boolean);
      }
      setLightbox((prev) => ({ ...prev, images: imgs }));
    } catch {}
  }, [specialist]);

  // Check favorite status when user and specialist are available
  useEffect(() => {
    if (user && specialistId) {
      dispatch(checkSpecialistFavoriteStatus(specialistId));
    }
  }, [dispatch, user, specialistId]);

  // Track profile view when page loads
  useEffect(() => {
    const trackView = async () => {
      if (specialistId && specialist) {
        try {
          // Backend expects specialist userId; fall back to route param if needed
          const profileViewId = specialist?.user?.id || specialist?.userId || specialistId;
          await profileViewService.trackProfileView(profileViewId as string);
          console.log('✅ Profile view tracked for specialist:', specialistId);
        } catch (error) {
          console.warn('Failed to track profile view:', error);
        }
      }
    };

    trackView();
  }, [specialistId, specialist]);

  if (loading) {
    return <PageLoader text="Loading specialist profile..." />;
  }

  if (!specialist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('errors.specialistNotFound')}
          </h2>
          <Link 
            to="/search" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('navigation.backToSearch')}
          </Link>
        </div>
      </div>
    );
  }

  const bankDetails = getBankDetails(specialist);
  const hasBankDetails = bankDetails
    ? Object.values(bankDetails).some((value) => typeof value === 'string' && value.trim())
    : false;

  const isOwnProfile = Boolean(
    user?.userType === 'specialist' &&
    user?.id &&
    (specialist?.user?.id === user.id || specialist?.userId === user.id)
  );

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
        active={i < Math.floor(rating)}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sticky compact header */}
      {specialist && (
        <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200/60 dark:border-gray-700/60 px-2 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Avatar src={specialist.user?.avatar || specialist.avatar} alt={specialist.user?.firstName} size="sm" />
              <div className="truncate">
                <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {specialist.user?.firstName} {specialist.user?.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 sm:gap-3">
                  <span className="inline-flex items-center gap-0.5 sm:gap-1"><StarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" active />{(specialist.rating || 0).toFixed(1)}</span>
                  {typeof specialist.completedBookings === 'number' && (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 hidden sm:flex"><CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{specialist.completedBookings} {t('specialist.completedJobs') || 'Completed'}</span>
                  )}
                  {typeof specialist.responseTime === 'number' && specialist.responseTime > 0 && (
                    <span className="inline-flex items-center gap-0.5 sm:gap-1 hidden md:flex"><ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />~{specialist.responseTime} {t('common.minutes') || 'min'}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {(() => {
                const phone = (specialist.user?.phone || specialist.phone) as string | undefined;
                const locationStr = (specialist.address || specialist.location || '') as string;
                const formattedLocation = getFormattedLocation(specialist) || locationStr;
                return (
                  <>
                    {phone && (
                      <a href={`tel:${phone}`} className="btn btn-secondary btn-sm focus-visible-ring hidden sm:block" aria-label="Call">
                        {t('actions.call') || 'Call'}
                      </a>
                    )}
                    {formattedLocation && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedLocation)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm focus-visible-ring hidden md:block"
                        aria-label="Directions"
                      >
                        {t('actions.directions') || 'Directions'}
                      </a>
                    )}
                  </>
                );
              })()}
              {isOwnProfile ? (
                <button className="btn btn-secondary btn-sm cursor-not-allowed opacity-60" disabled title={t('booking.cannotBookOwn') || "You can't book your own service"}>
                  {t('actions.book') || 'Book'}
                </button>
              ) : (
                <Link to={`/booking/${services[0]?.id || ''}`} className="btn btn-primary btn-sm text-white focus-visible-ring">{t('actions.book') || 'Book'}</Link>
              )}
              {isOwnProfile ? (
                <button className="btn btn-secondary btn-sm cursor-not-allowed opacity-60 hidden sm:block" disabled>
                  {t('actions.message') || 'Message'}
                </button>
              ) : (
                <Link
                  to={`/customer/messages?specialist=${specialistId}`}
                  className="btn btn-secondary btn-sm focus-visible-ring hidden sm:block"
                >
                  {t('actions.message') || 'Message'}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative flex justify-center sm:justify-start">
                <Avatar
                  src={specialist.user?.avatar || specialist.avatar}
                  alt={specialist.user?.firstName || specialist.firstName || 'Specialist'}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                  fallbackIcon={false}
                />
                {/* Debug specialist avatar data */}
                {console.log('🔍 SpecialistProfilePage - Avatar debug:', {
                  specialistUserAvatar: specialist.user?.avatar,
                  specialistAvatar: specialist.avatar,
                  finalAvatarSrc: specialist.user?.avatar || specialist.avatar,
                  specialistId: specialist.id,
                  specialistKeys: Object.keys(specialist)
                })}
                {specialist.user?.isVerified && (
                  <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-8 h-8 text-primary-600 bg-white rounded-full" />
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {specialist.user?.firstName} {specialist.user?.lastName}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                  {translateProfession(specialist.businessName, t)}
                </p>
                
                <div className="flex items-center justify-center sm:justify-start mt-2">
                  <div className="flex items-center">
                    {renderStars(specialist.rating || 0)}
                    <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {specialist.rating || 0} ({specialist.reviewCount || 0} {t('reviews.reviews')})
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0">
                  <div className="flex items-center justify-center sm:justify-start">
                    <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="truncate">{getFormattedLocation(specialist) || t('location.notSpecified')}</span>
                  </div>
                  <div className="flex items-center justify-center sm:justify-start sm:ml-4">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span>{t('specialist.responseTime')}: {specialist.responseTime || t('common.notAvailable') || 'N/A'} {t('time.minutes')}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6 md:mt-0">
              {(() => {
                const shouldShowFavorite = user && specialist?.userId !== user.id;
                console.log('🔍 Favorite button logic:', {
                  user: user?.id,
                  specialistUserId: specialist?.userId,
                  shouldShow: shouldShowFavorite
                });
                return shouldShowFavorite;
              })() && (
                <button
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                    isFavorite
                      ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {favoriteLoading ? (
                    <div className="w-4 h-4 mr-1 sm:w-5 sm:h-5 sm:mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-current"></div>
                  ) : isFavorite ? (
                    <HeartIcon className="w-4 h-4 mr-1 sm:w-5 sm:h-5 sm:mr-2" active />
                  ) : (
                    <HeartIcon className="w-4 h-4 mr-1 sm:w-5 sm:h-5 sm:mr-2" active />
                  )}
                  <span className="hidden sm:inline">{isFavorite ? t('actions.unfavorite') : t('actions.favorite')}</span>
                  <span className="sm:hidden">{isFavorite ? '♥' : '♡'}</span>
                </button>
              )}
              
              {services.length > 0 ? (
                <Link
                  to={isOwnProfile ? '#' : `/book/${services[0]?.id}`}
                  onClick={(e) => { if (isOwnProfile) e.preventDefault(); }}
                  className={`${isOwnProfile ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'} text-white px-4 sm:px-6 py-2 rounded-xl transition-colors flex items-center justify-center text-sm sm:text-base`}
                >
                  <CalendarIcon className="w-4 h-4 mr-1 sm:w-5 sm:h-5 sm:mr-2" />
                  {t('actions.bookNow')}
                </Link>
              ) : (
                <div className="bg-gray-400 text-white px-4 sm:px-6 py-2 rounded-xl cursor-not-allowed flex items-center justify-center text-sm sm:text-base">
                  <CalendarIcon className="w-4 h-4 mr-1 sm:w-5 sm:h-5 sm:mr-2" />
                  {t('actions.noServicesAvailable') || 'No services available'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-8">
            {/* About */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {t('specialist.about')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {getLocalizedDescription(specialist) || t('specialist.noDescription')}
              </p>
              
              {(() => {
                let specialties = [];
                try {
                  if (specialist.specialties) {
                    specialties = Array.isArray(specialist.specialties)
                      ? specialist.specialties
                      : (typeof specialist.specialties === 'string' 
                         ? JSON.parse(specialist.specialties)
                         : []);
                  }
                } catch (error) {
                  console.error('Error parsing specialties:', error);
                  specialties = [];
                }
                
                console.log('🏷️ Specialties processed:', specialties);
                
                return specialties && specialties.length > 0 && (
                  <div className="mt-3 sm:mt-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
                      {t('specialist.specialties')}
                    </h3>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {specialties.map((specialty: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs sm:text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Portfolio */}
            {(() => {
              let portfolioImages = [];
              try {
                if (specialist.portfolioImages) {
                  portfolioImages = Array.isArray(specialist.portfolioImages) 
                    ? specialist.portfolioImages
                    : (typeof specialist.portfolioImages === 'string' 
                       ? JSON.parse(specialist.portfolioImages)
                       : []);
                }
              } catch (error) {
                console.error('Error parsing portfolio images:', error);
                portfolioImages = [];
              }
              
              console.log('🖼️ Portfolio images processed:', portfolioImages);
              
              return portfolioImages && portfolioImages.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Portfolio
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                    {portfolioImages.map((portfolioItem: any, index: number) => {
                      // Handle both direct base64 strings and objects with imageUrl
                      const imageUrl = portfolioItem.imageUrl || portfolioItem;
                      
                      // Check if it's a base64 image (starts with data:image)
                      const isBase64 = typeof imageUrl === 'string' && imageUrl.startsWith('data:image');
                      const finalImageUrl = isBase64 ? imageUrl : getAbsoluteImageUrl(imageUrl);
                      
                      const isAnimatedWebp = typeof finalImageUrl === 'string' && finalImageUrl.toLowerCase().endsWith('.webp');
                      return (
                        <div key={portfolioItem.id || `portfolio-${index}`} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img
                            src={finalImageUrl}
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                            loading="lazy"
                            onClick={() => setLightbox({ open: true, images: (lightbox.images?.length ? lightbox.images : portfolioImages.map((p:any)=>p.imageUrl||p)), index })}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          {isAnimatedWebp && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              Animated
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Lightbox */}
            {lightbox.open && lightbox.images.length > 0 && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setLightbox({ ...lightbox, open: false })}>
                <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                  <button className="absolute -top-10 right-0 text-white/80 hover:text-white" onClick={() => setLightbox({ ...lightbox, open: false })}>✕</button>
                  <img src={getAbsoluteImageUrl(lightbox.images[lightbox.index])} alt="Portfolio" className="w-full h-auto rounded-xl shadow-2xl" />
                  <div className="flex justify-between mt-3">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length })}
                    >Prev</button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length })}
                    >Next</button>
                  </div>
                </div>
              </div>
            )}

            {/* Services */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                {t('specialist.services')}
              </h2>
              
              {services.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {services.map((service: any) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                            {service.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {service.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs sm:text-sm text-gray-500">
                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span>{service.duration} {t('time.minutes')}</span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start mt-2 sm:mt-0 sm:ml-4 sm:text-right">
                          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                            {formatPrice(service.price || service.basePrice || 0, (service.currency as 'USD' | 'EUR' | 'UAH') || 'UAH')}
                          </p>
                          {isOwnProfile ? (
                            <button
                              disabled
                              className="inline-block mt-0 sm:mt-2 px-2 sm:px-3 py-1 bg-gray-400 text-white rounded text-xs sm:text-sm font-medium cursor-not-allowed"
                              title={t('booking.cannotBookOwn') || "You can't book your own service"}
                            >
                              {t('actions.book')}
                            </button>
                          ) : (
                            <Link
                              to={`/book/${service.id}`}
                              className="inline-block mt-0 sm:mt-2 px-2 sm:px-3 py-1 bg-primary-600 text-white hover:bg-primary-700 rounded text-xs sm:text-sm font-medium transition-colors"
                            >
                              {t('actions.book')}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('specialist.noServices')}
                </p>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                {t('reviews.title')} ({specialist.reviewCount ?? reviews.length})
              </h2>
              
              {(specialist.reviewCount ?? reviews.length) > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6 last:border-b-0">
                      <div className="flex items-start space-x-2 sm:space-x-4">
                        <Avatar
                          src={review.customer?.avatar}
                          alt={`${review.customer?.firstName || ''} ${review.customer?.lastName || ''}`.trim() || 'Customer'}
                          size="sm"
                          lazy={true}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                              {`${review.customer?.firstName || ''} ${review.customer?.lastName || ''}`.trim() || t('reviews.anonymousUser')}
                            </h4>
                            <div className="flex items-center mt-1 sm:mt-0">
                              {renderStars(review.rating).map((star, index) => 
                                React.cloneElement(star, { 
                                  key: index, 
                                  className: `w-3 h-3 sm:w-5 sm:h-5 ${star.props.className}` 
                                })
                              )}
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 sm:mt-2 break-words">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('reviews.noReviews')}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {t('specialist.contactInfo')}
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-start text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{getFormattedLocation(specialist) || t('location.notSpecified')}</span>
                </div>
                
                <div className="flex items-start text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{t('specialist.responseTime')}: {specialist.responseTime || t('common.notAvailable') || 'N/A'} {t('time.minutes')}</span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {(hasBankDetails || specialist.paymentQrCodeUrl) && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  {t('specialist.paymentDetails') || 'Payment Details'}
                </h3>
                {hasBankDetails && (
                  <div className="space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {bankDetails?.bankName && (
                      <div className="flex justify-between gap-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('specialist.bankName') || 'Bank'}
                        </span>
                        <span className="text-right break-all">{bankDetails.bankName}</span>
                      </div>
                    )}
                    {bankDetails?.accountName && (
                      <div className="flex justify-between gap-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('specialist.accountName') || 'Account'}
                        </span>
                        <span className="text-right break-all">{bankDetails.accountName}</span>
                      </div>
                    )}
                    {bankDetails?.accountNumber && (
                      <div className="flex justify-between gap-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('specialist.accountNumber') || 'Number'}
                        </span>
                        <span className="text-right break-all">{bankDetails.accountNumber}</span>
                      </div>
                    )}
                    {bankDetails?.iban && (
                      <div className="flex justify-between gap-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('specialist.iban') || 'IBAN'}
                        </span>
                        <span className="text-right break-all">{bankDetails.iban}</span>
                      </div>
                    )}
                    {bankDetails?.swift && (
                      <div className="flex justify-between gap-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('specialist.swift') || 'SWIFT'}
                        </span>
                        <span className="text-right break-all">{bankDetails.swift}</span>
                      </div>
                    )}
                    {bankDetails?.notes && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {bankDetails.notes}
                      </div>
                    )}
                  </div>
                )}
                {specialist.paymentQrCodeUrl && (
                  <div className="mt-4">
                    <img
                      src={getAbsoluteImageUrl(specialist.paymentQrCodeUrl)}
                      alt={t('specialist.paymentQr') || 'Payment QR code'}
                      className="w-32 h-32 rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                {t('specialist.quickStats')}
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{t('specialist.completedJobs')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm ml-2">
                    {specialist.completedBookings || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">{t('specialist.experience')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm ml-2">
                    {formatExperience(specialist.experience)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistProfilePage;
