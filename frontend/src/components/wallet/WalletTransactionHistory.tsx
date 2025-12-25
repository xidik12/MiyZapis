import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Loader2, Filter, RefreshCw, ArrowUpRight, ArrowDownLeft, RotateCcw, Coins } from 'lucide-react';
import { walletService, WalletTransaction, TransactionFilters } from '../../services/wallet.service';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'react-toastify';

interface WalletTransactionHistoryProps {
  limit?: number;
  showFilters?: boolean;
  compact?: boolean;
}

const WalletTransactionHistory: React.FC<WalletTransactionHistoryProps> = ({
  limit = 50,
  showFilters = true,
  compact = false
}) => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [filters, setFilters] = useState<TransactionFilters>({ limit });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const { formatPrice } = useCurrency();
  const { t } = useLanguage();

  const fetchTransactions = async (newFilters: TransactionFilters = filters) => {
    try {
      setLoading(true);
      const data = await walletService.getTransactionHistory(newFilters);
      setTransactions(data.transactions);
      setTotal(data.total);
      setBalance(data.balance);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error(t('wallet.transactions.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, offset: 0 };
    setFilters(newFilters);
    fetchTransactions(newFilters);
  };

  const handleLoadMore = () => {
    const newFilters = { ...filters, offset: (filters.offset || 0) + (filters.limit || 50) };
    setFilters(newFilters);
    fetchTransactions(newFilters);
  };

  const getTransactionIcon = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'CREDIT':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'DEBIT':
        return <ArrowDownLeft className="h-4 w-4 text-red-500" />;
      case 'REFUND':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'FORFEITURE_SPLIT':
        return <Coins className="h-4 w-4 text-purple-500" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: WalletTransaction['type']) => {
    switch (type) {
      case 'CREDIT':
        return 'text-green-600';
      case 'DEBIT':
        return 'text-red-600';
      case 'REFUND':
        return 'text-blue-600';
      case 'FORFEITURE_SPLIT':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTransactionType = (type: WalletTransaction['type']) => {
    return walletService.formatTransactionType(type);
  };

  const formatTransactionReason = (reason: string) => {
    return walletService.formatTransactionReason(reason);
  };

  if (loading && transactions.length === 0) {
    return (
      <Card className="w-full">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">
            {t('wallet.transactions.title')} {total > 0 && `(${total})`}
          </h3>
        <div className="flex items-center gap-2">
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className="h-8 w-8 p-0"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchTransactions()}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        </div>

        <div className="space-y-4">
        {/* Filter Panel */}
        {showFilterPanel && showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">{t('wallet.transactions.filters.allTypes')}</option>
              <option value="CREDIT">{t('wallet.transactions.filters.credit')}</option>
              <option value="DEBIT">{t('wallet.transactions.filters.debit')}</option>
              <option value="REFUND">{t('wallet.transactions.filters.refund')}</option>
              <option value="FORFEITURE_SPLIT">{t('wallet.transactions.filters.forfeiture')}</option>
            </select>

            <Input
              type="date"
              placeholder={t('wallet.transactions.filters.startDate')}
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
            />

            <Input
              type="date"
              placeholder={t('wallet.transactions.filters.endDate')}
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
            />
          </div>
        )}

        {/* Current Balance */}
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <div className="text-2xl font-bold">{formatPrice(balance)}</div>
          <div className="text-sm text-muted-foreground">{t('wallet.transactions.currentBalance')}</div>
        </div>

        {/* Transaction List */}
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('wallet.transactions.noTransactions')}
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  compact ? 'p-3' : 'p-4'
                } ${
                  transaction.status === 'PENDING'
                    ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type)}
                  <div className={compact ? 'space-y-0' : 'space-y-1'}>
                    <div className="font-medium text-sm">
                      {formatTransactionReason(transaction.reason)}
                    </div>
                    {!compact && transaction.description && (
                      <div className="text-xs text-muted-foreground">
                        {transaction.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleString()}
                      {transaction.status === 'PENDING' && (
                        <span className="ml-2 text-yellow-600">{t('wallet.transactions.pending')}</span>
                      )}
                    </div>
                    {transaction.booking && !compact && (
                      <div className="text-xs text-blue-600">
                        {t('wallet.transactions.booking')}: {transaction.booking.service.name}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                    {transaction.type === 'DEBIT' ? '-' : '+'}
                    {formatPrice(transaction.amount)}
                  </div>
                  {!compact && (
                    <div className="text-xs text-muted-foreground">
                      {t('wallet.transactions.balance')}: {formatPrice(transaction.balanceAfter)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {transactions.length < total && (
          <div className="text-center pt-4">
            <Button
              variant="secondary"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t('wallet.transactions.loadMore')} ({transactions.length} {t('common.of')} {total})
            </Button>
          </div>
        )}
        </div>
      </div>
    </Card>
  );
};

export default WalletTransactionHistory;