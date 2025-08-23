import React, { useState, useEffect } from 'react';
import { StarIcon, ChatBubbleLeftIcon, UserIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useLanguage } from '../../contexts/LanguageContext';
// Removed SpecialistPageWrapper - layout is handled by SpecialistLayout

const SpecialistReviews: React.FC = () => {
  const { t, language } = useLanguage();
  
  // Initialize with empty data for new accounts
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({
    overallRating: 0,
    totalReviews: 0
  });

  // Load reviews from API
  useEffect(() => {
    const loadReviewsData = async () => {
      try {
        // For now, keep empty data for new accounts
        // TODO: Integrate with real reviews API when backend is ready
        console.log('Reviews data would be loaded from API here');
        
        // Real data should come from: await reviewsService.getReviews();
      } catch (err: any) {
        console.error('Error loading reviews:', err);
      }
    };

    loadReviewsData();
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <StarIconSolid
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-warning-500' : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const { overallRating, totalReviews } = reviewStats;

  return (
    
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('reviews.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('reviews.subtitle')}</p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {overallRating}
            </div>
            <div className="flex items-center justify-center space-x-1 mb-2">
              {renderStars(Math.round(overallRating))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('reviews.overallRating').replace('{count}', totalReviews.toString())}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-4xl font-bold text-success-600 mb-2">96%</div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('reviews.positiveReviews')}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-success-600 h-2 rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 mb-2">15</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('reviews.averageResponseTime')}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('reviews.recentReviews')}</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {reviews.map((review) => (
            <div key={review.id} className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">
                    {review.customerName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {review.customerName}
                      </h4>
                      {review.verified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                          ✓ {t('reviews.verified')}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(review.date).toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 mb-2">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {t('reviews.forService').replace('{service}', review.service)}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>
                  
                  <button className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 text-sm font-medium">
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    <span>{t('reviews.reply')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 text-center border-t border-gray-200 dark:border-gray-700">
          <button className="text-primary-600 hover:text-primary-700 font-medium">
            {t('reviews.showMore')}
          </button>
        </div>
      </div>
      </div>
    
  );
};

export default SpecialistReviews;