import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { Booking } from '../../types';
import {
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Avatar } from '../ui/Avatar';

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  inProgress: 'bg-purple-100 text-purple-800 border-purple-200',
  noShow: 'bg-gray-100 text-gray-800 border-gray-200'
};

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
  onBookAgain: (booking: Booking) => void;
  onLeaveReview: (bookingId: string) => void;
  getTranslatedServiceName: (serviceName: string) => string;
  getTranslatedDuration: (duration: string | number) => string;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onReschedule,
  onCancel,
  onBookAgain,
  onLeaveReview,
  getTranslatedServiceName,
  getTranslatedDuration
}) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const scheduledDate = new Date(booking.scheduledAt);
  const isUpcoming = ['PENDING', 'CONFIRMED'].includes(booking.status) && scheduledDate > new Date();
  const canCancel = isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
  const canReschedule = isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
  const canReview = booking.status === 'COMPLETED' && !booking.review;
  const canBookAgain = booking.status === 'COMPLETED';

  const specialistName = booking.specialist?.firstName && booking.specialist?.lastName
    ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
    : booking.specialistName || 'Unknown Specialist';

  const specialistAvatar = booking.specialist?.profileImage || booking.specialist?.user?.avatar;
  const specialistRating = booking.specialist?.rating || 5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
            {t('bookings.bookingDetails')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
          {/* Status Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${statusColors[booking.status] || statusColors.PENDING} text-center sm:text-left`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              #{booking.id.substring(0, 8)}...
            </span>
          </div>

          {/* Service Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">
              {t('bookings.serviceDetails')}
            </h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-start space-x-2">
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  <strong>{getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service')}</strong>
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                <span className="break-words">
                  {getTranslatedDuration(booking.duration || '60 min')}
                </span>
              </div>
            </div>
          </div>

          {/* Specialist Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">
              {t('bookings.specialistDetails')}
            </h3>
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Avatar
                src={specialistAvatar}
                alt={specialistName}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">{specialistName}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon
                      key={index}
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${
                        index < Math.floor(specialistRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 ml-1">
                    {specialistRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Location Information (for confirmed/paid bookings) */}
          {booking.status === 'CONFIRMED' && booking.service?.serviceLocation && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {t('bookings.serviceLocation') || 'Service Location'}
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                {/* Service Location */}
                <div className="flex items-start space-x-2">
                  <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {t('bookings.address')}:
                    </span>
                    <p className="text-blue-800 dark:text-blue-200 break-words">
                      {booking.service.serviceLocation}
                    </p>
                  </div>
                </div>

                {/* Location Notes */}
                {booking.service.locationNotes && (
                  <div className="flex items-start space-x-2">
                    <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {t('bookings.instructions') || 'Instructions'}:
                      </span>
                      <p className="text-blue-800 dark:text-blue-200 break-words">
                        {booking.service.locationNotes}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                    ℹ️ {t('bookings.locationInfoNote') || 'This location information is available after payment confirmation'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Information (for confirmed bookings) */}
          {booking.status === 'CONFIRMED' && booking.specialist?.location && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2 sm:mb-3 text-sm sm:text-base flex items-center">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {t('bookings.contactInformation')}
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                {/* Contact information sections */}
                {booking.specialist.location.preciseAddress && (
                  <div className="flex items-start space-x-2">
                    <MapPinIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {t('bookings.address')}:
                      </span>
                      <p className="text-blue-800 dark:text-blue-200 break-words">
                        {booking.specialist.location.preciseAddress}
                      </p>
                    </div>
                  </div>
                )}

                {booking.specialist.location.businessPhone && (
                  <div className="flex items-start space-x-2">
                    <PhoneIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {t('bookings.phone')}:
                      </span>
                      <a
                        href={`tel:${booking.specialist.location.businessPhone}`}
                        className="text-blue-800 dark:text-blue-200 hover:underline ml-1"
                      >
                        {booking.specialist.location.businessPhone}
                      </a>
                    </div>
                  </div>
                )}

                {booking.specialist.location.whatsappNumber && (
                  <div className="flex items-start space-x-2">
                    <ChatBubbleLeftRightIcon className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {t('bookings.whatsapp')}:
                      </span>
                      <a
                        href={`https://wa.me/${booking.specialist.location.whatsappNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 dark:text-green-300 hover:underline ml-1"
                      >
                        {booking.specialist.location.whatsappNumber}
                      </a>
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-2 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                    ℹ️ {t('bookings.contactInfoNote')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">
              {t('bookings.paymentDetails')}
            </h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>{t('bookings.totalAmount')}:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(booking.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('bookings.paymentStatus')}:</span>
                <span className={`font-medium ${
                  booking.paymentStatus === 'PAID'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {booking.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(booking.customerNotes || booking.specialistNotes) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 text-sm sm:text-base">
                {t('bookings.notes')}
              </h3>
              {booking.customerNotes && (
                <div className="mb-2 sm:mb-3">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                    {t('bookings.yourNotes')}:
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 break-words">
                    {booking.customerNotes}
                  </p>
                </div>
              )}
              {booking.specialistNotes && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                    {t('bookings.specialistNotes')}:
                  </p>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 break-words">
                    {booking.specialistNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
          <div className="flex flex-wrap gap-2">
            {canCancel && (
              <button
                onClick={() => {
                  onCancel(booking.id);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800 min-w-0"
              >
                <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                <span className="truncate">{t('actions.cancel')}</span>
              </button>
            )}

            {canReschedule && (
              <button
                onClick={() => {
                  onReschedule(booking.id);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800 min-w-0"
              >
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                <span className="truncate">{t('actions.reschedule')}</span>
              </button>
            )}

            {canReview && (
              <button
                onClick={() => {
                  onLeaveReview(booking.id);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-200 dark:border-green-800 min-w-0"
              >
                <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                <span className="truncate">{t('actions.review')}</span>
              </button>
            )}

            {canBookAgain && (
              <button
                onClick={() => {
                  onBookAgain(booking);
                  onClose();
                }}
                className="flex-1 sm:flex-none px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border border-purple-200 dark:border-purple-800 min-w-0"
              >
                <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                <span className="truncate">{t('actions.bookAgain')}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;