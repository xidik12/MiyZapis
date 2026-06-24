import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  marketingService,
  MarketingAutomation,
  MarketingType,
  MarketingChannel,
  MARKETING_CHANNELS,
  MarketingStats,
} from '../../services/marketing.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  SparklesIcon,
  ArrowPathIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  GiftIcon as CakeIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

// ---------------------------------------------------------------------------
// Help content — trilingual
// ---------------------------------------------------------------------------

const MARKETING_HELP = {
  en: {
    overview:
      'Marketing\n\nAutomated messages sent to your clients on your behalf — no manual work needed once set up.\n\n' +
      'Three automation types:\n' +
      '• Win-back — sends a message to clients who haven\'t visited in N days (default 60). Reminds lapsed clients you exist.\n' +
      '• Rebooking — sends a reminder to clients N days after their last visit (default 30) suggesting they book again.\n' +
      '• Birthday — sends a birthday greeting on the client\'s birthday (requires birthday data on file).\n\n' +
      'Per-card controls:\n' +
      '• Toggle on/off — enables or disables that automation\n' +
      '• Lapsed days / Rebook days — the number of days that triggers the message\n' +
      '• Channel — Telegram, Email, or Both\n' +
      '• Message template — your custom message text; leave blank for the default\n\n' +
      '"Run now" button — immediately processes all enabled automations and sends messages to any clients who currently qualify. Useful to backfill after first setup.\n\n' +
      'Last run — timestamp of the last time that automation was processed.',
  },
  uk: {
    overview:
      'Маркетинг\n\nАвтоматичні повідомлення, що надсилаються клієнтам від вашого імені — після налаштування ніяких ручних дій не потрібно.\n\n' +
      'Три типи автоматизації:\n' +
      '• Повернення — надсилає повідомлення клієнтам, які не відвідували вас N днів (за замовчуванням 60). Нагадує неактивним клієнтам про вас.\n' +
      '• Повторний запис — надсилає нагадування клієнту через N днів після останнього візиту (за замовчуванням 30) з пропозицією записатися знову.\n' +
      '• День народження — надсилає привітання у день народження клієнта (потрібна дата народження в профілі).\n\n' +
      'Елементи керування на картці:\n' +
      '• Перемикач вкл/вимк — вмикає або вимикає автоматизацію\n' +
      '• Днів неактивності / Днів до повторного запису — кількість днів, після якої надсилається повідомлення\n' +
      '• Канал — Telegram, Email або обидва\n' +
      '• Шаблон повідомлення — ваш текст; залиште порожнім для стандартного\n\n' +
      'Кнопка "Запустити зараз" — негайно обробляє всі увімкнені автоматизації та надсилає повідомлення клієнтам, які наразі відповідають умовам. Корисно після першого налаштування.\n\n' +
      'Остання обробка — час останнього запуску цієї автоматизації.',
  },
  ru: {
    overview:
      'Маркетинг\n\nАвтоматические сообщения, отправляемые клиентам от вашего имени — после настройки никаких ручных действий не нужно.\n\n' +
      'Три типа автоматизации:\n' +
      '• Возврат — отправляет сообщение клиентам, не посещавшим вас N дней (по умолчанию 60). Напоминает неактивным клиентам о вас.\n' +
      '• Повторная запись — отправляет напоминание клиенту через N дней после последнего визита (по умолчанию 30) с предложением записаться снова.\n' +
      '• День рождения — отправляет поздравление в день рождения клиента (требуется дата рождения в профиле).\n\n' +
      'Элементы управления на карточке:\n' +
      '• Переключатель вкл/выкл — включает или отключает автоматизацию\n' +
      '• Дней неактивности / Дней до повторной записи — количество дней, после которого отправляется сообщение\n' +
      '• Канал — Telegram, Email или оба\n' +
      '• Шаблон сообщения — ваш текст; оставьте пустым для стандартного\n\n' +
      'Кнопка "Запустить сейчас" — немедленно обрабатывает все включённые автоматизации и отправляет сообщения клиентам, которые сейчас соответствуют условиям. Полезно после первоначальной настройки.\n\n' +
      'Последняя обработка — время последнего запуска этой автоматизации.',
  },
};

// Per-type accent + icon for the card header.
const TYPE_META: Record<
  MarketingType,
  { icon: React.ComponentType<{ className?: string }>; accent: string; iconBg: string }
> = {
  WINBACK: {
    icon: SparklesIcon,
    accent: 'text-primary-600 dark:text-primary-400',
    iconBg: 'bg-primary-100 dark:bg-primary-900/30',
  },
  REBOOKING: {
    icon: ArrowPathIcon,
    accent: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  BIRTHDAY: {
    icon: CakeIcon,
    accent: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
  },
};

const ORDER: MarketingType[] = ['WINBACK', 'REBOOKING', 'BIRTHDAY'];

const clampDays = (raw: string): number => {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.min(3650, Math.max(1, n));
};

// Small accessible toggle switch.
const Toggle: React.FC<{
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  label: string;
}> = ({ checked, disabled, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 active:scale-[0.96] disabled:active:scale-100 ${
      disabled
        ? 'cursor-not-allowed bg-gray-200 dark:bg-gray-700'
        : checked
        ? 'bg-primary-500'
        : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-0.5'
      }`}
    />
  </button>
);

const Marketing: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (MARKETING_HELP as Record<string, typeof MARKETING_HELP.en>)[language] || MARKETING_HELP.en;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<MarketingType | null>(null);
  const [running, setRunning] = useState(false);
  const [birthdaySupported, setBirthdaySupported] = useState(false);
  const [automations, setAutomations] = useState<Record<MarketingType, MarketingAutomation | null>>({
    WINBACK: null,
    REBOOKING: null,
    BIRTHDAY: null,
  });
  const [stats, setStats] = useState<MarketingStats | null>(null);

  // Local editable copies of the message templates (so typing isn't debounced
  // through the server on every keystroke).
  const [templates, setTemplates] = useState<Record<MarketingType, string>>({
    WINBACK: '',
    REBOOKING: '',
    BIRTHDAY: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [config, statsData] = await Promise.all([
        marketingService.getConfig(),
        marketingService.getStats().catch(() => null),
      ]);
      const map: Record<MarketingType, MarketingAutomation | null> = {
        WINBACK: null,
        REBOOKING: null,
        BIRTHDAY: null,
      };
      const tmpl: Record<MarketingType, string> = { WINBACK: '', REBOOKING: '', BIRTHDAY: '' };
      for (const a of config.automations) {
        map[a.type] = a;
        tmpl[a.type] = a.messageTemplate || '';
      }
      setAutomations(map);
      setTemplates(tmpl);
      setBirthdaySupported(config.birthdaySupported);
      if (statsData) setStats(statsData);
    } catch (e) {
      toast.error(t('marketing.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (
    type: MarketingType,
    body: Partial<{
      isEnabled: boolean;
      lapsedDays: number;
      rebookDays: number;
      channel: MarketingChannel;
      messageTemplate: string | null;
    }>
  ) => {
    setSaving(type);
    try {
      const updated = await marketingService.setConfig(type, body);
      setAutomations((prev) => ({ ...prev, [type]: updated }));
      toast.success(t('marketing.saved'));
    } catch (e) {
      toast.error(t('marketing.saveError'));
    } finally {
      setSaving(null);
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const summary = await marketingService.runNow();
      toast.success(t('marketing.runDone').replace('{count}', String(summary.totalSent)));
      // Refresh stats after a run.
      const statsData = await marketingService.getStats().catch(() => null);
      if (statsData) setStats(statsData);
    } catch (e) {
      toast.error(t('marketing.runError'));
    } finally {
      setRunning(false);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return t('marketing.never');
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return t('marketing.never');
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2 break-words">
                <SparklesIcon className="h-7 w-7 text-primary-500 flex-shrink-0" />
                {t('marketing.title')}
              </h1>
              <HelpTip title={t('help.marketing.title') || 'Marketing'} content={h.overview} />
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{t('marketing.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={runNow}
            disabled={running}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.96] disabled:active:scale-100"
          >
            <ArrowPathIcon className={`h-5 w-5 ${running ? 'animate-spin' : ''}`} />
            {running ? t('marketing.running') : t('marketing.runNow')}
          </button>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
              {t('marketing.stats.title')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ORDER.map((type) => {
                const Meta = TYPE_META[type];
                const Icon = Meta.icon;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${Meta.iconBg}`}>
                      <Icon className={`h-5 w-5 ${Meta.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {stats.last30Days?.[type] ?? 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                        {t(`marketing.${type.toLowerCase()}.title`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Automation cards */}
        <div className="space-y-5">
          {ORDER.map((type) => {
            const automation = automations[type];
            const Meta = TYPE_META[type];
            const Icon = Meta.icon;
            const isBirthday = type === 'BIRTHDAY';
            const cardDisabled = isBirthday && !birthdaySupported;
            const enabled = !!automation?.isEnabled && !cardDisabled;
            const channel = (automation?.channel as MarketingChannel) || 'BOTH';

            return (
              <div
                key={type}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6 transition-all ${
                  cardDisabled ? 'opacity-70' : 'hover-lift'
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-3 rounded-xl flex-shrink-0 ${Meta.iconBg}`}>
                      <Icon className={`h-6 w-6 ${Meta.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t(`marketing.${type.toLowerCase()}.title`)}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {t(`marketing.${type.toLowerCase()}.desc`)}
                      </p>
                    </div>
                  </div>
                  {!cardDisabled && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                        {enabled ? t('marketing.enabled') : t('marketing.disabled')}
                      </span>
                      <Toggle
                        checked={enabled}
                        disabled={saving === type}
                        onChange={(next) => patch(type, { isEnabled: next })}
                        label={t('marketing.enable')}
                      />
                    </div>
                  )}
                </div>

                {cardDisabled ? (
                  <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-dashed border-gray-300 dark:border-gray-600 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('marketing.birthday.comingSoon')}
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {/* Day setting + channel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {type === 'WINBACK' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('marketing.winback.lapsedDays')}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={3650}
                            defaultValue={automation?.lapsedDays ?? 60}
                            onBlur={(e) => {
                              const v = clampDays(e.target.value);
                              if (v !== automation?.lapsedDays) patch(type, { lapsedDays: v });
                            }}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('marketing.winback.lapsedHint')}
                          </p>
                        </div>
                      )}
                      {type === 'REBOOKING' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('marketing.rebooking.rebookDays')}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={3650}
                            defaultValue={automation?.rebookDays ?? 30}
                            onBlur={(e) => {
                              const v = clampDays(e.target.value);
                              if (v !== automation?.rebookDays) patch(type, { rebookDays: v });
                            }}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {t('marketing.rebooking.rebookHint')}
                          </p>
                        </div>
                      )}

                      {/* Channel selector */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('marketing.channel')}
                        </label>
                        <div className="flex gap-2">
                          {MARKETING_CHANNELS.map((ch) => {
                            const active = channel === ch;
                            return (
                              <button
                                key={ch}
                                type="button"
                                onClick={() => !active && patch(type, { channel: ch })}
                                className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium border transition active:scale-[0.96] ${
                                  active
                                    ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300'
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-400'
                                }`}
                              >
                                {ch === 'TELEGRAM' && <ChatBubbleLeftRightIcon className="h-4 w-4 flex-shrink-0" />}
                                {ch === 'EMAIL' && <EnvelopeIcon className="h-4 w-4 flex-shrink-0" />}
                                {ch === 'BOTH' && <SparklesIcon className="h-4 w-4 flex-shrink-0" />}
                                <span className="truncate">{t(`marketing.channel.${ch}`)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Message template */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('marketing.messageTemplate')}
                      </label>
                      <textarea
                        rows={3}
                        value={templates[type]}
                        placeholder={t('marketing.templatePlaceholder')}
                        onChange={(e) =>
                          setTemplates((prev) => ({ ...prev, [type]: e.target.value }))
                        }
                        onBlur={() => {
                          const next = templates[type].trim();
                          const current = (automation?.messageTemplate || '').trim();
                          if (next !== current) {
                            patch(type, { messageTemplate: next.length > 0 ? next : null });
                          }
                        }}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t('marketing.templateHint')}
                      </p>
                    </div>

                    {/* Footer: last run */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 pt-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {t('marketing.lastRun')}: {formatDate(automation?.lastRunAt)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Marketing;
