import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { bookingService } from '@/services/booking.service';
import { favoritesService } from '@/services/favorites.service';
import { reviewsService } from '@/services/reviews.service';
import { messagesService } from '@/services/messages.service';
import { loyaltyService, UserLoyalty, LoyaltyStats } from '@/services/loyalty.service';
import { translateProfession } from '@/utils/profession';
import { formatPoints } from '@/utils/formatPoints';
import WalletBalance from '@/components/wallet/WalletBalance';
import TrialStatusBanner from '@/components/trial/TrialStatusBanner';
// Status colors for bookings
const statusColors = {
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  inProgress: 'bg-purple-100 text-purple-800 border-purple-200',
  noShow: 'bg-gray-100 text-gray-800 border-gray-200'
};
import { CalendarIcon, HeartIcon, CreditCardIcon, StarIcon, UserGroupIcon, ClockIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, GiftIcon, MagnifyingGlassIcon, EyeIcon, ChatBubbleLeftRightIcon, MapPinIcon, ChartBarIcon, PlusIcon, BookOpenIcon, WarningIcon as ExclamationTriangleIcon } from '@/components/icons';
import { PageLoader } from '@/components/ui';
// Note: Use active prop for filled icons: <Icon active />
;

// Interface definitions for type safety
interface CustomerStats {
  totalSpent: number;
  loyaltyPoints: number;
  lifetimePoints: number;
  currentTier: string;
  nextTierPoints: number;
  monthlyPoints: number;
  savedAmount: number;
  servicesUsed: number;
  completedBookings: number;
  totalBookings: number;
  averageRating: number;
  favoriteSpecialists: number;
  reviewsWritten: number;
}

interface NextAppointment {
  serviceName: string;
  specialistName: string;
  date: string;
  time: string;
  type: 'online' | 'offline';
  location?: string;
}

interface RecentBooking {
  id: string;
  specialistName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'completed' | 'confirmed' | 'pending' | 'cancelled';
  amount: number;
  currency?: 'USD' | 'EUR' | 'UAH';
}

interface FavoriteSpecialist {
  id: string;
  name: string;
  service: string;
  rating: number;
  bookings: number;
  specialistUserId?: string;
  specialistId?: string;
}

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  expiryDate: string;
}

const CustomerDashboard: React.FC = () => {
  const user = useAppSelector(selectUser);
  const { formatPrice, normalizeMixedCurrencyAmount, currency, getCurrencySymbol } = useCurrency();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // State management for dashboard data
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [favoriteSpecialists, setFavoriteSpecialists] = useState<FavoriteSpecialist[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [loyaltyData, setLoyaltyData] = useState<UserLoyalty | null>(null);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [favoritesHasMore, setFavoritesHasMore] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data (customer)
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);

        // Fetch essential data first, then optional data with timeout protection
        const essentialPromise = Promise.allSettled([
          bookingService.getBookings({ limit: 10, status: 'confirmed,pending,inProgress' as any }, 'customer'),
          bookingService.getBookings({ limit: 5, status: 'COMPLETED' as any }, 'customer'),
          bookingService.getBookings({ limit: 1 }, 'customer'),
        ]);

        const optionalPromise = Promise.allSettled([
          favoritesService.getFavoritesCount().catch(() => ({ specialists: 0, services: 0 })),
          reviewsService.getMyReviews(1, 100).catch(() => ({ reviews: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: 100, hasNext: false, hasPrev: false } } as any)),
          favoritesService.getFavoriteSpecialists(1, 6).catch(() => ({ specialists: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: 6, hasNext: false, hasPrev: false } } as any)),
          messagesService.getUnreadCount().catch(() => ({ count: 0 })),
          loyaltyService.getUserLoyalty().catch(() => null),
          loyaltyService.getLoyaltyStats().catch(() => null),
        ]);

        // Wait for essential data with timeout
        const essentialResults = await Promise.race([
          essentialPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Essential data timeout')), 10000))
        ]);

        const [upcomingResult, completedResult, allResult] = essentialResults;
        const upcomingRes = upcomingResult.status === 'fulfilled' ? upcomingResult.value : { bookings: [] };
        const completedRes = completedResult.status === 'fulfilled' ? completedResult.value : { bookings: [] };
        const allRes = allResult.status === 'fulfilled' ? allResult.value : { pagination: { total: 0 } };

        // Wait for optional data with timeout (don't fail if this times out)
        const optionalResults = await Promise.race([
          optionalPromise,
          new Promise(resolve => setTimeout(() => resolve([
            { status: 'rejected' as const, reason: 'timeout' },
            { status: 'rejected' as const, reason: 'timeout' },
            { status: 'rejected' as const, reason: 'timeout' },
            { status: 'rejected' as const, reason: 'timeout' },
            { status: 'rejected' as const, reason: 'timeout' },
            { status: 'rejected' as const, reason: 'timeout' },
          ]), 5000))
        ]) as PromiseSettledResult<any>[];

        const [favoritesCountResult, myReviewsResult, favSpecsResult, unreadResult, loyaltyProfileResult, loyaltyStatsResult] = optionalResults;

        const favoritesCount = favoritesCountResult.status === 'fulfilled' ? favoritesCountResult.value : { specialists: 0, services: 0 };
        const myReviews = myReviewsResult.status === 'fulfilled' ? myReviewsResult.value : { reviews: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: 100, hasNext: false, hasPrev: false } };
        const favSpecs = favSpecsResult.status === 'fulfilled' ? favSpecsResult.value : { specialists: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: 6, hasNext: false, hasPrev: false } };
        const unread = unreadResult.status === 'fulfilled' ? unreadResult.value : { count: 0 };
        const loyaltyProfile = loyaltyProfileResult.status === 'fulfilled' ? loyaltyProfileResult.value : null;
        const loyaltyStatsData = loyaltyStatsResult.status === 'fulfilled' ? loyaltyStatsResult.value : null;

        // Set loyalty data
        setLoyaltyData(loyaltyProfile);
        setLoyaltyStats(loyaltyStatsData);

        // Next appointment (earliest upcoming)
        const upcomingBookings = Array.isArray(upcomingRes.bookings) ? upcomingRes.bookings : [];
        const upcomingSorted = [...upcomingBookings].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        const next = upcomingSorted[0];
        setNextAppointment(next ? {
          serviceName: next.service?.name || next.serviceName || 'Service',
          specialistName: next.specialist ? `${next.specialist.firstName || ''} ${next.specialist.lastName || ''}`.trim() : next.specialistName || 'Specialist',
          date: new Date(next.scheduledAt).toLocaleDateString(),
          time: new Date(next.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: next.meetingLink ? 'online' : 'offline',
          location: next.location || undefined,
        } : null);

        // Recent completed bookings
        const completedBookings = Array.isArray(completedRes.bookings) ? completedRes.bookings : [];
        const recent = completedBookings.map((b) => ({
          id: b.id,
          specialistName: b.specialist ? `${b.specialist.firstName || ''} ${b.specialist.lastName || ''}`.trim() : b.specialistName || 'Specialist',
          serviceName: b.service?.name || b.serviceName || 'Service',
          date: new Date(b.scheduledAt).toLocaleDateString(),
          time: new Date(b.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'completed' as const,
          amount: b.totalAmount || 0,
          currency: (b.service?.currency as 'USD' | 'EUR' | 'UAH') || 'USD',
        }));
        setRecentBookings(recent);

        // Stats (basic derived)
        const totalSpent = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const servicesUsed = new Set(completedBookings.map((b) => b.service?.id || b.serviceId)).size;
        // Reviews written and average rating from my reviews endpoint
        const myReviewsList = (myReviews as any)?.reviews || [];
        const reviewsWritten = myReviewsList.length;
        const averageRating = reviewsWritten > 0 ? (myReviewsList.reduce((s: number, r: Record<string, unknown>) => s + (Number(r.rating) || 0), 0) / reviewsWritten) : 0;
        setStats({
          totalSpent,
          loyaltyPoints: loyaltyProfile?.currentPoints || 0,
          lifetimePoints: loyaltyProfile?.lifetimePoints || 0,
          currentTier: loyaltyStatsData?.currentTier?.name || 'Bronze',
          nextTierPoints: loyaltyStatsData?.pointsToNextTier || 0,
          monthlyPoints: loyaltyStatsData?.monthlyPoints || 0,
          savedAmount: 0,
          servicesUsed,
          completedBookings: completedBookings.length,
          totalBookings: allRes.pagination?.total || completedBookings.length + upcomingBookings.length,
          averageRating,
          favoriteSpecialists: (favoritesCount as any).specialists || 0,
          reviewsWritten,
        });

        // Map first page of favorite specialists
        const favPage = favSpecs as any;
        const favSimple = (favPage.specialists || []).map((fs: Record<string, unknown>) => {
          const s = fs.specialist;
          const fullName = `${s?.user?.firstName || ''} ${s?.user?.lastName || ''}`.trim();
          return {
            id: s?.id || fs.id,
            name: fullName || translateProfession(s?.businessName, t) || (s?.businessName || 'Specialist'),
            service: translateProfession(s?.businessName, t) || (s?.businessName || ''),
            rating: s?.rating || 0,
            bookings: s?.reviewCount || 0,
            specialistUserId: s?.user?.id,
            specialistId: s?.id,
          } as FavoriteSpecialist;
        });
        setFavoriteSpecialists(favSimple);
        setFavoritesPage(favPage.pagination?.currentPage || 1);
        setFavoritesHasMore(Boolean(favPage.pagination?.hasNext || (favPage.pagination?.currentPage || 1) < (favPage.pagination?.totalPages || 1)));
        setSpecialOffers([]);
        // Unread messages
        setUnreadMessages((unread as any).count || 0);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const loadFavoritesPage = async (page: number) => {
    try {
      setFavoritesLoading(true);
      const res = await favoritesService.getFavoriteSpecialists(page, 6);
      const favSimple = res.specialists.map((fs: Record<string, unknown>) => {
        const s = fs.specialist;
        const fullName = `${s?.user?.firstName || ''} ${s?.user?.lastName || ''}`.trim();
        return {
          id: s?.id || fs.id,
          name: fullName || s?.businessName || 'Specialist',
          service: s?.businessName || '',
          rating: s?.rating || 0,
          bookings: s?.reviewCount || 0,
          specialistUserId: s?.user?.id,
          specialistId: s?.id,
        } as FavoriteSpecialist;
      });
      setFavoriteSpecialists(prev => page === 1 ? favSimple : [...prev, ...favSimple]);
      setFavoritesPage(res.pagination.currentPage);
      setFavoritesHasMore(Boolean(res.pagination.hasNext || res.pagination.currentPage < res.pagination.totalPages));
    } catch (e) {
      // noop
    } finally {
      setFavoritesLoading(false);
    }
  };

  const handleLoadMoreFavorites = async () => {
    if (favoritesHasMore && !favoritesLoading) {
      await loadFavoritesPage(favoritesPage + 1);
    } else {
      navigate('/customer/favorites');
    }
  };

  const handleMessageFavorite = async (fav: FavoriteSpecialist) => {
    try {
      if (!fav.specialistUserId) {
        navigate('/customer/messages');
        return;
      }
      // Create or reuse conversation, then navigate with query to focus it
      let conversationId: string | null = null;
      try {
        const conv = await messagesService.createConversation({ participantId: fav.specialistUserId });
        conversationId = conv.id;
      } catch (err) {
        // Fallback: find existing
        try {
          const list = await messagesService.getConversations(1, 50);
          const existing = list.conversations.find(c => c.specialist?.id === fav.specialistUserId);
          if (existing) conversationId = existing.id;
        } catch {}
      }
      if (conversationId) {
        navigate(`/customer/messages?conversationId=${conversationId}`);
        toast.success(t('specialistProfile.sendMessage') || 'Message');
      } else {
        navigate('/customer/messages');
        toast.info(t('messages.noConversations') || 'No conversations yet');
      }
    } catch {
      navigate('/customer/messages');
      toast.error(t('messages.startConversationError') || 'Failed to start conversation');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('dashboard.welcome.morning');
    if (hour < 17) return t('dashboard.welcome.afternoon');
    return t('dashboard.welcome.evening');
  };

  if (loading) {
    return <PageLoader text={t('dashboard.loading')} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.pending;
  };

  const getStatusText = (status: string) => {
    return t(`dashboard.booking.status.${status}` as any) || status;
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, iconBg, description }: { title: string; value: string | number; change?: string; changeType?: string; icon: React.ElementType; iconBg: string; description?: string }) => (
    <div className="bg-surface rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
          {change && (
            <div className={`flex items-center mt-2 text-xs sm:text-sm ${
              changeType === 'positive' ? 'text-success-600' : 'text-error-600'
            }`}>
              {changeType === 'positive' ? (
                <ArrowTrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              )}
              <span className="truncate">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${iconBg} flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {getGreeting()}, {user?.firstName}! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('dashboard.today')} {currentTime.toLocaleDateString(
                  language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US',
                  { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }
                )}
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Link
                to="/search"
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('dashboard.customer.findSpecialists')}
              </Link>
              <Link
                to="/customer/bookings"
                className="inline-flex items-center justify-center px-4 py-2 bg-surface-hover border-surface rounded-xl transition-all duration-200 font-medium text-secondary-content text-sm sm:text-base"
              >
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t('dashboard.nav.bookings')}
              </Link>
            </div>
          </div>

          {/* Trial Status Banner */}
          <TrialStatusBanner
            trialStartDate={user?.trialStartDate}
            trialEndDate={user?.trialEndDate}
            isInTrial={user?.isInTrial}
            userType="customer"
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title={t('dashboard.customer.totalSpent')}
              value={stats ? formatPrice(stats.totalSpent) : `${getCurrencySymbol()}0`}
              change={`+15% ${t('dashboard.specialist.thisMonthImprovement')}`}
              changeType="positive"
              icon={CreditCardIcon}
              iconBg="bg-gradient-to-br from-primary-500 to-primary-600"
              description={t('dashboard.specialist.allTime')}
            />
            <StatCard
              title={t('dashboard.customer.loyaltyPoints')}
              value={stats ? stats.loyaltyPoints.toLocaleString() : '0'}
              change={`+${stats?.monthlyPoints || 0} this month`}
              changeType="positive"
              icon={GiftIcon}
              iconBg="bg-gradient-to-br from-purple-500 to-purple-600"
              description={`${stats?.currentTier || 'Bronze'} Tier • ${stats?.nextTierPoints || 0} to next`}
              onClick={() => navigate('/loyalty')}
            />
            <StatCard
              title={t('dashboard.customer.servicesUsed')}
              value={stats ? stats.servicesUsed : 0}
              change={`${stats ? stats.completedBookings : 0}/${stats ? stats.totalBookings : 0} ${t('dashboard.booking.status.completed').toLowerCase()}`}
              changeType="positive"
              icon={StarIcon}
              iconBg="bg-gradient-to-br from-warning-500 to-warning-600"
              description={`${stats ? stats.averageRating : 0}/5.0 ${t('dashboard.customer.averageRating').toLowerCase()}`}
            />
          <StatCard
            title={t('dashboard.customer.favoriteSpecialists')}
            value={stats ? stats.favoriteSpecialists : 0}
            change={`${stats ? stats.reviewsWritten : 0} ${t('dashboard.nav.reviews').toLowerCase()}`}
            changeType="positive"
            icon={HeartIcon}
            iconBg="bg-gradient-to-br from-info-500 to-info-600"
            description={`${t('dashboard.customer.memberSince')} 2024`}
          />
            <StatCard
              title={t('dashboard.customer.unreadMessages')}
              value={unreadMessages}
              change={undefined}
              changeType="positive"
              icon={ChatBubbleLeftRightIcon}
              iconBg="bg-gradient-to-br from-secondary-500 to-secondary-600"
              description={t('dashboard.specialist.allTime')}
            />
        </div>

          {/* Next Appointment Banner */}
          {nextAppointment && (
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{t('dashboard.customer.nextAppointment')}</h3>
                  <div className="space-y-1">
                    <p className="text-primary-100 text-sm sm:text-base">{nextAppointment.serviceName}</p>
                    <p className="text-xs sm:text-sm text-primary-200">
                      {language === 'uk' ? 'з' : language === 'ru' ? 'с' : 'with'} {nextAppointment.specialistName}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-primary-200">
                      <span className="flex items-center whitespace-nowrap">
                        <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {nextAppointment.date}
                      </span>
                      <span className="flex items-center whitespace-nowrap">
                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {nextAppointment.time}
                      </span>
                      <span className="flex items-center">
                        <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="truncate max-w-[120px] sm:max-w-none">
                          {nextAppointment.type === 'online' 
                            ? t('dashboard.specialist.online')
                            : nextAppointment.location
                          }
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="sm:text-right">
                  <Link
                    to="/customer/bookings"
                    className="inline-flex items-center justify-center w-full sm:w-auto px-3 sm:px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl transition-colors font-medium text-sm sm:text-base"
                  >
                    {t('dashboard.viewAll')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Wallet Balance */}
            <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('wallet.title')}</h3>
                <Link
                  to="/customer/wallet"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                >
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <WalletBalance
                showTransactions={true}
                onTransactionsClick={() => navigate('/customer/wallet')}
              />
            </div>
            {/* Recent Bookings */}
            <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.customer.recentBookings')}</h3>
                <Link
                  to="/customer/bookings"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                >
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {recentBookings.slice(0, 4).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {booking.specialistName?.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{booking.specialistName}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{booking.serviceName}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {booking.date} {language === 'uk' ? 'о' : language === 'ru' ? 'в' : 'at'} {booking.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                        {formatPrice(booking.amount || 0, booking.currency || 'USD')}
                      </p>
                      <span className={`inline-block px-2 py-0.5 sm:py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {recentBookings.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BookOpenIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('dashboard.customer.noBookings')}</p>
                  <p className="text-sm">{t('dashboard.customer.startBooking')}</p>
                  <Link
                    to="/search"
                    className="inline-flex items-center mt-4 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    {t('dashboard.customer.exploreServices')}
                  </Link>
                </div>
              )}
            </div>

            {/* Favorite Specialists */}
            <div className="bg-surface rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.customer.favoriteSpecialists')}</h3>
                <button
                  onClick={handleLoadMoreFavorites}
                  disabled={favoritesLoading}
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium disabled:opacity-50"
                >
                  {t('dashboard.viewAll')}
                </button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {favoriteSpecialists.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                  <HeartIcon className="w-12 h-12 mx-auto mb-3 opacity-50" active />
                  <p>{t('customer.favorites.noSpecialists')}</p>
                  <Link 
                    to="/search" 
                    className="text-primary-600 dark:text-primary-400 text-sm hover:underline mt-2 inline-block"
                  >
                    {t('dashboard.customer.exploreServices')}
                  </Link>
                </div>
              ) : (
                favoriteSpecialists.map((specialist) => (
                  <div key={specialist.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {(specialist.name || 'S').split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{specialist.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{specialist.service}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <span className="flex items-center">
                            <StarIcon className="w-3 h-3 mr-1 text-warning-500" />
                            {specialist.rating}
                          </span>
                          <span>•</span>
                          <span>{specialist.bookings} {t('dashboard.nav.reviews').toLowerCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
                      <Link
                        to={`/specialist/${specialist.id}`}
                        className="p-1 sm:p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-xl transition-colors"
                      >
                        <EyeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Link>
                      <button
                        onClick={() => handleMessageFavorite(specialist)}
                        className="p-1 sm:p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        title={t('specialistProfile.sendMessage')}
                      >
                        <ChatBubbleLeftRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
              {favoritesLoading && (
                <div className="text-center py-3 text-sm text-gray-500">{t('common.loading')}</div>
              )}
              </div>
            </div>
          </div>

          {/* Loyalty Progress */}
          {loyaltyData && loyaltyStats && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-200 dark:border-purple-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" active />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.loyalty.progressTitle')}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {loyaltyStats.currentTier?.name || 'Bronze'} {t('dashboard.loyalty.member')}
                    </p>
                  </div>
                </div>
                <Link
                  to="/loyalty"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium"
                >
                  {t('dashboard.viewAll')}
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl">
                  <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatPoints(loyaltyData?.currentPoints || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('dashboard.loyalty.currentPoints')}</p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl">
                  <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatPoints(loyaltyStats.monthlyPoints)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('dashboard.loyalty.thisMonth')}</p>
                </div>

                <div className="text-center p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl">
                  <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPoints(loyaltyData?.lifetimePoints || 0)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('dashboard.loyalty.lifetimePoints')}</p>
                </div>
              </div>

              {loyaltyStats.nextTier && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('dashboard.loyalty.progressTo')} {loyaltyStats.nextTier.name}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {loyaltyStats.pointsToNextTier} {t('dashboard.loyalty.pointsNeeded')}
                    </span>
                  </div>
                  <div className="overflow-hidden h-3 mb-2 text-xs flex rounded-full bg-purple-200 dark:bg-purple-800">
                    <div
                      style={{
                        width: `${(() => {
                          const pts = loyaltyData?.currentPoints || 0;
                          const curMin = loyaltyStats?.currentTier?.minPoints || 0;
                          const nextMin = loyaltyStats?.nextTier?.minPoints || 0;
                          const range = nextMin - curMin;
                          return range > 0 ? Math.min(100, Math.max(0, ((pts - curMin) / range) * 100)) : 0;
                        })()}%`
                      }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="truncate">{loyaltyStats.currentTier?.name}</span>
                    <span className="truncate">{loyaltyStats.nextTier.name}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special Offers */}
          {specialOffers && specialOffers.length > 0 && (
            <div className="bg-surface rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.customer.specialOffers')}</h3>
                <GiftIcon className="w-5 h-5 text-primary-600" active />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {specialOffers.map((offer) => (
                  <div key={offer.id} className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded-full">
                        -{offer.discount}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {language === 'uk' ? 'до' : language === 'ru' ? 'до' : 'until'} {offer.validUntil}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{offer.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{offer.description}</p>
                    <button className="w-full px-3 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium">
                      {t('dashboard.customer.viewOffers')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
    </div>
  );
};

export default CustomerDashboard;
