import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

export interface ComparisonBarChartProps {
  data: Array<{
    name: string;
    [key: string]: unknown;
  }>;
  bars: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  horizontal?: boolean;
  loading?: boolean;
  className?: string;
}

export const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({
  data,
  bars,
  height = 300,
  showLegend = true,
  showGrid = true,
  horizontal = false,
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

  const truncateLabel = (label: string, maxLength: number = 20): string => {
    if (label.length <= maxLength) return label;
    return `${label.substring(0, maxLength)}...`;
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

  const ChartComponent = BarChart;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#374151' : '#E5E7EB'}
            />
          )}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tickFormatter={formatValue}
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickFormatter={(value) => truncateLabel(value, 15)}
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                style={{ fontSize: '12px' }}
                width={120}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tickFormatter={(value) => truncateLabel(value, 15)}
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={formatValue}
                stroke={isDark ? '#9CA3AF' : '#6B7280'}
                style={{ fontSize: '12px' }}
              />
            </>
          )}
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
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
            />
          )}
          {bars.map((bar) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              fill={bar.color}
              name={bar.name}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonBarChart;
