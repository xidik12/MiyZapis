import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon
} from '@/components/icons';
import { PageLoader } from '@/components/ui';
import { PeriodSelector } from '@/components/admin/ui';
import {
  OverviewSection,
  SystemHealthSection,
  UserManagementSection,
  DetailedAnalyticsSection
} from '@/components/admin/analytics';
import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import type { Period } from '@/types/admin.types';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'system'>('overview');

  // Fetch all dashboard data using custom hook
  // Use the hook's setPeriod to ensure period changes trigger refetch
  const {
    data,
    stats,
    userAnalytics,
    bookingAnalytics,
    financialAnalytics,
    loading,
    error,
    refetch,
    setPeriod,
    period
  } = useAdminAnalytics({
    period: '30d',
    autoFetch: true,
    onError: (err) => {
      console.error('Admin analytics error:', err);
    }
  });

  // Tab configuration
  const tabs = [
    {
      id: 'overview' as const,
      name: 'Overview',
      icon: ChartBarIcon,
      description: 'Platform overview and key metrics'
    },
    {
      id: 'users' as const,
      name: 'Users',
      icon: UsersIcon,
      description: 'User management and analytics'
    },
    {
      id: 'analytics' as const,
      name: 'Analytics',
      icon: ChartBarIcon,
      description: 'Detailed analytics and reports'
    },
    {
      id: 'system' as const,
      name: 'System',
      icon: CogIcon,
      description: 'System health and performance'
    }
  ];

  // Show loading state
  if (loading && !stats) {
    return <PageLoader text="Loading admin dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Comprehensive platform analytics and management
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <PeriodSelector
                selected={period}
                onChange={(newPeriod) => setPeriod(newPeriod)}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Error loading dashboard data
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => refetch()}
                    className="text-sm font-medium text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <OverviewSection
              data={stats}
              period={period}
              loading={loading}
            />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UserManagementSection
              data={userAnalytics}
              period={period}
              loading={loading}
            />
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <DetailedAnalyticsSection
              data={data}
              period={period}
              loading={loading}
            />
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <SystemHealthSection
              autoRefresh={true}
              refreshInterval={30}
            />
          )}
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg
              className={`-ml-1 mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
