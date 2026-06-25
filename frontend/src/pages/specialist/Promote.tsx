import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  promoteService,
  FeaturedStatus,
  AcquisitionStats,
  BookingSourceKey,
  BoostDays,
  BoostPricing,
  BOOKING_SOURCES,
} from '../../services/promote.service';
import { PageLoader } from '@/components/ui';
import { HelpTip } from '@/components/common/HelpTip';
import PromotedListingEditor from '@/components/specialist/PromotedListingEditor';
import { toast } from 'react-toastify';
import {
  RocketLaunchIcon,
  UsersIcon,
  UserPlusIcon,
  GlobeIcon as GlobeAltIcon,
  LinkIcon,
  CalendarDaysIcon,
  StarIcon,
} from '@/components/icons';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Help content — trilingual
// ---------------------------------------------------------------------------

const PROMOTE_HELP = {
  en: {
    overview:
      'Promote\n\nBuy a boost with Telegram Stars (⭐) to activate Featured placement in MiyZapis search and put your listing in the discovery showcase — so new clients find you first.\n\n' +
      'How a boost works:\n' +
      '• Choose a duration: 7, 30, or 90 days\n' +
      '• Pay with Telegram Stars — opens Telegram with a pre-filled invoice\n' +
      '• On payment: you are sorted first in search results + your listing card appears in the discovery showcase for the full period\n' +
      '• Both expire together at the end of the paid period\n' +
      '• Cancel early for free anytime — listing leaves the showcase immediately\n\n' +
      'Listing card (editor below the boost control):\n' +
      '• Prepare your ad creative (headline, offer, cover photo) and save as a draft\n' +
      '• The card goes live in the showcase automatically when you buy a boost\n\n' +
      'Acquisition metrics:\n' +
      '• Total bookings — all bookings received across all sources\n' +
      '• New clients — first-time clients (never booked you before)\n' +
      '• Discovery — clients who found you via MiyZapis search / category pages\n' +
      '• Embed — bookings from your embedded booking widget on your own website\n' +
      '• Direct — clients who opened your booking link directly (e.g. from your Instagram bio)',
  },
  uk: {
    overview:
      'Просування\n\nКупіть буст за зірки Telegram (⭐), щоб активувати рекомендоване місце у пошуку MiyZapis і показати вашу картку у вітрині — нові клієнти знайдуть вас першими.\n\n' +
      'Як працює буст:\n' +
      '• Оберіть тривалість: 7, 30 або 90 днів\n' +
      '• Оплата зірками Telegram — відкриє Telegram із готовим рахунком\n' +
      '• Після оплати: ви з’являєтесь першим у пошуку + ваша картка у вітрині на весь оплачений строк\n' +
      '• Обидва завершуються одночасно після закінчення строку\n' +
      '• Скасування — безкоштовно в будь-який момент, картка прибирається одразу\n\n' +
      'Картка оголошення (редактор нижче):\n' +
      '• Підготуйте рекламну картку (заголовок, пропозиція, фото) і збережіть як чернетку\n' +
      '• Картка з’являється у вітрині автоматично при купівлі бусту\n\n' +
      'Показники залучення:\n' +
      '• Всього записів — усі записи з усіх джерел\n' +
      '• Нові клієнти — ті, хто записувався вперше\n' +
      '• Discovery — через пошук / сторінки категорій\n' +
      '• Embed — через вбудований віджет на вашому сайті\n' +
      '• Direct — ті, хто відкрив ваше посилання напряму',
  },
  ru: {
    overview:
      'Продвижение\n\nКупите буст за звёзды Telegram (⭐), чтобы активировать рекомендованное место в поиске MiyZapis и показать вашу карточку в витрине — новые клиенты найдут вас первыми.\n\n' +
      'Как работает буст:\n' +
      '• Выберите длительность: 7, 30 или 90 дней\n' +
      '• Оплата звёздами Telegram — откроет Telegram с готовым счётом\n' +
      '• После оплаты: вы первые в поиске + ваша карточка в витрине на весь оплаченный период\n' +
      '• Оба завершаются одновременно по истечении срока\n' +
      '• Отмена — бесплатно в любой момент, карточка убирается сразу\n\n' +
      'Карточка объявления (редактор ниже):\n' +
      '• Подготовьте рекламную карточку (заголовок, предложение, фото) и сохраните как черновик\n' +
      '• Карточка появляется в витрине автоматически при покупке буста\n\n' +
      'Показатели привлечения:\n' +
      '• Всего записей — все записи из всех источников\n' +
      '• Новые клиенты — те, кто записывался впервые\n' +
      '• Discovery — через поиск / страницы категорий\n' +
      '• Embed — через встроенный виджет на вашем сайте\n' +
      '• Direct — те, кто открыл вашу ссылку напрямую',
  },
};

// Boost-length presets (days).
const DAY_PRESETS = [7, 30, 90];

// Per-source accent + icon for the acquisition breakdown.
const SOURCE_META: Record<
  BookingSourceKey,
  { icon: React.ComponentType<{ className?: string }>; accent: string; iconBg: string; key: string }
> = {
  DISCOVERY: {
    icon: GlobeAltIcon,
    accent: 'text-primary-600 dark:text-primary-400',
    iconBg: 'bg-primary-100 dark:bg-primary-900/30',
    key: 'promote.discovery',
  },
  EMBED: {
    icon: CodeBracketIcon,
    accent: 'text-secondary-600 dark:text-secondary-400',
    iconBg: 'bg-secondary-100 dark:bg-secondary-900/30',
    key: 'promote.embed',
  },
  DIRECT: {
    icon: LinkIcon,
    accent: 'text-gray-600 dark:text-gray-400',
    iconBg: 'bg-gray-100 dark:bg-gray-700',
    key: 'promote.direct',
  },
  MARKETPLACE: {
    icon: UsersIcon,
    accent: 'text-success-600 dark:text-success-400',
    iconBg: 'bg-success-100 dark:bg-success-900/30',
    key: 'promote.marketplace',
  },
};

// Show discovery + embed first (the acquisition channels that matter), then the rest.
const SOURCE_ORDER: BookingSourceKey[] = ['DISCOVERY', 'EMBED', 'DIRECT', 'MARKETPLACE'];

const Promote: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (PROMOTE_HELP as Record<string, typeof PROMOTE_HELP.en>)[language] || PROMOTE_HELP.en;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buyingBoost, setBuyingBoost] = useState(false);
  const [status, setStatus] = useState<FeaturedStatus | null>(null);
  const [stats, setStats] = useState<AcquisitionStats | null>(null);
  const [pricing, setPricing] = useState<BoostPricing | null>(null);
  const [selectedDays, setSelectedDays] = useState<BoostDays>(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, st, p] = await Promise.all([
        promoteService.getStatus(),
        promoteService.getStats(),
        promoteService.getBoostPricing(),
      ]);
      setStatus(s);
      setStats(st);
      setPricing(p);
    } catch (err) {
      toast.error((err as Error).message || t('promote.loadError') || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // Re-fetch when the tab regains focus — payment happens in Telegram.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        promoteService.getStatus().then(setStatus).catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  // Buy a boost: create invoice → open in Telegram (mirrors Billing.tsx).
  const handleBoost = async () => {
    setBuyingBoost(true);
    try {
      const link = await promoteService.createBoostInvoice(selectedDays);
      toast.info(t('promote.openingTelegram') || 'Opening Telegram…');
      const tg = (window as unknown as { Telegram?: { WebApp?: { openInvoice?: (url: string, cb?: (status: string) => void) => void } } }).Telegram?.WebApp;
      if (tg?.openInvoice) {
        tg.openInvoice(link, (invoiceStatus) => {
          if (invoiceStatus === 'paid') {
            // Re-fetch after a short delay to let the bot handler complete.
            setTimeout(() => load(), 2000);
          }
        });
      } else {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      toast.error((err as Error).message || t('promote.saveError') || 'Failed to start payment');
    } finally {
      setBuyingBoost(false);
    }
  };

  // Disable: free + immediate.
  const handleDisable = async () => {
    setSaving(true);
    try {
      const next = await promoteService.setFeatured(false);
      setStatus(next);
      toast.success(t('promote.boostDisabled') || 'Boost disabled');
    } catch (err) {
      toast.error((err as Error).message || t('promote.saveError') || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string | null): string => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const isActive = status?.isActive ?? false;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30">
          <RocketLaunchIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('promote.title') || 'Promote'}
            </h1>
            <HelpTip title={t('help.promote.title') || 'Promote'} content={h.overview} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('promote.subtitle') ||
              'Feature your profile at the top of search and track new clients you acquire.'}
          </p>
        </div>
      </div>

      {/* Featured boost card */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
          isActive
            ? 'border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-gray-900'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('promote.featured') || 'Featured'}
              </h2>
              {isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  {t('promote.active') || 'Active'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isActive && status?.featuredUntil ? (
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <CalendarDaysIcon className="w-4 h-4" />
                  {(t('promote.activeUntil') || 'Active until')} {formatDate(status.featuredUntil)}
                </span>
              ) : (
                t('promote.featuredHelp') ||
                'Boosted profiles appear first in marketplace search results.'
              )}
            </p>
          </div>

          <div className="shrink-0">
            {isActive ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleDisable}
                className="inline-flex items-center justify-center h-11 px-5 rounded-xl font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50"
              >
                {t('promote.disableBoost') || 'Disable boost'}
              </button>
            ) : (
              <button
                type="button"
                disabled={buyingBoost || !pricing}
                onClick={handleBoost}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-medium text-amber-950 bg-amber-400 hover:bg-amber-500 transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50"
              >
                <StarIcon className="w-5 h-5" active />
                {buyingBoost
                  ? (t('promote.openingTelegram') || 'Opening…')
                  : pricing
                    ? `${t('promote.boostFor') || 'Boost for'} ${pricing[selectedDays].toLocaleString()} ⭐`
                    : (t('promote.enableBoost') || 'Buy boost')}
              </button>
            )}
          </div>
        </div>

        {/* Boost-length picker (only relevant before purchasing) */}
        {!isActive && (
          <div className="mt-5">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {t('promote.boostFor') || 'Boost for'}
            </div>
            <div className="flex flex-wrap gap-2">
              {DAY_PRESETS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDays(d as BoostDays)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition active:scale-[0.96] ${
                    selectedDays === d
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500/50'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {d} {t('promote.days') || 'days'}
                  {pricing && (
                    <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold tabular-nums">
                      {pricing[d as BoostDays].toLocaleString()} ⭐
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t('promote.starsNote') || 'Paid with Telegram Stars. Activates Featured search placement + discovery showcase for the chosen period.'}
            </p>
          </div>
        )}
      </div>

      {/* Promoted listing creative editor */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 sm:p-6">
        <PromotedListingEditor />
      </div>

      {/* Acquisition dashboard */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {t('promote.acquisition') || 'Client acquisition'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('promote.acquisitionHelp') ||
            'New clients you acquired via discovery and the embed widget.'}
        </p>

        {/* Top-line cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
                <UsersIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {stats?.totalBookings ?? 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('promote.totalBookings') || 'Total bookings'}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success-100 dark:bg-success-900/30 flex-shrink-0">
                <UserPlusIcon className="w-5 h-5 text-success-600 dark:text-success-400" />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                  {stats?.newClients ?? 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {t('promote.newClients') || 'New clients'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* By-source breakdown table */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200">
            {t('promote.bySource') || 'By source'}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* header row */}
            <div className="grid grid-cols-[2fr_1fr_1fr] px-5 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              <span>{t('promote.source') || 'Source'}</span>
              <span className="text-right">{t('promote.bookings') || 'Bookings'}</span>
              <span className="text-right">{t('promote.newClients') || 'New clients'}</span>
            </div>
            {SOURCE_ORDER.filter((s) => (BOOKING_SOURCES as readonly string[]).includes(s)).map(
              (src) => {
                const meta = SOURCE_META[src];
                const Icon = meta.icon;
                return (
                  <div key={src} className="grid grid-cols-[2fr_1fr_1fr] items-center px-5 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`p-1.5 rounded-lg ${meta.iconBg}`}>
                        <Icon className={`w-4 h-4 ${meta.accent}`} />
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {t(meta.key) || src}
                      </span>
                    </div>
                    <span className="text-right text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                      {stats?.bySource?.[src] ?? 0}
                    </span>
                    <span className="text-right text-sm font-semibold text-success-600 dark:text-success-400 tabular-nums">
                      {stats?.newClientsBySource?.[src] ?? 0}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Promote;
