import React from 'react';

export interface HeatmapData {
  hour: number;
  count: number;
}

export interface HeatmapTableProps {
  data: HeatmapData[];
  title?: string;
  loading?: boolean;
  className?: string;
}

export const HeatmapTable: React.FC<HeatmapTableProps> = ({
  data,
  title = 'Activity Heatmap',
  loading = false,
  className = ''
}) => {
  // Find max count for normalization
  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Get color intensity based on count
  const getColorIntensity = (count: number): string => {
    const intensity = count / maxCount;

    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.2) return 'bg-blue-100 dark:bg-blue-900/20';
    if (intensity < 0.4) return 'bg-blue-200 dark:bg-blue-900/40';
    if (intensity < 0.6) return 'bg-blue-300 dark:bg-blue-900/60';
    if (intensity < 0.8) return 'bg-blue-400 dark:bg-blue-900/80';
    return 'bg-blue-500 dark:bg-blue-900';
  };

  const getTextColor = (count: number): string => {
    const intensity = count / maxCount;

    if (intensity < 0.5) return 'text-gray-900 dark:text-gray-100';
    return 'text-white';
  };

  const formatHour = (hour: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}${period}`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-6 gap-2">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fill in missing hours with 0 count
  const fullData: HeatmapData[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const existingData = data.find(d => d.hour === hour);
    fullData.push({
      hour,
      count: existingData?.count || 0
    });
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {fullData.map((item) => (
          <div
            key={item.hour}
            className={`
              relative rounded-lg p-3 transition-all duration-200 cursor-pointer
              ${getColorIntensity(item.count)}
            `}
            title={`${formatHour(item.hour)}: ${item.count} bookings`}
          >
            <div className="text-center">
              <div className={`text-xs font-medium ${getTextColor(item.count)}`}>
                {formatHour(item.hour)}
              </div>
              <div className={`text-sm font-bold mt-1 ${getTextColor(item.count)}`}>
                {item.count}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-4">
        <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
        <div className="flex space-x-1">
          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded"></div>
          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded"></div>
          <div className="w-6 h-6 bg-blue-200 dark:bg-blue-900/40 rounded"></div>
          <div className="w-6 h-6 bg-blue-300 dark:bg-blue-900/60 rounded"></div>
          <div className="w-6 h-6 bg-blue-400 dark:bg-blue-900/80 rounded"></div>
          <div className="w-6 h-6 bg-blue-500 dark:bg-blue-900 rounded"></div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
      </div>

      {/* Peak hour indicator */}
      {data.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Peak hour:{' '}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {formatHour(data.reduce((max, item) => item.count > max.count ? item : max, data[0]).hour)}
            </span>
            {' '}with{' '}
            <span className="font-semibold">
              {Math.max(...data.map(d => d.count))} bookings
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default HeatmapTable;
