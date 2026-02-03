import { apiClient } from './api';
import type {
  Period,
  DashboardStats,
  UserAnalytics,
  BookingAnalytics,
  FinancialAnalytics,
  ReferralAnalytics,
  SystemHealth,
  ContentAnalytics,
  TrafficAnalytics,
  AdminDashboardData,
  UserManagementRequest,
  UserManagementResponse
} from '@/types/admin.types';

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly TTL = 30000; // 30 seconds

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.TTL;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear entries matching pattern
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  invalidate(keys: string[]): void {
    keys.forEach(key => this.cache.delete(key));
  }
}

export class AdminAnalyticsService {
  private cache = new CacheManager();

  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================

  /**
   * Get comprehensive dashboard statistics
   * Includes overview metrics, growth rates, recent activity, and analytics
   */
  async getDashboardStats(period: Period = '30d'): Promise<DashboardStats> {
    const cacheKey = `dashboard-stats:${period}`;
    const cached = this.cache.get<DashboardStats>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get<{ stats: DashboardStats }>(
        `/admin/dashboard/stats?period=${period}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get dashboard stats');
      }

      const stats = response.data.stats;
      this.cache.set(cacheKey, stats);
      return stats;
    } catch (error: any) {
      console.error('Admin dashboard stats error:', error);
      throw new Error(error.message || 'Failed to get dashboard statistics');
    }
  }

  // ============================================================================
  // USER ANALYTICS
  // ============================================================================

  /**
   * Get detailed user analytics
   * Includes registration trends, engagement, geographic distribution
   */
  async getUserAnalytics(period: Period = '30d', userType?: string): Promise<UserAnalytics> {
    const cacheKey = `user-analytics:${period}:${userType || 'all'}`;
    const cached = this.cache.get<UserAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({ period });
      if (userType) params.append('userType', userType);

      const response = await apiClient.get<UserAnalytics>(
        `/admin/analytics/users?${params.toString()}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get user analytics');
      }

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Admin user analytics error:', error);
      throw new Error(error.message || 'Failed to get user analytics');
    }
  }

  // ============================================================================
  // BOOKING ANALYTICS
  // ============================================================================

  /**
   * Get booking analytics and trends
   * Includes status distribution, popular services, peak hours
   */
  async getBookingAnalytics(period: Period = '30d'): Promise<BookingAnalytics> {
    const cacheKey = `booking-analytics:${period}`;
    const cached = this.cache.get<BookingAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get<BookingAnalytics>(
        `/admin/analytics/bookings?period=${period}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get booking analytics');
      }

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Admin booking analytics error:', error);
      throw new Error(error.message || 'Failed to get booking analytics');
    }
  }

  // ============================================================================
  // FINANCIAL ANALYTICS
  // ============================================================================

  /**
   * Get financial analytics and revenue data
   * Includes revenue trends, payment methods, top earners, refund analysis
   */
  async getFinancialAnalytics(period: Period = '30d'): Promise<FinancialAnalytics> {
    const cacheKey = `financial-analytics:${period}`;
    const cached = this.cache.get<FinancialAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get<FinancialAnalytics>(
        `/admin/analytics/financial?period=${period}`
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get financial analytics');
      }

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Admin financial analytics error:', error);
      throw new Error(error.message || 'Failed to get financial analytics');
    }
  }

  // ============================================================================
  // REFERRAL ANALYTICS
  // ============================================================================

  /**
   * Get referral program analytics
   * Includes referral stats, top referrers, conversion rates
   */
  async getReferralAnalytics(): Promise<ReferralAnalytics> {
    const cacheKey = 'referral-analytics';
    const cached = this.cache.get<ReferralAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      const response = await apiClient.get<ReferralAnalytics>(
        '/admin/analytics/referrals'
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get referral analytics');
      }

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error: any) {
      console.error('Admin referral analytics error:', error);
      throw new Error(error.message || 'Failed to get referral analytics');
    }
  }

  // ============================================================================
  // SYSTEM HEALTH
  // ============================================================================

  /**
   * Get system health metrics
   * Includes database, Redis, system metrics, app performance
   */
  async getSystemHealth(): Promise<SystemHealth> {
    // Don't cache health metrics - always fetch fresh
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

  // ============================================================================
  // CONTENT ANALYTICS (Aggregated from posts/comments endpoints)
  // ============================================================================

  /**
   * Get content analytics for community posts
   * Aggregates data from posts and comments
   */
  async getContentAnalytics(period: Period = '30d'): Promise<ContentAnalytics> {
    const cacheKey = `content-analytics:${period}`;
    const cached = this.cache.get<ContentAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      // Calculate date range based on period
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[period];

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Fetch posts data (assuming there's a posts endpoint)
      // Note: This might need adjustment based on actual API endpoints available
      const [postsResponse] = await Promise.all([
        apiClient.get<any>('/posts')
      ]);

      if (!postsResponse.success || !postsResponse.data) {
        throw new Error('Failed to fetch content data');
      }

      const posts = postsResponse.data.posts || postsResponse.data || [];

      // Filter posts by date range
      const filteredPosts = posts.filter((post: any) => {
        const postDate = new Date(post.createdAt);
        return postDate >= startDate && postDate <= endDate;
      });

      // Calculate metrics
      const discussions = filteredPosts.filter((p: any) => p.type === 'DISCUSSION');
      const marketplace = filteredPosts.filter((p: any) => p.type === 'SALE');

      const metrics = {
        totalPosts: filteredPosts.length,
        totalDiscussions: discussions.length,
        totalMarketplace: marketplace.length,
        totalViews: filteredPosts.reduce((sum: number, p: any) => sum + (p.viewCount || 0), 0),
        totalLikes: filteredPosts.reduce((sum: number, p: any) => sum + (p.likeCount || 0), 0),
        totalComments: filteredPosts.reduce((sum: number, p: any) => sum + (p.commentCount || 0), 0),
        avgEngagementRate: 0
      };

      if (metrics.totalViews > 0) {
        metrics.avgEngagementRate =
          ((metrics.totalLikes + metrics.totalComments) / metrics.totalViews) * 100;
      }

      // Group by date for trends
      const trendMap = new Map<string, any>();
      filteredPosts.forEach((post: any) => {
        const date = new Date(post.createdAt).toISOString().split('T')[0];
        if (!trendMap.has(date)) {
          trendMap.set(date, {
            date,
            discussions: 0,
            marketplace: 0,
            totalViews: 0,
            totalEngagement: 0
          });
        }
        const trend = trendMap.get(date);
        if (post.type === 'DISCUSSION') trend.discussions++;
        if (post.type === 'SALE') trend.marketplace++;
        trend.totalViews += post.viewCount || 0;
        trend.totalEngagement += (post.likeCount || 0) + (post.commentCount || 0);
      });

      const trends = Array.from(trendMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );

      // Top posts
      const topPosts = filteredPosts
        .sort((a: any, b: any) => {
          const aEngagement = (a.viewCount || 0) + (a.likeCount || 0) * 2 + (a.commentCount || 0) * 3;
          const bEngagement = (b.viewCount || 0) + (b.likeCount || 0) * 2 + (b.commentCount || 0) * 3;
          return bEngagement - aEngagement;
        })
        .slice(0, 10)
        .map((post: any) => ({
          id: post.id,
          title: post.title,
          type: post.type,
          viewCount: post.viewCount || 0,
          likeCount: post.likeCount || 0,
          commentCount: post.commentCount || 0,
          createdAt: post.createdAt,
          author: {
            id: post.userId || post.authorId || '',
            firstName: post.user?.firstName || '',
            lastName: post.user?.lastName || ''
          }
        }));

      // Engagement by type
      const engagementByType = [
        {
          type: 'DISCUSSION' as const,
          avgViews: discussions.length > 0
            ? discussions.reduce((sum: number, p: any) => sum + (p.viewCount || 0), 0) / discussions.length
            : 0,
          avgLikes: discussions.length > 0
            ? discussions.reduce((sum: number, p: any) => sum + (p.likeCount || 0), 0) / discussions.length
            : 0,
          avgComments: discussions.length > 0
            ? discussions.reduce((sum: number, p: any) => sum + (p.commentCount || 0), 0) / discussions.length
            : 0
        },
        {
          type: 'SALE' as const,
          avgViews: marketplace.length > 0
            ? marketplace.reduce((sum: number, p: any) => sum + (p.viewCount || 0), 0) / marketplace.length
            : 0,
          avgLikes: marketplace.length > 0
            ? marketplace.reduce((sum: number, p: any) => sum + (p.likeCount || 0), 0) / marketplace.length
            : 0,
          avgComments: marketplace.length > 0
            ? marketplace.reduce((sum: number, p: any) => sum + (p.commentCount || 0), 0) / marketplace.length
            : 0
        }
      ];

      const contentAnalytics: ContentAnalytics = {
        metrics,
        trends,
        topPosts,
        engagementByType
      };

      this.cache.set(cacheKey, contentAnalytics);
      return contentAnalytics;
    } catch (error: any) {
      console.error('Content analytics error:', error);
      // Return empty analytics on error
      return {
        metrics: {
          totalPosts: 0,
          totalDiscussions: 0,
          totalMarketplace: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          avgEngagementRate: 0
        },
        trends: [],
        topPosts: [],
        engagementByType: [
          { type: 'DISCUSSION', avgViews: 0, avgLikes: 0, avgComments: 0 },
          { type: 'SALE', avgViews: 0, avgLikes: 0, avgComments: 0 }
        ]
      };
    }
  }

  // ============================================================================
  // TRAFFIC ANALYTICS (Profile views + referrals)
  // ============================================================================

  /**
   * Get traffic and profile view analytics
   * Includes view trends, traffic sources, top profiles
   */
  async getTrafficAnalytics(period: Period = '30d'): Promise<TrafficAnalytics> {
    const cacheKey = `traffic-analytics:${period}`;
    const cached = this.cache.get<TrafficAnalytics>(cacheKey);
    if (cached) return cached;

    try {
      // Fetch profile views data
      // Note: Adjust endpoint based on actual API structure
      const response = await apiClient.get<any>(
        `/analytics/profile-views?period=${period}`
      );

      if (!response.success) {
        throw new Error('Failed to fetch traffic data');
      }

      // Get referral analytics for conversion metrics
      const referralData = await this.getReferralAnalytics();

      // Mock traffic analytics structure
      // In production, this should aggregate real profile view data
      const trafficAnalytics: TrafficAnalytics = {
        totalViews: response.data?.totalViews || 0,
        uniqueVisitors: response.data?.uniqueVisitors || 0,
        viewTrends: response.data?.trends || [],
        trafficSources: response.data?.sources || [],
        topViewedProfiles: response.data?.topProfiles || [],
        referralMetrics: {
          totalClicks: referralData.totalReferrals || 0,
          totalConversions: referralData.completedReferrals || 0,
          conversionRate: referralData.conversionRate || 0
        }
      };

      this.cache.set(cacheKey, trafficAnalytics);
      return trafficAnalytics;
    } catch (error: any) {
      console.error('Traffic analytics error:', error);
      // Return empty analytics on error
      return {
        totalViews: 0,
        uniqueVisitors: 0,
        viewTrends: [],
        trafficSources: [],
        topViewedProfiles: [],
        referralMetrics: {
          totalClicks: 0,
          totalConversions: 0,
          conversionRate: 0
        }
      };
    }
  }

  // ============================================================================
  // COMBINED DASHBOARD DATA (Parallel fetch all sections)
  // ============================================================================

  /**
   * Fetch all dashboard data in parallel
   * Optimized for initial dashboard load
   */
  async getAllDashboardData(period: Period = '30d'): Promise<AdminDashboardData> {
    // Use Promise.allSettled to allow partial success - individual endpoint failures won't break the entire dashboard
    const results = await Promise.allSettled([
      this.getDashboardStats(period),
      this.getUserAnalytics(period),
      this.getBookingAnalytics(period),
      this.getFinancialAnalytics(period),
      this.getContentAnalytics(period),
      this.getTrafficAnalytics(period),
      this.getSystemHealth(),
      this.getReferralAnalytics()
    ]);

    // Extract successful results, log failures
    const [
      statsResult,
      userAnalyticsResult,
      bookingAnalyticsResult,
      financialAnalyticsResult,
      contentAnalyticsResult,
      trafficAnalyticsResult,
      systemHealthResult,
      referralAnalyticsResult
    ] = results;

    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const names = ['stats', 'userAnalytics', 'bookingAnalytics', 'financialAnalytics', 'contentAnalytics', 'trafficAnalytics', 'systemHealth', 'referralAnalytics'];
        console.warn(`Failed to fetch ${names[index]}:`, result.reason);
      }
    });

    return {
      stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
      userAnalytics: userAnalyticsResult.status === 'fulfilled' ? userAnalyticsResult.value : null,
      bookingAnalytics: bookingAnalyticsResult.status === 'fulfilled' ? bookingAnalyticsResult.value : null,
      financialAnalytics: financialAnalyticsResult.status === 'fulfilled' ? financialAnalyticsResult.value : null,
      contentAnalytics: contentAnalyticsResult.status === 'fulfilled' ? contentAnalyticsResult.value : null,
      trafficAnalytics: trafficAnalyticsResult.status === 'fulfilled' ? trafficAnalyticsResult.value : null,
      systemHealth: systemHealthResult.status === 'fulfilled' ? systemHealthResult.value : null,
      referralAnalytics: referralAnalyticsResult.status === 'fulfilled' ? referralAnalyticsResult.value : null
    };
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  /**
   * Manage users (activate, deactivate, delete)
   */
  async manageUsers(request: UserManagementRequest): Promise<UserManagementResponse> {
    try {
      const response = await apiClient.post<UserManagementResponse>(
        '/admin/users/manage',
        request
      );

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to manage users');
      }

      // Invalidate related caches
      this.cache.clear('user-analytics');
      this.cache.clear('dashboard-stats');

      return response.data;
    } catch (error: any) {
      console.error('Admin manage users error:', error);
      throw new Error(error.message || 'Failed to manage users');
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for specific period
   */
  clearCacheForPeriod(period: Period): void {
    this.cache.clear(period);
  }

  /**
   * Manually refresh data and invalidate cache
   */
  async refresh(period: Period = '30d'): Promise<AdminDashboardData> {
    this.clearCacheForPeriod(period);
    return this.getAllDashboardData(period);
  }
}

// Export singleton instance
export const adminAnalyticsService = new AdminAnalyticsService();
