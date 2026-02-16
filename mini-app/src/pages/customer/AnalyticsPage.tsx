import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useLocale, t } from '@/hooks/useLocale';
import { analyticsStrings, commonStrings } from '@/utils/translations';
import { apiService } from '@/services/api.service';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

interface AnalyticsData {
  totalBookings: number;
  totalSpent: number;
  averageRating: number;
  completionRate: number;
  monthlyStats: {
    labels: string[];
    bookings: number[];
    spending: number[];
  };
  serviceCategories: Array<{
    name: string;
    bookings: number;
    spent: number;
  }>;
}

export const AnalyticsPage: React.FC = () => {
  const locale = useLocale();
  const { user } = useAppSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { webApp } = useTelegramWebApp();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all bookings for the user
      const bookingsResponse = await apiService.getBookings({
        limit: 1000, // Get all bookings
      });

      // Calculate analytics from bookings data
      const raw: any = bookingsResponse;
      const bookings = raw.bookings || raw.items || (Array.isArray(raw) ? raw : []);

      if (bookings.length === 0) {
        setAnalytics({
          totalBookings: 0,
          totalSpent: 0,
          averageRating: 0,
          completionRate: 0,
          monthlyStats: {
            labels: [],
            bookings: [],
            spending: [],
          },
          serviceCategories: [],
        });
        return;
      }

      // Calculate total bookings and spending
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter((b: any) => b.status === 'completed');
      const totalSpent = completedBookings.reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0);

      // Calculate completion rate
      const completionRate = totalBookings > 0
        ? parseFloat(((completedBookings.length / totalBookings) * 100).toFixed(1))
        : 0;

      // Calculate average rating given by the user
      const bookingsWithRatings = bookings.filter((b: any) => b.review?.rating);
      const averageRating = bookingsWithRatings.length > 0
        ? parseFloat((bookingsWithRatings.reduce((sum: number, b: any) => sum + b.review.rating, 0) / bookingsWithRatings.length).toFixed(1))
        : 0;

      // Calculate monthly stats for the last 6 months
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);
      const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

      const monthlyData = months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const monthBookings = bookings.filter((b: any) => {
          const bookingDate = new Date(b.scheduledAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd;
        });

        const monthSpending = monthBookings
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + (Number(b.totalAmount) || 0), 0);

        return {
          label: format(month, 'MMM'),
          bookings: monthBookings.length,
          spending: monthSpending,
        };
      });

      // Calculate spending by service category
      const categoryMap = new Map<string, { bookings: number; spent: number }>();

      completedBookings.forEach((booking: any) => {
        const categoryName = booking.service?.category?.name || 'Other';
        const existing = categoryMap.get(categoryName) || { bookings: 0, spent: 0 };
        categoryMap.set(categoryName, {
          bookings: existing.bookings + 1,
          spent: existing.spent + (Number(booking.totalAmount) || 0),
        });
      });

      const serviceCategories = Array.from(categoryMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5); // Top 5 categories

      setAnalytics({
        totalBookings,
        totalSpent,
        averageRating,
        completionRate,
        monthlyStats: {
          labels: monthlyData.map(m => m.label),
          bookings: monthlyData.map(m => m.bookings),
          spending: monthlyData.map(m => m.spending),
        },
        serviceCategories,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(t(commonStrings, 'error', locale));
      webApp?.showAlert(t(commonStrings, 'error', locale));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary pb-20">
        <div className="p-4 space-y-4">
          {/* Header skeleton */}
          <div className="text-center mb-6">
            <div className="h-8 bg-bg-card rounded-lg w-48 mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-bg-card rounded w-64 mx-auto animate-pulse" />
          </div>

          {/* Metrics skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 animate-pulse">
                <div className="h-8 bg-bg-secondary rounded w-16 mx-auto mb-2" />
                <div className="h-4 bg-bg-secondary rounded w-24 mx-auto" />
              </div>
            ))}
          </div>

          {/* Charts skeleton */}
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 animate-pulse">
            <div className="h-5 bg-bg-secondary rounded w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 bg-bg-secondary rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-bg-primary pb-20">
        <div className="p-4 text-center">
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-8">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {t(commonStrings, 'noDataYet', locale)}
            </h2>
            <p className="text-text-secondary mb-6">
              {error || t(commonStrings, 'noResults', locale)}
            </p>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-accent-primary text-white rounded-xl font-medium hover:bg-accent-primary/90 transition-colors"
            >
              {t(commonStrings, 'loading', locale)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasData = analytics.totalBookings > 0;

  if (!hasData) {
    return (
      <div className="min-h-screen bg-bg-primary pb-20">
        <div className="p-4 text-center">
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-8">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {t(commonStrings, 'noDataYet', locale)}
            </h2>
            <p className="text-text-secondary">
              {t(analyticsStrings, 'subtitle', locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="p-4 space-y-4 page-stagger">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">
            {t(analyticsStrings, 'title', locale)}
          </h1>
          <p className="text-text-secondary">
            {t(analyticsStrings, 'subtitle', locale)}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">
              {analytics.totalBookings}
            </div>
            <div className="text-sm text-text-secondary">
              {t(analyticsStrings, 'totalBookings', locale)}
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">
              ${analytics.totalSpent.toFixed(2)}
            </div>
            <div className="text-sm text-text-secondary">
              {t(analyticsStrings, 'totalSpent', locale)}
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">
              {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '-'}
            </div>
            <div className="text-sm text-text-secondary">
              {t(analyticsStrings, 'avgRatingGiven', locale)}
            </div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">
              {analytics.completionRate}%
            </div>
            <div className="text-sm text-text-secondary">
              {t(analyticsStrings, 'completionRate', locale)}
            </div>
          </div>
        </div>

        {/* Monthly Spending Chart */}
        {analytics.monthlyStats.spending.some(s => s > 0) && (
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4">
            <h3 className="font-semibold text-text-primary mb-4">
              {t(analyticsStrings, 'monthlySpending', locale)}
            </h3>
            <div className="space-y-2">
              {analytics.monthlyStats.labels.map((month, index) => {
                const spending = analytics.monthlyStats.spending[index];
                const maxSpending = Math.max(...analytics.monthlyStats.spending);
                const percentage = maxSpending > 0 ? (spending / maxSpending) * 100 : 0;

                return (
                  <div key={month} className="flex items-center space-x-3">
                    <div className="w-8 text-xs text-text-muted">{month}</div>
                    <div className="flex-1 bg-bg-secondary rounded h-3 relative">
                      <div
                        className="bg-accent-primary rounded h-3 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs font-medium text-text-secondary w-16 text-right">
                      ${spending.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Categories */}
        {analytics.serviceCategories.length > 0 && (
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4">
            <h3 className="font-semibold text-text-primary mb-4">
              {t(analyticsStrings, 'spendingByCategory', locale)}
            </h3>
            <div className="space-y-3 divide-y divide-white/5">
              {analytics.serviceCategories.map((category) => (
                <div key={category.name} className="flex items-center justify-between pt-3 first:pt-0">
                  <div>
                    <div className="font-medium text-text-primary">{category.name}</div>
                    <div className="text-xs text-text-muted">
                      {category.bookings} {t(commonStrings, 'bookings', locale) || 'bookings'}
                    </div>
                  </div>
                  <div className="font-semibold text-text-primary">
                    ${category.spent.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
