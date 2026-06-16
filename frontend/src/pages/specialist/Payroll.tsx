import React, { useState, useEffect } from 'react';
import { confirm } from '@/components/ui/Confirm';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  payrollService,
  StaffMember,
  PreviewLine,
  PayrollRecord,
  PayrollSummary,
  PayrollStatus,
  PAYROLL_STATUSES,
  RunLineInput,
  CommissionMode,
  CommissionTier,
} from '../../services/payroll.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  TrashIcon,
  XIcon as XMarkIcon,
  EyeIcon,
  CheckCircleIcon,
  CurrencyDollarIcon as BanknotesIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ClockIcon,
  CurrencyDollarIcon as ReceiptPercentIcon,
} from '@/components/icons';
import { HelpTip } from '@/components/common/HelpTip';

type Currency = 'USD' | 'EUR' | 'UAH';
type Tab = 'staff' | 'runs';

const asCurrency = (c?: string | null): Currency =>
  c === 'USD' || c === 'EUR' || c === 'UAH' ? c : 'UAH';

const num = (v: number | string | null | undefined): number => {
  if (v === null || v === undefined) return 0;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// ---------- Status badge styling ----------
const STATUS_BADGE: Record<PayrollStatus, string> = {
  DRAFT: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  APPROVED: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
  PAID: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

// Editable pay-run line row (string-typed for inputs).
interface RunRow {
  staffUserId: string;
  name: string;
  role: string;
  commissionPercent: number;
  mode: CommissionMode;
  baseSalary: string;
  commissionTotal: string;
  bonus: string;
  deductions: string;
  taxAmount: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthStartISO = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const SpecialistPayroll: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [tab, setTab] = useState<Tab>('staff');
  const [loading, setLoading] = useState(true);

  // Data
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<PayrollStatus | ''>('');

  // Commission editing (per staff). Each draft carries mode + flat percent + tier rows.
  interface CommissionDraft {
    mode: CommissionMode;
    percent: string;
    tiers: { minRevenue: string; percent: string }[];
  }
  const [commissionDraft, setCommissionDraft] = useState<Record<string, CommissionDraft>>({});
  const [savingCommission, setSavingCommission] = useState<string | null>(null);

  // Pay run builder
  const [periodStart, setPeriodStart] = useState(monthStartISO());
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [runCurrency, setRunCurrency] = useState('UAH');
  const [runNotes, setRunNotes] = useState('');
  const [runRows, setRunRows] = useState<RunRow[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [creatingRun, setCreatingRun] = useState(false);

  // Row action busy state
  const [busyRecord, setBusyRecord] = useState<string | null>(null);

  // Payslip view modal
  const [viewRecord, setViewRecord] = useState<PayrollRecord | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const filters = filterStatus ? { status: filterStatus } : {};
      const [staffRes, recordsRes, summaryRes] = await Promise.all([
        payrollService.getStaff().catch(() => [] as StaffMember[]),
        payrollService.getRecords(filters),
        payrollService.getSummary(),
      ]);
      setStaff(staffRes || []);
      setRecords(recordsRes || []);
      setSummary(summaryRes);
      // Seed commission drafts (mode + flat percent + tier rows).
      const drafts: Record<string, CommissionDraft> = {};
      (staffRes || []).forEach((s) => {
        drafts[s.staffUserId] = {
          mode: s.mode === 'TIERED' ? 'TIERED' : 'FLAT',
          percent: String(s.commissionPercent),
          tiers: (s.tiers && s.tiers.length > 0)
            ? s.tiers.map((t) => ({ minRevenue: String(t.minRevenue), percent: String(t.percent) }))
            : [{ minRevenue: '0', percent: '' }],
        };
      });
      setCommissionDraft(drafts);
    } catch (error: unknown) {
      console.error('Error loading payroll data:', error);
      toast.error(t('payroll.loadError') || 'Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Labels ----------
  const getStatusLabel = (status: PayrollStatus): string => {
    const labels: Record<PayrollStatus, Record<string, string>> = {
      DRAFT: { en: 'Draft', uk: 'Чернетка', ru: 'Черновик' },
      APPROVED: { en: 'Approved', uk: 'Затверджено', ru: 'Утверждено' },
      PAID: { en: 'Paid', uk: 'Виплачено', ru: 'Выплачено' },
    };
    return labels[status]?.[language] || labels[status]?.en || status;
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, Record<string, string>> = {
      OWNER: { en: 'Owner', uk: 'Власник', ru: 'Владелец' },
      MANAGER: { en: 'Manager', uk: 'Менеджер', ru: 'Менеджер' },
      SPECIALIST: { en: 'Specialist', uk: 'Спеціаліст', ru: 'Специалист' },
    };
    return labels[role]?.[language] || labels[role]?.en || role;
  };

  // ---------- Commission ----------
  const getDraft = (staffUserId: string): CommissionDraft =>
    commissionDraft[staffUserId] ?? { mode: 'FLAT', percent: '0', tiers: [{ minRevenue: '0', percent: '' }] };

  const setDraft = (staffUserId: string, patch: Partial<CommissionDraft>) => {
    setCommissionDraft((prev) => ({
      ...prev,
      [staffUserId]: { ...getDraft(staffUserId), ...patch },
    }));
  };

  const updateTierRow = (staffUserId: string, idx: number, field: 'minRevenue' | 'percent', value: string) => {
    const d = getDraft(staffUserId);
    const tiers = d.tiers.map((tr, i) => (i === idx ? { ...tr, [field]: value } : tr));
    setDraft(staffUserId, { tiers });
  };

  const addTierRow = (staffUserId: string) => {
    const d = getDraft(staffUserId);
    setDraft(staffUserId, { tiers: [...d.tiers, { minRevenue: '', percent: '' }] });
  };

  const removeTierRow = (staffUserId: string, idx: number) => {
    const d = getDraft(staffUserId);
    const tiers = d.tiers.filter((_, i) => i !== idx);
    setDraft(staffUserId, { tiers: tiers.length > 0 ? tiers : [{ minRevenue: '0', percent: '' }] });
  };

  const handleSaveCommission = async (staffUserId: string) => {
    const d = getDraft(staffUserId);
    try {
      setSavingCommission(staffUserId);
      if (d.mode === 'TIERED') {
        const tiers: CommissionTier[] = [];
        for (const tr of d.tiers) {
          const minRevenue = parseFloat(tr.minRevenue);
          const percent = parseFloat(tr.percent);
          if (isNaN(minRevenue) || minRevenue < 0 || isNaN(percent) || percent < 0 || percent > 100) {
            toast.error(t('payroll.commission.invalidTiers') || 'Each tier needs min revenue ≥ 0 and percent 0–100');
            return;
          }
          tiers.push({ minRevenue, percent });
        }
        if (tiers.length === 0) {
          toast.error(t('payroll.commission.invalidTiers') || 'Add at least one tier');
          return;
        }
        await payrollService.setCommission(staffUserId, { mode: 'TIERED', tiers });
        toast.success(t('payroll.commissionSaved') || 'Commission saved');
        setStaff((prev) => prev.map((s) =>
          s.staffUserId === staffUserId
            ? { ...s, mode: 'TIERED', tiers, commissionPercent: tiers[0]?.percent ?? 0 }
            : s));
      } else {
        const pct = parseFloat(d.percent);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          toast.error(t('payroll.invalidPercent') || 'Percent must be between 0 and 100');
          return;
        }
        await payrollService.setCommission(staffUserId, { mode: 'FLAT', percent: pct });
        toast.success(t('payroll.commissionSaved') || 'Commission saved');
        setStaff((prev) => prev.map((s) =>
          s.staffUserId === staffUserId ? { ...s, mode: 'FLAT', commissionPercent: pct, tiers: [] } : s));
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to save');
    } finally {
      setSavingCommission(null);
    }
  };

  // ---------- Pay run builder ----------
  const handlePreview = async () => {
    if (!periodStart || !periodEnd) {
      toast.error(t('payroll.periodRequired') || 'Select a start and end date');
      return;
    }
    if (periodStart > periodEnd) {
      toast.error(t('payroll.invalidPeriod') || 'Start date must be before end date');
      return;
    }
    try {
      setPreviewing(true);
      const lines = await payrollService.preview(periodStart, periodEnd);
      setRunRows(
        lines.map((l: PreviewLine) => ({
          staffUserId: l.staffUserId,
          name: l.name,
          role: l.role,
          commissionPercent: l.commissionPercent,
          mode: l.mode === 'TIERED' ? 'TIERED' : 'FLAT',
          baseSalary: String(num(l.baseSalary)),
          commissionTotal: String(num(l.commissionTotal)),
          bonus: String(num(l.bonus)),
          deductions: String(num(l.deductions)),
          taxAmount: String(num(l.taxAmount)),
        }))
      );
      if (lines.length === 0) {
        toast.info(t('payroll.noStaffToPay') || 'No staff to pay');
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.previewError') || 'Failed to preview');
    } finally {
      setPreviewing(false);
    }
  };

  const updateRunRow = (idx: number, patch: Partial<RunRow>) => {
    setRunRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const rowNet = (r: RunRow): number =>
    num(r.baseSalary) + num(r.commissionTotal) + num(r.bonus) - num(r.deductions) - num(r.taxAmount);

  const runTotal = runRows.reduce((sum, r) => sum + rowNet(r), 0);

  const handleCreateRun = async () => {
    if (runRows.length === 0) {
      toast.error(t('payroll.previewFirst') || 'Preview the period first');
      return;
    }
    try {
      setCreatingRun(true);
      const lines: RunLineInput[] = runRows.map((r) => ({
        staffUserId: r.staffUserId,
        baseSalary: num(r.baseSalary),
        commissionTotal: num(r.commissionTotal),
        bonus: num(r.bonus),
        deductions: num(r.deductions),
        taxAmount: num(r.taxAmount),
      }));
      await payrollService.createRun({
        periodStart,
        periodEnd,
        lines,
        currency: runCurrency,
        notes: runNotes.trim() || null,
      });
      toast.success(t('payroll.runCreated') || 'Pay run created');
      setRunRows([]);
      setRunNotes('');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to create');
    } finally {
      setCreatingRun(false);
    }
  };

  // ---------- Record actions ----------
  const handleApprove = async (rec: PayrollRecord) => {
    try {
      setBusyRecord(rec.id);
      await payrollService.setStatus(rec.id, 'APPROVED');
      toast.success(t('payroll.approved') || 'Approved');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to update');
    } finally {
      setBusyRecord(null);
    }
  };

  const handleMarkPaid = async (rec: PayrollRecord) => {
    try {
      setBusyRecord(rec.id);
      await payrollService.setStatus(rec.id, 'PAID');
      toast.success(t('payroll.markedPaid') || 'Marked as paid');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.saveError') || 'Failed to update');
    } finally {
      setBusyRecord(null);
    }
  };

  const handleDelete = async (rec: PayrollRecord) => {
    if (!await confirm(t('payroll.confirmDelete') || 'Delete this draft record?')) return;
    try {
      setBusyRecord(rec.id);
      await payrollService.deleteRecord(rec.id);
      toast.success(t('payroll.recordDeleted') || 'Record deleted');
      loadData();
    } catch (error: unknown) {
      toast.error((error as Error).message || t('payroll.deleteError') || 'Failed to delete');
    } finally {
      setBusyRecord(null);
    }
  };

  if (loading && staff.length === 0 && records.length === 0) {
    return <PageLoader text={t('payroll.loading') || 'Loading payroll...'} />;
  }

  const summaryCurrency = asCurrency(summary?.currency);
  const counts = summary?.countsByStatus || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {t('payroll.title') || 'Payroll'}
              </h1>
              <HelpTip title={t('help.payroll.title') || 'Payroll'} content={t('help.payroll.body') || 'Set staff commission and run payouts.'} />
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('payroll.subtitle') || 'Manage staff commission and pay runs'}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('payroll.thisPeriodTotal') || 'This-period Payroll'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.totalPayrollThisPeriod || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('payroll.pendingApproval') || 'Pending Approval'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.pendingApproval || 0, summaryCurrency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {counts.DRAFT || 0} {t('payroll.drafts') || 'drafts'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover-lift">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl flex-shrink-0">
                  <ReceiptPercentIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('payroll.totalCommission') || 'Total Commission'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white truncate tabular-nums">
                    {formatPrice(summary.totalCommission || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-x-1 gap-y-0 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('staff')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === 'staff'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UsersIcon className="h-5 w-5" />
            {t('payroll.staffCommission') || 'Staff & Commission'}
          </button>
          <button
            onClick={() => setTab('runs')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === 'runs'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BanknotesIcon className="h-5 w-5" />
            {t('payroll.payRuns') || 'Pay Runs'}
          </button>
        </div>

        {/* ===================== STAFF TAB ===================== */}
        {tab === 'staff' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('payroll.staff') || 'Staff'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('payroll.commissionHint') || "Set each professional's commission as a % of completed service prices."}
              </p>
            </div>

            {staff.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <UsersIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('payroll.noStaff') || 'No staff found'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <th scope="col" className="px-6 py-3 font-medium">{t('payroll.name') || 'Name'}</th>
                        <th scope="col" className="px-6 py-3 font-medium">{t('payroll.role') || 'Role'}</th>
                        <th scope="col" className="px-6 py-3 font-medium">{t('payroll.commission') || 'Commission'}</th>
                        <th scope="col" className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {staff.map((s) => {
                        const d = getDraft(s.staffUserId);
                        return (
                        <tr key={s.staffUserId} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {getRoleLabel(s.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 min-w-[18rem]">
                            {/* Mode selector */}
                            <div className="flex items-center gap-2 mb-2">
                              <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                                {(['FLAT', 'TIERED'] as CommissionMode[]).map((m) => (
                                  <button
                                    key={m}
                                    type="button"
                                    onClick={() => setDraft(s.staffUserId, { mode: m })}
                                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                      d.mode === m
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {m === 'FLAT'
                                      ? (t('payroll.commission.flat') || 'Flat')
                                      : (t('payroll.commission.tiered') || 'Tiered')}
                                  </button>
                                ))}
                              </div>
                              <HelpTip size={15} title={t('help.tip.tieredCommission.title') || 'Commission mode'} content={t('help.tip.tieredCommission.body') || 'Flat = one % on all sales; Tiered = higher % as monthly revenue grows.'} />
                            </div>

                            {d.mode === 'FLAT' ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="100"
                                  value={d.percent ?? ''}
                                  onChange={(e) => setDraft(s.staffUserId, { percent: e.target.value })}
                                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                />
                                <span className="text-gray-500 dark:text-gray-400">%</span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {t('payroll.commission.tieredHint') || "Commission % is chosen by the staff member's total revenue in the pay period."}
                                </p>
                                {d.tiers.map((tr, idx) => (
                                  <div key={idx} className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        {t('payroll.commission.minRevenue') || 'Min revenue'}
                                      </span>
                                      <input
                                        type="number"
                                        step="1"
                                        min="0"
                                        value={tr.minRevenue}
                                        onChange={(e) => updateTierRow(s.staffUserId, idx, 'minRevenue', e.target.value)}
                                        className="w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        value={tr.percent}
                                        onChange={(e) => updateTierRow(s.staffUserId, idx, 'percent', e.target.value)}
                                        className="w-20 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                      />
                                      <span className="text-gray-500 dark:text-gray-400">%</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeTierRow(s.staffUserId, idx)}
                                      aria-label={t('common.delete') || 'Delete'}
                                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addTierRow(s.staffUserId)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                  {t('payroll.commission.addTier') || 'Add tier'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleSaveCommission(s.staffUserId)}
                              disabled={savingCommission === s.staffUserId}
                              className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                            >
                              {savingCommission === s.staffUserId && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                              {t('common.save') || 'Save'}
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden space-y-3 p-4">
                  {staff.map((s) => {
                    const d = getDraft(s.staffUserId);
                    return (
                      <div key={s.staffUserId} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words">{s.name}</p>
                          <span className="flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {getRoleLabel(s.role)}
                          </span>
                        </div>

                        {/* Commission editor */}
                        <div className="mt-3 space-y-3">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {t('payroll.commission') || 'Commission'}
                          </p>

                          {/* Mode toggle */}
                          <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                              {(['FLAT', 'TIERED'] as CommissionMode[]).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setDraft(s.staffUserId, { mode: m })}
                                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    d.mode === m
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {m === 'FLAT'
                                    ? (t('payroll.commission.flat') || 'Flat')
                                    : (t('payroll.commission.tiered') || 'Tiered')}
                                </button>
                              ))}
                            </div>
                            <HelpTip size={15} title={t('help.tip.tieredCommission.title') || 'Commission mode'} content={t('help.tip.tieredCommission.body') || 'Flat = one % on all sales; Tiered = higher % as monthly revenue grows.'} />
                          </div>

                          {d.mode === 'FLAT' ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={d.percent ?? ''}
                                onChange={(e) => setDraft(s.staffUserId, { percent: e.target.value })}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              />
                              <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">%</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {t('payroll.commission.tieredHint') || "Commission % is chosen by the staff member's total revenue in the pay period."}
                              </p>
                              {d.tiers.map((tr, idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                                      {t('payroll.commission.minRevenue') || 'Min revenue'}
                                    </span>
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      value={tr.minRevenue}
                                      onChange={(e) => updateTierRow(s.staffUserId, idx, 'minRevenue', e.target.value)}
                                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                                      {t('payroll.commission') || 'Commission'} %
                                    </span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="100"
                                      value={tr.percent}
                                      onChange={(e) => updateTierRow(s.staffUserId, idx, 'percent', e.target.value)}
                                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                    />
                                    <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">%</span>
                                    <button
                                      type="button"
                                      onClick={() => removeTierRow(s.staffUserId, idx)}
                                      aria-label={t('common.delete') || 'Delete'}
                                      className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addTierRow(s.staffUserId)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                <PlusIcon className="h-4 w-4" />
                                {t('payroll.commission.addTier') || 'Add tier'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Save action */}
                        <div className="mt-3 flex items-center justify-end border-t border-gray-100 dark:border-gray-700 pt-3">
                          <button
                            onClick={() => handleSaveCommission(s.staffUserId)}
                            disabled={savingCommission === s.staffUserId}
                            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            {savingCommission === s.staffUserId && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                            {t('common.save') || 'Save'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ===================== RUNS TAB ===================== */}
        {tab === 'runs' && (
          <>
            {/* Pay run builder */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('payroll.newPayRun') || 'New Pay Run'}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('payroll.periodStart') || 'Period start'}
                    </label>
                    <input
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('payroll.periodEnd') || 'Period end'}
                    </label>
                    <input
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('payroll.currency') || 'Currency'}
                    </label>
                    <select
                      value={runCurrency}
                      onChange={(e) => setRunCurrency(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                  <button
                    onClick={handlePreview}
                    disabled={previewing}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {previewing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <EyeIcon className="h-5 w-5" />}
                    {t('payroll.preview') || 'Preview'}
                  </button>
                </div>

                {runRows.length > 0 && (
                  <>
                    {/* Desktop preview table */}
                    <div className="hidden lg:block overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                            <th className="px-4 py-2">{t('payroll.name') || 'Name'}</th>
                            <th className="px-4 py-2 text-right">{t('payroll.baseSalary') || 'Base'}</th>
                            <th className="px-4 py-2 text-right">{t('payroll.commission') || 'Commission'}</th>
                            <th className="px-4 py-2 text-right">{t('payroll.bonus') || 'Bonus'}</th>
                            <th className="px-4 py-2 text-right">{t('payroll.deductions') || 'Deductions'}</th>
                            <th className="px-4 py-2 text-right">{t('payroll.tax') || 'Tax'}</th>
                            <th className="px-4 py-2 text-right">{t('payroll.netPay') || 'Net Pay'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {runRows.map((r, idx) => (
                            <tr key={r.staffUserId}>
                              <td className="px-4 py-2 align-middle">
                                <p className="font-medium text-gray-900 dark:text-white whitespace-nowrap">{r.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {getRoleLabel(r.role)} · {r.commissionPercent}%
                                  {r.mode === 'TIERED' && ` (${t('payroll.commission.tiered') || 'Tiered'})`}
                                </p>
                              </td>
                              {(['baseSalary', 'commissionTotal', 'bonus', 'deductions', 'taxAmount'] as const).map((field) => (
                                <td key={field} className="px-2 py-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={r[field]}
                                    onChange={(e) => updateRunRow(idx, { [field]: e.target.value })}
                                    className="w-24 px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                                  />
                                </td>
                              ))}
                              <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                {formatPrice(rowNet(r), asCurrency(runCurrency))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile preview cards */}
                    <div className="lg:hidden space-y-3">
                      {runRows.map((r, idx) => (
                        <div key={r.staffUserId} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          {/* Title */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white break-words">{r.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {getRoleLabel(r.role)} · {r.commissionPercent}%
                                {r.mode === 'TIERED' && ` (${t('payroll.commission.tiered') || 'Tiered'})`}
                              </p>
                            </div>
                            <p className="flex-shrink-0 font-bold text-gray-900 dark:text-white tabular-nums">
                              {formatPrice(rowNet(r), asCurrency(runCurrency))}
                            </p>
                          </div>

                          {/* Editable fields */}
                          <dl className="mt-3 space-y-2 text-sm">
                            {([
                              ['baseSalary', t('payroll.baseSalary') || 'Base'],
                              ['commissionTotal', t('payroll.commission') || 'Commission'],
                              ['bonus', t('payroll.bonus') || 'Bonus'],
                              ['deductions', t('payroll.deductions') || 'Deductions'],
                              ['taxAmount', t('payroll.tax') || 'Tax'],
                            ] as [keyof Pick<RunRow, 'baseSalary' | 'commissionTotal' | 'bonus' | 'deductions' | 'taxAmount'>, string][]).map(([field, label]) => (
                              <div key={field} className="flex items-center justify-between gap-3">
                                <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{label}</dt>
                                <dd className="min-w-0">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={r[field]}
                                    onChange={(e) => updateRunRow(idx, { [field]: e.target.value })}
                                    className="w-32 px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 tabular-nums"
                                  />
                                </dd>
                              </div>
                            ))}
                          </dl>

                          {/* Net pay row */}
                          <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {t('payroll.netPay') || 'Net Pay'}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white tabular-nums">
                              {formatPrice(rowNet(r), asCurrency(runCurrency))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('payroll.notes') || 'Notes'}
                      </label>
                      <textarea
                        value={runNotes}
                        onChange={(e) => setRunNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                      <p className="text-base font-semibold text-gray-900 dark:text-white break-words">
                        {t('payroll.runTotal') || 'Run total'}: {formatPrice(runTotal, asCurrency(runCurrency))}
                      </p>
                      <button
                        onClick={handleCreateRun}
                        disabled={creatingRun}
                        className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {creatingRun ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                        {t('payroll.createPayRun') || 'Create pay run'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status filter */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="w-full sm:flex-1 sm:max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('payroll.status') || 'Status'}
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as PayrollStatus | '')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('payroll.allStatuses') || 'All Statuses'}</option>
                    {PAYROLL_STATUSES.map((s) => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Records table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('payroll.records') || 'Payroll Records'}
                </h2>
              </div>

              {records.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <BanknotesIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('payroll.noRecords') || 'No payroll records yet'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop records table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          <th scope="col" className="px-6 py-3 font-medium">{t('payroll.name') || 'Name'}</th>
                          <th scope="col" className="px-6 py-3 font-medium">{t('payroll.period') || 'Period'}</th>
                          <th scope="col" className="px-6 py-3 font-medium">{t('payroll.status') || 'Status'}</th>
                          <th scope="col" className="px-6 py-3 font-medium text-right">{t('payroll.netPay') || 'Net Pay'}</th>
                          <th scope="col" className="px-6 py-3 font-medium text-right"><span className="sr-only">{t('common.actions') || 'Actions'}</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {records.map((rec) => {
                          const cur = asCurrency(rec.currency);
                          const isBusy = busyRecord === rec.id;
                          return (
                            <tr key={rec.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors align-top">
                              <td className="px-6 py-4">
                                <p className="font-medium text-gray-900 dark:text-white">{rec.staffName || rec.staffUserId}</p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                                {new Date(rec.periodStart).toLocaleDateString()} – {new Date(rec.periodEnd).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[rec.status]}`}>
                                  {getStatusLabel(rec.status)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                                {formatPrice(num(rec.netPay), cur)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    onClick={() => setViewRecord(rec)}
                                    aria-label={t('payroll.viewPayslip') || 'View payslip'}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </button>
                                  {rec.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleApprove(rec)}
                                      disabled={isBusy}
                                      aria-label={t('payroll.approve') || 'Approve'}
                                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
                                    >
                                      <CheckCircleIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  {rec.status === 'APPROVED' && (
                                    <button
                                      onClick={() => handleMarkPaid(rec)}
                                      disabled={isBusy}
                                      aria-label={t('payroll.markPaid') || 'Mark paid'}
                                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors disabled:opacity-50"
                                    >
                                      <BanknotesIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                  {rec.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleDelete(rec)}
                                      disabled={isBusy}
                                      aria-label={t('common.delete') || 'Delete'}
                                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                                    >
                                      {isBusy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile records cards */}
                  <div className="lg:hidden space-y-3 p-4">
                    {records.map((rec) => {
                      const cur = asCurrency(rec.currency);
                      const isBusy = busyRecord === rec.id;
                      return (
                        <div key={rec.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                          {/* Title row */}
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 flex-1 font-semibold text-gray-900 dark:text-white break-words">
                              {rec.staffName || rec.staffUserId}
                            </p>
                            <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[rec.status]}`}>
                              {getStatusLabel(rec.status)}
                            </span>
                          </div>

                          {/* Detail rows */}
                          <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('payroll.period') || 'Period'}</dt>
                              <dd className="min-w-0 text-right text-gray-900 dark:text-white break-words">
                                {new Date(rec.periodStart).toLocaleDateString()} – {new Date(rec.periodEnd).toLocaleDateString()}
                              </dd>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <dt className="flex-shrink-0 text-gray-500 dark:text-gray-400">{t('payroll.netPay') || 'Net Pay'}</dt>
                              <dd className="min-w-0 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                                {formatPrice(num(rec.netPay), cur)}
                              </dd>
                            </div>
                          </dl>

                          {/* Actions */}
                          <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                            <button
                              onClick={() => setViewRecord(rec)}
                              aria-label={t('payroll.viewPayslip') || 'View payslip'}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors"
                            >
                              <EyeIcon className="h-4 w-4" />
                              {t('payroll.viewPayslip') || 'View'}
                            </button>
                            {rec.status === 'DRAFT' && (
                              <button
                                onClick={() => handleApprove(rec)}
                                disabled={isBusy}
                                aria-label={t('payroll.approve') || 'Approve'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 border border-primary-200 dark:border-primary-800 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                {t('payroll.approve') || 'Approve'}
                              </button>
                            )}
                            {rec.status === 'APPROVED' && (
                              <button
                                onClick={() => handleMarkPaid(rec)}
                                disabled={isBusy}
                                aria-label={t('payroll.markPaid') || 'Mark paid'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:text-green-700 border border-green-200 dark:border-green-800 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <BanknotesIcon className="h-4 w-4" />
                                {t('payroll.markPaid') || 'Mark paid'}
                              </button>
                            )}
                            {rec.status === 'DRAFT' && (
                              <button
                                onClick={() => handleDelete(rec)}
                                disabled={isBusy}
                                aria-label={t('common.delete') || 'Delete'}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 border border-red-200 dark:border-red-800 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isBusy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <TrashIcon className="h-4 w-4" />}
                                {t('common.delete') || 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ===================== Payslip View Modal ===================== */}
        {viewRecord && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('payroll.payslip') || 'Payslip'}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {viewRecord.staffName || viewRecord.staffUserId}
                  </p>
                </div>
                <button
                  onClick={() => setViewRecord(null)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('payroll.period') || 'Period'}</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(viewRecord.periodStart).toLocaleDateString()} – {new Date(viewRecord.periodEnd).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('payroll.status') || 'Status'}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[viewRecord.status]}`}>
                    {getStatusLabel(viewRecord.status)}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
                  {[
                    { label: t('payroll.baseSalary') || 'Base salary', value: num(viewRecord.baseSalary), sign: 1 },
                    { label: t('payroll.commission') || 'Commission', value: num(viewRecord.commissionTotal), sign: 1 },
                    { label: t('payroll.bonus') || 'Bonus', value: num(viewRecord.bonus), sign: 1 },
                    { label: t('payroll.deductions') || 'Deductions', value: num(viewRecord.deductions), sign: -1 },
                    { label: t('payroll.tax') || 'Tax', value: num(viewRecord.taxAmount), sign: -1 },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{row.label}</span>
                      <span className={row.sign < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                        {row.sign < 0 ? '−' : ''}{formatPrice(row.value, asCurrency(viewRecord.currency))}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{t('payroll.netPay') || 'Net Pay'}</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(num(viewRecord.netPay), asCurrency(viewRecord.currency))}
                  </span>
                </div>

                {viewRecord.paidAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('payroll.paidOn') || 'Paid on'} {new Date(viewRecord.paidAt).toLocaleDateString()}
                  </p>
                )}
                {viewRecord.notes && (
                  <div className="text-sm">
                    <p className="text-gray-500 dark:text-gray-400">{t('payroll.notes') || 'Notes'}</p>
                    <p className="text-gray-900 dark:text-white">{viewRecord.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialistPayroll;
