import { Response } from 'express';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';
import { prisma } from '@/config/database';

export class ExpenseController {
  // Create expense
  static async createExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
              message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { category, amount, currency, description, date, isRecurring, recurringFrequency, recurringUntil, receiptUrl, notes, isPaid, paidAt } = req.body;

      const expense = await prisma.expense.create({
        data: {
          specialistId: req.user.id,
          category,
          amount: parseFloat(amount),
          currency: currency || 'USD',
          description,
          date: new Date(date),
          isRecurring: isRecurring || false,
          recurringFrequency,
          recurringUntil: recurringUntil ? new Date(recurringUntil) : null,
          receiptUrl,
          notes,
          isPaid: isPaid !== false,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        },
      });

      res.status(201).json(
        createSuccessResponse({
          expense,
          message: 'Expense created successfully',
        })
      );
    } catch (error: any) {
      logger.error('Create expense error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create expense',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get all expenses for specialist
  static async getExpenses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { page = 1, limit = 20, category, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;

      const where: any = {
        specialistId: req.user.id,
      };

      if (category) {
        where.category = category as string;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.date.lte = new Date(endDate as string);
        }
      }

      const [expenses, total] = await Promise.all([
        prisma.expense.findMany({
          where,
          orderBy: { [sortBy as string]: sortOrder },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.expense.count({ where }),
      ]);

      res.status(200).json(
        createSuccessResponse({
          expenses,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            limit: Number(limit),
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get expenses error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get expenses',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get expense by ID
  static async getExpenseById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;

      const expense = await prisma.expense.findFirst({
        where: {
          id,
          specialistId: req.user.id,
        },
      });

      if (!expense) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Expense not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(200).json(
        createSuccessResponse({
          expense,
        })
      );
    } catch (error: any) {
      logger.error('Get expense by ID error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get expense',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update expense
  static async updateExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
              message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;
      const { category, amount, currency, description, date, isRecurring, recurringFrequency, recurringUntil, receiptUrl, notes, isPaid, paidAt } = req.body;

      // Check if expense exists and belongs to user
      const existingExpense = await prisma.expense.findFirst({
        where: {
          id,
          specialistId: req.user.id,
        },
      });

      if (!existingExpense) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Expense not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const expense = await prisma.expense.update({
        where: { id },
        data: {
          ...(category && { category }),
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(currency && { currency }),
          ...(description !== undefined && { description }),
          ...(date && { date: new Date(date) }),
          ...(isRecurring !== undefined && { isRecurring }),
          ...(recurringFrequency !== undefined && { recurringFrequency }),
          ...(recurringUntil !== undefined && { recurringUntil: recurringUntil ? new Date(recurringUntil) : null }),
          ...(receiptUrl !== undefined && { receiptUrl }),
          ...(notes !== undefined && { notes }),
          ...(isPaid !== undefined && { isPaid }),
          ...(paidAt !== undefined && { paidAt: paidAt ? new Date(paidAt) : null }),
        },
      });

      res.status(200).json(
        createSuccessResponse({
          expense,
          message: 'Expense updated successfully',
        })
      );
    } catch (error: any) {
      logger.error('Update expense error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update expense',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Delete expense
  static async deleteExpense(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;

      // Check if expense exists and belongs to user
      const existingExpense = await prisma.expense.findFirst({
        where: {
          id,
          specialistId: req.user.id,
        },
      });

      if (!existingExpense) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Expense not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await prisma.expense.delete({
        where: { id },
      });

      res.status(200).json(
        createSuccessResponse({
          message: 'Expense deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete expense error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete expense',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get expense summary/statistics
  static async getExpenseSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { startDate, endDate } = req.query;

      const where: any = {
        specialistId: req.user.id,
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

      // Get expenses grouped by category
      const expensesByCategory = await prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get total expenses
      const totalExpenses = await prisma.expense.aggregate({
        where,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      });

      // Get monthly breakdown (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyExpenses = await prisma.expense.findMany({
        where: {
          specialistId: req.user.id,
          date: {
            gte: twelveMonthsAgo,
          },
        },
        select: {
          amount: true,
          date: true,
          category: true,
        },
      });

      // Group by month
      const monthlyBreakdown: Record<string, number> = {};
      monthlyExpenses.forEach(expense => {
        const monthKey = `${expense.date.getFullYear()}-${String(expense.date.getMonth() + 1).padStart(2, '0')}`;
        monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + expense.amount;
      });

      res.status(200).json(
        createSuccessResponse({
          summary: {
            totalExpenses: totalExpenses._sum.amount || 0,
            totalCount: totalExpenses._count.id,
            byCategory: expensesByCategory.map(item => ({
              category: item.category,
              total: item._sum.amount || 0,
              count: item._count.id,
            })),
            monthlyBreakdown: Object.entries(monthlyBreakdown).map(([month, total]) => ({
              month,
              total,
            })).sort((a, b) => a.month.localeCompare(b.month)),
          },
        })
      );
    } catch (error: any) {
      logger.error('Get expense summary error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get expense summary',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
