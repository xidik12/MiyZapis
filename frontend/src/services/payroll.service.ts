import { apiClient } from './api';

// Payroll record statuses
export const PAYROLL_STATUSES = ['DRAFT', 'APPROVED', 'PAID'] as const;
export type PayrollStatus = typeof PAYROLL_STATUSES[number];

export interface StaffMember {
  staffUserId: string;
  name: string;
  role: string;
  commissionPercent: number;
}

export interface PreviewLine {
  staffUserId: string;
  name: string;
  role: string;
  commissionPercent: number;
  baseSalary: number;
  commissionTotal: number;
  bonus: number;
  deductions: number;
  taxAmount: number;
  netPay: number;
}

export interface PayrollRecord {
  id: string;
  ownerId: string;
  businessId?: string | null;
  staffUserId: string;
  staffName?: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number | string;
  commissionTotal: number | string;
  bonus: number | string;
  deductions: number | string;
  taxAmount: number | string;
  netPay: number | string;
  currency: string;
  status: PayrollStatus;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollSummary {
  totalPayrollThisPeriod: number;
  totalCommission: number;
  countsByStatus: Record<string, number>;
  pendingApproval: number;
  currency: string;
}

export interface RunLineInput {
  staffUserId: string;
  baseSalary: number;
  commissionTotal: number;
  bonus: number;
  deductions: number;
  taxAmount: number;
}

export interface CreateRunData {
  periodStart: string;
  periodEnd: string;
  lines: RunLineInput[];
  currency?: string;
  notes?: string | null;
}

export interface UpdateRecordData {
  baseSalary?: number;
  commissionTotal?: number;
  bonus?: number;
  deductions?: number;
  taxAmount?: number;
  notes?: string | null;
}

export interface RecordFilters {
  status?: PayrollStatus;
  start?: string;
  end?: string;
}

export class PayrollService {
  // ---------- Staff & commission ----------

  async getStaff(): Promise<StaffMember[]> {
    const response = await apiClient.get<{ staff: StaffMember[] }>('/payroll/staff');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get staff');
    }
    return response.data.staff;
  }

  async setCommission(staffUserId: string, percent: number): Promise<void> {
    const response = await apiClient.post('/payroll/commission', { staffUserId, percent });
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to set commission');
    }
  }

  // ---------- Pay runs ----------

  async preview(start: string, end: string): Promise<PreviewLine[]> {
    const params = new URLSearchParams({ start, end });
    const response = await apiClient.get<{ lines: PreviewLine[] }>(`/payroll/preview?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to preview pay run');
    }
    return response.data.lines;
  }

  async createRun(data: CreateRunData): Promise<PayrollRecord[]> {
    const response = await apiClient.post<{ records: PayrollRecord[] }>('/payroll/runs', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create pay run');
    }
    return response.data.records;
  }

  // ---------- Records ----------

  async getSummary(): Promise<PayrollSummary> {
    const response = await apiClient.get<PayrollSummary>('/payroll/records/summary');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payroll summary');
    }
    return response.data;
  }

  async getRecords(filters: RecordFilters = {}): Promise<PayrollRecord[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    const response = await apiClient.get<{ records: PayrollRecord[] }>(`/payroll/records?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payroll records');
    }
    return response.data.records;
  }

  async getRecordById(id: string): Promise<PayrollRecord> {
    const response = await apiClient.get<PayrollRecord>(`/payroll/records/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payroll record');
    }
    return response.data;
  }

  async updateRecord(id: string, data: UpdateRecordData): Promise<PayrollRecord> {
    const response = await apiClient.put<PayrollRecord>(`/payroll/records/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update payroll record');
    }
    return response.data;
  }

  async setStatus(id: string, status: PayrollStatus): Promise<PayrollRecord> {
    const response = await apiClient.post<PayrollRecord>(`/payroll/records/${id}/status`, { status });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update status');
    }
    return response.data;
  }

  async deleteRecord(id: string): Promise<void> {
    const response = await apiClient.delete(`/payroll/records/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete payroll record');
    }
  }
}

// Export singleton instance
export const payrollService = new PayrollService();
