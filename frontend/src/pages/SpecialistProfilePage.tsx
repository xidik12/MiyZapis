import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { specialistService } from '../services';
import { reviewsService } from '../services/reviews.service';
import { profileViewService } from '../services/profileView.service';
import { storeService, StorefrontProduct, FulfilmentType } from '../services/store.service';
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
import { StarIcon, MapPinIcon, ClockIcon, SealCheckIcon as CheckBadgeIcon, CalendarIcon, HeartIcon, InformationCircleIcon } from '@/components/icons';
;
import { Avatar, PageLoader, InlineLoader } from '../components/ui';
import { ShareButton } from '../components/common/ShareButton';
import PublicSeo from '../components/common/PublicSeo';
import { buildSpecialistJsonLd } from '../utils/structuredData';
import { translateProfession } from '@/utils/profession';
import { getAbsoluteImageUrl } from '../utils/imageUrl';
import InstagramShowcase from '../components/specialist/InstagramShowcase';
// Note: Use active prop for filled icons: <Icon active />

const SpecialistProfilePage: React.FC = () => {
  const { specialistId: paramSpecialistId, slug } = useParams();
  // Prerender: wait for this page's OG meta before snapshotting (PublicSeo sets true).
  if (typeof window !== 'undefined' && (window as unknown as { prerenderReady?: boolean }).prerenderReady !== true) {
    (window as unknown as { prerenderReady?: boolean }).prerenderReady = false;
  }
  const [resolvedSpecialistId, setResolvedSpecialistId] = useState<string | undefined>(paramSpecialistId);
  const specialistId = resolvedSpecialistId;
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isFavorite = useAppSelector(selectIsSpecialistFavorited(specialistId || ''));
  
  const [specialist, setSpecialist] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsHasMore, setReviewsHasMore] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [beforeAfterPhotos, setBeforeAfterPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; images: string[]; index: number }>({ open: false, images: [], index: 0 });
  const [_activeTab, _setActiveTab] = useState<'portfolio' | 'beforeAfter'>('portfolio');

  // Storefront (retail products) + cart
  const [storeProducts, setStoreProducts] = useState<StorefrontProduct[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [storeFulfilment, setStoreFulfilment] = useState<FulfilmentType>('PICKUP');
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storeNote, setStoreNote] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);

  // The seller is identified by the specialist's user id.
  const sellerUserId: string | undefined =
    specialist?.userId || specialist?.user?.id || specialistId;

  // Arriving from a shared service link (/specialist/:id?service=<id>): scroll to
  // and briefly highlight that service so the visitor lands right where they book it.
  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get('service');
    if (!sid || services.length === 0) return;
    const el = document.getElementById(`service-${sid}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('ring-2', 'ring-primary-400');
    const tmo = setTimeout(() => el.classList.remove('ring-2', 'ring-primary-400'), 2600);
    return () => clearTimeout(tmo);
  }, [services]);

  const addToCart = (product: StorefrontProduct) => {
    setOrderPlaced(null);
    setCart((prev) => {
      const current = prev[product.id] || 0;
      if (current >= product.stockQty) return prev; // don't exceed stock
      return { ...prev, [product.id]: current + 1 };
    });
  };

  const setCartQty = (productId: string, qty: number, max: number) => {
    setOrderPlaced(null);
    setCart((prev) => {
      const next = { ...prev };
      const clamped = Math.max(0, Math.min(qty, max));
      if (clamped <= 0) delete next[productId];
      else next[productId] = clamped;
      return next;
    });
  };

  const cartLines = storeProducts
    .filter((p) => (cart[p.id] || 0) > 0)
    .map((p) => ({ product: p, quantity: cart[p.id] }));

  const cartCurrency = storeProducts[0]?.currency || 'UAH';
  const cartTotal = cartLines.reduce((sum, l) => sum + l.product.salePrice * l.quantity, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerUserId || cartLines.length === 0) return;
    // Require contact details for guests (no logged-in user).
    if (!user && !storeName.trim() && !storeEmail.trim()) {
      toast.error(t('store.contactRequired') || 'Please add your name or email');
      return;
    }
    try {
      setPlacingOrder(true);
      const order = await storeService.placeOrder({
        sellerUserId,
        customerName: storeName.trim() || undefined,
        customerEmail: storeEmail.trim() || undefined,
        fulfilment: storeFulfilment,
        note: storeNote.trim() || undefined,
        items: cartLines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      });
      setOrderPlaced(order.orderNumber);
      setCart({});
      setStoreName('');
      setStoreEmail('');
      setStoreNote('');
      // Refresh stock after the order.
      try {
        const refreshed = await storeService.getStorefront(sellerUserId);
        setStoreProducts(refreshed || []);
      } catch { /* non-critical */ }
      // Redirect logged-in customers to their orders page; show order number to guests.
      if (user) {
        toast.success((t('store.orderPlaced') || 'Order placed') + `: ${order.orderNumber}`);
        navigate('/customer/orders');
      } else {
        toast.success((t('store.orderPlaced') || 'Order placed') + `: ${order.orderNumber}`);
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || t('store.orderError') || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

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
    } catch (error: unknown) {
      const response = (error as any)?.response;
      // Handle specific error cases
      if (response?.status === 409) {
        toast.info(t('specialist.favorites.conflict') || 'You cannot favorite your own profile or this specialist is already in your favorites.');
      } else if (response?.status === 401) {
        toast.info(t('specialist.favorites.loginRequired') || 'Please log in to add favorites.');
      } else {
        toast.error(t('specialist.favorites.updateError') || 'Failed to update favorites. Please try again.');
      }
      
      // The Redux slice will automatically revert optimistic updates on error
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Resolve slug to specialistId
  useEffect(() => {
    const resolveSlug = async () => {
      if (!paramSpecialistId && slug) {
        try {
          const slugResponse = await specialistService.getBySlug(slug);
          if (slugResponse?.id) {
            setResolvedSpecialistId(slugResponse.id as string);
          } else {
            setLoading(false);
          }
        } catch {
          setLoading(false);
        }
      }
    };
    resolveSlug();
  }, [paramSpecialistId, slug]);

  useEffect(() => {
    const fetchSpecialistData = async () => {
      if (!specialistId) return;

      try {
        setLoading(true);

        // Fetch specialist profile
        const specialistData = await specialistService.getPublicProfile(specialistId);
        setSpecialist(specialistData);

        // Fetch specialist reviews with basic parameters
        try {
          const reviewsData = await reviewsService.getSpecialistReviews(specialistId, 1, 5);
          setReviews(reviewsData.reviews || []);
          setReviewsHasMore(reviewsData.pagination?.hasNext ?? false);
          setReviewsPage(1);
        } catch (reviewError) {
          setReviews([]);
          setReviewsHasMore(false);
        }

        // Fetch specialist services
        const servicesData = await specialistService.getSpecialistServices(specialistId);
        setServices(servicesData || []);

        // Fetch before/after photos (non-critical)
        try {
          const baPhotos = await specialistService.getPublicBeforeAfterPhotos(specialistId);
          setBeforeAfterPhotos(baPhotos || []);
        } catch {
          setBeforeAfterPhotos([]);
        }

      } catch (error) {
        // Specialist data fetch failed — loading state will be cleared
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialistData();
  }, [specialistId]);

  // Fetch the specialist's retail storefront (non-critical).
  useEffect(() => {
    const fetchStorefront = async () => {
      if (!sellerUserId) return;
      try {
        const products = await storeService.getStorefront(sellerUserId);
        setStoreProducts(products || []);
      } catch {
        setStoreProducts([]);
      }
    };
    fetchStorefront();
  }, [sellerUserId]);

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
        } catch (error) {
          // Profile view tracking is non-critical — silently ignore
        }
      }
    };

    trackView();
  }, [specialistId, specialist]);

  if (loading) {
    return <PageLoader text={t('specialist.profileLoading')} />;
  }

  if (!specialist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
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

  const handleLoadMoreReviews = async () => {
    if (!specialistId || reviewsLoadingMore || !reviewsHasMore) return;
    try {
      setReviewsLoadingMore(true);
      const nextPage = reviewsPage + 1;
      const reviewsData = await reviewsService.getSpecialistReviews(specialistId, nextPage, 5);
      setReviews(prev => [...prev, ...(reviewsData.reviews || [])]);
      setReviewsHasMore(reviewsData.pagination?.hasNext ?? false);
      setReviewsPage(nextPage);
    } catch {
      // non-critical
    } finally {
      setReviewsLoadingMore(false);
    }
  };

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

  const seoName = `${specialist.user?.firstName || ''} ${specialist.user?.lastName || ''}`.trim() || specialist.businessName || 'Specialist';
  const seoProfession = translateProfession(specialist.businessName, t);
  const seoLocation = getFormattedLocation(specialist);
  const seoTitle = `${seoName}${seoProfession ? ` — ${seoProfession}` : ''} | МійЗапис`;
  const seoDescription =
    getLocalizedDescription(specialist) ||
    [seoProfession, seoLocation].filter(Boolean).join(' · ') ||
    `Book ${seoName} on МійЗапис.`;
  const seoImage = getAbsoluteImageUrl(specialist.user?.avatar || specialist.avatar) || undefined;
  const seoUrl = `${window.location.origin}/s/${specialist.slug || specialist.id}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicSeo
        title={seoTitle}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
        type="profile"
        jsonLd={buildSpecialistJsonLd({ specialist, services })}
      />
      {/* Sticky compact header */}
      {specialist && (
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200/60 dark:border-gray-800 px-2 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Avatar src={specialist.user?.avatar || specialist.avatar} alt={specialist.user?.firstName} size="sm" />
              <div className="truncate">
                <div className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {specialist.user?.firstName} {specialist.user?.lastName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 sm:gap-3 tabular-nums">
                  <span className="inline-flex items-center gap-0.5 sm:gap-1"><StarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" active />{(specialist.rating || 0).toFixed(1)}</span>
                  {typeof specialist.completedBookings === 'number' && (
                    <span className="items-center gap-0.5 sm:gap-1 hidden sm:inline-flex"><CalendarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{specialist.completedBookings} {t('specialist.completedJobs') || 'Completed'}</span>
                  )}
                  {typeof specialist.responseTime === 'number' && specialist.responseTime > 0 && (
                    <span className="items-center gap-0.5 sm:gap-1 hidden md:inline-flex"><ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />~{specialist.responseTime} {t('common.minutes') || 'min'}</span>
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
                services.length === 1 ? (
                  <Link to={`/booking/${services[0]?.id}`} className="btn btn-primary btn-sm text-white focus-visible-ring">{t('actions.book') || 'Book'}</Link>
                ) : (
                  <a href="#services-section" className="btn btn-primary btn-sm text-white focus-visible-ring">{t('actions.book') || 'Book'}</a>
                )
              )}
              {isOwnProfile ? (
                <button className="btn btn-secondary btn-sm cursor-not-allowed opacity-60 hidden sm:block" disabled>
                  {t('actions.message') || 'Message'}
                </button>
              ) : (
                <Link
                  to={`/customer/messages?specialist=${specialist?.userId || specialist?.user?.id || specialistId}`}
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
                {specialist.user?.isVerified && (
                  <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-8 h-8 text-primary-600 bg-white rounded-full" />
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-balance">
                  {specialist.user?.firstName} {specialist.user?.lastName}
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400">
                  {translateProfession(specialist.businessName, t)}
                </p>
                
                <div className="flex items-center justify-center sm:justify-start mt-2">
                  <div className="flex items-center">
                    {renderStars(specialist.rating || 0)}
                    <span className="ml-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 tabular-nums">
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
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 sm:mt-6 md:mt-0">
              {user && specialist?.userId !== user.id && (
                <button
                  onClick={handleFavoriteToggle}
                  disabled={favoriteLoading}
                  className={`cursor-pointer flex items-center justify-center px-3 sm:px-4 py-2 rounded-xl border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap ${
                    isFavorite
                      ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {favoriteLoading ? (
                    <InlineLoader size="sm" color="current" className="mr-1.5 sm:mr-2" />
                  ) : isFavorite ? (
                    <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" active />
                  ) : (
                    <HeartIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                  )}
                  <span className="hidden sm:inline">{isFavorite ? t('actions.unfavorite') : t('actions.favorite')}</span>
                </button>
              )}

              {/* Share Button (icon-only, declutters the hero) */}
              <ShareButton
                variant="icon"
                className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                url={`${window.location.origin}/s/${specialist.slug || specialist.id}`}
                title={`${specialist.user?.firstName} ${specialist.user?.lastName} — MiyZapis`}
                text={`${t('share.tellFriend')}: ${specialist.user?.firstName} ${specialist.user?.lastName}`}
              />

              {services.length > 0 ? (
                isOwnProfile ? (
                  <button
                    disabled
                    className="bg-gray-400 cursor-not-allowed text-white px-4 sm:px-6 py-2 rounded-xl flex items-center justify-center text-sm sm:text-base whitespace-nowrap flex-1 sm:flex-initial"
                  >
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span>{t('actions.bookNow')}</span>
                  </button>
                ) : services.length === 1 ? (
                  <Link
                    to={`/booking/${services[0]?.id}`}
                    className="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white px-4 sm:px-6 py-2 rounded-xl transition-all duration-200 flex items-center justify-center text-sm sm:text-base whitespace-nowrap flex-1 sm:flex-initial"
                  >
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span>{t('actions.bookNow')}</span>
                  </Link>
                ) : (
                  <a
                    href="#services-section"
                    className="cursor-pointer bg-primary-600 hover:bg-primary-700 text-white px-4 sm:px-6 py-2 rounded-xl transition-all duration-200 flex items-center justify-center text-sm sm:text-base whitespace-nowrap flex-1 sm:flex-initial"
                  >
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                    <span>{t('actions.bookNow')}</span>
                  </a>
                )
              ) : (
                <div className="bg-gray-400 text-white px-4 sm:px-6 py-2 rounded-xl cursor-not-allowed flex items-center justify-center text-sm sm:text-base whitespace-nowrap flex-1 sm:flex-initial">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                  <span>{t('actions.noServicesAvailable') || 'No services available'}</span>
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
                  specialties = [];
                }
                
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
                portfolioImages = [];
              }
              
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
                            className="w-full h-full object-cover transition-transform cursor-pointer ring-1 ring-inset ring-black/10 dark:ring-white/10"
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

            {/* Before/After Gallery */}
            {beforeAfterPhotos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  {t('specialist.beforeAfter') || 'Before & After'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {beforeAfterPhotos.map((photo: any, index: number) => (
                    <div key={photo.id || `ba-${index}`} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                          <img
                            src={getAbsoluteImageUrl(photo.beforeUrl)}
                            alt="Before"
                            className="w-full h-full object-cover ring-1 ring-inset ring-black/10 dark:ring-white/10"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white">
                            {t('specialist.before') || 'Before'}
                          </span>
                        </div>
                        <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                          <img
                            src={getAbsoluteImageUrl(photo.afterUrl)}
                            alt="After"
                            className="w-full h-full object-cover ring-1 ring-inset ring-black/10 dark:ring-white/10"
                            loading="lazy"
                          />
                          <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white">
                            {t('specialist.after') || 'After'}
                          </span>
                        </div>
                      </div>
                      {photo.caption && (
                        <div className="px-3 py-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400">{photo.caption}</p>
                        </div>
                      )}
                      {photo.booking?.service?.name && (
                        <div className="px-3 pb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            {photo.booking.service.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instagram Showcase */}
            {(() => {
              let social: Record<string, any> = {};
              try {
                social = typeof specialist.socialMedia === 'string'
                  ? JSON.parse(specialist.socialMedia)
                  : (specialist.socialMedia || {});
              } catch { /* ignore */ }

              const rawIg: string = social.instagram || '';
              const posts: string[] = Array.isArray(social.instagramPosts) ? social.instagramPosts.slice(0, 6) : [];

              // Extract handle from stored value (may be full URL or bare handle)
              let handle = '';
              let profileUrl: string | null = null;
              if (rawIg) {
                try {
                  const url = new URL(rawIg.startsWith('http') ? rawIg : `https://${rawIg}`);
                  if (url.hostname.includes('instagram.com')) {
                    handle = url.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')[0];
                    profileUrl = `https://www.instagram.com/${handle}/`;
                  } else {
                    handle = rawIg.replace(/^@/, '').trim();
                    profileUrl = `https://www.instagram.com/${handle}/`;
                  }
                } catch {
                  handle = rawIg.replace(/^@/, '').trim();
                  profileUrl = handle ? `https://www.instagram.com/${handle}/` : null;
                }
              }

              if (!handle && posts.length === 0) return null;

              return (
                <InstagramShowcase handle={handle} profileUrl={profileUrl} posts={posts} />
              );
            })()}

            {/* Lightbox */}
            {lightbox.open && lightbox.images.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => setLightbox({ ...lightbox, open: false })}>
                <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                  <button className="absolute -top-10 right-0 text-white/80 hover:text-white" onClick={() => setLightbox({ ...lightbox, open: false })}>✕</button>
                  <img src={getAbsoluteImageUrl(lightbox.images[lightbox.index])} alt="Portfolio" className="w-full h-auto rounded-xl shadow-2xl" />
                  <div className="flex justify-between mt-3">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length })}
                    >{t('lightbox.prev')}</button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length })}
                    >{t('lightbox.next')}</button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Services */}
            <div id="services-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                {t('specialist.services')}
              </h2>
              
              {services.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {services.map((service: any) => (
                    <div
                      key={service.id}
                      id={`service-${service.id}`}
                      className="cursor-pointer border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 hover:border-primary-300 transition-all duration-200 hover-lift scroll-mt-24 target:ring-2 target:ring-primary-400"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                            {service.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {service.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs sm:text-sm text-gray-500 tabular-nums">
                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span>{service.duration} {t('time.minutes')}</span>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start mt-2 sm:mt-0 sm:ml-4 sm:text-right">
                          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                            {formatPrice(service.price || service.basePrice || 0, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
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
                              to={`/booking/${service.id}`}
                              className="cursor-pointer inline-block mt-0 sm:mt-2 px-2 sm:px-3 py-1 bg-primary-600 text-white hover:bg-primary-700 rounded text-xs sm:text-sm font-medium transition-all duration-200"
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
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 sm:py-8">
                  {t('specialist.noServices')}
                </p>
              )}
            </div>

            {/* Shop / Products (retail storefront) */}
            {storeProducts.length > 0 && (
              <div id="shop-section" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                  {t('store.shop') || 'Shop / Products'}
                </h2>

                {/* Product grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {storeProducts.map((product) => {
                    const inCart = cart[product.id] || 0;
                    const soldOut = inCart >= product.stockQty;
                    return (
                      <div
                        key={product.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 flex flex-col"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                            {formatPrice(product.salePrice || 0, (product.currency as 'USD' | 'EUR' | 'UAH') || 'UAH')}
                          </p>
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            disabled={soldOut}
                            className="px-3 py-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                          >
                            {inCart > 0 ? `${t('store.addToCart') || 'Add'} (${inCart})` : (t('store.addToCart') || 'Add')}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                          {product.stockQty} {t('store.inStock') || 'in stock'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Cart + order form */}
                {cartLines.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {t('store.cart') || 'Cart'}
                    </h3>
                    <div className="space-y-2 mb-4">
                      {cartLines.map((line) => (
                        <div key={line.product.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{line.product.name}</span>
                          <input
                            type="number"
                            min={0}
                            max={line.product.stockQty}
                            value={line.quantity}
                            onChange={(e) => setCartQty(line.product.id, parseInt(e.target.value || '0', 10), line.product.stockQty)}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-right"
                          />
                          <span className="w-24 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                            {formatPrice(line.product.salePrice * line.quantity, (cartCurrency as 'USD' | 'EUR' | 'UAH') || 'UAH')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mb-4 text-base font-bold text-gray-900 dark:text-white">
                      <span>{t('sales.total') || 'Total'}</span>
                      <span className="tabular-nums">{formatPrice(cartTotal, (cartCurrency as 'USD' | 'EUR' | 'UAH') || 'UAH')}</span>
                    </div>

                    <form onSubmit={handlePlaceOrder} className="space-y-3">
                      {!user && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder={t('store.yourName') || 'Your name'}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <input
                            type="email"
                            value={storeEmail}
                            onChange={(e) => setStoreEmail(e.target.value)}
                            placeholder={t('store.yourEmail') || 'Your email'}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        {(['PICKUP', 'DELIVERY'] as FulfilmentType[]).map((f) => (
                          <button
                            type="button"
                            key={f}
                            onClick={() => setStoreFulfilment(f)}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                              storeFulfilment === f
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            {f === 'PICKUP' ? (t('store.pickup') || 'Pickup') : (t('store.delivery') || 'Delivery')}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={storeNote}
                        onChange={(e) => setStoreNote(e.target.value)}
                        rows={2}
                        placeholder={t('store.notePlaceholder') || 'Note (optional)'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t('store.payInStoreHint') || 'Pay and collect in-store. The seller will confirm your order.'}
                      </p>
                      <button
                        type="submit"
                        disabled={placingOrder}
                        className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        {placingOrder ? (t('common.loading') || 'Loading...') : (t('store.placeOrder') || 'Place order')}
                      </button>
                    </form>
                  </div>
                )}

                {orderPlaced && (
                  <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                    {t('store.orderPlaced') || 'Order placed'}: <span className="font-mono font-medium">{orderPlaced}</span>
                    {user && (
                      <Link
                        to="/customer/orders"
                        className="ml-2 underline font-medium hover:text-green-900 dark:hover:text-green-100"
                      >
                        {t('customer.orders.viewOrders') || 'View my orders'}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                {t('reviews.title')} <span className="tabular-nums">({specialist.reviewCount ?? reviews.length})</span>
              </h2>
              
              {(specialist.reviewCount ?? reviews.length) > 0 ? (
                <div className="space-y-4 sm:space-y-6">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 sm:pb-6 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg px-2 -mx-2 transition-all duration-200">
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
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                            {review.isVerified && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                <CheckBadgeIcon className="w-3 h-3 mr-0.5" />
                                {t('reviews.verifiedBooking') || 'Verified Booking'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1 sm:mt-2 break-words">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviewsHasMore && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={handleLoadMoreReviews}
                        disabled={reviewsLoadingMore}
                        className="px-5 py-2 text-sm font-semibold text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewsLoadingMore
                          ? (t('common.loading') || 'Loading...')
                          : (t('reviews.showMore') || 'Show more reviews')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4 sm:py-8">
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
                  <div>
                    <span className="break-words">{getFormattedLocation(specialist) || t('location.notSpecified')}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic flex items-center">
                      <InformationCircleIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                      {t('location.exactAddressAfterBooking') || 'Exact address provided after booking confirmation'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{t('specialist.responseTime')}: {specialist.responseTime || t('common.notAvailable') || 'N/A'} {t('time.minutes')}</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {(() => {
              let social: Record<string, string> = {};
              try {
                social = typeof specialist.socialMedia === 'string'
                  ? JSON.parse(specialist.socialMedia)
                  : (specialist.socialMedia || {});
              } catch { /* ignore parse errors */ }

              const links = [
                { key: 'instagram', url: social.instagram, label: 'Instagram', color: 'text-pink-500' },
                { key: 'facebook', url: social.facebook, label: 'Facebook', color: 'text-blue-600' },
                { key: 'linkedin', url: social.linkedin, label: 'LinkedIn', color: 'text-blue-700' },
                { key: 'website', url: social.website, label: 'Website', color: 'text-gray-600 dark:text-gray-400' },
              ].filter(l => l.url);

              const whatsapp = specialist.whatsappNumber;

              if (links.length === 0 && !whatsapp) return null;

              return (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                    {language === 'uk' ? 'Соціальні мережі' : language === 'ru' ? 'Социальные сети' : 'Social Media'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {links.map(link => (
                      <a
                        key={link.key}
                        href={link.url!.startsWith('http') ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${link.color}`}
                      >
                        {link.label}
                      </a>
                    ))}
                    {whatsapp && (
                      <a
                        href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-green-600"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

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
                      className="w-32 h-32 rounded-lg border border-gray-200 dark:border-gray-700 object-cover ring-1 ring-inset ring-black/10 dark:ring-white/10"
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
                  <span className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm ml-2 tabular-nums">
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
