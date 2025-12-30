import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Booking } from '../../types';
import { EyeIcon } from '@/components/icons';
import { Avatar } from '../ui/Avatar';
import { statusColors, getSpecialistName, getSpecialistAvatar, getTranslatedServiceName, getTranslatedDuration } from '../../utils/bookingUtils';

interface BookingTableProps {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
}

const BookingTable: React.FC<BookingTableProps> = ({ bookings, onViewDetails }) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger entrance animation when bookings load
  useEffect(() => {
    setIsAnimating(true);
  }, [bookings]);

  return (
    <div className="hidden lg:block overflow-x-auto custom-scrollbar">
      <table className="w-full min-w-[600px]">
        <thead className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-600/50">
          <tr>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.service')}
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.specialist')}
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.dateTime')}
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.amount')}
            </th>
            <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.status')}
            </th>
            <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
              {t('bookings.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm divide-y divide-gray-200/50 dark:divide-gray-700/50">
          {bookings.map((booking, index) => {
            const scheduledDate = new Date(booking.scheduledAt);
            const specialistName = getSpecialistName(booking);
            const specialistAvatar = getSpecialistAvatar(booking);

            return (
              <tr
                key={booking.id}
                className="group hover:bg-gray-50/80 dark:hover:bg-gray-700/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                style={{
                  animationDelay: `${index * 50}ms`,
                  animation: isAnimating ? 'slideInUp 0.4s ease-out forwards' : 'none'
                }}
              >
                <td className="px-6 py-4">
                  <div className="transition-transform duration-200 group-hover:translate-x-1">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {getTranslatedDuration(booking.duration || '60 min', t)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="transition-transform duration-200 group-hover:scale-110">
                      <Avatar
                        src={specialistAvatar}
                        alt={specialistName}
                        size="sm"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {specialistName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {scheduledDate.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatPrice(booking.totalAmount)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl border shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${statusColors[booking.status] || statusColors.PENDING}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => onViewDetails(booking)}
                    className="inline-flex items-center justify-center p-2 rounded-xl text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
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