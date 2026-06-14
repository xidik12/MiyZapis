import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  crmService,
  Lead,
  LeadStage,
  LeadSource,
  LEAD_STAGES,
  LEAD_SOURCES,
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
  CurrencyDollarIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
};

const fmtValue = (v?: number | null): string => {
  const n = num(v);
  if (n === 0) return '—';
  return '₴ ' + n.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// ---------------------------------------------------------------------------
// Stage badge colours
// ---------------------------------------------------------------------------

const stageBadgeClass = (stage: LeadStage): string => {
  switch (stage) {
    case 'new':
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    case 'contacted':
      return 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400';
    case 'qualified':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'won':
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    case 'lost':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  }
};

const stageColumnHeaderClass = (stage: LeadStage): string => {
  switch (stage) {
    case 'new':
      return 'text-gray-600 dark:text-gray-300';
    case 'contacted':
      return 'text-sky-600 dark:text-sky-400';
    case 'qualified':
      return 'text-amber-600 dark:text-amber-400';
    case 'won':
      return 'text-green-600 dark:text-green-400';
    case 'lost':
      return 'text-red-600 dark:text-red-400';
  }
};

const stageLabel = (stage: LeadStage): string => {
  switch (stage) {
    case 'new':       return 'New';
    case 'contacted': return 'Contacted';
    case 'qualified': return 'Qualified';
    case 'won':       return 'Won';
    case 'lost':      return 'Lost';
  }
};

const sourceLabel = (source?: LeadSource | null): string => {
  if (!source) return '—';
  switch (source) {
    case 'walk-in':  return 'Walk-in';
    case 'referral': return 'Referral';
    case 'instagram':return 'Instagram';
    case 'web':      return 'Web';
    case 'phone':    return 'Phone';
    case 'other':    return 'Other';
  }
};

// ---------------------------------------------------------------------------
// Form shape
// ---------------------------------------------------------------------------

interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  source: LeadSource | '';
  stage: LeadStage;
  value: string;
  notes: string;
}

const emptyForm: LeadFormData = {
  name: '',
  email: '',
  phone: '',
  source: '',
  stage: 'new',
  value: '',
  notes: '',
};

const toFormData = (lead: Lead): LeadFormData => ({
  name: lead.name,
  email: lead.email || '',
  phone: lead.phone || '',
  source: lead.source || '',
  stage: lead.stage,
  value: lead.value != null ? String(lead.value) : '',
  notes: lead.notes || '',
});

// ---------------------------------------------------------------------------
// Lead card (shared between kanban column and mobile stacked view)
// ---------------------------------------------------------------------------

interface LeadCardProps {
  lead: Lead;
  acting: string | null;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
  onEdit: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  t: (key: string) => string;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, acting, onStageChange, onEdit, onConvert, onDelete, t }) => {
  const busy = acting === lead.id;
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm space-y-3">
      {/* Name + stage badge */}
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words leading-snug">
          {lead.name}
        </p>
        {lead.source && (
          <span className="flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            {sourceLabel(lead.source)}
          </span>
        )}
      </div>

      {/* Value */}
      {lead.value != null && lead.value > 0 && (
        <p className="text-base font-bold tabular-nums text-gray-900 dark:text-white">
          {fmtValue(lead.value)}
        </p>
      )}

      {/* Contact info */}
      {(lead.email || lead.phone) && (
        <div className="space-y-1">
          {lead.email && (
            <div className="flex items-center gap-1.5 min-w-0">
              <EnvelopeIcon className="flex-shrink-0 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5 min-w-0">
              <PhoneIcon className="flex-shrink-0 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.phone}</span>
            </div>
          )}
        </div>
      )}

      {/* Notes preview */}
      {lead.notes && (
        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 break-words">
          {lead.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-700">
        {/* Stage selector */}
        <select
          value={lead.stage}
          disabled={busy}
          onChange={(e) => onStageChange(lead, e.target.value as LeadStage)}
          className={`flex-1 min-w-0 text-xs rounded-lg border px-2 py-1 font-medium cursor-pointer
            ${stageBadgeClass(lead.stage)}
            border-transparent
            focus:outline-none focus:ring-2 focus:ring-primary-500
            disabled:opacity-50`}
        >
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              {stageLabel(s)}
            </option>
          ))}
        </select>

        {/* Edit */}
        <button
          onClick={() => onEdit(lead)}
          disabled={busy}
          aria-label={t('common.edit') || 'Edit'}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </button>

        {/* Convert (only if not already won/lost) */}
        {lead.stage !== 'won' && lead.stage !== 'lost' && !lead.customerId && (
          <button
            onClick={() => onConvert(lead)}
            disabled={busy}
            aria-label={t('crm.convertLead') || 'Convert to client'}
            title={t('crm.convertLead') || 'Convert to client'}
            className="p-1.5 text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors disabled:opacity-50"
          >
            {busy ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Delete */}
        <button
          onClick={() => onDelete(lead)}
          disabled={busy}
          aria-label={t('common.delete') || 'Delete'}
          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {busy && lead.stage === lead.stage /* always true, just keeps busy for delete */
            ? <TrashIcon className="h-3.5 w-3.5" />
            : <TrashIcon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const CrmLeads: React.FC = () => {
  const { t } = useLanguage();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData>(emptyForm);

  // ---- data ----------------------------------------------------------------

  const loadLeads = async () => {
    try {
      setLoading(true);
      const data = await crmService.listLeads();
      setLeads(data || []);
    } catch (err: unknown) {
      console.error('Error loading leads:', err);
      toast.error(t('crm.leadsLoadError') || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- derived stats -------------------------------------------------------

  const totalLeads = leads.length;
  const stageCounts: Record<LeadStage, number> = {
    new: 0, contacted: 0, qualified: 0, won: 0, lost: 0,
  };
  let pipelineValue = 0;
  for (const l of leads) {
    stageCounts[l.stage] = (stageCounts[l.stage] || 0) + 1;
    if (l.stage !== 'lost') pipelineValue += num(l.value);
  }

  // ---- modal ---------------------------------------------------------------

  const openAdd = () => {
    setEditingLead(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (lead: Lead) => {
    setEditingLead(lead);
    setForm(toFormData(lead));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t('crm.nameRequired') || 'Name is required');
      return;
    }
    const payload: Partial<Lead> & { name: string } = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      source: (form.source as LeadSource) || undefined,
      stage: form.stage,
      value: form.value !== '' ? parseFloat(form.value) : undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      setSubmitting(true);
      if (editingLead) {
        await crmService.updateLead(editingLead.id, payload);
        toast.success(t('crm.leadUpdated') || 'Lead updated');
      } else {
        await crmService.createLead(payload);
        toast.success(t('crm.leadCreated') || 'Lead created');
      }
      setIsModalOpen(false);
      loadLeads();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('crm.saveFailed') || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  // ---- actions -------------------------------------------------------------

  const handleStageChange = async (lead: Lead, stage: LeadStage) => {
    try {
      setActing(lead.id);
      await crmService.setLeadStage(lead.id, stage);
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage } : l)));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('crm.stageFailed') || 'Failed to update stage');
    } finally {
      setActing(null);
    }
  };

  const handleConvert = async (lead: Lead) => {
    if (!confirm(t('crm.confirmConvert') || `Convert "${lead.name}" to a client? This will create a customer account.`)) return;
    try {
      setActing(lead.id);
      await crmService.convertLead(lead.id);
      toast.success(t('crm.leadConverted') || 'Lead converted to client');
      loadLeads();
    } catch (err: unknown) {
      toast.error((err as Error).message || t('crm.convertFailed') || 'Failed to convert');
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!confirm(t('crm.confirmDeleteLead') || `Delete lead "${lead.name}"?`)) return;
    try {
      setActing(lead.id);
      await crmService.deleteLead(lead.id);
      toast.success(t('crm.leadDeleted') || 'Lead deleted');
      setLeads((prev) => prev.filter((l) => l.id !== lead.id));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('crm.deleteFailed') || 'Failed to delete');
    } finally {
      setActing(null);
    }
  };

  // ---- card props helper ---------------------------------------------------

  const cardProps = (_lead: Lead): Omit<LeadCardProps, 'lead'> => ({
    acting,
    onStageChange: handleStageChange,
    onEdit: openEdit,
    onConvert: handleConvert,
    onDelete: handleDelete,
    t,
  });

  // ---- input/label class (same as Sales.tsx) --------------------------------

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  // ---- early loading -------------------------------------------------------

  if (loading && leads.length === 0) {
    return <PageLoader text={t('crm.loadingLeads') || 'Loading leads...'} />;
  }

  // ---- render --------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* ---- Header ---- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('crm.leads') || 'Leads'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('crm.leadsSubtitle') || 'Track prospects through your pipeline'}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5 flex-shrink-0" />
            {t('crm.addLead') || 'Add lead'}
          </button>
        </div>

        {/* ---- Summary stats ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total leads */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex-shrink-0">
                <UsersIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('crm.totalLeads') || 'Total leads'}</p>
                <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{totalLeads}</p>
              </div>
            </div>
          </div>

          {/* Pipeline value */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('crm.pipelineValue') || 'Pipeline value'}</p>
                <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white truncate">
                  {fmtValue(pipelineValue)}
                </p>
              </div>
            </div>
          </div>

          {/* New */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex-shrink-0">
                <ArrowRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('crm.stageNew') || 'New'}</p>
                <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{stageCounts.new}</p>
              </div>
            </div>
          </div>

          {/* Won */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('crm.stageWon') || 'Won'}</p>
                <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{stageCounts.won}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---- DESKTOP kanban (lg+) ---- */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-4">
          {LEAD_STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.stage === stage);
            return (
              <div key={stage} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold uppercase tracking-wide ${stageColumnHeaderClass(stage)}`}>
                    {stageLabel(stage)}
                  </span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 tabular-nums">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                {stageLeads.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-4 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {t('crm.noLeadsInStage') || 'No leads here'}
                    </p>
                    {stage === 'new' && (
                      <button
                        onClick={openAdd}
                        className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        {t('crm.addFirstLead') || '+ Add first lead'}
                      </button>
                    )}
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} {...cardProps(lead)} />
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* ---- MOBILE stacked sections (<lg) ---- */}
        <div className="lg:hidden space-y-6">
          {leads.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
              <div className="mx-auto w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                <UsersIcon className="h-7 w-7 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('crm.noLeadsYet') || 'No leads yet'}
              </p>
              <button
                onClick={openAdd}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                {t('crm.addFirstLead') || '+ Add first lead'}
              </button>
            </div>
          ) : (
            LEAD_STAGES.map((stage) => {
              const stageLeads = leads.filter((l) => l.stage === stage);
              if (stageLeads.length === 0) return null;
              return (
                <div key={stage}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${stageBadgeClass(stage)}`}
                    >
                      {stageLabel(stage)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} {...cardProps(lead)} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ============================ MODAL ============================ */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingLead
                    ? (t('crm.editLead') || 'Edit lead')
                    : (t('crm.addLead') || 'Add lead')}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className={labelClass}>{t('crm.leadName') || 'Name'} *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={t('crm.leadNamePlaceholder') || 'Full name or company'}
                    className={inputClass}
                    required
                  />
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('crm.email') || 'Email'}</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="example@email.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('crm.phone') || 'Phone'}</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+380..."
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Source + Stage */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t('crm.source') || 'Source'}</label>
                    <select
                      value={form.source}
                      onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource | '' })}
                      className={inputClass}
                    >
                      <option value="">{t('crm.sourceNone') || '— None —'}</option>
                      {LEAD_SOURCES.map((s) => (
                        <option key={s} value={s}>{sourceLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t('crm.stage') || 'Stage'}</label>
                    <select
                      value={form.stage}
                      onChange={(e) => setForm({ ...form, stage: e.target.value as LeadStage })}
                      className={inputClass}
                    >
                      {LEAD_STAGES.map((s) => (
                        <option key={s} value={s}>{stageLabel(s)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Value */}
                <div>
                  <label className={labelClass}>{t('crm.value') || 'Deal value (₴)'}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className={labelClass}>{t('crm.notes') || 'Notes'}</label>
                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder={t('crm.notesPlaceholder') || 'Any relevant details...'}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {editingLead ? (t('common.save') || 'Save') : (t('crm.create') || 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CrmLeads;
