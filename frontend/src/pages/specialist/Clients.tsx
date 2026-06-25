import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { specialistService } from '@/services/specialist.service';
import {
  crmService,
  CrmClient,
  CustomerTag,
  MarketingConsent,
  TAG_COLORS,
  TagColor,
} from '@/services/crm.service';
import { toast } from 'react-toastify';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  XIcon,
  ArrowPathIcon,
  UserIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BellIcon,
  FunnelIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

// ---------------------------------------------------------------------------
// Tag colour mapping
// ---------------------------------------------------------------------------

const TAG_COLOR_CLASSES: Record<TagColor, { pill: string; swatch: string }> = {
  primary: {
    pill: 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300',
    swatch: 'bg-primary-500',
  },
  success: {
    pill: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    swatch: 'bg-green-500',
  },
  warning: {
    pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    swatch: 'bg-amber-500',
  },
  danger: {
    pill: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    swatch: 'bg-red-500',
  },
  gray: {
    pill: 'bg-gray-100 text-gray-700 dark:bg-gray-600/30 dark:text-gray-300',
    swatch: 'bg-gray-500',
  },
  info: {
    pill: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    swatch: 'bg-sky-500',
  },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = 'name' | 'bookingsCount' | 'lastVisitDate' | 'totalSpent';
type SortOrder = 'asc' | 'desc';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  return `${(parts[0] || '').charAt(0)}${(parts[1] || '').charAt(0)}`.toUpperCase() || '?';
};

// ---------------------------------------------------------------------------
// TagIcon shim — the icons index doesn't export TagIcon; use a simple SVG
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TagIconFallback: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={className}>
    <path d="M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Skeleton loader card */
const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      </div>
    </div>
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  </div>
);

/** Stats bar */
const StatsBar: React.FC<{
  totalClients: number;
  activeClients: number;
  averageBookings: number;
  repeatRate: number;
}> = ({ totalClients, activeClients, averageBookings, repeatRate }) => {
  const { t } = useLanguage();

  const stats = [
    {
      label: t('clients.stats.total') || 'Total Clients',
      value: totalClients,
      icon: UserGroupIcon,
      color: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/30',
    },
    {
      label: t('clients.stats.active') || 'Active Clients',
      value: activeClients,
      icon: UserIcon,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/30',
    },
    {
      label: t('clients.stats.avgBookings') || 'Avg. Bookings',
      value: averageBookings.toFixed(1),
      icon: CalendarIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/30',
    },
    {
      label: t('clients.stats.repeatRate') || 'Repeat Rate',
      value: `${repeatRate}%`,
      icon: ArrowPathIcon,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${stat.bg} rounded-2xl p-4 border border-gray-200 dark:border-gray-800`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tag Chips (reusable)
// ---------------------------------------------------------------------------

const TagPills: React.FC<{ tags: CustomerTag[] }> = ({ tags }) => {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${
            TAG_COLOR_CLASSES[tag.color]?.pill || TAG_COLOR_CLASSES.gray.pill
          }`}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Consent panel (inside expanded area)
// ---------------------------------------------------------------------------

const ConsentPanel: React.FC<{
  customerId: string;
  onClose?: () => void;
}> = ({ customerId }) => {
  const { t } = useLanguage();
  const [consent, setConsent] = useState<MarketingConsent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    crmService
      .getConsent(customerId)
      .then((c) => { if (!cancelled) setConsent(c); })
      .catch(() => {
        if (!cancelled)
          setConsent({ email: false, sms: false, push: false, optOutAll: false });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [customerId]);

  const handleToggle = async (field: keyof MarketingConsent, value: boolean) => {
    if (!consent || saving) return;
    const updated = { ...consent, [field]: value };
    // If opting out all, set everything to false
    if (field === 'optOutAll' && value) {
      updated.email = false;
      updated.sms = false;
      updated.push = false;
    }
    // If enabling any channel while optOutAll is true, clear optOutAll
    if (field !== 'optOutAll' && value && consent.optOutAll) {
      updated.optOutAll = false;
    }
    setConsent(updated);
    setSaving(true);
    try {
      const result = await crmService.setConsent(customerId, updated);
      setConsent(result);
    } catch {
      toast.error(t('crm.consentSaveFailed') || 'Failed to save consent');
      setConsent(consent); // revert
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2 mt-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />)}
      </div>
    );
  }

  if (!consent) return null;

  const consentRows: { field: keyof MarketingConsent; label: string; icon: React.FC<{ className?: string }> }[] = [
    { field: 'email', label: t('crm.consent.email') || 'Email marketing', icon: EnvelopeIcon },
    { field: 'sms', label: t('crm.consent.sms') || 'SMS marketing', icon: PhoneIcon },
    { field: 'push', label: t('crm.consent.push') || 'Push notifications', icon: BellIcon },
  ];

  return (
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('crm.consent.title') || 'Marketing Consent'}
        </h4>
        {consent.optOutAll && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
            <NoSymbolIcon className="w-3 h-3" />
            {t('crm.consent.optedOut') || 'Opted Out'}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {consentRows.map(({ field, label, icon: Icon }) => (
          <div
            key={field}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            </div>
            <button
              onClick={() => handleToggle(field, !consent[field as keyof Pick<MarketingConsent, 'email' | 'sms' | 'push'>])}
              disabled={saving}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                consent[field as keyof Pick<MarketingConsent, 'email' | 'sms' | 'push'>]
                  ? 'bg-primary-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={label}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                  consent[field as keyof Pick<MarketingConsent, 'email' | 'sms' | 'push'>] ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}

        {/* Opt-out all toggle */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
          <div className="flex items-center gap-2">
            <NoSymbolIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {t('crm.consent.optOutAll') || 'Opt out of all'}
            </span>
          </div>
          <button
            onClick={() => handleToggle('optOutAll', !consent.optOutAll)}
            disabled={saving}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              consent.optOutAll ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={t('crm.consent.optOutAll') || 'Opt out of all'}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                consent.optOutAll ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tag assignment inline (inside expanded area)
// ---------------------------------------------------------------------------

const TagAssignment: React.FC<{
  client: CrmClient;
  allTags: CustomerTag[];
  onTagsChanged: (customerId: string) => void;
}> = ({ client, allTags, onTagsChanged }) => {
  const { t } = useLanguage();
  const [busy, setBusy] = useState<string | null>(null); // tagId being toggled

  const assignedIds = new Set(client.tags.map((t) => t.id));

  const handleToggle = async (tag: CustomerTag) => {
    if (busy) return;
    setBusy(tag.id);
    try {
      if (assignedIds.has(tag.id)) {
        await crmService.unassignTag(client.customerId, tag.id);
      } else {
        await crmService.assignTag(client.customerId, tag.id);
      }
      onTagsChanged(client.customerId);
    } catch {
      toast.error(t('crm.tagToggleFailed') || 'Failed to update tags');
    } finally {
      setBusy(null);
    }
  };

  if (!allTags.length) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('crm.noTagsYet') || 'No tags yet — create some in Manage Tags.'}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {allTags.map((tag) => {
        const assigned = assignedIds.has(tag.id);
        const colors = TAG_COLOR_CLASSES[tag.color] || TAG_COLOR_CLASSES.gray;
        return (
          <button
            key={tag.id}
            onClick={() => handleToggle(tag)}
            disabled={busy === tag.id}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
              assigned
                ? `${colors.pill} ring-2 ring-offset-1 ring-current`
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${busy === tag.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
          >
            {assigned && <CheckCircleIcon className="w-3 h-3 flex-shrink-0" />}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Manage Tags Modal
// ---------------------------------------------------------------------------

interface ManageTagsModalProps {
  onClose: () => void;
  onTagsUpdated: () => void;
}

const ManageTagsModal: React.FC<ManageTagsModalProps> = ({ onClose, onTagsUpdated }) => {
  const { t } = useLanguage();
  const [tags, setTags] = useState<CustomerTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<TagColor>('primary');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<TagColor>('primary');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const result = await crmService.listTags();
      setTags(result);
    } catch {
      toast.error(t('crm.tagLoadFailed') || 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { loadTags(); }, [loadTags]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const tag = await crmService.createTag({ name, color: newColor });
      setTags((prev) => [...prev, tag]);
      setNewName('');
      setNewColor('primary');
      onTagsUpdated();
    } catch {
      toast.error(t('crm.tagCreateFailed') || 'Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (tag: CustomerTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      const updated = await crmService.updateTag(id, { name, color: editColor });
      setTags((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      onTagsUpdated();
    } catch {
      toast.error(t('crm.tagUpdateFailed') || 'Failed to update tag');
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await crmService.deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
      setConfirmDeleteId(null);
      onTagsUpdated();
    } catch {
      toast.error(t('crm.tagDeleteFailed') || 'Failed to delete tag');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('crm.manageTags') || 'Manage Tags'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Create new tag */}
          <div className="bg-gray-50 dark:bg-gray-700/40 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('crm.newTag') || 'New Tag'}
            </h3>
            <input
              ref={inputRef}
              type="text"
              placeholder={t('crm.tagNamePlaceholder') || 'Tag name...'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 mb-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {/* Color picker */}
            <div className="flex flex-wrap gap-2 mb-3">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${TAG_COLOR_CLASSES[c].swatch} ${
                    newColor === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-300 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c}
                  aria-label={c}
                />
              ))}
            </div>
            {/* Preview + create */}
            <div className="flex items-center gap-3">
              {newName && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${TAG_COLOR_CLASSES[newColor].pill}`}>
                  {newName}
                </span>
              )}
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-4 h-4" />
                {creating ? (t('common.saving') || 'Saving…') : (t('crm.createTag') || 'Create')}
              </button>
            </div>
          </div>

          {/* Existing tags */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
              {t('crm.noTagsYet') || 'No tags yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3"
                >
                  {editingId === tag.id ? (
                    /* Edit mode */
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(tag.id); if (e.key === 'Escape') setEditingId(null); }}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {TAG_COLORS.map((c) => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={`w-6 h-6 rounded-full transition-all ${TAG_COLOR_CLASSES[c].swatch} ${
                              editColor === c ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'
                            }`}
                            aria-label={c}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveEdit(tag.id)}
                          className="px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                        >
                          {t('actions.save') || 'Save'}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {t('actions.cancel') || 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : confirmDeleteId === tag.id ? (
                    /* Delete confirm */
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 min-w-0">
                        {t('crm.confirmDeleteTag') || 'Delete this tag?'}{' '}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${TAG_COLOR_CLASSES[tag.color].pill}`}>
                          {tag.name}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleDelete(tag.id)}
                          disabled={deletingId === tag.id}
                          className="px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === tag.id ? '…' : (t('actions.delete') || 'Delete')}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {t('actions.cancel') || 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${TAG_COLOR_CLASSES[tag.color].swatch}`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{tag.name}</span>
                        {tag.count !== undefined && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            ({tag.count})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(tag)}
                          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label={t('actions.edit') || 'Edit'}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(tag.id)}
                          className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          aria-label={t('actions.delete') || 'Delete'}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Client card
// ---------------------------------------------------------------------------

interface ClientCardProps {
  client: CrmClient;
  isExpanded: boolean;
  onToggle: () => void;
  onViewBookings: () => void;
  onSendMessage: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatPrice: (p: any, fromCurrency?: any) => string;
  index: number;
  allTags: CustomerTag[];
  onTagsChanged: (customerId: string) => void;
  // Notes props
  notes: Array<{ id: string; content: string; category: string; updatedAt: string }>;
  loadingNotes: boolean;
  notesError: string | null;
  onRetryNotes: () => void;
  newNote: string;
  noteCategory: string;
  onNewNoteChange: (value: string) => void;
  onNoteCategoryChange: (value: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  isExpanded,
  onToggle,
  onViewBookings,
  onSendMessage,
  formatPrice,
  index,
  allTags,
  onTagsChanged,
  notes,
  loadingNotes,
  notesError,
  onRetryNotes,
  newNote,
  noteCategory,
  onNewNoteChange,
  onNoteCategoryChange,
  onCreateNote,
  onDeleteNote,
}) => {
  const { t } = useLanguage();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Main card content */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          {/* Left: avatar + info */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Avatar */}
            {client.avatar ? (
              <img
                src={client.avatar}
                alt={client.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-gray-200 dark:border-gray-600 ring-1 ring-inset ring-black/10 dark:ring-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-base">
                  {getInitials(client.name)}
                </span>
              </div>
            )}

            {/* Name + meta */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white break-words min-w-0">
                  {client.name}
                </h3>
                {/* Status badge */}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap flex-shrink-0 ${
                    client.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {client.isActive
                    ? t('clients.status.active') || 'Active'
                    : t('clients.status.inactive') || 'Lapsed'}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t('clients.lastVisit') || 'Last visit'}:{' '}
                {client.lastVisitDate
                  ? new Date(client.lastVisitDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </p>
              {/* Tag pills */}
              {client.tags.length > 0 && <TagPills tags={client.tags} />}
            </div>
          </div>

          {/* Right: expand toggle */}
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition active:scale-[0.96] ml-2 flex-shrink-0"
            aria-label={t('clients.toggleDetails') || 'Toggle details'}
          >
            {isExpanded ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-2 py-2 text-center">
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{client.bookingsCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {t('clients.bookings') || 'Bookings'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-2 py-2 text-center min-w-0">
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums truncate">
              {formatPrice(client.totalSpent, client.currency)}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {t('clients.totalSpent') || 'Total Spent'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-2 py-2 text-center min-w-0">
            <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums truncate">
              {formatPrice(client.totalSpent / (client.bookingsCount || 1), client.currency)}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
              {t('clients.avgSpent') || 'Avg / Visit'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex items-center space-x-2">
          <button
            onClick={onViewBookings}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50 transition duration-200 active:scale-[0.96]"
          >
            <EyeIcon className="w-4 h-4" />
            <span>{t('clients.notes') || 'Notes'}</span>
          </button>
          <button
            onClick={onSendMessage}
            className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition duration-200 active:scale-[0.96]"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>{t('clients.sendMessage') || 'Message'}</span>
          </button>
        </div>
      </div>

      {/* Expandable detail section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30 space-y-5">

              {/* Tags assignment */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <TagIconFallback className="w-4 h-4" />
                  {t('crm.tags') || 'Tags'}
                </h4>
                <TagAssignment
                  client={client}
                  allTags={allTags}
                  onTagsChanged={onTagsChanged}
                />
              </div>

              {/* Consent */}
              <ConsentPanel customerId={client.customerId} />

              {/* Client Notes */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('clients.notes') || 'Notes'}
                </h4>

                {/* Add note form */}
                <div className="flex items-start space-x-2 mb-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder={t('clients.addNotePlaceholder') || 'Add a note (allergies, preferences, formulas...)'}
                      value={newNote}
                      onChange={(e) => onNewNoteChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onCreateNote()}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    <div className="flex items-center mt-1 space-x-1 flex-wrap gap-y-1">
                      {['general', 'allergy', 'preference', 'formula'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => onNoteCategoryChange(cat)}
                          className={`px-2 py-0.5 text-xs rounded-full transition active:scale-[0.96] whitespace-nowrap ${
                            (noteCategory || 'general') === cat
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={onCreateNote}
                    className="px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition active:scale-[0.96] flex-shrink-0"
                  >
                    {t('actions.add') || 'Add'}
                  </button>
                </div>

                {/* Notes list */}
                {notesError ? (
                  <div className="flex items-center justify-between gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400 text-xs">{notesError}</p>
                    <button
                      onClick={onRetryNotes}
                      className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
                    >
                      {t('common.retry') || 'Retry'}
                    </button>
                  </div>
                ) : loadingNotes ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                    {t('common.loading') || 'Loading notes...'}
                  </div>
                ) : notes.length > 0 ? (
                  <div className="space-y-2">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-start justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-0.5 flex-wrap gap-y-0.5">
                            <span
                              className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${
                                note.category === 'allergy'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : note.category === 'preference'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                  : note.category === 'formula'
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {note.category}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400">
                              {new Date(note.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{note.content}</p>
                        </div>
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="ml-2 p-1 text-gray-500 dark:text-gray-400 hover:text-red-500 transition active:scale-[0.96] flex-shrink-0"
                        >
                          <XIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('clients.noNotes') || 'No notes yet'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/** Empty state */
const EmptyState: React.FC = () => {
  const { t } = useLanguage();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
        <UserGroupIcon className="w-10 h-10 text-gray-500 dark:text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {t('clients.empty.title') || 'No clients yet'}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
        {t('clients.empty.description') ||
          'When customers book your services, they will appear here.'}
      </p>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Help content — trilingual
// ---------------------------------------------------------------------------

const CLIENTS_HELP = {
  en: {
    overview:
      'My Clients\n\nYour full client book — everyone who has ever booked you through MiyZapis.\n\n' +
      '• Client = a person who completed at least one booking with you\n' +
      '• Active (green badge) = booked at least once in the last 90 days\n' +
      '• Lapsed (grey badge) = no visit in 90+ days\n\n' +
      'Each card shows:\n' +
      '• Bookings — total number of visits\n' +
      '• Total Spent — cumulative spend in the client\'s currency (may differ from your display currency)\n' +
      '• Avg / Visit — total spent ÷ number of bookings\n\n' +
      'Expand a card (▼) to:\n' +
      '• Assign colour-coded tags (VIP, Allergy, etc.)\n' +
      '• Add private notes: general · allergy · preference · formula\n' +
      '• Toggle marketing consent per channel (email, SMS, push)',
  },
  uk: {
    overview:
      'Мої клієнти\n\nПовна клієнтська база — всі, хто хоч раз записувався до вас через MiyZapis.\n\n' +
      '• Клієнт = людина, що здійснила щонайменше одне бронювання\n' +
      '• Активний (зелений значок) = відвідував(-ла) протягом останніх 90 днів\n' +
      '• Неактивний (сірий) = не було візиту 90+ днів\n\n' +
      'Картка показує:\n' +
      '• Записи — загальна кількість візитів\n' +
      '• Витрачено — сума в валюті клієнта (може відрізнятися від вашої відображуваної валюти)\n' +
      '• Середній чек — загальна сума ÷ кількість візитів\n\n' +
      'Розгорніть картку (▼), щоб:\n' +
      '• Призначити кольорові теги (VIP, Алергія тощо)\n' +
      '• Додати приватні нотатки: загальні · алергія · побажання · формула\n' +
      '• Керувати дозволами на маркетинг (email, SMS, push)',
  },
  ru: {
    overview:
      'Мои клиенты\n\nПолная клиентская база — все, кто хоть раз записывался к вам через MiyZapis.\n\n' +
      '• Клиент = человек, совершивший хотя бы одно бронирование\n' +
      '• Активный (зелёный значок) = посещал(-а) в течение последних 90 дней\n' +
      '• Неактивный (серый) = не было визита 90+ дней\n\n' +
      'Карточка показывает:\n' +
      '• Записи — общее количество визитов\n' +
      '• Потрачено — сумма в валюте клиента (может отличаться от вашей отображаемой валюты)\n' +
      '• Средний чек — общая сумма ÷ количество визитов\n\n' +
      'Разверните карточку (▼), чтобы:\n' +
      '• Назначить цветные теги (VIP, Аллергия и т.д.)\n' +
      '• Добавить личные заметки: общие · аллергия · пожелания · формула\n' +
      '• Управлять согласием на маркетинг (email, SMS, push)',
  },
};

const SpecialistClients: React.FC = () => {
  const { t, language } = useLanguage();
  const h = (CLIENTS_HELP as Record<string, typeof CLIENTS_HELP.en>)[language] || CLIENTS_HELP.en;
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allClients, setAllClients] = useState<CrmClient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastVisitDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Tag filter
  const [allTags, setAllTags] = useState<CustomerTag[]>([]);
  const [filterTagId, setFilterTagId] = useState<string | null>(null);
  const [showManageTags, setShowManageTags] = useState(false);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);

  // Notes state
  const [clientNotes, setClientNotes] = useState<
    Record<string, Array<{ id: string; content: string; category: string; updatedAt: string }>>
  >({});
  const [newNote, setNewNote] = useState<Record<string, string>>({});
  const [noteCategory, setNoteCategory] = useState<Record<string, string>>({});
  const [loadingNotes, setLoadingNotes] = useState<Record<string, boolean>>({});
  const [notesError, setNotesError] = useState<Record<string, string | null>>({});

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const loadTags = useCallback(async () => {
    try {
      const tags = await crmService.listTags();
      setAllTags(tags);
    } catch {
      // tags are optional; swallow
    }
  }, []);

  const loadClients = useCallback(async (opts?: { tagId?: string; search?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const clients = await crmService.getClients({
        tagId: opts?.tagId || filterTagId || undefined,
        search: opts?.search !== undefined ? opts.search : searchTerm || undefined,
      });
      setAllClients(clients);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Clients] Error loading clients:', err);
      setError(message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [filterTagId, searchTerm]);

  // Initial load
  useEffect(() => {
    loadClients();
    loadTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when tag filter changes (search debounced below)
  useEffect(() => {
    loadClients({ tagId: filterTagId || undefined, search: searchTerm || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTagId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients({ tagId: filterTagId || undefined, search: searchTerm || undefined });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Refresh a single client's tags after assign/unassign
  const refreshClientTags = useCallback(async (customerId: string) => {
    try {
      const updated = await crmService.getClient(customerId);
      setAllClients((prev) =>
        prev.map((c) => (c.customerId === customerId ? updated : c))
      );
    } catch {
      // silently skip; list will resync on next full reload
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Filtering + Sorting (client-side after server fetch)
  // ---------------------------------------------------------------------------

  const filteredAndSortedClients = useMemo(() => {
    let result = [...allClients];

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'bookingsCount':
          cmp = a.bookingsCount - b.bookingsCount;
          break;
        case 'lastVisitDate':
          cmp =
            new Date(a.lastVisitDate || 0).getTime() -
            new Date(b.lastVisitDate || 0).getTime();
          break;
        case 'totalSpent':
          cmp = a.totalSpent - b.totalSpent;
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allClients, sortField, sortOrder]);

  // ---------------------------------------------------------------------------
  // Stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const total = allClients.length;
    const active = allClients.filter((c) => c.isActive).length;
    const avg =
      total > 0 ? allClients.reduce((sum, c) => sum + c.bookingsCount, 0) / total : 0;
    const repeat =
      total > 0
        ? Math.round(
            (allClients.filter((c) => c.bookingsCount > 1).length / total) * 100
          )
        : 0;
    return { totalClients: total, activeClients: active, averageBookings: avg, repeatRate: repeat };
  }, [allClients]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleToggleExpand = (clientId: string) => {
    setExpandedClientId((prev) => {
      const newId = prev === clientId ? null : clientId;
      if (newId && !clientNotes[newId]) {
        loadClientNotes(newId);
      }
      return newId;
    });
  };

  const handleViewBookings = (client: CrmClient) => {
    setExpandedClientId(client.customerId);
    if (!clientNotes[client.customerId]) {
      loadClientNotes(client.customerId);
    }
  };

  const handleSendMessage = (client: CrmClient) => {
    navigate(
      `/specialist/messages?recipientId=${client.customerId}&recipientName=${encodeURIComponent(client.name)}`
    );
  };

  // Notes handlers
  const loadClientNotes = async (clientId: string) => {
    try {
      setLoadingNotes((prev) => ({ ...prev, [clientId]: true }));
      setNotesError((prev) => ({ ...prev, [clientId]: null }));
      const response = await specialistService.getClientNotes(clientId);
      setClientNotes((prev) => ({ ...prev, [clientId]: response?.notes || [] }));
    } catch {
      setNotesError((prev) => ({ ...prev, [clientId]: t('clients.notesLoadError') || 'Could not load notes' }));
    } finally {
      setLoadingNotes((prev) => ({ ...prev, [clientId]: false }));
    }
  };

  const handleCreateNote = async (clientId: string) => {
    const content = newNote[clientId]?.trim();
    if (!content) return;
    try {
      const response = await specialistService.createClientNote(
        clientId,
        content,
        noteCategory[clientId] || 'general'
      );
      setClientNotes((prev) => ({
        ...prev,
        [clientId]: [
          response?.note || {
            id: Date.now().toString(),
            content,
            category: noteCategory[clientId] || 'general',
            updatedAt: new Date().toISOString(),
          },
          ...(prev[clientId] || []),
        ],
      }));
      setNewNote((prev) => ({ ...prev, [clientId]: '' }));
    } catch {
      toast.error(t('clients.noteSaveFailed'));
    }
  };

  const handleDeleteNote = async (clientId: string, noteId: string) => {
    try {
      await specialistService.deleteClientNote(noteId);
      setClientNotes((prev) => ({
        ...prev,
        [clientId]: (prev[clientId] || []).filter((n) => n.id !== noteId),
      }));
    } catch {
      toast.error(t('clients.noteDeleteFailed'));
    }
  };

  // ---------------------------------------------------------------------------
  // Sort options
  // ---------------------------------------------------------------------------

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'name', label: t('clients.sort.name') || 'Name' },
    { field: 'bookingsCount', label: t('clients.sort.bookings') || 'Bookings' },
    { field: 'lastVisitDate', label: t('clients.sort.lastVisit') || 'Last Visit' },
    { field: 'totalSpent', label: t('clients.sort.totalSpent') || 'Spent' },
  ];

  const activeTagLabel = filterTagId
    ? allTags.find((t) => t.id === filterTagId)?.name
    : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        {/* Page header */}
        <div className="max-w-5xl mx-auto px-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('clients.title') || 'My Clients'}
                </h1>
                <HelpTip title={t('help.clients.title') || 'Clients'} content={h.overview} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                {t('clients.subtitle') || 'Manage and view your client relationships'}
                {!loading && allClients.length > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-300">
                    {allClients.length}{' '}
                    {allClients.length === 1
                      ? t('clients.client') || 'client'
                      : t('clients.clientsPlural') || 'clients'}
                  </span>
                )}
              </p>
            </div>

            {/* Header actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowManageTags(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-[0.96] w-full sm:w-auto"
              >
                <TagIconFallback className="w-4 h-4" />
                <span>{t('crm.manageTags') || 'Manage Tags'}</span>
              </button>
              {!loading && (
                <button
                  onClick={() => loadClients()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-[0.96] w-full sm:w-auto"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>{t('common.refresh') || 'Refresh'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">
          {/* Error state */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <div className="flex items-center justify-between gap-3">
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                <button
                  onClick={() => loadClients()}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline flex-shrink-0"
                >
                  {t('common.retry') || 'Retry'}
                </button>
              </div>
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-12 bg-white dark:bg-gray-800 rounded-2xl mb-4 animate-pulse border border-gray-200 dark:border-gray-700" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            </>
          )}

          {/* Loaded content */}
          {!loading && (
            <>
              {/* Stats */}
              {allClients.length > 0 && (
                <StatsBar
                  totalClients={stats.totalClients}
                  activeClients={stats.activeClients}
                  averageBookings={stats.averageBookings}
                  repeatRate={stats.repeatRate}
                />
              )}

              {/* Search + Tag filter + Sort */}
              <div className="flex flex-col gap-3 mb-6">
                {/* Search row */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <input
                      type="text"
                      placeholder={
                        t('clients.searchPlaceholder') || 'Search by name, email, or phone...'
                      }
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Tag filter button */}
                  {allTags.length > 0 && (
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setTagFilterOpen((v) => !v)}
                        className={`inline-flex items-center gap-2 px-3 py-3 rounded-2xl border text-sm font-medium transition active:scale-[0.96] ${
                          filterTagId
                            ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-400'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <FunnelIcon className="w-4 h-4" />
                        <span className="hidden sm:inline whitespace-nowrap">
                          {activeTagLabel || t('crm.filterByTag') || 'Filter'}
                        </span>
                        {filterTagId && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setFilterTagId(null);
                            }}
                            className="inline-flex items-center"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {tagFilterOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-2 z-30 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 min-w-[160px]"
                          >
                            <button
                              onClick={() => { setFilterTagId(null); setTagFilterOpen(false); }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              {t('crm.allClients') || 'All clients'}
                            </button>
                            <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                            {allTags.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => { setFilterTagId(tag.id); setTagFilterOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TAG_COLOR_CLASSES[tag.color].swatch}`} />
                                <span className="truncate">{tag.name}</span>
                                {tag.count !== undefined && (
                                  <span className="ml-auto text-xs text-gray-400 flex-shrink-0 tabular-nums">{tag.count}</span>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Sort chips */}
                <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 p-1">
                  {sortOptions.map((opt) => {
                    const isActive = sortField === opt.field;
                    return (
                      <button
                        key={opt.field}
                        onClick={() => handleToggleSort(opt.field)}
                        className={`px-3 py-2 text-xs font-medium rounded-xl transition active:scale-[0.96] whitespace-nowrap ${
                          isActive
                            ? 'bg-primary-500 text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {opt.label}
                        {isActive && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active tag chip */}
                {filterTagId && activeTagLabel && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {t('crm.filteredByTag') || 'Filtered by:'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        TAG_COLOR_CLASSES[allTags.find((t) => t.id === filterTagId)?.color || 'gray'].pill
                      }`}
                    >
                      {activeTagLabel}
                      <button onClick={() => setFilterTagId(null)}>
                        <XIcon className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                )}
              </div>

              {/* Client list */}
              {filteredAndSortedClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {filteredAndSortedClients.map((client, idx) => (
                      <ClientCard
                        key={client.customerId}
                        client={client}
                        isExpanded={expandedClientId === client.customerId}
                        onToggle={() => handleToggleExpand(client.customerId)}
                        onViewBookings={() => handleViewBookings(client)}
                        onSendMessage={() => handleSendMessage(client)}
                        formatPrice={formatPrice}
                        index={idx}
                        allTags={allTags}
                        onTagsChanged={refreshClientTags}
                        notes={clientNotes[client.customerId] || []}
                        loadingNotes={loadingNotes[client.customerId] || false}
                        notesError={notesError[client.customerId] ?? null}
                        onRetryNotes={() => loadClientNotes(client.customerId)}
                        newNote={newNote[client.customerId] || ''}
                        noteCategory={noteCategory[client.customerId] || 'general'}
                        onNewNoteChange={(value) =>
                          setNewNote((prev) => ({ ...prev, [client.customerId]: value }))
                        }
                        onNoteCategoryChange={(value) =>
                          setNoteCategory((prev) => ({
                            ...prev,
                            [client.customerId]: value,
                          }))
                        }
                        onCreateNote={() => handleCreateNote(client.customerId)}
                        onDeleteNote={(noteId) =>
                          handleDeleteNote(client.customerId, noteId)
                        }
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </div>
      </div>

      {/* Manage Tags Modal */}
      <AnimatePresence>
        {showManageTags && (
          <ManageTagsModal
            onClose={() => setShowManageTags(false)}
            onTagsUpdated={() => {
              loadTags();
              loadClients();
            }}
          />
        )}
      </AnimatePresence>

      {/* Tag filter dropdown backdrop */}
      {tagFilterOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setTagFilterOpen(false)}
        />
      )}
    </div>
  );
};

export default SpecialistClients;
