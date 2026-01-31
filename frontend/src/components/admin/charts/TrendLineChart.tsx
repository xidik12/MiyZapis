import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

export interface TrendLineChartProps {
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  loading?: boolean;
  className?: string;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  dataKeys,
  height = 300,
  showLegend = true,
  showGrid = true,
  loading = false,
  className = ''
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const formatValue = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
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
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {dataKeys.map((dk, index) => (
              <linearGradient key={dk.key} id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dk.color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={dk.color} stopOpacity={0.1} />
              </linearGradient>
            ))}
          </defs>
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
            tickFormatter={formatValue}
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
            formatter={(value: number) => formatValue(value)}
            labelFormatter={formatDate}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
          )}
          {dataKeys.map((dk, index) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              stroke={dk.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${index})`}
              name={dk.name}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendLineChart;
