import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '@/hooks/redux';
import { selectUser } from '@/store/slices/authSlice';
import {
  subscriptionService,
  type StarsPricing,
  type SubscriptionStatus,
} from '@/services/subscription.service';
import { PageLoader } from '@/components/ui';
import { HelpTip } from '@/components/common/HelpTip';
import { toast } from 'react-toastify';
import { CheckCircleIcon, StarIcon, RocketLaunchIcon } from '@/components/icons';

const Billing: React.FC = () => {
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [pricing, setPricing] = useState<StarsPricing | null>(null);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [busy, setBusy] = useState<'monthly' | 'sixmonth' | 'annual' | 'cancel' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        subscriptionService.getPricing(),
        user?.id ? subscriptionService.getStatus(user.id) : Promise.resolve(null),
      ]);
      setPricing(p);
      setStatus(s);
    } catch (err) {
      toast.error((err as Error).message || t('billing.loadError') || 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch status when the tab regains focus — payment happens in Telegram,
  // so when the specialist comes back we want the new ACTIVE status to show.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        subscriptionService.getStatus(user.id).then(setStatus).catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [user?.id]);

  const subscribe = async (plan: 'monthly' | 'sixmonth' | 'annual') => {
    setBusy(plan);
    try {
      const link = await subscriptionService.createInvoice(plan);
      toast.info(t('billing.openingTelegram') || 'Opening Telegram…');
      window.open(link, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error((err as Error).message || t('billing.invoiceError') || 'Could not start payment');
    } finally {
      setBusy(null);
    }
  };

  const cancel = async () => {
    if (!confirm(t('billing.cancelConfirm') || 'Turn off auto-renewal? Your plan stays active until the period ends.')) return;
    setBusy('cancel');
    try {
      await subscriptionService.cancel();
      toast.success(t('billing.cancelled') || 'Auto-renewal turned off');
      await load();
    } catch (err) {
      toast.error((err as Error).message || t('billing.cancelError') || 'Failed to cancel');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <PageLoader />;

  const inTrial = Boolean(user?.isInTrial && user?.trialEndDate && new Date(user.trialEndDate) > new Date());
  const trialEnds = user?.trialEndDate ? new Date(user.trialEndDate) : null;
  const isSubscribed = status?.planType === 'MONTHLY_SUBSCRIPTION' && status?.status === 'ACTIVE';
  const validUntil = status?.currentPeriodEnd ? new Date(status.currentPeriodEnd) : null;
  const autoRenews = isSubscribed && !!status?.nextBillingDate; // annual one-time has no nextBillingDate
  const fmtDate = (d: Date | null) =>
    d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

  const Stars = ({ n }: { n: number }) => (
    <span className="inline-flex items-center gap-1">
      <StarIcon className="w-5 h-5 text-amber-400" active />
      <span className="font-bold">{n.toLocaleString()}</span>
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <RocketLaunchIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('billing.title') || 'Subscription'}</h1>
            <HelpTip title={t('billing.title') || 'Subscription'} content={t('billing.help') || ''} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('billing.subtitle') || 'Unlimited bookings with 0% per-booking fee. Pay with Telegram Stars.'}
          </p>
        </div>
      </div>

      {/* Trial / current status banner */}
      {isSubscribed ? (
        <div className="rounded-2xl border border-success-300 dark:border-success-500/40 bg-success-50 dark:bg-success-900/10 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="w-6 h-6 text-success-600 dark:text-success-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white">
                {autoRenews ? (t('billing.activeMonthly') || 'Monthly subscription active') : (t('billing.activeAnnual') || 'Annual plan active')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                {(autoRenews ? (t('billing.renewsOn') || 'Renews on') : (t('billing.validUntil') || 'Valid until'))} {fmtDate(validUntil)}
              </p>
              {autoRenews && (
                <button
                  onClick={cancel}
                  disabled={busy === 'cancel'}
                  className="mt-2 text-sm font-medium text-error-600 dark:text-error-400 hover:underline disabled:opacity-50"
                >
                  {t('billing.cancelAutoRenew') || 'Turn off auto-renewal'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary-200 dark:border-primary-500/30 bg-primary-50/70 dark:bg-primary-900/10 p-4 sm:p-5">
          <p className="font-semibold text-gray-900 dark:text-white">
            {inTrial
              ? `${t('billing.trialActive') || 'Your 2-month free trial is active'}${trialEnds ? ` — ${t('billing.trialEnds') || 'ends'} ${fmtDate(trialEnds)}` : ''}`
              : (t('billing.trialOver') || 'Your free trial has ended — choose a plan to keep 0% booking fees.')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {t('billing.trialNote') || 'Everyone starts with 2 months free. After that a subscription keeps unlimited bookings at 0% per-booking fee; otherwise pay-per-use (20₴ per booking) applies.'}
          </p>
        </div>
      )}

      {/* Plan cards */}
      {pricing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Monthly */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('billing.monthly') || 'Monthly'}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <Stars n={pricing.monthly} />
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {t('billing.month') || 'month'}</span>
            </div>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">≈ $10 / {t('billing.month') || 'month'}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300 flex-1">
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featUnlimited') || 'Unlimited bookings'}</li>
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featNoFee') || '0% per-booking fee'}</li>
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featAutoRenew') || 'Auto-renews monthly, cancel anytime'}</li>
            </ul>
            <button
              onClick={() => subscribe('monthly')}
              disabled={busy !== null}
              className="mt-5 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <StarIcon className="w-5 h-5" active />
              {busy === 'monthly' ? (t('billing.opening') || 'Opening…') : (t('billing.subscribeStars') || 'Subscribe with Telegram Stars')}
            </button>
          </div>

          {/* 6 months — +1 free */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('billing.sixMonth') || '6 months'}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <Stars n={pricing.sixMonth} />
            </div>
            <p className="mt-1 text-sm font-semibold text-primary-600 dark:text-primary-400">
              {(t('billing.sixMonthDeal') || 'Pay for 6 months, get {{months}} months').replace('{{months}}', String(pricing.sixMonthAccessMonths))}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300 flex-1">
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featAll') || 'Everything in Monthly'}</li>
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featBonus6') || '+1 free month = 7 total'}</li>
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featOneTime') || 'One-time payment, no auto-renew'}</li>
            </ul>
            <button
              onClick={() => subscribe('sixmonth')}
              disabled={busy !== null}
              className="mt-5 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <StarIcon className="w-5 h-5" active />
              {busy === 'sixmonth' ? (t('billing.opening') || 'Opening…') : ((t('billing.getMonths') || 'Get {{months}} months').replace('{{months}}', String(pricing.sixMonthAccessMonths)))}
            </button>
          </div>

          {/* Annual — best value */}
          <div className="relative rounded-2xl border-2 border-amber-300 dark:border-amber-500/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-900 p-5 flex flex-col">
            <span className="absolute -top-3 left-5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-amber-950">
              {t('billing.bestValue') || 'Best value'}
            </span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('billing.annual') || '1 year'}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <Stars n={pricing.annual} />
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {t('billing.year') || 'year'}</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-400">
              {(t('billing.annualDeal') || 'Pay for 12 months, get {{months}} months').replace('{{months}}', String(pricing.annualAccessMonths))}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300 flex-1">
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featAll') || 'Everything in Monthly'}</li>
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featBonus') || '+3 free months = 15 total'}</li>
              <li className="flex gap-2"><CheckCircleIcon className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" />{t('billing.featOneTime') || 'One-time payment, no auto-renew'}</li>
            </ul>
            <button
              onClick={() => subscribe('annual')}
              disabled={busy !== null}
              className="mt-5 inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium text-amber-950 bg-amber-400 hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              <StarIcon className="w-5 h-5" active />
              {busy === 'annual' ? (t('billing.opening') || 'Opening…') : ((t('billing.getMonths') || 'Get {{months}} months').replace('{{months}}', String(pricing.annualAccessMonths)))}
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        {t('billing.starsNote') || 'Payments are processed in Telegram Stars inside the Telegram app.'}
      </p>
    </div>
  );
};

export default Billing;
