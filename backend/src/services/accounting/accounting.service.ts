// Accounting service — P&L, tax estimate, CSV/JSON export.
// All queries scope to the calling specialist's own data.

import { prisma } from '@/config/database';
import { computeTax, type TaxComputation, type TaxPeriodSummary } from './tax-regimes';

export interface PeriodRange {
  from: Date;
  to: Date;
}

// Scope of an accounting query:
//  - 'self'     → only the calling user's own data (default, backward-compatible).
//  - 'business' → if the caller OWNs a business, aggregate across all its members.
export type AccountingScope = 'self' | 'business';

export interface VatSummary {
  period: { from: string; to: string };
  currency: string;
  vatCollected: number;   // output VAT on sales (Σ invoice.taxAmount on PAID invoices)
  vatPaid: number;        // input VAT on purchases (Σ PO.taxAmount on RECEIVED/PARTIAL POs)
  netVatDue: number;      // collected - paid (negative = refundable / carried forward)
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
    retailSales: number;                  // fulfilled retail/POS product orders
    retailSalesRevenue: number;
    refundsCount: number;           // product-order refunds + booking refunds in period
    refundsTotal: number;           // total refunded amount (negative impact on revenue)
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
    grossIncomeNet: number;   // grossIncome minus refunds (the honest top-line)
  };
}

export class AccountingService {
  // Resolve the set of user IDs an accounting query should cover.
  //  - scope 'self' (default): just [callerId].
  //  - scope 'business': if the caller OWNs a business (OWNER row in
  //    business_members), every active member of every business they own,
  //    plus the caller. Mirrors PayrollService.resolveStaffUserIds, but
  //    includes ALL roles so income/expenses from every member roll up.
  //    If the caller owns no business, falls back to [callerId] (safe default).
  static async resolveScopedUserIds(callerId: string, scope: AccountingScope = 'self'): Promise<string[]> {
    if (scope !== 'business') return [callerId];

    const owned = await prisma.businessMember.findMany({
      where: { userId: callerId, role: 'OWNER', isActive: true },
      select: { businessId: true },
    });
    const ownedBusinessIds = owned.map((m) => m.businessId);
    if (ownedBusinessIds.length === 0) return [callerId];

    const members = await prisma.businessMember.findMany({
      where: { businessId: { in: ownedBusinessIds }, isActive: true },
      select: { userId: true },
    });
    const ids = new Set<string>([callerId]);
    for (const m of members) ids.add(m.userId);
    return Array.from(ids);
  }

  static async getProfitLoss(
    specialistId: string,
    range: PeriodRange,
    currency = 'UAH',
    scope: AccountingScope = 'self'
  ): Promise<ProfitLossSummary> {
    const { from, to } = range;

    // Resolve the in-scope users (self, or all members of owned businesses).
    const userIds = await this.resolveScopedUserIds(specialistId, scope);
    // PayrollRecord/PurchaseOrder are keyed by ownerId (employer/buyer). For a
    // business rollup the owner is the caller; for self it's just the caller.
    const ownerIds = userIds;

    // Income side: completed bookings + fulfilled retail/POS sales in the period.
    const [completedAgg, pendingAgg, paidInvoiceAgg, retailAgg, refundedOrdersAgg, refundedBookingsAgg] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          specialistId: { in: userIds },
          status: 'COMPLETED',
          completedAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.booking.aggregate({
        where: {
          specialistId: { in: userIds },
          status: { in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] },
          scheduledAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: {
          specialistId: { in: userIds },
          status: 'PAID',
          paidAt: { gte: from, lte: to },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Retail / POS sales = fulfilled product orders (fulfilled at = updatedAt).
      prisma.productOrder.aggregate({
        where: {
          ownerId: { in: ownerIds },
          status: 'FULFILLED',
          updatedAt: { gte: from, lte: to },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Refunded product orders in the period (by updatedAt, same as fulfilled).
      prisma.productOrder.aggregate({
        where: {
          ownerId: { in: ownerIds },
          status: 'REFUNDED',
          updatedAt: { gte: from, lte: to },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Refunded bookings in the period (by updatedAt as proxy for refund date).
      prisma.booking.aggregate({
        where: {
          specialistId: { in: userIds },
          status: 'REFUNDED',
          updatedAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);

    // Expense side: manual expenses, payroll cost, and purchases in the period.
    const [expenses, payrollRecords, purchaseOrders] = await Promise.all([
      prisma.expense.findMany({
        where: {
          specialistId: { in: userIds },
          date: { gte: from, lte: to },
        },
        select: { category: true, amount: true, isTaxDeductible: true, vatAmount: true },
      }),
      // Payroll cost = total employer outlay (netPay + taxAmount). Include
      // APPROVED + PAID (exclude DRAFT). "In period" = the pay-run period
      // overlaps the requested range.
      prisma.payrollRecord.findMany({
        where: {
          ownerId: { in: ownerIds },
          status: { in: ['APPROVED', 'PAID'] },
          periodStart: { lte: to },
          periodEnd: { gte: from },
        },
        select: { netPay: true, taxAmount: true },
      }),
      // Purchases / stock = total of received POs. RECEIVED uses receivedAt;
      // PARTIAL POs may not have receivedAt set yet, so fall back to createdAt
      // for the period filter on those.
      prisma.purchaseOrder.findMany({
        where: {
          ownerId: { in: ownerIds },
          OR: [
            { status: 'RECEIVED', receivedAt: { gte: from, lte: to } },
            { status: 'PARTIAL', receivedAt: { gte: from, lte: to } },
            { status: 'PARTIAL', receivedAt: null, createdAt: { gte: from, lte: to } },
          ],
        },
        select: { total: true },
      }),
    ]);

    let totalExpenses = 0;
    let totalDeductible = 0;
    let totalVat = 0;
    const byCategoryMap = new Map<string, { total: number; deductible: number; count: number }>();
    const addCategory = (category: string, amount: number, deductible: number) => {
      totalExpenses += amount;
      totalDeductible += deductible;
      const row = byCategoryMap.get(category) ?? { total: 0, deductible: 0, count: 0 };
      row.total += amount;
      row.deductible += deductible;
      row.count += 1;
      byCategoryMap.set(category, row);
    };

    for (const e of expenses) {
      const amt = Number(e.amount);
      if (e.vatAmount) totalVat += Number(e.vatAmount);
      addCategory(e.category, amt, e.isTaxDeductible ? amt : 0);
    }

    // PAYROLL line — total employer cost (net pay + withheld tax). Treated as
    // fully tax-deductible (a legitimate business expense).
    // NOTE v1: payroll/purchases are added as separate sources. If a purchase
    // was ALSO logged manually as an Expense, both are counted — acceptable for
    // v1; de-dup is a future refinement.
    let payrollCost = 0;
    for (const p of payrollRecords) {
      payrollCost += Number(p.netPay) + Number(p.taxAmount);
    }
    if (payrollCost !== 0 || payrollRecords.length > 0) {
      addCategory('PAYROLL', payrollCost, payrollCost);
    }

    // PURCHASES line — total of received purchase orders (stock / COGS).
    // Fully tax-deductible.
    let purchasesCost = 0;
    for (const po of purchaseOrders) {
      purchasesCost += Number(po.total);
    }
    if (purchasesCost !== 0 || purchaseOrders.length > 0) {
      addCategory('PURCHASES', purchasesCost, purchasesCost);
    }

    const completedRevenue = Number(completedAgg._sum.totalAmount ?? 0);
    const pendingRevenue = Number(pendingAgg._sum.totalAmount ?? 0);
    const paidInvoiceRevenue = Number(paidInvoiceAgg._sum.total ?? 0);
    const retailRevenue = Number(retailAgg._sum.total ?? 0);
    const refundsTotal = Number(refundedOrdersAgg._sum.total ?? 0) + Number(refundedBookingsAgg._sum.totalAmount ?? 0);
    const refundsCount = refundedOrdersAgg._count + refundedBookingsAgg._count;
    const grossIncome = completedRevenue + paidInvoiceRevenue + retailRevenue;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      currency,
      income: {
        completedBookings: completedAgg._count,
        completedBookingsRevenue: completedRevenue,
        pendingBookingsRevenue: pendingRevenue,
        invoicesPaid: paidInvoiceAgg._count,
        invoicesPaidRevenue: paidInvoiceRevenue,
        retailSales: retailAgg._count,
        retailSalesRevenue: retailRevenue,
        refundsCount,
        refundsTotal,
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
        grossIncomeNet: grossIncome - refundsTotal,
      },
    };
  }

  static async estimateTax(
    specialistId: string,
    range: PeriodRange,
    regimeId?: string,
    currency = 'UAH',
    scope: AccountingScope = 'self'
  ): Promise<TaxComputation> {
    const pl = await this.getProfitLoss(specialistId, range, currency, scope);
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

  // VAT summary: output VAT collected on sales (invoice.taxAmount on PAID
  // invoices) minus input VAT paid on purchases (PO.taxAmount on RECEIVED /
  // PARTIAL POs in the period) = net VAT due to the tax authority.
  static async vatSummary(
    specialistId: string,
    range: PeriodRange,
    currency = 'UAH',
    scope: AccountingScope = 'self'
  ): Promise<VatSummary> {
    const { from, to } = range;
    const userIds = await this.resolveScopedUserIds(specialistId, scope);

    const [invoiceVatAgg, purchaseOrders] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          specialistId: { in: userIds },
          status: 'PAID',
          paidAt: { gte: from, lte: to },
        },
        _sum: { taxAmount: true },
      }),
      prisma.purchaseOrder.findMany({
        where: {
          ownerId: { in: userIds },
          OR: [
            { status: 'RECEIVED', receivedAt: { gte: from, lte: to } },
            { status: 'PARTIAL', receivedAt: { gte: from, lte: to } },
            { status: 'PARTIAL', receivedAt: null, createdAt: { gte: from, lte: to } },
          ],
        },
        select: { taxAmount: true },
      }),
    ]);

    const vatCollected = Number(invoiceVatAgg._sum.taxAmount ?? 0);
    let vatPaid = 0;
    for (const po of purchaseOrders) vatPaid += Number(po.taxAmount);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      currency,
      vatCollected,
      vatPaid,
      netVatDue: vatCollected - vatPaid,
    };
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
