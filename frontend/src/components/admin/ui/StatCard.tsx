import React from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '@/contexts/LanguageContext';

export interface StatCardProps {
  title: string;
  value: string | number;
  growth?: number;
  icon?: React.ReactNode;
  subtitle?: string;
  loading?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  growth,
  icon,
  subtitle,
  loading = false,
  className = ''
}) => {
  const { t } = useLanguage();

  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with commas
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const formatGrowth = (g: number): string => {
    const sign = g >= 0 ? '+' : '';
    return `${sign}${g.toFixed(1)}%`;
  };

  const getGrowthColor = (g: number): string => {
    if (g > 0) return 'text-green-600 dark:text-green-400';
    if (g < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getGrowthBgColor = (g: number): string => {
    if (g > 0) return 'bg-green-50 dark:bg-green-900/20';
    if (g < 0) return 'bg-red-50 dark:bg-red-900/20';
    return 'bg-gray-50 dark:bg-gray-800/20';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {formatValue(value)}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <div className="text-primary-600 dark:text-primary-400">
              {icon}
            </div>
          </div>
        )}
      </div>

      {growth !== undefined && (
        <div className="mt-4 flex items-center">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${getGrowthBgColor(growth)}`}>
            {growth >= 0 ? (
              <ArrowUpIcon className={`w-4 h-4 ${getGrowthColor(growth)}`} />
            ) : (
              <ArrowDownIcon className={`w-4 h-4 ${getGrowthColor(growth)}`} />
            )}
            <span className={`text-sm font-semibold ${getGrowthColor(growth)}`}>
              {formatGrowth(growth)}
            </span>
          </div>
          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
            {t('admin.stat.vsPrevious')}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
