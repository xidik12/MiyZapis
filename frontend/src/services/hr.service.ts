import { apiClient } from './api';

// ---------------------------------------------------------------------------
// HR module – Attendance, Leaves, Shifts, Staff.
// Backend routes mounted at /hr.
// ---------------------------------------------------------------------------

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'HALF_DAY';
export type LeaveType = 'VACATION' | 'SICK' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface HrSummary {
  staffCount: number;
  presentToday: number;
  onLeaveToday: number;
  pendingLeaves: number;
  isEmployer: boolean;
}

export interface Staff {
  staffUserId: string;
  name: string;
  avatar?: string | null;
  role: string;
  isSelf: boolean;
}

export interface AttendanceRecord {
  id: string;
  staffUserId: string;
  staffName: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  minutesWorked?: number | null;
  status: AttendanceStatus;
  note?: string | null;
}

export interface LeaveRequest {
  id: string;
  staffUserId: string;
  staffName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string | null;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

export interface Shift {
  id: string;
  staffUserId: string;
  staffName: string;
  startTime: string;
  endTime: string;
  note?: string | null;
}

class HrService {
  // Summary
  async getSummary(): Promise<HrSummary> {
    const res = await apiClient.get<HrSummary>('/hr/summary');
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load HR summary');
    return res.data;
  }

  // Staff
  async getStaff(): Promise<Staff[]> {
    const res = await apiClient.get<{ staff: Staff[] }>('/hr/staff');
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load staff');
    return res.data.staff;
  }

  // Attendance
  async getAttendance(params?: { from?: string; to?: string; staffUserId?: string }): Promise<AttendanceRecord[]> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.staffUserId) query.set('staffUserId', params.staffUserId);
    const path = `/hr/attendance${query.toString() ? `?${query}` : ''}`;
    const res = await apiClient.get<{ records: AttendanceRecord[] }>(path);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load attendance');
    return res.data.records;
  }

  async getTodayAttendance(): Promise<AttendanceRecord | null> {
    const res = await apiClient.get<{ record: AttendanceRecord | null }>('/hr/attendance/today');
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load today attendance');
    return res.data.record;
  }

  async clockIn(staffUserId?: string): Promise<AttendanceRecord> {
    const res = await apiClient.post<{ record: AttendanceRecord }>('/hr/attendance/clock-in', staffUserId ? { staffUserId } : {});
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to clock in');
    return res.data.record;
  }

  async clockOut(staffUserId?: string): Promise<AttendanceRecord> {
    const res = await apiClient.post<{ record: AttendanceRecord }>('/hr/attendance/clock-out', staffUserId ? { staffUserId } : {});
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to clock out');
    return res.data.record;
  }

  async manualAttendance(body: {
    staffUserId: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    status: AttendanceStatus;
    note?: string;
  }): Promise<AttendanceRecord> {
    const res = await apiClient.post<{ record: AttendanceRecord }>('/hr/attendance/manual', body);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to set attendance');
    return res.data.record;
  }

  // Leaves
  async getLeaves(params?: { status?: LeaveStatus; staffUserId?: string }): Promise<LeaveRequest[]> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.staffUserId) query.set('staffUserId', params.staffUserId);
    const path = `/hr/leaves${query.toString() ? `?${query}` : ''}`;
    const res = await apiClient.get<{ leaves: LeaveRequest[] }>(path);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load leaves');
    return res.data.leaves;
  }

  async requestLeave(body: {
    staffUserId?: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
  }): Promise<LeaveRequest> {
    const res = await apiClient.post<{ leave: LeaveRequest }>('/hr/leaves', body);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to request leave');
    return res.data.leave;
  }

  async reviewLeave(id: string, decision: 'APPROVE' | 'REJECT', reviewNote?: string): Promise<LeaveRequest> {
    const res = await apiClient.post<{ leave: LeaveRequest }>(`/hr/leaves/${id}/review`, { decision, reviewNote });
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to review leave');
    return res.data.leave;
  }

  async cancelLeave(id: string): Promise<LeaveRequest> {
    const res = await apiClient.post<{ leave: LeaveRequest }>(`/hr/leaves/${id}/cancel`, {});
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to cancel leave');
    return res.data.leave;
  }

  // Shifts
  async getShifts(params?: { from?: string; to?: string; staffUserId?: string }): Promise<Shift[]> {
    const query = new URLSearchParams();
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.staffUserId) query.set('staffUserId', params.staffUserId);
    const path = `/hr/shifts${query.toString() ? `?${query}` : ''}`;
    const res = await apiClient.get<{ shifts: Shift[] }>(path);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to load shifts');
    return res.data.shifts;
  }

  async createShift(body: { staffUserId: string; startTime: string; endTime: string; note?: string }): Promise<Shift> {
    const res = await apiClient.post<{ shift: Shift }>('/hr/shifts', body);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to create shift');
    return res.data.shift;
  }

  async updateShift(id: string, body: { startTime?: string; endTime?: string; note?: string }): Promise<Shift> {
    const res = await apiClient.put<{ shift: Shift }>(`/hr/shifts/${id}`, body);
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to update shift');
    return res.data.shift;
  }

  async deleteShift(id: string): Promise<void> {
    const res = await apiClient.delete<{ ok: boolean }>(`/hr/shifts/${id}`);
    if (!res.success) throw new Error(res.error?.message || 'Failed to delete shift');
  }
}

export const hrService = new HrService();
