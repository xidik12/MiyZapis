import { apiClient } from './api';

// Expense categories
export const EXPENSE_CATEGORIES = [
  'RENT',
  'UTILITIES',
  'CONSUMABLES',
  'EQUIPMENT',
  'INSURANCE',
  'MARKETING',
  'SALARIES',
  'OTHER'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Recurring frequencies
export const RECURRING_FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;
export type RecurringFrequency = typeof RECURRING_FREQUENCIES[number];

export interface Expense {
  id: string;
  specialistId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseFilters {
  startDate?: string;
  endDate?: string;
  category?: ExpenseCategory;
  isRecurring?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'amount' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  limit: number;
  offset: number;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  amount: number;
  count: number;
  percentage: number;
}

export interface MonthlyBreakdown {
  month: string;
  amount: number;
  count: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalCount: number;
  thisMonthExpenses: number;
  byCategory: CategoryBreakdown[];
  monthlyBreakdown: MonthlyBreakdown[];
  currency: string;
}

export interface CreateExpenseData {
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  description: string;
  date?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  notes?: string;
  receiptUrl?: string;
}

export interface UpdateExpenseData {
  category?: ExpenseCategory;
  amount?: number;
  currency?: string;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  notes?: string;
  receiptUrl?: string;
}

// Category display configuration
export const CATEGORY_CONFIG: Record<ExpenseCategory, {
  labelKey: string;
  color: string;
  bgColor: string;
  darkBgColor: string;
  icon: string;
}> = {
  RENT: {
    labelKey: 'finances.category.rent',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100',
    darkBgColor: 'dark:bg-blue-900/30',
    icon: 'building'
  },
  UTILITIES: {
    labelKey: 'finances.category.utilities',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100',
    darkBgColor: 'dark:bg-orange-900/30',
    icon: 'bolt'
  },
  CONSUMABLES: {
    labelKey: 'finances.category.consumables',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100',
    darkBgColor: 'dark:bg-green-900/30',
    icon: 'cube'
  },
  EQUIPMENT: {
    labelKey: 'finances.category.equipment',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100',
    darkBgColor: 'dark:bg-purple-900/30',
    icon: 'wrench'
  },
  INSURANCE: {
    labelKey: 'finances.category.insurance',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100',
    darkBgColor: 'dark:bg-indigo-900/30',
    icon: 'shield'
  },
  MARKETING: {
    labelKey: 'finances.category.marketing',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100',
    darkBgColor: 'dark:bg-pink-900/30',
    icon: 'megaphone'
  },
  SALARIES: {
    labelKey: 'finances.category.salaries',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100',
    darkBgColor: 'dark:bg-teal-900/30',
    icon: 'users'
  },
  OTHER: {
    labelKey: 'finances.category.other',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100',
    darkBgColor: 'dark:bg-gray-700',
    icon: 'dots'
  }
};

// Recurring frequency display configuration
export const RECURRING_CONFIG: Record<RecurringFrequency, {
  labelKey: string;
}> = {
  WEEKLY: { labelKey: 'finances.recurring.weekly' },
  MONTHLY: { labelKey: 'finances.recurring.monthly' },
  QUARTERLY: { labelKey: 'finances.recurring.quarterly' },
  YEARLY: { labelKey: 'finances.recurring.yearly' }
};

export class ExpenseService {
  // Get all expenses with optional filters
  async getExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ExpenseListResponse>(
      `/expenses?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get expenses');
    }

    return response.data;
  }

  // Get expense summary with category and monthly breakdown
  async getExpenseSummary(startDate?: string, endDate?: string): Promise<ExpenseSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<ExpenseSummary>(
      `/expenses/summary?${params}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get expense summary');
    }

    return response.data;
  }

  // Get single expense by ID
  async getExpenseById(id: string): Promise<Expense> {
    const response = await apiClient.get<Expense>(`/expenses/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get expense');
    }

    return response.data;
  }

  // Create new expense
  async createExpense(data: CreateExpenseData): Promise<Expense> {
    const response = await apiClient.post<Expense>('/expenses', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create expense');
    }

    return response.data;
  }

  // Update expense
  async updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
    const response = await apiClient.put<Expense>(`/expenses/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update expense');
    }

    return response.data;
  }

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    const response = await apiClient.delete(`/expenses/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete expense');
    }
  }

  // Helper: Get category label key for translation
  getCategoryLabelKey(category: ExpenseCategory): string {
    return CATEGORY_CONFIG[category]?.labelKey || 'finances.category.other';
  }

  // Helper: Get category color classes
  getCategoryColor(category: ExpenseCategory): string {
    return CATEGORY_CONFIG[category]?.color || 'text-gray-600 dark:text-gray-400';
  }

  // Helper: Get category background color classes
  getCategoryBgColor(category: ExpenseCategory): string {
    const config = CATEGORY_CONFIG[category];
    return config ? `${config.bgColor} ${config.darkBgColor}` : 'bg-gray-100 dark:bg-gray-700';
  }

  // Helper: Get recurring frequency label key
  getRecurringLabelKey(frequency: RecurringFrequency): string {
    return RECURRING_CONFIG[frequency]?.labelKey || '';
  }

  // Helper: Format amount with currency
  formatAmount(amount: number, currency: string = 'UAH'): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
