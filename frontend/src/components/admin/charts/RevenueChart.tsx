import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

export interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue?: number;
    fees?: number;
    refunds?: number;
    [key: string]: any;
  }>;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  loading?: boolean;
  className?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  showGrid = true,
  loading = false,
  className = ''
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const colors = {
    revenue: '#3B82F6', // Blue
    fees: '#10B981', // Green
    refunds: '#EF4444' // Red
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse ${className}`} style={{ height }}>
        <div className="h-full flex items-center justify-center">
          <span className="text-gray-400 dark:text-gray-600">Loading chart...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-900 rounded-lg ${className}`} style={{ height }}>
        <div className="h-full flex items-center justify-center">
          <span className="text-gray-500 dark:text-gray-400">No data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#374151' : '#E5E7EB'}
            />
          )}
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke={isDark ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke={isDark ? '#9CA3AF' : '#6B7280'}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '12px'
            }}
            labelStyle={{ color: isDark ? '#F3F4F6' : '#111827', fontWeight: 600 }}
            itemStyle={{ color: isDark ? '#D1D5DB' : '#6B7280' }}
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={formatDate}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
          )}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke={colors.revenue}
            strokeWidth={2}
            dot={{ fill: colors.revenue, r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue"
          />
          {data.some(d => d.fees !== undefined) && (
            <Line
              type="monotone"
              dataKey="fees"
              stroke={colors.fees}
              strokeWidth={2}
              dot={{ fill: colors.fees, r: 4 }}
              activeDot={{ r: 6 }}
              name="Fees"
            />
          )}
          {data.some(d => d.refunds !== undefined) && (
            <Line
              type="monotone"
              dataKey="refunds"
              stroke={colors.refunds}
              strokeWidth={2}
              dot={{ fill: colors.refunds, r: 4 }}
              activeDot={{ r: 6 }}
              name="Refunds"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
