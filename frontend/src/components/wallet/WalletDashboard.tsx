import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Wallet, History, CreditCard, Gift, Users, TrendingUp } from 'lucide-react';
import WalletBalance from './WalletBalance';
import WalletTransactionHistory from './WalletTransactionHistory';
import { referralService } from '../../services/referral.service';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { walletService } from '../../services/wallet.service';
import { ReferralAnalytics } from '../../types/referral';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';

interface WalletDashboardProps {
  className?: string;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [referralAnalytics, setReferralAnalytics] = useState<ReferralAnalytics | null>(null);
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  // Only specialists should see earnings tab
  const isSpecialist = user?.userType === 'specialist';

  useEffect(() => {
    const loadReferralAnalytics = async () => {
      try {
        const analytics = await referralService.getAnalytics();
        setReferralAnalytics(analytics);
      } catch (error) {
        console.warn('Failed to load referral analytics for wallet earnings:', error);
      }
    };

    if (activeTab === 'earnings') {
      loadReferralAnalytics();
    }
  }, [activeTab]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('wallet.title')}</h1>
          <p className="text-muted-foreground">
            {t('wallet.subtitle')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide px-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-shrink-0 mobile-touch-target`}
            >
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('wallet.tabs.overview')}</span>
              <span className="xs:hidden">{t('wallet.tabs.overviewShort')}</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-shrink-0 mobile-touch-target`}
            >
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">{t('wallet.tabs.transactions')}</span>
              <span className="xs:hidden">{t('wallet.tabs.transactionsShort')}</span>
            </button>
            {isSpecialist && (
              <button
                onClick={() => setActiveTab('earnings')}
                className={`${
                  activeTab === 'earnings'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-3 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-shrink-0 mobile-touch-target`}
              >
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">{t('wallet.tabs.earnings')}</span>
                <span className="xs:hidden">{t('wallet.tabs.earningsShort')}</span>
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Wallet Balance */}
            <div className="lg:col-span-1">
              <WalletBalance
                showTransactions={true}
                onTransactionsClick={() => setActiveTab('transactions')}
              />
            </div>

            {/* Quick Stats */}
            <div className="lg:col-span-2 space-y-4">
              {/* Recent Activity */}
              <Card>
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{t('wallet.recentActivity.title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('wallet.recentActivity.subtitle')}
                  </p>
                  <WalletTransactionHistory
                    limit={5}
                    showFilters={false}
                    compact={true}
                  />
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{t('wallet.quickActions.title')}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('wallet.quickActions.subtitle')}
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Button variant="secondary" className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Gift className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span>{t('wallet.quickActions.redeemRewards')}</span>
                    </Button>
                    <Button variant="secondary" className="h-16 sm:h-20 flex flex-col gap-1 sm:gap-2 text-xs sm:text-sm">
                      <Users className="h-4 w-4 sm:h-6 sm:w-6" />
                      <span>{t('wallet.quickActions.referFriends')}</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
          <WalletTransactionHistory />
          </div>
        )}

        {activeTab === 'earnings' && isSpecialist && (
          <div className="space-y-6">
          <EarningsOverview referralAnalytics={referralAnalytics} formatPrice={formatPrice} />
          </div>
        )}
      </div>
    </div>
  );
};

// Earnings Overview Component
interface EarningsOverviewProps {
  referralAnalytics: ReferralAnalytics | null;
  formatPrice: (amount: number) => string;
}

const EarningsOverview: React.FC<EarningsOverviewProps> = ({ referralAnalytics, formatPrice }) => {
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const loadEarningsTransactions = async () => {
      try {
        const transactions = await walletService.getTransactionHistory({ limit: 100 });
        const earningsTransactions = transactions.transactions.filter(t =>
          t.type === 'CREDIT' &&
          ['REFERRAL_REWARD', 'LOYALTY_POINTS_CONVERTED', 'FORFEITURE_SPLIT'].includes(t.reason)
        );
        setWalletTransactions(earningsTransactions);
      } catch (error) {
        console.warn('Failed to load earnings transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadEarningsTransactions();
  }, []);

  const calculateEarnings = () => {
    const referralEarnings = walletTransactions
      .filter(t => t.reason === 'REFERRAL_REWARD')
      .reduce((sum, t) => sum + t.amount, 0);

    const loyaltyEarnings = walletTransactions
      .filter(t => t.reason === 'LOYALTY_POINTS_CONVERTED')
      .reduce((sum, t) => sum + t.amount, 0);

    const forfeitureEarnings = walletTransactions
      .filter(t => t.reason === 'FORFEITURE_SPLIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEarnings = referralEarnings + loyaltyEarnings + forfeitureEarnings;

    return { totalEarnings, referralEarnings, loyaltyEarnings, forfeitureEarnings };
  };

  const earnings = calculateEarnings();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Total Earnings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">{t('wallet.earnings.totalEarnings')}</h3>
            <CreditCard className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatPrice(earnings.totalEarnings)}</div>
          <p className="text-xs text-muted-foreground">
            {t('wallet.earnings.fromReferralsRewards')}
          </p>
          {earnings.totalEarnings > 0 && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">{t('wallet.earnings.activeEarnings')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Referral Earnings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">{t('wallet.earnings.referralEarnings')}</h3>
            <Users className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatPrice(earnings.referralEarnings)}</div>
          <p className="text-xs text-muted-foreground">
            {t('wallet.earnings.fromSuccessfulReferrals')}
          </p>
          {referralAnalytics && (
            <div className="text-xs text-gray-500 mt-1">
              {referralAnalytics.overview.completedReferrals} {t('wallet.earnings.completedReferrals')}
            </div>
          )}
        </div>
      </Card>

      {/* Reward Earnings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">{t('wallet.earnings.rewardEarnings')}</h3>
            <Gift className="h-4 w-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold">{formatPrice(earnings.loyaltyEarnings + earnings.forfeitureEarnings)}</div>
          <p className="text-xs text-muted-foreground">
            {t('wallet.earnings.fromLoyaltyForfeiture')}
          </p>
          {(earnings.loyaltyEarnings > 0 || earnings.forfeitureEarnings > 0) && (
            <div className="text-xs text-gray-500 mt-1">
              {earnings.loyaltyEarnings > 0 && `${t('wallet.earnings.loyalty')}: ${formatPrice(earnings.loyaltyEarnings)}`}
              {earnings.forfeitureEarnings > 0 && ` ${t('wallet.earnings.forfeiture')}: ${formatPrice(earnings.forfeitureEarnings)}`}
            </div>
          )}
        </div>
      </Card>

      {/* Earnings Breakdown */}
      <Card className="md:col-span-2 lg:col-span-3">
        <div className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-2">{t('wallet.earnings.breakdown')}</h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('wallet.earnings.breakdownSubtitle')}
          </p>
          <div className="space-y-4">
            {/* Recent Earnings Transactions */}
            {loadingTransactions ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : walletTransactions.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{t('wallet.earnings.recentEarnings')}</h4>
                {walletTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.reason === 'REFERRAL_REWARD' ? 'bg-blue-500' :
                        transaction.reason === 'LOYALTY_POINTS_CONVERTED' ? 'bg-green-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="text-sm">{transaction.reason.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                    <div className="text-sm font-medium">+{formatPrice(transaction.amount)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                {t('wallet.earnings.noEarnings')}
              </div>
            )}

            {/* Earnings Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm truncate">{t('wallet.earnings.referralBonuses')}</span>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded whitespace-nowrap ml-2">{formatPrice(earnings.referralEarnings)}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm truncate">{t('wallet.earnings.loyaltyRewards')}</span>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded whitespace-nowrap ml-2">{formatPrice(earnings.loyaltyEarnings)}</span>
              </div>
              <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border sm:col-span-2 md:col-span-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-xs sm:text-sm truncate">{t('wallet.earnings.forfeitureShare')}</span>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded whitespace-nowrap ml-2">{formatPrice(earnings.forfeitureEarnings)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WalletDashboard;