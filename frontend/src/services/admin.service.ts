import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/environment';

export interface AdminStats {
  totalUsers: number;
  totalSpecialists: number;
  totalBookings: number;
  totalRevenue: number;
  pendingVerifications: number;
  reportedUsers: number;
  activeUsers24h: number;
  popularSearches: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  type: 'customer' | 'specialist' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  verified: boolean;
  joinDate: string;
  lastActive: string;
  totalBookings: number;
  totalRevenue?: number;
}

export interface UserManagementRequest {
  action: 'activate' | 'deactivate' | 'delete';
  userIds: string[];
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
  };
  metadata?: any;
  createdAt: string;
}

export interface SystemHealth {
  totalUsers: number;
  activeUsers: number;
  totalBookings: number;
  todayBookings: number;
  uptime: string;
  lastUpdated: string;
}

export class AdminService {
  // Get dashboard statistics
  async getDashboardStats(): Promise<AdminStats> {
    try {
      const response = await apiClient.get<AdminStats>('/admin/dashboard/stats');
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get dashboard stats');
      }
      return response.data;
    } catch (error: any) {
      console.error('Admin dashboard stats error:', error);
      throw new Error(error.message || 'Failed to get dashboard statistics');
    }
  }

  // Get user analytics
  async getUserAnalytics(period: string = '30d'): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/admin/analytics/users?period=${period}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get user analytics');
      }
      return response.data;
    } catch (error: any) {
      console.error('Admin user analytics error:', error);
      throw new Error(error.message || 'Failed to get user analytics');
    }
  }

  // Get booking analytics
  async getBookingAnalytics(period: string = '30d'): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/admin/analytics/bookings?period=${period}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get booking analytics');
      }
      return response.data;
    } catch (error: any) {
      console.error('Admin booking analytics error:', error);
      throw new Error(error.message || 'Failed to get booking analytics');
    }
  }

  // Get financial analytics
  async getFinancialAnalytics(period: string = '30d'): Promise<any> {
    try {
      const response = await apiClient.get<any>(`/admin/analytics/financial?period=${period}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get financial analytics');
      }
      return response.data;
    } catch (error: any) {
      console.error('Admin financial analytics error:', error);
      throw new Error(error.message || 'Failed to get financial analytics');
    }
  }

  // Manage users (activate, deactivate, delete)
  async manageUsers(request: UserManagementRequest): Promise<{ message: string; affectedCount: number }> {
    try {
      const response = await apiClient.post<{ message: string; affectedCount: number }>('/admin/users/manage', request);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to manage users');
      }
      return response.data;
    } catch (error: any) {
      console.error('Admin manage users error:', error);
      throw new Error(error.message || 'Failed to manage users');
    }
  }

  // Get system health metrics
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await apiClient.get<SystemHealth>('/admin/system/health');
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get system health');
      }
      return response.data;
    } catch (error: any) {
      console.error('Admin system health error:', error);
      throw new Error(error.message || 'Failed to get system health');
    }
  }

  // Get audit logs
  async getAuditLogs(page: number = 1, limit: number = 50, filters?: any): Promise<{
    auditLogs: AuditLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await apiClient.get<{
        auditLogs: AuditLog[];
        pagination: any;
      }>(`/admin/audit-logs?${params.toString()}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get audit logs');
      }
      return response.data;
    } catch (error: any) {
      console.error('Admin audit logs error:', error);
      throw new Error(error.message || 'Failed to get audit logs');
    }
  }
}

export const adminService = new AdminService();