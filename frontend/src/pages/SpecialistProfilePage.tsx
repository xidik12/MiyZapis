import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { specialistService, reviewService } from '../services';
import {
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  ShareIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
} from '@heroicons/react/24/solid';
import { Avatar } from '../components/ui/Avatar';

const SpecialistProfilePage: React.FC = () => {
  const { specialistId } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [specialist, setSpecialist] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialistData = async () => {
      if (!specialistId) return;

      try {
        setLoading(true);
        
        // Fetch specialist profile
        const specialistData = await specialistService.getPublicProfile(specialistId);
        setSpecialist(specialistData);

        // Fetch specialist reviews with basic parameters
        try {
          const reviewsData = await reviewService.getSpecialistReviews(specialistId, {
            page: 1,
            limit: 10,
            sortBy: 'createdAt'
          });
          setReviews(reviewsData.reviews || []);
        } catch (reviewError) {
          console.warn('Failed to load reviews, continuing without them:', reviewError);
          setReviews([]);
        }

        // Fetch specialist services
        const servicesData = await specialistService.getSpecialistServices(specialistId);
        setServices(servicesData || []);

      } catch (error) {
        console.error('Error fetching specialist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialistData();
  }, [specialistId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('errors.specialistNotFound')}
          </h2>
          <Link 
            to="/search" 
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('navigation.backToSearch')}
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIconSolid
        key={i}
        className={`w-5 h-5 ${
          i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar
                  src={specialist.user?.avatar}
                  alt={specialist.user?.firstName || 'Specialist'}
                  size="xl"
                  className="border-4 border-white shadow-lg"
                  fallbackIcon={false}
                />
                {specialist.user?.isVerified && (
                  <CheckBadgeIcon className="absolute -bottom-1 -right-1 w-8 h-8 text-primary-600 bg-white rounded-full" />
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {specialist.user?.firstName} {specialist.user?.lastName}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {specialist.businessName}
                </p>
                
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {renderStars(specialist.rating || 0)}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {specialist.rating || 0} ({specialist.reviewCount || 0} {t('reviews.reviews')})
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  <span>{specialist.location || t('location.notSpecified')}</span>
                  <ClockIcon className="w-4 h-4 ml-4 mr-1" />
                  <span>{t('specialist.responseTime')}: {specialist.responseTime || 'N/A'} {t('time.minutes')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-6 md:mt-0">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  isFavorite
                    ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isFavorite ? (
                  <HeartIconSolid className="w-5 h-5 mr-2" />
                ) : (
                  <HeartIcon className="w-5 h-5 mr-2" />
                )}
                {t('actions.favorite')}
              </button>
              
              {services.length > 0 ? (
                <Link
                  to={`/book/${services[0]?.id}`}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                >
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  {t('actions.bookNow')}
                </Link>
              ) : (
                <div className="bg-gray-400 text-white px-6 py-2 rounded-lg cursor-not-allowed flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  {t('actions.noServicesAvailable') || 'No services available'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {t('specialist.about')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {specialist.description || t('specialist.noDescription')}
              </p>
              
              {specialist.specialties && specialist.specialties.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {t('specialist.specialties')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {specialist.specialties.map((specialty: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Services */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('specialist.services')}
              </h2>
              
              {services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service: any) => (
                    <div
                      key={service.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {service.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {service.description}
                          </p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span>{service.duration} {t('time.minutes')}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatPrice(service.price, service.currency)}
                          </p>
                          <Link
                            to={`/book/${service.id}`}
                            className="inline-block mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            {t('actions.book')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('specialist.noServices')}
                </p>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('reviews.title')} ({reviews.length})
              </h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.slice(0, 5).map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-4">
                        <Avatar
                          src={review.customer?.avatar}
                          alt={review.customer?.name || 'Customer'}
                          size="md"
                          lazy={true}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {review.customer?.name || t('reviews.anonymousUser')}
                            </h4>
                            <div className="flex items-center">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-gray-700 dark:text-gray-300 mt-2">
                            {review.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {t('reviews.noReviews')}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('specialist.contactInfo')}
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon className="w-4 h-4 mr-3" />
                  <span>{specialist.location || t('location.notSpecified')}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4 mr-3" />
                  <span>{t('specialist.responseTime')}: {specialist.responseTime || 'N/A'} {t('time.minutes')}</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('specialist.quickStats')}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('specialist.completedJobs')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {specialist.completedBookings || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('specialist.experience')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {specialist.experience || t('specialist.notSpecified')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('specialist.verified')}</span>
                  <span className={`font-semibold ${
                    specialist.user?.isVerified ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {specialist.user?.isVerified ? t('common.yes') : t('common.no')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistProfilePage;