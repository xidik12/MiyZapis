import React, { useEffect, useState } from 'react';
import {
  ServerIcon,
  CircleStackIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { HealthIndicator } from '../ui/HealthIndicator';
import { MetricCard } from '../ui/MetricCard';
import { adminAnalyticsService } from '@/services/adminAnalytics.service';
import type { SystemHealth } from '@/types/admin.types';

export interface SystemHealthSectionProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export const SystemHealthSection: React.FC<SystemHealthSectionProps> = ({
  autoRefresh = true,
  refreshInterval = 30
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAnalyticsService.getSystemHealth();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to fetch system health');
      console.error('System health error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealth();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  if (loading && !health) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-400 mb-2">
          Failed to Load System Health
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={fetchHealth}
          className="mt-4 text-sm font-medium text-red-800 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="space-y-6">
      {/* Header with Status and Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <HealthIndicator
            status={health.overall}
            label={health.overall === 'healthy' ? 'All Systems Operational' : health.overall === 'degraded' ? 'Degraded Performance' : 'System Down'}
            size="lg"
          />
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors duration-200"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Service Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database Health */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Database
            </h3>
            <CircleStackIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <HealthIndicator
            status={health.database.status}
            label={health.database.status === 'healthy' ? 'Connected' : 'Issues Detected'}
            className="mb-4"
          />
          {health.database.latency !== undefined && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Latency:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {health.database.latency.toFixed(0)}ms
                </span>
              </div>
              {health.database.connections && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Active:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {health.database.connections.active}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Idle:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {health.database.connections.idle}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Redis Health */}
        {health.redis && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Redis Cache
              </h3>
              <ServerIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <HealthIndicator
              status={health.redis.status}
              label={health.redis.status === 'healthy' ? 'Connected' : 'Issues Detected'}
              className="mb-4"
            />
            {health.redis.memoryUsed !== undefined && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Latency:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {health.redis.latency?.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatBytes(health.redis.memoryUsed)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System
            </h3>
            <CpuChipIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatUptime(health.system.uptime)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Memory:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health.system.memory.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  health.system.memory.percentage > 80
                    ? 'bg-red-600'
                    : health.system.memory.percentage > 60
                    ? 'bg-yellow-600'
                    : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(health.system.memory.percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{formatBytes(health.system.memory.used)}</span>
              <span>{formatBytes(health.system.memory.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Application Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Application Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Active Connections"
            value={health.app.activeConnections}
            icon={<ServerIcon className="w-5 h-5" />}
            color="primary"
          />
          <MetricCard
            label="Requests/Min"
            value={health.app.requestsPerMinute}
            icon={<ClockIcon className="w-5 h-5" />}
            color="success"
          />
          <MetricCard
            label="Avg Response Time"
            value={`${health.app.averageResponseTime.toFixed(0)}ms`}
            icon={<ClockIcon className="w-5 h-5" />}
            color={health.app.averageResponseTime > 1000 ? 'warning' : 'success'}
          />
          <MetricCard
            label="Error Rate"
            value={`${health.app.errorRate.toFixed(2)}%`}
            icon={<ServerIcon className="w-5 h-5" />}
            color={health.app.errorRate > 5 ? 'danger' : health.app.errorRate > 2 ? 'warning' : 'success'}
          />
        </div>
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Auto-refreshing every {refreshInterval} seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemHealthSection;
