import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircleIcon, CreditCardIcon, GiftIcon, StarIcon, ArrowPathIcon, CalendarIcon, ClockIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { downloadICS, getGoogleCalendarUrl } from '@/utils/calendar';
import { environment } from '@/config/environment';
import { ShareButton } from '@/components/common/ShareButton';
import { serviceService } from '@/services';
import type { UserLoyalty } from '@/services/loyalty.service';

interface ConfirmationProps {
  service: Record<string, unknown>;
  specialist: Record<string, unknown>;
  selectedDate: Date | null;
  selectedTime: string;
  bookingResult: Record<string, unknown>;
  paymentResult: Record<string, unknown>;
  showQRCode: boolean;
  onToggleQRCode: () => void;
  isRecurring: boolean;
  loyaltyData: UserLoyalty | null;
  pointsToEarn: number;
  finalPrice: number;
}

const Confirmation: React.FC<ConfirmationProps> = ({
  service,
  specialist,
  selectedDate,
  selectedTime,
  bookingResult,
  paymentResult,
  showQRCode,
  onToggleQRCode,
  isRecurring,
  loyaltyData,
  pointsToEarn,
  finalPrice,
}) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [similarServices, setSimilarServices] = useState<any[]>([]);

  useEffect(() => {
    const serviceId = (service as any).id;
    if (!serviceId) return;
    serviceService.getSimilarServices(serviceId, 3)
      .then(services => setSimilarServices(services))
      .catch(() => setSimilarServices([]));
  }, [service]);

  const booking = bookingResult?.booking || bookingResult;
  const isAutoBooked = booking?.status === 'CONFIRMED';
  const isPending = booking?.status === 'PENDING';
  const isPendingPayment = booking?.status === 'PENDING_PAYMENT';
  const needsPayment = paymentResult?.requiresPayment;
  const hasPaymentUrl = paymentResult?.paymentUrl;
  const hasOnrampSession = paymentResult?.onrampSession;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 text-center">
        <CheckCircleIcon className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${isAutoBooked ? 'text-green-600' : isPendingPayment ? 'text-blue-600' : 'text-yellow-600'}`} />

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isAutoBooked ? t('booking.bookingConfirmed') : isPendingPayment ? 'Payment Processing' : t('booking.bookingRequested')}
        </h3>

        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
          {isAutoBooked
            ? t('booking.autoBookingConfirmed')
            : isPendingPayment
            ? 'Your payment is being processed. You will receive an email confirmation once the payment is verified and your booking is confirmed.'
            : t('booking.manualBookingMessage')
          }
        </p>

        {/* Recurring Booking Summary */}
        {isRecurring && bookingResult?.childrenCount !== undefined && (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ArrowPathIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h4 className="font-semibold text-primary-900 dark:text-primary-100">
                {t('booking.recurringCreated') || 'Recurring Booking Created'}
              </h4>
            </div>
            <p className="text-sm text-primary-800 dark:text-primary-200">
              {bookingResult.message || `${bookingResult.childrenCount} additional bookings have been scheduled.`}
            </p>
          </div>
        )}

        {/* Payment Required Section — only when payments are enabled */}
        {environment.PAYMENTS_ENABLED && needsPayment && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              Payment Required
            </h4>

            {paymentResult?.message && (
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                {paymentResult.message}
              </p>
            )}

            {hasPaymentUrl && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Amount: ${paymentResult.finalAmount ? (paymentResult.finalAmount / 100).toFixed(2) : 'N/A'}
                </p>
                <a
                  href={paymentResult.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <CreditCardIcon className="w-4 h-4 mr-2" />
                  Complete Payment
                </a>
              </div>
            )}

            {hasOnrampSession && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Fiat-to-Crypto Session Created
                </p>
                <a
                  href={paymentResult.onrampSession.onrampURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Complete Fiat Payment
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Session expires: {new Date(paymentResult.onrampSession.expiresAt).toLocaleString()}
                </p>
              </div>
            )}

            {paymentResult?.qrCodeData && (
              <div className="mt-4">
                <button
                  onClick={onToggleQRCode}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showQRCode ? 'Hide' : 'Show'} QR Code
                </button>
                {showQRCode && (
                  <div className="mt-2 flex justify-center">
                    <img
                      src={paymentResult.qrCodeData}
                      alt="Payment QR Code"
                      className="max-w-48 h-auto border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Payment Complete Section — only when payments are enabled */}
        {environment.PAYMENTS_ENABLED && !needsPayment && paymentResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Payment Complete
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              {paymentResult.message || 'Payment processed successfully'}
            </p>
          </div>
        )}

        {/* Loyalty Points Earned Notification — only when payments are enabled */}
        {environment.PAYMENTS_ENABLED && loyaltyData && pointsToEarn > 0 && isAutoBooked && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="h-10 w-10 bg-purple-500 rounded-full flex items-center justify-center">
                <GiftIcon className="h-5 w-5 text-white" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-purple-600 dark:text-purple-400">
                  You earned {pointsToEarn} loyalty points!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  New balance: {((loyaltyData?.currentPoints || 0) + pointsToEarn).toLocaleString()} points
                </p>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/customer/loyalty')}
                className="inline-flex items-center px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-colors"
              >
                <StarIcon className="h-4 w-4 mr-1" />
                View Loyalty Dashboard
              </button>
            </div>
          </div>
        )}

        {isPending && !isPendingPayment && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {t('booking.waitingForSpecialistConfirmation')}
            </p>
          </div>
        )}

        {environment.PAYMENTS_ENABLED && isPendingPayment && paymentResult?.message && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {paymentResult.message}
            </p>
          </div>
        )}

        {/* Add to Calendar */}
        {selectedDate && selectedTime && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              {t('booking.addToCalendar') || 'Add to Calendar'}
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => {
                  const [hours, minutes] = selectedTime.split(':').map(Number);
                  const startDate = new Date(selectedDate);
                  startDate.setHours(hours, minutes, 0, 0);
                  const endDate = new Date(startDate.getTime() + ((service.duration as number) || 60) * 60000);
                  downloadICS({
                    title: `${service.name} - ${specialist.user?.firstName} ${specialist.user?.lastName}`,
                    description: `Booking with ${specialist.user?.firstName} ${specialist.user?.lastName}`,
                    location: (specialist.preciseAddress as string) || (specialist.address as string) || '',
                    startDate,
                    endDate,
                  });
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('booking.downloadICS') || 'Download .ics'}
              </button>
              <a
                href={(() => {
                  const [hours, minutes] = selectedTime.split(':').map(Number);
                  const startDate = new Date(selectedDate);
                  startDate.setHours(hours, minutes, 0, 0);
                  const endDate = new Date(startDate.getTime() + ((service.duration as number) || 60) * 60000);
                  return getGoogleCalendarUrl({
                    title: `${service.name} - ${specialist.user?.firstName} ${specialist.user?.lastName}`,
                    description: `Booking with ${specialist.user?.firstName} ${specialist.user?.lastName}`,
                    location: (specialist.preciseAddress as string) || (specialist.address as string) || '',
                    startDate,
                    endDate,
                  });
                })()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('booking.addToGoogleCalendar') || 'Google Calendar'}
              </a>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/customer/bookings')}
          className="bg-primary-600 text-white py-2 px-6 rounded-xl hover:bg-primary-700 transition-colors"
        >
          {t('booking.viewBookings')}
        </button>

        {/* Tell a Friend */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('booking.tellFriend') || 'Share with a Friend'}</span>
          <ShareButton
            url={`${window.location.origin}/s/${(specialist as any).slug || (specialist as any).id}`}
            title={`${specialist.user?.firstName} ${specialist.user?.lastName} — MiyZapys`}
            text={`${t('share.tellFriend')}: ${specialist.user?.firstName} ${specialist.user?.lastName}`}
            variant="icon"
          />
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('booking.bookingDetails')}
        </h4>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.bookingId')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {booking?.id || t('common.notAvailable') || 'N/A'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.status')}</span>
            <span className={`font-medium ${isAutoBooked ? 'text-green-600' : 'text-yellow-600'}`}>
              {isAutoBooked ? t('booking.confirmed') : t('booking.pending')}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.specialist')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {specialist.user?.firstName} {specialist.user?.lastName}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.service')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {service.name}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('booking.dateTime')}</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedDate?.toLocaleDateString(language || 'en')} {selectedTime}
            </span>
          </div>

          {/* Specialist Contact Information */}
          {isAutoBooked && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

              <div className="mb-2">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {t('booking.specialistContact') || 'Specialist Contact Information'}
                </h5>
              </div>

              {specialist.businessPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('booking.phone') || 'Phone'}</span>
                  <a
                    href={`tel:${specialist.businessPhone}`}
                    className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {specialist.businessPhone}
                  </a>
                </div>
              )}

              {specialist.preciseAddress && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('booking.location') || 'Location'}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                    {specialist.preciseAddress}
                  </span>
                </div>
              )}

              {specialist.whatsappNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('location.contactDetails') || 'WhatsApp'}</span>
                  <a
                    href={`https://wa.me/${specialist.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-green-600 dark:text-green-400 hover:underline"
                  >
                    {specialist.whatsappNumber}
                  </a>
                </div>
              )}

              {specialist.locationNotes && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('location.locationNotes') || 'Location notes'}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                    {specialist.locationNotes}
                  </span>
                </div>
              )}

              {specialist.parkingInfo && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('location.parkingInfo') || 'Parking information'}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                    {specialist.parkingInfo}
                  </span>
                </div>
              )}

              {specialist.accessInstructions && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('location.accessInstructions') || 'Access instructions'}</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-xs">
                    {specialist.accessInstructions}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('booking.servicePrice') || 'Service Price'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(finalPrice, service.currency as 'USD' | 'EUR' | 'UAH' || 'USD')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* You Might Also Like */}
      {similarServices.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('booking.youMightAlsoLike') || 'You Might Also Like'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {similarServices.map((svc: any) => (
              <Link
                key={svc.id}
                to={`/booking/${svc.id}`}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all"
              >
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{svc.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {svc.specialist?.user?.firstName} {svc.specialist?.user?.lastName}
                </p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {svc.duration} min
                  </span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {formatPrice(svc.basePrice || svc.price || 0, svc.currency || 'USD')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Confirmation;
