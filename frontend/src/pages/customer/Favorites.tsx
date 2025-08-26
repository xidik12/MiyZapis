import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { favoritesService, FavoriteSpecialist, FavoriteService } from '../../services/favorites.service';
import { 
  HeartIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Avatar } from '../../components/ui/Avatar';
import { ServiceImage } from '../../components/ui/ServiceImage';
import { Pagination } from '@/types';

const CustomerFavorites: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [favoriteSpecialists, setFavoriteSpecialists] = useState<FavoriteSpecialist[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>([]);
  const [specialistsPagination, setSpecialistsPagination] = useState<Pagination | null>(null);
  const [servicesPagination, setServicesPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'specialists' | 'services'>('specialists');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchFavorites = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      if (activeTab === 'specialists') {
        const response = await favoritesService.getFavoriteSpecialists(page, 12);
        setFavoriteSpecialists(response.specialists);
        setSpecialistsPagination(response.pagination);
      } else {
        const response = await favoritesService.getFavoriteServices(page, 12);
        setFavoriteServices(response.services);
        setServicesPagination(response.pagination);
      }
    } catch (error: any) {
      console.error('Failed to fetch favorites:', error);
      setError(error.message || 'Failed to fetch favorites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchFavorites(1);
  }, [activeTab]);

  const handleRemoveSpecialist = async (specialistId: string) => {
    try {
      await favoritesService.removeSpecialistFromFavorites(specialistId);
      setFavoriteSpecialists(prev => prev.filter(s => s.specialist.id !== specialistId));
      
      // Update pagination if needed
      if (specialistsPagination && favoriteSpecialists.length === 1 && specialistsPagination.page > 1) {
        const newPage = specialistsPagination.page - 1;
        setCurrentPage(newPage);
        fetchFavorites(newPage);
      }
    } catch (error: any) {
      console.error('Failed to remove specialist from favorites:', error);
      setError(error.message || 'Failed to remove specialist from favorites');
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      await favoritesService.removeServiceFromFavorites(serviceId);
      setFavoriteServices(prev => prev.filter(s => s.service.id !== serviceId));
      
      // Update pagination if needed
      if (servicesPagination && favoriteServices.length === 1 && servicesPagination.page > 1) {
        const newPage = servicesPagination.page - 1;
        setCurrentPage(newPage);
        fetchFavorites(newPage);
      }
    } catch (error: any) {
      console.error('Failed to remove service from favorites:', error);
      setError(error.message || 'Failed to remove service from favorites');
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

  const renderPagination = (pagination: Pagination) => {
    if (pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-8">
        <div className="text-sm text-gray-700">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('customer.favorites.title')}
          </h1>
          <p className="text-gray-600">
            {t('customer.favorites.subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">{error}</div>
            <button
              onClick={() => fetchFavorites(currentPage)}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

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
                      (specialistsPagination?.total || 0) : 
                      (servicesPagination?.total || 0)
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
            {favoriteSpecialists.length === 0 && !isLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('customer.favorites.noSpecialists')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t('empty.startBrowsingSpecialists')}
                </p>
                <button
                  onClick={() => navigate('/search')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('empty.browseSpecialists')}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteSpecialists.map((favorite) => {
                    const specialist = favorite.specialist;
                    return (
                      <div key={favorite.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
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
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {specialist.businessName || `${specialist.user.firstName} ${specialist.user.lastName}`}
                                  </h3>
                                  {specialist.isVerified && (
                                    <span className="text-blue-600 text-xs">✓</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 truncate">
                                  {specialist.specialties.join(', ')}
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
                                <span className="text-sm font-medium text-gray-900">
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
                              <span>{specialist.experience} years experience</span>
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
                {specialistsPagination && renderPagination(specialistsPagination)}
              </>
            )}
          </>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <>
            {favoriteServices.length === 0 && !isLoading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('customer.favorites.noServices')}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t('empty.startBrowsingServices')}
                </p>
                <button
                  onClick={() => navigate('/search')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('empty.browseServices')}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteServices.map((favorite) => {
                    const service = favorite.service;
                    return (
                      <div key={favorite.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                        {/* Service Image */}
                        <div className="relative">
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">No image</span>
                          </div>
                          <button
                            onClick={() => handleRemoveService(service.id)}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md text-red-500 hover:text-red-700"
                            title={t('customer.favorites.removeFromFavorites')}
                          >
                            <HeartIconSolid className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="p-6">
                          {/* Service Info */}
                          <h3 className="font-semibold text-gray-900 mb-2 truncate">
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
                              <p className="text-sm font-medium text-gray-900 truncate">
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
                            <div className="text-lg font-semibold text-gray-900">
                              {formatPrice(service.price)}
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
                {servicesPagination && renderPagination(servicesPagination)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerFavorites;