import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/environment';
import { ApiResponse } from '../types';

export interface AnalyticsOverview {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  responseTime: number; // in minutes
  newCustomers: number;
  repeatCustomers: number;
  period: {
    start: string;
    end: string;
  };
}

export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  bookingsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  bookingsByDay: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  bookingsByService: Array<{
    serviceId: string;
    serviceName: string;
    count: number;
    revenue: number;
  }>;
  averageBookingValue: number;
  period: {
    start: string;
    end: string;
  };
}

export interface RevenueAnalytics {
  totalRevenue: number;
  totalPayouts: number;
  platformFee: number;
  netRevenue: number;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByService: Array<{
    serviceId: string;
    serviceName: string;
    revenue: number;
    bookings: number;
  }>;
  averageDailyRevenue: number;
  period: {
    start: string;
    end: string;
  };
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageCustomerValue: number;
  customersByRegion: Array<{
    region: string;
    count: number;
    percentage: number;
  }>;
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalBookings: number;
    totalSpent: number;
    lastBooking: string;
  }>;
  customerAcquisitionByMonth: Array<{
    month: string;
    newCustomers: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface PerformanceAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  averageResponseTime: number; // in minutes
  responseTimeByDay: Array<{
    date: string;
    averageResponseTime: number;
  }>;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
  onTimePerformance: number; // percentage
  period: {
    start: string;
    end: string;
  };
}

export interface ServiceAnalytics {
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
    averageRating: number;
    growthRate: number;
  }>;
  servicePerformance: Array<{
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
    averageRating: number;
    completionRate: number;
    cancellationRate: number;
  }>;
  serviceGrowth: Array<{
    serviceId: string;
    serviceName: string;
    currentPeriodBookings: number;
    previousPeriodBookings: number;
    growthRate: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  serviceId?: string;
  customerId?: string;
  region?: string;
  status?: string;
}

export class AnalyticsService {
  // Get analytics overview
  async getOverview(filters: AnalyticsFilters = {}): Promise<AnalyticsOverview> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      // Try specialist-specific analytics first, then fall back to general analytics
      let response;
      try {
        console.log('🔍 Trying specialist analytics endpoint...');
        response = await apiClient.get<AnalyticsOverview>(`${API_ENDPOINTS.ANALYTICS.SPECIALIST_OVERVIEW}?${params}`);
      } catch (specialistError: any) {
        console.log('🔍 Specialist analytics failed, trying general analytics:', specialistError.response?.status);
        if (specialistError.response?.status === 404) {
          // If specialist endpoint doesn't exist, try the general one
          response = await apiClient.get<AnalyticsOverview>(`${API_ENDPOINTS.ANALYTICS.OVERVIEW}?${params}`);
        } else {
          throw specialistError;
        }
      }
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get analytics overview');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get analytics overview';
      console.error('Analytics overview API call failed:', errorMessage);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw new Error(errorMessage);
    }
  }

  // Get booking analytics
  async getBookingAnalytics(filters: AnalyticsFilters = {}): Promise<BookingAnalytics> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<BookingAnalytics>(`${API_ENDPOINTS.ANALYTICS.BOOKINGS}?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get booking analytics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get booking analytics';
      throw new Error(errorMessage);
    }
  }

  // Get revenue analytics
  async getRevenueAnalytics(filters: AnalyticsFilters = {}): Promise<RevenueAnalytics> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<RevenueAnalytics>(`${API_ENDPOINTS.ANALYTICS.REVENUE}?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get revenue analytics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get revenue analytics';
      throw new Error(errorMessage);
    }
  }

  // Get customer analytics
  async getCustomerAnalytics(filters: AnalyticsFilters = {}): Promise<CustomerAnalytics> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<CustomerAnalytics>(`${API_ENDPOINTS.ANALYTICS.CUSTOMERS}?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get customer analytics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get customer analytics';
      throw new Error(errorMessage);
    }
  }

  // Get performance analytics
  async getPerformanceAnalytics(filters: AnalyticsFilters = {}): Promise<PerformanceAnalytics> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<PerformanceAnalytics>(`${API_ENDPOINTS.ANALYTICS.PERFORMANCE}?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get performance analytics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get performance analytics';
      throw new Error(errorMessage);
    }
  }

  // Get service analytics
  async getServiceAnalytics(filters: AnalyticsFilters = {}): Promise<ServiceAnalytics> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<ServiceAnalytics>(`${API_ENDPOINTS.ANALYTICS.SERVICES}?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get service analytics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get service analytics';
      throw new Error(errorMessage);
    }
  }

  // Export analytics data
  async exportAnalytics(type: 'bookings' | 'revenue' | 'customers' | 'performance', filters: AnalyticsFilters = {}, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      params.append('format', format);

      params.append('type', type);
      
      const response = await apiClient.get(`/analytics/export?${params}`, {
        responseType: 'blob',
      });

      if (!response.success) {
        throw new Error('Failed to export analytics data');
      }

      return response.data as Blob;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to export analytics data';
      throw new Error(errorMessage);
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics(): Promise<{
    activeBookings: number;
    onlineSpecialists: number;
    todayRevenue: number;
    todayBookings: number;
    pendingPayments: number;
    lastUpdated: string;
  }> {
    try {
      const response = await apiClient.get<{
        activeBookings: number;
        onlineSpecialists: number;
        todayRevenue: number;
        todayBookings: number;
        pendingPayments: number;
        lastUpdated: string;
      }>('/analytics/real-time');

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get real-time metrics');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get real-time metrics';
      throw new Error(errorMessage);
    }
  }
}

export const analyticsService = new AnalyticsService();
