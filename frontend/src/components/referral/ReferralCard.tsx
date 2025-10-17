import React, { useState } from 'react';
import { clsx } from 'clsx';
import {
  ClipboardDocumentIcon,
  ShareIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CalendarIcon,
  GiftIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/solid';

import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ReferralCardProps } from '../../types/referral';
import { referralService } from '../../services/referral.service';
import { useLanguage } from '../../contexts/LanguageContext';

const ReferralCard: React.FC<ReferralCardProps> = ({
  referral,
  onCopyLink,
  onShare,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copying, setCopying] = useState(false);
  const { t } = useLanguage();

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCopying(true);
    try {
      await onCopyLink(referral.referralCode);
    } finally {
      setTimeout(() => setCopying(false), 1000);
    }
  };

  const getStatusIcon = () => {
    switch (referral.status) {
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

  const getStatusBadge = () => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const statusClasses = referralService.getStatusColor(referral.status);

    return (
      <span className={clsx(baseClasses, statusClasses)}>
        {referral.status.toLowerCase()}
      </span>
    );
  };

  const daysUntilExpiry = referralService.getDaysUntilExpiry(referral.expiresAt);
  const isExpiringSoon = daysUntilExpiry <= 7 && referral.status === 'PENDING';
  const canShare = referralService.canShareReferral(referral);

  return (
    <Card className={clsx('transition-all duration-200', className)}>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex items-start flex-1">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg mr-3 shrink-0">
              <GiftIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {referralService.getReferralTypeDisplayName(referral.referralType)}
              </h3>
              <div className="flex flex-wrap items-center mt-1 gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 break-all">
                  {t('referral.code')}: {referral.referralCode}
                </span>
                {getStatusBadge()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {getStatusIcon()}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <EyeIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {referral.viewCount}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t('referral.stats.views')}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CursorArrowRaysIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {referral.clickCount}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t('referral.stats.clicks')}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {daysUntilExpiry}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t('referral.stats.daysLeft')}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <GiftIcon className="h-4 w-4 text-gray-400 mr-1" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {referralService.getRewardDisplayText(referral.referrerRewardType, referral.referrerRewardValue || 0)}
              </span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">{t('referral.stats.yourReward')}</div>
          </div>
        </div>

        {/* Expiry Warning */}
        {isExpiringSoon && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                {t('referral.expiryWarning', { days: daysUntilExpiry })}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canShare && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              loading={copying}
              leftIcon={copying ? <ClipboardDocumentCheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
              className="flex-1"
            >
              {copying ? t('referral.actions.copied') : t('referral.actions.copyLink')}
            </Button>
            <Button
              onClick={() => onShare(referral)}
              variant="secondary"
              size="sm"
              leftIcon={<ShareIcon className="h-4 w-4" />}
              className="flex-1"
            >
              {t('referral.actions.share')}
            </Button>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            {/* Referred User */}
            {referral.referred && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('referral.referredUser')}
                </h4>
                <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg mr-3">
                    <UserIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {referral.referred.firstName} {referral.referred.lastName}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {referral.referred.email} • {t('referral.joined')} {new Date(referral.referred.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Message */}
            {referral.customMessage && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('referral.customMessage')}
                </h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    "{referral.customMessage}"
                  </p>
                </div>
              </div>
            )}

            {/* Rewards Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('referral.rewardDetails')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  <div className="text-xs text-primary-600 dark:text-primary-400 mb-1">
                    {t('referral.yourReward')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {referralService.getRewardDisplayText(referral.referrerRewardType, referral.referrerRewardValue || 0)}
                  </div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                    {t('referral.theirReward')}
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {referralService.getRewardDisplayText(referral.referredRewardType, referral.referredRewardValue || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Share URL */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('referral.shareUrl')}
              </h4>
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <code className="flex-1 text-xs text-gray-600 dark:text-gray-400 break-all">
                  {referral.shareUrl}
                </code>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="sm"
                  className="ml-2 shrink-0"
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <div>{t('referral.created')}: {new Date(referral.createdAt).toLocaleString()}</div>
              <div>{t('referral.expires')}: {new Date(referral.expiresAt).toLocaleString()}</div>
              {referral.completedAt && (
                <div>{t('referral.completed')}: {new Date(referral.completedAt).toLocaleString()}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReferralCard;