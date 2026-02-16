import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Eye,
  EyeOff,
  RefreshCw,
  CreditCard,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { addToast } from '@/store/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import apiService from '@/services/api.service';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { walletStrings, commonStrings, analyticsStrings } from '@/utils/translations';

interface WalletData {
  balance: number;
  currency: string;
  totalCredits: number;
  totalDebits: number;
}

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'FORFEITURE_SPLIT';
  amount: number;
  currency: string;
  reason: string;
  description?: string;
  createdAt: string;
}

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getWalletBalance() as any;
      setWallet(data);
    } catch {
      // Fallback for demo
      setWallet({ balance: 0, currency: 'UAH', totalCredits: 0, totalDebits: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (pageNum: number, append = false) => {
    try {
      setTxLoading(true);
      const data = await apiService.getWalletTransactions({ page: pageNum, limit: 15 }) as any;
      if (append) {
        setTransactions(prev => [...prev, ...(data.items || [])]);
      } else {
        setTransactions(data.items || []);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
    } catch {
      if (!append) setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTransactions(1);
  }, [fetchWallet, fetchTransactions]);

  const handleRefresh = () => {
    hapticFeedback.impactLight();
    fetchWallet();
    fetchTransactions(1);
    setPage(1);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchTransactions(next, true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT': return <ArrowDownLeft size={18} className="text-accent-green" />;
      case 'DEBIT': return <ArrowUpRight size={18} className="text-accent-red" />;
      case 'REFUND': return <RotateCcw size={18} className="text-accent-primary" />;
      default: return <CreditCard size={18} className="text-accent-purple" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT': return 'text-accent-green';
      case 'DEBIT': return 'text-accent-red';
      case 'REFUND': return 'text-accent-primary';
      default: return 'text-accent-purple';
    }
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'DEBIT' ? '-' : '+';
    return `${sign}${formatCurrency(Math.abs(amount), wallet?.currency, locale)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 1) {
      return locale === 'uk' ? 'Щойно' : locale === 'ru' ? 'Только что' : 'Just now';
    }
    if (diffHrs < 24) {
      const hrs = Math.floor(diffHrs);
      return locale === 'uk' ? `${hrs}г тому` : locale === 'ru' ? `${hrs}ч назад` : `${hrs}h ago`;
    }
    if (diffHrs < 48) {
      return locale === 'uk' ? 'Вчора' : locale === 'ru' ? 'Вчера' : 'Yesterday';
    }
    return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short' });
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
      <Header title={t(walletStrings, 'title', locale)} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Balance Card */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm opacity-80">{t(walletStrings, 'availableBalance', locale)}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setBalanceHidden(!balanceHidden)} className="opacity-80">
                  {balanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button onClick={handleRefresh} className="opacity-80">
                  <RefreshCw size={18} />
                </button>
              </div>
            </div>
            <div className="text-3xl font-bold mb-4">
              {balanceHidden ? '••••••' : formatCurrency(wallet?.balance || 0, wallet?.currency, locale)}
            </div>
            <div className="flex items-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-1">
                <TrendingUp size={14} />
                <span>+{formatCurrency(wallet?.totalCredits || 0, wallet?.currency, locale)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ArrowUpRight size={14} />
                <span>-{formatCurrency(wallet?.totalDebits || 0, wallet?.currency, locale)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-3">
          <div className="flex bg-bg-secondary rounded-xl p-1">
            {(['overview', 'transactions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); hapticFeedback.selectionChanged(); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-tg-button text-tg-button-text shadow-card'
                    : 'text-text-secondary'
                }`}
              >
                {tab === 'overview' ? t(walletStrings, 'overview', locale) : t(walletStrings, 'transactions', locale)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="px-4 space-y-4">
            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-2">{t(walletStrings, 'quickActions', locale)}</h3>
              <div className="grid grid-cols-3 gap-3">
                <Card hover onClick={() => navigate('/bookings')} className="text-center py-4">
                  <CreditCard size={24} className="text-accent-primary mx-auto mb-1" />
                  <span className="text-xs text-text-primary">{t(walletStrings, 'pay', locale)}</span>
                </Card>
                <Card hover onClick={() => navigate('/analytics')} className="text-center py-4">
                  <TrendingUp size={24} className="text-accent-green mx-auto mb-1" />
                  <span className="text-xs text-text-primary">{t(analyticsStrings, 'title', locale)}</span>
                </Card>
                <Card hover onClick={() => { setActiveTab('transactions'); hapticFeedback.impactLight(); }} className="text-center py-4">
                  <Clock size={24} className="text-accent-purple mx-auto mb-1" />
                  <span className="text-xs text-text-primary">{t(walletStrings, 'history', locale)}</span>
                </Card>
              </div>
            </div>

            {/* Recent Transactions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-secondary">{t(walletStrings, 'recentActivity', locale)}</h3>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-accent-primary"
                >
                  {t(commonStrings, 'viewAll', locale)}
                </button>
              </div>
              {transactions.length === 0 ? (
                <Card className="text-center py-8">
                  <Wallet size={32} className="text-text-secondary mx-auto mb-2" />
                  <p className="text-text-secondary text-sm">{t(walletStrings, 'noTransactions', locale)}</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map(tx => (
                    <Card key={tx.id}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{tx.reason || tx.type}</p>
                          <p className="text-xs text-text-secondary">{formatDate(tx.createdAt)}</p>
                        </div>
                        <span className={`text-sm font-semibold ${getTransactionColor(tx.type)}`}>
                          {formatAmount(tx.amount, tx.type)}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {transactions.length === 0 && !txLoading ? (
              <Card className="text-center py-12">
                <Clock size={40} className="text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">{t(walletStrings, 'noTransactions', locale)}</p>
                <p className="text-xs text-text-secondary mt-1">{t(walletStrings, 'transactionHistory', locale)}</p>
              </Card>
            ) : (
              <>
                {transactions.map(tx => (
                  <Card key={tx.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{tx.reason || tx.type}</p>
                        <p className="text-xs text-text-secondary">{tx.description || formatDate(tx.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-semibold ${getTransactionColor(tx.type)}`}>
                          {formatAmount(tx.amount, tx.type)}
                        </span>
                        <p className="text-xs text-text-secondary">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {hasMore && (
                  <Button
                    variant="secondary"
                    onClick={handleLoadMore}
                    disabled={txLoading}
                    className="w-full mt-2"
                  >
                    {txLoading ? t(commonStrings, 'loading', locale) : t(commonStrings, 'viewAll', locale)}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
