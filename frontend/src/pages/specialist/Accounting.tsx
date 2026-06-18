// Specialist Accounting page — P&L, tax estimator, invoices, CSV export.
// All sections share a period picker (defaults to current month).

import React, { useEffect, useMemo, useState } from 'react';
import { confirm } from '@/components/ui/Confirm';
import { toast } from 'react-toastify';
import {
  accountingService,
  type ProfitLoss,
  type TaxComputation,
  type TaxRegime,
  type VatSummary,
  type AccountingScope,
  type Invoice,
  type InvoiceLineItem,
  type InvoiceStatus,
  type CreateInvoiceInput,
} from '../../services/accounting.service';
import { businessService } from '../../services/business.service';
import { PageLoader } from '@/components/ui';
import { HelpTip } from '@/components/common/HelpTip';
import { useLanguage } from '@/contexts/LanguageContext';
import { userService } from '../../services/user.service';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { selectUser, updateUserProfile } from '@/store/slices/authSlice';

type Tab = 'pnl' | 'tax' | 'invoices' | 'export' | 'settings';

function startOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d = new Date()) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); }
function toInputDate(d: Date) { return d.toISOString().slice(0, 10); }
function fromInputDate(s: string) { return new Date(s + 'T00:00:00'); }
function fmtMoney(n: number, currency = 'UAH') {
  // currency can be a user-entered/invalid ISO code — Intl throws RangeError on bad codes.
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);
  } catch {
    return `${(n || 0).toFixed(2)} ${currency || ''}`.trim();
  }
}

// Friendly label for an expense category. PAYROLL/PURCHASES are synthetic
// roll-up categories from the new salon-suite modules; everything else passes
// through as-is.
function categoryLabel(category: string, t: (k: string) => string): string {
  if (category === 'PAYROLL') return t('accounting.pnl.payroll');
  if (category === 'PURCHASES') return t('accounting.pnl.purchases');
  return category;
}

const Accounting: React.FC = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('pnl');
  const [from, setFrom] = useState<Date>(startOfMonth());
  const [to, setTo] = useState<Date>(endOfMonth());
  const [scope, setScope] = useState<AccountingScope>('self');
  // Whether the user OWNs at least one business — controls the scope toggle.
  const [ownsBusiness, setOwnsBusiness] = useState(false);

  useEffect(() => {
    businessService.listMine()
      .then((memberships) => {
        setOwnsBusiness(memberships.some((m) => m.role === 'OWNER' && m.isActive));
      })
      .catch(() => setOwnsBusiness(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-6xl mx-auto px-4">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('accounting.title')}</h1>
              <HelpTip title={t('help.accounting.title') || 'Accounting'} content={t('help.accounting.body') || 'Tax estimates and financial summaries for your business.'} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('accounting.subtitle')}</p>
          </div>
          {ownsBusiness && <ScopeToggle scope={scope} onChange={setScope} />}
        </header>

        <PeriodPicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />

        <Tabs current={tab} onChange={setTab} />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {tab === 'pnl' && <PnlPanel from={from} to={to} scope={scope} />}
          {tab === 'tax' && <TaxPanel from={from} to={to} scope={scope} />}
          {tab === 'invoices' && <InvoicesPanel />}
          {tab === 'export' && <ExportPanel from={from} to={to} />}
          {tab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// Scope toggle — "Just me" vs "This business (all staff)". Only rendered for
// users who own a business.
const ScopeToggle: React.FC<{ scope: AccountingScope; onChange: (s: AccountingScope) => void }> = ({ scope, onChange }) => {
  const { t } = useLanguage();
  const opts: Array<[AccountingScope, string]> = [
    ['self', t('accounting.scope.self')],
    ['business', t('accounting.scope.business')],
  ];
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
      {opts.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-3 py-1.5 font-medium transition-colors ${
            scope === k
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const PeriodPicker: React.FC<{ from: Date; to: Date; onChange: (f: Date, t: Date) => void }> = ({ from, to, onChange }) => {
  const { t } = useLanguage();
  const setPreset = (kind: 'mtd' | 'qtd' | 'ytd' | 'last_month') => {
    const now = new Date();
    if (kind === 'mtd') return onChange(startOfMonth(now), endOfMonth(now));
    if (kind === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return onChange(lm, new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999));
    }
    if (kind === 'qtd') {
      const q = Math.floor(now.getMonth() / 3);
      return onChange(new Date(now.getFullYear(), q * 3, 1), endOfMonth(now));
    }
    if (kind === 'ytd') return onChange(new Date(now.getFullYear(), 0, 1), endOfMonth(now));
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4 flex flex-wrap items-center gap-3">
      <label className="text-sm text-gray-700 dark:text-gray-200">
        {t('accounting.period.from')} <input type="date" value={toInputDate(from)} onChange={(e) => onChange(fromInputDate(e.target.value), to)} className="ml-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm" />
      </label>
      <label className="text-sm text-gray-700 dark:text-gray-200">
        {t('accounting.period.to')} <input type="date" value={toInputDate(to)} onChange={(e) => onChange(from, fromInputDate(e.target.value))} className="ml-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm" />
      </label>
      <div className="flex gap-1 ml-auto">
        {[['mtd', t('accounting.period.thisMonth')], ['last_month', t('accounting.period.lastMonth')], ['qtd', t('accounting.period.quarter')], ['ytd', t('accounting.period.year')]].map(([k, l]) => (
          <button key={k} onClick={() => setPreset(k as any)} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600">{l}</button>
        ))}
      </div>
    </div>
  );
};

const Tabs: React.FC<{ current: Tab; onChange: (t: Tab) => void }> = ({ current, onChange }) => {
  const { t } = useLanguage();
  const tabs: Array<[Tab, string]> = [
    ['pnl', t('accounting.tab.pnl')],
    ['tax', t('accounting.tab.tax')],
    ['invoices', t('accounting.tab.invoices')],
    ['export', t('accounting.tab.export')],
    ['settings', t('profile.tax.section')],
  ];
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex flex-nowrap gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              current === k
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const PnlPanel: React.FC<{ from: Date; to: Date; scope: AccountingScope }> = ({ from, to, scope }) => {
  const { t } = useLanguage();
  const [data, setData] = useState<ProfitLoss | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    accountingService.getProfitLoss(from, to, undefined, scope)
      .then(setData)
      .catch((err) => toast.error(err?.message || t('accounting.pnl.failedLoad')))
      .finally(() => setLoading(false));
  }, [from.getTime(), to.getTime(), scope]);

  if (loading) return <PageLoader />;
  if (!data) return <p className="text-gray-500">{t('accounting.noData')}</p>;
  const c = data.currency;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label={t('accounting.pnl.grossIncome')} value={fmtMoney(data.totals.grossIncome, c)} hint={`${data.income.completedBookings} ${t('accounting.pnl.bookings')} · ${data.income.invoicesPaid} ${t('accounting.pnl.invoices')}`} />
        <Stat label={t('accounting.pnl.expenses')} value={fmtMoney(data.expenses.total, c)} hint={`${fmtMoney(data.totals.deductibleExpenses, c)} ${t('accounting.pnl.deductible')}`} />
        <Stat label={t('accounting.pnl.grossProfit')} value={fmtMoney(data.totals.grossProfit, c)} positive={data.totals.grossProfit >= 0} />
        <Stat label={t('accounting.pnl.netBeforeTax')} value={fmtMoney(data.totals.netBeforeTax, c)} positive={data.totals.netBeforeTax >= 0} />
      </div>

      <Section title={t('accounting.pnl.income')}>
        <RowKV k={t('accounting.pnl.completedBookings')} v={fmtMoney(data.income.completedBookingsRevenue, c)} />
        <RowKV k={t('accounting.pnl.paidInvoices')} v={fmtMoney(data.income.invoicesPaidRevenue, c)} />
        <RowKV k={t('accounting.pnl.pendingBookings')} v={fmtMoney(data.income.pendingBookingsRevenue, c)} muted />
      </Section>

      <Section title={t('accounting.pnl.byCategory')}>
        {data.expenses.byCategory.length === 0 && <p className="text-sm text-gray-500">{t('accounting.pnl.noExpenses')}</p>}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {data.expenses.byCategory.map((row) => (
            <div key={row.category} className="flex justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{categoryLabel(row.category, t)}</div>
                <div className="text-xs text-gray-500 break-words">{row.count} {t('accounting.pnl.entries')} · {fmtMoney(row.deductible, c)} {t('accounting.pnl.deductible')}</div>
              </div>
              <div className="flex-shrink-0 font-mono tabular-nums text-gray-900 dark:text-gray-100">{fmtMoney(row.total, c)}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const TaxPanel: React.FC<{ from: Date; to: Date; scope: AccountingScope }> = ({ from, to, scope }) => {
  const { t } = useLanguage();
  const [regimes, setRegimes] = useState<TaxRegime[]>([]);
  const [regime, setRegime] = useState<string>('');
  const [data, setData] = useState<TaxComputation | null>(null);
  const [vat, setVat] = useState<VatSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountingService.getTaxRegimes().then(setRegimes).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    accountingService.getTaxEstimate(from, to, regime || undefined, undefined, scope)
      .then((d) => { setData(d); if (!regime) setRegime(d.regime); })
      .catch((err) => toast.error(err?.message || t('accounting.tax.failedLoad')))
      .finally(() => setLoading(false));
  }, [from.getTime(), to.getTime(), regime, scope]);

  useEffect(() => {
    accountingService.getVatSummary(from, to, undefined, scope)
      .then(setVat)
      .catch(() => setVat(null));
  }, [from.getTime(), to.getTime(), scope]);

  if (loading && !data) return <PageLoader />;
  if (!data) return <p className="text-gray-500">{t('accounting.noData')}</p>;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm text-gray-700 dark:text-gray-200">
          {t('accounting.tax.regime')}
          <select
            value={regime}
            onChange={(e) => setRegime(e.target.value)}
            className="ml-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm min-w-[180px] sm:min-w-[280px] max-w-full"
          >
            {regimes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label={t('accounting.tax.totalTax')} value={fmtMoney(data.totalTax)} negative={data.totalTax > 0} />
        <Stat label={t('accounting.tax.taxableBase')} value={fmtMoney(data.taxableBase)} />
        <Stat label={t('accounting.tax.netAfterTax')} value={fmtMoney(data.netIncome)} positive={data.netIncome >= 0} />
      </div>

      <Section title={data.regimeLabel}>
        {data.lines.length === 0
          ? <p className="text-sm text-gray-500">{t('accounting.tax.noLines')}</p>
          : <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {data.lines.map((l, i) => (
                <div key={i} className="py-3">
                  <div className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0 font-medium text-gray-900 dark:text-gray-100 truncate">{l.name}</div>
                    <div className="flex-shrink-0 font-mono tabular-nums text-gray-900 dark:text-gray-100">{fmtMoney(l.amount)}</div>
                  </div>
                  <div className="text-xs text-gray-500 break-words">{l.description}</div>
                </div>
              ))}
            </div>}
      </Section>

      {vat && (
        <Section title={t('accounting.vat.title')}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Stat label={t('accounting.vat.collected')} value={fmtMoney(vat.vatCollected, vat.currency)} />
            <Stat label={t('accounting.vat.paid')} value={fmtMoney(vat.vatPaid, vat.currency)} />
            <Stat label={t('accounting.vat.netDue')} value={fmtMoney(vat.netVatDue, vat.currency)} negative={vat.netVatDue > 0} positive={vat.netVatDue < 0} />
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('accounting.vat.hint')}</p>
        </Section>
      )}

      {data.notes.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase mb-2">{t('accounting.tax.notes')}</div>
          <ul className="text-sm text-amber-900 dark:text-amber-200 list-disc list-inside space-y-1">
            {data.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const InvoicesPanel: React.FC = () => {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const reload = () => {
    setLoading(true);
    accountingService.listInvoices()
      .then(setInvoices)
      .catch((err) => toast.error(err?.message || t('accounting.invoices.failedLoad')))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const statusColor = (s: InvoiceStatus) => ({
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    VOID: 'bg-gray-100 text-gray-500',
  })[s];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('accounting.invoices.title')}</h2>
        <button onClick={() => setCreating(true)} className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-primary-700">{t('accounting.invoices.new')}</button>
      </div>

      {loading ? <PageLoader /> : invoices.length === 0
        ? <p className="text-sm text-gray-500 py-8 text-center">{t('accounting.invoices.empty')}</p>
        : <>
            {/* Mobile: card list (the 7-col table is unreadable < lg) */}
            <div className="lg:hidden space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white truncate">{inv.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs flex-shrink-0 ${statusColor(inv.status)}`}>{inv.status}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 truncate">{inv.clientName}</div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 gap-2">
                    <span className="truncate">{t('accounting.invoices.col.issued')}: {inv.issueDate.slice(0, 10)}</span>
                    <span className="truncate">{t('accounting.invoices.col.due')}: {inv.dueDate?.slice(0, 10) ?? '—'}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono font-semibold text-gray-900 dark:text-white">{fmtMoney(inv.total, inv.currency)}</span>
                  </div>
                  <div className="mt-2"><InvoiceActions invoice={inv} onChanged={reload} /></div>
                </div>
              ))}
            </div>
            {/* Desktop: full table */}
            <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-700">
                <tr><th className="py-2">{t('accounting.invoices.col.number')}</th><th>{t('accounting.invoices.col.client')}</th><th>{t('accounting.invoices.col.issued')}</th><th>{t('accounting.invoices.col.due')}</th><th className="text-right">{t('accounting.invoices.col.total')}</th><th>{t('accounting.invoices.col.status')}</th><th></th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-2 font-mono">{inv.invoiceNumber}</td>
                    <td>{inv.clientName}</td>
                    <td className="text-gray-500">{inv.issueDate.slice(0, 10)}</td>
                    <td className="text-gray-500">{inv.dueDate?.slice(0, 10) ?? '—'}</td>
                    <td className="text-right font-mono">{fmtMoney(inv.total, inv.currency)}</td>
                    <td><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(inv.status)}`}>{inv.status}</span></td>
                    <td>
                      <InvoiceActions invoice={inv} onChanged={reload} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>}

      {creating && <InvoiceForm onClose={() => { setCreating(false); reload(); }} />}
    </div>
  );
};

const InvoiceActions: React.FC<{ invoice: Invoice; onChanged: () => void }> = ({ invoice, onChanged }) => {
  const { t } = useLanguage();
  const mark = async (status: InvoiceStatus) => {
    try {
      await accountingService.updateInvoiceStatus(invoice.id, status);
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || t('accounting.invoices.updateFailed'));
    }
  };
  const del = async () => {
    if (!await confirm(t('accounting.invoices.confirmDelete'))) return;
    try { await accountingService.deleteInvoice(invoice.id); onChanged(); }
    catch (err: any) { toast.error(err?.message || t('accounting.invoices.deleteFailed')); }
  };
  return (
    <div className="flex gap-1 text-xs">
      {invoice.status === 'DRAFT' && <button onClick={() => mark('SENT')} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">{t('accounting.invoices.markSent')}</button>}
      {(['SENT', 'PARTIAL', 'OVERDUE'].includes(invoice.status)) && <button onClick={() => mark('PAID')} className="px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200">{t('accounting.invoices.markPaid')}</button>}
      {invoice.status === 'DRAFT' && <button onClick={del} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">{t('accounting.invoices.delete')}</button>}
    </div>
  );
};

const InvoiceForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useLanguage();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [currency, setCurrency] = useState('UAH');
  const [taxRatePct, setTaxRatePct] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<InvoiceLineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
    const tax = subtotal * (taxRatePct / 100);
    return { subtotal, tax, total: subtotal + tax };
  }, [lines, taxRatePct]);

  const submit = async () => {
    if (!clientName.trim()) { toast.error(t('accounting.invoices.clientNameRequired')); return; }
    if (lines.length === 0 || lines.some((l) => !l.description.trim())) { toast.error(t('accounting.invoices.lineDescriptionRequired')); return; }
    setSaving(true);
    try {
      const input: CreateInvoiceInput = {
        clientName, clientEmail: clientEmail || undefined, currency,
        lineItems: lines.map((l) => ({ description: l.description, quantity: Number(l.quantity), unitPrice: Number(l.unitPrice) })),
        taxRatePct, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined, notes: notes || undefined,
      };
      await accountingService.createInvoice(input);
      toast.success(t('accounting.invoices.created'));
      onClose();
    } catch (err: any) {
      toast.error(err?.message || t('accounting.invoices.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('accounting.invoices.modal.title')}</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label={t('accounting.invoices.modal.clientName')} value={clientName} onChange={setClientName} />
            <Input label={t('accounting.invoices.modal.clientEmail')} value={clientEmail} onChange={setClientEmail} type="email" />
            <Input label={t('accounting.invoices.modal.currency')} value={currency} onChange={setCurrency} />
            <Input label={t('accounting.invoices.modal.taxRate')} value={String(taxRatePct)} onChange={(v) => setTaxRatePct(Number(v) || 0)} type="number" />
            <Input label={t('accounting.invoices.modal.dueDate')} value={dueDate} onChange={setDueDate} type="date" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('accounting.invoices.modal.lineItems')}</label>
              <button onClick={() => setLines([...lines, { description: '', quantity: 1, unitPrice: 0 }])} className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded">{t('accounting.invoices.modal.addLine')}</button>
            </div>
            {lines.map((l, i) => (
              <div key={i} className="flex flex-col gap-2 mb-2 sm:grid sm:grid-cols-12">
                <input className="w-full sm:col-span-6 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm" placeholder={t('accounting.invoices.modal.description')} value={l.description} onChange={(e) => { const c = [...lines]; c[i] = { ...c[i], description: e.target.value }; setLines(c); }} />
                <div className="flex gap-2 sm:contents">
                  <input className="flex-1 sm:col-span-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm" type="number" placeholder={t('accounting.invoices.modal.qty')} value={l.quantity} onChange={(e) => { const c = [...lines]; c[i] = { ...c[i], quantity: Number(e.target.value) }; setLines(c); }} />
                  <input className="flex-1 sm:col-span-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm" type="number" placeholder={t('accounting.invoices.modal.unitPrice')} value={l.unitPrice} onChange={(e) => { const c = [...lines]; c[i] = { ...c[i], unitPrice: Number(e.target.value) }; setLines(c); }} />
                  <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="flex-shrink-0 sm:col-span-1 text-red-500 hover:text-red-700 px-1">×</button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('accounting.invoices.modal.notes')}</label>
            <textarea className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 text-sm space-y-1">
            <div className="flex justify-between gap-3"><span className="flex-shrink-0">{t('accounting.invoices.modal.subtotal')}</span><span className="min-w-0 truncate text-right font-mono tabular-nums">{fmtMoney(totals.subtotal, currency)}</span></div>
            <div className="flex justify-between gap-3 text-gray-500"><span className="flex-shrink-0">{t('accounting.invoices.modal.tax')} ({taxRatePct}%)</span><span className="min-w-0 truncate text-right font-mono tabular-nums">{fmtMoney(totals.tax, currency)}</span></div>
            <div className="flex justify-between gap-3 font-semibold text-base"><span className="flex-shrink-0">{t('accounting.invoices.modal.total')}</span><span className="min-w-0 truncate text-right font-mono tabular-nums">{fmtMoney(totals.total, currency)}</span></div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded">{t('common.cancel')}</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">{saving ? t('accounting.invoices.modal.saving') : t('accounting.invoices.modal.create')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const ExportPanel: React.FC<{ from: Date; to: Date }> = ({ from, to }) => {
  const { t } = useLanguage();
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await accountingService.downloadCsv(from, to, { income: includeIncome, expenses: includeExpenses });
    } catch (err: any) {
      toast.error(err?.message || t('accounting.export.downloadFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('accounting.export.description')}
      </p>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
          <input type="checkbox" checked={includeIncome} onChange={(e) => setIncludeIncome(e.target.checked)} />
          {t('accounting.export.income')}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
          <input type="checkbox" checked={includeExpenses} onChange={(e) => setIncludeExpenses(e.target.checked)} />
          {t('accounting.export.expenses')}
        </label>
      </div>
      <button onClick={download} disabled={busy || (!includeIncome && !includeExpenses)} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
        {busy ? t('accounting.export.downloading') : t('accounting.export.download')}
      </button>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// Tax settings — picks the default regime + tax ID that the tax estimator
// uses. Stored on the User row (taxRegime, taxId fields).
const SettingsPanel: React.FC = () => {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const [regimes, setRegimes] = useState<TaxRegime[]>([]);
  const [regime, setRegime] = useState<string>(((currentUser as any)?.taxRegime as string) || '');
  const [taxId, setTaxId] = useState<string>(((currentUser as any)?.taxId as string) || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    accountingService.getTaxRegimes().then(setRegimes).catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        taxRegime: regime || null,
        taxId: taxId.trim() || null,
      });
      // Keep auth-store user in sync so other tabs immediately reflect the new regime.
      dispatch(updateUserProfile(updated as any));
      toast.success(t('accounting.settings.saved'));
    } catch (err: any) {
      toast.error(err?.message || t('accounting.settings.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-xl">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {t('accounting.settings.description')}
      </p>

      <label className="block">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('profile.tax.regime')}</span>
        <select
          value={regime}
          onChange={(e) => setRegime(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm"
        >
          <option value="">{t('profile.tax.regimeNone')}</option>
          {regimes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        <span className="block text-xs text-gray-500 mt-1">{t('profile.tax.regimeHint')}</span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('profile.tax.taxId')}</span>
        <input
          type="text"
          value={taxId}
          onChange={(e) => setTaxId(e.target.value)}
          placeholder="EDRPOU / TIN"
          maxLength={40}
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-3 py-2 text-sm font-mono"
        />
        <span className="block text-xs text-gray-500 mt-1">{t('profile.tax.taxIdHint')}</span>
      </label>

      <div className="pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? t('businesses.settings.saving') : t('businesses.settings.save')}
        </button>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
const Stat: React.FC<{ label: string; value: string; hint?: string; positive?: boolean; negative?: boolean }> = ({ label, value, hint, positive, negative }) => (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
    <div className="text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wider">{label}</div>
    <div className={`text-xl font-bold truncate tabular-nums ${positive ? 'text-green-600' : negative ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</div>
    {hint && <div className="text-xs text-gray-500">{hint}</div>}
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider mb-2">{title}</h3>
    <div className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">{children}</div>
  </div>
);

const RowKV: React.FC<{ k: string; v: string; muted?: boolean }> = ({ k, v, muted }) => (
  <div className="flex justify-between gap-3 py-1 text-sm">
    <span className={`flex-shrink-0 ${muted ? 'text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>{k}</span>
    <span className={`min-w-0 truncate text-right font-mono tabular-nums ${muted ? 'text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{v}</span>
  </div>
);

const Input: React.FC<{ label: string; value: string; onChange: (v: string) => void; type?: string }> = ({ label, value, onChange, type = 'text' }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</span>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded px-2 py-1 text-sm" />
  </label>
);

export default Accounting;
