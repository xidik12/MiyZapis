// Invoice service — minimal CRUD + status transitions + simple HTML rendering.
// PDF is a separate concern (we just emit HTML; you can print-to-PDF from the
// browser or run it through a headless Chrome later).

import { prisma } from '@/config/database';
import type { Prisma } from '@prisma/client';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number; // optional; computed from qty*unitPrice if missing
}

export interface CreateInvoiceInput {
  bookingId?: string;
  customerId?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientTaxId?: string;
  currency?: string;
  lineItems: InvoiceLineItem[];
  taxRatePct?: number;        // 0-100
  dueDate?: Date;
  issueDate?: Date;
  notes?: string;
}

export class InvoiceService {
  static async create(specialistId: string, input: CreateInvoiceInput) {
    if (!input.lineItems?.length) throw new Error('VALIDATION_ERROR');
    const normalised = input.lineItems.map((li) => ({
      description: li.description,
      quantity: Number(li.quantity),
      unitPrice: Number(li.unitPrice),
      total: li.total != null ? Number(li.total) : Number(li.quantity) * Number(li.unitPrice),
    }));
    const subtotal = normalised.reduce((acc, li) => acc + li.total, 0);
    const taxRate = (input.taxRatePct ?? 0) / 100;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoiceNumber = await this.nextInvoiceNumber(specialistId);

    return prisma.invoice.create({
      data: {
        specialistId,
        bookingId: input.bookingId,
        customerId: input.customerId,
        invoiceNumber,
        issueDate: input.issueDate ?? new Date(),
        dueDate: input.dueDate,
        clientName: input.clientName,
        clientEmail: input.clientEmail,
        clientAddress: input.clientAddress,
        clientTaxId: input.clientTaxId,
        currency: input.currency ?? 'UAH',
        subtotal: new (require('@prisma/client/runtime/library').Decimal)(subtotal),
        taxRate: new (require('@prisma/client/runtime/library').Decimal)(taxRate),
        taxAmount: new (require('@prisma/client/runtime/library').Decimal)(taxAmount),
        total: new (require('@prisma/client/runtime/library').Decimal)(total),
        lineItems: JSON.stringify(normalised),
        status: 'DRAFT',
        notes: input.notes,
      },
    });
  }

  static async list(specialistId: string, filters: { status?: string; from?: Date; to?: Date } = {}) {
    const where: Prisma.InvoiceWhereInput = { specialistId };
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) where.issueDate = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
    return prisma.invoice.findMany({ where, orderBy: { issueDate: 'desc' } });
  }

  static async get(specialistId: string, invoiceId: string) {
    const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!inv) throw new Error('INVOICE_NOT_FOUND');
    if (inv.specialistId !== specialistId) throw new Error('NOT_AUTHORIZED');
    return inv;
  }

  static async updateStatus(specialistId: string, invoiceId: string, status: string, paidAmount?: number) {
    const inv = await this.get(specialistId, invoiceId);
    const valid = ['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID'];
    if (!valid.includes(status)) throw new Error('INVALID_STATUS');

    const data: Prisma.InvoiceUpdateInput = { status };
    if (status === 'SENT' && !inv.sentAt) data.sentAt = new Date();
    if (status === 'PAID') {
      data.paidAt = new Date();
      data.amountPaid = inv.total;
    }
    if (status === 'PARTIAL' && paidAmount != null) {
      data.amountPaid = new (require('@prisma/client/runtime/library').Decimal)(paidAmount);
    }
    if (status === 'CANCELLED' || status === 'VOID') data.cancelledAt = new Date();
    return prisma.invoice.update({ where: { id: invoiceId }, data });
  }

  static async delete(specialistId: string, invoiceId: string) {
    const inv = await this.get(specialistId, invoiceId);
    if (inv.status !== 'DRAFT') throw new Error('CAN_ONLY_DELETE_DRAFTS');
    return prisma.invoice.delete({ where: { id: invoiceId } });
  }

  // Issue the next sequential invoice number per specialist, e.g. INV-2026-0007.
  // Uses the count of invoices in the current year + 1.
  static async nextInvoiceNumber(specialistId: string): Promise<string> {
    const year = new Date().getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);
    const count = await prisma.invoice.count({
      where: { specialistId, issueDate: { gte: start, lt: end } },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `INV-${year}-${seq}`;
  }
}
