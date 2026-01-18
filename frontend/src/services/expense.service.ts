import { apiClient } from './api';

export type ExpenseCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'CONSUMABLES'
  | 'EQUIPMENT'
  | 'INSURANCE'
  | 'MARKETING'
  | 'SALARIES'
  | 'OTHER';

export interface Expense {
  id: string;
  specialistId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  recurringUntil?: string;
  receiptUrl?: string;
  notes?: string;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  description?: string;
  date: string;
  isRecurring?: boolean;
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  recurringUntil?: string;
  receiptUrl?: string;
  notes?: string;
  isPaid?: boolean;
  paidAt?: string;
}

export interface UpdateExpenseData {
  category?: ExpenseCategory;
  amount?: number;
  currency?: string;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  recurringUntil?: string;
  receiptUrl?: string;
  notes?: string;
  isPaid?: boolean;
  paidAt?: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  category?: ExpenseCategory;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount' | 'category' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpensePagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  pagination: ExpensePagination;
}

export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export interface MonthlyBreakdown {
  month: string;
  total: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  totalCount: number;
  byCategory: CategorySummary[];
  monthlyBreakdown: MonthlyBreakdown[];
}

export class ExpenseService {
  // Create a new expense
  async createExpense(data: CreateExpenseData): Promise<Expense> {
    const response = await apiClient.post<{ expense: Expense; message: string }>('/expenses', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create expense');
    }

    return response.data.expense;
  }

  // Get all expenses with optional filters
  async getExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<ExpenseListResponse>(`/expenses?${params}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get expenses');
    }

    return response.data;
  }

  // Get expense by ID
  async getExpenseById(id: string): Promise<Expense> {
    const response = await apiClient.get<{ expense: Expense }>(`/expenses/${id}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get expense');
    }

    return response.data.expense;
  }

  // Update expense
  async updateExpense(id: string, data: UpdateExpenseData): Promise<Expense> {
    const response = await apiClient.put<{ expense: Expense; message: string }>(`/expenses/${id}`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update expense');
    }

    return response.data.expense;
  }

  // Delete expense
  async deleteExpense(id: string): Promise<void> {
    const response = await apiClient.delete<{ message: string }>(`/expenses/${id}`);

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete expense');
    }
  }

  // Get expense summary/statistics
  async getExpenseSummary(startDate?: string, endDate?: string): Promise<ExpenseSummary> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await apiClient.get<{ summary: ExpenseSummary }>(`/expenses/summary?${params}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get expense summary');
    }

    return response.data.summary;
  }

  // Helper methods for formatting
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  getCategoryLabel(category: ExpenseCategory): string {
    const labels: Record<ExpenseCategory, string> = {
      RENT: 'Rent',
      UTILITIES: 'Utilities',
      CONSUMABLES: 'Consumables',
      EQUIPMENT: 'Equipment',
      INSURANCE: 'Insurance',
      MARKETING: 'Marketing',
      SALARIES: 'Salaries',
      OTHER: 'Other',
    };
    return labels[category] || category;
  }

  getCategoryColor(category: ExpenseCategory): string {
    const colors: Record<ExpenseCategory, string> = {
      RENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      UTILITIES: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      CONSUMABLES: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      EQUIPMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      INSURANCE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      MARKETING: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
      SALARIES: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colors[category] || colors.OTHER;
  }

  getCategoryIcon(category: ExpenseCategory): string {
    const icons: Record<ExpenseCategory, string> = {
      RENT: 'building',
      UTILITIES: 'bolt',
      CONSUMABLES: 'cube',
      EQUIPMENT: 'wrench',
      INSURANCE: 'shield-check',
      MARKETING: 'megaphone',
      SALARIES: 'users',
      OTHER: 'dots-horizontal',
    };
    return icons[category] || icons.OTHER;
  }

  getRecurringLabel(frequency: string): string {
    const labels: Record<string, string> = {
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly',
    };
    return labels[frequency] || frequency;
  }
}

export const expenseService = new ExpenseService();
