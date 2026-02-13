import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Period } from '@/types/admin.types';

export interface PeriodSelectorProps {
  selected: Period;
  onChange: (period: Period) => void;
  className?: string;
}

interface PeriodOption {
  value: Period;
  labelKey: string;
  descriptionKey: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: '7d', labelKey: 'admin.period.7days', descriptionKey: 'admin.period.7daysDesc' },
  { value: '30d', labelKey: 'admin.period.30days', descriptionKey: 'admin.period.30daysDesc' },
  { value: '90d', labelKey: 'admin.period.90days', descriptionKey: 'admin.period.90daysDesc' },
  { value: '1y', labelKey: 'admin.period.1year', descriptionKey: 'admin.period.1yearDesc' }
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selected,
  onChange,
  className = ''
}) => {
  const { t } = useLanguage();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
        {t('admin.period.label')}
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
            title={t(option.descriptionKey)}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PeriodSelector;
