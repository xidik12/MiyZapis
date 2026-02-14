import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Star,
  MapPin,
  Clock,
  DollarSign,
  Grid3X3,
  List,
  X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import {
  fetchServicesAsync,
  fetchCategoriesAsync,
  setFilters,
  clearFilters,
} from '@/store/slices/servicesSlice';
import { useLocale, t } from '@/hooks/useLocale';
import { searchStrings, commonStrings, serviceDetailStrings, specialistServicesStrings } from '@/utils/translations';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const {
    services,
    categories,
    isLoading,
    categoriesLoading,
    pagination,
    filters,
  } = useSelector((state: RootState) => state.services);

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('q') || ''
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    sort: searchParams.get('sort') || 'popular',
    rating: '',
  });

  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    dispatch(fetchCategoriesAsync());
    performSearch();
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, filters]);

  const performSearch = () => {
    const searchFilters = {
      search: searchQuery,
      ...filters,
      page: 1,
      limit: 20,
    };

    dispatch(fetchServicesAsync(searchFilters));
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleApplyFilters = () => {
    const newFilters: any = {};

    if (localFilters.category) newFilters.category = localFilters.category;
    if (localFilters.minPrice) newFilters.minPrice = Number(localFilters.minPrice);
    if (localFilters.maxPrice) newFilters.maxPrice = Number(localFilters.maxPrice);
    if (localFilters.sort) newFilters.sort = localFilters.sort;
    if (localFilters.rating) newFilters.rating = Number(localFilters.rating);

    dispatch(setFilters(newFilters));
    setShowFilters(false);
    hapticFeedback.impactLight();
  };

  const handleClearFilters = () => {
    setLocalFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'popular',
      rating: '',
    });
    dispatch(clearFilters());
    hapticFeedback.selectionChanged();
  };

  const handleServicePress = (service: any) => {
    navigate(`/service/${service.id}`);
    hapticFeedback.impactLight();
  };

  const handleCategorySelect = (categoryName: string) => {
    setLocalFilters(prev => ({ ...prev, category: categoryName }));
  };

  const ServiceCard: React.FC<{ service: any; mode: 'grid' | 'list' }> = ({
    service,
    mode,
  }) => {
    if (mode === 'list') {
      return (
        <Card
          hover
          onClick={() => handleServicePress(service)}
          className="mb-3"
        >
          <div className="flex gap-3">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-bg-hover flex-shrink-0">
              <img
                src={service.images?.[0] || '/api/placeholder/80/80'}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-text-primary truncate">{service.name}</h3>
              <p className="text-sm text-text-secondary mb-1">{service.specialist.name}</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-accent-yellow fill-current" />
                  <span className="text-sm font-medium">{service.specialist.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} className="text-text-secondary" />
                  <span className="text-sm text-text-secondary">{service.duration}{t(commonStrings, 'min', locale)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-accent-primary">${service.price}</span>
                <Button size="sm">{t(serviceDetailStrings, 'bookNow', locale)}</Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card
        hover
        onClick={() => handleServicePress(service)}
        className="h-full"
      >
        <div className="aspect-square bg-bg-hover rounded-lg mb-3 overflow-hidden">
          <img
            src={service.images?.[0] || '/api/placeholder/200/200'}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-text-primary text-sm">{service.name}</h3>
            <p className="text-xs text-text-secondary">{service.specialist.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star size={10} className="text-accent-yellow fill-current" />
              <span className="text-xs font-medium">{service.specialist.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-text-secondary" />
              <span className="text-xs text-text-secondary">{service.duration}{t(commonStrings, 'min', locale)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-accent-primary">${service.price}</span>
            <Button size="sm" className="text-xs px-2 py-1">{t(serviceDetailStrings, 'bookNow', locale)}</Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={t(searchStrings, 'searchServices', locale)}
        showBackButton
        rightContent={
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 touch-manipulation relative"
          >
            <SlidersHorizontal size={20} className="text-text-secondary" />
            {Object.keys(filters).length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-primary rounded-full" />
            )}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Search Bar */}
        <div className="px-4 py-3 bg-bg-secondary sticky top-0 z-10">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                placeholder={t(searchStrings, 'searchServices', locale)}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 touch-manipulation"
            >
              {viewMode === 'grid' ? (
                <List size={20} className="text-text-secondary" />
              ) : (
                <Grid3X3 size={20} className="text-text-secondary" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {Object.keys(filters).length > 0 && (
          <div className="px-4 py-2">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-accent-primary text-white rounded-full text-xs"
                >
                  {key}: {String(value)}
                  <button
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key as keyof typeof filters];
                      dispatch(setFilters(newFilters));
                    }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearFilters}
                className="text-xs text-accent-primary underline"
              >
                {t(commonStrings, 'clearAll', locale)}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary mb-2">{t(searchStrings, 'noServices', locale)}</p>
              <p className="text-sm text-text-secondary">
                {t(searchStrings, 'tryDifferent', locale)}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-text-secondary">
                  {pagination.total} {t(searchStrings, 'resultsFound', locale)}
                </p>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} mode="grid" />
                  ))}
                </div>
              ) : (
                <div>
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} mode="list" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Filters Sheet */}
      <Sheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={t(searchStrings, 'filters', locale)}
      >
        <div className="space-y-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-3">{t(searchStrings, 'category', locale)}</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.name)}
                  className={`p-3 rounded-lg border text-left ${
                    localFilters.category === category.name
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-semibold mb-3">{t(searchStrings, 'priceRange', locale)}</h3>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder={t(specialistServicesStrings, 'price', locale) + ' (min)'}
                type="number"
                value={localFilters.minPrice}
                onChange={(e) =>
                  setLocalFilters(prev => ({ ...prev, minPrice: e.target.value }))
                }
                icon={<DollarSign size={18} />}
              />
              <Input
                placeholder={t(specialistServicesStrings, 'price', locale) + ' (max)'}
                type="number"
                value={localFilters.maxPrice}
                onChange={(e) =>
                  setLocalFilters(prev => ({ ...prev, maxPrice: e.target.value }))
                }
                icon={<DollarSign size={18} />}
              />
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="font-semibold mb-3">{t(searchStrings, 'sortBy', locale)}</h3>
            <div className="space-y-2">
              {[
                { value: 'popular', label: t(searchStrings, 'mostPopular', locale) },
                { value: 'price_asc', label: t(searchStrings, 'priceLowToHigh', locale) },
                { value: 'price_desc', label: t(searchStrings, 'priceHighToLow', locale) },
                { value: 'rating', label: t(searchStrings, 'highestRated', locale) },
                { value: 'newest', label: t(searchStrings, 'newest', locale) },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalFilters(prev => ({ ...prev, sort: option.value }))
                  }
                  className={`w-full p-3 rounded-lg border text-left ${
                    localFilters.sort === option.value
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-white/5'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="font-semibold mb-3">{t(searchStrings, 'minimumRating', locale)}</h3>
            <div className="flex gap-2">
              {[4, 4.5, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    setLocalFilters(prev => ({ ...prev, rating: rating.toString() }))
                  }
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg border ${
                    localFilters.rating === rating.toString()
                      ? 'border-accent-primary bg-accent-primary/10'
                      : 'border-white/5'
                  }`}
                >
                  <Star size={14} className="text-accent-yellow fill-current" />
                  <span className="text-sm">{rating}+</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleClearFilters}
              className="flex-1"
            >
              {t(commonStrings, 'clearAll', locale)}
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              {t(searchStrings, 'applyFilters', locale)}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
