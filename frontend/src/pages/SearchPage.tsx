import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { serviceService } from '../services';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
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

interface ServiceWithSpecialist {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  specialist: {
    id: string;
    user: {
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
  distance?: number;
  isAvailable: boolean;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const dispatch = useAppDispatch();
  const favoriteSpecialists = useAppSelector(selectFavoriteSpecialists);

  // State
  const [services, setServices] = useState<ServiceWithSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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
        };
        
        const data = await serviceService.searchServices(filters);
        
        // Transform the data to match our interface based on actual backend response
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
              firstName: service.specialist?.user?.firstName || '',
              lastName: service.specialist?.user?.lastName || '',
              avatar: service.specialist?.user?.avatar || service.specialist?.avatar || undefined,
              isVerified: service.specialist?.user?.isVerified || service.specialist?.isVerified || false
            },
            businessName: service.specialist?.businessName || '',
            location: '', // Backend doesn't seem to have location info yet
            isOnline: true, // Assume online for now
            responseTime: service.specialist?.responseTime || '', // Use response time if available
            completedBookings: service.specialist?.completedBookings || service.specialist?.totalBookings || 0, // Use actual completed bookings count
            experience: '', // Not available in backend response
            rating: service.specialist?.rating || 0
          },
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

  const renderServiceCard = (service: ServiceWithSpecialist) => (
    <div
      key={service.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
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
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
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
            {service.specialist.businessName} • {service.specialist.user.firstName} {service.specialist.user.lastName}
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

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {service.specialist.completedBookings} {t('specialist.completedJobs')} • {service.specialist.experience}
            </div>
            <div className="text-right">
              <div className={`text-xs px-2 py-1 rounded-full mb-1 ${service.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {service.isAvailable ? t('service.available') : t('service.unavailable')}
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(service.price)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            <Link
              to={`/specialist/${service.specialist.id}`}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              {t('actions.viewProfile')}
            </Link>
            <Link
              to={`/booking/${service.id}`}
              className={`flex-1 text-white text-center py-2 px-4 rounded-lg transition-colors text-sm font-medium ${
                service.isAvailable 
                  ? 'bg-primary-600 hover:bg-primary-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={(e) => !service.isAvailable && e.preventDefault()}
            >
              {t('actions.book')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`flex items-center px-3 sm:px-4 py-2 border rounded-lg transition-colors ${
                showFavoritesOnly
                  ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <HeartIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">
                {showFavoritesOnly ? t('search.showAll') : t('search.favorites')}
              </span>
            </button>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id === 'all' ? '' : category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white text-sm"
            >
              <option value="rating">{t('search.sortBy.rating')}</option>
              <option value="price">{t('search.sortBy.price')}</option>
              <option value="distance">{t('search.sortBy.distance')}</option>
              <option value="reviews">{t('search.sortBy.reviews')}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
              <span className="hidden sm:inline">{t('search.showing')} </span>{getFilteredServices().length} <span className="hidden sm:inline">{t('search.results')}</span>
            </span>
            <div className="flex items-center space-x-1 order-1 sm:order-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <ListBulletIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
            <button
              onClick={clearFilters}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('search.clearAll')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;