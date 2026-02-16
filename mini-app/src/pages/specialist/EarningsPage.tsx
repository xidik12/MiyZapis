import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  BarChart3,
  AlertCircle,
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
import { useLocale, t } from '@/hooks/useLocale';
import { earningsStrings, commonStrings } from '@/utils/translations';

interface EarningsData {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  pendingPayouts: number;
  completedBookings: number;
  avgPerBooking: number;
  growthPercent: number;
}

interface MonthlyEntry {
  month: string;
  label: string;
  amount: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  date: string;
  method?: string;
}

export const EarningsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    thisWeek: 0,
    pendingPayouts: 0,
    completedBookings: 0,
    avgPerBooking: 0,
    growthPercent: 0,
  });
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyEntry[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<Payout[]>([]);

  const s = useCallback((key: string) => t(earningsStrings, key, locale), [locale]);
  const c = useCallback((key: string) => t(commonStrings, key, locale), [locale]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [earningsRes, overviewRes, trendsRes] = await Promise.allSettled([
        apiService.getSpecialistEarnings(),
        apiService.getEarningsOverview(),
        apiService.getEarningsTrends({ months: 6 }),
      ]);

      // Process earnings data — backend wraps as { earnings: { totalEarnings, ... } }
      if (earningsRes.status === 'fulfilled' && earningsRes.value) {
        const raw = earningsRes.value as any;
        const data = raw?.earnings || raw;
        setEarnings({
          totalEarnings: Number(data.totalEarnings) || Number(data.totalRevenue) || 0,
          thisMonth: Number(data.thisMonth) || Number(data.currentMonthEarnings) || 0,
          lastMonth: Number(data.lastMonth) || Number(data.previousMonthEarnings) || 0,
          thisWeek: Number(data.thisWeek) || Number(data.currentWeekEarnings) || 0,
          pendingPayouts: Number(data.pendingPayouts) || Number(data.pendingAmount) || 0,
          completedBookings: Number(data.completedBookings) || Number(data.bookingCount) || 0,
          avgPerBooking: Number(data.avgPerBooking) || Number(data.averageBookingValue) || 0,
          growthPercent: Number(data.growthPercent) || Number(data.monthlyGrowth) || 0,
        });
      }

      // Process overview (payouts) — backend wraps as { overview: { ... } }
      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        const raw = overviewRes.value as any;
        const overview = raw?.overview || raw;
        const payouts = overview?.recentPayouts || overview?.payouts || [];
        if (Array.isArray(payouts)) {
          setRecentPayouts(payouts);
        }
      }

      // Process trends (monthly breakdown) — backend wraps as { trends: { trends: [...] } }
      if (trendsRes.status === 'fulfilled' && trendsRes.value) {
        const raw = trendsRes.value as any;
        const trends = raw?.trends || raw;
        const entries = Array.isArray(trends)
          ? trends
          : trends?.trends || trends?.months || trends?.data || trends?.entries || [];
        if (Array.isArray(entries)) {
          setMonthlyBreakdown(
            entries.map((item: any) => ({
              month: item.month || item.date || '',
              label: item.label || item.month || item.date || '',
              amount: Number(item.amount) || Number(item.revenue) || Number(item.earnings) || 0,
            }))
          );
        }
      }
    } catch {
      setError(
        locale === 'uk'
          ? 'Не вдалося завантажити дані'
          : locale === 'ru'
          ? 'Не удалось загрузить данные'
          : 'Failed to load earnings data'
      );
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const maxMonthly = Math.max(...monthlyBreakdown.map(m => m.amount), 1);

  const getPayoutStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-accent-green/15 text-accent-green border-accent-green/20';
      case 'processing':
      case 'pending':
        return 'bg-accent-yellow/15 text-accent-yellow border-accent-yellow/20';
      case 'failed':
        return 'bg-accent-red/15 text-accent-red border-accent-red/20';
      default:
        return 'bg-bg-hover text-text-secondary border-white/5';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 p-4 space-y-4">
          {/* Total earnings skeleton */}
          <div className="bg-bg-card/80 rounded-2xl border border-white/5 p-6 animate-pulse">
            <div className="h-4 w-28 bg-bg-secondary rounded mb-3 mx-auto" />
            <div className="h-10 w-48 bg-bg-secondary rounded mx-auto mb-2" />
            <div className="h-4 w-32 bg-bg-secondary rounded mx-auto" />
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-bg-card/80 rounded-2xl border border-white/5 p-4 animate-pulse">
                <div className="h-6 w-16 bg-bg-secondary rounded mb-1" />
                <div className="h-3 w-20 bg-bg-secondary rounded" />
              </div>
            ))}
          </div>
          {/* Monthly breakdown skeleton */}
          <div className="bg-bg-card/80 rounded-2xl border border-white/5 p-4 animate-pulse">
            <div className="h-5 w-40 bg-bg-secondary rounded mb-4" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="h-4 w-16 bg-bg-secondary rounded" />
                <div className="flex-1 h-6 bg-bg-secondary rounded-full" />
                <div className="h-4 w-16 bg-bg-secondary rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-3 text-accent-red" />
            <p className="text-accent-red mb-2">{c('error')}</p>
            <p className="text-sm text-text-muted mb-4">{error}</p>
            <Button onClick={fetchAllData}>
              {c('retry')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  const isEmpty = earnings.totalEarnings === 0 && monthlyBreakdown.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <DollarSign size={48} className="mx-auto mb-4 text-text-muted" />
            <p className="text-text-secondary font-medium">{s('noEarnings')}</p>
            <p className="text-sm text-text-muted mt-1">{s('startEarning')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4 page-stagger">
          {/* Total Earnings Card */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-6 text-center">
            <p className="text-sm text-text-secondary mb-1">{s('totalEarnings')}</p>
            <div className="text-4xl font-bold text-accent-primary mb-2">
              {earnings.totalEarnings.toLocaleString()} UAH
            </div>
            {earnings.growthPercent !== 0 && (
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-accent-green/10">
                {earnings.growthPercent > 0 ? (
                  <TrendingUp size={14} className="text-accent-green" />
                ) : (
                  <TrendingDown size={14} className="text-accent-red" />
                )}
                <span
                  className={
                    earnings.growthPercent > 0 ? 'text-accent-green' : 'text-accent-red'
                  }
                >
                  {earnings.growthPercent > 0 ? '+' : ''}
                  {earnings.growthPercent}% {s('growth')}
                </span>
              </div>
            )}
          </Card>

          {/* This Month Summary */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
              <Calendar size={18} className="text-accent-primary" />
              {s('thisMonth')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-xl font-bold text-accent-primary">
                  {earnings.thisMonth.toLocaleString()} UAH
                </div>
                <div className="text-xs text-text-secondary">{s('thisMonth')}</div>
              </div>
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-xl font-bold text-text-primary">
                  {earnings.completedBookings}
                </div>
                <div className="text-xs text-text-secondary">{s('completedBookings')}</div>
              </div>
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-xl font-bold text-text-primary">
                  {earnings.avgPerBooking.toLocaleString()} UAH
                </div>
                <div className="text-xs text-text-secondary">{s('avgPerBooking')}</div>
              </div>
              <div className="text-center p-3 bg-bg-secondary/50 rounded-xl">
                <div className="text-xl font-bold text-accent-yellow">
                  {earnings.pendingPayouts.toLocaleString()} UAH
                </div>
                <div className="text-xs text-text-secondary">{s('pendingPayouts')}</div>
              </div>
            </div>
          </Card>

          {/* Monthly Breakdown */}
          {monthlyBreakdown.length > 0 && (
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-accent-primary" />
                {s('monthlyBreakdown')}
              </h3>
              <div className="space-y-3">
                {monthlyBreakdown.map((entry, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary font-medium">{entry.label}</span>
                      <span className="text-text-primary font-semibold">
                        {entry.amount.toLocaleString()} UAH
                      </span>
                    </div>
                    <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent-primary to-teal-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max((entry.amount / maxMonthly) * 100, 2)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Payouts */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
            <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-accent-primary" />
              {s('recentPayouts')}
            </h3>

            {recentPayouts.length === 0 ? (
              <div className="text-center py-6">
                <CreditCard size={32} className="mx-auto mb-2 text-text-muted" />
                <p className="text-sm text-text-secondary">
                  {locale === 'uk'
                    ? 'Виплат поки немає'
                    : locale === 'ru'
                    ? 'Выплат пока нет'
                    : 'No payouts yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                        <DollarSign size={14} className="text-accent-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-text-primary">
                          {payout.amount.toLocaleString()} UAH
                        </div>
                        <div className="text-xs text-text-muted">
                          {payout.date}
                          {payout.method && ` · ${payout.method}`}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPayoutStatusColor(payout.status)}`}
                    >
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
