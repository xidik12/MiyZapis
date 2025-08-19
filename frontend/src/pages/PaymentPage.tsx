import React from 'react';
import { useParams } from 'react-router-dom';

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment</h1>
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-600">Payment for booking ID: {bookingId} will be implemented here</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;