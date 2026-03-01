/**
 * CSV Export Utility
 * Provides functions to export analytics data to CSV format
 */

export interface CSVExportOptions {
  filename?: string;
  headers?: string[];
  data: Record<string, unknown>[];
  fields?: string[];
}

/**
 * Convert data to CSV string
 */
export const convertToCSV = (data: Record<string, unknown>[], fields?: string[]): string => {
  if (!data || data.length === 0) {
    return '';
  }

  // Determine fields from first object if not provided
  const csvFields = fields || Object.keys(data[0]);

  // Create header row
  const headerRow = csvFields.map(field => `"${field}"`).join(',');

  // Create data rows
  const dataRows = data.map(row => {
    return csvFields.map(field => {
      const value = row[field];

      // Handle different data types
      if (value === null || value === undefined) {
        return '""';
      }

      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return `"${value}"`;
    }).join(',');
  });

  return [headerRow, ...dataRows].join('\n');
};

/**
 * Download CSV file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Export data to CSV file
 */
export const exportToCSV = ({ filename, data, fields }: CSVExportOptions): void => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const csvContent = convertToCSV(data, fields);
  const csvFilename = filename || `export_${new Date().toISOString().split('T')[0]}.csv`;

  downloadCSV(csvContent, csvFilename);
};

/**
 * Export dashboard stats to CSV
 */
export const exportDashboardStatsToCSV = (stats: Record<string, unknown>, period: string): void => {
  const data = [
    {
      metric: 'Total Users',
      value: stats.overview.totalUsers,
      period
    },
    {
      metric: 'Total Specialists',
      value: stats.overview.totalSpecialists,
      period
    },
    {
      metric: 'Total Services',
      value: stats.overview.totalServices,
      period
    },
    {
      metric: 'Total Bookings',
      value: stats.overview.totalBookings,
      period
    },
    {
      metric: 'Completed Bookings',
      value: stats.overview.completedBookings,
      period
    },
    {
      metric: 'Total Revenue',
      value: `$${stats.overview.totalRevenue.toFixed(2)}`,
      period
    },
    {
      metric: 'Active Users',
      value: stats.overview.activeUsers,
      period
    },
    {
      metric: 'Conversion Rate',
      value: `${stats.overview.conversionRate.toFixed(2)}%`,
      period
    }
  ];

  exportToCSV({
    filename: `dashboard_overview_${period}_${new Date().toISOString().split('T')[0]}.csv`,
    data,
    fields: ['metric', 'value', 'period']
  });
};

/**
 * Export user analytics to CSV
 */
export const exportUserAnalyticsToCSV = (userAnalytics: Record<string, unknown>, period: string): void => {
  const data = userAnalytics.userTrends.map((trend: Record<string, unknown>) => ({
    date: trend.date,
    userType: trend.user_type,
    count: trend.count,
    period
  }));

  exportToCSV({
    filename: `user_analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`,
    data,
    fields: ['date', 'userType', 'count', 'period']
  });
};

/**
 * Export booking analytics to CSV
 */
export const exportBookingAnalyticsToCSV = (bookingAnalytics: Record<string, unknown>, period: string): void => {
  const data = bookingAnalytics.bookingTrends.map((trend: Record<string, unknown>) => ({
    date: trend.date,
    count: trend.count,
    totalRevenue: trend.totalRevenue || 0,
    period
  }));

  exportToCSV({
    filename: `booking_analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`,
    data,
    fields: ['date', 'count', 'totalRevenue', 'period']
  });
};

/**
 * Export financial analytics to CSV
 */
export const exportFinancialAnalyticsToCSV = (financialAnalytics: Record<string, unknown>, period: string): void => {
  const data = financialAnalytics.revenueTrends.map((trend: Record<string, unknown>) => ({
    date: trend.date,
    totalRevenue: trend.totalRevenue,
    platformFees: trend.platformFees,
    refunds: trend.refunds || 0,
    netRevenue: trend.totalRevenue - (trend.refunds || 0),
    period
  }));

  exportToCSV({
    filename: `financial_analytics_${period}_${new Date().toISOString().split('T')[0]}.csv`,
    data,
    fields: ['date', 'totalRevenue', 'platformFees', 'refunds', 'netRevenue', 'period']
  });
};

/**
 * Export top specialists to CSV
 */
export const exportTopSpecialistsToCSV = (specialists: Record<string, unknown>[]): void => {
  const data = specialists.map((specialist, index) => ({
    rank: index + 1,
    name: specialist.name,
    businessName: specialist.businessName,
    rating: specialist.rating.toFixed(2),
    reviewCount: specialist.reviewCount,
    servicesCount: specialist.servicesCount,
    verified: specialist.isVerified ? 'Yes' : 'No'
  }));

  exportToCSV({
    filename: `top_specialists_${new Date().toISOString().split('T')[0]}.csv`,
    data,
    fields: ['rank', 'name', 'businessName', 'rating', 'reviewCount', 'servicesCount', 'verified']
  });
};

/**
 * Export system health to CSV
 */
export const exportSystemHealthToCSV = (health: Record<string, unknown>): void => {
  const data = [
    {
      component: 'Overall Status',
      status: health.overall,
      timestamp: new Date().toISOString()
    },
    {
      component: 'Database',
      status: health.database.status,
      latency: `${health.database.latency?.toFixed(0)}ms`,
      activeConnections: health.database.connections?.active || 'N/A',
      idleConnections: health.database.connections?.idle || 'N/A'
    },
    {
      component: 'Redis',
      status: health.redis?.status || 'N/A',
      latency: health.redis?.latency ? `${health.redis.latency.toFixed(0)}ms` : 'N/A',
      memoryUsed: health.redis?.memoryUsed ? `${(health.redis.memoryUsed / 1024 / 1024).toFixed(2)} MB` : 'N/A'
    },
    {
      component: 'System',
      uptime: `${Math.floor(health.system.uptime / 1000 / 60)} minutes`,
      memoryPercentage: `${health.system.memory.percentage.toFixed(1)}%`,
      memoryUsed: `${(health.system.memory.used / 1024 / 1024).toFixed(2)} MB`,
      memoryTotal: `${(health.system.memory.total / 1024 / 1024).toFixed(2)} MB`
    },
    {
      component: 'Application',
      activeConnections: health.app.activeConnections,
      requestsPerMinute: health.app.requestsPerMinute,
      avgResponseTime: `${health.app.averageResponseTime.toFixed(0)}ms`,
      errorRate: `${health.app.errorRate.toFixed(2)}%`
    }
  ];

  exportToCSV({
    filename: `system_health_${new Date().toISOString().split('T')[0]}.csv`,
    data
  });
};
