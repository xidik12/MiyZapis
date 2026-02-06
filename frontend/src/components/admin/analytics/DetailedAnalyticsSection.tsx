import React, { useState } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StatCard } from '../ui/StatCard';
import { TrendLineChart } from '../charts/TrendLineChart';
import { DistributionPieChart } from '../charts/DistributionPieChart';
import { ComparisonBarChart } from '../charts/ComparisonBarChart';
import { DataTable, Column } from '../ui/DataTable';
import type { AdminDashboardData, Period, BookingAnalytics, FinancialAnalytics } from '@/types/admin.types';

export interface DetailedAnalyticsSectionProps {
  data: AdminDashboardData | null;
  period: Period;
  loading?: boolean;
}

export const DetailedAnalyticsSection: React.FC<DetailedAnalyticsSectionProps> = ({
  data,
  period,
  loading = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bookings' | 'revenue' | 'referrals'>('bookings');

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { bookingAnalytics, financialAnalytics } = data;

  // Sub-tabs configuration
  const subTabs = [
    { id: 'bookings' as const, name: 'Booking Analytics', icon: CalendarIcon },
    { id: 'revenue' as const, name: 'Revenue Analytics', icon: CurrencyDollarIcon },
    { id: 'referrals' as const, name: 'Referral Performance', icon: UserGroupIcon }
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200
                  ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon
                  className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${
                      isActive
                        ? 'text-primary-500 dark:text-primary-400'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'
                    }
                  `}
                  aria-hidden="true"
                />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Booking Analytics Tab */}
      {activeSubTab === 'bookings' && bookingAnalytics && (
        <BookingAnalyticsTab data={bookingAnalytics} period={period} />
      )}

      {/* Revenue Analytics Tab */}
      {activeSubTab === 'revenue' && financialAnalytics && (
        <RevenueAnalyticsTab data={financialAnalytics} period={period} categoryRevenue={bookingAnalytics?.categoryRevenue} />
      )}

      {/* Referral Analytics Tab */}
      {activeSubTab === 'referrals' && data.stats && (
        <ReferralAnalyticsTab data={data} period={period} />
      )}
    </div>
  );
};

// Booking Analytics Sub-component
const BookingAnalyticsTab: React.FC<{ data: BookingAnalytics; period: Period }> = ({ data, period }) => {
  // Add null checks for all arrays - use correct property names from backend
  const bookingTrends = data?.bookingTrends || [];
  const statusStats = data?.statusStats || [];
  const popularServices = data?.popularServices || [];
  const hourlyStats = data?.hourlyStats || [];

  // Prepare booking timeline data - aggregate by date
  const bookingTimelineMap = new Map<string, { bookings: number; revenue: number }>();
  bookingTrends.forEach((trend) => {
    const dateKey = trend.date;
    const existing = bookingTimelineMap.get(dateKey) || { bookings: 0, revenue: 0 };
    existing.bookings += trend.count || 0;
    existing.revenue += trend.avg_amount ? trend.avg_amount * (trend.count || 0) : 0;
    bookingTimelineMap.set(dateKey, existing);
  });
  const bookingTimelineData = Array.from(bookingTimelineMap.entries()).map(([date, data]) => ({
    date,
    bookings: data.bookings,
    revenue: data.revenue
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Prepare status distribution data - use statusStats from backend
  const statusDistributionData = statusStats.map((status) => ({
    name: status.status,
    value: status._count?.id || 0,
    color:
      status.status === 'COMPLETED' ? '#10B981' :
      status.status === 'CONFIRMED' ? '#3B82F6' :
      status.status === 'PENDING' ? '#F59E0B' :
      status.status === 'CANCELLED' ? '#EF4444' : '#6B7280'
  }));

  // Prepare service popularity data - use popularServices from backend
  const servicePopularityData = popularServices.slice(0, 10).map((service) => ({
    name: service.service?.name || 'Unknown Service',
    bookings: service._count?.id || 0,
    revenue: 0 // Not available in current API
  }));

  // Peak hours data - use hourlyStats from backend
  const peakHoursData = Array.from({ length: 24 }, (_, hour) => {
    const hourData = hourlyStats.find(h => h.hour === hour);
    return {
      name: `${hour.toString().padStart(2, '0')}:00`,
      bookings: hourData?.count || 0
    };
  });

  // Calculate metrics from statusStats
  const totalBookings = statusStats.reduce((sum, s) => sum + (s._count?.id || 0), 0);
  const completedBookings = statusStats.find(s => s.status === 'COMPLETED')?._count?.id || 0;
  const cancelledBookings = statusStats.find(s => s.status === 'CANCELLED')?._count?.id || 0;
  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
  const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
  const avgBookingsPerDay = bookingTimelineData.length > 0
    ? bookingTimelineData.reduce((sum, d) => sum + d.bookings, 0) / bookingTimelineData.length
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Bookings"
          value={totalBookings}
          icon={<CalendarIcon className="w-6 h-6" />}
          subtitle={`${period} period`}
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          subtitle={`${completedBookings} completed`}
        />
        <StatCard
          title="Cancellation Rate"
          value={`${cancellationRate.toFixed(1)}%`}
          icon={<XCircleIcon className="w-6 h-6" />}
          subtitle={`${cancelledBookings} cancelled`}
        />
        <StatCard
          title="Avg/Day"
          value={avgBookingsPerDay.toFixed(1)}
          icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
          subtitle="Daily average"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Booking Volume Timeline
          </h3>
          <TrendLineChart
            data={bookingTimelineData}
            dataKeys={[
              { key: 'bookings', name: 'Bookings', color: '#3B82F6' }
            ]}
            height={300}
          />
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status Distribution
          </h3>
          <DistributionPieChart
            data={statusDistributionData}
            height={300}
          />
        </div>
      </div>

      {/* Service Popularity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Most Popular Services
        </h3>
        <ComparisonBarChart
          data={servicePopularityData}
          bars={[
            { dataKey: 'bookings', name: 'Bookings', color: '#3B82F6' }
          ]}
          height={300}
        />
      </div>

      {/* Peak Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Peak Booking Hours
        </h3>
        <ComparisonBarChart
          data={peakHoursData}
          bars={[
            { dataKey: 'bookings', name: 'Bookings', color: '#10B981' }
          ]}
          height={300}
        />
      </div>
    </div>
  );
};

// Revenue Analytics Sub-component
const RevenueAnalyticsTab: React.FC<{ data: FinancialAnalytics; period: Period; categoryRevenue?: Array<{ category: string; total_revenue: number }> }> = ({ data, period, categoryRevenue: categoryRevenueProp }) => {
  // Add null checks for all arrays - use correct property names from backend
  const revenueTrends = data?.revenueTrends || [];
  const paymentMethodStats = data?.paymentMethodStats || [];
  const topEarningSpecialists = data?.topEarningSpecialists || [];
  const categoryRevenue = categoryRevenueProp || [];

  // Prepare revenue timeline data - aggregate by date
  const revenueTimelineMap = new Map<string, { revenue: number; count: number }>();
  revenueTrends.forEach((trend) => {
    const dateKey = trend.date;
    const existing = revenueTimelineMap.get(dateKey) || { revenue: 0, count: 0 };
    existing.revenue += trend.total_amount || 0;
    existing.count += trend.transaction_count || 0;
    revenueTimelineMap.set(dateKey, existing);
  });
  const revenueTimelineData = Array.from(revenueTimelineMap.entries()).map(([date, data]) => ({
    date,
    revenue: data.revenue,
    fees: 0, // Platform fees not in current API
    refunds: 0 // Refunds tracked separately
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Prepare payment method distribution - use paymentMethodStats from backend
  const paymentMethodData = paymentMethodStats.map((method) => ({
    name: method.paymentMethodType || 'Unknown',
    value: method._sum?.amount || 0,
    color:
      method.paymentMethodType === 'card' ? '#3B82F6' :
      method.paymentMethodType === 'telegram_payment' ? '#10B981' :
      method.paymentMethodType === 'wallet' ? '#F59E0B' :
      method.paymentMethodType === 'crypto' ? '#8B5CF6' : '#6B7280'
  }));

  // Prepare top earners table data - map backend property names
  const topEarnersData = topEarningSpecialists.map((specialist) => ({
    name: `${specialist.first_name || ''} ${specialist.last_name || ''}`.trim() || 'Unknown',
    businessName: specialist.business_name || 'N/A',
    revenue: specialist.total_earnings || 0,
    bookings: specialist.transaction_count || 0,
    avgBookingValue: specialist.avg_transaction || 0
  }));

  const topEarnersColumns: Column<typeof topEarnersData[0]>[] = [
    {
      key: 'name',
      label: 'Specialist',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.businessName}</div>
        </div>
      )
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          ${(row.revenue || 0).toFixed(2)}
        </span>
      )
    },
    {
      key: 'bookings',
      label: 'Bookings',
      sortable: true
    },
    {
      key: 'avgBookingValue',
      label: 'Avg Value',
      sortable: true,
      render: (row) => `$${(row.avgBookingValue || 0).toFixed(2)}`
    }
  ];

  // Prepare category revenue data - use correct property names
  const categoryRevenueData = categoryRevenue.slice(0, 10).map((cat) => ({
    name: cat.category || 'Unknown',
    revenue: cat.total_revenue || 0
  }));

  // Calculate metrics from revenueTrends
  const totalRevenue = revenueTrends.reduce((sum, t) => sum + (t.total_amount || 0), 0);
  const totalFees = 0; // Platform fees not in current API
  const refundStats = data?.refundStats;
  const totalRefunds = refundStats?._sum?.amount || 0;
  const netRevenue = totalRevenue - totalRefunds;
  const totalTransactions = paymentMethodStats.reduce((sum, m) => sum + (m._count?.id || 0), 0);
  const avgTransactionValue = totalTransactions > 0
    ? paymentMethodStats.reduce((sum, m) => sum + (m._sum?.amount || 0), 0) / totalTransactions
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(totalRevenue / 1000).toFixed(1)}K`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          subtitle={`${period} period`}
        />
        <StatCard
          title="Platform Fees"
          value={`$${(totalFees / 1000).toFixed(1)}K`}
          icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
          subtitle={`${((totalFees / Math.max(totalRevenue, 1)) * 100).toFixed(1)}% of revenue`}
        />
        <StatCard
          title="Net Revenue"
          value={`$${(netRevenue / 1000).toFixed(1)}K`}
          icon={<ChartBarIcon className="w-6 h-6" />}
          subtitle={`After ${totalRefunds} refunds`}
        />
        <StatCard
          title="Avg Transaction"
          value={`$${avgTransactionValue.toFixed(2)}`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          subtitle="Per booking"
        />
      </div>

      {/* Revenue Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Revenue Trends
        </h3>
        <TrendLineChart
          data={revenueTimelineData}
          dataKeys={[
            { key: 'revenue', name: 'Total Revenue', color: '#3B82F6' },
            { key: 'fees', name: 'Platform Fees', color: '#10B981' },
            { key: 'refunds', name: 'Refunds', color: '#EF4444' }
          ]}
          height={300}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Payment Methods
          </h3>
          <DistributionPieChart
            data={paymentMethodData}
            height={300}
          />
        </div>

        {/* Category Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Revenue by Category
          </h3>
          <ComparisonBarChart
            data={categoryRevenueData}
            bars={[
              { dataKey: 'revenue', name: 'Revenue', color: '#10B981' }
            ]}
            height={300}
          />
        </div>
      </div>

      {/* Top Earners Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Earning Specialists
        </h3>
        <DataTable
          columns={topEarnersColumns}
          data={topEarnersData}
          pageSize={10}
          emptyMessage="No specialists found"
        />
      </div>
    </div>
  );
};

// Referral Analytics Sub-component
const ReferralAnalyticsTab: React.FC<{ data: AdminDashboardData; period: Period }> = (_props) => {
  // This would need referral data from the API
  // For now, showing placeholder with the structure
  // Note: _props contains data and period for future implementation

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
        <UserGroupIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Referral Analytics
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Referral tracking and performance metrics will be displayed here once the referral system is fully integrated.
        </p>
      </div>
    </div>
  );
};

export default DetailedAnalyticsSection;
