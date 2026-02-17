import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import {
  expenseService,
  Expense,
  ExpenseSummary,
  ExpenseCategory,
  RecurringFrequency,
  EXPENSE_CATEGORIES,
  RECURRING_FREQUENCIES,
  CATEGORY_CONFIG,
  CreateExpenseData
} from '../../services/expense.service';
import { PageLoader } from '@/components/ui';
import { toast } from 'react-toastify';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  FireIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  UserGroupIcon,
  EllipsisHorizontalIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

// Category icon mapping
const getCategoryIcon = (category: ExpenseCategory) => {
  const iconMap: Record<ExpenseCategory, React.ComponentType<any>> = {
    RENT: BuildingOfficeIcon,
    UTILITIES: FireIcon,
    CONSUMABLES: CubeIcon,
    EQUIPMENT: WrenchScrewdriverIcon,
    INSURANCE: ShieldCheckIcon,
    MARKETING: MegaphoneIcon,
    SALARIES: UserGroupIcon,
    OTHER: EllipsisHorizontalIcon
  };
  return iconMap[category] || EllipsisHorizontalIcon;
};

interface ExpenseFormData {
  category: ExpenseCategory;
  amount: string;
  currency: string;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | '';
  notes: string;
}

const initialFormData: ExpenseFormData = {
  category: 'OTHER',
  amount: '',
  currency: 'UAH',
  description: '',
  date: new Date().toISOString().split('T')[0],
  isRecurring: false,
  recurringFrequency: '',
  notes: ''
};

const SpecialistFinances: React.FC = () => {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  // State
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [filterCategory, filterStartDate, filterEndDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Build filters
      const filters: any = { limit: 50, sortBy: 'date', sortOrder: 'desc' };
      if (filterCategory) filters.category = filterCategory;
      if (filterStartDate) filters.startDate = new Date(filterStartDate).toISOString();
      if (filterEndDate) filters.endDate = new Date(filterEndDate).toISOString();

      // Load expenses and summary in parallel
      const [expensesResponse, summaryResponse] = await Promise.all([
        expenseService.getExpenses(filters),
        expenseService.getExpenseSummary(
          filterStartDate ? new Date(filterStartDate).toISOString() : undefined,
          filterEndDate ? new Date(filterEndDate).toISOString() : undefined
        )
      ]);

      setExpenses(expensesResponse.expenses || []);
      setSummary(summaryResponse);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      toast.error(t('finances.loadError') || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for new expense
  const handleAddExpense = () => {
    setEditingExpense(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      amount: String(expense.amount || ''),
      currency: expense.currency,
      description: expense.description,
      date: new Date(expense.date).toISOString().split('T')[0],
      isRecurring: expense.isRecurring,
      recurringFrequency: expense.recurringFrequency || '',
      notes: expense.notes || ''
    });
    setIsModalOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast.error(t('finances.descriptionRequired') || 'Description is required');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('finances.invalidAmount') || 'Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);

      const data: CreateExpenseData = {
        category: formData.category,
        amount,
        currency: formData.currency,
        description: formData.description.trim(),
        date: new Date(formData.date).toISOString(),
        isRecurring: formData.isRecurring,
        recurringFrequency: formData.isRecurring && formData.recurringFrequency
          ? formData.recurringFrequency as RecurringFrequency
          : undefined,
        notes: formData.notes.trim() || undefined
      };

      if (editingExpense) {
        await expenseService.updateExpense(editingExpense.id, data);
        toast.success(t('finances.expenseUpdated') || 'Expense updated');
      } else {
        await expenseService.createExpense(data);
        toast.success(t('finances.expenseCreated') || 'Expense created');
      }

      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error(error.message || t('finances.saveError') || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete expense
  const handleDelete = async (id: string) => {
    if (!confirm(t('finances.confirmDelete') || 'Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setDeleting(id);
      await expenseService.deleteExpense(id);
      toast.success(t('finances.expenseDeleted') || 'Expense deleted');
      loadData();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast.error(error.message || t('finances.deleteError') || 'Failed to delete expense');
    } finally {
      setDeleting(null);
    }
  };

  // Get translated category label
  const getCategoryLabel = (category: ExpenseCategory): string => {
    const labels: Record<ExpenseCategory, Record<string, string>> = {
      RENT: { en: 'Rent', uk: 'Оренда', ru: 'Аренда' },
      UTILITIES: { en: 'Utilities', uk: 'Комунальні', ru: 'Коммунальные' },
      CONSUMABLES: { en: 'Consumables', uk: 'Витратні матеріали', ru: 'Расходники' },
      EQUIPMENT: { en: 'Equipment', uk: 'Обладнання', ru: 'Оборудование' },
      INSURANCE: { en: 'Insurance', uk: 'Страхування', ru: 'Страхование' },
      MARKETING: { en: 'Marketing', uk: 'Маркетинг', ru: 'Маркетинг' },
      SALARIES: { en: 'Salaries', uk: 'Зарплати', ru: 'Зарплаты' },
      OTHER: { en: 'Other', uk: 'Інше', ru: 'Другое' }
    };
    return labels[category]?.[language] || labels[category]?.en || category;
  };

  // Get translated recurring label
  const getRecurringLabel = (frequency: RecurringFrequency): string => {
    const labels: Record<RecurringFrequency, Record<string, string>> = {
      WEEKLY: { en: 'Weekly', uk: 'Щотижня', ru: 'Еженедельно' },
      MONTHLY: { en: 'Monthly', uk: 'Щомісяця', ru: 'Ежемесячно' },
      QUARTERLY: { en: 'Quarterly', uk: 'Щоквартально', ru: 'Ежеквартально' },
      YEARLY: { en: 'Yearly', uk: 'Щорічно', ru: 'Ежегодно' }
    };
    return labels[frequency]?.[language] || labels[frequency]?.en || frequency;
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Clear filters
  const clearFilters = () => {
    setFilterCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  if (loading && expenses.length === 0) {
    return <PageLoader text={t('finances.loading') || 'Loading finances...'} />;
  }

  const summaryCurrency = summary && (summary.currency === 'USD' || summary.currency === 'EUR' || summary.currency === 'UAH')
    ? summary.currency
    : 'UAH';

  const monthlyAverage = summary && summary.monthlyBreakdown && summary.monthlyBreakdown.length > 0
    ? Number(summary.totalExpenses) / summary.monthlyBreakdown.length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('finances.title') || 'Business Finances'}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {t('finances.subtitle') || 'Track and manage your business expenses'}
            </p>
          </div>
          <button
            onClick={handleAddExpense}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            {t('finances.addExpense') || 'Add Expense'}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('finances.category') || 'Category'}
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | '')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="">{t('finances.allCategories') || 'All Categories'}</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('finances.startDate') || 'Start Date'}
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('finances.endDate') || 'End Date'}
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className="h-5 w-5" />
              {t('finances.clearFilters') || 'Clear'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Expenses */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <CurrencyDollarIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('finances.totalExpenses') || 'Total Expenses'}
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatPrice(Number(summary.totalExpenses) || 0, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Count */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('finances.transactions') || 'Transactions'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summary.totalCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Average */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <CalendarDaysIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('finances.monthlyAverage') || 'Monthly Average'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(monthlyAverage, summaryCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {summary && summary.byCategory && summary.byCategory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('finances.categoryBreakdown') || 'Category Breakdown'}
            </h2>
            <div className="space-y-4">
              {summary.byCategory.map((cat) => {
                const Icon = getCategoryIcon(cat.category as ExpenseCategory);
                const config = CATEGORY_CONFIG[cat.category as ExpenseCategory];
                return (
                  <div key={cat.category} className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-gray-100'} ${config?.darkBgColor || 'dark:bg-gray-700'}`}>
                      <Icon className={`h-5 w-5 ${config?.color || 'text-gray-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {getCategoryLabel(cat.category as ExpenseCategory)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatPrice(Number(cat.amount) || 0, summaryCurrency)} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${config?.bgColor?.replace('bg-', 'bg-') || 'bg-gray-500'}`}
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expense List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('finances.recentExpenses') || 'Recent Expenses'}
            </h2>
          </div>

          {expenses.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <CurrencyDollarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('finances.noExpenses') || 'No expenses recorded yet'}
              </p>
              <button
                onClick={handleAddExpense}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                {t('finances.addFirstExpense') || 'Add your first expense'}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.map((expense) => {
                const Icon = getCategoryIcon(expense.category);
                const config = CATEGORY_CONFIG[expense.category];
                return (
                  <div
                    key={expense.id}
                    className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${config?.bgColor || 'bg-gray-100'} ${config?.darkBgColor || 'dark:bg-gray-700'}`}>
                          <Icon className={`h-5 w-5 ${config?.color || 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {expense.description}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{getCategoryLabel(expense.category)}</span>
                            <span>•</span>
                            <span>{formatDate(expense.date)}</span>
                            {expense.isRecurring && expense.recurringFrequency && (
                              <>
                                <span>•</span>
                                <span className="text-primary-600 dark:text-primary-400">
                                  {getRecurringLabel(expense.recurringFrequency)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{formatPrice(Number(expense.amount) || 0, (expense.currency || 'UAH') as 'USD' | 'EUR' | 'UAH')}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            disabled={deleting === expense.id}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            {deleting === expense.id ? (
                              <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            ) : (
                              <TrashIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    {expense.notes && (
                      <p className="mt-2 ml-14 text-sm text-gray-500 dark:text-gray-400">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingExpense
                    ? (t('finances.editExpense') || 'Edit Expense')
                    : (t('finances.addExpense') || 'Add Expense')
                  }
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('finances.category') || 'Category'} *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('finances.amount') || 'Amount'} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      required
                    />
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="UAH">UAH</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('finances.description') || 'Description'} *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('finances.descriptionPlaceholder') || 'e.g., Office rent January'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('finances.date') || 'Date'} *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                {/* Recurring */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked, recurringFrequency: '' })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('finances.recurringExpense') || 'Recurring expense'}
                    </span>
                  </label>
                </div>

                {/* Recurring Frequency */}
                {formData.isRecurring && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('finances.frequency') || 'Frequency'}
                    </label>
                    <select
                      value={formData.recurringFrequency}
                      onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as RecurringFrequency | '' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{t('finances.selectFrequency') || 'Select frequency'}</option>
                      {RECURRING_FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>{getRecurringLabel(freq)}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('finances.notes') || 'Notes'}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder={t('finances.notesPlaceholder') || 'Optional notes...'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
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
                    {editingExpense
                      ? (t('common.save') || 'Save')
                      : (t('finances.create') || 'Create')
                    }
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

export default SpecialistFinances;
