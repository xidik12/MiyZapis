import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

const CUST_LOYALTY_HELP = {
  en: {
    pageTitle: 'Loyalty Program',
    pageBody:
      'Earn points every time you book a service and spend them on rewards created by specialists.\n\nWays to earn points:\n• Booking a service — 10 pts per $1 spent (on completed bookings)\n• Writing a review\n• Referring a friend or specialist\n• Participating in special campaigns\n\nReach lifetime point thresholds to unlock higher tiers:\n• Bronze: 0 – 499 pts\n• Silver: 500 – 999 pts\n• Gold: 1 000 – 1 999 pts\n• Platinum: 2 000 + pts\n\nUse the Rewards tab to browse and redeem available rewards.',

    currentPoints: 'Current Points',
    currentPointsBody:
      'Points you can spend right now. Every time you redeem a reward, this balance decreases by the reward\'s point cost.',

    lifetimePoints: 'Lifetime Points',
    lifetimePointsBody:
      'The running total of every point you have ever earned — this number never goes down, even after redemptions.\n\nLifetime points determine which tier you belong to.',

    currentTier: 'Current Tier',
    currentTierBody:
      'Your membership level, determined by lifetime points:\n• Bronze: 0 – 499 pts\n• Silver: 500 – 999 pts (priority support, early booking access)\n• Gold: 1 000 – 1 999 pts (5 % member discount, priority support)\n• Platinum: 2 000 + pts (10 % member discount, VIP support, exclusive services)\n\nThe discount percentage shown on each tier card is a member perk applied to eligible services. See the Tiers tab for the full benefits list.',

    pointsSpent: 'Points Spent',
    pointsSpentBody:
      'Total lifetime points spent redeeming rewards. This is informational — it does not affect your tier, which is based only on points earned.',

    monthlyPoints: 'Points This Month',
    monthlyPointsBody:
      'Points earned in the current calendar month across all earning activities.',

    referrals: 'Total Referrals',
    referralsBody:
      'Number of friends or specialists you have successfully referred to MiyZapis. Referrals are one of the ways to earn bonus points.',

    rewardsTab: 'Rewards Tab',
    rewardsTabBody:
      'Browse rewards created by specialists.\n\nEach reward shows:\n• Point cost — how many of your current points are spent to claim it\n• Reward value — what you receive (e.g. 10 % Off, $5 credit, Free Service)\n• Specialist name — who the reward applies to\n• Expiry date — if the reward has a time limit\n\nTo redeem: click "Redeem", confirm in the pop-up, and your points are deducted. Your redemption appears in the "My Redemptions" section with a status (Pending / Approved / Used / Expired).\n\nTo use a redeemed reward: show the approved redemption to the specialist at the time of your booking.',

    noExpiry: 'Point Expiry',
    noExpiryBody:
      'Points themselves do not expire in the current implementation. Individual rewards may have an expiry date set by the specialist — check the orange badge on each reward card.',
  },
  uk: {
    pageTitle: 'Програма лояльності',
    pageBody:
      'Заробляйте бали щоразу, коли бронюєте послугу, та витрачайте їх на нагороди, створені спеціалістами.\n\nСпособи заробити бали:\n• Бронювання послуги — 10 балів за $1 витрат (за завершеними бронюваннями)\n• Написання відгуку\n• Залучення друга або спеціаліста\n• Участь у спеціальних кампаніях\n\nДосягніть порогів балів за весь час, щоб отримати вищий рівень:\n• Bronze: 0 – 499 балів\n• Silver: 500 – 999 балів\n• Gold: 1 000 – 1 999 балів\n• Platinum: 2 000 + балів\n\nВикористовуйте вкладку "Нагороди", щоб переглянути та погасити доступні нагороди.',

    currentPoints: 'Поточні бали',
    currentPointsBody:
      'Бали, які можна витратити прямо зараз. Щоразу, коли ви погашаєте нагороду, цей баланс зменшується на вартість нагороди в балах.',

    lifetimePoints: 'Бали за весь час',
    lifetimePointsBody:
      'Загальна сума всіх коли-небудь зароблених балів — це число ніколи не зменшується, навіть після погашення.\n\nСаме бали за весь час визначають ваш рівень.',

    currentTier: 'Поточний рівень',
    currentTierBody:
      'Ваш рівень членства, що визначається балами за весь час:\n• Bronze: 0 – 499 балів\n• Silver: 500 – 999 балів (пріоритетна підтримка, ранній доступ до бронювання)\n• Gold: 1 000 – 1 999 балів (знижка 5 % для учасників, пріоритетна підтримка)\n• Platinum: 2 000 + балів (знижка 10 % для учасників, VIP-підтримка, ексклюзивні послуги)\n\nВідсоток знижки на картці рівня — це привілей учасника, що застосовується до відповідних послуг. Повний список переваг дивіться на вкладці "Рівні".',

    pointsSpent: 'Витрачені бали',
    pointsSpentBody:
      'Загальна кількість балів, витрачених на погашення нагород за весь час. Це інформаційний показник — він не впливає на ваш рівень, який залежить лише від зароблених балів.',

    monthlyPoints: 'Бали цього місяця',
    monthlyPointsBody:
      'Бали, зароблені в поточному календарному місяці за всіма видами активності.',

    referrals: 'Усього рефералів',
    referralsBody:
      'Кількість друзів або спеціалістів, яких ви успішно залучили до MiyZapis. Реферали є одним зі способів заробити бонусні бали.',

    rewardsTab: 'Вкладка "Нагороди"',
    rewardsTabBody:
      'Перегляньте нагороди, створені спеціалістами.\n\nКожна нагорода показує:\n• Вартість у балах — скільки ваших поточних балів буде витрачено\n• Цінність нагороди — що ви отримуєте (наприклад, 10 % знижки, $5 кредиту, безкоштовна послуга)\n• Ім\'я спеціаліста — для кого діє нагорода\n• Дата закінчення — якщо нагорода має часовий ліміт\n\nЯк погасити: натисніть "Погасити", підтвердьте у спливаючому вікні — бали будуть списані. Погашена нагорода з\'явиться в розділі "Мої погашення" зі статусом (Очікується / Схвалено / Використано / Прострочено).\n\nЯк скористатися погашеною нагородою: покажіть схвалене погашення спеціалісту під час бронювання.',

    noExpiry: 'Термін дії балів',
    noExpiryBody:
      'Самі по собі бали не мають терміну дії в поточній реалізації. Окремі нагороди можуть мати дату закінчення, встановлену спеціалістом — перевіряйте помаранчеву мітку на картці нагороди.',
  },
  ru: {
    pageTitle: 'Программа лояльности',
    pageBody:
      'Зарабатывайте баллы каждый раз при бронировании услуги и тратьте их на награды, созданные специалистами.\n\nСпособы заработать баллы:\n• Бронирование услуги — 10 баллов за $1 расходов (за завершёнными бронированиями)\n• Написание отзыва\n• Привлечение друга или специалиста\n• Участие в специальных кампаниях\n\nДостигайте порогов баллов за всё время, чтобы получить более высокий уровень:\n• Bronze: 0 – 499 баллов\n• Silver: 500 – 999 баллов\n• Gold: 1 000 – 1 999 баллов\n• Platinum: 2 000 + баллов\n\nИспользуйте вкладку "Награды" для просмотра и погашения доступных наград.',

    currentPoints: 'Текущие баллы',
    currentPointsBody:
      'Баллы, которые можно потратить прямо сейчас. При погашении каждой награды баланс уменьшается на её стоимость в баллах.',

    lifetimePoints: 'Баллы за всё время',
    lifetimePointsBody:
      'Суммарное количество всех когда-либо заработанных баллов — это число никогда не уменьшается, даже после погашения.\n\nИменно баллы за всё время определяют ваш уровень.',

    currentTier: 'Текущий уровень',
    currentTierBody:
      'Ваш уровень членства, определяемый баллами за всё время:\n• Bronze: 0 – 499 баллов\n• Silver: 500 – 999 баллов (приоритетная поддержка, ранний доступ к бронированию)\n• Gold: 1 000 – 1 999 баллов (скидка 5 % для участников, приоритетная поддержка)\n• Platinum: 2 000 + баллов (скидка 10 % для участников, VIP-поддержка, эксклюзивные услуги)\n\nПроцент скидки на карточке уровня — это привилегия участника, применяемая к соответствующим услугам. Полный список преимуществ смотрите на вкладке "Уровни".',

    pointsSpent: 'Потраченные баллы',
    pointsSpentBody:
      'Общее количество баллов, потраченных на погашение наград за всё время. Это информационный показатель — он не влияет на ваш уровень, который зависит только от заработанных баллов.',

    monthlyPoints: 'Баллы в этом месяце',
    monthlyPointsBody:
      'Баллы, заработанные в текущем календарном месяце по всем видам активности.',

    referrals: 'Всего рефералов',
    referralsBody:
      'Количество друзей или специалистов, которых вы успешно привлекли в MiyZapis. Рефералы — один из способов заработать бонусные баллы.',

    rewardsTab: 'Вкладка "Награды"',
    rewardsTabBody:
      'Просматривайте награды, созданные специалистами.\n\nКаждая награда показывает:\n• Стоимость в баллах — сколько ваших текущих баллов будет списано\n• Ценность награды — что вы получаете (например, скидка 10 %, кредит $5, бесплатная услуга)\n• Имя специалиста — для кого действует награда\n• Дата окончания — если у награды есть временной лимит\n\nКак погасить: нажмите "Погасить", подтвердите во всплывающем окне — баллы будут списаны. Погашенная награда появится в разделе "Мои погашения" со статусом (Ожидается / Одобрено / Использовано / Просрочено).\n\nКак воспользоваться погашенной наградой: покажите одобренное погашение специалисту во время бронирования.',

    noExpiry: 'Срок действия баллов',
    noExpiryBody:
      'Сами по себе баллы не имеют срока действия в текущей реализации. Отдельные награды могут иметь дату окончания, установленную специалистом — проверяйте оранжевую метку на карточке награды.',
  },
};
import { useCurrency } from '@/contexts/CurrencyContext';
import { loyaltyService, UserLoyalty, LoyaltyTransaction, LoyaltyTier, LoyaltyStats } from '@/services/loyalty.service';
import { RewardsService, LoyaltyReward, RewardRedemption } from '@/services/rewards.service';
import { formatPoints as utilFormatPoints } from '@/utils/formatPoints';
import { formatDate as sharedFormatDate } from '@/utils/dateUtils';
import { toast } from 'react-toastify';
import { StarIcon, GiftIcon, TrophyIcon, ClockIcon, ArrowUpIcon, ArrowDownIcon, SparklesIcon, CalendarDaysIcon, UsersIcon, FireIcon, BriefcaseIcon, EyeIcon } from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';
import { PageLoader, ContentLoader } from '@/components/ui';
import ConfirmModal from '@/components/ui/ConfirmModal';
// Note: Use active prop for filled icons: <Icon active />
;

const CustomerLoyalty: React.FC = () => {
  useTheme();
  const { t, language } = useLanguage();
  const h = (CUST_LOYALTY_HELP as any)[language] || CUST_LOYALTY_HELP.en;
  useCurrency();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loyaltyProfile, setLoyaltyProfile] = useState<UserLoyalty | null>(null);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'tiers' | 'rewards'>('overview');

  // Transaction pagination state
  const [txPage, setTxPage] = useState(1);
  const [txHasMore, setTxHasMore] = useState(false);
  const [txLoadingMore, setTxLoadingMore] = useState(false);

  // Rewards state
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [myRedemptions, setMyRedemptions] = useState<RewardRedemption[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  const [rewardsError, setRewardsError] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [redeemReward, setRedeemReward] = useState<LoyaltyReward | null>(null);

  useEffect(() => {
    fetchLoyaltyData();
    fetchRewards();
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchRewards();
    }
  }, [activeTab]);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [profile, stats, transactionHistory, allTiers] = await Promise.all([
        loyaltyService.getUserLoyalty(),
        loyaltyService.getLoyaltyStats(),
        loyaltyService.getTransactions(1, 10),
        loyaltyService.getTiers()
      ]);

      setLoyaltyProfile(profile);
      setLoyaltyStats(stats);
      setTransactions(transactionHistory.transactions);
      setTxPage(1);
      setTxHasMore(transactionHistory.pagination.hasNext);
      // Normalize tiers ranges to fixed thresholds
      const normalizeTiers = (tiers: LoyaltyTier[]): LoyaltyTier[] => {
        const byKey = new Map<string, LoyaltyTier>();
        for (const t of tiers) {
          const k = (t.slug || t.name || '').toLowerCase();
          byKey.set(k, t);
        }
        const fixed = [
          { key: 'bronze', name: 'Bronze', min: 0, max: 499, defaults: ['Basic support', 'Standard booking', 'Point earning'] },
          { key: 'silver', name: 'Silver', min: 500, max: 999, defaults: ['Priority support', 'Early booking access'] },
          { key: 'gold', name: 'Gold', min: 1000, max: 1999, defaults: ['5% bonus points', 'Priority support', 'Early access'] },
          { key: 'platinum', name: 'Platinum', min: 2000, max: undefined as number | undefined, defaults: ['10% bonus points', 'VIP support', 'Exclusive services'] },
        ];
        const pick = (key: string): LoyaltyTier | undefined => {
          const direct = byKey.get(key);
          if (direct) return direct;
          for (const [k, v] of byKey) {
            if (k.includes(key)) return v;
          }
          return undefined;
        };
        return fixed.map((f, idx) => {
          const found = pick(f.key);
          const base: LoyaltyTier = found
            ? { ...found }
            : {
                id: `local-${f.key}`,
                name: f.name,
                slug: f.key,
                minPoints: f.min,
                maxPoints: f.max,
                benefits: f.defaults,
                discountPercentage: idx === 2 ? 5 : idx === 3 ? 10 : 0,
                prioritySupport: idx >= 1,
                exclusiveOffers: idx >= 3,
                createdAt: new Date(0).toISOString(),
              };
          base.name = f.name;
          base.slug = f.key;
          base.minPoints = f.min;
          base.maxPoints = f.max;
          return base;
        });
      };
      setTiers(normalizeTiers(allTiers));
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
      toast.error(t('loyalty.error.loadProgram') || 'Failed to load loyalty program data');
      setLoadError(t('loyalty.error.loadProgram') || 'Failed to load loyalty program data');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (txLoadingMore || !txHasMore) return;
    try {
      setTxLoadingMore(true);
      const nextPage = txPage + 1;
      const result = await loyaltyService.getTransactions(nextPage, 10);
      setTransactions(prev => [...prev, ...result.transactions]);
      setTxPage(nextPage);
      setTxHasMore(result.pagination.hasNext);
    } catch {
      toast.error(t('loyalty.error.loadTransactions') || 'Failed to load more transactions');
    } finally {
      setTxLoadingMore(false);
    }
  };

  // Rewards functions
  const fetchRewards = async () => {
    try {
      setRewardsLoading(true);
      setRewardsError(false);
      const [rewards, redemptions] = await Promise.all([
        RewardsService.getAvailableRewards(),
        RewardsService.getUserRedemptions()
      ]);
      setAvailableRewards(rewards);
      setMyRedemptions(redemptions);
    } catch (error) {
      console.error('Error fetching rewards:', error);
      setRewardsError(true);
    } finally {
      setRewardsLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    if (!loyaltyProfile) return;

    const reward = availableRewards.find(r => r.id === rewardId);
    if (!reward) return;

    if (loyaltyProfile.currentPoints < reward.pointsRequired) {
      toast.error(t('loyalty.insufficientPoints') || 'Insufficient points for this reward');
      return;
    }

    setRedeemReward(reward);
  };

  const confirmRedeemReward = async () => {
    if (!redeemReward) return;

    try {
      setRedeemingId(redeemReward.id);
      await RewardsService.redeemReward(redeemReward.id);
      toast.success(t('loyalty.success.redeem') || 'Reward redeemed successfully!');

      // Refresh both loyalty data and rewards
      await Promise.all([
        fetchLoyaltyData(),
        fetchRewards()
      ]);
    } catch (error: unknown) {
      console.error('Error redeeming reward:', error);
      const message = error instanceof Error ? error.message : (t('loyalty.error.redeem') || 'Failed to redeem reward');
      toast.error(message);
    } finally {
      setRedeemingId(null);
      setRedeemReward(null);
    }
  };

  const formatPoints = utilFormatPoints;

  // Using shared formatDate from @/utils/dateUtils
  const formatDate = (dateString: string) => sharedFormatDate(dateString, language);

  const interpolate = (tpl: string, vars: Record<string, string | number>) =>
    (tpl || '').replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

  const getTransactionDescription = (tx: LoyaltyTransaction) => {
    if (!tx) return '';
    if (tx.type === 'REDEEMED') {
      const rewardText = (tx.description || tx.reference || '').replace(/^Redeemed:\s*/i, '');
      const tpl = t('loyalty.tx.redeemedPoints') || 'Redeemed: {reward}';
      return interpolate(tpl, { reward: rewardText || '-' });
    }

    let reason = '';
    const desc = (tx.description || '').toLowerCase();
    if (tx.bookingId) {
      const tpl = t('loyalty.tx.completingBooking') || 'completing booking {bookingId}';
      reason = interpolate(tpl, { bookingId: tx.bookingId });
    } else if (desc.includes('writing a review')) {
      reason = t('loyalty.tx.writingReview') || 'writing a review';
    } else {
      reason = getTransactionTypeLabel(tx.type);
    }

    const tpl = t('loyalty.tx.earnedPoints') || 'Earned {points} points for {reason}';
    return interpolate(tpl, { points: tx.points, reason });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNED':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'REDEEMED':
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case 'BONUS':
        return <GiftIcon className="h-5 w-5 text-indigo-500" />;
      case 'REFERRAL':
        return <UsersIcon className="h-5 w-5 text-blue-500" />;
      case 'CAMPAIGN':
        return <FireIcon className="h-5 w-5 text-orange-500" active />;
      case 'SERVICE':
        return <BriefcaseIcon className="h-5 w-5 text-indigo-500" />;
      case 'BOOKING_COMPLETION':
        return <StarIcon className="h-5 w-5 text-yellow-500" active />;
      case 'PROFILE_VIEW':
        return <EyeIcon className="h-5 w-5 text-cyan-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'EARNED': return t('loyalty.tx.earned') || 'earned';
      case 'REDEEMED': return t('loyalty.tx.redeemed') || 'redeemed';
      case 'BONUS': return t('loyalty.tx.bonus') || 'bonus';
      case 'REFERRAL': return t('loyalty.tx.referral') || 'referral';
      case 'CAMPAIGN': return t('loyalty.tx.campaign') || 'campaign';
      case 'SERVICE': return t('loyalty.tx.service') || 'service';
      case 'BOOKING_COMPLETION': return t('loyalty.tx.bookingCompletion') || 'booking completion';
      case 'PROFILE_VIEW': return t('loyalty.tx.profileView') || 'profile view';
      case 'EXPIRED': return t('loyalty.tx.expired') || 'expired';
      case 'ADJUSTMENT': return t('loyalty.tx.adjustment') || 'adjustment';
      default: return type.toLowerCase().replace('_', ' ');
    }
  };

  const getTierProgress = () => {
    if (!loyaltyProfile || !loyaltyStats) return 0;

    const currentPoints = loyaltyProfile.currentPoints;
    const currentTierMin = loyaltyStats.currentTier?.minPoints || 0;
    const nextTierMin = loyaltyStats.nextTier?.minPoints || currentTierMin;

    if (nextTierMin === currentTierMin) return 100;

    const progress = ((currentPoints - currentTierMin) / (nextTierMin - currentTierMin)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  const translateBenefit = (benefit: string) => {
    const b = (benefit || '').toLowerCase();
    if (b.includes('basic support')) return t('loyalty.benefit.basicSupport') || benefit;
    if (b.includes('standard booking')) return t('loyalty.benefit.standardBooking') || benefit;
    if (b.includes('point earning')) return t('loyalty.benefit.pointEarning') || benefit;
    if (b.includes('priority support')) return t('loyalty.benefit.prioritySupport') || benefit;
    if (b.includes('early booking')) return t('loyalty.benefit.earlyBookingAccess') || benefit;
    if (b.includes('5%')) return t('loyalty.benefit.bonusPoints5') || benefit;
    if (b.includes('10%')) return t('loyalty.benefit.bonusPoints10') || benefit;
    if (b.includes('exclusive services')) return t('loyalty.benefit.exclusiveServices') || benefit;
    if (b.includes('free cancellation')) return t('loyalty.benefit.freeCancellation') || benefit;
    if (b.includes('vip support')) return t('loyalty.benefit.vipSupport') || benefit;
    if (b.includes('early access')) return t('loyalty.benefit.earlyAccess') || benefit;
    return benefit;
  };

  // Translate the tier display name (Bronze/Silver/Gold/Platinum). Keep the raw
  // name for getTierSkin() — only the user-facing label is localised.
  const translateTier = (name?: string): string => {
    const k = (name || '').toLowerCase();
    if (k.includes('bronze')) return t('loyalty.tier.bronze') || name || '';
    if (k.includes('silver')) return t('loyalty.tier.silver') || name || '';
    if (k.includes('gold')) return t('loyalty.tier.gold') || name || '';
    if (k.includes('platinum')) return t('loyalty.tier.platinum') || name || '';
    return name || '';
  };

  // Tier skin mapping for gamified look
  const getTierSkin = (name?: string) => {
    const n = (name || '').toUpperCase();
    switch (n) {
      case 'SILVER':
        return {
          summaryGradient: 'from-slate-100 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20',
          donutStroke: 'stroke-slate-500',
          accentText: 'text-slate-700 dark:text-slate-300',
          chipBg: 'bg-slate-600 text-white',
          benefitCheck: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
          currentCard: 'border-slate-400 bg-slate-50 dark:bg-slate-900/20',
          nextCard: 'border-gray-300 bg-gray-50 dark:bg-gray-900/20',
        };
      case 'GOLD':
        return {
          summaryGradient: 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20',
          donutStroke: 'stroke-yellow-500',
          accentText: 'text-yellow-700 dark:text-yellow-300',
          chipBg: 'bg-yellow-600 text-white',
          benefitCheck: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
          currentCard: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
          nextCard: 'border-amber-400 bg-amber-50 dark:bg-amber-900/20',
        };
      case 'PLATINUM':
        return {
          summaryGradient: 'from-indigo-50 to-indigo-50 dark:from-indigo-900/20 dark:to-indigo-900/20',
          donutStroke: 'stroke-indigo-500',
          accentText: 'text-indigo-700 dark:text-indigo-300',
          chipBg: 'bg-indigo-600 text-white',
          benefitCheck: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
          currentCard: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
          nextCard: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
        };
      case 'BRONZE':
      default:
        return {
          summaryGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          donutStroke: 'stroke-amber-500',
          accentText: 'text-amber-700 dark:text-amber-300',
          chipBg: 'bg-amber-600 text-white',
          benefitCheck: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
          currentCard: 'border-amber-500 bg-amber-50 dark:bg-amber-900/20',
          nextCard: 'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
        };
    }
  };

  if (loading) {
    return <PageLoader text={t('loyalty.loading') || 'Loading loyalty program...'} />;
  }

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 w-full max-w-full">
      <div className="max-w-7xl w-full min-w-0 mx-auto px-4 sm:px-6 lg:px-8 mobile-width-safe">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('loyalty.customerProgramTitle') || 'Loyalty Program'}
            </h1>
            <HelpTip title={h.pageTitle} content={h.pageBody} />
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {t('loyalty.customerProgramSubtitle') || 'Earn points, unlock rewards, and enjoy exclusive benefits'}
          </p>
        </div>

        {/* Error state */}
        {loadError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{loadError}</p>
              <button
                onClick={() => fetchLoyaltyData()}
                className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
              >
                {t('common.retry') || 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* Points Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Current Points */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.currentPoints') || 'Current Points'}</p>
                  <HelpTip title={h.currentPoints} content={h.currentPointsBody} />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                  {formatPoints(loyaltyProfile?.currentPoints || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                <StarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" active />
              </div>
            </div>
          </div>

          {/* Lifetime Points */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.lifetimePoints') || 'Lifetime Points'}</p>
                  <HelpTip title={h.lifetimePoints} content={h.lifetimePointsBody} />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {formatPoints(loyaltyProfile?.lifetimePoints || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" active />
              </div>
            </div>
          </div>

          {/* Current Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.currentTierShort') || 'Current Tier'}</p>
                  <HelpTip title={h.currentTier} content={h.currentTierBody} />
                </div>
                <p className="text-lg sm:text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {translateTier(loyaltyStats?.currentTier?.name) || 'Bronze'}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Points Spent */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('loyalty.pointsSpent') || 'Points Spent'}</p>
                  <HelpTip title={h.pointsSpent} content={h.pointsSpentBody} />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {formatPoints(loyaltyStats?.totalSpentPoints || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                <ArrowDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
          {loyaltyStats?.nextTier ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(t('loyalty.progressTo') || 'Progress to') + ' ' + translateTier(loyaltyStats.nextTier.name)}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
                  {Math.round(getTierProgress())}%
                </span>
              </div>

              <div className="relative">
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    style={{ width: `${getTierProgress()}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                  ></div>
                </div>

                <div className="flex flex-wrap justify-between gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="shrink-0">{translateTier(loyaltyStats.currentTier?.name)} ({formatPoints(loyaltyStats.currentTier?.minPoints || 0)})</span>
                  <span className="shrink-0">{translateTier(loyaltyStats.nextTier.name)} ({formatPoints(loyaltyStats.nextTier.minPoints)})</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {translateTier(loyaltyStats?.currentTier?.name)}
                </h3>
                <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {t('loyalty.maxTierReached') || 'Max tier reached'}
                </span>
              </div>
              <div className="overflow-hidden h-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600" />
            </>
          )}
        </div>

        {/* Customer Benefits Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm p-4 sm:p-6 border border-blue-200 dark:border-blue-800 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('loyalty.howToEarnCustomer') || 'How to Earn Points as a Customer'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <BriefcaseIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.bookServices') || 'Book Services'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.bookServicesHelpCustomer') || '10 points per $1 spent when booking services'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.redeemRewards') || 'Redeem Rewards'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.redeemRewardsHelpShort') || 'Use points to redeem discount vouchers'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.referrals') || 'Referrals'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.referralsHelp') || 'Refer new customers and specialists'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-orange-100 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
                <FireIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" active />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.specialCampaigns') || 'Special Campaigns'}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.specialCampaignsHelp') || 'Participate in bonus point events'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8 min-w-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex flex-wrap px-4 sm:px-6 min-w-0">
              {[
                { key: 'overview', label: t('loyalty.tab.overview') || 'Overview', shortLabel: t('loyalty.tab.overview') || 'Overview', icon: StarIcon },
                { key: 'history', label: t('loyalty.tab.history') || 'Transaction History', shortLabel: t('loyalty.tab.historyShort') || 'History', icon: ClockIcon },
                { key: 'tiers', label: t('loyalty.tab.tiers') || 'Tiers & Benefits', shortLabel: t('loyalty.tab.tiersShort') || 'Tiers', icon: TrophyIcon },
                { key: 'rewards', label: t('loyalty.tab.rewards') || 'Rewards', shortLabel: t('loyalty.tab.rewards') || 'Rewards', icon: GiftIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center py-3 sm:py-4 px-2 sm:px-4 mr-4 sm:mr-8 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition active:scale-[0.96] ${
                      isActive
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatPoints(loyaltyStats?.monthlyPoints || 0)}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.pointsThisMonth') || 'Points This Month'}</p>
                      <HelpTip title={h.monthlyPoints} content={h.monthlyPointsBody} />
                    </div>
                  </div>

                  <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                      {loyaltyStats?.totalReferrals || 0}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.totalReferrals') || 'Total Referrals'}</p>
                      <HelpTip title={h.referrals} content={h.referralsBody} />
                    </div>
                  </div>

                  <div className="text-center p-3 sm:p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" active />
                    <p className="text-lg sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {loyaltyStats?.totalBadges || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('loyalty.badgesEarned') || 'Badges Earned'}</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('loyalty.recentActivity') || 'Recent Activity'}</h4>
                  <div className="space-y-2 sm:space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                          {getTransactionIcon(transaction.type)}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{getTransactionDescription(transaction)}</p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className={`font-semibold text-sm sm:text-base tabular-nums ${
                            (['EARNED','BONUS','REFERRAL','CAMPAIGN','SERVICE','BOOKING_COMPLETION','PROFILE_VIEW'] as string[]).includes(transaction.type as string)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'REDEEMED' ? '-' : '+'}{formatPoints(transaction.points)} pts
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.transactionHistory') || 'Transaction History'}</h4>
                <div className="space-y-3">
                  {transactions.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
                      {t('loyalty.noTransactions') || 'No transactions yet'}
                    </p>
                  )}
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        {getTransactionIcon(transaction.type)}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{getTransactionDescription(transaction)}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{formatDate(transaction.createdAt)}</p>
                            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'EARNED' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              transaction.type === 'REDEEMED' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              transaction.type === 'BONUS' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400' :
                              transaction.type === 'REFERRAL' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              (transaction.type as string) === 'SERVICE' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400' :
                              (transaction.type as string) === 'BOOKING_COMPLETION' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              (transaction.type as string) === 'PROFILE_VIEW' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                            }`}>
                              {getTransactionTypeLabel(transaction.type)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`font-bold text-base sm:text-lg tabular-nums ${
                          transaction.type === 'EARNED' || transaction.type === 'BONUS' || transaction.type === 'REFERRAL' || transaction.type === 'CAMPAIGN' || (transaction.type as string) === 'SERVICE' || (transaction.type as string) === 'BOOKING_COMPLETION' || (transaction.type as string) === 'PROFILE_VIEW'
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {transaction.type === 'REDEEMED' ? '-' : '+'}{formatPoints(transaction.points)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('loyalty.points') || 'points'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {txHasMore && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={loadMoreTransactions}
                      disabled={txLoadingMore}
                      className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 border border-primary-300 dark:border-primary-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {txLoadingMore ? (t('common.loading') || 'Loading...') : (t('common.loadMore') || 'Load more')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tiers Tab */}
            {activeTab === 'tiers' && (
              <div className="space-y-4 sm:space-y-6">
                <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('loyalty.membershipTiers') || 'Membership Tiers'}</h4>
                {/* Summary card */}
                {(() => {
                  const skin = getTierSkin(loyaltyStats?.currentTier?.name || 'BRONZE');
                  return (
                    <div className={`p-4 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r ${skin.summaryGradient}`}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{t('loyalty.currentTier') || 'Your current tier'}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                              {translateTier(loyaltyStats?.currentTier?.name) || 'BRONZE'}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-semibold ${skin.chipBg}`}>
                              <TrophyIcon className="h-3 w-3 mr-1" active />
                              {t('nav.level') || 'Level'}
                            </span>
                          </div>
                          <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/60 dark:bg-gray-700/60 text-gray-800 dark:text-gray-200">
                            {(() => {
                              const nextName = translateTier(loyaltyStats?.nextTier?.name);
                              const nextMin = loyaltyStats?.nextTier?.minPoints || 0;
                              const curPts = loyaltyProfile?.currentPoints || 0;
                              const toNext = Math.max(0, nextMin - curPts);
                              return nextName ? `${formatPoints(toNext)} ${t('loyalty.points') || 'points'} ${t('loyalty.next') || 'Next'}: ${nextName}` : t('common.notAvailable') || 'N/A';
                            })()}
                          </div>
                        </div>
                        <div className="justify-self-center">
                          {/* Donut progress */}
                          {(() => {
                            const progress = getTierProgress();
                            const size = 96;
                            const stroke = 10;
                            const radius = (size - stroke) / 2;
                            const circumference = 2 * Math.PI * radius;
                            const dash = (progress / 100) * circumference;
                            const ring = getTierSkin(loyaltyStats?.currentTier?.name || 'BRONZE').donutStroke;
                            return (
                              <svg width={size} height={size} className="rotate-[-90deg]">
                                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} className="fill-none stroke-gray-200 dark:stroke-gray-700"/>
                                <circle cx={size/2} cy={size/2} r={radius} strokeWidth={stroke} className={`fill-none ${ring}`} strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"/>
                                <text x="50%" y="50%" className="rotate-[90deg] fill-gray-900 dark:fill-gray-100 text-xs" textAnchor="middle" dominantBaseline="middle">{Math.round(progress)}%</text>
                              </svg>
                            );
                          })()}
                        </div>
                        <div>
                          {(() => {
                            const accent = getTierSkin(loyaltyStats?.currentTier?.name || 'BRONZE').accentText;
                            return (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="p-2 rounded-xl bg-white/60 dark:bg-gray-700/60">
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{t('labels.amount') || 'Amount'}</p>
                                  <p className={`font-semibold ${accent}`}>{formatPoints(loyaltyProfile?.currentPoints || 0)} {t('loyalty.points') || 'points'}</p>
                                </div>
                                <div className="p-2 rounded-xl bg-white/60 dark:bg-gray-700/60">
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{t('labels.spent') || 'Spent'}</p>
                                  <p className={`font-semibold ${accent}`}>{formatPoints(loyaltyStats?.totalSpentPoints || 0)} {t('loyalty.pointsShort') || 'pts'}</p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Tiers chart */}
                {tiers.length > 0 && (
                  <div className="p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="mb-3 sm:mb-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t('loyalty.tiersProgress') || 'Tiers Progress'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('loyalty.tiersProgressHelp') || 'See how your points map across tiers'}</p>
                    </div>
                    <div className="relative overflow-hidden">
                      <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="absolute inset-0 flex justify-between">
                        {tiers.map((tier) => {
                          const min = tier.minPoints;
                          const totalSpan = Math.max(...tiers.map(t => (t.maxPoints ?? t.minPoints + 1)));
                          const leftPct = Math.min(100, Math.max(0, (min / totalSpan) * 100));
                          const isCurrent = loyaltyStats?.currentTier?.id === tier.id;
                          return (
                            <div key={tier.id} className="absolute" style={{ left: `calc(${leftPct}% - 8px)` }}>
                              <div className={`h-4 w-4 rounded-full border-2 ${isCurrent ? 'bg-primary-500 border-primary-600' : 'bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500'}`}></div>
                              <div className="mt-1 text-center w-20 -ml-8">
                                <div className={`text-[10px] sm:text-xs font-medium ${isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'}`}>{translateTier(tier.name)}</div>
                                <div className="text-[10px] text-gray-500 dark:text-gray-400">{formatPoints(min)} {t('loyalty.pointsShort') || 'pts'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Current position marker */}
                      {loyaltyProfile && (
                        <div className="absolute -top-2" style={{ left: `${Math.min(100, Math.max(0, (loyaltyProfile.currentPoints / Math.max(...tiers.map(t => (t.maxPoints ?? t.minPoints + 1)))) * 100))}%` }}>
                          <div className="h-6 w-1 bg-primary-500 rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid gap-4 sm:gap-6">
                  {tiers.map((tier) => {
                    const isCurrentTier = loyaltyStats?.currentTier?.id === tier.id;
                    const isNextTier = loyaltyStats?.nextTier?.id === tier.id;
                    const skin = getTierSkin(tier.name);

                    return (
                      <div key={tier.id} className={`p-4 sm:p-6 rounded-xl border-2 relative overflow-hidden ${
                        isCurrentTier
                          ? skin.currentCard
                          : isNextTier
                          ? skin.nextCard
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-3">
                              <h5 className={`text-lg sm:text-xl font-bold ${
                                isCurrentTier ? 'text-primary-700 dark:text-primary-300' :
                                isNextTier ? 'text-yellow-700 dark:text-yellow-300' :
                                'text-gray-900 dark:text-white'
                              }`}>
                                {translateTier(tier.name)}
                              </h5>
                              {isCurrentTier && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-600 text-white">
                                  {t('loyalty.current') || 'Current'}
                                </span>
                              )}
                              {isNextTier && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-600 text-white">
                                  {t('loyalty.nextTier') || 'Next Tier'}
                                </span>
                              )}
                            </div>

                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                              {formatPoints(tier.minPoints)} {t('loyalty.pointsRequired') || 'points required'}
                              {tier.maxPoints && ` - ${formatPoints(tier.maxPoints)} ${t('loyalty.points') || 'points'}`}
                            </p>

                            <div className="space-y-2">
                              <h6 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">{t('loyalty.benefits') || 'Benefits'}:</h6>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {tier.benefits.map((benefit, index) => (
                                  <div key={index} className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                                    <span className={`h-5 w-5 rounded-full ${skin.benefitCheck} flex items-center justify-center mr-2`}>✓</span>
                                    <span className="break-words">{translateBenefit(benefit)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {tier.discountPercentage && (
                            <div className="text-center sm:text-right mt-4 sm:mt-0">
                              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                                {tier.discountPercentage}%
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('loyalty.discount') || 'Discount'}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {t('loyalty.availableRewards') || 'Available Rewards'}
                  </h4>
                  <HelpTip title={h.rewardsTab} content={h.rewardsTabBody} />
                </div>

                {rewardsLoading ? (
                  <ContentLoader />
                ) : rewardsError ? (
                  <div className="py-8 text-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      {t('loyalty.error.loadRewards') || 'Failed to load rewards'}
                    </p>
                    <button
                      onClick={fetchRewards}
                      className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition active:scale-[0.96]"
                    >
                      {t('common.retry') || 'Try again'}
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:gap-6">
                    {/* Available Rewards Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                          {t('loyalty.rewardsYouCanRedeem') || 'Rewards You Can Redeem'} ({availableRewards.length})
                        </h5>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {t('loyalty.yourPoints') || 'Your Points'}: {formatPoints(loyaltyProfile?.currentPoints || 0)}
                        </div>
                      </div>

                      {availableRewards.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <GiftIcon className="h-12 w-12 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t('loyalty.noRewardsAvailable') || 'No rewards available right now.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableRewards.map((reward) => {
                            const canAfford = (loyaltyProfile?.currentPoints || 0) >= reward.pointsRequired;
                            const isAvailable = RewardsService.isRewardAvailable(reward);

                            return (
                              <div
                                key={reward.id}
                                className="p-4 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h6 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                          {reward.title}
                                        </h6>
                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                          {reward.description}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                                      <div className="flex items-center text-primary-600 dark:text-primary-400">
                                        <StarIcon className="h-4 w-4 mr-1" active />
                                        {formatPoints(reward.pointsRequired)} points
                                      </div>
                                      <div className="flex items-center text-indigo-600 dark:text-indigo-400">
                                        <GiftIcon className="h-4 w-4 mr-1" />
                                        {RewardsService.getRewardValue(reward)}
                                      </div>
                                      {reward.specialist && (
                                        <div className="flex items-center text-blue-600 dark:text-blue-400">
                                          <UsersIcon className="h-4 w-4 mr-1" />
                                          {reward.specialist.firstName} {reward.specialist.lastName}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3">
                                      <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                        {RewardsService.getRewardTypeLabel(reward.type)}
                                      </span>
                                      {reward.usageLimit === 'ONCE_PER_USER' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                                          One time only
                                        </span>
                                      )}
                                      {reward.validUntil && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-xl text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                          Expires {new Date(reward.validUntil).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex-shrink-0">
                                    <button
                                      onClick={() => handleRedeemReward(reward.id)}
                                      disabled={!canAfford || !isAvailable || redeemingId === reward.id}
                                      className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition active:scale-[0.96] disabled:active:scale-100 ${
                                        canAfford && isAvailable
                                          ? 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                                          : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                                      }`}
                                    >
                                      {redeemingId === reward.id ? (t('loyalty.redeeming') || 'Redeeming...') :
                                       !canAfford ? (t('loyalty.notEnoughPoints') || 'Not Enough Points') :
                                       !isAvailable ? (t('common.unavailable') || 'Unavailable') :
                                       (t('loyalty.redeem') || 'Redeem')}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* My Redemptions Section */}
                    <div className="space-y-4">
                      <h5 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
                        {t('loyalty.myRedemptions') || 'My Redemptions'} ({myRedemptions.length})
                      </h5>

                      {myRedemptions.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <TrophyIcon className="h-10 w-10 text-gray-500 dark:text-gray-400 mx-auto mb-2" active />
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {t('loyalty.noRedemptionsYet') || 'You haven\'t redeemed any rewards yet.'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myRedemptions.slice(0, 10).map((redemption) => {
                            const statusInfo = RewardsService.formatRedemptionStatus(redemption.status);

                            return (
                              <div key={redemption.id} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                      <h6 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                        {redemption.reward.title}
                                      </h6>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                        statusInfo.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                        statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                        statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                        statusInfo.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                      }`}>
                                        {statusInfo.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                      <span>{formatPoints(redemption.pointsUsed)} {t('loyalty.pointsUsed') || 'points used'}</span>
                                      <span>•</span>
                                      <span>{formatDate(redemption.redeemedAt)}</span>
                                      {redemption.expiresAt && redemption.status === 'APPROVED' && (
                                        <>
                                          <span>•</span>
                                          <span>{t('common.expires') || 'Expires'} {formatDate(redemption.expiresAt)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {myRedemptions.length > 10 && (
                            <div className="text-center">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(t('common.showing') || 'Showing')} 10 {(t('common.of') || 'of')} {myRedemptions.length} {(t('loyalty.redemptions') || 'redemptions')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal
        open={!!redeemReward}
        title={`${t('loyalty.confirmRedeemPrefix') || 'Redeem'} "${redeemReward?.title}"?`}
        message={`${t('loyalty.confirmRedeemSuffix') || 'for'} ${redeemReward ? formatPoints(redeemReward.pointsRequired) : ''} ${t('loyalty.points') || 'points'}`}
        confirmText={t('loyalty.redeem') || 'Redeem'}
        loading={!!redeemingId}
        variant="primary"
        onConfirm={confirmRedeemReward}
        onCancel={() => setRedeemReward(null)}
      />
    </div>
  );
};

export default CustomerLoyalty;
