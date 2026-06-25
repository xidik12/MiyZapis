import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { confirm } from '@/components/ui/Confirm';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  crmService,
  CustomerSegment,
  SegmentCampaign,
  SegmentFilter,
  CrmClient,
  CAMPAIGN_CHANNELS,
  CampaignChannel,
} from '../../services/crm.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon as XMarkIcon,
  ArrowPathIcon,
  UsersIcon,
  EnvelopeIcon,
  FunnelIcon,
  PaperAirplaneIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

// ---- Types ------------------------------------------------------------------

type Tab = 'segments' | 'campaigns';

interface SegmentFormData {
  name: string;
  description: string;
  minSpent: string;
  maxSpent: string;
  lapsedDays: string;
  activeWithinDays: string;
  minBookings: string;
  hasEmail: boolean;
  hasPhone: boolean;
}

const initialSegmentForm: SegmentFormData = {
  name: '',
  description: '',
  minSpent: '',
  maxSpent: '',
  lapsedDays: '',
  activeWithinDays: '',
  minBookings: '',
  hasEmail: false,
  hasPhone: false,
};

interface CampaignFormData {
  name: string;
  channel: CampaignChannel;
  subject: string;
  body: string;
  audienceMode: 'segment' | 'adhoc';
  segmentId: string;
  // ad-hoc filter fields
  minSpent: string;
  maxSpent: string;
  lapsedDays: string;
  activeWithinDays: string;
  minBookings: string;
  hasEmail: boolean;
  hasPhone: boolean;
}

const initialCampaignForm: CampaignFormData = {
  name: '',
  channel: 'email',
  subject: '',
  body: '',
  audienceMode: 'segment',
  segmentId: '',
  minSpent: '',
  maxSpent: '',
  lapsedDays: '',
  activeWithinDays: '',
  minBookings: '',
  hasEmail: false,
  hasPhone: false,
};

// ---- Helpers ----------------------------------------------------------------

const formToFilter = (f: Pick<SegmentFormData, 'minSpent' | 'maxSpent' | 'lapsedDays' | 'activeWithinDays' | 'minBookings' | 'hasEmail' | 'hasPhone'>): SegmentFilter => {
  const filter: SegmentFilter = {};
  if (f.minSpent !== '') filter.minSpent = parseFloat(f.minSpent);
  if (f.maxSpent !== '') filter.maxSpent = parseFloat(f.maxSpent);
  if (f.lapsedDays !== '') filter.lapsedDays = parseInt(f.lapsedDays, 10);
  if (f.activeWithinDays !== '') filter.activeWithinDays = parseInt(f.activeWithinDays, 10);
  if (f.minBookings !== '') filter.minBookings = parseInt(f.minBookings, 10);
  if (f.hasEmail) filter.hasEmail = true;
  if (f.hasPhone) filter.hasPhone = true;
  return filter;
};

const fmtDate = (s?: string | null): string => (s ? new Date(s).toLocaleDateString() : '—');

const campaignStatusBadgeClass = (status: SegmentCampaign['status']): string => {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    case 'sending':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'sent':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    case 'failed':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
  }
};

// ---- Filter form sub-component ----------------------------------------------

interface CampaignsHelpContent {
  overview: string;
  lapsedDays: string;
  activeWithin: string;
  minSpent: string;
  minBookings: string;
}

interface FilterFormProps {
  values: Pick<SegmentFormData, 'minSpent' | 'maxSpent' | 'lapsedDays' | 'activeWithinDays' | 'minBookings' | 'hasEmail' | 'hasPhone'>;
  onChange: (patch: Partial<Pick<SegmentFormData, 'minSpent' | 'maxSpent' | 'lapsedDays' | 'activeWithinDays' | 'minBookings' | 'hasEmail' | 'hasPhone'>>) => void;
  inputClass: string;
  labelClass: string;
  t: (key: string) => string | undefined;
  helpContent: CampaignsHelpContent;
}

const FilterForm: React.FC<FilterFormProps> = ({ values, onChange, inputClass, labelClass, t, helpContent }) => (
  <div className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={`${labelClass} flex items-center gap-1`}>
          {t('crm.minSpent') || 'Min spent'}
          <HelpTip size={15} title={t('crm.minSpent') || 'Min spent'} content={helpContent.minSpent} />
        </label>
        <input
          type="number" step="0.01" min="0"
          value={values.minSpent}
          onChange={(e) => onChange({ minSpent: e.target.value })}
          placeholder={t('crm.optional') || 'Optional'}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>{t('crm.maxSpent') || 'Max spent'}</label>
        <input
          type="number" step="0.01" min="0"
          value={values.maxSpent}
          onChange={(e) => onChange({ maxSpent: e.target.value })}
          placeholder={t('crm.optional') || 'Optional'}
          className={inputClass}
        />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={`${labelClass} flex items-center gap-1`}>
          {t('crm.lapsedDays') || 'Lapsed (days)'}
          <HelpTip size={15} title={t('help.tip.lapsedDays.title') || 'Lapsed days'} content={helpContent.lapsedDays} />
        </label>
        <input
          type="number" step="1" min="0"
          value={values.lapsedDays}
          onChange={(e) => onChange({ lapsedDays: e.target.value })}
          placeholder={t('crm.optional') || 'Optional'}
          className={inputClass}
        />
      </div>
      <div>
        <label className={`${labelClass} flex items-center gap-1`}>
          {t('crm.activeWithinDays') || 'Active within (days)'}
          <HelpTip size={15} title={t('crm.activeWithinDays') || 'Active within (days)'} content={helpContent.activeWithin} />
        </label>
        <input
          type="number" step="1" min="0"
          value={values.activeWithinDays}
          onChange={(e) => onChange({ activeWithinDays: e.target.value })}
          placeholder={t('crm.optional') || 'Optional'}
          className={inputClass}
        />
      </div>
    </div>
    <div>
      <label className={`${labelClass} flex items-center gap-1`}>
        {t('crm.minBookings') || 'Min bookings'}
        <HelpTip size={15} title={t('crm.minBookings') || 'Min bookings'} content={helpContent.minBookings} />
      </label>
      <input
        type="number" step="1" min="0"
        value={values.minBookings}
        onChange={(e) => onChange({ minBookings: e.target.value })}
        placeholder={t('crm.optional') || 'Optional'}
        className={inputClass}
      />
    </div>
    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={values.hasEmail}
          onChange={(e) => onChange({ hasEmail: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary-600"
        />
        {t('crm.hasEmail') || 'Has email'}
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={values.hasPhone}
          onChange={(e) => onChange({ hasPhone: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-primary-600"
        />
        {t('crm.hasPhone') || 'Has phone'}
      </label>
    </div>
  </div>
);

// ---- Preview panel ----------------------------------------------------------

interface PreviewPanelProps {
  filter: SegmentFilter;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ filter }) => {
  const [count, setCount] = useState<number | null>(null);
  const [sample, setSample] = useState<CrmClient[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runPreview = useCallback((f: SegmentFilter) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const result = await crmService.previewSegment(f);
        setCount(result.count);
        setSample(result.sample || []);
      } catch {
        // silent — preview is best-effort
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    runPreview(filter);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [filter, runPreview]);

  return (
    <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 p-4">
      <div className="flex items-center gap-2 mb-2">
        <UsersIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
        {loading ? (
          <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
            {' '}{t('crm.preview.checking') || 'Checking…'}
          </span>
        ) : count !== null ? (
          <span className="text-sm font-medium text-gray-900 dark:text-white tabular-nums">
            <span className="text-primary-600 dark:text-primary-400">{count}</span>
            {' '}{count !== 1 ? (t('crm.preview.matchedPlural') || 'matched clients') : (t('crm.preview.matchedSingular') || 'matched client')}
          </span>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">{t('crm.preview.setFilters') || 'Set filters to preview'}</span>
        )}
      </div>
      {sample.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {sample.slice(0, 5).map((c) => (
            <li key={c.customerId} className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {c.name}
              {c.email && <span className="text-gray-400 dark:text-gray-500 ml-1">· {c.email}</span>}
            </li>
          ))}
          {count !== null && count > 5 && (
            <li className="text-xs text-gray-400 dark:text-gray-500">{t('crm.preview.andMore', { n: count - 5 }) || `…and ${count - 5} more`}</li>
          )}
        </ul>
      )}
    </div>
  );
};

// ---- Main component ---------------------------------------------------------

// ---------------------------------------------------------------------------
// Help content — trilingual
// ---------------------------------------------------------------------------

const CAMPAIGNS_HELP = {
  en: {
    overview:
      'Segments & Campaigns\n\nSegments are saved filters that group your clients by behaviour. Campaigns send a one-time email or Telegram message to a segment (or an ad-hoc filter).\n\n' +
      'Segment filter fields:\n' +
      '• Min spent / Max spent — total lifetime spend in your account currency (₴ by default)\n' +
      '• Lapsed (days) — last visit was MORE than N days ago (e.g. 60 = clients you haven\'t seen in 2 months)\n' +
      '• Active within (days) — last visit was WITHIN the last N days (e.g. 30 = visited in the past month)\n' +
      '• Min bookings — has at least N completed bookings total\n' +
      '• Has email / Has phone — only include clients with that contact on file\n\n' +
      'How a campaign works:\n' +
      '1. Create a segment (or use ad-hoc filters)\n' +
      '2. Create a campaign, pick a channel (email / Telegram / both), write your message\n' +
      '3. Click "Send campaign" — the system matches clients, skips opted-out contacts, and delivers the message\n\n' +
      'Statuses: draft · sending · sent · failed',
    lapsedDays:
      'Lapsed days\n\nIncludes clients whose last visit was MORE than N days ago.\n\nExample: enter 60 to target clients you haven\'t seen in over 2 months.\n\nLeave empty to ignore this filter.',
    activeWithin:
      'Active within (days)\n\nIncludes clients whose last visit was WITHIN the last N days.\n\nExample: enter 30 to target clients who visited in the past month.\n\nLeave empty to ignore this filter.',
    minSpent:
      'Min spent\n\nMinimum lifetime total spend (in ₴ by default).\n\nExample: enter 1000 to target clients who have spent at least ₴1,000 total.',
    minBookings:
      'Min bookings\n\nMinimum number of completed bookings.\n\nExample: enter 3 to target clients with 3 or more visits.',
  },
  uk: {
    overview:
      'Сегменти та кампанії\n\nСегменти — збережені фільтри, що групують клієнтів за поведінкою. Кампанії надсилають одноразовий email або Telegram-повідомлення сегменту (або довільному фільтру).\n\n' +
      'Поля фільтра:\n' +
      '• Мін. витрати / Макс. витрати — загальні витрати за весь час у валюті акаунту (₴ за замовчуванням)\n' +
      '• Неактивних (днів) — останній візит був БІЛЬШЕ ніж N днів тому (напр., 60 = клієнти, яких не було 2 місяці)\n' +
      '• Активні за (днів) — останній візит був ПРОТЯГОМ останніх N днів (напр., 30 = відвідали за минулий місяць)\n' +
      '• Мін. записів — щонайменше N завершених бронювань загалом\n' +
      '• Є email / Є телефон — тільки клієнти з відповідним контактом\n\n' +
      'Як працює кампанія:\n' +
      '1. Створіть сегмент (або використайте довільний фільтр)\n' +
      '2. Створіть кампанію, оберіть канал (email / Telegram / обидва), напишіть повідомлення\n' +
      '3. Натисніть "Надіслати кампанію" — система підбере клієнтів, пропустить тих, хто відмовився від розсилки, і доставить повідомлення\n\n' +
      'Статуси: чернетка · надсилається · надіслано · помилка',
    lapsedDays:
      'Неактивних (днів)\n\nВключає клієнтів, останній візит яких був БІЛЬШЕ ніж N днів тому.\n\nПриклад: введіть 60, щоб охопити клієнтів, яких не було понад 2 місяці.\n\nЗалиште порожнім, щоб не враховувати цей фільтр.',
    activeWithin:
      'Активні за (днів)\n\nВключає клієнтів, останній візит яких був ПРОТЯГОМ останніх N днів.\n\nПриклад: введіть 30, щоб охопити клієнтів, які відвідали вас за минулий місяць.\n\nЗалиште порожнім, щоб не враховувати цей фільтр.',
    minSpent:
      'Мін. витрати\n\nМінімальна загальна сума витрат за весь час (у ₴ за замовчуванням).\n\nПриклад: введіть 1000, щоб охопити клієнтів, які витратили щонайменше ₴1 000.',
    minBookings:
      'Мін. записів\n\nМінімальна кількість завершених бронювань.\n\nПриклад: введіть 3, щоб охопити клієнтів з 3 і більше візитами.',
  },
  ru: {
    overview:
      'Сегменты и кампании\n\nСегменты — сохранённые фильтры, группирующие клиентов по поведению. Кампании отправляют одноразовое email или Telegram-сообщение сегменту (или произвольному фильтру).\n\n' +
      'Поля фильтра:\n' +
      '• Мин. расходы / Макс. расходы — общие расходы за всё время в валюте аккаунта (₴ по умолчанию)\n' +
      '• Неактивных (дней) — последний визит был БОЛЕЕ чем N дней назад (напр., 60 = клиенты, которых не было 2 месяца)\n' +
      '• Активны за (дней) — последний визит был В ТЕЧЕНИЕ последних N дней (напр., 30 = посещали за прошлый месяц)\n' +
      '• Мин. записей — не менее N завершённых бронирований всего\n' +
      '• Есть email / Есть телефон — только клиенты с соответствующим контактом\n\n' +
      'Как работает кампания:\n' +
      '1. Создайте сегмент (или используйте произвольный фильтр)\n' +
      '2. Создайте кампанию, выберите канал (email / Telegram / оба), напишите сообщение\n' +
      '3. Нажмите "Отправить кампанию" — система подберёт клиентов, пропустит отказавшихся от рассылки и доставит сообщение\n\n' +
      'Статусы: черновик · отправляется · отправлено · ошибка',
    lapsedDays:
      'Неактивных (дней)\n\nВключает клиентов, последний визит которых был БОЛЕЕ чем N дней назад.\n\nПример: введите 60, чтобы охватить клиентов, которых не было более 2 месяцев.\n\nОставьте пустым, чтобы не учитывать этот фильтр.',
    activeWithin:
      'Активны за (дней)\n\nВключает клиентов, последний визит которых был В ТЕЧЕНИЕ последних N дней.\n\nПример: введите 30, чтобы охватить клиентов, посещавших вас за прошлый месяц.\n\nОставьте пустым, чтобы не учитывать этот фильтр.',
    minSpent:
      'Мин. расходы\n\nМинимальная общая сумма расходов за всё время (в ₴ по умолчанию).\n\nПример: введите 1000, чтобы охватить клиентов, потративших не менее ₴1 000.',
    minBookings:
      'Мин. записей\n\nМинимальное количество завершённых бронирований.\n\nПример: введите 3, чтобы охватить клиентов с 3 и более визитами.',
  },
};

const CrmCampaigns: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (CAMPAIGNS_HELP as Record<string, CampaignsHelpContent>)[language] || CAMPAIGNS_HELP.en;

  const [tab, setTab] = useState<Tab>('segments');
  const [loading, setLoading] = useState(true);

  // Segments
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [segmentForm, setSegmentForm] = useState<SegmentFormData>(initialSegmentForm);

  // Campaigns
  const [campaigns, setCampaigns] = useState<SegmentCampaign[]>([]);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState<CampaignFormData>(initialCampaignForm);

  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [segs, camps] = await Promise.all([
        crmService.listSegments().catch(() => [] as CustomerSegment[]),
        crmService.listCampaigns().catch(() => [] as SegmentCampaign[]),
      ]);
      setSegments(segs || []);
      setCampaigns(camps || []);
    } catch (error: unknown) {
      console.error('CrmCampaigns load error:', error);
      toast.error(t('crm.loadError') || 'Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  // ---- Segment actions -------------------------------------------------------

  const openNewSegment = () => {
    setEditingSegment(null);
    setSegmentForm(initialSegmentForm);
    setIsSegmentModalOpen(true);
  };

  const openEditSegment = (seg: CustomerSegment) => {
    setEditingSegment(seg);
    const f = seg.filter || {};
    setSegmentForm({
      name: seg.name,
      description: seg.description || '',
      minSpent: f.minSpent != null ? String(f.minSpent) : '',
      maxSpent: f.maxSpent != null ? String(f.maxSpent) : '',
      lapsedDays: f.lapsedDays != null ? String(f.lapsedDays) : '',
      activeWithinDays: f.activeWithinDays != null ? String(f.activeWithinDays) : '',
      minBookings: f.minBookings != null ? String(f.minBookings) : '',
      hasEmail: f.hasEmail === true,
      hasPhone: f.hasPhone === true,
    });
    setIsSegmentModalOpen(true);
  };

  const handleSubmitSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segmentForm.name.trim()) {
      toast.error(t('crm.nameRequired') || 'Name is required');
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        name: segmentForm.name.trim(),
        description: segmentForm.description.trim() || undefined,
        filter: formToFilter(segmentForm),
      };
      if (editingSegment) {
        await crmService.updateSegment(editingSegment.id, payload);
        toast.success(t('crm.segmentUpdated') || 'Segment updated');
      } else {
        await crmService.createSegment(payload);
        toast.success(t('crm.segmentCreated') || 'Segment created');
      }
      setIsSegmentModalOpen(false);
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('crm.saveError') || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSegment = async (id: string) => {
    if (!await confirm(t('crm.confirmDeleteSegment') || 'Delete this segment?')) return;
    try {
      setActing(id);
      await crmService.deleteSegment(id);
      toast.success(t('crm.segmentDeleted') || 'Segment deleted');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('crm.deleteError') || 'Failed to delete');
    } finally {
      setActing(null);
    }
  };

  // ---- Campaign actions ------------------------------------------------------

  const openNewCampaign = () => {
    setCampaignForm(initialCampaignForm);
    setIsCampaignModalOpen(true);
  };

  const handleSubmitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.name.trim()) {
      toast.error(t('crm.nameRequired') || 'Name is required');
      return;
    }
    if (!campaignForm.body.trim()) {
      toast.error(t('crm.bodyRequired') || 'Message body is required');
      return;
    }
    if (campaignForm.audienceMode === 'segment' && !campaignForm.segmentId) {
      toast.error(t('crm.selectSegment') || 'Please select a segment');
      return;
    }
    const adHocFilter = campaignForm.audienceMode === 'adhoc' ? formToFilter(campaignForm) : undefined;
    let previewCount: number | null = null;
    if (adHocFilter) {
      try {
        const prev = await crmService.previewSegment(adHocFilter);
        previewCount = prev.count;
      } catch {
        // proceed without count
      }
    } else {
      const seg = segments.find((s) => s.id === campaignForm.segmentId);
      previewCount = seg?.count ?? null;
    }
    const countStr = previewCount !== null ? ` to ${previewCount} client${previewCount !== 1 ? 's' : ''}` : '';
    if (!await confirm((t('crm.confirmSend') || `Send campaign${countStr}? Opted-out clients will be skipped automatically.`) + (previewCount !== null ? ` (${previewCount} recipient${previewCount !== 1 ? 's' : ''})` : ''))) {
      return;
    }
    try {
      setSubmitting(true);
      const draft = await crmService.createCampaign({
        name: campaignForm.name.trim(),
        channel: campaignForm.channel,
        subject: campaignForm.subject.trim() || undefined,
        body: campaignForm.body.trim(),
        segmentId: campaignForm.audienceMode === 'segment' ? campaignForm.segmentId : undefined,
        filter: adHocFilter,
      });
      await crmService.sendCampaign(draft.id);
      toast.success(t('crm.campaignSent') || 'Campaign sent');
      setIsCampaignModalOpen(false);
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('crm.saveError') || 'Failed to send campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!await confirm(t('crm.confirmDeleteCampaign') || 'Delete this campaign?')) return;
    try {
      setActing(id);
      await crmService.deleteCampaign(id);
      toast.success(t('crm.campaignDeleted') || 'Campaign deleted');
      loadAll();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('crm.deleteError') || 'Failed to delete');
    } finally {
      setActing(null);
    }
  };

  // ---- Derived preview filters -----------------------------------------------

  const segmentPreviewFilter = formToFilter(segmentForm);
  const campaignPreviewFilter: SegmentFilter = campaignForm.audienceMode === 'adhoc'
    ? formToFilter(campaignForm)
    : (segments.find((s) => s.id === campaignForm.segmentId)?.filter ?? {});

  // ---- Constants -------------------------------------------------------------

  if (loading) {
    return <PageLoader text={t('crm.loading') || 'Loading...'} />;
  }

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'segments', label: t('crm.segments') || 'Segments' },
    { key: 'campaigns', label: t('crm.campaigns') || 'Campaigns' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t('crm.segmentsAndCampaigns') || 'Segments & Campaigns'}
              </h1>
              <HelpTip title={t('help.segments.title') || 'Segments & Campaigns'} content={h.overview} />
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('crm.segmentsAndCampaignsSubtitle') || 'Build audiences and send targeted email campaigns'}
            </p>
          </div>
          {tab === 'segments' ? (
            <button
              onClick={openNewSegment}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96] w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5" />
              {t('crm.newSegment') || 'New segment'}
            </button>
          ) : (
            <button
              onClick={openNewCampaign}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96] w-full sm:w-auto"
            >
              <PlusIcon className="h-5 w-5" />
              {t('crm.newCampaign') || 'New campaign'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-x-1 gap-y-0 mb-6 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tb) => {
            const active = tab === tb.key;
            return (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition active:scale-[0.96] ${
                  active
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tb.key === 'segments' ? <FunnelIcon className="h-5 w-5" /> : <EnvelopeIcon className="h-5 w-5" />}
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* ======================== SEGMENTS ======================== */}
        {tab === 'segments' && (
          <div className="space-y-4">
            {segments.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <FunnelIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('crm.noSegments') || 'No saved segments yet'}
                </p>
                <button
                  onClick={openNewSegment}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96]"
                >
                  <PlusIcon className="h-5 w-5" />
                  {t('crm.createFirstSegment') || 'Create your first segment'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {segments.map((seg) => (
                  <div
                    key={seg.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5"
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 dark:text-white break-words">{seg.name}</p>
                        {seg.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">{seg.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => openEditSegment(seg)}
                          aria-label={t('common.edit') || 'Edit'}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition active:scale-[0.96]"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSegment(seg.id)}
                          disabled={acting === seg.id}
                          aria-label={t('common.delete') || 'Delete'}
                          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50"
                        >
                          {acting === seg.id ? (
                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <UsersIcon className="h-4 w-4 text-primary-500 dark:text-primary-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400 tabular-nums">
                        {seg.count != null ? seg.count : '—'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('crm.clients') || 'clients'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      {t('crm.updated') || 'Updated'} {fmtDate(seg.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================== CAMPAIGNS ======================== */}
        {tab === 'campaigns' && (
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-10 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <EnvelopeIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('crm.noCampaigns') || 'No campaigns yet'}
                </p>
                <button
                  onClick={openNewCampaign}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition active:scale-[0.96]"
                >
                  <PlusIcon className="h-5 w-5" />
                  {t('crm.createFirstCampaign') || 'Create your first campaign'}
                </button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <th className="px-6 py-3 font-medium">{t('crm.campaignName') || 'Campaign'}</th>
                        <th className="px-6 py-3 font-medium">{t('crm.status') || 'Status'}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('crm.recipients') || 'Recipients'}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('crm.sent') || 'Sent'}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('crm.opens') || 'Opens'}</th>
                        <th className="px-6 py-3 font-medium text-right">{t('crm.clicks') || 'Clicks'}</th>
                        <th className="px-6 py-3 font-medium">{t('crm.sentAt') || 'Sent at'}</th>
                        <th className="px-6 py-3 font-medium text-right">
                          <span className="sr-only">{t('common.actions') || 'Actions'}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {campaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{c.name}</p>
                            {c.subject && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{c.subject}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${campaignStatusBadgeClass(c.status)}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap text-gray-900 dark:text-white tabular-nums">
                            {c.recipientCount}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap text-gray-600 dark:text-gray-300 tabular-nums">
                            {c.sentCount}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap tabular-nums">
                            {c.status === 'sent' ? (
                              <span title={`${c.openCount} opens`} className="text-emerald-600 dark:text-emerald-400 font-medium">
                                {c.openRate}%
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap tabular-nums">
                            {c.status === 'sent' ? (
                              <span title={`${c.clickCount} clicks`} className="text-blue-600 dark:text-blue-400 font-medium">
                                {c.clickRate}%
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                            {fmtDate(c.sentAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {(c.status === 'draft' || c.status === 'failed') && (
                              <button
                                onClick={() => handleDeleteCampaign(c.id)}
                                disabled={acting === c.id}
                                aria-label={t('common.delete') || 'Delete'}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50"
                              >
                                {acting === c.id ? (
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <TrashIcon className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3">
                  {campaigns.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
                    >
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white break-words">{c.name}</p>
                          {c.subject && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 break-words mt-0.5">{c.subject}</p>
                          )}
                        </div>
                        <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${campaignStatusBadgeClass(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('crm.recipients') || 'Recipients'}</dt>
                          <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{c.recipientCount}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('crm.sent') || 'Sent'}</dt>
                          <dd className="min-w-0 text-right text-gray-900 dark:text-white tabular-nums">{c.sentCount}</dd>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('crm.sentAt') || 'Sent at'}</dt>
                          <dd className="min-w-0 text-right text-gray-900 dark:text-white">{fmtDate(c.sentAt)}</dd>
                        </div>
                        {c.status === 'sent' && (
                          <div className="flex items-center justify-end gap-3 pt-1">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 tabular-nums font-medium">
                              {t('crm.opens') || 'Opens'} {c.openRate}%
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">·</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400 tabular-nums font-medium">
                              {t('crm.clicks') || 'Clicks'} {c.clickRate}%
                            </span>
                          </div>
                        )}
                      </dl>
                      {(c.status === 'draft' || c.status === 'failed') && (
                        <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                          <button
                            onClick={() => handleDeleteCampaign(c.id)}
                            disabled={acting === c.id}
                            aria-label={t('common.delete') || 'Delete'}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50"
                          >
                            {acting === c.id ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <TrashIcon className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ======================== SEGMENT MODAL ======================== */}
        {isSegmentModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingSegment
                    ? (t('crm.editSegment') || 'Edit segment')
                    : (t('crm.newSegment') || 'New segment')}
                </h2>
                <button
                  onClick={() => setIsSegmentModalOpen(false)}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmitSegment} className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>{t('crm.segmentName') || 'Segment name'} *</label>
                  <input
                    type="text"
                    value={segmentForm.name}
                    onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                    placeholder={t('crm.segmentNamePlaceholder') || 'e.g., Lapsed VIP clients'}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('crm.description') || 'Description'}</label>
                  <input
                    type="text"
                    value={segmentForm.description}
                    onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                    placeholder={t('crm.optional') || 'Optional'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('crm.filterRules') || 'Filter rules'}{' '}
                    <span className="font-normal text-gray-500 dark:text-gray-400">(all optional)</span>
                  </p>
                  <FilterForm
                    values={segmentForm}
                    onChange={(patch) => setSegmentForm((prev) => ({ ...prev, ...patch }))}
                    inputClass={inputClass}
                    labelClass={labelClass}
                    t={t}
                    helpContent={h}
                  />
                </div>

                {/* Live preview */}
                <PreviewPanel filter={segmentPreviewFilter} />

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSegmentModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-[0.96]"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingSegment ? (t('common.save') || 'Save') : (t('crm.createSegment') || 'Create segment')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* ======================== CAMPAIGN MODAL ======================== */}
        {isCampaignModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', duration: 0.3, bounce: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('crm.newCampaign') || 'New campaign'}
                </h2>
                <button
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition active:scale-[0.96]"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSubmitCampaign} className="p-6 space-y-4">
                <div>
                  <label className={labelClass}>{t('crm.campaignName') || 'Campaign name'} *</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder={t('crm.campaignNamePlaceholder') || 'e.g., Summer reactivation'}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('crm.channel') || 'Channel'}</label>
                  <div className="flex flex-wrap gap-2">
                    {CAMPAIGN_CHANNELS.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setCampaignForm({ ...campaignForm, channel: ch })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition active:scale-[0.96] cursor-pointer ${
                          campaignForm.channel === ch
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {t(`crm.channel.${ch}`) || (ch === 'email' ? 'Email' : ch === 'telegram' ? 'Telegram' : 'Both')}
                      </button>
                    ))}
                  </div>
                  {(campaignForm.channel === 'telegram' || campaignForm.channel === 'both') && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {t('crm.channelTelegramNote') || 'Telegram messages reach only clients who have connected Telegram.'}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>{t('crm.emailSubject') || 'Subject / title'}</label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    placeholder={t('crm.optional') || 'Optional'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t('crm.body') || 'Message body'} *</label>
                  <textarea
                    value={campaignForm.body}
                    rows={5}
                    onChange={(e) => setCampaignForm({ ...campaignForm, body: e.target.value })}
                    placeholder={t('crm.bodyPlaceholder') || 'Write your message here…'}
                    className={`${inputClass} resize-none`}
                    required
                  />
                </div>

                {/* Audience picker */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t('crm.audience') || 'Audience'}
                  </p>
                  <div className="flex gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setCampaignForm({ ...campaignForm, audienceMode: 'segment' })}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition active:scale-[0.96] ${
                        campaignForm.audienceMode === 'segment'
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300 font-medium'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {t('crm.savedSegment') || 'Saved segment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignForm({ ...campaignForm, audienceMode: 'adhoc' })}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg border transition active:scale-[0.96] ${
                        campaignForm.audienceMode === 'adhoc'
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-500 text-primary-700 dark:text-primary-300 font-medium'
                          : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400'
                      }`}
                    >
                      {t('crm.adHocFilter') || 'Ad-hoc filter'}
                    </button>
                  </div>

                  {campaignForm.audienceMode === 'segment' ? (
                    <div>
                      <label className={labelClass}>{t('crm.selectSegment') || 'Select segment'} *</label>
                      <select
                        value={campaignForm.segmentId}
                        onChange={(e) => setCampaignForm({ ...campaignForm, segmentId: e.target.value })}
                        className={inputClass}
                        required
                      >
                        <option value="">{t('crm.chooseSegment') || '— Choose segment —'}</option>
                        {segments.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}{s.count != null ? ` (${s.count})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <FilterForm
                      values={campaignForm}
                      onChange={(patch) => setCampaignForm((prev) => ({ ...prev, ...patch }))}
                      inputClass={inputClass}
                      labelClass={labelClass}
                      t={t}
                      helpContent={h}
                    />
                  )}
                </div>

                {/* Live preview */}
                <PreviewPanel filter={campaignPreviewFilter} />

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('crm.optOutNote') || 'Opted-out clients are skipped automatically. Channel: email only.'}
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCampaignModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition active:scale-[0.96]"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition active:scale-[0.96] disabled:active:scale-100 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="h-4 w-4" />
                    )}
                    {t('crm.sendCampaign') || 'Send campaign'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CrmCampaigns;
