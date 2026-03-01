import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, CreditCardIcon, GiftIcon, StarIcon, ArrowPathIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
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

  const booking = bookingResult?.booking || bookingResult;
  const isAutoBooked = booking?.status === 'CONFIRMED';
  const isPending = booking?.status === 'PENDING';
  const isPendingPayment = booking?.status === 'PENDING_PAYMENT';
  const needsPayment = paymentResult?.requiresPayment;
  const hasPaymentUrl = paymentResult?.paymentUrl;
  const hasOnrampSession = paymentResult?.onrampSession;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
        <CheckCircleIcon className={`w-16 h-16 mx-auto mb-4 ${isAutoBooked ? 'text-green-600' : isPendingPayment ? 'text-blue-600' : 'text-yellow-600'}`} />

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isAutoBooked ? t('booking.bookingConfirmed') : isPendingPayment ? 'Payment Processing' : t('booking.bookingRequested')}
        </h3>

        <p className="text-gray-600 dark:text-gray-400 mb-6">
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

        {/* Payment Required Section */}
        {needsPayment && (
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

        {/* Payment Complete Section */}
        {!needsPayment && paymentResult && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Payment Complete
            </h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              {paymentResult.message || 'Payment processed successfully'}
            </p>
          </div>
        )}

        {/* Loyalty Points Earned Notification */}
        {loyaltyData && pointsToEarn > 0 && isAutoBooked && (
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

        {isPendingPayment && paymentResult?.message && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {paymentResult.message}
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/customer/bookings')}
          className="bg-primary-600 text-white py-2 px-6 rounded-xl hover:bg-primary-700 transition-colors"
        >
          {t('booking.viewBookings')}
        </button>
      </div>

      {/* Booking Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
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

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('booking.paymentAmount') || 'Payment Amount'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(finalPrice, service.currency as 'USD' | 'EUR' | 'UAH' || 'USD')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
