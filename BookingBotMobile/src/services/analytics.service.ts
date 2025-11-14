// Analytics service - adapted for React Native
import { apiClient } from './api';
import { SpecialistAnalytics } from '../types';

export class AnalyticsService {
  // Get specialist analytics
  async getSpecialistAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<SpecialistAnalytics> {
    const response = await apiClient.get<SpecialistAnalytics>(`/specialists/analytics?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist analytics');
    }
    return response.data;
  }

  // Get specialist revenue
  async getSpecialistRevenue(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    thisMonth: number;
    lastMonth: number;
    total: number;
    growth?: number;
  }> {
    const response = await apiClient.get(`/specialists/revenue?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist revenue');
    }
    return response.data;
  }

  // Get booking analytics
  async getBookingAnalytics(period: 'week' | 'month' | 'year' = 'month'): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    completionRate: number;
    averageRating: number;
  }> {
    const response = await apiClient.get(`/analytics/bookings?period=${period}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get booking analytics');
    }
    return response.data;
  }

  // Get service performance
  async getServicePerformance(serviceId: string): Promise<{
    bookings: number;
    revenue: number;
    averageRating: number;
    completionRate: number;
  }> {
    const response = await apiClient.get(`/analytics/services/${serviceId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get service performance');
    }
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();

