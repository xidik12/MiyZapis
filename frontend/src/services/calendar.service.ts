// API client for /api/v1/calendar/* — Google + Apple connection management.
import { apiClient } from './api';

export type CalendarProvider = 'GOOGLE' | 'APPLE';

export interface CalendarConnection {
  provider: CalendarProvider;
  calendarId?: string;
  calendarName?: string | null;
  syncEnabled?: boolean;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
  createdAt?: string;
}

export interface CalendarStatusResponse {
  connected: boolean;
  provider?: CalendarProvider;
  calendarId?: string;
  calendarName?: string | null;
  syncEnabled?: boolean;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
}

class CalendarService {
  // ── Google ────────────────────────────────────────────────────────────
  async googleStatus(): Promise<CalendarStatusResponse> {
    const res = await apiClient.get<CalendarStatusResponse>('/calendar/google/status');
    return res.data!;
  }

  async googleConnectUrl(): Promise<string> {
    const res = await apiClient.get<{ url: string }>('/calendar/google/connect');
    return res.data!.url;
  }

  async googleDisconnect(): Promise<void> {
    await apiClient.delete('/calendar/google');
  }

  // ── Apple ─────────────────────────────────────────────────────────────
  async appleStatus(): Promise<CalendarStatusResponse> {
    const res = await apiClient.get<CalendarStatusResponse>('/calendar/apple/status');
    return res.data!;
  }

  async appleConnect(appleId: string, appPassword: string): Promise<CalendarStatusResponse> {
    const res = await apiClient.post<CalendarStatusResponse>('/calendar/apple/connect', { appleId, appPassword });
    return res.data!;
  }

  async appleDisconnect(): Promise<void> {
    await apiClient.delete('/calendar/apple');
  }

  // ── Shared ────────────────────────────────────────────────────────────
  /** Re-push the caller's upcoming bookings to ALL connected providers. */
  async resync(): Promise<{ queued: number }> {
    const res = await apiClient.post<{ queued: number }>('/calendar/resync');
    return res.data!;
  }
}

export const calendarService = new CalendarService();
