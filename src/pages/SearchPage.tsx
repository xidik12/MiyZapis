import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  MapIcon,
  ListBulletIcon,
  StarIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Specialist {
  id: string;
  name: string;
  profession: string;
  category: string;
  location: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  avatar: string;
  isVerified: boolean;
  isOnline: boolean;
  responseTime: string;
  completedJobs: number;
  yearsExperience: number;
  description: string;
}

// Mock data for specialists
const getMockSpecialists = (t: (key: string) => string): Specialist[] => [
  {
    id: '1',
    name: 'Олена Коваленко',
    profession: t('profession.hairStylistColorist'),
    category: 'beautyWellness',
    location: t('location.kyivPechersk'),
    rating: 4.9,
    reviewCount: 127,
    priceFrom: 150,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isOnline: true,
    responseTime: `10 ${t('time.minutes')}`,
    completedJobs: 234,
    yearsExperience: 8,
    description: 'Професійний перукар з 8-річним досвідом. Спеціалізуюся на сучасних стрижках та фарбуванні.'
  },
  {
    id: '2',
    name: 'Андрій Петренко',
    profession: t('profession.personalTrainer'),
    category: 'healthFitness',
    location: t('location.kyivShevchenko'),
    rating: 4.8,
    reviewCount: 89,
    priceFrom: 200,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isOnline: false,
    responseTime: `30 ${t('time.minutes')}`,
    completedJobs: 156,
    yearsExperience: 5,
    description: 'Сертифікований персональний тренер. Допомагаю досягти ваших фітнес-цілей безпечно та ефективно.'
  },
  {
    id: '3',
    name: 'Марія Іваненко',
    profession: t('profession.englishTutor'),
    category: 'education',
    location: t('location.kharkivKholodnohirsk'),
    rating: 5.0,
    reviewCount: 45,
    priceFrom: 120,
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isOnline: true,
    responseTime: `5 ${t('time.minutes')}`,
    completedJobs: 78,
    yearsExperience: 6,
    description: 'Викладач англійської мови з міжнародними сертифікатами. Онлайн та офлайн заняття.'
  },
  {
    id: '4',
    name: 'Сергій Мельник',
    profession: t('profession.plumber'),
    category: 'homeServices',
    location: t('location.lvivSykhiv'),
    rating: 4.7,
    reviewCount: 203,
    priceFrom: 80,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isOnline: false,
    responseTime: `1 ${t('time.hours')}`,
    completedJobs: 567,
    yearsExperience: 12,
    description: 'Досвідчений сантехнік. Усунення аварій, встановлення сантехніки, ремонт та обслуговування.'
  },
  {
    id: '5',
    name: 'Наталія Богданова',
    profession: t('profession.lawyer'),
    category: 'professional',
    location: t('location.dniproCentral'),
    rating: 4.9,
    reviewCount: 67,
    priceFrom: 300,
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isOnline: true,
    responseTime: `15 ${t('time.minutes')}`,
    completedJobs: 134,
    yearsExperience: 10,
    description: 'Юрист з 10-річним досвідом у сфері цивільного та корпоративного права. Консультації та супровід справ.'
  },
  {
    id: '6',
    name: 'Віктор Кравченко',
    profession: t('profession.webDeveloper'),
    category: 'technology',
    location: t('location.odesaPrymorskyy'),
    rating: 4.8,
    reviewCount: 91,
    priceFrom: 250,
    avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face',
    isVerified: true,
    isOnline: true,
    responseTime: `20 ${t('time.minutes')}`,
    completedJobs: 87,
    yearsExperience: 7,
    description: 'Full-stack розробник. Створення веб-сайтів, веб-додатків та мобільних застосунків.'
  }
];

const SearchPage: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedLocation, setSelectedLocation] = useState(searchParams.get('location') || '');
  const [selectedPriceRange, setSelectedPriceRange] = useState(searchParams.get('price') || '');
  const [selectedRating, setSelectedRating] = useState(searchParams.get('rating') || '');
  const [selectedAvailability, setSelectedAvailability] = useState(searchParams.get('availability') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isLoading, setIsLoading] = useState(false);
  
  // Results state
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(6);

  // Categories for filter
  const categories = [
    { value: '', label: t('search.filters.allCategories') },
    { value: 'beautyWellness', label: t('category.beautyWellness') },
    { value: 'healthFitness', label: t('category.healthFitness') },
    { value: 'homeServices', label: t('category.homeServices') },
    { value: 'professional', label: t('category.professional') },
    { value: 'education', label: t('category.education') },
    { value: 'technology', label: t('category.technology') }
  ];

  // Price ranges (dynamic based on currency)
  const { currency } = useCurrency();
  
  const priceRanges = (() => {
    if (currency === 'UAH') {
      return [
        { value: '', label: t('search.filters.anyPrice') },
        { value: 'under925', label: `До ₴925` },
        { value: '925to1850', label: `₴925 - ₴1,850` },
        { value: '1850to3700', label: `₴1,850 - ₴3,700` },
        { value: '3700to7400', label: `₴3,700 - ₴7,400` },
        { value: 'over7400', label: `Понад ₴7,400` }
      ];
    } else if (currency === 'USD') {
      return [
        { value: '', label: t('search.filters.anyPrice') },
        { value: 'under25', label: `Under $25` },
        { value: '25to50', label: `$25 - $50` },
        { value: '50to100', label: `$50 - $100` },
        { value: '100to200', label: `$100 - $200` },
        { value: 'over200', label: `Over $200` }
      ];
    } else { // EUR
      return [
        { value: '', label: t('search.filters.anyPrice') },
        { value: 'under23', label: `Under €23` },
        { value: '23to46', label: `€23 - €46` },
        { value: '46to93', label: `€46 - €93` },
        { value: '93to185', label: `€93 - €185` },
        { value: 'over185', label: `Over €185` }
      ];
    }
  })();

  // Rating options
  const ratingOptions = [
    { value: '', label: t('search.filters.anyRating') },
    { value: '4plus', label: t('search.rating.4plus') },
    { value: '4.5plus', label: t('search.rating.4.5plus') },
    { value: '5', label: t('search.rating.5') }
  ];

  // Availability options
  const availabilityOptions = [
    { value: '', label: 'Any Availability' },
    { value: 'now', label: t('search.filters.availableNow') },
    { value: 'today', label: t('search.filters.availableToday') },
    { value: 'week', label: t('search.filters.availableThisWeek') }
  ];

  // Sort options
  const sortOptions = [
    { value: 'relevance', label: t('search.sort.relevance') },
    { value: 'priceAsc', label: t('search.sort.priceAsc') },
    { value: 'priceDesc', label: t('search.sort.priceDesc') },
    { value: 'rating', label: t('search.sort.rating') },
    { value: 'distance', label: t('search.sort.distance') },
    { value: 'newest', label: t('search.sort.newest') },
    { value: 'reviews', label: t('search.sort.reviews') }
  ];

  // Filter and sort specialists
  useEffect(() => {
    setIsLoading(true);
    
    setTimeout(() => {
      const currentSpecialists = getMockSpecialists(t);
      let filtered = [...currentSpecialists];
      
      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter(specialist => 
          specialist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          specialist.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
          specialist.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by category
      if (selectedCategory) {
        filtered = filtered.filter(specialist => specialist.category === selectedCategory);
      }
      
      // Filter by price range
      if (selectedPriceRange) {
        filtered = filtered.filter(specialist => {
          const price = specialist.priceFrom; // Price is stored in UAH
          switch (selectedPriceRange) {
            // UAH ranges
            case 'under925': return price < 925;
            case '925to1850': return price >= 925 && price <= 1850;
            case '1850to3700': return price >= 1850 && price <= 3700;
            case '3700to7400': return price >= 3700 && price <= 7400;
            case 'over7400': return price > 7400;
            // USD ranges (converted to UAH for comparison)
            case 'under25': return price < 925; // ~$25 in UAH
            case '25to50': return price >= 925 && price <= 1850; // ~$25-50 in UAH
            case '50to100': return price >= 1850 && price <= 3700; // ~$50-100 in UAH
            case '100to200': return price >= 3700 && price <= 7400; // ~$100-200 in UAH
            case 'over200': return price > 7400; // ~$200+ in UAH
            // EUR ranges (converted to UAH for comparison)
            case 'under23': return price < 925; // ~€23 in UAH
            case '23to46': return price >= 925 && price <= 1850; // ~€23-46 in UAH
            case '46to93': return price >= 1850 && price <= 3700; // ~€46-93 in UAH
            case '93to185': return price >= 3700 && price <= 7400; // ~€93-185 in UAH
            case 'over185': return price > 7400; // ~€185+ in UAH
            default: return true;
          }
        });
      }
      
      // Filter by rating
      if (selectedRating) {
        filtered = filtered.filter(specialist => {
          switch (selectedRating) {
            case '4plus': return specialist.rating >= 4;
            case '4.5plus': return specialist.rating >= 4.5;
            case '5': return specialist.rating === 5;
            default: return true;
          }
        });
      }
      
      // Sort results
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'priceAsc': return a.priceFrom - b.priceFrom;
          case 'priceDesc': return b.priceFrom - a.priceFrom;
          case 'rating': return b.rating - a.rating;
          case 'reviews': return b.reviewCount - a.reviewCount;
          case 'newest': return b.yearsExperience - a.yearsExperience;
          case 'distance': return 0; // Would implement distance calculation
          default: return 0; // relevance
        }
      });
      
      setFilteredSpecialists(filtered);
      setIsLoading(false);
    }, 500); // Simulate loading delay
  }, [searchQuery, selectedCategory, selectedLocation, selectedPriceRange, selectedRating, selectedAvailability, sortBy, currency, t]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedLocation) params.set('location', selectedLocation);
    if (selectedPriceRange) params.set('price', selectedPriceRange);
    if (selectedRating) params.set('rating', selectedRating);
    if (selectedAvailability) params.set('availability', selectedAvailability);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    
    setSearchParams(params);
  }, [searchQuery, selectedCategory, selectedLocation, selectedPriceRange, selectedRating, selectedAvailability, sortBy, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedPriceRange('');
    setSelectedRating('');
    setSelectedAvailability('');
    setSortBy('relevance');
    setCurrentPage(1);
  };

  const handleSpecialistClick = (specialistId: string) => {
    navigate(`/specialist/${specialistId}`);
  };

  // Pagination
  const totalResults = filteredSpecialists.length;
  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = filteredSpecialists.slice(startIndex, endIndex);

  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon
        key={i}
        className={`${size} ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('search.title')}</h1>
            <p className="text-gray-600">{t('search.subtitle')}</p>
          </div>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('search.searchPlaceholder')}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="ml-2 mr-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {t('search.searchButton')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FunnelIcon className="h-5 w-5 mr-2" />
                {t('search.filters.title')}
              </button>
            </div>

            {/* Filters */}
            <div className={`bg-white rounded-lg shadow p-6 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('search.filters.title')}</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {t('search.filters.clear')}
                </button>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.filters.category')}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.filters.priceRange')}
                </label>
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('search.filters.rating')}
                </label>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  {ratingOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">
                  {isLoading ? (
                    t('search.results.loading')
                  ) : (
                    `${t('search.results.showing')} ${startIndex + 1}-${Math.min(endIndex, totalResults)} ${t('search.results.of')} ${totalResults} ${t('search.results.results')}${searchQuery ? ` ${t('search.results.for')} "${searchQuery}"` : ''}`
                  )}
                </p>
              </div>

              <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                {/* Sort Dropdown */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600">{t('search.sort.title')}:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2 ${
                      viewMode === 'map'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MapIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">{t('search.results.loading')}</p>
              </div>
            ) : totalResults === 0 ? (
              <div className="text-center py-12">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('search.results.noResults')}</h3>
                <p className="text-gray-600 mb-4">{t('search.results.noResultsDesc')}</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {t('search.filters.clear')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentResults.map((specialist) => (
                  <div
                    key={specialist.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSpecialistClick(specialist.id)}
                  >
                    <div className="p-6">
                      {/* Specialist Header */}
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={specialist.avatar}
                          alt={specialist.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {specialist.name}
                            </h3>
                            {specialist.isVerified && (
                              <CheckBadgeIcon className="h-5 w-5 text-blue-600" />
                            )}
                            {specialist.isOnline && (
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {specialist.profession}
                          </p>
                        </div>
                      </div>

                      {/* Rating and Reviews */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center space-x-1">
                          {renderStars(specialist.rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {specialist.rating}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({specialist.reviewCount} {t('search.specialist.reviews')})
                        </span>
                      </div>

                      {/* Location */}
                      <p className="text-sm text-gray-600 mb-3">{specialist.location}</p>

                      {/* Stats */}
                      <div className="text-xs text-gray-500 space-y-1 mb-4">
                        <div>{specialist.completedJobs} {t('search.specialist.completedJobs')}</div>
                        <div>{specialist.yearsExperience} {t('search.specialist.yearsExperience')}</div>
                        <div>{t('search.specialist.responseTime')}: {specialist.responseTime}</div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-gray-900">
                          {t('currency.from')} {formatPrice(specialist.priceFrom)}
                        </div>
                        <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                          {t('search.specialist.bookNow')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border text-sm rounded-md ${
                      currentPage === page
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;