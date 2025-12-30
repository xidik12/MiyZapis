import React, { useState, useEffect } from 'react';
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
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger entrance animation when bookings load
  useEffect(() => {
    setIsAnimating(true);
  }, [bookings]);

  return (
    <div className="lg:hidden space-y-3">
      {bookings.map((booking, index) => {
        const scheduledDate = new Date(booking.scheduledAt);
        const specialistName = getSpecialistName(booking);
        const specialistAvatar = getSpecialistAvatar(booking);

        return (
          <div
            key={booking.id}
            className="group bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1"
            style={{
              animationDelay: `${index * 50}ms`,
              animation: isAnimating ? 'scaleIn 0.4s ease-out forwards' : 'none'
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate transition-colors duration-200 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  {getTranslatedDuration(booking.duration || '60 min', t)}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl border shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md ${statusColors[booking.status] || statusColors.PENDING}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                </span>
                <button
                  onClick={() => onViewDetails(booking)}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50/80 dark:hover:bg-primary-900/30 transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                  title={t('actions.viewDetails')}
                >
                  <EyeIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-3">
              <div className="transition-transform duration-200 group-hover:scale-110">
                <Avatar
                  src={specialistAvatar}
                  alt={specialistName}
                  size="sm"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {specialistName}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-100/50 dark:border-gray-700/50">
              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 font-medium">
                <CalendarIcon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                <span>{scheduledDate.toLocaleDateString()}</span>
                <ClockIcon className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:scale-110" />
                <span>{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
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