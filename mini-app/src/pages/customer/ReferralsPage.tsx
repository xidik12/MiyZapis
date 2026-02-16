import React, { useState, useEffect, useCallback } from 'react';
import {
  Gift,
  Copy,
  Send,
  Users,
  TrendingUp,
  Clock,
  Check,
  Share2,
  DollarSign,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { referralsStrings, commonStrings } from '@/utils/translations';

interface ReferralConfig {
  referralLink: string;
  rewardAmount: number;
  currency: string;
  description: string;
}

interface ReferralAnalytics {
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
}

interface Referral {
  id: string;
  referredUserName: string;
  status: 'registered' | 'booked' | 'reward_earned';
  rewardAmount: number;
  createdAt: string;
}

export const ReferralsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [config, setConfig] = useState<ReferralConfig | null>(null);
  const [analytics, setAnalytics] = useState<ReferralAnalytics | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Ensure user has a referral code
      const [, configData, analyticsData, referralsData] = await Promise.allSettled([
        apiService.createReferral().catch(() => {}),
        apiService.getReferralConfig(),
        apiService.getReferralAnalytics(),
        apiService.getMyReferrals(),
      ]);

      if (configData.status === 'fulfilled') {
        const raw = configData.value as any;
        // Backend returns: { config: REFERRAL_CONFIG, userType, isSpecialist, availableTypes, limits }
        const cfg = raw?.config || raw;
        // Find or construct referral link from user's existing referrals or create endpoint
        setConfig({
          referralLink: raw?.referralLink || `https://t.me/MiyZapisBot?start=ref`,
          rewardAmount: Number(cfg?.REFERRER_POINTS) || Number(cfg?.rewardAmount) || 50,
          currency: cfg?.currency || 'UAH',
          description: cfg?.description || '',
        });
      } else {
        setConfig({ referralLink: 'https://t.me/MiyZapisBot?start=ref', rewardAmount: 50, currency: 'UAH', description: '' });
      }

      if (analyticsData.status === 'fulfilled') {
        const raw = analyticsData.value as any;
        // Backend returns: { analytics: { overview: { totalReferrals, completedReferrals, ... }, ... } }
        const overview = raw?.analytics?.overview || raw?.overview || raw;
        setAnalytics({
          totalReferred: Number(overview?.totalReferrals) || Number(overview?.totalReferred) || 0,
          totalEarned: Number(overview?.totalPointsEarned) || Number(overview?.totalEarned) || 0,
          pendingRewards: Number(overview?.pendingReferrals) || Number(overview?.pendingRewards) || 0,
        });
      } else {
        setAnalytics({ totalReferred: 0, totalEarned: 0, pendingRewards: 0 });
      }

      if (referralsData.status === 'fulfilled') {
        const raw = referralsData.value as any;
        // Backend returns: { referrals: [...], pagination: {...} }
        const list = raw?.referrals || raw?.items || (Array.isArray(raw) ? raw : []);
        setReferrals(list.map((r: any) => ({
          id: r.id,
          referredUserName: r.referred?.name || r.referredUserName || r.referralCode || '',
          status: (r.status || '').toLowerCase() === 'completed' ? 'reward_earned'
            : (r.status || '').toLowerCase() === 'pending' ? 'registered'
            : r.status || 'registered',
          rewardAmount: Number(r.referrerRewardValue) || Number(r.rewardAmount) || Number(r.pointsAwarded) || 0,
          createdAt: r.createdAt,
        })));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyLink = async () => {
    if (!config?.referralLink) return;

    try {
      await navigator.clipboard.writeText(config.referralLink);
      setLinkCopied(true);
      dispatch(addToast({
        type: 'success',
        title: t(referralsStrings, 'linkCopied', locale),
        message: config.referralLink,
      }));
      hapticFeedback.notificationSuccess();
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      hapticFeedback.notificationError();
    }
  };

  const handleShareTelegram = () => {
    if (!config?.referralLink) return;
    hapticFeedback.impactLight();

    const shareText = locale === 'uk'
      ? `Приєднуйся до MiyZapis! Зареєструйся за моїм посиланням та отримай бонус!`
      : locale === 'ru'
      ? `Присоединяйся к MiyZapis! Зарегистрируйся по моей ссылке и получи бонус!`
      : `Join MiyZapis! Sign up with my link and get a bonus!`;

    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(config.referralLink)}&text=${encodeURIComponent(shareText)}`;

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <Users size={16} className="text-accent-primary" />;
      case 'booked':
        return <Clock size={16} className="text-accent-yellow" />;
      case 'reward_earned':
        return <Gift size={16} className="text-accent-green" />;
      default:
        return <Clock size={16} className="text-text-secondary" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registered':
        return t(referralsStrings, 'registered', locale);
      case 'booked':
        return t(referralsStrings, 'booked', locale);
      case 'reward_earned':
        return t(referralsStrings, 'rewardEarned', locale);
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-accent-primary/15 text-accent-primary';
      case 'booked':
        return 'bg-accent-yellow/15 text-accent-yellow';
      case 'reward_earned':
        return 'bg-accent-green/15 text-accent-green';
      default:
        return 'bg-bg-hover text-text-secondary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={t(referralsStrings, 'title', locale)} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Share & Earn Hero Card */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 text-white shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={24} />
              <h2 className="text-lg font-bold">{t(referralsStrings, 'shareAndEarn', locale)}</h2>
            </div>
            <p className="text-sm opacity-90 mb-4">
              {t(referralsStrings, 'shareDesc', locale)}
            </p>

            {/* Referral Link */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mb-3">
              <p className="text-xs opacity-70 mb-1">{t(referralsStrings, 'shareLink', locale)}</p>
              <p className="text-sm font-mono truncate">{config?.referralLink || '...'}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl py-3 text-sm font-medium transition-colors"
              >
                {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                {linkCopied
                  ? (locale === 'uk' ? 'Скопійовано!' : locale === 'ru' ? 'Скопировано!' : 'Copied!')
                  : t(referralsStrings, 'copyLink', locale)}
              </button>
              <button
                onClick={handleShareTelegram}
                className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl py-3 text-sm font-medium transition-colors"
              >
                <Send size={16} />
                Telegram
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center py-3">
              <Users size={20} className="text-accent-primary mx-auto mb-1" />
              <div className="text-lg font-bold text-text-primary">
                {analytics?.totalReferred || 0}
              </div>
              <div className="text-xs text-text-secondary">
                {t(referralsStrings, 'totalReferred', locale)}
              </div>
            </Card>
            <Card className="text-center py-3">
              <DollarSign size={20} className="text-accent-green mx-auto mb-1" />
              <div className="text-lg font-bold text-text-primary">
                {analytics?.totalEarned || 0}
              </div>
              <div className="text-xs text-text-secondary">
                {t(referralsStrings, 'totalEarned', locale)}
              </div>
            </Card>
            <Card className="text-center py-3">
              <Clock size={20} className="text-accent-yellow mx-auto mb-1" />
              <div className="text-lg font-bold text-text-primary">
                {analytics?.pendingRewards || 0}
              </div>
              <div className="text-xs text-text-secondary">
                {t(referralsStrings, 'pendingRewards', locale)}
              </div>
            </Card>
          </div>
        </div>

        {/* Referral List */}
        <div className="px-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary px-1">
            {t(referralsStrings, 'yourReferrals', locale)}
          </h3>

          {referrals.length === 0 ? (
            <Card className="text-center py-10">
              <Share2 size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{t(referralsStrings, 'noReferrals', locale)}</p>
              <p className="text-text-secondary text-sm mt-1">{t(referralsStrings, 'startSharing', locale)}</p>
            </Card>
          ) : (
            referrals.map(referral => (
              <Card key={referral.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                    {getStatusIcon(referral.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {referral.referredUserName}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(referral.createdAt).toLocaleDateString(
                        locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(referral.status)}`}>
                      {getStatusLabel(referral.status)}
                    </span>
                    {referral.rewardAmount > 0 && referral.status === 'reward_earned' && (
                      <p className="text-xs font-semibold text-accent-green mt-1">
                        +{formatCurrency(referral.rewardAmount, config?.currency, locale)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
