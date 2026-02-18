import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Star,
  Gift,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Users,
  Zap,
  Crown,
  Shield,
  Check,
  Clock,
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
import { loyaltyStrings, commonStrings } from '@/utils/translations';

interface LoyaltyStatus {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  nextTier: string | null;
  pointsToNextTier: number;
}

interface LoyaltyTransaction {
  id: string;
  type: 'EARNED' | 'REDEEMED' | 'BONUS' | 'REFERRAL' | 'BOOKING_COMPLETION';
  points: number;
  reason: string;
  createdAt: string;
}

interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  isAvailable: boolean;
}

interface TierDef {
  nameKey: string;
  key: string;
  min: number;
  max: number;
  color: string;
  textColor: string;
  icon: React.ElementType;
  benefitKeys: string[];
}

const TIERS: TierDef[] = [
  { nameKey: 'bronze', key: 'BRONZE', min: 0, max: 499, color: 'from-amber-700 to-amber-900', textColor: 'text-amber-700', icon: Shield, benefitKeys: ['basicSupport', 'standardBooking', 'pointEarning'] },
  { nameKey: 'silver', key: 'SILVER', min: 500, max: 999, color: 'from-gray-400 to-gray-600', textColor: 'text-text-secondary', icon: Star, benefitKeys: ['prioritySupport', 'earlyBookingAccess', 'bonusPoints2'] },
  { nameKey: 'gold', key: 'GOLD', min: 1000, max: 1999, color: 'from-yellow-500 to-yellow-700', textColor: 'text-yellow-600', icon: Crown, benefitKeys: ['bonusPoints5', 'prioritySupport', 'earlyAccess', 'exclusiveDiscounts'] },
  { nameKey: 'platinum', key: 'PLATINUM', min: 2000, max: Infinity, color: 'from-indigo-500 to-indigo-700', textColor: 'text-indigo-600', icon: Crown, benefitKeys: ['bonusPoints10', 'vipSupport', 'exclusiveServices', 'freeCancellation'] },
];

export const LoyaltyPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback, showConfirm } = useTelegram();
  const locale = useLocale();

  const s = (key: string) => t(loyaltyStrings, key, locale);

  const [status, setStatus] = useState<LoyaltyStatus | null>(null);
  const [history, setHistory] = useState<LoyaltyTransaction[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tiers' | 'rewards'>('overview');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusData, historyData, rewardsData] = await Promise.allSettled([
        apiService.getLoyaltyStatus(),
        apiService.getLoyaltyHistory({ limit: 20 }),
        apiService.getLoyaltyRewards(),
      ]);

      if (statusData.status === 'fulfilled') {
        const raw = statusData.value as any;
        setStatus(raw?.stats || raw);
      } else {
        setStatus({ points: 0, tier: 'BRONZE', nextTier: 'SILVER', pointsToNextTier: 500 });
      }

      if (historyData.status === 'fulfilled') {
        const raw = historyData.value as any;
        setHistory(raw?.transactions || raw?.items || (Array.isArray(raw) ? raw : []));
      }
      if (rewardsData.status === 'fulfilled') {
        const raw = rewardsData.value as any;
        setRewards(raw?.discounts || raw?.rewards || (Array.isArray(raw) ? raw : []));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentTier = TIERS.find(t => t.key === (status?.tier || 'BRONZE')) || TIERS[0];
  const nextTier = TIERS.find(t => t.key === status?.nextTier);
  const progressPercent = nextTier
    ? ((status?.points || 0) - currentTier.min) / (nextTier.min - currentTier.min) * 100
    : 100;

  const tierName = (tier: TierDef) => s(tier.nameKey);
  const tierBenefit = (key: string) => s(key);

  const handleRedeem = async (reward: LoyaltyReward) => {
    if ((status?.points || 0) < reward.pointsCost) {
      const needed = reward.pointsCost - (status?.points || 0);
      const msg = `${s('needMorePoints')} ${needed}`;
      dispatch(addToast({ type: 'warning', title: t(commonStrings, 'error', locale), message: msg }));
      hapticFeedback.notificationWarning();
      return;
    }

    const confirmMsg = `${s('redeemConfirm')} "${reward.title}" (${reward.pointsCost})?`;
    const confirmed = await showConfirm(confirmMsg);
    if (!confirmed) return;

    try {
      await apiService.redeemReward(reward.id);
      const successMsg = s('redeemed');
      dispatch(addToast({ type: 'success', title: successMsg, message: reward.title }));
      hapticFeedback.notificationSuccess();
      fetchData();
    } catch {
      const errorMsg = s('redeemFailed');
      dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: errorMsg }));
      hapticFeedback.notificationError();
    }
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'EARNED': return <ArrowUp size={16} className="text-accent-green" />;
      case 'REDEEMED': return <ArrowDown size={16} className="text-accent-red" />;
      case 'BONUS': return <Gift size={16} className="text-accent-purple" />;
      case 'REFERRAL': return <Users size={16} className="text-accent-primary" />;
      default: return <Star size={16} className="text-accent-yellow" />;
    }
  };

  const TAB_LABELS: Record<string, string> = {
    overview: s('overview'),
    history: s('history'),
    tiers: s('tiers'),
    rewards: s('rewards'),
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Points Banner */}
        <div className="px-4 pt-4 pb-2">
          <div className={`bg-gradient-to-br ${currentTier.color} rounded-2xl p-5 text-white shadow-card`}>
            <div className="flex items-center gap-2 mb-1">
              <currentTier.icon size={20} />
              <span className="text-sm font-medium opacity-90">
                {tierName(currentTier)} {s('member')}
              </span>
            </div>
            <div className="text-3xl font-bold">
              {(status?.points || 0).toLocaleString()} {s('pts')}
            </div>
            {nextTier && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs opacity-80 mb-1">
                  <span>{tierName(currentTier)}</span>
                  <span>
                    {status?.pointsToNextTier || 0} {s('ptsTo')} {tierName(nextTier)}
                  </span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/80 rounded-full transition-all"
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-3 overflow-x-auto">
          <div className="flex bg-bg-secondary rounded-xl p-1 min-w-max">
            {(['overview', 'history', 'tiers', 'rewards'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); hapticFeedback.selectionChanged(); }}
                className={`flex-1 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-tg-button text-tg-button-text shadow-card'
                    : 'text-text-secondary'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 space-y-3">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Card className="text-center py-4">
                  <Zap size={24} className="text-accent-yellow mx-auto mb-1" />
                  <div className="text-lg font-bold text-text-primary">{status?.points || 0}</div>
                  <div className="text-xs text-text-secondary">{s('currentPoints')}</div>
                </Card>
                <Card className="text-center py-4">
                  <Award size={24} className={`${currentTier.textColor} mx-auto mb-1`} />
                  <div className="text-lg font-bold text-text-primary">{tierName(currentTier)}</div>
                  <div className="text-xs text-text-secondary">{s('currentTier')}</div>
                </Card>
              </div>

              <Card>
                <h3 className="font-semibold text-text-primary mb-3">{s('howToEarn')}</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: <Star size={16} className="text-accent-yellow" />, text: s('completeBooking'), pts: '+10 ' + s('pts') },
                    { icon: <Users size={16} className="text-accent-primary" />, text: s('referFriend'), pts: '+50 ' + s('pts') },
                    { icon: <TrendingUp size={16} className="text-accent-green" />, text: s('leaveReview'), pts: '+5 ' + s('pts') },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-bg-secondary rounded-lg flex items-center justify-center">{item.icon}</div>
                      <span className="flex-1 text-sm text-text-primary">{item.text}</span>
                      <span className="text-xs font-semibold text-accent-primary">{item.pts}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {history.length > 0 && (
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">{s('recentActivity')}</h3>
                  {history.slice(0, 5).map(tx => (
                    <Card key={tx.id} className="mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-bg-secondary rounded-lg flex items-center justify-center">
                          {getTxIcon(tx.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{tx.reason}</p>
                          <p className="text-xs text-text-secondary">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === 'REDEEMED' ? 'text-accent-red' : 'text-accent-green'}`}>
                          {tx.type === 'REDEEMED' ? '-' : '+'}{tx.points}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            history.length === 0 ? (
              <Card className="text-center py-12">
                <Clock size={40} className="text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">{s('noActivity')}</p>
              </Card>
            ) : (
              history.map(tx => (
                <Card key={tx.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-bg-secondary rounded-lg flex items-center justify-center">
                      {getTxIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{tx.reason}</p>
                      <p className="text-xs text-text-secondary">{new Date(tx.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${tx.type === 'REDEEMED' ? 'text-accent-red' : 'text-accent-green'}`}>
                        {tx.type === 'REDEEMED' ? '-' : '+'}{tx.points} {s('pts')}
                      </span>
                      <p className="text-xs text-text-secondary capitalize">{tx.type.toLowerCase()}</p>
                    </div>
                  </div>
                </Card>
              ))
            )
          )}

          {activeTab === 'tiers' && (
            TIERS.map(tier => {
              const isCurrent = tier.key === status?.tier;
              return (
                <Card key={tier.key} className={isCurrent ? 'ring-2 ring-accent-primary' : ''}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                      <tier.icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-text-primary">{tierName(tier)}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-accent-primary/10 text-accent-primary text-xs rounded-full font-medium">{t(commonStrings, 'current' as any, locale) || s('overview')}</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">
                        {tier.max === Infinity ? `${tier.min}+ ${s('points')}` : `${tier.min} - ${tier.max} ${s('points')}`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {tier.benefitKeys.map((benefitKey, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Check size={14} className="text-accent-green flex-shrink-0" />
                        <span className="text-sm text-text-secondary">{tierBenefit(benefitKey)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })
          )}

          {activeTab === 'rewards' && (
            rewards.length === 0 ? (
              <Card className="text-center py-12">
                <Gift size={40} className="text-text-secondary mx-auto mb-3" />
                <p className="text-text-primary font-medium">{s('noRewards')}</p>
                <p className="text-text-secondary text-sm mt-1">{s('keepEarning')}</p>
              </Card>
            ) : (
              rewards.map(reward => (
                <Card key={reward.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-accent-purple/15 rounded-xl flex items-center justify-center">
                      <Gift size={24} className="text-accent-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary">{reward.title}</h3>
                      <p className="text-xs text-text-secondary truncate">{reward.description}</p>
                      <p className="text-xs font-medium text-accent-primary mt-0.5">{reward.pointsCost} {s('pts')}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeem(reward)}
                      disabled={!reward.isAvailable || (status?.points || 0) < reward.pointsCost}
                    >
                      {s('redeem')}
                    </Button>
                  </div>
                </Card>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
};
