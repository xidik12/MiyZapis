import { apiClient } from './api';

export interface WaitlistEntry {
  id: string;
  userId: string;
  serviceId: string;
  specialistId: string;
  preferredDate: string;
  preferredTime: string | null;
  status: string; // WAITING, NOTIFIED, BOOKED, CANCELLED, EXPIRED
  notifiedAt: string | null;
  bookedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    basePrice: number;
    currency: string;
    specialistId?: string;
  };
  specialist?: {
    id: string;
    userId: string;
    businessName: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  } | null;
}

export interface JoinWaitlistData {
  serviceId: string;
  specialistId: string;
  preferredDate: string; // ISO date string
  preferredTime?: string;
  notes?: string;
}

export class WaitlistService {
  /**
   * Join the waitlist
   */
  async joinWaitlist(data: JoinWaitlistData): Promise<{ waitlistEntry: WaitlistEntry; message: string }> {
    const response = await apiClient.post<{ waitlistEntry: WaitlistEntry; message: string }>(
      '/waitlist',
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to join waitlist');
    }

    return response.data;
  }

  /**
   * Get current user's active waitlist entries
   */
  async getMyWaitlist(): Promise<{ entries: WaitlistEntry[]; total: number }> {
    const response = await apiClient.get<{ entries: WaitlistEntry[]; total: number }>(
      '/waitlist/my'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get waitlist entries');
    }

    return response.data;
  }

  /**
   * Get waitlist entries for a specialist
   */
  async getSpecialistWaitlist(params?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    entries: WaitlistEntry[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const queryParts: string[] = [];
    if (params?.status) queryParts.push(`status=${params.status}`);
    if (params?.fromDate) queryParts.push(`fromDate=${params.fromDate}`);
    if (params?.toDate) queryParts.push(`toDate=${params.toDate}`);
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.limit) queryParts.push(`limit=${params.limit}`);

    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    const response = await apiClient.get<{
      entries: WaitlistEntry[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/waitlist/specialist${queryString}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist waitlist');
    }

    return response.data;
  }

  /**
   * Leave/cancel a waitlist entry
   */
  async leaveWaitlist(waitlistId: string): Promise<{ waitlistEntry: WaitlistEntry; message: string }> {
    const response = await apiClient.delete<{ waitlistEntry: WaitlistEntry; message: string }>(
      `/waitlist/${waitlistId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to leave waitlist');
    }

    return response.data;
  }
}

export const waitlistService = new WaitlistService();
