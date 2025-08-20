import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { 
  HeartIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface FavoriteSpecialist {
  id: string;
  name: string;
  profession: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  location: string;
  responseTime: string;
  priceFrom: number;
  isOnline: boolean;
  isVerified: boolean;
}

interface FavoriteService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  images: string[];
  specialist: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
  };
}

const CustomerFavorites: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [favoriteSpecialists, setFavoriteSpecialists] = useState<FavoriteSpecialist[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specialists' | 'services'>('specialists');

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setIsLoading(true);
        
        // TODO: Implement actual API calls when backend is ready
        // const [specialistsResponse, servicesResponse] = await Promise.all([
        //   favoritesApi.getFavoriteSpecialists(),
        //   favoritesApi.getFavoriteServices()
        // ]);
        // setFavoriteSpecialists(specialistsResponse.data);
        // setFavoriteServices(servicesResponse.data);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Initialize with empty arrays for new users
        setFavoriteSpecialists([]);
        setFavoriteServices([]);
      } catch (error) {
        console.error('Failed to fetch favorites:', error);
        // Set empty arrays on error
        setFavoriteSpecialists([]);
        setFavoriteServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveSpecialist = async (specialistId: string) => {
    try {
      // TODO: Implement API call to remove specialist from favorites
      // await favoritesApi.removeSpecialistFromFavorites(specialistId);
      
      setFavoriteSpecialists(prev => prev.filter(s => s.id !== specialistId));
    } catch (error) {
      console.error('Failed to remove specialist from favorites:', error);
      // TODO: Show error message to user
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    try {
      // TODO: Implement API call to remove service from favorites
      // await favoritesApi.removeServiceFromFavorites(serviceId);
      
      setFavoriteServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Failed to remove service from favorites:', error);
      // TODO: Show error message to user
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

  if (isLoading) {
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
                    {tab.key === 'specialists' ? favoriteSpecialists.length : favoriteServices.length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Specialists Tab */}
        {activeTab === 'specialists' && (
          <>
            {favoriteSpecialists.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteSpecialists.map((specialist) => (
                  <div key={specialist.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Header with favorite button */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
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
                                <span className="text-blue-600 text-xs">✓</span>
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
                        <button
                          onClick={() => handleRemoveSpecialist(specialist.id)}
                          className="text-red-500 hover:text-red-700"
                          title={t('customer.favorites.removeFromFavorites')}
                        >
                          <HeartIconSolid className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Rating and Reviews */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex items-center space-x-1">
                          <StarIconSolid className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {specialist.rating}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          ({specialist.reviewCount} {t('specialist.reviews')})
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <span>{specialist.location}</span>
                      </div>

                      {/* Response Time */}
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{t('specialist.responseTime')}: {specialist.responseTime}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {t('currency.from')} {formatPrice(specialist.priceFrom)}
                        </div>
                      </div>

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
                ))}
              </div>
            )}
          </>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <>
            {favoriteServices.length === 0 ? (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteServices.map((service) => (
                  <div key={service.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                    {/* Service Image */}
                    <div className="relative">
                      <img
                        src={service.images[0]}
                        alt={service.name}
                        className="w-full h-48 object-cover"
                      />
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
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {service.description}
                      </p>

                      {/* Specialist Info */}
                      <div className="flex items-center space-x-2 mb-4">
                        <img
                          src={service.specialist.avatar}
                          alt={service.specialist.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {service.specialist.name}
                          </p>
                          <div className="flex items-center">
                            <StarIconSolid className="h-3 w-3 text-yellow-400 mr-1" />
                            <span className="text-xs text-gray-600">{service.specialist.rating}</span>
                          </div>
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
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerFavorites;
