import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/solid';
import type { HealthStatus } from '@/types/admin.types';

export interface HealthIndicatorProps {
  status: HealthStatus;
  label: string;
  description?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  status,
  label,
  description,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const getStatusConfig = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: CheckCircleIcon,
          iconColor: 'text-green-600 dark:text-green-400',
          dot: 'bg-green-500',
          text: 'Healthy'
        };
      case 'degraded':
        return {
          color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: ExclamationTriangleIcon,
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          dot: 'bg-yellow-500',
          text: 'Degraded'
        };
      case 'down':
        return {
          color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: XCircleIcon,
          iconColor: 'text-red-600 dark:text-red-400',
          dot: 'bg-red-500',
          text: 'Down'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      dot: 'w-1.5 h-1.5'
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      dot: 'w-2 h-2'
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      dot: 'w-2.5 h-2.5'
    }
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div
        className={`
          inline-flex items-center space-x-2 rounded-full border
          ${config.color} ${config.borderColor} ${sizeClasses[size].badge}
          font-medium
        `}
      >
        {showIcon && (
          <Icon className={`${sizeClasses[size].icon} ${config.iconColor}`} />
        )}
        <span>{label}</span>
        <div className="flex items-center space-x-1">
          <span className="text-xs opacity-75">•</span>
          <span className={`${sizeClasses[size].dot} ${config.dot} rounded-full animate-pulse`} />
        </div>
      </div>

      {description && (
        <span className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-2">
          {description}
        </span>
      )}
    </div>
  );
};

export default HealthIndicator;
