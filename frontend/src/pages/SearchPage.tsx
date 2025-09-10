import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { serviceService } from '../services';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { fetchFavoriteSpecialists, selectFavoriteSpecialists } from '../store/slices/favoritesSlice';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  CheckBadgeIcon,
  AdjustmentsHorizontalIcon,
  ListBulletIcon,
  Squares2X2Icon,
  FunnelIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import { Avatar } from '../components/ui/Avatar';
import { translateProfession } from '@/utils/profession';
import Skeleton, { SkeletonText } from '../components/ui/Skeleton';

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
  const favoriteSpecialists = useAppSelector(selectFavoriteSpecialists);
  const currentUser = useAppSelector(selectUser);

  // State
  const [services, setServices] = useState<ServiceWithSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedDistance, setSelectedDistance] = useState<number>(0); // km, 0 means ignore
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isFilterTrayOpen, setIsFilterTrayOpen] = useState(false);

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
        console.error('Failed to fetch categories:', err);
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

  // Close filter tray on Esc
  useEffect(() => {
    if (!isFilterTrayOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFilterTrayOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFilterTrayOpen]);

  // Fetch favorites when component mounts
  useEffect(() => {
    dispatch(fetchFavoriteSpecialists());
  }, [dispatch]);

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const filters = {
          query: searchQuery,
          category: selectedCategory || undefined,
          location: selectedLocation || undefined,
          minPrice: priceRange.min > 0 ? priceRange.min : undefined,
          maxPrice: priceRange.max < 1000 ? priceRange.max : undefined,
          rating: selectedRating > 0 ? selectedRating : undefined,
          sortBy: sortBy as 'rating' | 'price' | 'reviews' | 'distance',
          sortOrder: 'desc' as const, // Default to descending (best first)
          distance: selectedDistance > 0 ? selectedDistance : undefined,
        };
        
        const data = await serviceService.searchServices(filters);
        
        // Transform the data to match our interface based on actual backend response
        const toMinutes = (v: any) => {
          const n = Number(v);
          if (!isFinite(n) || n <= 0) return undefined;
          return n > 300 ? Math.round(n / 60000) : n;
        };

        const servicesWithSpecialists = (data.services || []).map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.basePrice || service.price || 0,
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
        
        setServices(servicesWithSpecialists);
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [searchQuery, selectedCategory, selectedLocation, priceRange, selectedRating, sortBy]);

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

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setPriceRange({ min: 0, max: 1000 });
    setSelectedRating(0);
    setSelectedDistance(0);
    setSortBy('rating');
    setShowFavoritesOnly(false);
  };

  // Filter services for favorites
  const getFilteredServices = () => {
    if (!showFavoritesOnly) {
      return services;
    }
    
    // Filter services to show only those from favorited specialists
    const favoriteSpecialistIds = favoriteSpecialists.map(fav => fav.id);
    return services.filter(service => 
      favoriteSpecialistIds.includes(service.specialist.id)
    );
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIconSolid
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
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
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <Avatar
            src={service.specialist.user.avatar}
            alt={`${service.specialist.user.firstName} ${service.specialist.user.lastName}`}
            size="lg"
            fallbackIcon={false}
            lazy={true}
          />
          {/* Debug search card avatar data */}
          {console.log('🔍 SearchPage - Avatar debug for service:', service.id, {
            specialistUserAvatar: service.specialist.user.avatar,
            specialistUserKeys: service.specialist.user ? Object.keys(service.specialist.user) : 'No user',
            specialistKeys: Object.keys(service.specialist),
            serviceId: service.id,
            specialistId: service.specialist.id
          })}
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
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

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-1" />
              <span className="truncate">{service.location}</span>
            </div>
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

          <div className="flex items-center justify-between mt-3 sm:mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {(service.specialist.completedBookings ?? (service as any).specialist?.completedJobs ?? service._count?.bookings ?? 0)} {t('specialist.completedJobs')} • {service.specialist.experience}
              {typeof service.specialist.responseTime === 'number' && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  ~{service.specialist.responseTime} {t('common.minutes') || 'min'}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className={`text-xs px-2 py-1 rounded-full mb-1 ${service.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {service.isAvailable ? t('service.available') : t('service.unavailable')}
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(service.price, service.currency as 'USD' | 'EUR' | 'UAH' || 'UAH')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            <Link
              to={`/specialist/${service.specialist.id}`}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center h-10 inline-flex items-center justify-center px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {t('actions.viewProfile')}
            </Link>
            {isOwnService ? (
              <button
                disabled
                className={`flex-1 text-white text-center h-10 inline-flex items-center justify-center px-4 rounded-lg text-sm font-medium bg-gray-400 cursor-not-allowed`}
                title={t('booking.cannotBookOwn') || "You can't book your own service"}
              >
                {t('actions.book')}
              </button>
            ) : (
              <Link
                to={`/booking/${service.id}`}
                className={`flex-1 text-white text-center h-10 inline-flex items-center justify-center px-4 rounded-lg transition-colors text-sm font-medium ${
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
                <div className="flex gap-2 sm:w-auto w-full">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      aria-label="Call"
                    >
                      <PhoneIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('actions.call') || 'Call'}</span>
                    </a>
                  )}
                  {locationStr && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationStr)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                      aria-label="Directions"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('actions.directions') || 'Directions'}</span>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {t('search.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('search.subtitle')}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </form>

        {/* Filters and Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0 sticky-controls rounded-b-xl">
          {/* Quick filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto flex-nowrap pb-1 -mx-2 px-2 transition-all">
            <button
              onClick={() => setSortBy('rating')}
              className={`h-9 inline-flex items-center px-2.5 sm:px-3 rounded-full text-sm border leading-none transition-colors ${sortBy === 'rating' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              {t('search.topRated') || 'Top Rated'}
            </button>
            <button
              onClick={() => setSortBy('reviews')}
              className={`h-9 inline-flex items-center px-2.5 sm:px-3 rounded-full text-sm border leading-none transition-colors ${sortBy === 'reviews' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              {t('search.mostReviewed') || 'Most Reviewed'}
            </button>
            <button
              onClick={() => setSortBy('distance')}
              className={`h-9 inline-flex items-center px-2.5 sm:px-3 rounded-full text-sm border leading-none transition-colors ${sortBy === 'distance' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              {t('search.nearby') || 'Nearby'}
            </button>
            {/* Rating distribution quick chips */}
            <button
              onClick={() => setSelectedRating(selectedRating === 5 ? 0 : 5)}
              className={`h-9 inline-flex items-center px-2.5 sm:px-3 rounded-full text-sm border leading-none transition-colors ${selectedRating === 5 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              5★
            </button>
            <button
              onClick={() => setSelectedRating(selectedRating === 4 ? 0 : 4)}
              className={`h-9 inline-flex items-center px-2.5 sm:px-3 rounded-full text-sm border leading-none transition-colors ${selectedRating === 4 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              4★+
            </button>
            <button
              onClick={() => setSelectedRating(selectedRating === 3 ? 0 : 3)}
              className={`h-9 inline-flex items-center px-2.5 sm:px-3 rounded-full text-sm border leading-none transition-colors ${selectedRating === 3 ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
            >
              3★+
            </button>
            {/* Favorites toggle (compact) */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`h-9 inline-flex items-center px-3 border rounded-full transition-colors whitespace-nowrap leading-none ${
                showFavoritesOnly
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <HeartIcon className="w-4 h-4 mr-1.5" />
              {showFavoritesOnly ? t('search.showAll') : t('search.favorites')}
            </button>
            {(selectedCategory || selectedLocation || selectedRating > 0 || showFavoritesOnly) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-full text-sm border bg-red-50 text-red-700 border-red-200"
              >
                {t('search.resetFilters') || 'Reset filters'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Favorites toggle moved to chip row above */}

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 inline-flex items-center px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id === 'all' ? '' : category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Sort moved to right controls for better layout */}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 order-3 sm:order-1 flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <span className="hidden sm:inline">{t('search.showing')} </span>{getFilteredServices().length} <span className="hidden sm:inline">{t('search.results')}</span>
              </span>
              {selectedRating > 0 && (
                <span className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 text-xs transition-all duration-200">
                  {t('search.rating') || 'Rating'}: {selectedRating}★
                </span>
              )}
              {selectedDistance > 0 && (
                <span className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 text-xs transition-all duration-200">
                  ≤ {selectedDistance} km
                </span>
              )}
              {(priceRange.min > 0 || priceRange.max < 1000) && (
                <span className="inline-flex items-center gap-1 h-7 px-2 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 text-xs transition-all duration-200">
                  ₴{priceRange.min}–₴{priceRange.max}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 order-2 sm:order-2">
              {/* Inline sort control for better UX */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 inline-flex items-center px-3 sm:px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
              >
                <option value="rating">{t('search.sortBy.rating')}</option>
                <option value="price">{t('search.sortBy.price')}</option>
                <option value="distance">{t('search.sortBy.distance')}</option>
                <option value="reviews">{t('search.sortBy.reviews')}</option>
              </select>
              {/* Always-visible Filters button */}
              <button
                onClick={() => setIsFilterTrayOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <FunnelIcon className="w-4 h-4" />
                {t('search.filters') || 'Filters'}
              </button>
              {(selectedCategory || selectedLocation || selectedRating > 0 || selectedDistance > 0 || showFavoritesOnly || priceRange.min > 0 || priceRange.max < 1000) && (
                <button
                  onClick={clearFilters}
                  className="hidden sm:inline-flex items-center gap-2 h-10 px-3 rounded-full border border-red-200 text-red-700 hover:bg-red-50"
                  title={t('search.resetFilters') || 'Reset filters'}
                >
                  {t('search.resetFilters') || 'Reset filters'}
                </button>
              )}
            </div>
            <div className="flex items-center space-x-1 order-1 sm:order-3">
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
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterTrayOpen(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl animate-slide-in-right p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('search.filters') || 'Filters'}</h3>
                <div className="flex items-center gap-3">
                  {(selectedCategory || selectedLocation || selectedRating > 0 || selectedDistance > 0 || showFavoritesOnly || priceRange.min > 0 || priceRange.max < 1000) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      {t('search.resetFilters') || 'Reset filters'}
                    </button>
                  )}
                  <button onClick={() => setIsFilterTrayOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus-visible-ring" aria-label="Close filters">✕</button>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.category') || 'Category'}</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id === 'all' ? '' : category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.priceRange') || 'Price Range'}</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      onClick={() => setPriceRange({ min: 0, max: 25 })}
                      className="px-3 py-1.5 rounded-full text-sm border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('search.price.under25') || 'Under ₴25'}
                    </button>
                    <button onClick={() => setPriceRange({ min: 25, max: 50 })} className="px-3 py-1.5 rounded-full text-sm border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">₴25-₴50</button>
                    <button onClick={() => setPriceRange({ min: 50, max: 100 })} className="px-3 py-1.5 rounded-full text-sm border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">₴50-₴100</button>
                    <button onClick={() => setPriceRange({ min: 100, max: 200 })} className="px-3 py-1.5 rounded-full text-sm border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">₴100-₴200</button>
                    <button onClick={() => setPriceRange({ min: 200, max: 1000 })} className="px-3 py-1.5 rounded-full text-sm border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">{t('search.price.over200') || 'Over ₴200'}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('search.minPrice') || 'Min'}</label>
                      <input
                        type="number"
                        min={0}
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('search.maxPrice') || 'Max'}</label>
                      <input
                        type="number"
                        min={0}
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.location') || 'Location'}</label>
                  <input
                    type="text"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    placeholder={t('search.locationPlaceholder') || 'City or area'}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.sortBy.title') || 'Sort by'}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
                  >
                    <option value="rating">{t('search.sortBy.rating')}</option>
                    <option value="price">{t('search.sortBy.price')}</option>
                    <option value="distance">{t('search.sortBy.distance')}</option>
                    <option value="reviews">{t('search.sortBy.reviews')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.minimumRating') || 'Minimum rating'}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={selectedRating}
                      onChange={(e) => setSelectedRating(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-8 text-right">{selectedRating}★</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.distance') || 'Distance (km)'}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={5}
                      value={selectedDistance}
                      onChange={(e) => setSelectedDistance(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-16 text-right">{selectedDistance > 0 ? `≤ ${selectedDistance} km` : t('common.any') || 'Any'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('search.favoritesOnly') || 'Favorites only'}</span>
                  <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showFavoritesOnly ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showFavoritesOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button className="btn btn-secondary flex-1 h-10" onClick={() => setIsFilterTrayOpen(false)}>
                  {t('actions.close') || 'Close'}
                </button>
                <button className="btn btn-primary flex-1 h-10" onClick={() => setIsFilterTrayOpen(false)}>
                  {t('actions.apply') || 'Apply'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : getFilteredServices().length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {getFilteredServices().map(renderServiceCard)}
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default SearchPage;
