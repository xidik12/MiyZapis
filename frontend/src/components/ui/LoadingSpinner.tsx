import React from 'react';
import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClass = {
    sm: 'loader-sm',
    md: 'loader-md',
    lg: 'loader-lg',
    xl: 'loader-xl',
  }[size];

  const colorClass = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-300',
  }[color];

  return (
    <div className={clsx('inline-flex items-center', className)} role="status" aria-label="Loading">
      <div className={clsx('loader', sizeClass, colorClass)} />
      <span className="sr-only">Loading...</span>
    </div>
  );
};
