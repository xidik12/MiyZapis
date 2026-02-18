import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Clock,
  Star,
  ChevronRight,
  AlertCircle,
  Gift,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { loyaltySpecialistStrings, commonStrings } from '@/utils/translations';

type Tab = 'overview' | 'history' | 'tiers';

const TIER_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  BRONZE: { bg: 'bg-amber-700/15', text: 'text-amber-500', border: 'border-amber-700/30', glow: 'shadow-amber-900/10' },
  SILVER: { bg: 'bg-gray-400/15', text: 'text-gray-300', border: 'border-gray-400/30', glow: 'shadow-gray-400/10' },
  GOLD: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/10' },
  PLATINUM: { bg: 'bg-cyan-400/15', text: 'text-cyan-300', border: 'border-cyan-400/30', glow: 'shadow-cyan-400/10' },
};

const getTierColor = (tier: string) =>
  TIER_COLORS[tier?.toUpperCase()] || TIER_COLORS.BRONZE;

interface LoyaltyStats {
  points: number;
  tier: string;
  monthlyEarned: number;
  yearlyEarned: number;
  totalSpent: number;
  nextTier?: string;
  pointsToNextTier?: number;
}

interface Transaction {
  id: string;
  type: string; // EARN, REDEEMED, EXPIRED, BONUS
  points: number;
  description: string;
  createdAt: string;
}

interface Tier {
  name: string;
  minPoints: number;
  maxPoints?: number;
  benefits: string[];
}

export const SpecialistLoyaltyPage: React.FC = () => {
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<LoyaltyStats>({
    points: 0, tier: 'BRONZE', monthlyEarned: 0, yearlyEarned: 0, totalSpent: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoading, setTxLoading] = useState(false);

  const s = useCallback((key: string) => t(loyaltySpecialistStrings, key, locale), [locale]);
  const c = useCallback((key: string) => t(commonStrings, key, locale), [locale]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, tiersRes, txRes] = await Promise.allSettled([
        apiService.getLoyaltyStatus(),
        apiService.getLoyaltyTiers(),
        apiService.getLoyaltyHistory({ page: 1, limit: 20 }),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value) {
        const raw = statsRes.value as any;
        setStats({
          points: Number(raw.points ?? raw.totalPoints ?? 0),
          tier: raw.tier ?? raw.currentTier ?? 'BRONZE',
          monthlyEarned: Number(raw.monthlyEarned ?? raw.thisMonth ?? 0),
          yearlyEarned: Number(raw.yearlyEarned ?? raw.thisYear ?? 0),
          totalSpent: Number(raw.totalSpent ?? raw.redeemedTotal ?? 0),
          nextTier: raw.nextTier ?? undefined,
          pointsToNextTier: Number(raw.pointsToNextTier ?? raw.pointsNeeded ?? 0) || undefined,
        });
      }

      if (tiersRes.status === 'fulfilled' && tiersRes.value) {
        const raw = tiersRes.value as any;
        const list = Array.isArray(raw) ? raw : raw?.tiers || [];
        setTiers(list.map((t: any) => ({
          name: t.name || t.tier,
          minPoints: Number(t.minPoints ?? t.pointsRequired ?? 0),
          maxPoints: t.maxPoints ? Number(t.maxPoints) : undefined,
          benefits: t.benefits || t.perks || [],
        })));
      }

      if (txRes.status === 'fulfilled' && txRes.value) {
        const raw = txRes.value as any;
        const items = raw?.items || (Array.isArray(raw) ? raw : []);
        setTransactions(items);
        setTxHasMore(raw?.pagination ? raw.pagination.page < raw.pagination.totalPages : items.length >= 20);
      }
    } catch {
      setError(s('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [s]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadMoreTx = async () => {
    try {
      setTxLoading(true);
      const nextPage = txPage + 1;
      const res = await apiService.getLoyaltyHistory({ page: nextPage, limit: 20 }) as any;
      const items = res?.items || (Array.isArray(res) ? res : []);
      setTransactions(prev => [...prev, ...items]);
      setTxPage(nextPage);
      setTxHasMore(res?.pagination ? nextPage < res.pagination.totalPages : items.length >= 20);
    } finally {
      setTxLoading(false);
    }
  };

  const getTypeProps = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'EARN': return { icon: TrendingUp, color: 'text-accent-green', sign: '+' };
      case 'REDEEMED': case 'REDEEM': return { icon: TrendingDown, color: 'text-accent-red', sign: '-' };
      case 'EXPIRED': return { icon: Clock, color: 'text-text-muted', sign: '-' };
      case 'BONUS': return { icon: Star, color: 'text-yellow-400', sign: '+' };
      default: return { icon: Gift, color: 'text-text-secondary', sign: '' };
    }
  };

  const progressPercent = stats.pointsToNextTier
    ? Math.min(100, Math.round((stats.points / (stats.points + stats.pointsToNextTier)) * 100))
    : 100;

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 p-4 space-y-4">
          <div className="bg-bg-card/80 rounded-2xl border border-white/5 p-6 animate-pulse">
            <div className="h-10 w-32 bg-bg-secondary rounded mx-auto mb-2" />
            <div className="h-4 w-24 bg-bg-secondary rounded mx-auto" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-bg-card/80 rounded-2xl border border-white/5 p-4 animate-pulse">
                <div className="h-5 w-10 bg-bg-secondary rounded mb-1" />
                <div className="h-3 w-14 bg-bg-secondary rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-3 text-accent-red" />
            <p className="text-accent-red mb-2">{c('error')}</p>
            <p className="text-sm text-text-muted mb-4">{error}</p>
            <Button onClick={fetchData}>{c('retry')}</Button>
          </div>
        </div>
      </div>
    );
  }

  const tierColor = getTierColor(stats.tier);

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4 page-stagger">
          {/* Points Card */}
          <Card className={`backdrop-blur-xl rounded-2xl border shadow-card p-6 text-center ${tierColor.bg} ${tierColor.border}`}>
            <Award size={32} className={`mx-auto mb-2 ${tierColor.text}`} />
            <div className="text-4xl font-bold text-text-primary mb-1">
              {stats.points.toLocaleString()}
            </div>
            <div className="text-sm text-text-secondary mb-1">{s('points')}</div>
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${tierColor.bg} ${tierColor.text} ${tierColor.border}`}>
              {s(stats.tier.toLowerCase())} {s('tier')}
            </div>

            {/* Progress bar */}
            {stats.pointsToNextTier && stats.nextTier && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-text-muted mb-1">
                  <span>{stats.tier}</span>
                  <span>{stats.nextTier}</span>
                </div>
                <div className="w-full h-2 bg-bg-secondary/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-green rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {stats.pointsToNextTier.toLocaleString()} {s('pointsToNext')}
                </div>
              </div>
            )}
          </Card>

          {/* Tab Bar */}
          <div className="flex gap-1 bg-bg-card/80 rounded-xl border border-white/5 p-1">
            {(['overview', 'history', 'tiers'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); hapticFeedback.selectionChanged(); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-accent-primary/15 text-accent-primary'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {s(t)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
                  <div className="text-lg font-bold text-accent-green">{stats.monthlyEarned.toLocaleString()}</div>
                  <div className="text-xs text-text-secondary">{s('monthlyEarned')}</div>
                </Card>
                <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
                  <div className="text-lg font-bold text-accent-primary">{stats.yearlyEarned.toLocaleString()}</div>
                  <div className="text-xs text-text-secondary">{s('yearlyEarned')}</div>
                </Card>
                <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
                  <div className="text-lg font-bold text-accent-red">{stats.totalSpent.toLocaleString()}</div>
                  <div className="text-xs text-text-secondary">{s('totalSpent')}</div>
                </Card>
              </div>
            </div>
          )}

          {/* History Tab */}
          {tab === 'history' && (
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Gift size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="text-sm text-text-secondary">{s('noTransactions')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => {
                    const typeProps = getTypeProps(tx.type);
                    const Icon = typeProps.icon;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg bg-bg-hover flex items-center justify-center ${typeProps.color}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-text-primary truncate">
                              {tx.description}
                            </div>
                            <div className="text-xs text-text-muted">
                              {tx.createdAt?.slice(0, 10)}
                            </div>
                          </div>
                        </div>
                        <span className={`font-semibold text-sm ${typeProps.color} whitespace-nowrap ml-2`}>
                          {typeProps.sign}{tx.points.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}

                  {txHasMore && (
                    <Button variant="ghost" className="w-full mt-2" onClick={loadMoreTx} disabled={txLoading}>
                      {txLoading ? c('loading') : c('loadMore')}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Tiers Tab */}
          {tab === 'tiers' && (
            <div className="space-y-3">
              {tiers.length === 0 ? (
                <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-6 text-center">
                  <Award size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="text-sm text-text-secondary">{s('noTierData')}</p>
                </Card>
              ) : (
                tiers.map((tier) => {
                  const color = getTierColor(tier.name);
                  const isCurrent = tier.name?.toUpperCase() === stats.tier?.toUpperCase();
                  return (
                    <Card
                      key={tier.name}
                      className={`backdrop-blur-xl rounded-2xl border shadow-card p-4 ${color.bg} ${color.border} ${
                        isCurrent ? `ring-2 ring-accent-primary/50 ${color.glow}` : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Award size={20} className={color.text} />
                          <span className={`font-semibold ${color.text}`}>
                            {s(tier.name.toLowerCase())}
                          </span>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent-primary/15 text-accent-primary border border-accent-primary/20">
                            {s('current')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted mb-2">
                        {tier.minPoints.toLocaleString()} {tier.maxPoints ? `— ${tier.maxPoints.toLocaleString()}` : '+'} {s('points')}
                      </div>
                      {tier.benefits.length > 0 && (
                        <ul className="space-y-1">
                          {tier.benefits.map((b, i) => (
                            <li key={i} className="text-xs text-text-secondary flex items-center gap-1.5">
                              <ChevronRight size={12} className={color.text} />
                              {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
