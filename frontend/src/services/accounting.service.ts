// API client for /api/v1/accounting/* — bookkeeping, P&L, tax estimator, invoices.
import { apiClient, api } from './api';

// ──────────────────────────────────────────────────────────────────────────
// P&L
// ──────────────────────────────────────────────────────────────────────────
export interface ProfitLoss {
  period: { from: string; to: string };
  currency: string;
  income: {
    completedBookings: number;
    completedBookingsRevenue: number;
    pendingBookingsRevenue: number;
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
    grossProfit: number;
    netBeforeTax: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Tax estimator
// ──────────────────────────────────────────────────────────────────────────
export interface TaxLine {
  name: string;
  description: string;
  ratePct?: number;
  basis: number;
  amount: number;
}
export interface TaxComputation {
  regime: string;
  regimeLabel: string;
  totalTax: number;
  taxableBase: number;
  netIncome: number;
  lines: TaxLine[];
  notes: string[];
}
export interface TaxRegime {
  id: string;
  label: string;
}

// ──────────────────────────────────────────────────────────────────────────
// Invoices
// ──────────────────────────────────────────────────────────────────────────
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'VOID';
export interface Invoice {
  id: string;
  specialistId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientAddress?: string | null;
  clientTaxId?: string | null;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  lineItems: string; // JSON-encoded array
  status: InvoiceStatus;
  sentAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  notes?: string | null;
  bookingId?: string | null;
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
  taxRatePct?: number;
  dueDate?: string;
  issueDate?: string;
  notes?: string;
}

class AccountingService {
  private base = '/accounting';

  async getProfitLoss(from: Date, to: Date, currency?: string): Promise<ProfitLoss> {
    const params: Record<string, string> = { from: from.toISOString(), to: to.toISOString() };
    if (currency) params.currency = currency;
    const res = await apiClient.get<ProfitLoss>(`${this.base}/profit-loss`, { params });
    return res.data!;
  }

  async getTaxEstimate(from: Date, to: Date, regime?: string, currency?: string): Promise<TaxComputation> {
    const params: Record<string, string> = { from: from.toISOString(), to: to.toISOString() };
    if (regime) params.regime = regime;
    if (currency) params.currency = currency;
    const res = await apiClient.get<TaxComputation>(`${this.base}/tax-estimate`, { params });
    return res.data!;
  }

  async getTaxRegimes(): Promise<TaxRegime[]> {
    const res = await apiClient.get<{ regimes: TaxRegime[] }>(`${this.base}/tax-regimes`);
    return res.data!.regimes;
  }

  // Trigger a CSV download. Uses the raw axios instance (which has the auth
  // interceptor) so we can return the body as a Blob instead of the wrapped
  // ApiResponse shape that apiClient.get assumes.
  async downloadCsv(from: Date, to: Date, include: { income: boolean; expenses: boolean }): Promise<void> {
    const parts = [include.income ? 'income' : '', include.expenses ? 'expenses' : ''].filter(Boolean).join(',');
    const params: Record<string, string> = { from: from.toISOString(), to: to.toISOString(), include: parts };
    const res = await api.get(`${this.base}/export.csv`, { params, responseType: 'blob' });
    const blob = res.data as Blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounting-${from.toISOString().slice(0, 10)}-${to.toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Invoices ──────────────────────────────────────────────────────────
  async listInvoices(filters: { status?: InvoiceStatus; from?: Date; to?: Date } = {}): Promise<Invoice[]> {
    const params: Record<string, string> = {};
    if (filters.status) params.status = filters.status;
    if (filters.from) params.from = filters.from.toISOString();
    if (filters.to) params.to = filters.to.toISOString();
    const res = await apiClient.get<{ invoices: Invoice[] }>(`${this.base}/invoices`, { params });
    return res.data!.invoices;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const res = await apiClient.get<{ invoice: Invoice }>(`${this.base}/invoices/${id}`);
    return res.data!.invoice;
  }

  async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const res = await apiClient.post<{ invoice: Invoice }>(`${this.base}/invoices`, input);
    return res.data!.invoice;
  }

  async updateInvoiceStatus(id: string, status: InvoiceStatus, paidAmount?: number): Promise<Invoice> {
    const body: Record<string, unknown> = { status };
    if (paidAmount != null) body.paidAmount = paidAmount;
    const res = await apiClient.patch<{ invoice: Invoice }>(`${this.base}/invoices/${id}/status`, body);
    return res.data!.invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await apiClient.delete(`${this.base}/invoices/${id}`);
  }
}

export const accountingService = new AccountingService();
