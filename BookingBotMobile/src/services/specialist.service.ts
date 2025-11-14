// Specialist service - adapted for React Native
import { apiClient } from './api';
import {
  Specialist,
  SpecialistAvailability,
  SpecialistAnalytics,
  BlockedSlot,
} from '../types';

export class SpecialistService {
  // Get specialist profile (for specialists accessing their own profile)
  async getProfile(): Promise<Specialist> {
    const response = await apiClient.get<Specialist>('/specialists/profile');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist profile');
    }
    return response.data;
  }

  // Get public specialist profile (for customers)
  async getPublicProfile(specialistId: string): Promise<Specialist> {
    const response = await apiClient.get<{ specialist: Specialist }>(`/specialists/${specialistId}/public`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist profile');
    }
    return response.data.specialist || response.data;
  }

  // Update specialist profile
  async updateProfile(data: Partial<Specialist>): Promise<Specialist> {
    const response = await apiClient.put<Specialist>('/specialists/profile', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update specialist profile');
    }
    return response.data;
  }

  // Get specialist availability
  async getAvailability(specialistId: string, startDate: string, endDate: string): Promise<SpecialistAvailability> {
    const params = new URLSearchParams({
      specialistId,
      startDate,
      endDate,
    });

    const response = await apiClient.get<SpecialistAvailability>(`/specialists/${specialistId}/availability?${params}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get availability');
    }
    return response.data;
  }

  // Update availability
  async updateAvailability(data: {
    workingHours?: any;
    blockedSlots?: BlockedSlot[];
    timezone?: string;
  }): Promise<SpecialistAvailability> {
    const response = await apiClient.put<SpecialistAvailability>('/specialists/availability', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update availability');
    }
    return response.data;
  }

  // Get specialist analytics
  async getAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<SpecialistAnalytics> {
    const response = await apiClient.get<SpecialistAnalytics>(`/specialists/analytics?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get analytics');
    }
    return response.data;
  }

  // Get specialist revenue
  async getRevenue(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    thisMonth: number;
    lastMonth: number;
    total: number;
    growth?: number;
  }> {
    const response = await apiClient.get<{
      thisMonth: number;
      lastMonth: number;
      total: number;
      growth?: number;
    }>(`/specialists/revenue?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get revenue');
    }
    return response.data || { thisMonth: 0, lastMonth: 0, total: 0 };
  }

  // Get list of specialists
  async getSpecialists(filters: {
    category?: string;
    location?: string;
    rating?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    specialists: Specialist[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{
      specialists: Specialist[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/specialists?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialists');
    }
    
    return {
      specialists: response.data.specialists || [],
      pagination: {
        currentPage: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        hasNext: (response.data.page || 1) < (response.data.totalPages || 1),
        hasPrev: (response.data.page || 1) > 1,
        limit: filters.limit || 20,
      }
    };
  }

  // Get team members (for Business accounts)
  async getTeamMembers(): Promise<{
    members: Array<{
      id: string;
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string;
      role: string;
      permissions: string[];
      isActive: boolean;
      createdAt: string;
    }>;
  }> {
    const response = await apiClient.get<{
      members: Array<{
        id: string;
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
        role: string;
        permissions: string[];
        isActive: boolean;
        createdAt: string;
      }>;
    }>('/specialists/team-members');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get team members');
    }
    return response.data || { members: [] };
  }

  // Add team member (for Business accounts)
  async addTeamMember(data: {
    email: string;
    role: string;
    permissions?: string[];
  }): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/specialists/team-members', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add team member');
    }
    return response.data || { message: 'Team member added successfully' };
  }

  // Update team member
  async updateTeamMember(memberId: string, data: {
    role?: string;
    permissions?: string[];
    isActive?: boolean;
  }): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(`/specialists/team-members/${memberId}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update team member');
    }
    return response.data || { message: 'Team member updated successfully' };
  }

  // Remove team member
  async removeTeamMember(memberId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/specialists/team-members/${memberId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove team member');
    }
    return response.data || { message: 'Team member removed successfully' };
  }
}

export const specialistService = new SpecialistService();

