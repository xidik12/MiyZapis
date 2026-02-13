import React from 'react';
import {
  UsersIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { StatCard } from '../ui/StatCard';
import { TrendLineChart } from '../charts/TrendLineChart';
import { DistributionPieChart } from '../charts/DistributionPieChart';
import { ComparisonBarChart } from '../charts/ComparisonBarChart';
import { DataTable, Column } from '../ui/DataTable';
import type { DashboardStats, Period } from '@/types/admin.types';

export interface OverviewSectionProps {
  data: DashboardStats | null;
  period: Period;
  loading?: boolean;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  data,
  loading = false
}) => {
  const { t } = useLanguage();

  if (loading || !data) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { overview, growth, recentActivity, analytics } = data;

  // Prepare chart data
  const userGrowthData = [
    {
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      users: growth.newUsers.previous
    },
    {
      date: new Date().toISOString(),
      users: growth.newUsers.current
    }
  ];

  // Prepare booking status pie chart data
  const bookingStatusData = [
    { name: t('admin.overview.completed'), value: overview.completedBookings, color: '#10B981' },
    { name: t('admin.overview.pending'), value: overview.totalBookings - overview.completedBookings, color: '#F59E0B' }
  ];

  // Prepare category stats for bar chart
  const categoryChartData = analytics.categoryStats.map((cat) => ({
    name: cat.category,
    services: cat._count.id,
    avgPrice: cat._avg.basePrice || 0
  }));

  // Top specialists table columns
  const specialistColumns: Column<typeof analytics.topSpecialists[0]>[] = [
    {
      key: 'name',
      label: t('admin.analytics.specialist'),
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.businessName}</div>
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (row) => (
        <div className="flex items-center">
          <span className="text-yellow-500 mr-1">★</span>
          <span className="font-medium">{row.rating.toFixed(1)}</span>
        </div>
      )
    },
    {
      key: 'reviewCount',
      label: 'Reviews',
      sortable: true
    },
    {
      key: 'servicesCount',
      label: 'Services',
      sortable: true
    },
    {
      key: 'isVerified',
      label: t('admin.users.status'),
      render: (row) => (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            row.isVerified
              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400'
          }`}
        >
          {row.isVerified && <CheckCircleIcon className="w-3 h-3 mr-1" />}
          {row.isVerified ? t('admin.overview.verified') : t('admin.overview.unverified')}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('admin.overview.totalUsers')}
          value={overview.totalUsers}
          growth={growth.newUsers.growthRate}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`+${growth.newUsers.current} ${t('admin.overview.thisPeriod')}`}
        />
        <StatCard
          title={t('admin.overview.totalSpecialists')}
          value={overview.totalSpecialists}
          icon={<UserGroupIcon className="w-6 h-6" />}
          subtitle={`${((overview.totalSpecialists / overview.totalUsers) * 100).toFixed(1)}${t('admin.overview.ofUsers')}`}
        />
        <StatCard
          title={t('admin.overview.totalServices')}
          value={overview.totalServices}
          icon={<BriefcaseIcon className="w-6 h-6" />}
          subtitle={`${(overview.totalServices / Math.max(overview.totalSpecialists, 1)).toFixed(1)} ${t('admin.overview.perSpecialist')}`}
        />
        <StatCard
          title={t('admin.overview.totalRevenue')}
          value={`$${(overview.totalRevenue / 1000).toFixed(1)}K`}
          growth={growth.revenue.growthRate}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          subtitle={`+$${(growth.revenue.current / 1000).toFixed(1)}${t('admin.overview.kThisPeriod')}`}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('admin.overview.totalBookings')}
          value={overview.totalBookings}
          growth={growth.newBookings.growthRate}
          icon={<ChartBarIcon className="w-6 h-6" />}
          subtitle={`+${growth.newBookings.current} ${t('admin.overview.thisPeriod')}`}
        />
        <StatCard
          title={t('admin.overview.completedBookings')}
          value={overview.completedBookings}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          subtitle={`${((overview.completedBookings / Math.max(overview.totalBookings, 1)) * 100).toFixed(1)}${t('admin.overview.completionRate')}`}
        />
        <StatCard
          title={t('admin.overview.activeUsers')}
          value={overview.activeUsers}
          icon={<UsersIcon className="w-6 h-6" />}
          subtitle={`${((overview.activeUsers / Math.max(overview.totalUsers, 1)) * 100).toFixed(1)}${t('admin.overview.ofTotal')}`}
        />
        <StatCard
          title={t('admin.overview.conversionRate')}
          value={`${overview.conversionRate.toFixed(1)}%`}
          icon={<ChartBarIcon className="w-6 h-6" />}
          subtitle={t('admin.overview.bookingsPerUser')}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.overview.userGrowth')}
          </h3>
          <TrendLineChart
            data={userGrowthData}
            dataKeys={[
              { key: 'users', name: t('admin.overview.newUsers'), color: '#3B82F6' }
            ]}
            height={250}
          />
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.overview.bookingStatus')}
          </h3>
          <DistributionPieChart
            data={bookingStatusData}
            height={250}
          />
        </div>
      </div>

      {/* Service Categories Performance */}
      {categoryChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.overview.topCategories')}
          </h3>
          <ComparisonBarChart
            data={categoryChartData.slice(0, 10)}
            bars={[
              { dataKey: 'services', name: t('admin.overview.numberOfServices'), color: '#3B82F6' }
            ]}
            height={300}
          />
        </div>
      )}

      {/* Top Specialists */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.overview.topSpecialists')}
        </h3>
        <DataTable
          columns={specialistColumns}
          data={analytics.topSpecialists}
          pageSize={5}
          emptyMessage={t('admin.overview.noSpecialists')}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.overview.recentBookings')}
          </h3>
          <div className="space-y-3">
            {recentActivity.bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {booking.service.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </p>
                </div>
                <div className="flex flex-col items-end ml-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    ${booking.totalAmount}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      booking.status === 'COMPLETED'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                        : booking.status === 'CONFIRMED'
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.overview.recentUsers')}
          </h3>
          <div className="space-y-3">
            {recentActivity.users.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                      {user.firstName.charAt(0)}
                      {user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ml-4 flex-shrink-0 ${
                    user.userType === 'SPECIALIST'
                      ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400'
                      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                  }`}
                >
                  {user.userType}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewSection;
