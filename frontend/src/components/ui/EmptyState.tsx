import React from 'react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => (
  <div className={clsx('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
    {icon && (
      <div className="mb-4 text-gray-300 dark:text-gray-600">
        {icon}
      </div>
    )}
    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
      {title}
    </h3>
    {description && (
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-4">
        {description}
      </p>
    )}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
