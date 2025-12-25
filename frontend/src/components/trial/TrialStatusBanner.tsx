import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { SparklesIcon, ClockIcon, XIcon as XMarkIcon, InformationCircleIcon } from '@/components/icons';
import { Card } from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';

interface TrialStatusBannerProps {
  trialStartDate?: string;
  trialEndDate?: string;
  isInTrial?: boolean;
  userType: 'customer' | 'specialist';
  className?: string;
  onDismiss?: () => void;
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  trialStartDate,
  trialEndDate,
  isInTrial,
  userType,
  className,
  onDismiss,
}) => {
  const { t } = useLanguage();

  const trialInfo = useMemo(() => {
    if (!isInTrial || !trialEndDate) {
      return null;
    }

    const now = new Date();
    const endDate = new Date(trialEndDate);
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check if trial has actually expired
    if (daysRemaining <= 0) {
      return {
        expired: true,
        daysRemaining: 0,
        urgency: 'expired' as const,
      };
    }

    // Determine urgency level
    let urgency: 'low' | 'medium' | 'high' | 'expired' = 'low';
    if (daysRemaining <= 3) {
      urgency = 'high';
    } else if (daysRemaining <= 7) {
      urgency = 'medium';
    }

    return {
      expired: false,
      daysRemaining,
      urgency,
      endDate: endDate.toLocaleDateString(),
    };
  }, [isInTrial, trialEndDate]);

  // Don't show banner if no trial or trial expired
  if (!trialInfo || trialInfo.expired) {
    return null;
  }

  const getUrgencyStyles = () => {
    switch (trialInfo.urgency) {
      case 'high':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTextStyles = () => {
    switch (trialInfo.urgency) {
      case 'high':
        return 'text-red-900 dark:text-red-100';
      case 'medium':
        return 'text-yellow-900 dark:text-yellow-100';
      default:
        return 'text-blue-900 dark:text-blue-100';
    }
  };

  const getIconColor = () => {
    switch (trialInfo.urgency) {
      case 'high':
        return 'text-red-600 dark:text-red-400';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className={clsx('relative', className)}>
      <Card
        className={clsx(
          'p-4 border-l-4 transition-all duration-300',
          getUrgencyStyles()
        )}
        hover={false}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={clsx('mt-0.5', getIconColor())}>
              {trialInfo.urgency === 'high' ? (
                <ClockIcon className="h-6 w-6" />
              ) : (
                <SparklesIcon className="h-6 w-6" />
              )}
            </div>

            <div className="flex-1">
              <h3 className={clsx('text-sm font-semibold mb-1', getTextStyles())}>
                {t('trial.banner.title')} 🎉
              </h3>

              <p className={clsx('text-sm mb-2', getTextStyles())}>
                {userType === 'customer' ? (
                  <>
                    {t('trial.banner.customerMessage')}
                    <span className="font-semibold"> {t('trial.banner.noBookingFees')}</span>
                  </>
                ) : (
                  <>
                    {t('trial.banner.specialistMessage')}
                    <span className="font-semibold"> {t('trial.banner.noPlatformFees')}</span>
                  </>
                )}
              </p>

              <div className="flex items-center space-x-4 text-xs">
                <div className={clsx('flex items-center space-x-1', getTextStyles())}>
                  <ClockIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {trialInfo.daysRemaining} {trialInfo.daysRemaining === 1 ? t('trial.banner.dayLeft') : t('trial.banner.daysLeft')}
                  </span>
                </div>

                <Link
                  to="/trial-info"
                  className={clsx(
                    'inline-flex items-center space-x-1 hover:underline font-medium',
                    getTextStyles()
                  )}
                >
                  <InformationCircleIcon className="h-4 w-4" />
                  <span>{t('trial.banner.learnMore')}</span>
                </Link>
              </div>
            </div>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className={clsx(
                'p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
                getTextStyles()
              )}
              aria-label="Dismiss"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default TrialStatusBanner;
