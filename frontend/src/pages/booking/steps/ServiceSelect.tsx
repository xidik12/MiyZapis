import React from 'react';
import { ClockIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface ServiceSelectProps {
  service: Record<string, unknown>;
}

const ServiceSelect: React.FC<ServiceSelectProps> = ({ service }) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('booking.selectedService')}
        </h3>

        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {service.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {service.description}
              </p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>{service.duration} {t('time.minutes')}</span>
              </div>
            </div>
            <div className="text-right ml-4">
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(service.price || service.basePrice || 0, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSelect;
