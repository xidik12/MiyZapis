import React from 'react';
import { clsx } from 'clsx';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-2',
  }[size];

  const colorClass = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    white: 'text-white',
    gray: 'text-gray-600 dark:text-gray-300',
  }[color];

  return (
    <div className={clsx('inline-flex items-center', className)} role="status" aria-label={t('common.loading')}>
      <div
        className={clsx(
          'rounded-full border-gray-200 dark:border-gray-700 border-t-current animate-spin',
          sizeClass,
          colorClass
        )}
      />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
};
