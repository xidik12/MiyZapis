import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { loyaltyService, UserLoyalty, LoyaltyTransaction, LoyaltyTier, LoyaltyStats } from '@/services/loyalty.service';
import { RewardsService, LoyaltyReward, CreateRewardData } from '@/services/rewards.service';
import type { RewardRedemption } from '@/services/rewards.service';
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
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@/components/icons';

const SpecialistLoyalty: React.FC = () => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const { currency } = useCurrency();
  
  const [loading, setLoading] = useState(true);
  const [loyaltyProfile, setLoyaltyProfile] = useState<UserLoyalty | null>(null);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tiers' | 'rewards'>('overview');

  // Rewards management state
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
    fetchRewards();
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchRewards();
      fetchRedeemData();
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
      // Normalize tiers to fixed ranges (Bronze 0-499, Silver 500-999, Gold 1000-1999, Platinum 2000+)
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
          // try matching by name substring
          for (const [k, v] of byKey) {
            if (k.includes(key)) return v;
          }
          return undefined;
        };
        const result: LoyaltyTier[] = fixed.map((f, idx) => {
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
        return result;
      };
      setTiers(normalizeTiers(allTiers));
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast.error(t('loyalty.error.loadProgram') || 'Failed to load loyalty program data');
    } finally {
      setLoading(false);
    }
  };

  // Rewards management functions
  const fetchRewards = async () => {
    try {
      setRewardsLoading(true);
      const rewards = await RewardsService.getSpecialistRewards(undefined, true);
      setRewards(rewards);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error(t('loyalty.error.loadRewards') || 'Failed to load rewards');
    } finally {
      setRewardsLoading(false);
    }
  };

  const fetchRedeemData = async () => {
    try {
      const [avail, red] = await Promise.all([
        RewardsService.getAvailableRewards(),
        RewardsService.getUserRedemptions(),
      ]);
      setAvailableRewards(avail);
      setMyRedemptions(red);
    } catch (error) {
      console.error('Error fetching redeemable rewards:', error);
    }
  };

  const handleCreateReward = async (data: CreateRewardData) => {
    try {
      await RewardsService.createReward(data);
      toast.success(t('loyalty.success.createReward') || 'Reward created successfully');
      setShowCreateReward(false);
      fetchRewards();
    } catch (error) {
      console.error('Error creating reward:', error);
      toast.error(t('loyalty.error.createReward') || 'Failed to create reward');
    }
  };

  const handleUpdateReward = async (rewardId: string, data: Partial<CreateRewardData>) => {
    try {
      await RewardsService.updateReward(rewardId, data);
      toast.success(t('loyalty.success.updateReward') || 'Reward updated successfully');
      setEditingReward(null);
      fetchRewards();
    } catch (error) {
      console.error('Error updating reward:', error);
      toast.error(t('loyalty.error.updateReward') || 'Failed to update reward');
    }
  };

  const handleDeleteReward = async (rewardId: string) => {
    if (!window.confirm(t('loyalty.confirmDeleteReward') || 'Are you sure you want to delete this reward?')) {
      return;
    }

    try {
      await RewardsService.deleteReward(rewardId);
      toast.success(t('loyalty.success.deleteReward') || 'Reward deleted successfully');
      fetchRewards();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error(t('loyalty.error.deleteReward') || 'Failed to delete reward');
    }
  };

  const handleToggleRewardStatus = async (reward: LoyaltyReward) => {
    try {
      await RewardsService.updateReward(reward.id, {
        isActive: !reward.isActive
      });
      toast.success(
        reward.isActive
          ? (t('loyalty.success.deactivateReward') || 'Reward deactivated successfully')
          : (t('loyalty.success.activateReward') || 'Reward activated successfully')
      );
      fetchRewards();
    } catch (error) {
      console.error('Error toggling reward status:', error);
      toast.error(t('loyalty.error.updateRewardStatus') || 'Failed to update reward status');
    }
  };

  const handleRedeem = async (rewardId: string) => {
    try {
      setRedeemingId(rewardId);
      await RewardsService.redeemReward(rewardId);
      toast.success(t('loyalty.success.redeem') || 'Reward redeemed successfully');
      await fetchRedeemData();
    } catch (error: any) {
      console.error('Failed to redeem reward:', error);
      const message = error?.apiError?.message || (t('loyalty.error.redeem') || 'Failed to redeem reward');
      toast.error(message);
    } finally {
      setRedeemingId(null);
    }
  };

  const formatPoints = utilFormatPoints;

  const formatDate = (dateString: string) => {
    const locale = language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const interpolate = (tpl: string, vars: Record<string, string | number>) =>
    (tpl || '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

  const getTransactionDescription = (tx: LoyaltyTransaction) => {
    if (!tx) return '';
    if (tx.type === 'REDEEMED') {
      const rewardText = (tx.description || tx.reference || '').replace(/^Redeemed:\s*/i, '');
      const tpl = t('loyalty.tx.redeemedPoints') || 'Redeemed: {reward}';
      return interpolate(tpl, { reward: rewardText || '-' });
    }

    let reason = '';
    const desc = (tx.description || '').toLowerCase();
    if (tx.bookingId) {
      const tpl = t('loyalty.tx.completingBooking') || 'completing booking {bookingId}';
      reason = interpolate(tpl, { bookingId: tx.bookingId });
    } else if (desc.includes('writing a review')) {
      reason = t('loyalty.tx.writingReview') || 'writing a review';
    } else {
      reason = getTransactionTypeLabel(tx.type);
    }

    const tpl = t('loyalty.tx.earnedPoints') || 'Earned {points} points for {reason}';
    return interpolate(tpl, { points: tx.points, reason });
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
        return <FireIcon className="h-5 w-5 text-orange-500" />;
      case 'SERVICE':
        return <BriefcaseIcon className="h-5 w-5 text-indigo-500" />;
      case 'BOOKING_COMPLETION':
        return <StarIcon className="h-5 w-5 text-yellow-500" />;
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

  // Translate default benefit labels coming from normalized tiers
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
    if (b.includes('vip support')) return t('loyalty.benefit.vipSupport') || benefit;
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
          <p className="text-gray-600 dark:text-gray-400">{t('loyalty.loading') || 'Loading loyalty program...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 w-full max-w-full">
      <div className="max-w-7xl w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8 mobile-width-safe">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('loyalty.specialistProgramTitle') || 'Specialist Loyalty Program'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('loyalty.specialistProgramSubtitle') || 'Earn points by providing excellent services and grow your business'}
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
                <StarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
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
                <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
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

        {/* Specialist Benefits Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm p-4 sm:p-6 border border-blue-200 dark:border-blue-800 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('loyalty.howToEarnSpecialist') || 'How to Earn Points as a Specialist'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.bookServices') || 'Book Services'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.bookServicesHelp') || '10 points per $1 spent when booking services'}</p>
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
                <FireIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
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
                    <BriefcaseIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {loyaltyStats?.totalServices || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.servicesCompleted') || 'Services Completed'}</p>
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
                            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{getTransactionDescription(transaction)}</p>
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
                          <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{getTransactionDescription(transaction)}</p>
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
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.specialistMembershipTiers') || 'Specialist Membership Tiers'}</h4>
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
                              <TrophyIcon className="h-3 w-3 mr-1" />
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
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('loyalty.commissionBonus') || 'Commission Bonus'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rewards Tab */
            /* Includes: manage my rewards + view and redeem available rewards */}
            {activeTab === 'rewards' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Rewards Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      {t('loyalty.yourRewards') || 'Your Loyalty Rewards'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {t('loyalty.createRewardsDescription')}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateReward(true)}
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {t('loyalty.createReward') || 'Create Reward'}
                  </button>
                </div>

                {/* Rewards Grid */}
                {rewardsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                  </div>
                ) : rewards.length === 0 ? (
                  <div className="text-center py-12">
                    <GiftIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('loyalty.noRewardsYet') || 'No Rewards Yet'}</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {t('loyalty.createFirstRewardHelp') || 'Create your first loyalty reward to engage customers'}
                    </p>
                    <button
                      onClick={() => setShowCreateReward(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {t('loyalty.createYourFirstReward') || 'Create Your First Reward'}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6">
                    {rewards.map((reward) => (
                      <div key={reward.id} className={`p-4 sm:p-6 rounded-xl border-2 transition-colors ${
                        reward.isActive
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="text-lg font-bold text-gray-900 dark:text-white">
                                  {reward.title}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {reward.description}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2 ml-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  reward.isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                  {reward.isActive ? (t('common.active') || 'Active') : (t('common.inactive') || 'Inactive')}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                              <div className="flex items-center">
                                <StarIcon className="h-4 w-4 mr-1 text-primary-600" />
                                {formatPoints(reward.pointsRequired)} {t('loyalty.pointsRequired') || 'points required'}
                              </div>
                              <div className="flex items-center">
                                <GiftIcon className="h-4 w-4 mr-1 text-purple-600" />
                                {RewardsService.getRewardValue(reward)}
                              </div>
                              <div className="flex items-center">
                                <UsersIcon className="h-4 w-4 mr-1 text-blue-600" />
                                {reward.currentRedemptions} / {reward.maxRedemptions || '∞'} redeemed
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                {RewardsService.getRewardTypeLabel(reward.type)}
                              </span>
                              {reward.usageLimit !== 'UNLIMITED' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                  {reward.usageLimit.replace('_', ' ').toLowerCase()}
                                </span>
                              )}
                              {reward.validUntil && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                  Expires {new Date(reward.validUntil).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingReward(reward)}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit reward"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleToggleRewardStatus(reward)}
                              className={`p-2 rounded-lg transition-colors ${
                                reward.isActive
                                  ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                                  : 'text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/20'
                              }`}
                              title={reward.isActive ? 'Deactivate reward' : 'Activate reward'}
                            >
                              {reward.isActive ? (
                                <XMarkIcon className="h-4 w-4" />
                              ) : (
                                <StarIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteReward(reward.id)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete reward"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

                {/* Available Rewards for Me (as a user) */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {t('loyalty.redeemRewards') || 'Redeem Rewards'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('loyalty.redeemRewardsHelp') || 'Browse rewards you can redeem using your current points balance.'}
                  </p>

                  {availableRewards.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                      <GiftIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">{t('loyalty.noRewardsAvailable') || 'No rewards available right now.'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {availableRewards.map((reward) => (
                        <div key={reward.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">{reward.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{reward.description}</p>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600 dark:text-gray-400">
                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                  {formatPoints(reward.pointsRequired)} pts
                                </span>
                                {reward.validUntil && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                    Expires {new Date(reward.validUntil).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              disabled={redeemingId === reward.id}
                              onClick={() => handleRedeem(reward.id)}
                              className="inline-flex items-center px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                            >
                              {redeemingId === reward.id ? (t('loyalty.redeeming') || 'Redeeming...') : (t('loyalty.redeem') || 'Redeem')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* My Redemptions */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.myRedemptions') || 'My Redemptions'}</h4>
                  {myRedemptions.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('loyalty.noRedemptionsYet') || 'You haven’t redeemed any rewards yet.'}</p>
                  ) : (
                    <div className="space-y-2">
                      {myRedemptions.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.reward.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{new Date(r.redeemedAt).toLocaleString()} • {r.status}</p>
                          </div>
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">-{formatPoints(r.pointsUsed)} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Reward Modal */}
        {showCreateReward && (
          <CreateRewardModal
            onClose={() => setShowCreateReward(false)}
            onSubmit={handleCreateReward}
          />
        )}

        {/* Edit Reward Modal */}
        {editingReward && (
          <EditRewardModal
            reward={editingReward}
            onClose={() => setEditingReward(null)}
            onSubmit={(data) => handleUpdateReward(editingReward.id, data)}
          />
        )}
      </div>
    </div>
  );
};

// Create Reward Modal Component
interface CreateRewardModalProps {
  onClose: () => void;
  onSubmit: (data: CreateRewardData) => void;
}

const CreateRewardModal: React.FC<CreateRewardModalProps> = ({ onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PERCENTAGE_OFF' as const,
    pointsRequired: 100,
    discountPercent: 10,
    discountAmount: 5,
    usageLimit: 'UNLIMITED' as const,
    maxRedemptions: '',
    validUntil: '',
    termsConditions: '',
    minimumTier: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data: CreateRewardData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        pointsRequired: formData.pointsRequired,
        ...(formData.type === 'PERCENTAGE_OFF' && { discountPercent: formData.discountPercent }),
        ...(formData.type === 'DISCOUNT_VOUCHER' && { discountAmount: formData.discountAmount }),
        ...(formData.type === 'SERVICE_CREDIT' && { discountAmount: formData.discountAmount }),
        usageLimit: formData.usageLimit,
        ...(formData.usageLimit === 'LIMITED_TOTAL' && formData.maxRedemptions && {
          maxRedemptions: parseInt(formData.maxRedemptions)
        }),
        ...(formData.validUntil && { validUntil: new Date(formData.validUntil) }),
        ...(formData.termsConditions && { termsConditions: formData.termsConditions }),
        ...(formData.minimumTier && { minimumTier: formData.minimumTier })
      };

      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-[95vw] sm:max-w-lg">
          <form onSubmit={handleSubmit} className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  {t('loyalty.createRewardTitle') || 'Create New Reward'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.title') || 'Title'}
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="10% OFF next service"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.description') || 'Description'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={t('loyalty.rewardDescriptionPlaceholder') || 'Describe what customers get with this reward...'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('loyalty.rewardType') || 'Reward Type'}
                    </label>
                    <select
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    >
                      <option value="PERCENTAGE_OFF">{t('loyalty.rewardType.percentage') || 'Percentage Off'}</option>
                      <option value="DISCOUNT_VOUCHER">{t('loyalty.rewardType.fixed') || 'Fixed Amount Off'}</option>
                      <option value="SERVICE_CREDIT">{t('loyalty.rewardType.credit') || 'Service Credit'}</option>
                      <option value="FREE_SERVICE">{t('loyalty.rewardType.free') || 'Free Service'}</option>
                    </select>
                  </div>

                  {formData.type === 'PERCENTAGE_OFF' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('loyalty.discountPercent') || 'Discount Percentage'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  {(formData.type === 'DISCOUNT_VOUCHER' || formData.type === 'SERVICE_CREDIT') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('loyalty.discountAmount') || 'Discount Amount ($)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('loyalty.pointsRequiredLabel') || 'Points Required'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.pointsRequired}
                      onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('loyalty.usageLimit') || 'Usage Limit'}
                    </label>
                    <select
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value as any })}
                    >
                      <option value="UNLIMITED">{t('loyalty.usage.unlimited') || 'Unlimited'}</option>
                      <option value="ONCE_PER_USER">{t('loyalty.usage.oncePerUser') || 'Once per user'}</option>
                      <option value="LIMITED_TOTAL">{t('loyalty.usage.limitedTotal') || 'Limited total redemptions'}</option>
                    </select>
                  </div>

                  {formData.usageLimit === 'LIMITED_TOTAL' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('loyalty.maxRedemptions') || 'Max Total Redemptions'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.maxRedemptions}
                        onChange={(e) => setFormData({ ...formData, maxRedemptions: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('loyalty.expirationOptional') || 'Expiration Date (optional)'}
                    </label>
                    <input
                      type="date"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? (t('common.creating') || 'Creating...') : (t('loyalty.createReward') || 'Create Reward')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:text-gray-400"
              >
                {t('actions.cancel') || 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Edit Reward Modal Component (similar structure, pre-populated with existing data)
interface EditRewardModalProps {
  reward: LoyaltyReward;
  onClose: () => void;
  onSubmit: (data: Partial<CreateRewardData>) => void;
}

const EditRewardModal: React.FC<EditRewardModalProps> = ({ reward, onClose, onSubmit }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: reward.title,
    description: reward.description,
    type: reward.type as CreateRewardData['type'],
    pointsRequired: reward.pointsRequired,
    discountPercent: reward.discountPercent || 10,
    discountAmount: reward.discountAmount || 5,
    usageLimit: reward.usageLimit as CreateRewardData['usageLimit'],
    maxRedemptions: reward.maxRedemptions?.toString() || '',
    validUntil: reward.validUntil ? new Date(reward.validUntil).toISOString().split('T')[0] : '',
    termsConditions: reward.termsConditions || '',
    minimumTier: reward.minimumTier || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data: Partial<CreateRewardData> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        pointsRequired: formData.pointsRequired,
        ...(formData.type === 'PERCENTAGE_OFF' && { discountPercent: formData.discountPercent }),
        ...(formData.type === 'DISCOUNT_VOUCHER' && { discountAmount: formData.discountAmount }),
        ...(formData.type === 'SERVICE_CREDIT' && { discountAmount: formData.discountAmount }),
        usageLimit: formData.usageLimit,
        ...(formData.usageLimit === 'LIMITED_TOTAL' && formData.maxRedemptions && {
          maxRedemptions: parseInt(formData.maxRedemptions)
        }),
        ...(formData.validUntil && { validUntil: new Date(formData.validUntil) }),
        ...(formData.termsConditions && { termsConditions: formData.termsConditions }),
        ...(formData.minimumTier && { minimumTier: formData.minimumTier })
      };

      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-[95vw] sm:max-w-lg">
          <form onSubmit={handleSubmit} className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                  {(t('loyalty.editReward') || 'Edit Reward') + ': '} {reward.title}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.title') || 'Title'}
                    </label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('common.description') || 'Description'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('loyalty.pointsRequiredLabel') || 'Points Required'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.pointsRequired}
                      onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) })}
                    />
                  </div>

                  {formData.type === 'PERCENTAGE_OFF' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('loyalty.discountPercent') || 'Discount Percentage'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                      />
                    </div>
                  )}

                  {(formData.type === 'DISCOUNT_VOUCHER' || formData.type === 'SERVICE_CREDIT') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('loyalty.discountAmount') || 'Discount Amount ($)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={formData.discountAmount}
                        onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expiration Date (optional)
                    </label>
                    <input
                      type="date"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.validUntil}
                      onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Reward'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SpecialistLoyalty;
