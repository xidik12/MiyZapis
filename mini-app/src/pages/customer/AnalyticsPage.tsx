import React, { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

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
  const { user } = useAppSelector((state) => state.auth);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { webApp } = useTelegramWebApp();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockAnalytics: AnalyticsData = {
        totalBookings: 23,
        totalSpent: 15600,
        averageRating: 4.7,
        completionRate: 95.2,
        monthlyStats: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          bookings: [2, 4, 3, 6, 4, 4],
          spending: [1200, 2400, 1800, 3600, 2400, 2400]
        },
        serviceCategories: [
          { name: 'Psychology', bookings: 8, spent: 6400 },
          { name: 'Fitness', bookings: 6, spent: 3600 },
          { name: 'Beauty', bookings: 4, spent: 1800 },
          { name: 'Home Services', bookings: 3, spent: 2400 },
          { name: 'Education', bookings: 2, spent: 1400 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      webApp?.showAlert('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-bg-primary text-center text-text-secondary p-8">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20">
      <div className="p-4 space-y-4 page-stagger">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Your Analytics</h1>
          <p className="text-text-secondary">Track your booking activity and spending</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">{analytics.totalBookings}</div>
            <div className="text-sm text-text-secondary">Total Bookings</div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">${analytics.totalSpent}</div>
            <div className="text-sm text-text-secondary">Total Spent</div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">{analytics.averageRating}</div>
            <div className="text-sm text-text-secondary">Avg Rating Given</div>
          </div>

          <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-primary">{analytics.completionRate}%</div>
            <div className="text-sm text-text-secondary">Completion Rate</div>
          </div>
        </div>

        {/* Monthly Spending Chart */}
        <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4">
          <h3 className="font-semibold text-text-primary mb-4">Monthly Spending</h3>
          <div className="space-y-2">
            {analytics.monthlyStats.labels.map((month, index) => {
              const spending = analytics.monthlyStats.spending[index];
              const maxSpending = Math.max(...analytics.monthlyStats.spending);
              const percentage = (spending / maxSpending) * 100;

              return (
                <div key={month} className="flex items-center space-x-3">
                  <div className="w-8 text-xs text-text-muted">{month}</div>
                  <div className="flex-1 bg-bg-secondary rounded h-3 relative">
                    <div
                      className="bg-accent-primary rounded h-3 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-text-secondary w-12 text-right">${spending}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Categories */}
        <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4">
          <h3 className="font-semibold text-text-primary mb-4">Spending by Category</h3>
          <div className="space-y-3 divide-y divide-white/5">
            {analytics.serviceCategories.map((category) => (
              <div key={category.name} className="flex items-center justify-between pt-3 first:pt-0">
                <div>
                  <div className="font-medium text-text-primary">{category.name}</div>
                  <div className="text-xs text-text-muted">{category.bookings} bookings</div>
                </div>
                <div className="font-semibold text-text-primary">${category.spent}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Bookings Chart */}
        <div className="bg-bg-card rounded-2xl border border-white/5 shadow-card p-4">
          <h3 className="font-semibold text-text-primary mb-4">Monthly Bookings</h3>
          <div className="space-y-2">
            {analytics.monthlyStats.labels.map((month, index) => {
              const bookings = analytics.monthlyStats.bookings[index];
              const maxBookings = Math.max(...analytics.monthlyStats.bookings);
              const percentage = maxBookings > 0 ? (bookings / maxBookings) * 100 : 0;

              return (
                <div key={`bookings-${month}`} className="flex items-center space-x-3">
                  <div className="w-8 text-xs text-text-muted">{month}</div>
                  <div className="flex-1 bg-bg-secondary rounded h-3 relative">
                    <div
                      className="bg-accent-primary rounded h-3 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs font-medium text-text-secondary w-12 text-right">{bookings}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
