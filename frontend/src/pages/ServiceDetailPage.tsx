import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">{t('serviceDetail.title')}</h1>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('serviceDetail.notFound')}: {serviceId}</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;