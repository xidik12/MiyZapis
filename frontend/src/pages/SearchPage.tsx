import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { specialistService } from '../services';
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
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

interface Specialist {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    avatar?: string;
    isVerified: boolean;
  };
  businessName: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  isOnline: boolean;
  responseTime: string;
  completedBookings: number;
  experience: string;
  description: string;
}

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  // State
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [selectedRating, setSelectedRating] = useState(0);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Categories
  const categories = [
    { id: 'all', name: t('category.all') },
    { id: 'beauty-wellness', name: t('category.beautyWellness') },
    { id: 'health-fitness', name: t('category.healthFitness') },
    { id: 'education', name: t('category.education') },
    { id: 'home-services', name: t('category.homeServices') },
    { id: 'automotive', name: t('category.automotive') },
    { id: 'technology', name: t('category.technology') },
  ];

  // Fetch specialists from API
  useEffect(() => {
    const fetchSpecialists = async () => {
      try {
        setLoading(true);
        const data = await specialistService.searchSpecialists(searchQuery, {
          location: selectedLocation,
          rating: selectedRating,
        });
        setSpecialists(data.specialists || []);
        setFilteredSpecialists(data.specialists || []);
      } catch (error) {
        console.error('Error fetching specialists:', error);
        setSpecialists([]);
        setFilteredSpecialists([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialists();
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

  const renderSpecialistCard = (specialist: Specialist) => (
    <div
      key={specialist.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img
            src={specialist.user.avatar || '/images/default-avatar.jpg'}
            alt={`${specialist.user.firstName} ${specialist.user.lastName}`}
            className="w-16 h-16 rounded-full object-cover"
          />
          {specialist.user.isVerified && (
            <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-6 h-6 text-primary-600 bg-white rounded-full" />
          )}
          {specialist.isOnline && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {specialist.user.firstName} {specialist.user.lastName}
            </h3>
            <div className="flex items-center space-x-1">
              {renderStars(specialist.rating)}
              <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                {specialist.rating} ({specialist.reviewCount})
              </span>
            </div>
          </div>

          <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
            {specialist.businessName}
          </p>

          <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span className="mr-4">{specialist.location}</span>
            <ClockIcon className="w-4 h-4 mr-1" />
            <span>{t('specialist.responseTime')}: {specialist.responseTime && specialist.responseTime !== '0' ? specialist.responseTime : (language === 'uk' ? 'Зазвичай протягом дня' : language === 'ru' ? 'Обычно в течение дня' : 'Usually within a day')}</span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
            {specialist.description}
          </p>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {specialist.completedBookings} {t('specialist.completedJobs')} • {specialist.experience}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('pricing.from')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {specialist.priceFrom ? formatPrice(specialist.priceFrom, 'UAH') : (language === 'uk' ? 'За домовленістю' : language === 'ru' ? 'По договорённости' : 'By agreement')}
              </p>
            </div>
          </div>

          <div className="flex space-x-3 mt-4">
            <Link
              to={`/specialist/${specialist.id}`}
              className="flex-1 bg-primary-600 text-white text-center py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              {t('actions.viewProfile')}
            </Link>
            <Link
              to={`/booking/${specialist.id}`}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-center py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
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
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              {t('search.filters')}
            </button>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
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
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
            >
              <option value="rating">{t('search.sortBy.rating')}</option>
              <option value="price">{t('search.sortBy.price')}</option>
              <option value="experience">{t('search.sortBy.experience')}</option>
              <option value="reviews">{t('search.sortBy.reviews')}</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('search.showing')} {filteredSpecialists.length} {t('search.results')}
            </span>
            <div className="flex items-center space-x-1 ml-4">
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
        ) : filteredSpecialists.length > 0 ? (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredSpecialists.map(renderSpecialistCard)}
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
              {t('search.clearFilters')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;