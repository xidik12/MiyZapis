import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Building2,
  Flame,
  Package,
  Wrench,
  Shield,
  Megaphone,
  Users,
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  X,
  Calendar as CalendarIcon,
  RefreshCw,
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
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { financesStrings, commonStrings } from '@/utils/translations';

const CATEGORIES = [
  { key: 'RENT', icon: Building2, color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', barColor: 'bg-blue-500' },
  { key: 'UTILITIES', icon: Flame, color: 'bg-orange-500/15 text-orange-400 border-orange-500/20', barColor: 'bg-orange-500' },
  { key: 'CONSUMABLES', icon: Package, color: 'bg-green-500/15 text-green-400 border-green-500/20', barColor: 'bg-green-500' },
  { key: 'EQUIPMENT', icon: Wrench, color: 'bg-purple-500/15 text-purple-400 border-purple-500/20', barColor: 'bg-purple-500' },
  { key: 'INSURANCE', icon: Shield, color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20', barColor: 'bg-indigo-500' },
  { key: 'MARKETING', icon: Megaphone, color: 'bg-pink-500/15 text-pink-400 border-pink-500/20', barColor: 'bg-pink-500' },
  { key: 'SALARIES', icon: Users, color: 'bg-teal-500/15 text-teal-400 border-teal-500/20', barColor: 'bg-teal-500' },
  { key: 'OTHER', icon: MoreHorizontal, color: 'bg-gray-500/15 text-gray-400 border-gray-500/20', barColor: 'bg-gray-500' },
];

const getCategoryMeta = (key: string) =>
  CATEGORIES.find(c => c.key === key) || CATEGORIES[CATEGORIES.length - 1];

interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  date: string;
  recurring?: boolean;
  frequency?: string;
  notes?: string;
}

interface ExpenseSummary {
  total: number;
  thisMonth: number;
  categoryBreakdown: { category: string; amount: number }[];
}

export const SpecialistFinancesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({ total: 0, thisMonth: 0, categoryBreakdown: [] });

  // Sheet state
  const [showSheet, setShowSheet] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formCategory, setFormCategory] = useState('OTHER');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formRecurring, setFormRecurring] = useState(false);
  const [formFrequency, setFormFrequency] = useState('monthly');

  const s = useCallback((key: string) => t(financesStrings, key, locale), [locale]);
  const c = useCallback((key: string) => t(commonStrings, key, locale), [locale]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [expensesRes, summaryRes] = await Promise.allSettled([
        apiService.getExpenses({ limit: 50, sortBy: 'date', sortOrder: 'desc' }),
        apiService.getExpenseSummary(),
      ]);

      if (expensesRes.status === 'fulfilled' && expensesRes.value) {
        const raw = expensesRes.value as any;
        const items = raw?.items || raw?.expenses || (Array.isArray(raw) ? raw : []);
        setExpenses(items);
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        const raw = summaryRes.value as any;
        setSummary({
          total: Number(raw?.total ?? raw?.totalExpenses ?? 0),
          thisMonth: Number(raw?.thisMonth ?? raw?.currentMonth ?? 0),
          categoryBreakdown: raw?.categoryBreakdown || raw?.byCategory || [],
        });
      }
    } catch {
      setError(s('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [s]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditingExpense(null);
    setFormCategory('OTHER');
    setFormAmount('');
    setFormDescription('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormRecurring(false);
    setFormFrequency('monthly');
    setShowSheet(true);
    hapticFeedback.impactLight();
  };

  const openEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setFormCategory(exp.category);
    setFormAmount(String(exp.amount));
    setFormDescription(exp.description || '');
    setFormDate(exp.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    setFormRecurring(exp.recurring || false);
    setFormFrequency(exp.frequency || 'monthly');
    setShowSheet(true);
    hapticFeedback.impactLight();
  };

  const handleSave = async () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) return;

    try {
      setSaving(true);
      const data = {
        category: formCategory,
        amount,
        description: formDescription || undefined,
        date: formDate,
        recurring: formRecurring,
        frequency: formRecurring ? formFrequency : undefined,
      };

      if (editingExpense) {
        await apiService.updateExpense(editingExpense.id, data);
        dispatch(addToast({ type: 'success', message: s('expenseUpdated') }));
      } else {
        await apiService.createExpense(data);
        dispatch(addToast({ type: 'success', message: s('expenseCreated') }));
      }
      setShowSheet(false);
      fetchData();
    } catch {
      dispatch(addToast({ type: 'error', message: s('saveFailed') }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiService.deleteExpense(deleteTarget.id);
      dispatch(addToast({ type: 'success', message: s('expenseDeleted') }));
      setDeleteTarget(null);
      fetchData();
    } catch {
      dispatch(addToast({ type: 'error', message: s('deleteFailed') }));
    }
  };

  const maxCategoryAmount = Math.max(...summary.categoryBreakdown.map(c => c.amount), 1);

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-bg-card/80 rounded-2xl border border-white/5 p-4 animate-pulse">
                <div className="h-6 w-12 bg-bg-secondary rounded mb-1" />
                <div className="h-3 w-16 bg-bg-secondary rounded" />
              </div>
            ))}
          </div>
          <div className="bg-bg-card/80 rounded-2xl border border-white/5 p-4 animate-pulse">
            <div className="h-5 w-40 bg-bg-secondary rounded mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="h-4 w-20 bg-bg-secondary rounded" />
                <div className="flex-1 h-4 bg-bg-secondary rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={s('title')} showBackButton />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-3 text-accent-red" />
            <p className="text-accent-red mb-2">{c('error')}</p>
            <p className="text-sm text-text-muted mb-4">{error}</p>
            <Button onClick={fetchData}>{c('retry')}</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={s('title')} showBackButton />

      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-4 page-stagger">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
              <div className="text-xl font-bold text-accent-red">{formatCurrency(summary.total, undefined, locale)}</div>
              <div className="text-xs text-text-secondary">{s('totalExpenses')}</div>
            </Card>
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
              <div className="text-xl font-bold text-accent-primary">{formatCurrency(summary.thisMonth, undefined, locale)}</div>
              <div className="text-xs text-text-secondary">{s('thisMonth')}</div>
            </Card>
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4 text-center">
              <div className="text-xl font-bold text-text-primary">{summary.categoryBreakdown.length}</div>
              <div className="text-xs text-text-secondary">{s('categories')}</div>
            </Card>
          </div>

          {/* Category Breakdown */}
          {summary.categoryBreakdown.length > 0 && (
            <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
              <h3 className="font-semibold text-text-primary flex items-center gap-2 mb-4">
                <Receipt size={18} className="text-accent-primary" />
                {s('byCategory')}
              </h3>
              <div className="space-y-3">
                {summary.categoryBreakdown.map((cat) => {
                  const meta = getCategoryMeta(cat.category);
                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary font-medium flex items-center gap-1.5">
                          <meta.icon size={14} />
                          {s(cat.category.toLowerCase())}
                        </span>
                        <span className="text-text-primary font-semibold">
                          {formatCurrency(cat.amount, undefined, locale)}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full ${meta.barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max((cat.amount / maxCategoryAmount) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Add Expense Button */}
          <Button className="w-full" onClick={openAdd}>
            <Plus size={18} className="mr-2" />
            {s('addExpense')}
          </Button>

          {/* Expense List */}
          <Card className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
            <h3 className="font-semibold text-text-primary mb-4">{s('expenseList')}</h3>

            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <Receipt size={48} className="mx-auto mb-3 text-text-muted" />
                <p className="text-sm text-text-secondary">{s('noExpenses')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => {
                  const meta = getCategoryMeta(exp.category);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${meta.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary truncate">
                            {exp.description || s(exp.category.toLowerCase())}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <CalendarIcon size={10} />
                            <span>{exp.date?.slice(0, 10)}</span>
                            {exp.recurring && (
                              <span className="flex items-center gap-0.5 text-accent-primary">
                                <RefreshCw size={10} />
                                {s(exp.frequency || 'monthly')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="font-semibold text-accent-red whitespace-nowrap">
                          -{formatCurrency(exp.amount, undefined, locale)}
                        </span>
                        <button
                          onClick={() => openEdit(exp)}
                          className="p-1.5 rounded-lg hover:bg-bg-hover/50 text-text-muted"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(exp); hapticFeedback.impactLight(); }}
                          className="p-1.5 rounded-lg hover:bg-bg-hover/50 text-accent-red"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Add/Edit Sheet */}
      {showSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowSheet(false)}>
          <div
            className="bg-bg-card w-full max-w-lg rounded-t-2xl border-t border-white/10 p-5 space-y-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                {editingExpense ? s('editExpense') : s('addExpense')}
              </h3>
              <button onClick={() => setShowSheet(false)} className="p-1 text-text-muted">
                <X size={20} />
              </button>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">{s('category')}</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setFormCategory(cat.key)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all ${
                        isSelected
                          ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                          : 'border-white/5 bg-bg-secondary/50 text-text-secondary'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="truncate w-full text-center">{s(cat.key.toLowerCase())}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">{s('amount')}</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">{s('description')}</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={s('descriptionPlaceholder')}
                className="w-full bg-bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">{s('date')}</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>

            {/* Recurring toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">{s('recurring')}</span>
              <button
                onClick={() => setFormRecurring(!formRecurring)}
                className={`w-12 h-7 rounded-full transition-colors ${formRecurring ? 'bg-accent-primary' : 'bg-bg-secondary'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${formRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {formRecurring && (
              <div>
                <label className="text-sm text-text-secondary mb-1.5 block">{s('frequency')}</label>
                <select
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="w-full bg-bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-primary"
                >
                  <option value="weekly">{s('weekly')}</option>
                  <option value="monthly">{s('monthly')}</option>
                  <option value="quarterly">{s('quarterly')}</option>
                  <option value="yearly">{s('yearly')}</option>
                </select>
              </div>
            )}

            <Button className="w-full" onClick={handleSave} disabled={saving || !formAmount}>
              {saving ? c('loading') : c('save')}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-bg-card rounded-2xl border border-white/10 p-6 mx-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{s('confirmDelete')}</h3>
            <p className="text-sm text-text-secondary mb-4">{s('confirmDeleteDesc')}</p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteTarget(null)}>
                {c('cancel')}
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete}>
                {c('delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
