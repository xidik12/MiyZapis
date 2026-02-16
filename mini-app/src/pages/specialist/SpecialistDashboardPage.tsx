import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, DollarSign, Star, TrendingUp, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { fetchBookingsAsync } from '@/store/slices/bookingsSlice';
import { useLocale, t } from '@/hooks/useLocale';
import { specialistDashboardStrings, commonStrings } from '@/utils/translations';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface SpecialistStats {
  totalBookings: number;
  monthlyBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  responseTime: number;
}

export const SpecialistDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const { user } = useSelector((state: RootState) => state.auth);
  const { bookings, isLoading, error } = useSelector((state: RootState) => state.bookings);

  useEffect(() => {
    dispatch(fetchBookingsAsync());
  }, [dispatch]);

  const s = (key: string) => t(specialistDashboardStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  // Compute stats from bookings data
  const stats = useMemo<SpecialistStats>(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const monthlyBookingsData = bookings.filter(b =>
      isWithinInterval(parseISO(b.scheduledAt), { start: monthStart, end: monthEnd })
    );

    const totalRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const monthlyRevenue = monthlyBookingsData
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const bookingsWithReviews = bookings.filter(b => b.review);
    const averageRating = bookingsWithReviews.length > 0
      ? bookingsWithReviews.reduce((sum, b) => sum + (b.review?.rating || 0), 0) / bookingsWithReviews.length
      : 0;

    const completionRate = totalBookings > 0
      ? Math.round((completedBookings.length / totalBookings) * 100)
      : 0;

    return {
      totalBookings,
      monthlyBookings: monthlyBookingsData.length,
      totalRevenue: Math.round(totalRevenue),
      monthlyRevenue: Math.round(monthlyRevenue),
      rating: Math.round(averageRating * 10) / 10,
      reviewCount: bookingsWithReviews.length,
      completionRate,
      responseTime: 12, // This would come from a separate analytics endpoint
    };
  }, [bookings]);

  // Get recent bookings (last 5, sorted by date)
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
      .slice(0, 5);
  }, [bookings]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-accent-green/15 text-accent-green border-accent-green/20';
      case 'pending':
        return 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/20';
      case 'completed':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
      case 'cancelled':
        return 'bg-accent-red/15 text-accent-red border-accent-red/20';
      default:
        return 'bg-bg-hover text-text-secondary border-white/5';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary pb-20">
        <div className="p-4 space-y-6">
          {/* Welcome Header Skeleton */}
          <div className="text-center mb-6 space-y-2">
            <div className="h-8 w-64 bg-bg-card rounded-lg mx-auto animate-pulse" />
            <div className="h-4 w-48 bg-bg-card rounded-lg mx-auto animate-pulse" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse">
                <div className="h-8 w-16 bg-bg-secondary rounded mb-2" />
                <div className="h-4 w-24 bg-bg-secondary rounded" />
              </div>
            ))}
          </div>

          {/* Monthly Performance Skeleton */}
          <div className="bg-bg-card rounded-2xl border border-white/5 p-4 animate-pulse">
            <div className="h-6 w-32 bg-bg-secondary rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-bg-secondary rounded" />
              <div className="h-16 bg-bg-secondary rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-accent-red mb-2">{c('error')}</p>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <Button onClick={() => dispatch(fetchBookingsAsync())}>
            {c('retry') || 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="p-4 space-y-6 page-stagger">
        {/* Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            {s('welcomeBack')}, {user?.firstName || 'Specialist'}!
          </h1>
          <p className="text-text-secondary">{s('overview')}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center hover:bg-bg-card/90 transition-all">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="text-accent-primary" size={20} />
            </div>
            <div className="text-2xl font-bold text-text-primary">{stats.totalBookings}</div>
            <div className="text-sm text-text-secondary">{s('totalBookings')}</div>
          </Card>

          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center hover:bg-bg-card/90 transition-all">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="text-accent-green" size={20} />
            </div>
            <div className="text-2xl font-bold text-text-primary">{stats.totalRevenue} UAH</div>
            <div className="text-sm text-text-secondary">{s('totalRevenue')}</div>
          </Card>

          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center hover:bg-bg-card/90 transition-all">
            <div className="flex items-center justify-center mb-2">
              <Star className="text-accent-yellow fill-accent-yellow" size={20} />
            </div>
            <div className="text-2xl font-bold text-text-primary">{stats.rating || '—'}</div>
            <div className="text-sm text-text-secondary">
              {s('rating')} ({stats.reviewCount} {c('reviews')})
            </div>
          </Card>

          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center hover:bg-bg-card/90 transition-all">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="text-blue-400" size={20} />
            </div>
            <div className="text-2xl font-bold text-text-primary">{stats.completionRate}%</div>
            <div className="text-sm text-text-secondary">{s('completionRate')}</div>
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
          <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-accent-primary" />
            {s('thisMonth')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-bg-secondary/50 rounded-xl">
              <div className="text-xl font-bold text-text-primary">{stats.monthlyBookings}</div>
              <div className="text-sm text-text-secondary">{s('totalBookings')}</div>
            </div>
            <div className="text-center p-4 bg-bg-secondary/50 rounded-xl">
              <div className="text-xl font-bold text-accent-green">{stats.monthlyRevenue} UAH</div>
              <div className="text-sm text-text-secondary">{s('revenue')}</div>
            </div>
          </div>
        </Card>

        {/* Recent Bookings */}
        <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">{s('recentBookings')}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                hapticFeedback.impactLight();
                navigate('/specialist-bookings');
              }}
            >
              {c('viewAll')}
            </Button>
          </div>

          {recentBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto mb-3 text-text-muted" />
              <p className="text-sm text-text-secondary">{c('noDataYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl border border-white/5 hover:bg-bg-hover/50 transition-all cursor-pointer"
                  onClick={() => {
                    hapticFeedback.impactLight();
                    navigate('/specialist-bookings');
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary truncate">
                      {booking.customer.firstName} {booking.customer.lastName}
                    </div>
                    <div className="text-sm text-text-secondary truncate">{booking.service.name}</div>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1">
                      <Calendar size={12} />
                      <span>{format(parseISO(booking.scheduledAt), 'PPP')}</span>
                      <Clock size={12} />
                      <span>{format(parseISO(booking.scheduledAt), 'p')}</span>
                    </div>
                  </div>

                  <div className="text-right ml-3">
                    <div className="font-semibold text-accent-primary whitespace-nowrap">
                      {booking.totalAmount} UAH
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full border mt-1 ${getStatusColor(booking.status)}`}>
                      {c(booking.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
          <h3 className="font-semibold text-text-primary mb-4">{s('quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="h-12"
              onClick={() => {
                hapticFeedback.impactLight();
                navigate('/specialist/schedule');
              }}
            >
              {s('schedule')}
            </Button>
            <Button
              variant="secondary"
              className="h-12"
              onClick={() => {
                hapticFeedback.impactLight();
                navigate('/specialist/earnings');
              }}
            >
              {s('earnings')}
            </Button>
            <Button
              variant="secondary"
              className="h-12"
              onClick={() => {
                hapticFeedback.impactLight();
                navigate('/specialist/analytics');
              }}
            >
              {s('analytics')}
            </Button>
            <Button
              variant="secondary"
              className="h-12"
              onClick={() => {
                hapticFeedback.impactLight();
                navigate('/specialist/reviews');
              }}
            >
              {c('reviews')}
            </Button>
          </div>
        </Card>

        {/* Performance Insights */}
        <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
          <h3 className="font-semibold text-text-primary mb-4">{s('performance')}</h3>
          <div className="space-y-3 divide-y divide-white/5">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary flex items-center gap-2">
                <Clock size={16} className="text-text-muted" />
                {s('responseTime')}
              </span>
              <span className="font-medium text-text-primary">{stats.responseTime} {c('min')}</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-text-secondary flex items-center gap-2">
                <TrendingUp size={16} className="text-text-muted" />
                {s('completionRate')}
              </span>
              <span className="font-medium text-accent-green">{stats.completionRate}%</span>
            </div>
            <div className="flex justify-between items-center pt-3">
              <span className="text-text-secondary flex items-center gap-2">
                <Star size={16} className="text-text-muted" />
                {s('averageRating')}
              </span>
              <div className="flex items-center gap-1">
                <span className="font-medium text-text-primary">{stats.rating || '—'}</span>
                {stats.rating > 0 && <Star size={16} className="text-accent-yellow fill-accent-yellow" />}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
