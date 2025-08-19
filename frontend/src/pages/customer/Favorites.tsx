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

// Mock data for favorite specialists
const getMockFavoriteSpecialists = (t: (key: string) => string): FavoriteSpecialist[] => [
  {
    id: '1',
    name: 'Sarah Johnson',
    profession: t('profession.hairStylistColorist'),
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    rating: 4.9,
    reviewCount: 127,
    location: t('location.newYork'),
    responseTime: `10 ${t('time.minutes')}`,
    priceFrom: 1200,
    isOnline: true,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Michael Chen',
    profession: t('profession.personalTrainer'),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 4.8,
    reviewCount: 94,
    location: t('location.sanFrancisco'),
    responseTime: `15 ${t('time.minutes')}`,
    priceFrom: 800,
    isOnline: false,
    isVerified: true,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    profession: t('profession.businessConsultant'),
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 5.0,
    reviewCount: 76,
    location: t('location.austin'),
    responseTime: `5 ${t('time.minutes')}`,
    priceFrom: 2000,
    isOnline: true,
    isVerified: true,
  },
];

// Mock data for favorite services
const getMockFavoriteServices = (): FavoriteService[] => [
  {
    id: '1',
    name: 'Premium Hair Cut & Style',
    description: 'Professional hair cutting and styling service with consultation',
    price: 1200,
    duration: 90,
    category: 'Beauty & Wellness',
    images: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop'],
    specialist: {
      id: '1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      rating: 4.9,
    },
  },
  {
    id: '2',
    name: 'Personal Training Session',
    description: 'One-on-one fitness training session with personalized workout plan',
    price: 800,
    duration: 60,
    category: 'Health & Fitness',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop'],
    specialist: {
      id: '2',
      name: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      rating: 4.8,
    },
  },
];

const CustomerFavorites: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [favoriteSpecialists, setFavoriteSpecialists] = useState<FavoriteSpecialist[]>([]);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'specialists' | 'services'>('specialists');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFavoriteSpecialists(getMockFavoriteSpecialists(t));
      setFavoriteServices(getMockFavoriteServices());
      setIsLoading(false);
    }, 1000);
  }, [t]);

  const handleRemoveSpecialist = (specialistId: string) => {
    setFavoriteSpecialists(prev => prev.filter(s => s.id !== specialistId));
  };

  const handleRemoveService = (serviceId: string) => {
    setFavoriteServices(prev => prev.filter(s => s.id !== serviceId));
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
