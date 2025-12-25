import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Booking } from '../../types';
import { EyeIcon, CalendarIcon, ClockIcon } from '@/components/icons';
import { Avatar } from '../ui/Avatar';
import { statusColors, getSpecialistName, getSpecialistAvatar, getTranslatedServiceName, getTranslatedDuration } from '../../utils/bookingUtils';

interface BookingCardsProps {
  bookings: Booking[];
  onViewDetails: (booking: Booking) => void;
}

const BookingCards: React.FC<BookingCardsProps> = ({ bookings, onViewDetails }) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
      {bookings.map((booking) => {
        const scheduledDate = new Date(booking.scheduledAt);
        const specialistName = getSpecialistName(booking);
        const specialistAvatar = getSpecialistAvatar(booking);

        return (
          <div key={booking.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getTranslatedDuration(booking.duration || '60 min', t)}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[booking.status] || statusColors.PENDING}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                </span>
                <button
                  onClick={() => onViewDetails(booking)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                  title={t('actions.viewDetails')}
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-3">
              <Avatar
                src={specialistAvatar}
                alt={specialistName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {specialistName}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                <CalendarIcon className="w-4 h-4" />
                <span>{scheduledDate.toLocaleDateString()}</span>
                <ClockIcon className="w-4 h-4 ml-2" />
                <span>{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {formatPrice(booking.totalAmount)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookingCards;