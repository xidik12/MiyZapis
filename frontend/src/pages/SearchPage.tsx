import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { serviceService } from '../services';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import { fetchFavoriteSpecialists, selectFavoriteSpecialists } from '../store/slices/favoritesSlice';
import { MagnifyingGlassIcon, MapPinIcon, StarIcon, ClockIcon, SealCheckIcon as CheckBadgeIcon, SlidersIcon as AdjustmentsHorizontalIcon, ListBulletsIcon as ListBulletIcon, SquaresFourIcon as Squares2X2Icon, FunnelIcon, HeartIcon } from '@/components/icons';
;
import { Avatar } from '../components/ui/Avatar';
import { translateProfession } from '@/utils/profession';
import Skeleton, { SkeletonText } from '../components/ui/Skeleton';
import { logger } from '@/utils/logger';
import { APP_CONSTANTS } from '../config/environment';
// Note: Use active prop for filled icons: <Icon active />

interface ServiceWithSpecialist {
  id: string;
  name: string;
  description: string;
  price: number;
  currency?: string;
  duration: number;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  specialist: {
    id: string;
    user: {
      id?: string;
      firstName: string;
      lastName: string;
      avatar?: string;
      isVerified: boolean;
    };
    businessName: string;
    location: string;
    isOnline: boolean;
    responseTime: string;
    completedBookings: number;
    experience: string;
    rating: number;
  };
  _count?: { bookings: number };
  distance?: number;
  isAvailable: boolean;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const favoriteSpecialists = useAppSelector(selectFavoriteSpecialists);
  const currentUser = useAppSelector(selectUser);

  // State
  const [services, setServices] = useState<ServiceWithSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedDistance, setSelectedDistance] = useState<number>(0); // km, 0 means ignore
  const [availableNow, setAvailableNow] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isFilterTrayOpen, setIsFilterTrayOpen] = useState(false);
  // Saved filter presets
  const [presets, setPresets] = useState<Array<{ name: string; data: any }>>(() => {
    try {
      const raw = localStorage.getItem('search-presets');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName, setPresetName] = useState('');

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesData = await serviceService.getCategories();
        setCategories([
          { id: 'all', name: t('category.all') },
          ...(Array.isArray(categoriesData) ? categoriesData : [])
        ]);
      } catch (err: any) {
        logger.error('Failed to fetch categories:', err);
        // Fallback to default categories
        setCategories([
          { id: 'all', name: t('category.all') },
          { id: 'beauty-wellness', name: t('category.beautyWellness') },
          { id: 'health-fitness', name: t('category.healthFitness') },
          { id: 'education', name: t('category.education') },
          { id: 'home-services', name: t('category.homeServices') },
          { id: 'automotive', name: t('category.automotive') },
          { id: 'technology', name: t('category.technology') },
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [t]);

  // Debounce search query (memoization optimization)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, APP_CONSTANTS.SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Close filter tray on Esc
  useEffect(() => {
    if (!isFilterTrayOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFilterTrayOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFilterTrayOpen]);

  // Fetch favorites when component mounts (only for authenticated users)
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchFavoriteSpecialists());
    }
  }, [dispatch, isAuthenticated]);

  // Fetch services from API (extracted so we can call on Apply)
  const fetchServices = React.useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        const filters = {
          query: debouncedSearchQuery,
          category: selectedCategory || undefined,
          location: selectedLocation || undefined,
          minPrice: priceRange.min > 0 ? priceRange.min : undefined,
          maxPrice: priceRange.max < 1000 ? priceRange.max : undefined,
          rating: selectedRating > 0 ? selectedRating : undefined,
          sortBy: sortBy as 'rating' | 'price' | 'reviews' | 'distance',
          sortOrder: 'desc' as const, // Default to descending (best first)
          distance: selectedDistance > 0 ? selectedDistance : undefined,
        };
        let data: any;
        if (sortBy === 'distance' && typeof navigator !== 'undefined' && navigator.geolocation) {
          try {
            const coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition((pos) => resolve(pos.coords), (err) => reject(err), { timeout: 5000 });
            });
            const byLoc = await serviceService.getServicesByLocation(coords.latitude, coords.longitude, selectedDistance || 50, 1, 20);
            data = { services: byLoc.services, pagination: byLoc.pagination };
          } catch (e) {
            logger.warn('Geolocation denied/unavailable. Fallback to normal search.', e);
            data = await serviceService.searchServices(filters);
          }
        } else {
          data = await serviceService.searchServices(filters);
        }
        
        // Transform the data to match our interface based on actual backend response
        const toMinutes = (v: any) => {
          const n = Number(v);
          if (!isFinite(n) || n <= 0) return undefined;
          return n > 300 ? Math.round(n / 60000) : n;
        };

        let servicesWithSpecialists = (data.services || []).map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.basePrice || service.price || 0,
          currency: service.currency || 'USD',
          duration: service.duration || 0,
          category: service.category || '',
          location: '', // Backend doesn't seem to have location info yet
          rating: service.specialist?.rating || 0,
          reviewCount: service.specialist?.reviewCount || 0,
          specialist: {
            id: service.specialist?.id || '',
            user: {
              id: service.specialist?.user?.id || undefined,
              firstName: service.specialist?.user?.firstName || '',
              lastName: service.specialist?.user?.lastName || '',
              avatar: service.specialist?.user?.avatar || service.specialist?.avatar || undefined,
              isVerified: service.specialist?.user?.isVerified || service.specialist?.isVerified || false
            },
            businessName: service.specialist?.businessName || '',
            location: '', // Backend doesn't seem to have location info yet
            isOnline: true, // Assume online for now
            responseTime: toMinutes(service.specialist?.responseTime) as any, // minutes if available
            completedBookings: service.specialist?.completedBookings 
              || service.specialist?.totalBookings 
              || service._count?.bookings 
              || 0,
            experience: '', // Not available in backend response
            rating: service.specialist?.rating || 0
          },
          _count: service._count,
          distance: undefined, // Not available in backend response
          isAvailable: true // Assume available if service exists
        }));
        
        // Optional refine: available now via backend availability (cap calls for perf)
        // NOTE: Temporarily disabled - backend availability endpoint not yet implemented
        // Once /services/:id/availability endpoint is ready, uncomment this block
        // if (availableNow && servicesWithSpecialists.length > 0) {
        //   const cap = Math.min(servicesWithSpecialists.length, 24);
        //   const subset = servicesWithSpecialists.slice(0, cap);
        //   const refined = await Promise.allSettled(subset.map(async (svc) => {
        //     try {
        //       const availability = await serviceService.getServiceAvailability(svc.id, 1);
        //       const today = availability?.[0];
        //       if (today?.available && today?.earliestSlot) return svc;
        //     } catch {}
        //     return null;
        //   }));
        //   servicesWithSpecialists = refined.map(r => (r.status === 'fulfilled' ? r.value : null)).filter(Boolean) as typeof servicesWithSpecialists;
        // }

        // For now, "Available Now" filter shows all results (no backend filtering)
        // Users can still enable the toggle, but it won't filter until backend is ready

        setServices(servicesWithSpecialists);
      } catch (error: any) {
        logger.error('Error fetching services:', error);
        const errorMessage = error?.message || error?.toString() || 'Failed to load services';
        setError(errorMessage);
        setServices([]);
      } finally {
        setLoading(false);
      }
  }, [debouncedSearchQuery, selectedCategory, selectedLocation, priceRange, selectedRating, sortBy, selectedDistance, availableNow]);

  // Fetch on first mount and when deps change
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedLocation) params.set('location', selectedLocation);
    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedLocation, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  // Presets helpers
  const savePreset = () => {
    const name = (presetName || 'My filter').trim();
    if (!name) return;
    const preset = {
      name,
      data: {
        searchQuery,
        selectedCategory,
        selectedLocation,
        priceRange,
        selectedRating,
        selectedDistance,
        showFavoritesOnly,
        sortBy,
        availableNow,
      }
    };
    const next = [preset, ...presets.filter(p => p.name !== name)].slice(0, 8);
    setPresets(next);
    try { localStorage.setItem('search-presets', JSON.stringify(next)); } catch {}
    setPresetName('');
    setShowSaveInput(false);
  };

  const applyPreset = (p: { name: string; data: any }) => {
    const d = p.data || {};
    setSearchQuery(d.searchQuery ?? '');
    setSelectedCategory(d.selectedCategory ?? '');
    setSelectedLocation(d.selectedLocation ?? '');
    setPriceRange(d.priceRange ?? { min: 0, max: 1000 });
    setSelectedRating(d.selectedRating ?? 0);
    setSelectedDistance(d.selectedDistance ?? 0);
    setShowFavoritesOnly(!!d.showFavoritesOnly);
    setSortBy(d.sortBy ?? 'rating');
    setAvailableNow(!!d.availableNow);
  };

  const deletePreset = (name: string) => {
    const next = presets.filter(p => p.name !== name);
    setPresets(next);
    try { localStorage.setItem('search-presets', JSON.stringify(next)); } catch {}
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setPriceRange({ min: 0, max: 1000 });
    setSelectedRating(0);
    setSelectedDistance(0);
    setSortBy('rating');
    setShowFavoritesOnly(false);
  };

  // Filter services (favorites, availability)
  const getFilteredServices = () => {
    let list = services;
    if (showFavoritesOnly) {
      const favoriteSpecialistIds = favoriteSpecialists.map(fav => fav.specialist.id);
      list = list.filter(service => favoriteSpecialistIds.includes(service.specialist.id));
    }
    if (availableNow) {
      // Heuristic: treat responseTime <= 30 minutes as available now
      list = list.filter(service => typeof (service as any).specialist?.responseTime === 'number' && (service as any).specialist.responseTime <= 30);
    }
    return list;
  };

  // Apply in drawer: refetch, close
  const handleApplyFilters = async () => {
    await fetchServices();
    setIsFilterTrayOpen(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
        active={i < Math.floor(rating)}
      />
    ));
  };

  const renderServiceCard = (service: ServiceWithSpecialist) => {
    const isOwnService = Boolean(
      currentUser?.userType === 'specialist' &&
      currentUser?.id &&
      service.specialist?.user?.id &&
      currentUser.id === service.specialist.user.id
    );
    return (
    <div
      key={service.id}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border border-white/20 dark:border-gray-700/20"
    >
      <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-shrink-0 self-center sm:self-start">
          <Avatar
            src={service.specialist.user.avatar}
            alt={`${service.specialist.user.firstName} ${service.specialist.user.lastName}`}
            size="lg"
            fallbackIcon={false}
            lazy={true}
          />
          {service.specialist.user.isVerified && (
            <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-6 h-6 text-primary-600 bg-white rounded-full" />
          )}
          {service.specialist.isOnline && (
            <>
              <span className="absolute -top-1 -right-1 inline-flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
              </span>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {service.name}
            </h3>
            <div className="flex items-center space-x-1">
              {renderStars(service.rating)}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                {service.rating.toFixed(1)} ({service.reviewCount})
              </span>
            </div>
          </div>

          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {translateProfession(service.specialist.businessName, t)} • {service.specialist.user.firstName} {service.specialist.user.lastName}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            {service.location && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span className="truncate">{service.location}</span>
              </div>
            )}
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>{service.duration} {t('common.minutes')}</span>
            </div>
            {service.distance && (
              <div className="flex items-center">
                <span>{service.distance.toFixed(1)} km</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
            {service.description}
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-3 sm:gap-0 mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
              {(service.specialist.completedBookings ?? (service as any).specialist?.completedJobs ?? service._count?.bookings ?? 0)} {t('specialist.completedJobs')} • {service.specialist.experience}
              {typeof service.specialist.responseTime === 'number' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  ~{service.specialist.responseTime} {t('common.minutes') || 'min'}
                </span>
              )}
            </div>
            <div className="text-center sm:text-right">
              <div className={`text-xs px-2 py-1 rounded-full mb-1 ${service.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {service.isAvailable ? t('service.available') : t('service.unavailable')}
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(service.price, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to={`/specialist/${service.specialist.id}`}
              className="bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:hover:bg-primary-900/30 dark:text-primary-300 text-center h-10 inline-flex items-center justify-center px-4 rounded-xl font-medium transition-colors duration-200"
            >
              {t('actions.viewProfile')}
            </Link>
            {isOwnService ? (
              <button
                disabled
                className="text-white text-center h-10 inline-flex items-center justify-center px-4 rounded-xl font-medium bg-gray-400 cursor-not-allowed"
                title={t('booking.cannotBookOwn') || "You can't book your own service"}
              >
                {t('actions.book')}
              </button>
            ) : (
              <Link
                to={`/booking/${service.id}`}
                className={`text-white text-center h-10 inline-flex items-center justify-center px-4 rounded-xl transition-colors font-medium ${
                  service.isAvailable
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={(e) => !service.isAvailable && e.preventDefault()}
              >
                {t('actions.book')}
              </Link>
            )}
            {/* Conditional Call/Directions CTAs when data exists */}
            {(() => {
              const phone = (service as any)?.specialist?.user?.phone || (service as any)?.specialist?.phone;
              const locationStr = service.location;
              return (
                <div className="flex gap-2">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                      aria-label="Call"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {t('actions.call') || 'Call'}
                    </a>
                  )}
                  {locationStr && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationStr)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"
                      aria-label="Directions"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      {t('actions.directions') || 'Directions'}
                    </a>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
            {t('search.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('search.subtitle')}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            />
          </div>
        </form>

        {/* Enhanced Filters and Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
          {/* Header with results count and main controls */}
          <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('search.results') || 'Search Results'}
                </h3>
                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                  {getFilteredServices().length}
                </span>
              </div>
              {/* Advanced Filters Button - Mobile Priority */}
              <button
                onClick={() => setIsFilterTrayOpen(true)}
                className="inline-flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-3 sm:px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{t('search.filters') || 'Filters'}</span>
              </button>
            </div>
            {/* Category and Sort Controls - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Category Selector */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto h-8 sm:h-9 px-2 sm:px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-xs sm:text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id === 'all' ? '' : category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Selector */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto h-8 sm:h-9 px-2 sm:px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-xs sm:text-sm"
                >
                  <option value="rating">{t('search.sortBy.rating') || 'Rating'}</option>
                  <option value="price">{t('search.sortBy.price') || 'Price'}</option>
                  <option value="distance">{t('search.sortBy.distance') || 'Distance'}</option>
                  <option value="reviews">{t('search.sortBy.reviews') || 'Reviews'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Sort Filters Row - Mobile Optimized */}
          <div className="mb-3 sm:mb-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              {t('search.quickSort') || 'Quick Sort'}
            </h4>
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2">
              <button
                onClick={() => setSortBy('rating')}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap ${
                  sortBy === 'rating' 
                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300' 
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <StarIcon className="w-4 h-4" active />
                {t('search.topRated') || 'Top Rated'}
              </button>
              <button
                onClick={() => setSortBy('reviews')}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap ${
                  sortBy === 'reviews'
                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                {t('search.mostReviewed') || 'Most Reviewed'}
              </button>
              <button
                onClick={() => setSortBy('distance')}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap ${
                  sortBy === 'distance'
                    ? 'bg-primary-50 border-primary-200 text-primary-700 shadow-sm dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <MapPinIcon className="w-4 h-4" />
                {t('search.nearby') || 'Nearby'}
              </button>
            </div>
          </div>

          {/* Rating Filters Row */}
          <div className="mb-4">
            <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              {t('search.ratingFilter') || 'Filter by Rating'}
            </h4>
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2">
              <button
                onClick={() => setSelectedRating(selectedRating === 5 ? 0 : 5)}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap ${
                  selectedRating === 5
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 shadow-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <StarIcon className="w-4 h-4 text-yellow-400" active />
                5★
              </button>
              <button
                onClick={() => setSelectedRating(selectedRating === 4 ? 0 : 4)}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap ${
                  selectedRating === 4
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 shadow-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <StarIcon className="w-4 h-4 text-yellow-400" active />
                4★+
              </button>
              <button
                onClick={() => setSelectedRating(selectedRating === 3 ? 0 : 3)}
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap ${
                  selectedRating === 3
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700 shadow-sm dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                <StarIcon className="w-4 h-4 text-yellow-400" active />
                3★+
              </button>
            </div>
          </div>

          {/* Additional Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                showFavoritesOnly
                  ? 'bg-red-50 border-red-200 text-red-700 shadow-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <HeartIcon className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {showFavoritesOnly ? t('search.showAll') || 'Show All' : t('search.favorites') || 'Favorites'}
            </button>

            {/* Active Filter Tags */}
            {selectedRating > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium">
                {t('search.rating') || 'Rating'}: {selectedRating}★
                <button onClick={() => setSelectedRating(0)} className="ml-1 hover:text-blue-600">×</button>
              </span>
            )}
            {selectedDistance > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium">
                ≤ {selectedDistance} km
                <button onClick={() => setSelectedDistance(0)} className="ml-1 hover:text-green-600">×</button>
              </span>
            )}
            {(priceRange.min > 0 || priceRange.max < 1000) && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-medium">
                ₴{priceRange.min}–₴{priceRange.max}
                <button onClick={() => setPriceRange({ min: 0, max: 1000 })} className="ml-1 hover:text-purple-600">×</button>
              </span>
            )}

            {/* Clear All Filters */}
            {(selectedCategory || selectedLocation || selectedRating > 0 || showFavoritesOnly || selectedDistance > 0 || priceRange.min > 0 || priceRange.max < 1000) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
              >
                <span>×</span>
                {t('search.resetFilters') || 'Clear All Filters'}
              </button>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4 mt-4">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center gap-2 h-10 px-3 rounded-full bg-primary-600 text-white hover:bg-primary-700"
                title={t('actions.apply') || 'Apply'}
              >
                {t('actions.apply') || 'Apply'}
              </button>
              {(selectedCategory || selectedLocation || selectedRating > 0 || selectedDistance > 0 || showFavoritesOnly || priceRange.min > 0 || priceRange.max < 1000) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 h-10 px-3 rounded-full border border-red-200 text-red-700 hover:bg-red-50"
                  title={t('search.resetFilters') || 'Reset filters'}
                >
                  {t('search.resetFilters') || 'Reset filters'}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {/* Mobile filter tray toggle */}
              <button
                onClick={() => setIsFilterTrayOpen(true)}
                className="p-2 rounded sm:hidden bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                aria-label="Open filters"
              >
                <FunnelIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'} focus-visible-ring`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'} focus-visible-ring`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active filters summary chips (desktop) */}
          {(selectedCategory || selectedLocation || selectedRating > 0 || showFavoritesOnly) && (
            <div className="hidden sm:flex flex-wrap gap-2 mt-2">
              {selectedCategory && (
                <button
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  onClick={() => setSelectedCategory('')}
                >
                  {t('search.category')}: {categories.find(c => (c.id === selectedCategory))?.name || selectedCategory} ×
                </button>
              )}
              {selectedLocation && (
                <button
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  onClick={() => setSelectedLocation('')}
                >
                  {t('search.location') || 'Location'}: {selectedLocation} ×
                </button>
              )}
              {selectedRating > 0 && (
                <button
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  onClick={() => setSelectedRating(0)}
                >
                  {t('search.rating') || 'Rating'}: {selectedRating}★+ ×
                </button>
              )}
              {showFavoritesOnly && (
                <button
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  onClick={() => setShowFavoritesOnly(false)}
                >
                  {t('search.favoritesOnly') || 'Favorites only'} ×
                </button>
              )}
              {selectedDistance > 0 && (
                <button
                  className="px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  onClick={() => setSelectedDistance(0)}
                >
                  {t('search.distance') || 'Distance'}: ≤ {selectedDistance} km ×
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile Filter Tray */}
        {isFilterTrayOpen && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsFilterTrayOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-[20px] border-l border-gray-200/50 dark:border-gray-700/50 shadow-2xl animate-slide-in-right flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200/30 dark:border-gray-700/30">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('search.filters') || 'Filters'}</h3>
                <div className="flex items-center gap-3">
                  {(selectedCategory || selectedLocation || selectedRating > 0 || selectedDistance > 0 || showFavoritesOnly || priceRange.min > 0 || priceRange.max < 1000) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                      {t('search.resetFilters') || 'Reset filters'}
                    </button>
                  )}
                  <button
                    onClick={() => setIsFilterTrayOpen(false)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-colors focus-visible-ring"
                    aria-label="Close filters"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.category') || 'Category'}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-gray-800"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id === 'all' ? '' : category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Saved Filters */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.savedFilters') || 'Saved filters'}</label>
                    {!showSaveInput ? (
                      <button
                        onClick={() => setShowSaveInput(true)}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                      >
                        {t('actions.save') || 'Save'}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder={t('search.savedFilters') || 'Saved filters'}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-sm backdrop-blur-sm"
                        />
                        <button
                          onClick={savePreset}
                          className="px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors"
                        >
                          {t('actions.save') || 'Save'}
                        </button>
                        <button
                          onClick={() => { setShowSaveInput(false); setPresetName(''); }}
                          className="px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                        >
                          {t('actions.close') || 'Close'}
                        </button>
                      </div>
                    )}
                  </div>
                  {presets.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p) => (
                        <span
                          key={p.name}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 backdrop-blur-sm text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-all"
                        >
                          <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300" onClick={() => applyPreset(p)}>{p.name}</button>
                          <button className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-bold" aria-label={t('actions.delete') || 'Delete'} onClick={() => deletePreset(p.name)}>×</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('search.noSavedFilters') || 'No saved filters yet.'}</p>
                  )}
                </div>
                {/* Price Range */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.priceRange') || 'Price Range'}</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPriceRange({ min: 0, max: 25 })}
                      className="px-4 py-2 rounded-xl text-sm font-medium border bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 backdrop-blur-sm transition-all"
                    >
                      {t('search.price.under25') || 'Under ₴25'}
                    </button>
                    <button onClick={() => setPriceRange({ min: 25, max: 50 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 backdrop-blur-sm transition-all">₴25-₴50</button>
                    <button onClick={() => setPriceRange({ min: 50, max: 100 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 backdrop-blur-sm transition-all">₴50-₴100</button>
                    <button onClick={() => setPriceRange({ min: 100, max: 200 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 backdrop-blur-sm transition-all">₴100-₴200</button>
                    <button onClick={() => setPriceRange({ min: 200, max: 1000 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 backdrop-blur-sm transition-all">{t('search.price.over200') || 'Over ₴200'}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('search.minPrice') || 'Min'}</label>
                      <input
                        type="number"
                        min={0}
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('search.maxPrice') || 'Max'}</label>
                      <input
                        type="number"
                        min={0}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
                {/* Availability Toggle - Temporarily disabled until backend ready */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 backdrop-blur-sm opacity-60">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-400">{t('search.availableNow') || 'Only available now'}</span>
                    <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                      {t('common.comingSoon') || 'Coming Soon'}
                    </span>
                  </div>
                  <button
                    disabled
                    className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                  >
                    <span className="inline-block h-5 w-5 transform rounded-full bg-white shadow-md translate-x-1" />
                  </button>
                </div>

                {/* Location Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.location') || 'Location'}</label>
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    placeholder={t('search.locationPlaceholder') || 'City or area'}
                    className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-gray-800"
                  />
                </div>

                {/* Sort By Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.sortBy.title') || 'Sort by'}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium backdrop-blur-sm transition-all hover:bg-white dark:hover:bg-gray-800"
                  >
                    <option value="rating">{t('search.sortBy.rating')}</option>
                    <option value="price">{t('search.sortBy.price')}</option>
                    <option value="distance">{t('search.sortBy.distance')}</option>
                    <option value="reviews">{t('search.sortBy.reviews')}</option>
                  </select>
                </div>

                {/* Minimum Rating Slider */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.minimumRating') || 'Minimum rating'}</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(Number(e.target.value))}
                      className="flex-1 h-2 rounded-xl appearance-none bg-gray-200 dark:bg-gray-700 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 min-w-[3rem] text-right">{selectedRating > 0 ? `${selectedRating}★` : 'Any'}</span>
                  </div>
                </div>

                {/* Distance Slider */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.distance') || 'Distance (km)'}</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={selectedDistance}
                      onChange={(e) => setSelectedDistance(Number(e.target.value))}
                      className="flex-1 h-2 rounded-xl appearance-none bg-gray-200 dark:bg-gray-700 outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                    />
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 min-w-[4.5rem] text-right">{selectedDistance > 0 ? `≤ ${selectedDistance} km` : t('common.any') || 'Any'}</span>
                  </div>
                </div>

                {/* Favorites Only Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('search.favoritesOnly') || 'Favorites only'}</span>
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${showFavoritesOnly ? 'bg-primary-600 shadow-lg shadow-primary-500/30' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${showFavoritesOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              {/* Bottom Action Buttons */}
              <div className="p-6 pt-4 border-t border-gray-200/30 dark:border-gray-700/30 flex gap-3">
                <button
                  onClick={() => setIsFilterTrayOpen(false)}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 backdrop-blur-sm transition-all"
                >
                  {t('actions.close') || 'Close'}
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all"
                >
                  {t('actions.apply') || 'Apply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="mb-6 bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-medium">{t('search.error.title') || 'Failed to load services'}</p>
                <p className="text-sm mt-1">{error}</p>
                <button
                  onClick={fetchServices}
                  className="mt-2 text-sm font-semibold underline hover:no-underline"
                >
                  {t('actions.tryAgain') || 'Try Again'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <div className="flex items-start space-x-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                    <SkeletonText lines={3} className="mt-3" />
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : getFilteredServices().length > 0 ? (
          <div className={`grid gap-4 sm:gap-6 ${
            viewMode === 'grid'
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1'
          }`}>
            {getFilteredServices().map(renderServiceCard)}
          </div>
        ) : !error ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
              {t('search.noResults')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('search.noResultsDescription')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={clearFilters}
                className="btn btn-primary"
              >
                {t('search.resetFilters') || 'Reset filters'}
              </button>
              <Link to="/" className="btn btn-secondary">
                {t('actions.goHome') || 'Go Home'}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SearchPage;
