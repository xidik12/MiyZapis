import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { FavoriteSpecialist, FavoriteService } from '../../services/favorites.service';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  selectFavorites, 
  selectFavoriteSpecialists, 
  selectFavoriteServices,
  selectFavoritesLoading,
  selectFavoritesError,
  fetchFavoriteSpecialists,
  fetchFavoriteServices,
  removeSpecialistFromFavorites,
  removeServiceFromFavorites,
  optimisticRemoveSpecialist,
  optimisticRemoveService,
  clearError
} from '../../store/slices/favoritesSlice';
import { HeartIcon, StarIcon, MapPinIcon, ClockIcon, UserIcon, TrashIcon, MagnifyingGlassIcon, XIcon as XMarkIcon } from '@/components/icons';
;
import { Avatar } from '../../components/ui/Avatar';
import { translateProfession } from '@/utils/profession';
import { ServiceImage } from '../../components/ui/ServiceImage';
import { Pagination } from '@/types';
// Note: Use active prop for filled icons: <Icon active />

const CustomerFavorites: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Redux state
  const favoritesState = useAppSelector(selectFavorites);
  const favoriteSpecialists = useAppSelector(selectFavoriteSpecialists);
  const favoriteServices = useAppSelector(selectFavoriteServices);
  const isLoading = useAppSelector(selectFavoritesLoading);
  const error = useAppSelector(selectFavoritesError);
  
  // Local state
  const [activeTab, setActiveTab] = useState<'specialists' | 'services'>('specialists');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFavorites = async (page: number = 1) => {
    try {
      if (activeTab === 'specialists') {
        dispatch(fetchFavoriteSpecialists({ page, limit: 12 }));
      } else {
        dispatch(fetchFavoriteServices({ page, limit: 12 }));
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchFavorites(1);
  }, [activeTab, dispatch]);

  const handleRemoveSpecialist = async (specialistId: string) => {
    try {
      // Optimistic update
      dispatch(optimisticRemoveSpecialist(specialistId));
      // Make API call
      await dispatch(removeSpecialistFromFavorites(specialistId)).unwrap();
      
      // Update pagination if needed - check if we need to go to previous page
      const currentFavorites = favoriteSpecialists.filter(s => s.specialist.id !== specialistId);
      if (currentFavorites.length === 0 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        fetchFavorites(newPage);
      }
    } catch (error: any) {
      console.error('Failed to remove specialist from favorites:', error);
      // The Redux slice will automatically revert optimistic updates on error
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      // Optimistic update
      dispatch(optimisticRemoveService(serviceId));
      // Make API call
      await dispatch(removeServiceFromFavorites(serviceId)).unwrap();
      
      // Update pagination if needed - check if we need to go to previous page
      const currentFavorites = favoriteServices.filter(s => s.service.id !== serviceId);
      if (currentFavorites.length === 0 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        fetchFavorites(newPage);
      }
    } catch (error: any) {
      console.error('Failed to remove service from favorites:', error);
      // The Redux slice will automatically revert optimistic updates on error
    }
  };

  const handleViewSpecialist = (specialistId: string) => {
    navigate(`/specialist/${specialistId}`);
  };

  const handleViewService = (serviceId: string) => {
    navigate(`/service/${serviceId}`);
  };

  const handleBookService = (serviceId: string) => {
    navigate(`/book/${serviceId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchFavorites(page);
  };

  // Filter specialists and services based on search query
  const filteredSpecialists = favoriteSpecialists.filter(favorite => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const specialist = favorite.specialist;
    const userName = `${specialist.user.firstName} ${specialist.user.lastName}`.toLowerCase();
    const businessName = specialist.businessName?.toLowerCase() || '';
    const specialties = specialist.specialties.join(' ').toLowerCase();
    const description = specialist.description?.toLowerCase() || '';
    
    return userName.includes(query) || 
           businessName.includes(query) || 
           specialties.includes(query) || 
           description.includes(query);
  });

  const filteredServices = favoriteServices.filter(favorite => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const service = favorite.service;
    const serviceName = service.name.toLowerCase();
    const serviceDescription = service.description?.toLowerCase() || '';
    const category = service.category.toLowerCase();
    const specialistName = `${service.specialist.user.firstName} ${service.specialist.user.lastName}`.toLowerCase();
    const businessName = service.specialist.businessName?.toLowerCase() || '';
    
    return serviceName.includes(query) ||
           serviceDescription.includes(query) ||
           category.includes(query) ||
           specialistName.includes(query) ||
           businessName.includes(query);
  });

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const renderPagination = (pagination: Pagination) => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-8">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPreviousPage}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 text-sm font-medium border rounded-md ${
                pagination.page === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('customer.favorites.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('customer.favorites.subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => fetchFavorites(currentPage)}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
              <button
                onClick={() => dispatch(clearError())}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('customer.favorites.searchPlaceholder') || `Search your ${activeTab}...`}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'specialists', label: t('customer.favorites.specialists') },
                { key: 'services', label: t('customer.favorites.services') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.key === 'specialists' ? 
                      (favoritesState.specialistsPagination?.total || 0) : 
                      (favoritesState.servicesPagination?.total || 0)
                    }
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Specialists Tab */}
        {activeTab === 'specialists' && (
          <>
            {filteredSpecialists.length === 0 && !isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {searchQuery ? 
                    `No specialists found for "${searchQuery}"` : 
                    (t('customer.favorites.noSpecialists') || 'No favorite specialists')
                  }
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? 
                    'Try adjusting your search terms or browse specialists to add favorites' :
                    (t('empty.startBrowsingSpecialists') || 'Start browsing specialists to add your favorites')
                  }
                </p>
                {searchQuery ? (
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleClearSearch}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700"
                    >
                      {t('search.clearSearch') || 'Clear search'}
                    </button>
                    <button
                      onClick={() => navigate('/search')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                    >
                      {t('empty.browseSpecialists') || 'Browse Specialists'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/search')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t('empty.browseSpecialists') || 'Browse Specialists'}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSpecialists.map((favorite) => {
                    const specialist = favorite.specialist;
                    return (
                      <div key={favorite.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                        <div className="p-6">
                          {/* Header with favorite button */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-3">
                              <Avatar
                                src={specialist.user.avatar}
                                alt={`${specialist.user.firstName} ${specialist.user.lastName}`}
                                size="lg"
                                lazy={true}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {translateProfession(specialist.businessName, t) || `${specialist.user.firstName} ${specialist.user.lastName}`}
                                  </h3>
                                  {specialist.isVerified && (
                                    <span className="text-blue-600 text-xs">✓</span>
                                  )}
                                </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {(() => {
                            let specs: any = specialist.specialties;
                            if (!specs) return null;
                            if (Array.isArray(specs)) return specs.join(', ');
                            if (typeof specs === 'string') {
                                      try {
                                        const parsed = JSON.parse(specs);
                                        return Array.isArray(parsed) ? parsed.join(', ') : specs;
                                      } catch {
                                        return specs;
                                      }
                                    }
                                    return String(specs);
                                  })()}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveSpecialist(specialist.id)}
                              className="text-red-500 hover:text-red-700"
                              title={t('customer.favorites.removeFromFavorites')}
                            >
                              <HeartIconSolid className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Rating and Reviews */}
                          {specialist.rating && (
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="flex items-center space-x-1">
                                <StarIconSolid className="h-4 w-4 text-yellow-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {specialist.rating.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">
                                ({specialist.reviewCount} {t('specialist.reviews')})
                              </span>
                            </div>
                          )}

                          {/* Location */}
                          {specialist.location && (
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              <span>{typeof specialist.location === 'string' ? specialist.location : specialist.location.city}</span>
                            </div>
                          )}

                          {/* Experience */}
                          {specialist.experience && (
                            <div className="flex items-center text-sm text-gray-600 mb-4">
                              <UserIcon className="h-4 w-4 mr-1" />
                              <span>{specialist.experience} {t('specialistProfile.years') || 'years'} {t('specialist.experience') || 'experience'}</span>
                            </div>
                          )}

                          {/* Description */}
                          {specialist.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {specialist.description}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewSpecialist(specialist.id)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              {t('action.viewProfile')}
                            </button>
                            <button
                              onClick={() => navigate(`/search?specialist=${specialist.id}`)}
                              className="flex-1 px-3 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                            >
                              {t('action.bookNow')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {favoritesState.specialistsPagination && renderPagination(favoritesState.specialistsPagination)}
              </>
            )}
          </>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <>
            {filteredServices.length === 0 && !isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {searchQuery ? 
                    `No services found for "${searchQuery}"` : 
                    (t('customer.favorites.noServices') || 'No favorite services')
                  }
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchQuery ? 
                    'Try adjusting your search terms or browse services to add favorites' :
                    (t('empty.startBrowsingServices') || 'Start browsing services to add your favorites')
                  }
                </p>
                {searchQuery ? (
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleClearSearch}
                      className="inline-flex items-center px-4 py-2 bg-gray-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700"
                    >
                      {t('search.clearSearch') || 'Clear search'}
                    </button>
                    <button
                      onClick={() => navigate('/search')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Browse Services
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/search')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t('empty.browseServices') || 'Browse Services'}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((favorite) => {
                    const service = favorite.service;
                    return (
                      <div key={favorite.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                        {/* Service Image */}
                        <div className="relative">
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No image</span>
                          </div>
                          <button
                            onClick={() => handleRemoveService(service.id)}
                            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md text-red-500 hover:text-red-700"
                            title={t('customer.favorites.removeFromFavorites')}
                          >
                            <HeartIconSolid className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="p-6">
                          {/* Service Info */}
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2 truncate">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                              {service.description}
                            </p>
                          )}

                          {/* Category */}
                          <div className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full mb-4">
                            {service.category}
                          </div>

                          {/* Specialist Info */}
                          <div className="flex items-center space-x-2 mb-4">
                            <Avatar
                              src={null}
                              alt={`${service.specialist.user.firstName} ${service.specialist.user.lastName}`}
                              size="sm"
                              lazy={true}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {service.specialist.businessName || 
                                 `${service.specialist.user.firstName} ${service.specialist.user.lastName}`}
                              </p>
                            </div>
                          </div>

                          {/* Duration and Price */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              <span>{service.duration} min</span>
                            </div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {formatPrice(service.price, (service.currency as 'USD' | 'EUR' | 'UAH') || 'UAH')}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewService(service.id)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              {t('action.viewDetails')}
                            </button>
                            <button
                              onClick={() => handleBookService(service.id)}
                              className="flex-1 px-3 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                            >
                              {t('action.bookNow')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {favoritesState.servicesPagination && renderPagination(favoritesState.servicesPagination)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerFavorites;
