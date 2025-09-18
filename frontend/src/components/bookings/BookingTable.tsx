import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Booking } from '../../types';
import { EyeIcon } from '@heroicons/react/24/outline';
import { Avatar } from '../ui/Avatar';
import { statusColors, getSpecialistName, getSpecialistAvatar, getTranslatedServiceName, getTranslatedDuration } from '../../utils/bookingUtils';

interface BookingTableProps {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
}

const BookingTable: React.FC<BookingTableProps> = ({ bookings, onViewDetails }) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.service')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.specialist')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.dateTime')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.amount')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.status')}
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {bookings.map((booking) => {
            const scheduledDate = new Date(booking.scheduledAt);
            const specialistName = getSpecialistName(booking);
            const specialistAvatar = getSpecialistAvatar(booking);

            return (
              <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getTranslatedDuration(booking.duration || '60 min', t)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={specialistAvatar}
                      alt={specialistName}
                      size="sm"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {specialistName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {scheduledDate.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPrice(booking.totalAmount)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[booking.status] || statusColors.PENDING}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewDetails(booking)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                    title={t('actions.viewDetails')}
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BookingTable;