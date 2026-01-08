import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '@/components/icons';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  ReferralTrackerProps,
  Referral,
  ReferralAnalytics,
} from '../../types/referral';
import { referralService } from '../../services/referral.service';
import ReferralCard from './ReferralCard';

const ReferralTracker: React.FC<ReferralTrackerProps> = ({
  referrals,
  analytics,
  loading = false,
  className,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'completed' | 'expired'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyLink = async (referralCode: string) => {
    const success = await referralService.copyReferralLink(referralCode);
    if (success) {
      setCopiedCode(referralCode);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleShare = async (referral: Referral) => {
    await referralService.shareReferral(referral);
  };

  const filteredReferrals = referrals.filter((referral) => {
    if (selectedFilter === 'all') return true;
    return referral.status.toLowerCase() === selectedFilter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'EXPIRED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusCount = (status: string) => {
    switch (status) {
      case 'pending':
        return analytics.overview.pendingReferrals;
      case 'completed':
        return analytics.overview.completedReferrals;
      case 'expired':
        return analytics.overview.expiredReferrals;
      default:
        return analytics.overview.totalReferrals;
    }
  };

  if (loading) {
    return (
      <div className={clsx('flex justify-center py-8', className)}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Analytics Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Referral Performance
          </h3>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <ChartBarIcon className="h-4 w-4 mr-1" />
            {referralService.formatConversionRate(analytics.overview.conversionRate)} conversion rate
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.overview.totalReferrals}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Sent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {analytics.overview.completedReferrals}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {analytics.overview.pendingReferrals}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {analytics.overview.totalPointsEarned}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Points Earned</div>
          </div>
        </div>
      </Card>

      {/* Top Performing Types */}
      {analytics.topPerformingTypes.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Performing Types
          </h3>
          <div className="space-y-3">
            {analytics.topPerformingTypes.map((type) => (
              <div key={type.type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {referralService.getReferralTypeDisplayName(type.type)}
                </span>
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                    {type.completedCount} completed
                  </span>
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((type.completedCount / analytics.overview.completedReferrals) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'completed', label: 'Completed' },
            { key: 'expired', label: 'Expired' },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key as any)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                selectedFilter === filter.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {filter.label} ({getStatusCount(filter.key)})
            </button>
          ))}
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredReferrals.length} referral{filteredReferrals.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Referral List */}
      <div className="space-y-4">
        {filteredReferrals.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              {selectedFilter === 'all'
                ? 'No referrals yet. Create your first referral to get started!'
                : `No ${selectedFilter} referrals found.`
              }
            </div>
          </Card>
        ) : (
          filteredReferrals.map((referral) => (
            <ReferralCard
              key={referral.id}
              referral={referral}
              onCopyLink={handleCopyLink}
              onShare={handleShare}
              className={copiedCode === referral.referralCode ? 'ring-2 ring-green-500' : ''}
            />
          ))
        )}
      </div>

      {/* Recent Activity */}
      {analytics.recentActivity.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  {getStatusIcon(activity.status)}
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {referralService.getReferralTypeDisplayName(activity.referralType)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {activity.referred
                        ? `${activity.referred.name} joined as ${activity.referred.userType.toLowerCase()}`
                        : 'Pending signup'
                      }
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReferralTracker;