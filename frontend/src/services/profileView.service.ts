import { api } from './api';

export interface ProfileViewStats {
  totalViews: number;
  uniqueViewers: number;
  growth: number;
  viewsByDay: Array<{ date: string; count: number }>;
  period: string;
}

export interface TrackProfileViewResponse {
  tracked: boolean;
  id?: string;
  reason?: string;
}

class ProfileViewService {
  async trackProfileView(specialistId: string): Promise<TrackProfileViewResponse> {
    try {
      const response = await api.post(`/analytics/profile-views/${specialistId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error tracking profile view:', error);
      throw error;
    }
  }

  async getProfileViewStats(period: 'week' | 'month' | 'year' = 'month'): Promise<ProfileViewStats> {
    try {
      const response = await api.get('/analytics/profile-views', {
        params: { period }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching profile view stats:', error);
      throw error;
    }
  }
}

export const profileViewService = new ProfileViewService();