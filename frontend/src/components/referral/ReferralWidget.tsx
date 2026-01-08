import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  UserPlusIcon,
  GiftIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
} from '@/components/icons';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { referralService } from '../../services/referral.service';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

interface ReferralWidgetProps {
  userType: 'customer' | 'specialist';
  className?: string;
}

const ReferralWidget: React.FC<ReferralWidgetProps> = ({ userType, className }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, configData] = await Promise.all([
        referralService.getAnalytics(),
        referralService.getConfig(),
      ]);

      setAnalytics(analyticsData);
      setConfig(configData);
    } catch (error) {
      console.error('Failed to load referral widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async () => {
    try {
      if (!config || config.limits.dailyUsed >= config.limits.dailyLimit) {
        toast.error('Daily referral limit reached');
        return;
      }

      // Navigate to referrals page instead of creating inline
      navigate(`/${userType}/referrals`);
    } catch (error) {
      console.error('Failed to navigate to referrals:', error);
    }
  };

  if (loading) {
    return (
      <Card className={clsx('p-6', className)}>
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={clsx('p-6', className)}>
        <div className="text-center">
          <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Referral system unavailable
          </p>
        </div>
      </Card>
    );
  }

  const canCreateReferral = config &&
    config.limits.dailyUsed < config.limits.dailyLimit &&
    config.limits.pendingUsed < config.limits.pendingLimit;

  return (
    <Card className={clsx('p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Referral Program
        </h3>
        <Button
          onClick={() => navigate(`/${userType}/referrals`)}
          variant="ghost"
          size="sm"
          rightIcon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
        >
          View All
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {analytics.overview.totalReferrals}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics.overview.completedReferrals}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {analytics.overview.pendingReferrals}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.overview.totalPointsEarned}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Points</div>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Conversion Rate
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {referralService.formatConversionRate(analytics.overview.conversionRate)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(analytics.overview.conversionRate, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button
          onClick={handleCreateReferral}
          disabled={!canCreateReferral}
          leftIcon={<UserPlusIcon className="h-4 w-4" />}
          className="w-full"
          size="sm"
        >
          {canCreateReferral ? 'Create Referral' : 'Limit Reached'}
        </Button>

        {config && config.limits.dailyUsed < config.limits.dailyLimit && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {config.limits.dailyLimit - config.limits.dailyUsed} referrals left today
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {analytics.recentActivity.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Recent Activity
          </h4>
          <div className="space-y-2">
            {analytics.recentActivity.slice(0, 3).map((activity: any, index: number) => (
              <div key={activity.id || index} className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                  {referralService.getReferralTypeDisplayName(activity.referralType)}
                </span>
                <span className={clsx(
                  'px-2 py-1 rounded-full',
                  activity.status === 'COMPLETED'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : activity.status === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400'
                )}>
                  {activity.status.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ReferralWidget;