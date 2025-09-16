import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { loyaltyService, UserLoyalty, LoyaltyTransaction, LoyaltyTier, LoyaltyStats } from '@/services/loyalty.service';
import { RewardsService, LoyaltyReward, RewardRedemption } from '@/services/rewards.service';
import { formatPoints as utilFormatPoints } from '@/utils/formatPoints';
import { toast } from 'react-toastify';
import {
  StarIcon,
  GiftIcon,
  TrophyIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  CalendarDaysIcon,
  UsersIcon,
  CurrencyDollarIcon,
  FireIcon,
  BriefcaseIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
  TrophyIcon as TrophyIconSolid,
  FireIcon as FireIconSolid,
} from '@heroicons/react/24/solid';

const CustomerLoyalty: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { currency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [loyaltyProfile, setLoyaltyProfile] = useState<UserLoyalty | null>(null);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tiers' | 'rewards'>('overview');

  // Rewards state
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
    fetchRewards();
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchRewards();
    }
  }, [activeTab]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const [profile, stats, transactionHistory, allTiers] = await Promise.all([
        loyaltyService.getUserLoyalty(),
        loyaltyService.getLoyaltyStats(),
        loyaltyService.getTransactions(1, 10),
        loyaltyService.getTiers()
      ]);

      setLoyaltyProfile(profile);
      setLoyaltyStats(stats);
      setTransactions(transactionHistory.transactions);
      // Normalize tiers ranges to fixed thresholds
      const normalizeTiers = (tiers: LoyaltyTier[]): LoyaltyTier[] => {
        const byKey = new Map<string, LoyaltyTier>();
        for (const t of tiers) {
          const k = (t.slug || t.name || '').toLowerCase();
          byKey.set(k, t);
        }
        const fixed = [
          { key: 'bronze', name: 'Bronze', min: 0, max: 499, defaults: ['Basic support', 'Standard booking', 'Point earning'] },
          { key: 'silver', name: 'Silver', min: 500, max: 999, defaults: ['Priority support', 'Early booking access'] },
          { key: 'gold', name: 'Gold', min: 1000, max: 1999, defaults: ['5% bonus points', 'Priority support', 'Early access'] },
          { key: 'platinum', name: 'Platinum', min: 2000, max: undefined as number | undefined, defaults: ['10% bonus points', 'VIP support', 'Exclusive services'] },
        ];
        const pick = (key: string): LoyaltyTier | undefined => {
          const direct = byKey.get(key);
          if (direct) return direct;
          for (const [k, v] of byKey) {
            if (k.includes(key)) return v;
          }
          return undefined;
        };
        return fixed.map((f, idx) => {
          const found = pick(f.key);
          const base: LoyaltyTier = found
            ? { ...found }
            : {
                id: `local-${f.key}`,
                name: f.name,
                slug: f.key,
                minPoints: f.min,
                maxPoints: f.max,
                benefits: f.defaults,
                discountPercentage: idx === 2 ? 5 : idx === 3 ? 10 : 0,
                prioritySupport: idx >= 1,
                exclusiveOffers: idx >= 3,
                createdAt: new Date(0).toISOString(),
              };
          base.name = f.name;
          base.slug = f.key;
          base.minPoints = f.min;
          base.maxPoints = f.max;
          return base;
        });
      };
      setTiers(normalizeTiers(allTiers));
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast.error('Failed to load loyalty program data');
    } finally {
      setLoading(false);
    }
  };

  // Rewards functions
  const fetchRewards = async () => {
    try {
      setRewardsLoading(true);
      const [rewards, redemptions] = await Promise.all([
        RewardsService.getAvailableRewards(),
        RewardsService.getUserRedemptions()
      ]);
      setAvailableRewards(rewards);
      setMyRedemptions(redemptions);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards');
    } finally {
      setRewardsLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    if (!loyaltyProfile) return;

    const reward = availableRewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (loyaltyProfile.currentPoints < reward.pointsRequired) {
      toast.error(t('loyalty.insufficientPoints') || 'Insufficient points for this reward');
      return;
    }

    const prefix = t('loyalty.confirmRedeemPrefix') || 'Redeem';
    const suffix = t('loyalty.confirmRedeemSuffix') || 'for';
    if (!window.confirm(`${prefix} "${reward.title}" ${suffix} ${formatPoints(reward.pointsRequired)} ${t('loyalty.points') || 'points'}?`)) {
      return;
    }

    try {
      setRedeemingId(rewardId);
      await RewardsService.redeemReward(rewardId);
      toast.success('Reward redeemed successfully!');

      // Refresh both loyalty data and rewards
      await Promise.all([
        fetchLoyaltyData(),
        fetchRewards()
      ]);
    } catch (error: any) {
      console.error('Error redeeming reward:', error);
      const message = error?.apiError?.message || 'Failed to redeem reward';
      toast.error(message);
    } finally {
      setRedeemingId(null);
    }
  };

  const formatPoints = utilFormatPoints;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNED':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'REDEEMED':
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case 'BONUS':
        return <GiftIcon className="h-5 w-5 text-purple-500" />;
      case 'REFERRAL':
        return <UsersIcon className="h-5 w-5 text-blue-500" />;
      case 'CAMPAIGN':
        return <FireIconSolid className="h-5 w-5 text-orange-500" />;
      case 'SERVICE':
        return <BriefcaseIcon className="h-5 w-5 text-indigo-500" />;
      case 'BOOKING_COMPLETION':
        return <StarIconSolid className="h-5 w-5 text-yellow-500" />;
      case 'PROFILE_VIEW':
        return <EyeIcon className="h-5 w-5 text-cyan-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'EARNED': return t('loyalty.tx.earned') || 'earned';
      case 'REDEEMED': return t('loyalty.tx.redeemed') || 'redeemed';
      case 'BONUS': return t('loyalty.tx.bonus') || 'bonus';
      case 'REFERRAL': return t('loyalty.tx.referral') || 'referral';
      case 'CAMPAIGN': return t('loyalty.tx.campaign') || 'campaign';
      case 'SERVICE': return t('loyalty.tx.service') || 'service';
      case 'BOOKING_COMPLETION': return t('loyalty.tx.bookingCompletion') || 'booking completion';
      case 'PROFILE_VIEW': return t('loyalty.tx.profileView') || 'profile view';
      case 'EXPIRED': return t('loyalty.tx.expired') || 'expired';
      case 'ADJUSTMENT': return t('loyalty.tx.adjustment') || 'adjustment';
      default: return type.toLowerCase().replace('_', ' ');
    }
  };

  const getTierProgress = () => {
    if (!loyaltyProfile || !loyaltyStats) return 0;

    const currentPoints = loyaltyProfile.currentPoints;
    const currentTierMin = loyaltyStats.currentTier?.minPoints || 0;
    const nextTierMin = loyaltyStats.nextTier?.minPoints || currentTierMin;

    if (nextTierMin === currentTierMin) return 100;

    const progress = ((currentPoints - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const translateBenefit = (benefit: string) => {
    const b = (benefit || '').toLowerCase();
    if (b.includes('basic support')) return t('loyalty.benefit.basicSupport') || benefit;
    if (b.includes('standard booking')) return t('loyalty.benefit.standardBooking') || benefit;
    if (b.includes('point earning')) return t('loyalty.benefit.pointEarning') || benefit;
    if (b.includes('priority support')) return t('loyalty.benefit.prioritySupport') || benefit;
    if (b.includes('early booking')) return t('loyalty.benefit.earlyBookingAccess') || benefit;
    if (b.includes('5%')) return t('loyalty.benefit.bonusPoints5') || benefit;
    if (b.includes('10%')) return t('loyalty.benefit.bonusPoints10') || benefit;
    if (b.includes('exclusive services')) return t('loyalty.benefit.exclusiveServices') || benefit;
    if (b.includes('free cancellation')) return t('loyalty.benefit.freeCancellation') || benefit;
    return benefit;
  };

  // Tier skin mapping for gamified look
  const getTierSkin = (name?: string) => {
    const n = (name || '').toUpperCase();
    switch (n) {
      case 'SILVER':
        return {
          summaryGradient: 'from-slate-100 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20',
          donutStroke: 'stroke-slate-500',
          accentText: 'text-slate-700 dark:text-slate-300',
          chipBg: 'bg-slate-600 text-white',
          benefitCheck: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
          currentCard: 'border-slate-400 bg-slate-50 dark:bg-slate-900/20',
          nextCard: 'border-gray-300 bg-gray-50 dark:bg-gray-900/20',
        };
      case 'GOLD':
        return {
          summaryGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
          donutStroke: 'stroke-yellow-500',
          accentText: 'text-yellow-700 dark:text-yellow-300',
          chipBg: 'bg-yellow-600 text-white',
          benefitCheck: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
          currentCard: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
          nextCard: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
        };
      case 'PLATINUM':
        return {
          summaryGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
          donutStroke: 'stroke-indigo-500',
          accentText: 'text-indigo-700 dark:text-indigo-300',
          chipBg: 'bg-indigo-600 text-white',
          benefitCheck: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
          currentCard: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
          nextCard: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
        };
      case 'BRONZE':
      default:
        return {
          summaryGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          donutStroke: 'stroke-amber-500',
          accentText: 'text-amber-700 dark:text-amber-300',
          chipBg: 'bg-amber-600 text-white',
          benefitCheck: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          currentCard: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
          nextCard: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading loyalty program...</p>
        </div>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 w-full max-w-full">
      <div className="max-w-7xl w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('loyalty.customerProgramTitle') || 'Loyalty Program'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('loyalty.customerProgramSubtitle') || 'Earn points, unlock rewards, and enjoy exclusive benefits'}
          </p>
        </div>

        {/* Points Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Current Points */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.currentPoints') || 'Current Points'}</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPoints(loyaltyProfile?.currentPoints || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <StarIconSolid className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          {/* Lifetime Points */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.lifetimePoints') || 'Lifetime Points'}</p>
                <p className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {formatPoints(loyaltyProfile?.lifetimePoints || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <TrophyIconSolid className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Current Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.currentTierShort') || 'Current Tier'}</p>
                <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {loyaltyStats?.currentTier?.name || 'Bronze'}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Points Spent */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.pointsSpent') || 'Points Spent'}</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatPoints(loyaltyStats?.totalSpentPoints || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <ArrowDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        {loyaltyStats?.nextTier && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {(t('loyalty.progressTo') || 'Progress to') + ' ' + loyaltyStats.nextTier.name}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(getTierProgress())}%
              </span>
            </div>

            <div className="relative">
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  style={{ width: `${getTierProgress()}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                ></div>
              </div>

              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{loyaltyStats.currentTier?.name} ({formatPoints(loyaltyStats.currentTier?.minPoints || 0)})</span>
                <span>{loyaltyStats.nextTier.name} ({formatPoints(loyaltyStats.nextTier.minPoints)})</span>
              </div>
            </div>
          </div>
        )}

        {/* Customer Benefits Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm p-4 sm:p-6 border border-blue-200 dark:border-blue-800 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('loyalty.howToEarnCustomer') || 'How to Earn Points as a Customer'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.bookServices') || 'Book Services'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.bookServicesHelpCustomer') || '10 points per $1 spent when booking services'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.redeemRewards') || 'Redeem Rewards'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.redeemRewardsHelpShort') || 'Use points to redeem discount vouchers'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.referrals') || 'Referrals'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.referralsHelp') || 'Refer new customers and specialists'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <FireIconSolid className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.specialCampaigns') || 'Special Campaigns'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.specialCampaignsHelp') || 'Participate in bonus point events'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 min-w-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto px-4 sm:px-6 scrollbar-hide min-w-0">
              {[
                { key: 'overview', label: t('loyalty.tab.overview') || 'Overview', shortLabel: t('loyalty.tab.overview') || 'Overview', icon: StarIcon },
                { key: 'history', label: t('loyalty.tab.history') || 'Transaction History', shortLabel: t('loyalty.tab.historyShort') || 'History', icon: ClockIcon },
                { key: 'tiers', label: t('loyalty.tab.tiers') || 'Tiers & Benefits', shortLabel: t('loyalty.tab.tiersShort') || 'Tiers', icon: TrophyIcon },
                { key: 'rewards', label: t('loyalty.tab.rewards') || 'Rewards', shortLabel: t('loyalty.tab.rewards') || 'Rewards', icon: GiftIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center py-3 sm:py-4 px-2 sm:px-4 mr-4 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    } transition-colors`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatPoints(loyaltyStats?.monthlyPoints || 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.pointsThisMonth') || 'Points This Month'}</p>
                  </div>

                  <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {loyaltyStats?.totalReferrals || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.totalReferrals') || 'Total Referrals'}</p>
                  </div>

                  <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {loyaltyStats?.totalBadges || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.badgesEarned') || 'Badges Earned'}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('loyalty.recentActivity') || 'Recent Activity'}</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {getTransactionIcon(transaction.type)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{transaction.description}</p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`font-semibold text-sm sm:text-base ${
                            transaction.type === 'EARNED' || transaction.type === 'BONUS' || transaction.type === 'REFERRAL' || transaction.type === 'CAMPAIGN' || transaction.type === 'SERVICE' || transaction.type === 'BOOKING_COMPLETION' || transaction.type === 'PROFILE_VIEW'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'REDEEMED' ? '-' : '+'}{formatPoints(transaction.points)} pts
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.transactionHistory') || 'Transaction History'}</h4>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        {getTransactionIcon(transaction.type)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{transaction.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.createdAt)}</p>
                            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'EARNED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              transaction.type === 'REDEEMED' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              transaction.type === 'BONUS' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                              transaction.type === 'REFERRAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              transaction.type === 'SERVICE' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400' :
                              transaction.type === 'BOOKING_COMPLETION' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              transaction.type === 'PROFILE_VIEW' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {getTransactionTypeLabel(transaction.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`font-bold text-base sm:text-lg ${
                          transaction.type === 'EARNED' || transaction.type === 'BONUS' || transaction.type === 'REFERRAL' || transaction.type === 'CAMPAIGN' || transaction.type === 'SERVICE' || transaction.type === 'BOOKING_COMPLETION' || transaction.type === 'PROFILE_VIEW'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'REDEEMED' ? '-' : '+'}{formatPoints(transaction.points)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('loyalty.points') || 'points'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tiers Tab */}
            {activeTab === 'tiers' && (
              <div className="space-y-4 sm:space-y-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.membershipTiers') || 'Membership Tiers'}</h4>
                {/* Summary card */}
                {(() => {
                  const skin = getTierSkin(loyaltyStats?.currentTier?.name || 'BRONZE');
                  return (
                    <div className={`p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r ${skin.summaryGradient}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{t('loyalty.currentTier') || 'Your current tier'}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                              {loyaltyStats?.currentTier?.name || 'BRONZE'}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${skin.chipBg}`}>
                              <TrophyIconSolid className="h-3 w-3 mr-1" />
                              {t('nav.level') || 'Level'}
                            </span>
                          </div>
                          <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/60 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200">
                            {(() => {
                              const nextName = loyaltyStats?.nextTier?.name;
                              const nextMin = loyaltyStats?.nextTier?.minPoints || 0;
                              const curPts = loyaltyProfile?.currentPoints || 0;
                              const toNext = Math.max(0, nextMin - curPts);
                              return nextName ? `${formatPoints(toNext)} ${t('loyalty.points') || 'points'} ${t('loyalty.next') || 'Next'}: ${nextName}` : t('common.notAvailable') || 'N/A';
                            })()}
                          </div>
                        </div>
                        <div className="justify-self-center">
                          {/* Donut progress */}
                          {(() => {
                            const progress = getTierProgress();
                            const size = 96;
                            const stroke = 10;
                            const radius = (size - stroke) / 2;
                            const circumference = 2 * Math.PI * radius;
                            const dash = (progress / 100) * circumference;
                            const ring = getTierSkin(loyaltyStats?.currentTier?.name || 'BRONZE').donutStroke;
                            return (
                              <svg width={size} height={size} className="rotate-[-90deg]">
                                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} className="fill-none stroke-gray-200 dark:stroke-gray-700"/>
                                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} className={`fill-none ${ring}`} strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"/>
                                <text x="50%" y="50%" className="rotate-[90deg] fill-gray-900 dark:fill-gray-100 text-xs" textAnchor="middle" dominantBaseline="middle">{Math.round(progress)}%</text>
                              </svg>
                            );
                          })()}
                        </div>
                        <div>
                          {(() => {
                            const accent = getTierSkin(loyaltyStats?.currentTier?.name || 'BRONZE').accentText;
                            return (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-700/60">
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{t('labels.amount') || 'Amount'}</p>
                                  <p className={`font-semibold ${accent}`}>{formatPoints(loyaltyProfile?.currentPoints || 0)} {t('loyalty.points') || 'points'}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/60 dark:bg-gray-700/60">
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{t('labels.spent') || 'Spent'}</p>
                                  <p className={`font-semibold ${accent}`}>{formatPoints(loyaltyStats?.totalSpentPoints || 0)} {t('loyalty.pointsShort') || 'pts'}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Tiers chart */}
                {tiers.length > 0 && (
                  <div className="p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="mb-3 sm:mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t('loyalty.tiersProgress') || 'Tiers Progress'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('loyalty.tiersProgressHelp') || 'See how your points map across tiers'}</p>
                    </div>
                    <div className="relative overflow-hidden">
                      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="absolute inset-0 flex justify-between">
                        {tiers.map((tier, idx) => {
                          const min = tier.minPoints;
                          const max = tier.maxPoints ?? Math.max(...tiers.map(t => (t.maxPoints ?? t.minPoints + 1)));
                          const totalSpan = Math.max(...tiers.map(t => (t.maxPoints ?? t.minPoints + 1)));
                          const leftPct = Math.min(100, Math.max(0, (min / totalSpan) * 100));
                          const isCurrent = loyaltyStats?.currentTier?.id === tier.id;
                          return (
                            <div key={tier.id} className="absolute" style={{ left: `calc(${leftPct}% - 8px)` }}>
                              <div className={`h-4 w-4 rounded-full border-2 ${isCurrent ? 'bg-primary-500 border-primary-600' : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500'}`}></div>
                              <div className="mt-1 text-center w-20 -ml-8">
                                <div className={`text-[10px] sm:text-xs font-medium ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>{tier.name}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">{formatPoints(min)} {t('loyalty.pointsShort') || 'pts'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Current position marker */}
                      {loyaltyProfile && (
                        <div className="absolute -top-2" style={{ left: `${Math.min(100, Math.max(0, (loyaltyProfile.currentPoints / Math.max(...tiers.map(t => (t.maxPoints ?? t.minPoints + 1)))) * 100))}%` }}>
                          <div className="h-6 w-1 bg-primary-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid gap-4 sm:gap-6">
                  {tiers.map((tier) => {
                    const isCurrentTier = loyaltyStats?.currentTier?.id === tier.id;
                    const isNextTier = loyaltyStats?.nextTier?.id === tier.id;
                    const skin = getTierSkin(tier.name);

                    return (
                      <div key={tier.id} className={`p-4 sm:p-6 rounded-xl border-2 relative overflow-hidden ${
                        isCurrentTier
                          ? skin.currentCard
                          : isNextTier
                          ? skin.nextCard
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                              <h5 className={`text-lg sm:text-xl font-bold ${
                                isCurrentTier ? 'text-primary-700 dark:text-primary-300' :
                                isNextTier ? 'text-yellow-700 dark:text-yellow-300' :
                                'text-gray-900 dark:text-white'
                              }`}>
                                {tier.name}
                              </h5>
                              {isCurrentTier && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                                  {t('loyalty.current') || 'Current'}
                                </span>
                              )}
                              {isNextTier && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-600 text-white">
                                  {t('loyalty.nextTier') || 'Next Tier'}
                                </span>
                              )}
                            </div>

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                              {formatPoints(tier.minPoints)} {t('loyalty.pointsRequired') || 'points required'}
                              {tier.maxPoints && ` - ${formatPoints(tier.maxPoints)} ${t('loyalty.points') || 'points'}`}
                            </p>

                            <div className="space-y-2">
                              <h6 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.benefits') || 'Benefits'}:</h6>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {tier.benefits.map((benefit, index) => (
                                  <div key={index} className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                                    <span className={`h-5 w-5 rounded-full ${skin.benefitCheck} flex items-center justify-center mr-2`}>✓</span>
                                    <span className="break-words">{translateBenefit(benefit)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {tier.discountPercentage && (
                            <div className="text-center sm:text-right mt-4 sm:mt-0">
                              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                                {tier.discountPercentage}%
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('loyalty.discount') || 'Discount'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="space-y-4 sm:space-y-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {t('loyalty.availableRewards') || 'Available Rewards'}
                </h4>

                {rewardsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6">
                    {/* Available Rewards Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          {t('loyalty.rewardsYouCanRedeem') || 'Rewards You Can Redeem'} ({availableRewards.length})
                        </h5>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('loyalty.yourPoints') || 'Your Points'}: {formatPoints(loyaltyProfile?.currentPoints || 0)}
                        </div>
                      </div>

                      {availableRewards.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t('loyalty.noRewardsAvailable') || 'No rewards available right now.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableRewards.map((reward) => {
                            const canAfford = (loyaltyProfile?.currentPoints || 0) >= reward.pointsRequired;
                            const isAvailable = RewardsService.isRewardAvailable(reward);

                            return (
                              <div
                                key={reward.id}
                                className="p-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h6 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                          {reward.title}
                                        </h6>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          {reward.description}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                                      <div className="flex items-center text-primary-600 dark:text-primary-400">
                                        <StarIcon className="h-4 w-4 mr-1" />
                                        {formatPoints(reward.pointsRequired)} points
                                      </div>
                                      <div className="flex items-center text-purple-600 dark:text-purple-400">
                                        <GiftIcon className="h-4 w-4 mr-1" />
                                        {RewardsService.getRewardValue(reward)}
                                      </div>
                                      {reward.specialist && (
                                        <div className="flex items-center text-blue-600 dark:text-blue-400">
                                          <UsersIcon className="h-4 w-4 mr-1" />
                                          {reward.specialist.user.firstName} {reward.specialist.user.lastName}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                        {RewardsService.getRewardTypeLabel(reward.type)}
                                      </span>
                                      {reward.usageLimit === 'ONCE_PER_USER' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                          One time only
                                        </span>
                                      )}
                                      {reward.validUntil && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                          Expires {new Date(reward.validUntil).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex-shrink-0">
                                    <button
                                      onClick={() => handleRedeemReward(reward.id)}
                                      disabled={!canAfford || !isAvailable || redeemingId === reward.id}
                                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                        canAfford && isAvailable
                                          ? 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                                          : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      {redeemingId === reward.id ? (t('loyalty.redeeming') || 'Redeeming...') :
                                       !canAfford ? (t('loyalty.notEnoughPoints') || 'Not Enough Points') :
                                       !isAvailable ? (t('common.unavailable') || 'Unavailable') :
                                       (t('loyalty.redeem') || 'Redeem')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* My Redemptions Section */}
                    <div className="space-y-4">
                      <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                        {t('loyalty.myRedemptions') || 'My Redemptions'} ({myRedemptions.length})
                      </h5>

                      {myRedemptions.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                          <TrophyIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t('loyalty.noRedemptionsYet') || 'You haven\'t redeemed any rewards yet.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myRedemptions.slice(0, 10).map((redemption) => {
                            const statusInfo = RewardsService.formatRedemptionStatus(redemption.status);

                            return (
                              <div key={redemption.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h6 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                        {redemption.reward.title}
                                      </h6>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                        statusInfo.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                        statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                        statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                        statusInfo.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                      }`}>
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                      <span>{formatPoints(redemption.pointsUsed)} {t('loyalty.pointsUsed') || 'points used'}</span>
                                      <span>•</span>
                                      <span>{formatDate(redemption.redeemedAt)}</span>
                                      {redemption.expiresAt && redemption.status === 'APPROVED' && (
                                        <>
                                          <span>•</span>
                                          <span>{t('common.expires') || 'Expires'} {formatDate(redemption.expiresAt)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {myRedemptions.length > 10 && (
                            <div className="text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(t('common.showing') || 'Showing')} 10 {(t('common.of') || 'of')} {myRedemptions.length} {(t('loyalty.redemptions') || 'redemptions')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoyalty;
