import React from 'react';
import type { Period } from '@/types/admin.types';

export interface PeriodSelectorProps {
  selected: Period;
  onChange: (period: Period) => void;
  className?: string;
}

interface PeriodOption {
  value: Period;
  label: string;
  description: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: '7d', label: '7 Days', description: 'Last 7 days' },
  { value: '30d', label: '30 Days', description: 'Last 30 days' },
  { value: '90d', label: '90 Days', description: 'Last 90 days' },
  { value: '1y', label: '1 Year', description: 'Last 365 days' }
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selected,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
        Period:
      </span>
      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${
                selected === option.value
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodSelector;
