import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCurrency } from '../contexts/CurrencyContext';
// Mock data removed - now using real API data
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

// Temporary mock data until backend integration is complete
const mockCustomerData = {
  favoriteSpecialists: [
    {
      id: '1',
      name: 'Олена Іванова',
      service: 'Перукар-стиліст',
      rating: 4.9,
      bookings: 3,
      avatar: '/images/specialist-avatar-1.jpg',
      description: 'Професійний перукар з 8-річним досвідом роботи',
      location: 'Київ, Печерський район',
      price: 800,
      verified: true,
      responseTime: '~15 хв',
      completedBookings: 245,
      experience: '8 років'
    },
    {
      id: '2',
      name: 'Марія Петрова',
      service: 'Масажист',
      rating: 4.8,
      bookings: 2,
      avatar: '/images/specialist-avatar-2.jpg',
      description: 'Сертифікований масажист з медичною освітою',
      location: 'Київ, Шевченківський район',
      price: 600,
      verified: true,
      responseTime: '~20 хв',
      completedBookings: 189,
      experience: '5 років'
    }
  ]
};

const SpecialistProfilePage: React.FC = () => {
  const { specialistId } = useParams();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isFavorite, setIsFavorite] = useState(false);

  // Find specialist from mock data or use first one as default
  const specialist = mockCustomerData.favoriteSpecialists.find(s => s.id === specialistId) 
    || mockCustomerData.favoriteSpecialists[0];

  // Mock reviews data
  const reviews = [
    {
      id: '1',
      customerName: 'Олена К.',
      rating: 5,
      date: '2025-08-10',
      comment: 'Чудовий спеціаліст! Дуже професійний підхід та приємне спілкування. Рекомендую!',
    },
    {
      id: '2',
      customerName: 'Максим П.',
      rating: 5,
      date: '2025-08-05',
      comment: 'Завжди пунктуальний та якісно виконує свою роботу. Буду звертатися ще.',
    },
    {
      id: '3',
      customerName: 'Анна В.',
      rating: 4,
      date: '2025-07-28',
      comment: 'Все пройшло добре, результат задовольняє. Дякую!',
    },
  ];

  // Mock services data
  const services = [
    {
      id: '1',
      name: t('specialistProfile.individualConsultation'),
      description: t('specialistProfile.personalConsultation60min'),
      price: 800,
      duration: '60 ' + t('specialistProfile.minutes'),
    },
    {
      id: '2',
      name: t('specialistProfile.expressConsultation'),
      description: t('specialistProfile.shortTermConsultation'),
      price: 500,
      duration: '30 ' + t('specialistProfile.minutes'),
    },
    {
      id: '3',
      name: t('specialistProfile.familyConsultation'),
      description: t('specialistProfile.familyConsultation90min'),
      price: 1200,
      duration: '90 ' + t('specialistProfile.minutes'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-surface rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-4xl">
                  {specialist.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="mt-6 lg:mt-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {specialist.name}
                    </h1>
                    {specialist.isVerified && (
                      <CheckBadgeIcon className="w-8 h-8 text-primary-500" />
                    )}
                  </div>
                  <p className="text-xl text-gray-600 dark:text-gray-400 mt-1">
                    {specialist.profession}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-1">
                      <StarIconSolid className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {specialist.rating}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        ({specialist.reviewCount} {t('dashboard.reviews')})
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {specialist.location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {t('specialistProfile.respondsIn')} {specialist.responseTime} {t('specialistProfile.minutes')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {isFavorite ? (
                      <HeartIconSolid className="w-6 h-6 text-red-500" />
                    ) : (
                      <HeartIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                  <button className="p-3 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <ShareIcon className="w-6 h-6 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {specialist.completedJobs}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('specialistProfile.completedJobs')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {specialist.yearsExperience}+
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('specialistProfile.yearsExperience')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {specialist.isOnline ? t('specialistProfile.online') : t('specialistProfile.offline')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('specialistProfile.status')}
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  {t('specialistProfile.specialization')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {specialist.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Services */}
            <div className="bg-surface rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {t('specialistProfile.services')}
              </h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="border-surface rounded-xl p-4 bg-surface-hover transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {service.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {formatPrice(service.price, 'UAH')}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {service.duration}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={`/book/${service.id}`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        {t('specialistProfile.bookService')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-surface rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('specialistProfile.reviews')} ({reviews.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIconSolid
                        key={star}
                        className="w-5 h-5 text-yellow-400"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {specialist.rating} {t('specialistProfile.outOf5')}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {review.customerName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {review.customerName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {review.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIconSolid
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Booking card */}
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('specialistProfile.bookService')}
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {t('specialistProfile.fromPrice')} {formatPrice(specialist.priceFrom, specialist.currency)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t('specialistProfile.forConsultation')}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Link
                    to="/search"
                    className="w-full flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                  >
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    {t('specialistProfile.bookConsultation')}
                  </Link>
                  
                  <button className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                    {t('specialistProfile.sendMessage')}
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>{t('specialistProfile.responseTime')}</span>
                      <span>{specialist.responseTime} {t('specialistProfile.minutes')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('specialistProfile.completedJobs')}:</span>
                      <span>{specialist.completedJobs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t('specialistProfile.experience')}</span>
                      <span>{specialist.yearsExperience} {t('specialistProfile.years')}</span>
                    </div>
                  </div>
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