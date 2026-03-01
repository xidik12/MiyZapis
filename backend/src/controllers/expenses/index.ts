import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';

const prisma = new PrismaClient();

// Valid expense categories
const EXPENSE_CATEGORIES = [
  'RENT',
  'UTILITIES',
  'CONSUMABLES',
  'EQUIPMENT',
  'INSURANCE',
  'MARKETING',
  'SALARIES',
  'OTHER'
] as const;

// Valid recurring frequencies
const RECURRING_FREQUENCIES = ['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const;

type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
type RecurringFrequency = typeof RECURRING_FREQUENCIES[number];

const isMissingExpensesTableError = (error: unknown): boolean => {
  const code = error?.code;
  const message = typeof error?.message === 'string' ? error.message : '';
  return code === 'P2021' || (message.includes('expenses') && message.includes('does not exist'));
};

export class ExpenseController {
  // Get all expenses for specialist
  static getExpenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const {
        startDate,
        endDate,
        category,
        isRecurring,
        limit = '50',
        offset = '0',
        sortBy = 'date',
        sortOrder = 'desc'
      } = req.query;

      // Build where clause
      const where: Record<string, unknown> = {
        specialistId: userId
      };

      // Date range filter
      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.date.lte = new Date(endDate as string);
        }
      }

      // Category filter
      if (category && EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
        where.category = category;
      }

      // Recurring filter
      if (isRecurring !== undefined) {
        where.isRecurring = isRecurring === 'true';
      }

      // Get expenses with pagination
      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          orderBy: {
            [sortBy as string]: sortOrder
          },
          take: parseInt(limit as string),
          skip: parseInt(offset as string)
        }),
        prisma.expense.count({ where })
      ]);

      res.json(createSuccessResponse({
        expenses,
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (isMissingExpensesTableError(error)) {
        res.json(createSuccessResponse({
          expenses: [],
          total: 0,
          limit: parseInt((req.query.limit as string) || '50'),
          offset: parseInt((req.query.offset as string) || '0')
        }));
        return;
      }

      logger.error('Error getting expenses:', error);
      res.status(500).json(createErrorResponse('EXPENSE_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Get expense summary with category breakdown
  static getExpenseSummary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;

      // Build where clause for date range
      const where: Record<string, unknown> = {
        specialistId: userId
      };

      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.date.lte = new Date(endDate as string);
        }
      }

      // Get all expenses for the period
      const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'asc' }
      });

      // Calculate totals
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalCount = expenses.length;
      const expenseCurrencies = new Set(expenses.map(exp => exp.currency || 'UAH'));
      const summaryCurrency = expenseCurrencies.size === 1
        ? Array.from(expenseCurrencies)[0]
        : 'UAH';

      // Group by category
      const categoryMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach(exp => {
        const current = categoryMap.get(exp.category) || { amount: 0, count: 0 };
        categoryMap.set(exp.category, {
          amount: current.amount + exp.amount,
          count: current.count + 1
        });
      });

      const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100 * 100) / 100 : 0
      })).sort((a, b) => b.amount - a.amount);

      // Group by month
      const monthMap = new Map<string, { amount: number; count: number }>();
      expenses.forEach(exp => {
        const monthKey = new Date(exp.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        const current = monthMap.get(monthKey) || { amount: 0, count: 0 };
        monthMap.set(monthKey, {
          amount: current.amount + exp.amount,
          count: current.count + 1
        });
      });

      const monthlyBreakdown = Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        amount: data.amount,
        count: data.count
      }));

      // Get current month expenses
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthExpenses = expenses
        .filter(exp => new Date(exp.date) >= currentMonthStart)
        .reduce((sum, exp) => sum + exp.amount, 0);

      res.json(createSuccessResponse({
        totalExpenses,
        totalCount,
        thisMonthExpenses,
        byCategory,
        monthlyBreakdown,
        currency: summaryCurrency
      }));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (isMissingExpensesTableError(error)) {
        res.json(createSuccessResponse({
          totalExpenses: 0,
          totalCount: 0,
          thisMonthExpenses: 0,
          byCategory: [],
          monthlyBreakdown: [],
          currency: 'UAH'
        }));
        return;
      }

      logger.error('Error getting expense summary:', error);
      res.status(500).json(createErrorResponse('EXPENSE_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Get single expense by ID
  static getExpenseById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const expense = await prisma.expense.findFirst({
        where: {
          id,
          specialistId: userId
        }
      });

      if (!expense) {
        res.status(404).json(createErrorResponse('NOT_FOUND', 'Expense not found', req.headers['x-request-id'] as string));
        return;
      }

      res.json(createSuccessResponse(expense));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting expense:', error);
      res.status(500).json(createErrorResponse('EXPENSE_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Create new expense
  static createExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const {
        category,
        amount,
        currency = 'UAH',
        description,
        date,
        isRecurring = false,
        recurringFrequency,
        notes,
        receiptUrl
      } = req.body;

      // Validate category
      if (!EXPENSE_CATEGORIES.includes(category)) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(', ')}`, req.headers['x-request-id'] as string));
        return;
      }

      // Validate amount
      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Amount must be a positive number', req.headers['x-request-id'] as string));
        return;
      }

      // Validate description
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Description is required', req.headers['x-request-id'] as string));
        return;
      }

      // Validate recurring frequency if isRecurring
      if (isRecurring && recurringFrequency && !RECURRING_FREQUENCIES.includes(recurringFrequency)) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid recurring frequency. Must be one of: ${RECURRING_FREQUENCIES.join(', ')}`, req.headers['x-request-id'] as string));
        return;
      }

      const expense = await prisma.expense.create({
        data: {
          specialistId: userId,
          category,
          amount,
          currency,
          description: description.trim(),
          date: date ? new Date(date) : new Date(),
          isRecurring,
          recurringFrequency: isRecurring ? recurringFrequency : null,
          notes: notes?.trim() || null,
          receiptUrl: receiptUrl || null
        }
      });

      logger.info(`Expense created: ${expense.id} by specialist ${userId}`);
      res.status(201).json(createSuccessResponse(expense));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error creating expense:', error);
      res.status(500).json(createErrorResponse('EXPENSE_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Update expense
  static updateExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const {
        category,
        amount,
        currency,
        description,
        date,
        isRecurring,
        recurringFrequency,
        notes,
        receiptUrl
      } = req.body;

      // Check if expense exists and belongs to user
      const existingExpense = await prisma.expense.findFirst({
        where: {
          id,
          specialistId: userId
        }
      });

      if (!existingExpense) {
        res.status(404).json(createErrorResponse('NOT_FOUND', 'Expense not found', req.headers['x-request-id'] as string));
        return;
      }

      // Validate category if provided
      if (category && !EXPENSE_CATEGORIES.includes(category)) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(', ')}`, req.headers['x-request-id'] as string));
        return;
      }

      // Validate amount if provided
      if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Amount must be a positive number', req.headers['x-request-id'] as string));
        return;
      }

      // Validate recurring frequency if provided
      if (recurringFrequency && !RECURRING_FREQUENCIES.includes(recurringFrequency)) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid recurring frequency. Must be one of: ${RECURRING_FREQUENCIES.join(', ')}`, req.headers['x-request-id'] as string));
        return;
      }

      // Build update data
      const updateData: Record<string, unknown> = {};
      if (category !== undefined) updateData.category = category;
      if (amount !== undefined) updateData.amount = amount;
      if (currency !== undefined) updateData.currency = currency;
      if (description !== undefined) updateData.description = description.trim();
      if (date !== undefined) updateData.date = new Date(date);
      if (isRecurring !== undefined) {
        updateData.isRecurring = isRecurring;
        if (!isRecurring) {
          updateData.recurringFrequency = null;
        }
      }
      if (recurringFrequency !== undefined) updateData.recurringFrequency = recurringFrequency;
      if (notes !== undefined) updateData.notes = notes?.trim() || null;
      if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl || null;

      const expense = await prisma.expense.update({
        where: { id },
        data: updateData
      });

      logger.info(`Expense updated: ${expense.id} by specialist ${userId}`);
      res.json(createSuccessResponse(expense));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error updating expense:', error);
      res.status(500).json(createErrorResponse('EXPENSE_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Delete expense
  static deleteExpense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      // Check if expense exists and belongs to user
      const existingExpense = await prisma.expense.findFirst({
        where: {
          id,
          specialistId: userId
        }
      });

      if (!existingExpense) {
        res.status(404).json(createErrorResponse('NOT_FOUND', 'Expense not found', req.headers['x-request-id'] as string));
        return;
      }

      await prisma.expense.delete({
        where: { id }
      });

      logger.info(`Expense deleted: ${id} by specialist ${userId}`);
      res.json(createSuccessResponse({ message: 'Expense deleted successfully' }));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error deleting expense:', error);
      res.status(500).json(createErrorResponse('EXPENSE_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };
}
