import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  DollarSign,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { specialistWalletStrings, commonStrings } from '@/utils/translations';

interface WalletData {
  balance: number;
  pendingBalance: number;
  currency: string;
  totalEarned: number;
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  createdAt: string;
  method?: string;
}

export const SpecialistWalletPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutSheet, setShowPayoutSheet] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [walletData, payoutsData] = await Promise.allSettled([
        apiService.getSpecialistWallet(),
        apiService.getSpecialistPayouts(),
      ]);

      if (walletData.status === 'fulfilled') {
        const raw = walletData.value as any;
        // Backend may wrap as { wallet: {...} } or { balance: {...} }
        const w = raw?.wallet || raw?.balance || raw;
        setWallet({
          balance: Number(w?.balance) || Number(w?.availableBalance) || 0,
          pendingBalance: Number(w?.pendingBalance) || Number(w?.pending) || 0,
          currency: w?.currency || 'UAH',
          totalEarned: Number(w?.totalEarned) || Number(w?.totalEarnings) || 0,
        });
      } else {
        setWallet({ balance: 0, pendingBalance: 0, currency: 'UAH', totalEarned: 0 });
      }

      if (payoutsData.status === 'fulfilled') {
        const data = payoutsData.value as any;
        // Backend may wrap as { transactions: [...] } or { payouts: [...] }
        const list = data?.transactions || data?.payouts || data?.items || (Array.isArray(data) ? data : []);
        setPayouts(list);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    hapticFeedback.impactLight();
    fetchData();
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);

    if (isNaN(amount) || amount <= 0) {
      dispatch(addToast({
        type: 'warning',
        title: t(commonStrings, 'error', locale),
        message: locale === 'uk' ? 'Введіть коректну суму' : locale === 'ru' ? 'Введите корректную сумму' : 'Enter a valid amount',
      }));
      return;
    }

    if (amount < 100) {
      dispatch(addToast({
        type: 'warning',
        title: t(commonStrings, 'error', locale),
        message: t(specialistWalletStrings, 'minPayout', locale),
      }));
      return;
    }

    if (amount > (wallet?.balance || 0)) {
      dispatch(addToast({
        type: 'warning',
        title: t(commonStrings, 'error', locale),
        message: locale === 'uk' ? 'Недостатньо коштів' : locale === 'ru' ? 'Недостаточно средств' : 'Insufficient balance',
      }));
      return;
    }

    try {
      setRequesting(true);
      await apiService.requestPayout({ amount });
      dispatch(addToast({
        type: 'success',
        title: t(commonStrings, 'success', locale),
        message: t(specialistWalletStrings, 'payoutRequested', locale),
      }));
      hapticFeedback.notificationSuccess();
      setShowPayoutSheet(false);
      setPayoutAmount('');
      fetchData();
    } catch {
      dispatch(addToast({
        type: 'error',
        title: t(commonStrings, 'error', locale),
        message: t(specialistWalletStrings, 'payoutFailed', locale),
      }));
      hapticFeedback.notificationError();
    } finally {
      setRequesting(false);
    }
  };

  const getPayoutStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check size={16} className="text-accent-green" />;
      case 'processing':
        return <Clock size={16} className="text-accent-yellow" />;
      case 'pending':
        return <Clock size={16} className="text-accent-primary" />;
      case 'failed':
        return <AlertCircle size={16} className="text-accent-red" />;
      default:
        return <Clock size={16} className="text-text-secondary" />;
    }
  };

  const getPayoutStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return t(specialistWalletStrings, 'paid', locale);
      case 'processing':
        return t(specialistWalletStrings, 'processing', locale);
      case 'pending':
        return t(commonStrings, 'pending', locale);
      default:
        return status;
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-accent-green/15 text-accent-green';
      case 'processing':
        return 'bg-accent-yellow/15 text-accent-yellow';
      case 'pending':
        return 'bg-accent-primary/15 text-accent-primary';
      case 'failed':
        return 'bg-accent-red/15 text-accent-red';
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
      <Header
        title={t(specialistWalletStrings, 'title', locale)}
        rightContent={
          <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-bg-hover">
            <RefreshCw size={18} className="text-text-secondary" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Balance Card */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-5 text-white shadow-card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm opacity-80">{t(specialistWalletStrings, 'balance', locale)}</span>
              <Wallet size={20} className="opacity-80" />
            </div>
            <div className="text-3xl font-bold mb-3">
              {'\u20B4'}{(wallet?.balance || 0).toLocaleString('uk-UA')}
            </div>

            {/* Pending Balance */}
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Clock size={14} />
              <span>
                {t(specialistWalletStrings, 'pendingBalance', locale)}: {'\u20B4'}{(wallet?.pendingBalance || 0).toLocaleString('uk-UA')}
              </span>
            </div>
          </div>
        </div>

        {/* Request Payout Button */}
        <div className="px-4 py-3">
          <Button
            onClick={() => { setShowPayoutSheet(true); hapticFeedback.impactLight(); }}
            className="w-full"
            disabled={(wallet?.balance || 0) < 100}
          >
            <ArrowUpRight size={18} className="mr-2" />
            {t(specialistWalletStrings, 'requestPayout', locale)}
          </Button>
          {(wallet?.balance || 0) < 100 && (
            <p className="text-xs text-text-secondary text-center mt-2">
              {t(specialistWalletStrings, 'minPayout', locale)}
            </p>
          )}
        </div>

        {/* Payout History */}
        <div className="px-4 space-y-3">
          <h3 className="text-sm font-semibold text-text-secondary px-1">
            {t(specialistWalletStrings, 'payoutHistory', locale)}
          </h3>

          {payouts.length === 0 ? (
            <Card className="text-center py-10">
              <DollarSign size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{t(specialistWalletStrings, 'noPayouts', locale)}</p>
              <p className="text-text-secondary text-sm mt-1">
                {locale === 'uk'
                  ? 'Історія виплат з\'явиться тут'
                  : locale === 'ru'
                  ? 'История выплат появится здесь'
                  : 'Your payout history will appear here'}
              </p>
            </Card>
          ) : (
            payouts.map(payout => (
              <Card key={payout.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                    {getPayoutStatusIcon(payout.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {'\u20B4'}{payout.amount.toLocaleString('uk-UA')}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {new Date(payout.createdAt).toLocaleDateString(
                        locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US',
                        { day: 'numeric', month: 'short', year: 'numeric' }
                      )}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPayoutStatusColor(payout.status)}`}>
                    {getPayoutStatusLabel(payout.status)}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Payout Request Sheet */}
      <Sheet
        isOpen={showPayoutSheet}
        onClose={() => setShowPayoutSheet(false)}
        title={t(specialistWalletStrings, 'requestPayout', locale)}
      >
        <div className="space-y-4">
          <div className="bg-bg-secondary rounded-xl p-4 text-center">
            <p className="text-xs text-text-secondary mb-1">{t(specialistWalletStrings, 'balance', locale)}</p>
            <p className="text-2xl font-bold text-text-primary">
              {'\u20B4'}{(wallet?.balance || 0).toLocaleString('uk-UA')}
            </p>
          </div>

          <Input
            label={t(specialistWalletStrings, 'amount', locale) + ' (\u20B4)'}
            type="number"
            value={payoutAmount}
            onChange={e => setPayoutAmount(e.target.value)}
            placeholder="0"
            icon={<DollarSign size={18} />}
          />

          <p className="text-xs text-text-secondary">
            {t(specialistWalletStrings, 'minPayout', locale)}
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowPayoutSheet(false)}
              className="flex-1"
            >
              {t(commonStrings, 'cancel', locale)}
            </Button>
            <Button
              onClick={handleRequestPayout}
              className="flex-1"
              disabled={requesting}
            >
              {requesting ? t(commonStrings, 'loading', locale) : t(specialistWalletStrings, 'requestPayout', locale)}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
};
