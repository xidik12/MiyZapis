// Accounting service — P&L, tax estimate, CSV/JSON export.
// All queries scope to the calling specialist's own data.

import { prisma } from '@/config/database';
import { computeTax, type TaxComputation, type TaxPeriodSummary } from './tax-regimes';

export interface PeriodRange {
  from: Date;
  to: Date;
}

export interface ProfitLossSummary {
  period: { from: string; to: string };
  currency: string;
  income: {
    completedBookings: number;
    completedBookingsRevenue: number;
    pendingBookingsRevenue: number;       // not yet recognised; informational
    invoicesPaid: number;
    invoicesPaidRevenue: number;
  };
  expenses: {
    total: number;
    totalDeductible: number;
    totalVat: number;
    byCategory: Array<{ category: string; total: number; deductible: number; count: number }>;
  };
  totals: {
    grossIncome: number;
    deductibleExpenses: number;
    grossProfit: number;       // gross income - all expenses
    netBeforeTax: number;      // gross income - deductible expenses
  };
}

export class AccountingService {
  static async getProfitLoss(specialistId: string, range: PeriodRange, currency = 'UAH'): Promise<ProfitLossSummary> {
    const { from, to } = range;

    // Income side: completed bookings within the period.
    const [completedAgg, pendingAgg, paidInvoiceAgg] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          specialistId,
          status: 'COMPLETED',
          completedAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.booking.aggregate({
        where: {
          specialistId,
          status: { in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] },
          scheduledAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          specialistId,
          status: 'PAID',
          paidAt: { gte: from, lte: to },
        },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    // Expense side: all expenses in the period.
    const expenses = await prisma.expense.findMany({
      where: {
        specialistId,
        date: { gte: from, lte: to },
      },
      select: { category: true, amount: true, isTaxDeductible: true, vatAmount: true },
    });

    let totalExpenses = 0;
    let totalDeductible = 0;
    let totalVat = 0;
    const byCategoryMap = new Map<string, { total: number; deductible: number; count: number }>();
    for (const e of expenses) {
      const amt = Number(e.amount);
      totalExpenses += amt;
      if (e.isTaxDeductible) totalDeductible += amt;
      if (e.vatAmount) totalVat += Number(e.vatAmount);
      const row = byCategoryMap.get(e.category) ?? { total: 0, deductible: 0, count: 0 };
      row.total += amt;
      if (e.isTaxDeductible) row.deductible += amt;
      row.count += 1;
      byCategoryMap.set(e.category, row);
    }

    const completedRevenue = Number(completedAgg._sum.totalAmount ?? 0);
    const pendingRevenue = Number(pendingAgg._sum.totalAmount ?? 0);
    const paidInvoiceRevenue = Number(paidInvoiceAgg._sum.total ?? 0);
    const grossIncome = completedRevenue + paidInvoiceRevenue;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      currency,
      income: {
        completedBookings: completedAgg._count,
        completedBookingsRevenue: completedRevenue,
        pendingBookingsRevenue: pendingRevenue,
        invoicesPaid: paidInvoiceAgg._count,
        invoicesPaidRevenue: paidInvoiceRevenue,
      },
      expenses: {
        total: totalExpenses,
        totalDeductible,
        totalVat,
        byCategory: Array.from(byCategoryMap.entries())
          .map(([category, v]) => ({ category, ...v }))
          .sort((a, b) => b.total - a.total),
      },
      totals: {
        grossIncome,
        deductibleExpenses: totalDeductible,
        grossProfit: grossIncome - totalExpenses,
        netBeforeTax: grossIncome - totalDeductible,
      },
    };
  }

  static async estimateTax(specialistId: string, range: PeriodRange, regimeId?: string, currency = 'UAH'): Promise<TaxComputation> {
    const pl = await this.getProfitLoss(specialistId, range, currency);
    const user = await prisma.user.findUnique({ where: { id: specialistId }, select: { taxRegime: true } });
    const regime = regimeId || user?.taxRegime || 'NONE';

    const summary: TaxPeriodSummary = {
      grossIncome: pl.totals.grossIncome,
      deductibleExpenses: pl.totals.deductibleExpenses,
      vatPaid: pl.expenses.totalVat,
      currency,
      periodStart: range.from,
      periodEnd: range.to,
    };
    return computeTax(regime, summary);
  }

  // Returns CSV (comma-separated, header row first) suitable for an accountant.
  static async exportCsv(specialistId: string, range: PeriodRange, include: { income: boolean; expenses: boolean }): Promise<string> {
    const rows: string[] = [];
    rows.push('type,date,category,description,amount,currency,is_tax_deductible,reference');

    if (include.expenses) {
      const expenses = await prisma.expense.findMany({
        where: { specialistId, date: { gte: range.from, lte: range.to } },
        orderBy: { date: 'asc' },
      });
      for (const e of expenses) {
        rows.push(toCsvRow([
          'expense',
          e.date.toISOString().slice(0, 10),
          e.category,
          e.description,
          String(e.amount),
          e.currency,
          e.isTaxDeductible ? 'yes' : 'no',
          e.id,
        ]));
      }
    }

    if (include.income) {
      const bookings = await prisma.booking.findMany({
        where: {
          specialistId,
          status: 'COMPLETED',
          completedAt: { gte: range.from, lte: range.to },
        },
        select: { id: true, completedAt: true, totalAmount: true, depositCurrency: true, service: { select: { name: true } } },
        orderBy: { completedAt: 'asc' },
      });
      for (const b of bookings) {
        rows.push(toCsvRow([
          'income_booking',
          (b.completedAt ?? new Date()).toISOString().slice(0, 10),
          'BOOKING',
          b.service?.name ?? '',
          String(b.totalAmount),
          b.depositCurrency,
          'no',
          b.id,
        ]));
      }
      const invoices = await prisma.invoice.findMany({
        where: { specialistId, status: 'PAID', paidAt: { gte: range.from, lte: range.to } },
        orderBy: { paidAt: 'asc' },
      });
      for (const inv of invoices) {
        rows.push(toCsvRow([
          'income_invoice',
          (inv.paidAt ?? inv.issueDate).toISOString().slice(0, 10),
          'INVOICE',
          inv.clientName,
          String(inv.total),
          inv.currency,
          'no',
          inv.invoiceNumber,
        ]));
      }
    }

    return rows.join('\n') + '\n';
  }
}

function toCsvRow(values: string[]): string {
  return values.map((v) => {
    const s = v ?? '';
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }).join(',');
}
