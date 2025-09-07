import React from 'react';
import { useParams } from 'react-router-dom';

const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Service Details</h1>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
          <p className="text-gray-600 dark:text-gray-400">Service details for ID: {serviceId} will be implemented here</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;