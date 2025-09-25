import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Wallet, History, CreditCard, Gift, Users, TrendingUp } from 'lucide-react';
import WalletBalance from './WalletBalance';
import WalletTransactionHistory from './WalletTransactionHistory';
import { referralService } from '../../services/referral.service';
import { useCurrency } from '../../contexts/CurrencyContext';
import { walletService } from '../../services/wallet.service';
import { ReferralAnalytics } from '../../types/referral';

interface WalletDashboardProps {
  className?: string;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [referralAnalytics, setReferralAnalytics] = useState<ReferralAnalytics | null>(null);
  const { formatPrice } = useCurrency();

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
          <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
          <p className="text-muted-foreground">
            Manage your balance and view transaction history
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transactions
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Earnings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest wallet transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WalletTransactionHistory
                    limit={5}
                    showFilters={false}
                    compact={true}
                  />
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>
                    Common wallet operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Gift className="h-6 w-6" />
                    <span>Redeem Rewards</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col gap-2">
                    <Users className="h-6 w-6" />
                    <span>Refer Friends</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <WalletTransactionHistory />
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          <EarningsOverview referralAnalytics={referralAnalytics} formatPrice={formatPrice} />
        </TabsContent>
      </Tabs>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(earnings.totalEarnings)}</div>
          <p className="text-xs text-muted-foreground">
            From referrals and rewards
          </p>
          {earnings.totalEarnings > 0 && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Active earnings</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Referral Earnings</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(earnings.referralEarnings)}</div>
          <p className="text-xs text-muted-foreground">
            From successful referrals
          </p>
          {referralAnalytics && (
            <div className="text-xs text-gray-500 mt-1">
              {referralAnalytics.overview.completedReferrals} completed referrals
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Earnings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Reward Earnings</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(earnings.loyaltyEarnings + earnings.forfeitureEarnings)}</div>
          <p className="text-xs text-muted-foreground">
            From loyalty rewards & forfeiture shares
          </p>
          {(earnings.loyaltyEarnings > 0 || earnings.forfeitureEarnings > 0) && (
            <div className="text-xs text-gray-500 mt-1">
              {earnings.loyaltyEarnings > 0 && `Loyalty: ${formatPrice(earnings.loyaltyEarnings)}`}
              {earnings.forfeitureEarnings > 0 && ` Forfeiture: ${formatPrice(earnings.forfeitureEarnings)}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Breakdown */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
          <CardDescription>
            See how your earnings are distributed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Recent Earnings Transactions */}
            {loadingTransactions ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : walletTransactions.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Earnings</h4>
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
                No earnings transactions yet
              </div>
            )}

            {/* Earnings Categories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Referral Bonuses</span>
                </div>
                <Badge variant="secondary">{formatPrice(earnings.referralEarnings)}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Loyalty Rewards</span>
                </div>
                <Badge variant="secondary">{formatPrice(earnings.loyaltyEarnings)}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Forfeiture Share</span>
                </div>
                <Badge variant="secondary">{formatPrice(earnings.forfeitureEarnings)}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletDashboard;