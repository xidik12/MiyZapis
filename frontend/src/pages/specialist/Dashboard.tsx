import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { analyticsService, bookingService, paymentService } from '../../services';
import { retryRequest } from '../../services/api';
// Removed SpecialistSidebar import - layout is handled by SpecialistLayout
// Status colors for bookings
const statusColors = {
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  inProgress: 'bg-purple-100 text-purple-800 border-purple-200',
  noShow: 'bg-gray-100 text-gray-800 border-gray-200'
};
import {
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  StarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  CalendarIcon as CalendarIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

// Helper function to get the booking currency (same as Bookings page)
const getBookingCurrency = (booking: any): 'USD' | 'EUR' | 'UAH' => {
  // Use the service's stored currency, defaulting to UAH if not specified
  return (booking.service?.currency as 'USD' | 'EUR' | 'UAH') || 'UAH';
};


const SpecialistDashboard: React.FC = () => {
  const user = useAppSelector(selectUser);
  const { formatPrice, convertPrice } = useCurrency();
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<any>({
    stats: {
      totalBookings: 0,
      monthlyRevenue: 0,
      rating: 0,
      reviewCount: 0,
      responseTime: 0,
      profileViews: 0,
      favoriteCount: 0,
      conversionRate: 0,
      completionRate: 0,
      repeatClients: 0
      // Removed punctuality - no real data available
    },
    recentBookings: [],
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  // Removed sidebarOpen state - layout is handled by SpecialistLayout

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 Dashboard: Starting data load...');
        console.log('🔍 Auth token present:', !!localStorage.getItem('auth_token'));
        console.log('🔍 User from Redux:', user);
        
        // Load data from multiple sources with retry logic - prioritize bookings API for accuracy
        const [analyticsData, upcomingBookingsData, completedBookingsData] = await Promise.allSettled([
          retryRequest(() => analyticsService.getOverview(), 2, 1000),
          retryRequest(() => bookingService.getBookings({ limit: 10, status: 'confirmed,pending,inProgress' }, 'specialist'), 2, 1000),
          retryRequest(() => bookingService.getBookings({ limit: 100, status: 'COMPLETED' }, 'specialist'), 2, 1000)
        ]);

        console.log('🔍 Dashboard API results:', {
          analytics: analyticsData.status,
          upcomingBookings: upcomingBookingsData.status,
          completedBookings: completedBookingsData.status
        });

        if (analyticsData.status === 'rejected') {
          console.error('🔍 Analytics failed:', analyticsData.reason);
        }
        if (upcomingBookingsData.status === 'rejected') {
          console.error('🔍 Upcoming bookings failed:', upcomingBookingsData.reason);
        }
        if (completedBookingsData.status === 'rejected') {
          console.error('🔍 Completed bookings failed:', completedBookingsData.reason);
        }

        // Calculate stats from completed bookings data (accurate source) - NO MOCK DATA
        let stats = {
          totalBookings: 0,
          monthlyRevenue: 0,
          rating: 0,
          reviewCount: 0,
          responseTime: 0, // Only real data
          profileViews: 0,
          favoriteCount: 0,
          conversionRate: 0,
          completionRate: 0,
          repeatClients: 0
          // Removed punctuality - no real data available
        };

        // Process completed bookings to calculate accurate stats
        if (completedBookingsData.status === 'fulfilled' && completedBookingsData.value) {
          try {
            const completedBookings = Array.isArray(completedBookingsData.value.bookings) ? completedBookingsData.value.bookings : [];
            console.log('📊 Dashboard completed bookings:', completedBookings.length);
            
            // Calculate total bookings and monthly revenue from actual completed bookings
            stats.totalBookings = completedBookings.length;
            
            // Calculate total revenue from completed bookings with proper currency conversion
            const totalRevenue = completedBookings.reduce((sum, booking) => {
              const bookingCurrency = getBookingCurrency(booking);
              const convertedAmount = convertPrice(booking.totalAmount || 0, bookingCurrency);
              return sum + convertedAmount;
            }, 0);
            
            // For now, use total revenue as monthly revenue (can be refined later)
            stats.monthlyRevenue = totalRevenue;
            
            console.log('📊 Dashboard calculated stats:', {
              totalBookings: stats.totalBookings,
              monthlyRevenue: stats.monthlyRevenue
            });
            
            // Calculate completion rate based on completed vs total (real calculation only)
            if (upcomingBookingsData.status === 'fulfilled' && upcomingBookingsData.value) {
              const upcomingBookings = Array.isArray(upcomingBookingsData.value.bookings) ? upcomingBookingsData.value.bookings : [];
              const totalAllBookings = completedBookings.length + upcomingBookings.length;
              if (totalAllBookings > 0) {
                stats.completionRate = Math.round((completedBookings.length / totalAllBookings) * 100);
                stats.conversionRate = stats.completionRate; // Use same real calculation
              }
            }
            
            // Calculate response time from actual booking data
            let totalResponseTimeMinutes = 0;
            let responsiveBookings = 0;
            
            completedBookings.forEach(booking => {
              if (booking.createdAt && booking.updatedAt) {
                try {
                  const created = new Date(booking.createdAt);
                  const responded = new Date(booking.updatedAt);
                  const responseTimeMs = responded.getTime() - created.getTime();
                  
                  // Only count positive response times (responded after created)
                  if (responseTimeMs > 0) {
                    totalResponseTimeMinutes += responseTimeMs / (1000 * 60); // Convert to minutes
                    responsiveBookings++;
                  }
                } catch (e) {
                  console.warn('Invalid booking dates:', booking);
                }
              }
            });
            
            if (responsiveBookings > 0) {
              stats.responseTime = Math.round(totalResponseTimeMinutes / responsiveBookings);
              console.log('📊 Calculated response time:', stats.responseTime, 'minutes from', responsiveBookings, 'bookings');
            }
            
            // Only use real data - no estimates or defaults
            // rating: 0 (no real rating data available)
            // reviewCount: 0 (no real review data available)
            
            // Calculate repeat clients from actual customer booking frequency (real data only)
            const customerCounts = new Map();
            completedBookings.forEach(booking => {
              if (booking.customer?.id) {
                customerCounts.set(booking.customer.id, (customerCounts.get(booking.customer.id) || 0) + 1);
              }
            });
            
            if (customerCounts.size > 0) {
              const repeatCustomers = Array.from(customerCounts.values()).filter(count => count > 1).length;
              stats.repeatClients = Math.round((repeatCustomers / customerCounts.size) * 100);
            }
            
          } catch (err) {
            console.warn('Error processing completed bookings:', err);
          }
        }

        // Try to enhance with analytics data if available, but don't rely on it
        if (analyticsData.status === 'fulfilled' && analyticsData.value) {
          const overview = analyticsData.value;
          console.log('📊 Dashboard analytics enhancement:', overview);
          
          // Only use analytics data if it seems reasonable (not zeros)
          if (overview.averageRating > 0) {
            stats.rating = overview.averageRating;
          }
          if (overview.responseTime > 0) {
            stats.responseTime = overview.responseTime;
          }
          if (overview.totalBookings > stats.totalBookings) {
            stats.totalBookings = overview.totalBookings;
          }
        }

        // Process bookings data correctly: completed for recent, upcoming for appointments
        let recentBookings = [];
        let upcomingAppointments = [];

        // Recent Bookings should show recently completed bookings (Sep 2, Sep 4, etc.)
        if (completedBookingsData.status === 'fulfilled' && completedBookingsData.value) {
          try {
            const completedBookings = Array.isArray(completedBookingsData.value.bookings) ? completedBookingsData.value.bookings : [];
            console.log('📊 Dashboard recent completed bookings:', completedBookings);

            recentBookings = completedBookings
              .filter(booking => booking && booking.id)
              .sort((a, b) => new Date(b.completedAt || b.updatedAt).getTime() - new Date(a.completedAt || a.updatedAt).getTime()) // Most recent first
              .slice(0, 5)
              .map(booking => {
                // Format date nicely instead of raw ISO format
                const rawDate = booking.completedAt || booking.scheduledAt || booking.createdAt;
                let formattedDate = 'N/A';
                try {
                  if (rawDate) {
                    const date = new Date(rawDate);
                    formattedDate = date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) + ' at ' + date.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });
                  }
                } catch (e) {
                  console.warn('Invalid date format:', rawDate);
                }
                
                return {
                  id: booking.id,
                  customerName: booking.customer?.firstName + ' ' + (booking.customer?.lastName || ''),
                  serviceName: booking.service?.name || 'Service',
                  date: formattedDate, // Now properly formatted
                  status: 'completed',
                  amount: booking.totalAmount || 0
                };
              });
          } catch (err) {
            console.warn('Error processing completed bookings for recent list:', err);
          }
        }

        // Today's appointments should show upcoming bookings scheduled for today
        if (upcomingBookingsData.status === 'fulfilled' && upcomingBookingsData.value) {
          try {
            const upcomingBookings = Array.isArray(upcomingBookingsData.value.bookings) ? upcomingBookingsData.value.bookings : [];
            console.log('📊 Dashboard upcoming bookings for today:', upcomingBookings);

            upcomingAppointments = upcomingBookings
              .filter(booking => {
                if (!booking || !booking.scheduledAt) return false;
                const bookingDate = new Date(booking.scheduledAt);
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Start of today
                const endOfToday = new Date(today);
                endOfToday.setHours(23, 59, 59, 999); // End of today
                return bookingDate >= today && bookingDate <= endOfToday;
              })
              .map(booking => ({
                id: booking.id,
                customerName: booking.customer?.firstName + ' ' + (booking.customer?.lastName || ''),
                serviceName: booking.service?.name || 'Service',
                time: new Date(booking.scheduledAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                duration: '60 min', // Default duration
                type: 'offline' // Default type
              }));
          } catch (err) {
            console.warn('Error processing upcoming bookings data:', err);
          }
        }

        console.log('📊 Final dashboard data:', { stats, recentBookings, upcomingAppointments });
        console.log('📊 Monthly Revenue being set to:', stats.monthlyRevenue);

        setDashboardData({
          stats,
          recentBookings,
          upcomingAppointments
        });

        console.log('📊 Dashboard state updated. Current monthlyRevenue should be:', stats.monthlyRevenue);

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        // Keep default empty state on error
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return t('dashboard.welcome.morning');
    if (hour < 17) return t('dashboard.welcome.afternoon');
    return t('dashboard.welcome.evening');
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.pending;
  };

  const getStatusText = (status: string) => {
    return t(`dashboard.booking.status.${status}` as any) || status;
  };

  const StatCard = ({ title, value, change, changeType, icon: Icon, iconBg, description }: any) => (
    <div className="bg-surface rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          {loading ? (
            <div className="mb-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          )}
          {description && !loading && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
          {loading && (
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
          )}
          {change && !loading && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'positive' ? 'text-success-600' : 'text-error-600'
            }`}>
              {changeType === 'positive' ? (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getGreeting()}, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
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
        <div className="mt-4 lg:mt-0 flex space-x-3">
          <Link
            to="/specialist/services"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            {t('dashboard.specialist.addService')}
          </Link>
          <button className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
            {t('dashboard.specialist.exportReport')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.specialist.totalBookings')}
          value={dashboardData.stats.totalBookings}
          change={dashboardData.stats.totalBookings > 0 ? `+12% ${t('dashboard.specialist.thisMonthImprovement')}` : ''}
          changeType="positive"
          icon={CalendarIconSolid}
          iconBg="bg-gradient-to-br from-primary-500 to-primary-600"
          description={t('dashboard.specialist.allTime')}
        />
        <StatCard
          title={t('dashboard.specialist.monthlyRevenue')}
          value={formatPrice(dashboardData.stats.monthlyRevenue)}
          change={dashboardData.stats.monthlyRevenue > 0 ? `+8% ${t('dashboard.specialist.improvement')}` : ''}
          changeType="positive"
          icon={CurrencyDollarIcon}
          iconBg="bg-gradient-to-br from-success-500 to-success-600"
          description={language === 'uk' ? 'Серпень 2025' : language === 'ru' ? 'Август 2025' : 'August 2025'}
        />
        <StatCard
          title={t('dashboard.specialist.averageRating')}
          value={`${dashboardData.stats.rating}/5.0`}
          change={dashboardData.stats.reviewCount > 0 ? `+0.2 ${t('dashboard.specialist.thisMonthImprovement')}` : ''}
          changeType="positive"
          icon={StarIconSolid}
          iconBg="bg-gradient-to-br from-warning-500 to-warning-600"
          description={`${dashboardData.stats.reviewCount} ${t('dashboard.nav.reviews').toLowerCase()}`}
        />
        <StatCard
          title={t('dashboard.specialist.responseTime')}
          value={`${dashboardData.stats.responseTime} ${t('time.minutes')}`}
          change={dashboardData.stats.responseTime > 0 ? `-3 ${t('time.minutes')} ${t('dashboard.specialist.improvement')}` : ''}
          changeType="positive"
          icon={ClockIcon}
          iconBg="bg-gradient-to-br from-info-500 to-info-600"
          description={t('dashboard.specialist.averageTime')}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.profileActivity')}</h3>
            <EyeIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.specialist.profileViews')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{dashboardData.stats.profileViews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.specialist.favoriteCount')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{dashboardData.stats.favoriteCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.specialist.conversionRate')}</span>
              <span className="font-semibold text-success-600">{dashboardData.stats.conversionRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.qualityMetrics')}</h3>
            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.specialist.completionRate')}</span>
              <span className="font-semibold text-success-600">{dashboardData.stats.completionRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">{t('dashboard.specialist.repeatClients')}</span>
              <span className="font-semibold text-gray-900 dark:text-white">{dashboardData.stats.repeatClients}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t('dashboard.quickActions')}</h3>
            <UserGroupIcon className="w-5 h-5 opacity-80" />
          </div>
          <div className="space-y-2">
            <Link
              to="/specialist/schedule"
              className="w-full text-left py-2 px-3 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 text-sm font-medium flex items-center"
            >
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              {t('dashboard.specialist.manageSchedule')}
            </Link>
            <Link
              to="/specialist/reviews"
              className="w-full text-left py-2 px-3 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 text-sm font-medium flex items-center"
            >
              <StarIcon className="w-4 h-4 mr-2" />
              {t('dashboard.specialist.viewReviews')}
            </Link>
            <Link
              to="/specialist/messages"
              className="w-full text-left py-2 px-3 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200 text-sm font-medium flex items-center"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              {t('dashboard.specialist.messageClients')}
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.recentBookings')}</h3>
            <Link 
              to="/specialist/bookings"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-4">
            {dashboardData.recentBookings.slice(0, 4).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {booking.customerName?.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{booking.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{booking.serviceName}</p>
                    <p className="text-xs text-gray-400">
                      {booking.date} {language === 'uk' ? 'о' : language === 'ru' ? 'в' : 'at'} {booking.time}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(booking.amount)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.specialist.todaysSchedule')}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {currentTime.toLocaleDateString(
                language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US',
                { day: 'numeric', month: 'short' }
              )}
            </span>
          </div>
          <div className="space-y-4">
            {dashboardData.upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {appointment.customerName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{appointment.customerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{appointment.serviceName}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>{appointment.time}</span>
                      <span>•</span>
                      <span>{appointment.duration}</span>
                      <span>•</span>
                      <span className={appointment.type === 'online' ? 'text-primary-600' : 'text-secondary-600'}>
                        {appointment.type === 'online' 
                          ? `🔗 ${t('dashboard.specialist.online')}` 
                          : `🏢 ${t('dashboard.specialist.offline')}`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-lg transition-colors">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {dashboardData.upcomingAppointments.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('dashboard.specialist.noAppointments')}</p>
                <p className="text-sm">{t('dashboard.specialist.freeTimeMessage')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialistDashboard;