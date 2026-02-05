import { useState, useEffect, useCallback } from 'react';
import { adminAnalyticsService } from '@/services/adminAnalytics.service';
import type {
  Period,
  DashboardStats,
  UserAnalytics,
  BookingAnalytics,
  FinancialAnalytics,
  ReferralAnalytics,
  ContentAnalytics,
  TrafficAnalytics,
  SystemHealth,
  AdminDashboardData
} from '@/types/admin.types';

export interface UseAdminAnalyticsOptions {
  period?: Period;
  autoFetch?: boolean;
  onError?: (error: Error) => void;
}

export interface UseAdminAnalyticsReturn {
  data: AdminDashboardData | null;
  stats: DashboardStats | null;
  userAnalytics: UserAnalytics | null;
  bookingAnalytics: BookingAnalytics | null;
  financialAnalytics: FinancialAnalytics | null;
  contentAnalytics: ContentAnalytics | null;
  trafficAnalytics: TrafficAnalytics | null;
  systemHealth: SystemHealth | null;
  referralAnalytics: ReferralAnalytics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPeriod: (period: Period) => void;
}

/**
 * Custom hook for fetching and managing admin analytics data
 *
 * @param options - Configuration options
 * @returns Admin analytics data and utilities
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch, setPeriod } = useAdminAnalytics({
 *   period: '30d',
 *   autoFetch: true
 * });
 * ```
 */
export const useAdminAnalytics = (
  options: UseAdminAnalyticsOptions = {}
): UseAdminAnalyticsReturn => {
  const { period: initialPeriod = '30d', autoFetch = true, onError } = options;

  const [period, setPeriod] = useState<Period>(initialPeriod);
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const dashboardData = await adminAnalyticsService.getAllDashboardData(period);
      setData(dashboardData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch analytics data';
      setError(errorMessage);
      console.error('useAdminAnalytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [period]); // Remove onError from deps to prevent infinite re-render loop

  // Call onError separately when error state changes
  useEffect(() => {
    if (error && onError) {
      onError(new Error(error));
    }
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fetch on mount and when period changes
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return {
    data,
    stats: data?.stats || null,
    userAnalytics: data?.userAnalytics || null,
    bookingAnalytics: data?.bookingAnalytics || null,
    financialAnalytics: data?.financialAnalytics || null,
    contentAnalytics: data?.contentAnalytics || null,
    trafficAnalytics: data?.trafficAnalytics || null,
    systemHealth: data?.systemHealth || null,
    referralAnalytics: data?.referralAnalytics || null,
    loading,
    error,
    refetch: fetchData,
    setPeriod
  };
};

/**
 * Hook for fetching specific analytics section
 * Useful when you only need one section instead of all data
 */
export const useSpecificAnalytics = <T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
      console.error('useSpecificAnalytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, ...dependencies]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch
  };
};

export default useAdminAnalytics;
