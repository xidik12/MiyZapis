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
      await RewardsService.redeemReward(rewardId);
      toast.success('Reward redeemed successfully!');

      // Refresh both loyalty data and rewards
      await Promise.all([
        fetchLoyaltyData(),
        fetchRewards()
      ]);
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-1 sm:py-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-1 sm:mb-8">
          <h1 className="text-sm sm:text-3xl font-bold text-gray-900 dark:text-white mb-0.5 sm:mb-1 leading-tight">
            {t('loyalty.customerProgramTitle') || 'Loyalty Program'}
          </h1>
          <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">
            {t('loyalty.customerProgramSubtitle') || 'Earn points, unlock rewards, and enjoy exclusive benefits'}
          </p>
        </div>

        {/* Points Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 sm:gap-6 mb-1 sm:mb-8 px-0.5 sm:px-1">
          {/* Current Points */}
          <div className="bg-white dark:bg-gray-800 rounded sm:rounded-xl shadow-sm p-0.5 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <div className="h-4 w-4 sm:h-12 sm:w-12 bg-primary-100 dark:bg-primary-900/20 rounded flex items-center justify-center mb-0.5 sm:mb-2">
                <StarIconSolid className="h-2 w-2 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 leading-tight">{t('loyalty.currentPoints') || 'Current Points'}</p>
              <p className="text-xs sm:text-3xl font-bold text-primary-600 dark:text-primary-400 break-all leading-none">
                {formatPoints(loyaltyProfile?.currentPoints || 0)}
              </p>
            </div>
          </div>

          {/* Lifetime Points */}
          <div className="bg-white dark:bg-gray-800 rounded sm:rounded-xl shadow-sm p-0.5 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <div className="h-4 w-4 sm:h-12 sm:w-12 bg-purple-100 dark:bg-purple-900/20 rounded flex items-center justify-center mb-0.5 sm:mb-2">
                <TrophyIconSolid className="h-2 w-2 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 leading-tight">{t('loyalty.lifetimePoints') || 'Lifetime Points'}</p>
              <p className="text-xs sm:text-3xl font-bold text-purple-600 dark:text-purple-400 break-all leading-none">
                {formatPoints(loyaltyProfile?.lifetimePoints || 0)}
              </p>
            </div>
          </div>

          {/* Current Tier */}
          <div className="bg-white dark:bg-gray-800 rounded sm:rounded-xl shadow-sm p-0.5 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <div className="h-4 w-4 sm:h-12 sm:w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded flex items-center justify-center mb-0.5 sm:mb-2">
                <SparklesIcon className="h-2 w-2 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 leading-tight">{t('loyalty.currentTierShort') || 'Current Tier'}</p>
              <p className="text-xs sm:text-xl font-bold text-yellow-600 dark:text-yellow-400 truncate leading-none">
                {loyaltyStats?.currentTier?.name || 'Bronze'}
              </p>
            </div>
          </div>

          {/* Points Spent */}
          <div className="bg-white dark:bg-gray-800 rounded sm:rounded-xl shadow-sm p-0.5 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <div className="h-4 w-4 sm:h-12 sm:w-12 bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center mb-0.5 sm:mb-2">
                <ArrowDownIcon className="h-2 w-2 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5 leading-tight">{t('loyalty.pointsSpent') || 'Points Spent'}</p>
              <p className="text-xs sm:text-2xl font-bold text-red-600 dark:text-red-400 break-all leading-none">
                {formatPoints(loyaltyStats?.totalSpentPoints || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        {loyaltyStats?.nextTier && (
          <div className="bg-white dark:bg-gray-800 rounded sm:rounded-xl shadow-sm p-1 sm:p-6 border border-gray-200 dark:border-gray-700 mb-1 sm:mb-8 mx-0.5 sm:mx-1">
            <div className="flex flex-col items-center justify-center mb-2 sm:mb-4 gap-1">
              <h3 className="text-xs sm:text-lg font-semibold text-gray-900 dark:text-white text-center leading-tight">
                {(t('loyalty.progressTo') || 'Progress to') + ' ' + loyaltyStats.nextTier.name}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {Math.round(getTierProgress())}%
              </span>
            </div>
            
            <div className="relative">
              <div className="overflow-hidden h-2 sm:h-4 mb-2 sm:mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  style={{ width: `${getTierProgress()}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                ></div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span className="truncate pr-0.5 flex-1 text-left text-xs">{loyaltyStats.currentTier?.name}</span>
                <span className="truncate pl-0.5 flex-1 text-right text-xs">{loyaltyStats.nextTier.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-1 sm:mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto scrollbar-hide px-4 sm:px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
              {[
                { key: 'overview', label: t('loyalty.tab.overview') || 'Overview', icon: StarIcon },
                { key: 'history', label: t('loyalty.tab.historyShort') || 'History', icon: ClockIcon },
                { key: 'tiers', label: t('loyalty.tab.tiersShort') || 'Tiers', icon: TrophyIcon },
                { key: 'rewards', label: t('loyalty.tab.rewards') || 'Rewards', icon: GiftIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex flex-col items-center py-1.5 sm:py-4 px-1 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    } transition-colors min-w-0 flex-1 sm:flex-initial`}
                  >
                    <Icon className="h-2.5 w-2.5 sm:h-5 sm:w-5 mb-0.5 sm:mb-0 sm:mr-2" />
                    <span className="text-xs leading-tight">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-1 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-6">
                  <div className="text-center p-1.5 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <CalendarDaysIcon className="h-4 w-4 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-0.5 sm:mb-2" />
                    <p className="text-xs sm:text-2xl font-bold text-blue-600 dark:text-blue-400 leading-none">
                      {formatPoints(loyaltyStats?.monthlyPoints || 0)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Points This Month</p>
                  </div>
                  
                  <div className="text-center p-1.5 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <UsersIcon className="h-4 w-4 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 mx-auto mb-0.5 sm:mb-2" />
                    <p className="text-xs sm:text-2xl font-bold text-green-600 dark:text-green-400 leading-none">
                      {loyaltyStats?.totalReferrals || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Total Referrals</p>
                  </div>
                  
                  <div className="text-center p-1.5 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <TrophyIcon className="h-4 w-4 sm:h-8 sm:w-8 text-purple-600 dark:text-purple-400 mx-auto mb-0.5 sm:mb-2" />
                    <p className="text-xs sm:text-2xl font-bold text-purple-600 dark:text-purple-400 leading-none">
                      {loyaltyStats?.totalBadges || 0}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-tight">Badges Earned</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-xs sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-4">Recent Activity</h4>
                  <div className="space-y-1">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-1.5 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                        <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0">
                          <div className="flex-shrink-0" style={{ transform: 'scale(0.8)' }}>{getTransactionIcon(transaction.type)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-xs truncate leading-tight">{transaction.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">{formatDate(transaction.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-semibold text-xs leading-tight ${
                            transaction.type === 'EARNED' || transaction.type === 'BONUS' || transaction.type === 'REFERRAL' || transaction.type === 'CAMPAIGN'
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
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.transactionHistory') || 'Transaction History'}</h4>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.createdAt)}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'EARNED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              transaction.type === 'REDEEMED' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              transaction.type === 'BONUS' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' :
                              transaction.type === 'REFERRAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {getTransactionTypeLabel(transaction.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          transaction.type === 'EARNED' || transaction.type === 'BONUS' || transaction.type === 'REFERRAL' || transaction.type === 'CAMPAIGN'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'REDEEMED' ? '-' : '+'}{formatPoints(transaction.points)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('loyalty.points') || 'points'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tiers Tab */}
            {activeTab === 'tiers' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.membershipTiers') || 'Membership Tiers'}</h4>
                <div className="grid gap-6">
                  {tiers.map((tier) => {
                    const isCurrentTier = loyaltyStats?.currentTier?.id === tier.id;
                    const isNextTier = loyaltyStats?.nextTier?.id === tier.id;
                    
                    return (
                      <div key={tier.id} className={`p-6 rounded-xl border-2 ${
                        isCurrentTier 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                          : isNextTier
                          ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h5 className={`text-xl font-bold ${
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
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {formatPoints(tier.minPoints)} {t('loyalty.pointsRequired') || 'points required'}
                              {tier.maxPoints && ` - ${formatPoints(tier.maxPoints)} ${t('loyalty.points') || 'points'}`}
                            </p>
                            
                            <div className="space-y-2">
                              <h6 className="font-medium text-gray-900 dark:text-white">{t('loyalty.benefits') || 'Benefits'}:</h6>
                              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {tier.benefits.map((benefit, index) => (
                                  <li key={index} className="break-words">{translateBenefit(benefit)}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          {tier.discountPercentage && (
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {tier.discountPercentage}%
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{t('loyalty.commissionBonus') || 'Commission Bonus'}</p>
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
                                className={`p-4 rounded-lg border transition-colors ${
                                  canAfford && isAvailable
                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                                }`}
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
                                      disabled={!canAfford || !isAvailable}
                                      className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                        canAfford && isAvailable
                                          ? 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                                          : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      {!canAfford ? (t('loyalty.notEnoughPoints') || 'Not Enough Points') : !isAvailable ? (t('common.unavailable') || 'Unavailable') : (t('loyalty.redeem') || 'Redeem')}
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
                            {t('loyalty.noRedemptionsYet') || 'You haven’t redeemed any rewards yet.'}
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
