import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { clsx } from 'clsx';
import {
  UserPlusIcon,
  ChartBarIcon,
  GiftIcon,
  ShareIcon,
  TrophyIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import {
  ReferralDashboardProps,
  ReferralConfigResponse,
  ReferralAnalytics,
  Referral,
  CreateReferralRequest,
} from '../../types/referral';
import { referralService } from '../../services/referral.service';
import { useLanguage } from '../../contexts/LanguageContext';
import ReferralCreateModal from './ReferralCreateModal';
import ReferralTracker from './ReferralTracker';

const ReferralDashboard: React.FC<ReferralDashboardProps> = ({ userType, className }) => {
  const { t } = useLanguage();
  const [config, setConfig] = useState<ReferralConfigResponse | null>(null);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, analyticsData, referralsData] = await Promise.all([
        referralService.getConfig(),
        referralService.getAnalytics(),
        referralService.getMyReferrals({ limit: 10 }),
      ]);

      setConfig(configData);
      setAnalytics(analyticsData);
      setReferrals(referralsData.referrals);
    } catch (error) {
      console.error('Failed to load referral data:', error);
      toast.error(t('referral.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReferral = async (data: CreateReferralRequest) => {
    try {
      setCreating(true);
      const newReferral = await referralService.createReferral(data);

      // Refresh data
      await loadData();

      toast.success(t('referral.success.created'));
      setCreateModalOpen(false);

      // Auto-copy link to clipboard
      const copied = await referralService.copyReferralLink(newReferral.referralCode);
      if (copied) {
        toast.success(t('referral.success.linkCopied'));
      }
    } catch (error: any) {
      console.error('Failed to create referral:', error);
      const errorMessage = error?.apiError?.message || t('referral.errors.createFailed');
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className={clsx('flex justify-center py-12', className)}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!config || !analytics) {
    return (
      <div className={clsx('text-center py-12', className)}>
        <p className="text-gray-500 dark:text-gray-400">{t('referral.errors.loadFailed')}</p>
        <Button onClick={loadData} className="mt-4">
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  const canCreateReferral = config.limits.dailyUsed < config.limits.dailyLimit &&
                          config.limits.pendingUsed < config.limits.pendingLimit;

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('referral.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('referral.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          disabled={!canCreateReferral}
          leftIcon={<UserPlusIcon className="h-5 w-5" />}
        >
          {t('referral.createButton')}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <UserPlusIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.total')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.totalReferrals}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.completed')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.completedReferrals}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.conversionRate')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {referralService.formatConversionRate(analytics.overview.conversionRate)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <GiftIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('referral.stats.pointsEarned')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.overview.totalPointsEarned}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Limits & Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('referral.limits.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('referral.limits.daily')}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {config.limits.dailyUsed} / {config.limits.dailyLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((config.limits.dailyUsed / config.limits.dailyLimit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('referral.limits.pending')}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {config.limits.pendingUsed} / {config.limits.pendingLimit}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((config.limits.pendingUsed / config.limits.pendingLimit) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Available Referral Types */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('referral.types.title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.availableTypes.map((type) => {
            const rewards = config.config.REWARDS[type];
            return (
              <div
                key={type}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {referralService.getReferralTypeDisplayName(type)}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('referral.types.youEarn')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {referralService.getRewardDisplayText(rewards.referrerRewardType, rewards.referrerRewardValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{t('referral.types.theyGet')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {referralService.getRewardDisplayText(rewards.referredRewardType, rewards.referredRewardValue)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Activity & Tracker */}
      <ReferralTracker
        referrals={referrals}
        analytics={analytics}
        className="mt-6"
      />

      {/* Create Referral Modal */}
      {createModalOpen && (
        <ReferralCreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateReferral}
          config={config}
          loading={creating}
        />
      )}
    </div>
  );
};

export default ReferralDashboard;