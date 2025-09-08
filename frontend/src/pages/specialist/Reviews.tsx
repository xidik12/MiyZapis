import React, { useState, useEffect } from 'react';
import { StarIcon, ChatBubbleLeftIcon, UserIcon, HeartIcon, FlagIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useLanguage } from '../../contexts/LanguageContext';
import { reviewsService, Review, ReviewStats } from '../../services/reviews.service';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { specialistService } from '../../services/specialist.service';

const SpecialistReviews: React.FC = () => {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState({
    rating: undefined as number | undefined,
    sortBy: 'createdAt' as 'createdAt' | 'rating' | 'helpful',
    sortOrder: 'desc' as 'asc' | 'desc',
    withComment: undefined as boolean | undefined,
    verified: undefined as boolean | undefined
  });
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Load specialist profile to get specialist ID
  useEffect(() => {
    const loadSpecialistProfile = async () => {
      try {
        console.log('🔍 [Reviews] Loading specialist profile...');
        const profile = await specialistService.getProfile();
        console.log('✅ [Reviews] Specialist profile loaded:', profile);
        
        // The API returns { specialist: { id: ... } }, so we need to extract the specialist object
        const specialistData = profile.specialist || profile;
        console.log('🔧 [Reviews] Extracted specialist data:', specialistData);
        console.log('🆔 [Reviews] Specialist ID:', specialistData.id);
        setSpecialistId(specialistData.id);
      } catch (err: any) {
        console.error('❌ [Reviews] Error loading specialist profile:', err);
        setError(err.message || 'Failed to load specialist profile');
      }
    };

    loadSpecialistProfile();
  }, []);

  // Load reviews
  useEffect(() => {
    const loadReviews = async () => {
      // Don't load reviews until we have the specialist ID
      if (!specialistId) {
        console.log('⏳ [Reviews] Waiting for specialist ID...');
        return;
      }
      
      try {
        console.log('📊 [Reviews] Loading reviews for specialist:', specialistId);
        console.log('📄 [Reviews] Parameters:', { page, filters });
        setLoading(true);
        setError(null);
        
        const response = await reviewsService.getSpecialistReviews(
          specialistId, 
          page, 
          20, 
          {
            rating: filters.rating,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            withComment: filters.withComment,
            verified: filters.verified
          }
        );
        
        console.log('✅ [Reviews] Reviews loaded successfully:', response);
        console.log('🔍 [Reviews] Response structure analysis:');
        console.log('  - response.reviews:', response.reviews);
        console.log('  - response.data:', response.data);
        console.log('  - response.stats:', response.stats);
        console.log('  - response.pagination:', response.pagination);
        
        // Handle different possible response structures
        const reviewsData = response.reviews || [];
        const statsData = response.stats || null;
        const paginationData = response.pagination || null;

        // Normalize stats to avoid NaN/undefined in UI and derive missing fields
        const totalReviews = statsData?.totalReviews ?? reviewsData.length ?? 0;
        const averageRating = Number.isFinite(statsData?.averageRating) 
          ? (statsData!.averageRating as number) 
          : (reviewsData.length > 0 
              ? reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsData.length 
              : 0);
        const ratingDistribution = statsData?.ratingDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        const verifiedReviewsCount = (statsData as any)?.verifiedReviewsCount ?? reviewsData.filter(r => r.isVerified).length;
        const recommendedCount = (ratingDistribution[4] || 0) + (ratingDistribution[5] || 0);
        const recommendationRate = totalReviews > 0 ? (recommendedCount / totalReviews) : 0;
        
        console.log('📊 [Reviews] Processed review count:', reviewsData.length);
        console.log('📈 [Reviews] Processed stats:', statsData);
        console.log('📄 [Reviews] Processed pagination:', paginationData);
        
        if (page === 1) {
          setReviews(reviewsData);
        } else {
          setReviews(prev => [...prev, ...reviewsData]);
        }
        // Set normalized stats (based on current response/meta)
        const baseStats: ReviewStats = {
          totalReviews,
          averageRating,
          ratingDistribution,
          verifiedReviewsCount,
          recommendationRate,
        } as any;
        setReviewStats(baseStats);

        // For page 1, try to enhance stats via dedicated endpoint for accuracy
        if (page === 1) {
          try {
            const fullStats = await reviewsService.getSpecialistReviewStats(specialistId);
            // Ensure no NaN values
            const safeFullStats: ReviewStats = {
              totalReviews: fullStats.totalReviews ?? baseStats.totalReviews,
              averageRating: Number.isFinite(fullStats.averageRating) ? fullStats.averageRating : baseStats.averageRating,
              ratingDistribution: fullStats.ratingDistribution || baseStats.ratingDistribution,
              verifiedReviewsCount: fullStats.verifiedReviewsCount ?? baseStats.verifiedReviewsCount,
              recommendationRate: Number.isFinite(fullStats.recommendationRate) ? fullStats.recommendationRate : baseStats.recommendationRate,
            } as any;
            setReviewStats(safeFullStats);
          } catch (e) {
            // Ignore if stats endpoint fails
          }
        }
        setHasMore(paginationData?.hasNext || false);
        
      } catch (err: any) {
        console.error('❌ [Reviews] Error loading reviews:', err);
        setError(err.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadReviews();
  }, [specialistId, page, filters]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleMarkHelpful = async (reviewId: string, helpful: boolean) => {
    try {
      await reviewsService.markReviewHelpful(reviewId, helpful);
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { 
              ...review, 
              isHelpful: helpful,
              helpfulCount: helpful 
                ? review.helpfulCount + 1 
                : Math.max(0, review.helpfulCount - 1)
            }
          : review
      ));
    } catch (err: any) {
      console.error('Error marking review as helpful:', err);
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim() || submittingResponse) return;

    try {
      setSubmittingResponse(true);
      const response = await reviewsService.respondToReview(reviewId, responseText.trim());
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, response: response.response }
          : review
      ));
      
      setRespondingTo(null);
      setResponseText('');
    } catch (err: any) {
      console.error('Error responding to review:', err);
      setError(err.message || 'Failed to respond to review');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <StarIconSolid className={`${sizeClasses[size]} text-yellow-400`} />
            ) : (
              <StarIcon className={`${sizeClasses[size]} text-gray-300`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 5: return { en: 'Excellent', uk: 'Відмінно', ru: 'Отлично' }[language];
      case 4: return { en: 'Good', uk: 'Добре', ru: 'Хорошо' }[language];
      case 3: return { en: 'Average', uk: 'Середньо', ru: 'Средне' }[language];
      case 2: return { en: 'Poor', uk: 'Погано', ru: 'Плохо' }[language];
      case 1: return { en: 'Terrible', uk: 'Жахливо', ru: 'Ужасно' }[language];
      default: return '';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600';
    if (rating === 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && page === 1) {
    return <FullScreenHandshakeLoader title={t('common.loading')} subtitle={t('reviews.subtitle')} />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.nav.reviews')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('reviews.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Statistics Overview */}
      {reviewStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reviews.totalReviews')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviewStats.totalReviews}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                <ChatBubbleLeftIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reviews.averageRating')}</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {reviewStats.averageRating.toFixed(1)}
                  </p>
                  <div className="flex items-center">
                    <StarIconSolid className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-full">
                <StarIconSolid className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reviews.verifiedReviews')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviewStats.verifiedReviewsCount}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                <UserIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('reviews.recommendationRate')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(reviewStats.recommendationRate * 100).toFixed(0)}%
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-full">
                <HeartIconSolid className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {reviewStats && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reviews.ratingDistribution')}</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution];
              const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 w-16">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
                    <StarIconSolid className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('reviews.filters')}</h3>
        <div className="flex flex-wrap gap-4">
          <select
            value={filters.rating || ''}
            onChange={(e) => handleFilterChange({...filters, rating: e.target.value ? Number(e.target.value) : undefined})}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('reviews.allRatings')}</option>
            <option value="5">5 {t('reviews.stars')}</option>
            <option value="4">4 {t('reviews.stars')}</option>
            <option value="3">3 {t('reviews.stars')}</option>
            <option value="2">2 {t('reviews.stars')}</option>
            <option value="1">1 {t('reviews.star')}</option>
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange({...filters, sortBy: e.target.value as any})}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="createdAt">{t('reviews.sortBy.newest')}</option>
            <option value="rating">{t('reviews.sortBy.rating')}</option>
            <option value="helpful">{t('reviews.sortBy.helpful')}</option>
          </select>

          <button
            onClick={() => handleFilterChange({...filters, verified: filters.verified ? undefined : true})}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.verified
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {t('reviews.verifiedOnly')}
          </button>

          <button
            onClick={() => handleFilterChange({...filters, withComment: filters.withComment ? undefined : true})}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              filters.withComment
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {t('reviews.withComments')}
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <ChatBubbleLeftIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('reviews.noReviews')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('reviews.noReviewsDescription')}
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {review.customer.avatar ? (
                    <img 
                      src={review.customer.avatar} 
                      alt={`${review.customer.firstName} ${review.customer.lastName}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {review.customer.firstName[0]}{review.customer.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {review.customer.firstName} {review.customer.lastName}
                      </h4>
                      {review.isVerified && (
                        <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
                          {t('reviews.verified')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {renderStars(review.rating, 'sm')}
                      <span className={`text-sm font-medium ${getRatingColor(review.rating)}`}>
                        {getRatingText(review.rating)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">•</span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMarkHelpful(review.id, !review.isHelpful)}
                    className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                  >
                    {review.isHelpful ? (
                      <HeartIconSolid className="w-4 h-4 text-red-500" />
                    ) : (
                      <HeartIcon className="w-4 h-4" />
                    )}
                    <span className="text-sm">{review.helpfulCount}</span>
                  </button>
                </div>
              </div>

              {review.service && (
                <div className="mb-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('reviews.forService')}: 
                    <span className="font-medium text-gray-900 dark:text-white ml-1">
                      {review.service.name}
                    </span>
                  </span>
                </div>
              )}

              {review.comment && (
                <div className="mb-4">
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </div>
              )}

              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {review.tags.map((tag, index) => (
                    <span key={index} className="bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-xs px-2 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Specialist Response */}
              {review.response ? (
                <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('reviews.yourResponse')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(review.response.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {review.response.message}
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  {respondingTo === review.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={t('reviews.writeResponse')}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                        rows={3}
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSubmitResponse(review.id)}
                          disabled={!responseText.trim() || submittingResponse}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingResponse ? t('reviews.submitting') : t('reviews.submitResponse')}
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTo(null);
                            setResponseText('');
                          }}
                          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRespondingTo(review.id)}
                      className="text-primary-600 dark:text-primary-400 text-sm hover:underline"
                    >
                      {t('reviews.respond')}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('common.loading') : t('reviews.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
};

export default SpecialistReviews;
