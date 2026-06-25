import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { HelpTip } from '@/components/common/HelpTip';
import { loyaltyService, UserBadge, LoyaltyBadge } from '@/services/loyalty.service';
import { toast } from 'react-toastify';
import { TrophyIcon, SparklesIcon, CheckCircleIcon, LockClosedIcon, ClockIcon, InformationCircleIcon, StarIcon, HeartIcon, CrownIcon, GiftIcon, FireIcon } from '@/components/icons';
import { PageLoader } from '@/components/ui';
// Note: Use active prop for filled icons: <Icon active />
;

interface BadgeWithStatus extends LoyaltyBadge {
  isEarned: boolean;
  earnedAt?: string;
  progress?: number;
}

const CustomerBadges: React.FC = () => {
  const { theme: _theme } = useTheme();
  const { t, language } = useLanguage();

  const HELP = {
    en: {
      overview: 'Your badge collection — achievements you unlock by using the platform.\n\nHow badges work:\n• Each badge has a criteria shown on the card (e.g. "Complete 5 bookings", "Leave 3 reviews").\n• Locked badges (grey, padlock icon) show what you still need to do.\n• In-progress badges show a progress bar so you can track how close you are.\n• Earned badges show the date you unlocked them.\n\nStats at the top:\n• Badges Earned — number of badges you\'ve unlocked so far.\n• Badge Points — total points from all earned badges (separate from loyalty points).\n• Completion Rate — the percentage of all available badges you\'ve earned so far.\n\nRarity levels: Common → Rare → Epic → Legendary. Rarer badges are harder to earn and worth more points.\n\nFilters: narrow by Category (achievement, milestone, social, loyalty, streak…) or by Rarity.',
    },
    uk: {
      overview: 'Ваша колекція бейджів — досягнення, які ви отримуєте, користуючись платформою.\n\nЯк це працює:\n• Кожен бейдж має умову отримання (наприклад: «Завершіть 5 записів», «Залиште 3 відгуки»).\n• Заблоковані бейджі (сірі, із замком) показують, що ще потрібно зробити.\n• Бейджі «в процесі» мають смугу прогресу — так ви бачите, наскільки близько до мети.\n• Отримані бейджі відображають дату розблокування.\n\nСтатистика вгорі:\n• Отримано бейджів — скільки ви вже розблокували.\n• Бали за бейджі — загальна сума балів з усіх отриманих бейджів (не плутайте з балами лояльності).\n• Відсоток виконання — частка всіх доступних бейджів, яку ви вже отримали.\n\nРівні рідкісності: Звичайний → Рідкісний → Епічний → Легендарний.\n\nФільтри: за категорією (досягнення, етап, соціальні, лояльність, серія…) або за рідкісністю.',
    },
    ru: {
      overview: 'Ваша коллекция значков — достижения, которые вы получаете, пользуясь платформой.\n\nКак это работает:\n• У каждого значка есть условие получения (например: «Завершите 5 записей», «Оставьте 3 отзыва»).\n• Заблокированные значки (серые, со значком замка) показывают, что ещё нужно сделать.\n• Значки «в процессе» имеют полосу прогресса — видно, насколько вы близки к цели.\n• Полученные значки отображают дату разблокировки.\n\nСтатистика вверху:\n• Получено значков — сколько вы уже разблокировали.\n• Баллы за значки — общая сумма баллов из всех полученных значков (не путать с баллами лояльности).\n• Процент выполнения — доля всех доступных значков, которую вы уже получили.\n\nУровни редкости: Обычный → Редкий → Эпический → Легендарный.\n\nФильтры: по категории (достижение, этап, социальные, лояльность, серия…) или по редкости.',
    },
  };
  const h = (HELP as any)[language] || HELP.en;

  const [loading, setLoading] = useState(true);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const [earnedBadges, allBadges] = await Promise.all([
        loyaltyService.getUserBadges(),
        loyaltyService.getAvailableBadges()
      ]);

      setUserBadges(earnedBadges);

      // Combine badges with earned status
      const badgesWithStatus: BadgeWithStatus[] = allBadges.map((badge) => {
        const earnedBadge = earnedBadges.find(ub => ub.badgeId === badge.id);
        return {
          ...badge,
          isEarned: !!earnedBadge,
          earnedAt: earnedBadge?.earnedAt,
          progress: earnedBadge?.progress
        };
      });

      setBadges(badgesWithStatus);
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast.error(t('badges.loadError') || 'Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (category: string, isEarned: boolean) => {
    const iconClass = `h-8 w-8 ${isEarned ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`;

    switch (category.toLowerCase()) {
      case 'achievement':
        return isEarned ? <TrophyIcon className={iconClass} /> : <TrophyIcon className={iconClass} />;
      case 'milestone':
        return isEarned ? <StarIcon className={iconClass} /> : <StarIcon className={iconClass} />;
      case 'social':
        return isEarned ? <HeartIcon className={iconClass} /> : <HeartIcon className={iconClass} />;
      case 'loyalty':
        return isEarned ? <CrownIcon className={iconClass} /> : <CrownIcon className={iconClass} />;
      case 'special':
        return isEarned ? <SparklesIcon className={iconClass} /> : <SparklesIcon className={iconClass} />;
      case 'seasonal':
        return isEarned ? <GiftIcon className={iconClass} /> : <GiftIcon className={iconClass} />;
      case 'streak':
        return isEarned ? <FireIcon className={iconClass} /> : <FireIcon className={iconClass} />;
      default:
        return isEarned ? <TrophyIcon className={iconClass} /> : <TrophyIcon className={iconClass} />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
      case 'RARE':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300';
      case 'EPIC':
        return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300';
      case 'LEGENDARY':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'COMMON':
        return 'border-gray-200 dark:border-gray-700';
      case 'RARE':
        return 'border-blue-200 dark:border-blue-700';
      case 'EPIC':
        return 'border-indigo-200 dark:border-indigo-700';
      case 'LEGENDARY':
        return 'border-yellow-200 dark:border-yellow-700';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  const filteredBadges = badges.filter(badge => {
    const matchesCategory = selectedCategory === 'all' || badge.category === selectedCategory;
    const matchesRarity = selectedRarity === 'all' || badge.rarity === selectedRarity;
    return matchesCategory && matchesRarity;
  });

  const earnedCount = badges.filter(badge => badge.isEarned).length;
  const totalPoints = userBadges.reduce((sum, badge) => sum + badge.badge.points, 0);
  const categories = [...new Set(badges.map(badge => badge.category))];
  const rarities = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

  if (loading) {
    return <PageLoader text={t('badges.loading') || 'Loading badges...'} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('badges.pageTitle')}
            </h1>
            <HelpTip title={language === 'uk' ? 'Бейджі' : language === 'ru' ? 'Значки' : 'Badges'} content={h.overview} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('badges.pageSubtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('badges.earnedCount')}</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 tabular-nums">
                  {earnedCount}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 tabular-nums">
                  {t('badges.earnedOf').replace('{{total}}', String(badges.length))}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                <TrophyIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" active />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('badges.badgePoints')}</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {totalPoints.toLocaleString()}
                </p>
              </div>
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                <StarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" active />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('badges.completionRate')}</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                  {Math.round((earnedCount / badges.length) * 100)}%
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" active />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('badges.categoryLabel')}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{t('badges.allCategories')}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('badges.rarityLabel')}
              </label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">{t('badges.allRarities')}</option>
                {rarities.map((rarity) => (
                  <option key={rarity} value={rarity}>
                    {rarity.charAt(0) + rarity.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBadges.map((badge) => {
            const rarityColorClass = getRarityColor(badge.rarity);
            const rarityBorderClass = getRarityBorder(badge.rarity);
            
            return (
              <div
                key={badge.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 p-6 transition-all duration-200 hover:shadow-md ${
                  badge.isEarned 
                    ? `${rarityBorderClass} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ${
                        badge.rarity === 'LEGENDARY' ? 'ring-yellow-200 dark:ring-yellow-800' :
                        badge.rarity === 'EPIC' ? 'ring-indigo-200 dark:ring-indigo-800' :
                        badge.rarity === 'RARE' ? 'ring-blue-200 dark:ring-blue-800' :
                        'ring-gray-200 dark:ring-gray-700'
                      }` 
                    : 'border-gray-200 dark:border-gray-700 opacity-75'
                }`}
              >
                {/* Badge Icon and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-full ${
                    badge.isEarned 
                      ? badge.rarity === 'LEGENDARY' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                        badge.rarity === 'EPIC' ? 'bg-indigo-100 dark:bg-indigo-900/20' :
                        badge.rarity === 'RARE' ? 'bg-blue-100 dark:bg-blue-900/20' :
                        'bg-gray-100 dark:bg-gray-700'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    {getBadgeIcon(badge.category, badge.isEarned)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {badge.isEarned ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" active />
                    ) : (
                      <LockClosedIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Badge Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${
                      badge.isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {badge.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${rarityColorClass}`}>
                      {badge.rarity.toLowerCase()}
                    </span>
                  </div>

                  <p className={`text-sm ${
                    badge.isEarned ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {badge.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <StarIcon className="h-4 w-4 text-yellow-500" active />
                      <span className={`tabular-nums ${badge.isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {t('badges.pointsLabel').replace('{{count}}', String(badge.points))}
                      </span>
                    </div>
                    
                    <span className={`capitalize ${
                      badge.isEarned ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      {badge.category}
                    </span>
                  </div>

                  {/* Progress Bar for In-Progress Badges */}
                  {!badge.isEarned && badge.progress !== undefined && badge.progress > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>{t('badges.progressLabel')}</span>
                        <span className="tabular-nums">{Math.round(badge.progress)}%</span>
                      </div>
                      <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                          style={{ width: `${badge.progress}%` }}
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 rounded-full transition-all duration-300"
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Earned Date */}
                  {badge.isEarned && badge.earnedAt && (
                    <div className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 mt-2">
                      <ClockIcon className="h-3 w-3" />
                      <span>
                        {t('badges.earnedOn')} {new Date(badge.earnedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Criteria */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-start space-x-2">
                      <InformationCircleIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {badge.criteria}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-500 dark:text-gray-400 mx-auto mb-4" active />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('badges.noBadgesFound')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('badges.noBadgesFoundDesc')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerBadges;
