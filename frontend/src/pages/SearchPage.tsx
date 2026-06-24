import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { serviceService } from '../services';
import { locationService, CityData } from '../services/location.service';
import PublicSeo from '@/components/common/PublicSeo';
import { buildBreadcrumbJsonLd, buildItemListJsonLd } from '@/utils/structuredData';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectUser, selectIsAuthenticated } from '@/store/slices/authSlice';
import { fetchFavoriteSpecialists, selectFavoriteSpecialists } from '../store/slices/favoritesSlice';
import { MagnifyingGlassIcon, MapPinIcon, StarIcon, ClockIcon, SealCheckIcon as CheckBadgeIcon, SlidersIcon as AdjustmentsHorizontalIcon, ListBulletsIcon as ListBulletIcon, SquaresFourIcon as Squares2X2Icon, FunnelIcon, HeartIcon, CalendarIcon, XIcon, ArrowPathIcon } from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';
import { EmptyState } from '@/components/common/EmptyState';
import PromotedListingCard from '@/components/common/PromotedListingCard';
import { promoteService, type ShowcaseItem } from '@/services/promote.service';
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
    // Marketplace acquisition: active featured/boosted placement.
    isFeatured?: boolean;
  };
  _count?: { bookings: number };
  distance?: number;
  isAvailable: boolean;
  portfolioImages?: Array<{ imageUrl?: string } | string>;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [promoted, setPromoted] = useState<ShowcaseItem[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [, setCategoriesLoading] = useState(true);
  const [isFilterTrayOpen, setIsFilterTrayOpen] = useState(false);
  const [availableCities, setAvailableCities] = useState<CityData[]>([]);
  // Saved filter presets
  const [presets, setPresets] = useState<Array<{ name: string; data: Record<string, unknown> }>>(() => {
    try {
      const raw = localStorage.getItem('search-presets');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [availableWithin, setAvailableWithin] = useState<string>('');
  // Quick filter tags state
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());

  // Abandoned booking recovery
  const [abandonedBooking, setAbandonedBooking] = useState<{
    serviceId: string;
    specialistName?: string;
    serviceName?: string;
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('miyzapis_abandoned_booking');
      if (stored) {
        const parsed = JSON.parse(stored);
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        // Show if > 1 hour old and < 7 days old
        if (parsed.timestamp > oneWeekAgo && parsed.timestamp < oneHourAgo) {
          setAbandonedBooking(parsed);
        } else if (parsed.timestamp <= oneWeekAgo) {
          localStorage.removeItem('miyzapis_abandoned_booking');
        }
      }
    } catch {}
  }, []);

  const dismissAbandonedBooking = () => {
    localStorage.removeItem('miyzapis_abandoned_booking');
    setAbandonedBooking(null);
  };

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
      } catch (error: unknown) {
        logger.error('Failed to fetch categories:', error);
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

  // Fetch available cities for location filter
  useEffect(() => {
    locationService.getCities(undefined, 100).then((data) => {
      // Sort: cities with specialists first, then alphabetically
      const sorted = [...data].sort((a, b) => {
        if (a.specialistsCount !== b.specialistsCount) {
          return b.specialistsCount - a.specialistsCount;
        }
        return a.city.localeCompare(b.city, 'uk');
      });
      setAvailableCities(sorted);
    }).catch(() => setAvailableCities([]));
  }, []);

  // Promoted listing (platform-curated ad slot) — relevant to current city/category.
  useEffect(() => {
    promoteService
      .showcase({
        city: selectedLocation || undefined,
        category: selectedCategory || undefined,
        limit: 1,
      })
      .then(setPromoted)
      .catch(() => setPromoted([]));
  }, [selectedLocation, selectedCategory]);

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
      dispatch(fetchFavoriteSpecialists({}));
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
          sortBy: sortBy as 'rating' | 'price' | 'priceDesc' | 'reviews' | 'distance' | 'popular' | 'newest',
          sortOrder: 'desc' as const, // Default to descending (best first)
          availableWithin: availableWithin || undefined,
          distance: selectedDistance > 0 ? selectedDistance : undefined,
          // Marketplace v2 — quick-filter chips
          verifiedOnly: activeQuickFilters.has('verifiedOnly') || undefined,
        };
        // Search API responses come from multiple backend endpoints with subtly
        // different shapes; treat as opaque here and access dynamically.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            data = await serviceService.searchServices(filters as Parameters<typeof serviceService.searchServices>[0]);
          }
        } else {
          data = await serviceService.searchServices(filters as Parameters<typeof serviceService.searchServices>[0]);
        }

        // Transform the data to match our interface based on actual backend response
        const toMinutes = (v: unknown) => {
          const n = Number(v);
          if (!isFinite(n) || n <= 0) return undefined;
          return n > 300 ? Math.round(n / 60000) : n;
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let servicesWithSpecialists = (data.services || []).map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: Number(service.basePrice || service.price) || 0,
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
              isVerified: service.specialist?.user?.isVerified || service.specialist?.isVerified || false,
              createdAt: service.specialist?.user?.createdAt || undefined,
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
            rating: service.specialist?.rating || 0,
            autoBooking: service.specialist?.autoBooking || false,
            // Marketplace acquisition: active featured/boosted placement (backend
            // already sorts these first + sets the active flag).
            isFeatured: service.specialist?.isFeatured || false,
          },
          _count: service._count,
          distance: undefined, // Not available in backend response
          isAvailable: true, // Assume available if service exists
          portfolioImages: service.specialist?.portfolioImages || service.images || undefined,
          // Phase 3: marketplace fields from backend
          discountPercentage: service.discountPercentage || 0,
          groupSession: service.groupSession || false,
          maxGroupSize: service.maxGroupSize || 0,
          topReview: service.topReview || null,
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
      } catch (error: unknown) {
        logger.error('Error fetching services:', error);
        const errorMessage = (error instanceof Error ? error.message : null) || String(error) || 'Failed to load services';
        setError(errorMessage);
        setServices([]);
      } finally {
        setLoading(false);
      }
  }, [debouncedSearchQuery, selectedCategory, selectedLocation, priceRange, selectedRating, sortBy, selectedDistance, availableNow, availableWithin]);

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
        availableWithin,
      }
    };
    const next = [preset, ...presets.filter(p => p.name !== name)].slice(0, 8);
    setPresets(next);
    try { localStorage.setItem('search-presets', JSON.stringify(next)); } catch {}
    setPresetName('');
    setShowSaveInput(false);
  };

  const applyPreset = (p: { name: string; data: Record<string, unknown> }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (p.data || {}) as any;
    setSearchQuery(d.searchQuery ?? '');
    setSelectedCategory(d.selectedCategory ?? '');
    setSelectedLocation(d.selectedLocation ?? '');
    setPriceRange(d.priceRange ?? { min: 0, max: 1000 });
    setSelectedRating(d.selectedRating ?? 0);
    setSelectedDistance(d.selectedDistance ?? 0);
    setShowFavoritesOnly(!!d.showFavoritesOnly);
    setSortBy(d.sortBy ?? 'rating');
    setAvailableNow(!!d.availableNow);
    setAvailableWithin(d.availableWithin ?? '');
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

  // Filter services (search query, favorites, availability)
  const getFilteredServices = () => {
    let list = services;

    // Client-side search filter
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      list = list.filter(service => {
        const name = (service.name || '').toLowerCase();
        const description = (service.description || '').toLowerCase();
        const category = (service.category || '').toLowerCase();
        const specialistName = `${service.specialist?.user?.firstName || ''} ${service.specialist?.user?.lastName || ''}`.toLowerCase();
        const businessName = ((service.specialist as any)?.businessName || '').toLowerCase();
        return (
          name.includes(q) ||
          description.includes(q) ||
          category.includes(q) ||
          specialistName.includes(q) ||
          businessName.includes(q)
        );
      });
    }

    if (showFavoritesOnly) {
      const favoriteSpecialistIds = favoriteSpecialists.map(fav => fav.specialist?.id).filter(Boolean);
      list = list.filter(service => favoriteSpecialistIds.includes(service.specialist?.id));
    }
    if (availableNow) {
      // Heuristic: treat responseTime <= 30 minutes as available now
      list = list.filter(service => typeof (service as any).specialist?.responseTime === 'number' && (service as any).specialist.responseTime <= 30);
    }

    // Quick filter tags
    if (activeQuickFilters.has('onSale')) {
      list = list.filter(service => ((service as any).discountPercentage || 0) > 0);
    }
    if (activeQuickFilters.has('instantBooking')) {
      list = list.filter(service => (service as any).specialist?.autoBooking === true);
    }
    if (activeQuickFilters.has('new')) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      list = list.filter(service => {
        const createdAt = (service as any).specialist?.user?.createdAt;
        return createdAt && new Date(createdAt) > thirtyDaysAgo;
      });
    }
    if (activeQuickFilters.has('bestRated')) {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
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
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl hover:border-gray-300 dark:hover:border-gray-700 transition duration-150 p-4 sm:p-6 border border-gray-200 dark:border-gray-700 hover-lift active:scale-[0.96]"
    >
      {/* Portfolio lives on the specialist profile — search cards stay clean (ProfiHub-style) */}
      <div className="flex flex-row items-start gap-3 sm:gap-4">
        <div className="relative flex-shrink-0 self-start">
          <Avatar
            src={service.specialist?.user?.avatar}
            alt={`${service.specialist?.user?.firstName || ''} ${service.specialist?.user?.lastName || ''}`}
            size="lg"
            fallbackIcon={false}
            lazy={true}
          />
          {service.specialist?.user?.isVerified && (
            <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-6 h-6 text-primary-600 bg-white rounded-full" />
          )}
          {service.specialist?.isOnline && (
            <>
              <span className="absolute -top-1 -right-1 inline-flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
              </span>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {service.name}
              </h3>
              {/* Marketplace acquisition: featured/boosted placement badge.
                  Backend already sorts active-featured first + sets the flag. */}
              {(service as any).specialist?.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-amber-300/60 dark:ring-amber-500/30 whitespace-nowrap">
                  <StarIcon className="w-3 h-3" active />
                  {t('promote.featured') || 'Featured'}
                </span>
              )}
              {(service as any).specialist?.autoBooking && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 whitespace-nowrap">
                  {t('search.badges.instantBooking') || 'Instant Booking'}
                </span>
              )}
              {(service as any).specialist?.user?.createdAt && (() => {
                const createdAt = new Date((service as any).specialist.user.createdAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return createdAt > thirtyDaysAgo;
              })() && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">
                  {t('search.badges.newSpecialist') || 'New'}
                </span>
              )}
              {(service as any).discountPercentage > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {t('search.badges.discount').replace('{{percent}}', String((service as any).discountPercentage))}
                </span>
              )}
              {(service as any).groupSession && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {t('search.badges.groupSession').replace('{{max}}', String((service as any).maxGroupSize))}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {renderStars(service.rating)}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1 tabular-nums">
                {(service.rating ?? 0).toFixed(1)} ({service.reviewCount ?? 0})
              </span>
            </div>
          </div>

          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {translateProfession(service.specialist?.businessName, t)} • {service.specialist?.user?.firstName || ''} {service.specialist?.user?.lastName || ''}
          </p>

          <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 mt-3 text-sm text-gray-500 dark:text-gray-400">
            {service.location && (
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                <span className="truncate">{service.location}</span>
              </div>
            )}
            <div className="flex items-center tabular-nums">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>{service.duration} {t('common.minutes')}</span>
            </div>
            {service.distance && (
              <div className="flex items-center tabular-nums">
                <span>{service.distance.toFixed(1)} km</span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
            {service.description}
          </p>

          {(service as any).topReview && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <StarIcon className="w-3 h-3 text-yellow-400" />
              <span>{(service as any).topReview.rating}</span>
              {(service as any).topReview.comment && (
                <span className="truncate">"{(service as any).topReview.comment}" — {(service as any).topReview.userName}</span>
              )}
            </div>
          )}

          <div className="flex flex-row items-end justify-between gap-3 mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-left min-w-0 tabular-nums">
              {(service.specialist?.completedBookings ?? (service as any).specialist?.completedJobs ?? service._count?.bookings ?? 0)} {t('specialist.completedJobs')} • {service.specialist?.experience || ''}
              {typeof service.specialist.responseTime === 'number' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 tabular-nums">
                  ~{service.specialist.responseTime} {t('common.minutes') || 'min'}
                </span>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`inline-block text-xs px-2 py-1 rounded-full mb-1 ${service.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {service.isAvailable ? t('service.available') : t('service.unavailable')}
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                {formatPrice(service.price ?? 0, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
              </p>
            </div>
          </div>

          <div className="flex flex-row flex-wrap gap-2 sm:gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to={`/specialist/${service.specialist.id}`}
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-center h-11 inline-flex items-center justify-center px-4 rounded-xl font-medium transition-colors duration-200"
            >
              {t('actions.viewProfile')}
            </Link>
            {isOwnService ? (
              <button
                disabled
                className="flex-1 text-white text-center h-11 inline-flex items-center justify-center px-4 rounded-xl font-medium bg-gray-400 cursor-not-allowed"
                title={t('booking.cannotBookOwn') || "You can't book your own service"}
              >
                {t('actions.book')}
              </button>
            ) : (
              <Link
                /* Marketplace acquisition: booked from search = DISCOVERY source */
                to={`/booking/${service.id}?source=DISCOVERY`}
                className={`flex-1 text-white text-center h-11 inline-flex items-center justify-center px-4 rounded-xl transition-colors font-medium ${
                  service.isAvailable
                    ? 'bg-primary-600 hover:bg-primary-700'
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

  // ── SEO: dynamic title / description / JSON-LD ────────────────────
  const seoMeta = useMemo(() => {
    const SITE = 'https://miyzapis.com';
    const categoryName =
      selectedCategory && selectedCategory !== 'all'
        ? (categories.find((c: any) => c.id === selectedCategory)?.name as string | undefined) ||
          selectedCategory
        : '';
    const cityName = selectedLocation || '';
    const query = debouncedSearchQuery || '';

    // Dynamic title
    let title: string;
    let description: string;
    if (categoryName && cityName) {
      title = `${categoryName} у місті ${cityName} — МійЗапис`;
      description = `Знайдіть і забронюйте ${categoryName.toLowerCase()} у ${cityName}. Перевірені спеціалісти, онлайн-запис на МійЗапис.`;
    } else if (categoryName) {
      title = `${categoryName} — пошук спеціалістів | МійЗапис`;
      description = `Перевірені спеціалісти з ${categoryName.toLowerCase()} в Україні. Онлайн-запис за лічені секунди на МійЗапис.`;
    } else if (cityName) {
      title = `Спеціалісти у ${cityName} — МійЗапис`;
      description = `Знайдіть спеціалістів та послуги у ${cityName}. Онлайн-бронювання на МійЗапис.`;
    } else if (query) {
      title = `${query} — пошук спеціалістів | МійЗапис`;
      description = `Результати пошуку «${query}» — перевірені спеціалісти та послуги в Україні. МійЗапис.`;
    } else {
      title =
        t('seo.searchTitle') || 'Пошук спеціалістів та послуг — МійЗапис';
      description =
        t('seo.searchDescription') ||
        'Знайдіть спеціаліста в Україні та забронюйте онлайн. Краса, здоров\'я, навчання та сотні інших послуг на МійЗапис.';
    }

    // Canonical URL with active querystring
    const qs = new URLSearchParams();
    if (query) qs.set('q', query);
    if (categoryName && selectedCategory !== 'all') qs.set('category', selectedCategory);
    if (cityName) qs.set('location', cityName);
    const qsStr = qs.toString();
    const url = qsStr ? `${SITE}/search?${qsStr}` : `${SITE}/search`;

    // Breadcrumb: Home → Search (→ Category if selected)
    const breadcrumbItems: { name: string; url: string }[] = [
      { name: 'МійЗапис', url: `${SITE}/` },
      { name: t('seo.breadcrumb.search') || 'Пошук', url: `${SITE}/search` },
    ];
    if (categoryName) {
      breadcrumbItems.push({ name: categoryName, url: `${SITE}/search?category=${selectedCategory}` });
    }
    const breadcrumbLd = buildBreadcrumbJsonLd(breadcrumbItems);

    // ItemList from visible results (guard: only when loaded and non-empty)
    const filteredNow = getFilteredServices();
    const itemListLd =
      !loading && filteredNow.length > 0
        ? buildItemListJsonLd(
            filteredNow.slice(0, 20).map((svc) => {
              const firstName = svc.specialist?.user?.firstName || '';
              const lastName = svc.specialist?.user?.lastName || '';
              const businessName = svc.specialist?.businessName || '';
              const displayName =
                businessName ||
                [firstName, lastName].filter(Boolean).join(' ') ||
                svc.name;
              const slug = svc.specialist?.id || '';
              return {
                name: displayName,
                url: `${SITE}/s/${slug}`,
                image: svc.specialist?.user?.avatar,
              };
            }),
          )
        : null;

    // Merge into a @graph so both schemas are in one script tag
    const jsonLd =
      itemListLd && Object.keys(itemListLd).length > 0
        ? {
            '@context': 'https://schema.org',
            '@graph': [
              { ...breadcrumbLd, '@context': undefined },
              { ...itemListLd, '@context': undefined },
            ],
          }
        : breadcrumbLd;

    return { title, description, url, jsonLd };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchQuery,
    selectedCategory,
    selectedLocation,
    categories,
    loading,
    services,
    activeQuickFilters,
    showFavoritesOnly,
    availableNow,
    t,
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PublicSeo
        title={seoMeta.title}
        description={seoMeta.description}
        url={seoMeta.url}
        type="website"
        jsonLd={seoMeta.jsonLd}
      />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
              {t('search.title')}
            </h1>
            <HelpTip title={t('help.search.title') || 'Search'} content={t('help.search.body') || 'Find specialists by service, city, rating and price, then book online.'} />
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('search.subtitle')}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm sm:text-base"
            />
          </div>
        </form>

        {/* ============ Two-column: filter sidebar + results ============ */}
        <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
          {/* ── Filter sidebar (drives the same state as the legacy controls) ── */}
          <aside className={`${isFilterTrayOpen ? 'block' : 'hidden'} lg:block mb-4 lg:mb-0`}>
            <div className="lg:sticky lg:top-20 space-y-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 lg:bg-transparent lg:dark:bg-transparent lg:border-0 lg:p-0">
              {/* Category */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('search.category') || 'Category'}</h3>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input w-full">
                  <option value="">{t('search.allCategories') || 'All categories'}</option>
                  {categories.filter(c => c.id !== 'all').map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {/* Location */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('search.location') || 'Location'}</h3>
                <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="input w-full">
                  <option value="">{t('search.allCities') || 'All cities'}</option>
                  {availableCities.map((city) => (
                    <option key={`side-${city.city}-${city.state}`} value={city.city}>
                      {city.city}{city.state ? `, ${city.state}` : ''}{city.specialistsCount ? ` (${city.specialistsCount})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {/* Price range */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('search.priceRange') || 'Price range'}</h3>
                <div className="flex items-center gap-2">
                  <input type="number" inputMode="numeric" min={0} value={priceRange.min || ''} onChange={(e) => setPriceRange(p => ({ ...p, min: Number(e.target.value) || 0 }))} placeholder="0" className="input w-full" aria-label={t('search.minPrice') || 'Min price'} />
                  <span className="text-gray-400">–</span>
                  <input type="number" inputMode="numeric" min={0} value={priceRange.max || ''} onChange={(e) => setPriceRange(p => ({ ...p, max: Number(e.target.value) || 0 }))} placeholder="1000+" className="input w-full" aria-label={t('search.maxPrice') || 'Max price'} />
                </div>
              </div>
              {/* Rating */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('search.rating') || 'Rating'}</h3>
                <div className="flex flex-wrap gap-2">
                  {[5, 4, 3].map((r) => (
                    <button key={r} onClick={() => setSelectedRating(selectedRating === r ? 0 : r)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border transition-colors ${selectedRating === r ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-300'}`}>
                      <StarIcon className="w-3.5 h-3.5" active />{r}{r < 5 ? '+' : ''}
                    </button>
                  ))}
                </div>
              </div>
              {/* Availability */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('search.availability') || 'Availability'}</h3>
                <label
                  className="flex items-center gap-2 cursor-not-allowed text-sm text-gray-400 dark:text-gray-600 select-none"
                  title={t('search.availableNowComingSoon') || 'Coming soon'}
                >
                  <input
                    type="checkbox"
                    disabled
                    checked={false}
                    readOnly
                    className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 opacity-40 cursor-not-allowed"
                  />
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    {t('search.availableNow') || 'Available now'}
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-600">
                      ({t('search.availableNowComingSoon') || 'coming soon'})
                    </span>
                  </span>
                </label>
              </div>
              {/* Quick filters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{t('search.filters') || 'Filters'}</h3>
                <div className="space-y-2">
                  {[
                    { k: 'verifiedOnly', l: t('search.filters.verifiedOnly') || 'Verified' },
                    { k: 'instantBooking', l: t('search.filters.instantBooking') || 'Instant booking' },
                    { k: 'onSale', l: t('search.filters.onSale') || 'On sale' },
                    { k: 'bestRated', l: t('search.filters.bestRated') || 'Best rated' },
                    { k: 'new', l: t('search.filters.new') || 'New' },
                  ].map((f) => (
                    <label key={f.k} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={activeQuickFilters.has(f.k)} onChange={() => setActiveQuickFilters(prev => { const n = new Set(prev); n.has(f.k) ? n.delete(f.k) : n.add(f.k); return n; })} className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                      {f.l}
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                <ArrowPathIcon className="w-4 h-4" />{t('search.resetFilters') || 'Clear all filters'}
              </button>
            </div>
          </aside>

          {/* ── Results column ── */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {searchQuery ? `${t('search.resultsFor') || 'Results for'} "${searchQuery}"` : (t('search.results') || 'Results')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{getFilteredServices().length} {t('search.professionalsFound') || 'found'}</p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const activeFilterCount = [
                    selectedCategory && selectedCategory !== 'all',
                    selectedLocation,
                    priceRange.min > 0 || priceRange.max < 1000,
                    selectedRating > 0,
                    availableWithin === 'now',
                    activeQuickFilters.size > 0,
                    showFavoritesOnly,
                    selectedDistance > 0,
                  ].filter(Boolean).length;
                  return (
                    <button onClick={() => setIsFilterTrayOpen(v => !v)} className="lg:hidden btn btn-secondary text-sm relative">
                      {t('search.filters') || 'Filters'}
                      {activeFilterCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold tabular-nums leading-none">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  );
                })()}

                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-auto text-sm">
                  <option value="rating">{t('search.sortBy.rating') || 'Rating'}</option>
                  <option value="price">{t('search.sortBy.priceAsc') || 'Price: low to high'}</option>
                  <option value="priceDesc">{t('search.sortBy.priceDesc') || 'Price: high to low'}</option>
                  <option value="popular">{t('search.sortBy.popular') || 'Most popular'}</option>
                  <option value="newest">{t('search.sortBy.newest') || 'Newest'}</option>
                </select>
              </div>
            </div>

            {/* Legacy filter controls preserved (hidden); the sidebar above drives the same state */}
            <div className="hidden">
        {/* Quick availability filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {[
            { value: '', label: t('search.allTimes') || 'All' },
            { value: 'now', label: t('search.availableNow') || 'Available Now' },
            { value: 'today', label: t('search.today') || 'Today' },
            { value: 'thisWeek', label: t('search.thisWeek') || 'This Week' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setAvailableWithin(filter.value)}
              className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-200 ${
                availableWithin === filter.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-primary-300'
              }`}
            >
              {filter.value === 'now' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />}
              {filter.label}
            </button>
          ))}
        </div>

        {/* Quick Filter Tags */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 px-1 -mx-1 scrollbar-hide">
          {[
            { key: 'bestRated', label: t('search.filters.bestRated') || 'Best Rated' },
            { key: 'verifiedOnly', label: t('search.filters.verifiedOnly') || '✓ Verified' },
            { key: 'onSale', label: t('search.filters.onSale') || 'On Sale' },
            { key: 'instantBooking', label: t('search.filters.instantBooking') || 'Instant Booking' },
            { key: 'new', label: t('search.filters.new') || 'New' },
          ].map(tag => {
            const isActive = activeQuickFilters.has(tag.key);
            return (
            <button
              key={tag.key}
              onClick={() => {
                setActiveQuickFilters(prev => {
                  const next = new Set(prev);
                  if (next.has(tag.key)) {
                    next.delete(tag.key);
                  } else {
                    next.add(tag.key);
                  }
                  return next;
                });
              }}
              className={`cursor-pointer flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-primary-50 hover:border-primary-300 dark:hover:bg-primary-900/20 dark:hover:border-primary-700'
              }`}
            >
              {tag.label}
            </button>
            );
          })}
        </div>

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
                className="cursor-pointer inline-flex items-center gap-1 sm:gap-2 h-8 sm:h-9 px-3 sm:px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 hover:border-primary-300 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-200"
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

              {/* City Selector */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full sm:w-auto h-8 sm:h-9 px-2 sm:px-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-xs sm:text-sm"
                >
                  <option value="">{t('search.allCities') || 'All cities'}</option>
                  {availableCities.filter(c => c.specialistsCount > 0).length > 0 && (
                    <optgroup label="---">
                      {availableCities.filter(c => c.specialistsCount > 0).map((city) => (
                        <option key={`main-active-${city.city}-${city.state}`} value={city.city}>
                          {city.city}{city.state ? `, ${city.state}` : ''} ({city.specialistsCount})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableCities.filter(c => c.specialistsCount === 0).length > 0 && (
                    <optgroup label="---">
                      {availableCities.filter(c => c.specialistsCount === 0).map((city) => (
                        <option key={`main-empty-${city.city}-${city.state}`} value={city.city}>
                          {city.city}{city.state ? `, ${city.state}` : ''}
                        </option>
                      ))}
                    </optgroup>
                  )}
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
                  <option value="price">{t('search.sortBy.priceAsc') || 'Price: low → high'}</option>
                  <option value="priceDesc">{t('search.sortBy.priceDesc') || 'Price: high → low'}</option>
                  <option value="popular">{t('search.sortBy.popular') || 'Most popular'}</option>
                  <option value="distance">{t('search.sortBy.distance') || 'Distance'}</option>
                  <option value="newest">{t('search.sortBy.newest') || 'Newest'}</option>
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
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-medium">
                ₴{priceRange.min}–₴{priceRange.max}
                <button onClick={() => setPriceRange({ min: 0, max: 1000 })} className="ml-1 hover:text-indigo-600">×</button>
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
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600'} focus-visible-ring`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600'} focus-visible-ring`}
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
            <div className="absolute inset-0 bg-black/60" onClick={() => setIsFilterTrayOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-[calc(100vw-2rem)] sm:max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl animate-slide-in-right flex flex-col">
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
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-xl transition-colors focus-visible-ring"
                    aria-label="Close filters"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-8rem)] px-6 py-6 space-y-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.category') || 'Category'}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium transition-all hover:bg-white dark:hover:bg-gray-800"
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
                          className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
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
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium hover:bg-white dark:hover:bg-gray-800 transition-all"
                        >
                          <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300" onClick={() => applyPreset(p)}>{p.name}</button>
                          <button className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-bold" aria-label={t('actions.delete') || 'Delete'} onClick={() => deletePreset(p.name)}>×</button>
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
                      className="px-4 py-2 rounded-xl text-sm font-medium border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                    >
                      {t('search.price.under25') || 'Under ₴25'}
                    </button>
                    <button onClick={() => setPriceRange({ min: 25, max: 50 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all">₴25-₴50</button>
                    <button onClick={() => setPriceRange({ min: 50, max: 100 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all">₴50-₴100</button>
                    <button onClick={() => setPriceRange({ min: 100, max: 200 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all">₴100-₴200</button>
                    <button onClick={() => setPriceRange({ min: 200, max: 1000 })} className="px-4 py-2 rounded-xl text-sm font-medium border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all">{t('search.price.over200') || 'Over ₴200'}</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('search.minPrice') || 'Min'}</label>
                      <input
                        type="number"
                        min={0}
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium transition-all hover:bg-white dark:hover:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('search.maxPrice') || 'Max'}</label>
                      <input
                        type="number"
                        min={0}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium transition-all hover:bg-white dark:hover:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
                {/* Availability Toggle - Temporarily disabled until backend ready */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 opacity-60">
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

                {/* City / Location Selector */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.location') || 'Location'}</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium transition-all hover:bg-white dark:hover:bg-gray-800"
                  >
                    <option value="">{t('search.allCities') || 'All cities'}</option>
                    {availableCities.filter(c => c.specialistsCount > 0).length > 0 && (
                      <optgroup label="---">
                        {availableCities.filter(c => c.specialistsCount > 0).map((city) => (
                          <option key={`tray-active-${city.city}-${city.state}`} value={city.city}>
                            {city.city}{city.state ? `, ${city.state}` : ''} ({city.specialistsCount})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {availableCities.filter(c => c.specialistsCount === 0).length > 0 && (
                      <optgroup label="---">
                        {availableCities.filter(c => c.specialistsCount === 0).map((city) => (
                          <option key={`tray-empty-${city.city}-${city.state}`} value={city.city}>
                            {city.city}{city.state ? `, ${city.state}` : ''}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Sort By Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white">{t('search.sortBy.title') || 'Sort by'}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm font-medium transition-all hover:bg-white dark:hover:bg-gray-800"
                  >
                    <option value="rating">{t('search.sortBy.rating')}</option>
                    <option value="price">{t('search.sortBy.priceAsc') || 'Price: low → high'}</option>
                    <option value="priceDesc">{t('search.sortBy.priceDesc') || 'Price: high → low'}</option>
                    <option value="popular">{t('search.sortBy.popular') || 'Most popular'}</option>
                    <option value="distance">{t('search.sortBy.distance')}</option>
                    <option value="newest">{t('search.sortBy.newest') || 'Newest'}</option>
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
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 min-w-[2rem] sm:min-w-[3rem] text-right">{selectedRating > 0 ? `${selectedRating}★` : 'Any'}</span>
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
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400 min-w-[3rem] sm:min-w-[4.5rem] text-right">{selectedDistance > 0 ? `≤ ${selectedDistance} km` : t('common.any') || 'Any'}</span>
                  </div>
                </div>

                {/* Favorites Only Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('search.favoritesOnly') || 'Favorites only'}</span>
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ${showFavoritesOnly ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${showFavoritesOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              {/* Bottom Action Buttons */}
              <div className="p-6 pt-4 border-t border-gray-200/30 dark:border-gray-700/30 flex gap-3">
                <button
                  onClick={() => setIsFilterTrayOpen(false)}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {t('actions.close') || 'Close'}
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all"
                >
                  {t('actions.apply') || 'Apply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !loading && (
          <div className="mb-6 bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl">
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

        {/* Abandoned Booking Banner */}
        {abandonedBooking && (
          <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  {t('booking.abandoned.title') || 'Continue your booking?'}
                </p>
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  {abandonedBooking.serviceName && abandonedBooking.specialistName
                    ? `${abandonedBooking.serviceName} with ${abandonedBooking.specialistName}`
                    : t('booking.abandoned.description') || 'You have an unfinished booking'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to={`/booking/${abandonedBooking.serviceId}`}
                className="px-3 py-1.5 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('booking.abandoned.continue') || 'Continue'}
              </Link>
              <button
                onClick={dismissAbandonedBooking}
                className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-lg transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

            </div>{/* /hidden legacy filters */}

            {/* Promoted listing — platform-curated ad slot, above organic results */}
            {!loading && promoted.length > 0 && (
              <div className="mb-4 sm:mb-6 space-y-4">
                {promoted.map((item) => (
                  <PromotedListingCard key={item.promotionId} item={item} />
                ))}
              </div>
            )}

            {/* Results */}
            {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
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
          <div className={`grid gap-4 sm:gap-6 reveal-stagger ${
            viewMode === 'grid'
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1'
          }`}>
            {getFilteredServices().map(renderServiceCard)}
          </div>
        ) : !error ? (
          <EmptyState
            title={t('search.noResults')}
            description={t('search.noResultsDescription')}
            action={
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={clearFilters} className="btn btn-primary">
                  {t('search.resetFilters') || 'Reset filters'}
                </button>
                <Link to="/" className="btn btn-secondary">
                  {t('actions.goHome') || 'Go Home'}
                </Link>
              </div>
            }
          />
        ) : null}
          </div>{/* /results column */}
        </div>{/* /two-column grid */}
      </div>
    </div>
  );
};

export default SearchPage;
