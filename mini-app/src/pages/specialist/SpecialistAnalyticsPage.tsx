import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  UserPlus,
  RefreshCw,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { specialistAnalyticsStrings, commonStrings } from '@/utils/translations';

type Period = '1m' | '3m' | '6m' | '1y';

interface AnalyticsKPI {
  revenue: number;
  bookings: number;
  newClients: number;
  retentionRate: number;
}

interface MonthlyRevenue {
  month: string;
  amount: number;
}

interface PopularService {
  name: string;
  bookings: number;
  amount: number;
}

export const SpecialistAnalyticsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [period, setPeriod] = useState<Period>('1m');
  const [kpi, setKpi] = useState<AnalyticsKPI | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [popularServices, setPopularServices] = useState<PopularService[]>([]);
  const [loading, setLoading] = useState(true);

  const s = (key: string) => t(specialistAnalyticsStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const periodOptions: { value: Period; label: string }[] = [
    { value: '1m', label: s('thisMonth') },
    { value: '3m', label: s('last3Months') },
    { value: '6m', label: s('last6Months') },
    { value: '1y', label: s('lastYear') },
  ];

  const fetchAnalytics = useCallback(async (selectedPeriod: Period) => {
    try {
      setLoading(true);

      const [analyticsData, revenue] = await Promise.allSettled([
        apiService.getSpecialistAnalytics({ period: selectedPeriod }),
        apiService.getRevenueData({ months: selectedPeriod === '1m' ? 1 : selectedPeriod === '3m' ? 3 : selectedPeriod === '6m' ? 6 : 12 }),
      ]);

      if (analyticsData.status === 'fulfilled') {
        const raw = analyticsData.value as any;
        // Backend wraps as { analytics: { totalRevenue, totalBookings, ... }, debug: {...} }
        const data = raw?.analytics || raw;
        setKpi({
          revenue: Number(data.totalRevenue) || Number(data.revenue) || 0,
          bookings: Number(data.totalBookings) || Number(data.bookings) || 0,
          newClients: Number(data.activeClients) || Number(data.newClients) || 0,
          retentionRate: Number(data.conversionRate) || Number(data.retentionRate) || 0,
        });
        // servicePerformance contains popular services data
        const services = data.servicePerformance || data.revenueByService || data.popularServices || [];
        setPopularServices(services.map((s: Record<string, unknown>) => ({
          name: s.name || s.serviceName || '',
          bookings: Number(s.bookings) || Number(s.count) || 0,
          amount: Number(s.revenue) || Number(s.amount) || Number(s.totalRevenue) || 0,
        })));
      } else {
        setKpi({ revenue: 0, bookings: 0, newClients: 0, retentionRate: 0 });
        setPopularServices([]);
      }

      if (revenue.status === 'fulfilled') {
        const rRaw = revenue.value as any;
        // Backend wraps as { revenue: { breakdown: [...], totalRevenue, ... } }
        const revObj = rRaw?.revenue || rRaw;
        const breakdown = revObj?.breakdown || revObj?.months || revObj?.revenueTrend || (Array.isArray(revObj) ? revObj : []);
        setRevenueData(breakdown.map((item: unknown) => ({
          month: item.month || item.date || item.label || '',
          amount: Number(item.revenue) || Number(item.amount) || 0,
        })));
      } else {
        setRevenueData([]);
      }
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: c('error'),
          message: s('noData'),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch, locale]);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period, fetchAnalytics]);

  const handlePeriodChange = (newPeriod: Period) => {
    hapticFeedback.impactLight();
    setPeriod(newPeriod);
  };

  const maxRevenue = revenueData.length > 0
    ? Math.max(...revenueData.map((r) => r.amount))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        <div className="px-4 pt-4 space-y-4">
          {/* Subtitle */}
          <p className="text-text-secondary text-sm text-center">{s('subtitle')}</p>

          {/* Period Selector */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handlePeriodChange(opt.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  period === opt.value
                    ? 'bg-accent-primary text-white shadow-lg'
                    : 'bg-bg-card/80 text-text-secondary border border-white/5 hover:bg-bg-hover'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* KPI Cards - 2x2 Grid */}
          {kpi && (
            <div className="grid grid-cols-2 gap-3">
              {/* Revenue */}
              <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card text-center hover:bg-bg-card/90 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/15 flex items-center justify-center">
                    <DollarSign size={16} className="text-teal-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-text-primary">
                  {formatCurrency(kpi.revenue, undefined, locale)}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {s('revenue')}
                </div>
              </Card>

              {/* Bookings */}
              <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card text-center hover:bg-bg-card/90 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                    <Calendar size={16} className="text-blue-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-text-primary">
                  {kpi.bookings}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {s('totalBookings')}
                </div>
              </Card>

              {/* New Clients */}
              <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card text-center hover:bg-bg-card/90 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center">
                    <UserPlus size={16} className="text-green-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-text-primary">
                  {kpi.newClients}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {s('newClients')}
                </div>
              </Card>

              {/* Retention */}
              <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card text-center hover:bg-bg-card/90 transition-all">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center">
                    <RefreshCw size={16} className="text-purple-400" />
                  </div>
                </div>
                <div className="text-xl font-bold text-text-primary">
                  {kpi.retentionRate}%
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  {s('retention')}
                </div>
              </Card>
            </div>
          )}

          {/* Revenue Bar Chart */}
          {revenueData.length > 0 && maxRevenue > 0 && (
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-accent-primary" />
                {s('revenueByMonth')}
              </h3>

              <div className="space-y-3">
                {revenueData.map((item, index) => {
                  const barWidth =
                    maxRevenue > 0
                      ? Math.max((item.amount / maxRevenue) * 100, 2)
                      : 0;

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 text-xs text-text-muted font-medium">
                        {item.month}
                      </div>
                      <div className="flex-1 bg-bg-secondary/50 rounded-lg h-6 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-accent-primary to-accent-primary/70 rounded-lg h-6 transition-all duration-700 ease-out"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className="w-20 text-xs font-medium text-text-secondary text-right">
                        {formatCurrency(item.amount, undefined, locale)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Popular Services */}
          {popularServices.length > 0 && (
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card">
              <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-accent-green" />
                {s('popularServices')}
              </h3>

              <div className="space-y-3 divide-y divide-white/5">
                {popularServices.map((service, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between ${
                      index > 0 ? 'pt-3' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                        <Briefcase size={14} className="text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {service.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {service.bookings} {c('bookings')}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-accent-green whitespace-nowrap ml-3">
                      {formatCurrency(service.amount, undefined, locale)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty State */}
          {!kpi ||
            (kpi.revenue === 0 &&
              kpi.bookings === 0 &&
              revenueData.length === 0 &&
              popularServices.length === 0 && (
                <Card className="text-center py-12">
                  <BarChart3
                    size={48}
                    className="text-text-secondary mx-auto mb-3"
                  />
                  <p className="text-text-primary font-medium">{s('noData')}</p>
                  <p className="text-text-secondary text-sm mt-1">
                    {s('subtitle')}
                  </p>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
};
