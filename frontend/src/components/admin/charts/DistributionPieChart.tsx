import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';

export interface DistributionPieChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  loading?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#F97316'  // Orange
];

export const DistributionPieChart: React.FC<DistributionPieChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  showLabels = true,
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

  const calculatePercentage = (value: number, total: number): string => {
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = (entry: any) => {
    if (!showLabels) return null;
    const percentage = ((entry.value / total) * 100).toFixed(0);
    return `${percentage}%`;
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '12px'
            }}
            labelStyle={{ color: isDark ? '#F3F4F6' : '#111827', fontWeight: 600 }}
            itemStyle={{ color: isDark ? '#D1D5DB' : '#6B7280' }}
            formatter={(value: number, name: string) => [
              `${formatValue(value)} (${calculatePercentage(value, total)})`,
              name
            ]}
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const percentage = calculatePercentage(entry.payload.value, total);
                return `${value} (${percentage})`;
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistributionPieChart;
