import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Loader2, Wallet, Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react';
import { walletService, WalletBalance as WalletBalanceType, WalletSummary } from '../../services/wallet.service';
import { useCurrency } from '../../contexts/CurrencyContext';
import { toast } from 'react-toastify';

interface WalletBalanceProps {
  showTransactions?: boolean;
  onTransactionsClick?: () => void;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
  showTransactions = false,
  onTransactionsClick
}) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { formatPrice } = useCurrency();

  const fetchWalletSummary = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(!showLoading);

      const summaryData = await walletService.getWalletSummary();
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      toast.error('Failed to load wallet information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletSummary();
  }, []);

  const handleRefresh = () => {
    fetchWalletSummary(false);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Unable to load wallet information
          </div>
        </CardContent>
      </Card>
    );
  }

  const netFlow = summary.totalCredits - summary.totalDebits;
  const isPositiveFlow = netFlow >= 0;

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet Balance
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="h-8 w-8 p-0"
            >
              {showBalance ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <Loader2 className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
        {/* Main Balance */}
        <div className="text-center">
          <div className="text-3xl font-bold">
            {showBalance ? formatPrice(summary.balance) : '•••••'}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Available Balance
          </div>
        </div>

        {/* Balance Flow Indicator */}
        {summary.totalCredits > 0 || summary.totalDebits > 0 ? (
          <div className="flex items-center justify-center gap-2 text-sm">
            {isPositiveFlow ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={isPositiveFlow ? 'text-green-600' : 'text-red-600'}>
              {isPositiveFlow ? '+' : ''}{formatPrice(netFlow)} net flow
            </span>
          </div>
        ) : null}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {showBalance ? formatPrice(summary.totalCredits) : '•••••'}
            </div>
            <div className="text-xs text-muted-foreground">Total Received</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {showBalance ? formatPrice(summary.totalDebits) : '•••••'}
            </div>
            <div className="text-xs text-muted-foreground">Total Spent</div>
          </div>
        </div>

        {/* Pending Transactions */}
        {summary.pendingTransactions > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-center">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              {summary.pendingTransactions} pending transaction{summary.pendingTransactions !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Last Transaction */}
        {summary.lastTransactionAt && (
          <div className="text-xs text-muted-foreground text-center">
            Last transaction: {new Date(summary.lastTransactionAt).toLocaleDateString()}
          </div>
        )}

        {/* View Transactions Button */}
        {showTransactions && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={onTransactionsClick}
          >
            View Transaction History
          </Button>
        )}
        </div>
      </div>
    </Card>
  );
};

export default WalletBalance;