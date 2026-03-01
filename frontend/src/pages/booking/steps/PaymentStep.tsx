import React from 'react';
import { CreditCardIcon, GiftIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useCurrency } from '../../../contexts/CurrencyContext';
import type { UserLoyalty } from '@/services/loyalty.service';
import type { RewardRedemption } from '@/services/rewards.service';

interface PaymentStepProps {
  service: Record<string, unknown>;
  specialist: Record<string, unknown>;
  selectedDate: Date | null;
  selectedTime: string;

  // Payment
  paymentMethod: 'crypto' | 'paypal';
  onPaymentMethodChange: (method: 'crypto' | 'paypal') => void;
  useWalletFirst: boolean;
  onUseWalletFirstChange: (value: boolean) => void;
  paymentLoading: boolean;
  paymentResult: Record<string, unknown>;
  paymentOptions: Record<string, unknown>;
  showQRCode: boolean;
  onToggleQRCode: () => void;
  paymentTimeRemaining: number;
  onBookingSubmit: () => void;

  // Step navigation
  stepsLength: number;
  onSetCurrentStep: (step: number) => void;
  onSetBookingResult: (result: Record<string, unknown>) => void;
  onSetPaymentResult: (result: Record<string, unknown>) => void;

  // Rewards
  redemptions: RewardRedemption[];
  selectedRedemptionId: string;
  onSelectedRedemptionIdChange: (value: string) => void;
  discount: number;
  finalPrice: number;

  // Loyalty
  loyaltyData: UserLoyalty | null;
  pointsToEarn: number;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  service,
  specialist,
  selectedDate,
  selectedTime,
  paymentMethod,
  onPaymentMethodChange,
  useWalletFirst,
  onUseWalletFirstChange,
  paymentLoading,
  paymentResult,
  paymentOptions,
  showQRCode,
  onToggleQRCode,
  paymentTimeRemaining,
  onBookingSubmit,
  stepsLength,
  onSetCurrentStep,
  onSetBookingResult,
  onSetPaymentResult,
  redemptions,
  selectedRedemptionId,
  onSelectedRedemptionIdChange,
  discount,
  finalPrice,
  loyaltyData,
  pointsToEarn,
}) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
          {t('booking.payment')}
        </h3>

        {/* Order Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatPrice(discount > 0 ? finalPrice : (service.price || service.basePrice || 0), (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
            </span>
          </div>

          {/* Show discount breakdown in order summary */}
          {discount > 0 && (
            <div className="text-sm space-y-1 mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Original Price:</span>
                <span>{formatPrice(service.price || service.basePrice || 0, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Reward Discount:</span>
                <span>-{formatPrice(discount, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}</span>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{service.duration} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{selectedDate?.toLocaleDateString()} at {selectedTime}</span>
            </div>
            <div className="flex justify-between">
              <span>Specialist:</span>
              <span>{specialist.user?.firstName} {specialist.user?.lastName}</span>
            </div>
          </div>
        </div>

        {/* Loyalty Benefits */}
        {loyaltyData && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-8 w-8 bg-purple-500 rounded-xl flex items-center justify-center">
                <GiftIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Loyalty Rewards</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {loyaltyData.tier || 'Bronze'} Member Benefits
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  +{pointsToEarn}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Points to earn</p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {loyaltyData?.currentPoints?.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Current points</p>
              </div>
            </div>

            <p className="text-xs text-purple-600 dark:text-purple-400 text-center mt-3">
              After this booking: {((loyaltyData?.currentPoints || 0) + pointsToEarn).toLocaleString()} points
            </p>
          </div>
        )}

        {/* Reward Redemption Selection */}
        {redemptions.length > 0 && (
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <GiftIcon className="w-5 h-5 mr-2 text-purple-600" />
              {t('booking.applyReward') || 'Apply a reward'}
            </h4>
            <select
              value={selectedRedemptionId}
              onChange={(e) => onSelectedRedemptionIdChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl ${
                selectedRedemptionId
                  ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                  : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'
              } text-gray-900 dark:text-white`}
            >
              <option value="">{t('booking.noRewardSelected') || 'No reward selected'}</option>
              {redemptions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.reward.title} • {r.reward.type === 'PERCENTAGE_OFF' && r.reward.discountPercent ? `${r.reward.discountPercent}%` : r.reward.type === 'DISCOUNT_VOUCHER' && r.reward.discountAmount ? `-$${r.reward.discountAmount}` : r.reward.type === 'FREE_SERVICE' ? t('booking.freeService') || 'Free service' : t('booking.reward') || 'Reward'}
                  {r.expiresAt ? ` • ${t('booking.expires') || 'Expires'} ${new Date(r.expiresAt).toLocaleDateString()}` : ''}
                </option>
              ))}
            </select>

            {/* Show confirmation when reward is selected */}
            {selectedRedemptionId && discount > 0 && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('booking.rewardApplied') || 'Reward Applied!'}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t('booking.youSave') || 'You save'} {formatPrice(discount, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CreditCardIcon className="w-5 h-5 mr-2 text-blue-600" />
            Payment Method
          </h4>

          <div className="space-y-3">
            {/* Crypto Payment Option */}
            <label className="flex items-start space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="crypto"
                checked={paymentMethod === 'crypto'}
                onChange={(e) => onPaymentMethodChange(e.target.value as 'crypto' | 'paypal')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                    <CreditCardIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Cryptocurrency Payment</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Secure payment via Coinbase Commerce</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supports Bitcoin, Ethereum, and other cryptocurrencies</div>
                  </div>
                </div>
              </div>
            </label>

            {/* PayPal Payment Option */}
            <label className="flex items-start space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="paypal"
                checked={paymentMethod === 'paypal'}
                onChange={(e) => onPaymentMethodChange(e.target.value as 'crypto' | 'paypal')}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h8.418c2.508 0 4.514.893 5.835 2.598 1.206 1.557 1.747 3.675 1.567 6.129-.346 4.73-3.558 8.889-8.781 11.378h4.985c.534 0 1.021-.304 1.258-.786l6.097-12.417c.235-.479-.013-1.059-.533-1.249L14.27 1.986c-.52-.19-1.099.055-1.249.533L7.076 21.337z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">PayPal</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pay with PayPal, credit cards, or bank account</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fast and secure traditional payment</div>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Wallet First Option */}
        <div className="mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={useWalletFirst}
              onChange={(e) => onUseWalletFirstChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Use my wallet balance first (if available)
            </span>
          </label>
        </div>

        {/* Payment Information */}
        {paymentOptions && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
            <div className="text-sm">
              <div className="font-medium text-blue-900 dark:text-blue-100 mb-2">Payment Information</div>
              <div className="space-y-1 text-blue-800 dark:text-blue-200">
                <div>Deposit Amount: ${paymentOptions.depositConfiguration.amountUSD}</div>
                <div>Currency: USD</div>
              </div>
            </div>
          </div>
        )}

        {/* Show payment interface if payment result exists */}
        {paymentResult ? (
          <div className="space-y-4">
            {/* Payment Section for all external payments */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Complete Your {
                  paymentMethod === 'paypal' ? 'PayPal' :
                  'Cryptocurrency'
                } Payment
              </h4>
              {paymentResult.message && (
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                  {paymentResult.message}
                </p>
              )}

              {/* PayPal Payment Interface */}
              {paymentMethod === 'paypal' && paymentResult.paymentUrl && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Amount: {formatPrice(paymentResult.finalAmount / 100 || 1, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
                  </p>
                  <a
                    href={paymentResult.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      onSetCurrentStep(4);
                      onSetBookingResult({
                        status: 'PENDING_PAYMENT',
                        paymentMethod: 'paypal',
                        service,
                        specialist,
                        scheduledAt: `${selectedDate?.toISOString().split('T')[0]}T${selectedTime}`,
                        message: 'Payment link opened. Complete payment to confirm your booking.'
                      });
                      onSetPaymentResult({
                        status: 'pending',
                        message: 'Payment processing. You will receive an email confirmation once payment is verified.'
                      });
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h8.418c2.508 0 4.514.893 5.835 2.598 1.206 1.557 1.747 3.675 1.567 6.129-.346 4.73-3.558 8.889-8.781 11.378h4.985c.534 0 1.021-.304 1.258-.786l6.097-12.417c.235-.479-.013-1.059-.533-1.249L14.27 1.986c-.52-.19-1.099.055-1.249.533L7.076 21.337z"/>
                    </svg>
                    Pay with PayPal
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    You'll receive an email confirmation once payment is verified.
                  </p>
                </div>
              )}

                {/* Crypto Payment Interface (existing logic) */}
                {paymentMethod === 'crypto' && (
                  <>
                    {/* Payment URL for direct crypto payments */}
                    {paymentResult.paymentUrl && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Amount: {formatPrice(paymentResult.finalAmount / 100 || 1, (service.currency as 'USD' | 'EUR' | 'UAH') || 'USD')}
                        </p>
                        <a
                          href={paymentResult.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            onSetCurrentStep(4);
                            onSetBookingResult({
                              status: 'PENDING_PAYMENT',
                              paymentMethod: 'crypto',
                              service,
                              specialist,
                              scheduledAt: `${selectedDate?.toISOString().split('T')[0]}T${selectedTime}`,
                              message: 'Payment link opened. Complete payment to confirm your booking.'
                            });
                            onSetPaymentResult({
                              status: 'pending',
                              message: 'Payment processing. You will receive an email confirmation once payment is verified.'
                            });
                          }}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          <CreditCardIcon className="w-4 h-4 mr-2" />
                          Pay with Crypto
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          You'll receive an email confirmation once payment is verified.
                        </p>
                      </div>
                    )}

                    {/* Coinbase Onramp Session */}
                    {paymentResult.onrampSession && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Don't have crypto? Buy and pay in one step:
                        </p>
                        <a
                          href={paymentResult.onrampSession.onrampURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                        >
                          <CreditCardIcon className="w-4 h-4 mr-2" />
                          Buy Crypto & Pay
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Session expires: {new Date(paymentResult.onrampSession.expiresAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* QR Code Display */}
                    {paymentResult.qrCodeData && (
                      <div className="mt-4">
                        <button
                          onClick={onToggleQRCode}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          {showQRCode ? 'Hide' : 'Show'} QR Code
                        </button>
                        {showQRCode && (
                          <div className="mt-3 text-center">
                            <img
                              src={paymentResult.qrCodeData}
                              alt="Payment QR Code"
                              className="max-w-48 h-auto border border-gray-200 rounded mx-auto"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                      {paymentTimeRemaining > 0 && (
                        <p className="font-medium text-orange-600 dark:text-orange-400">
                          Time remaining: {Math.floor(paymentTimeRemaining / 60000)}:{String(Math.floor((paymentTimeRemaining % 60000) / 1000)).padStart(2, '0')}
                        </p>
                      )}
                      <p>You'll receive confirmation once payment is verified.</p>
                      <p className="text-xs text-gray-400 mt-1">Your booking slot is temporarily reserved during payment.</p>
                    </div>
                  </>
                )}
            </div>

            {/* Payment Complete Section */}
            {!paymentResult.requiresPayment && paymentResult.status === 'COMPLETED' && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Payment Complete
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {paymentResult.message || 'Payment processed successfully with wallet balance'}
                </p>
                <button
                  onClick={() => onSetCurrentStep(stepsLength - 1)}
                  className="mt-3 bg-green-600 text-white py-2 px-4 rounded-xl hover:bg-green-700 transition-colors"
                >
                  View Booking Details
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onBookingSubmit}
            disabled={paymentLoading}
            className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {paymentLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                {paymentMethod === 'paypal' ? (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h8.418c2.508 0 4.514.893 5.835 2.598 1.206 1.557 1.747 3.675 1.567 6.129-.346 4.73-3.558 8.889-8.781 11.378h4.985c.534 0 1.021-.304 1.258-.786l6.097-12.417c.235-.479-.013-1.059-.533-1.249L14.27 1.986c-.52-.19-1.099.055-1.249.533L7.076 21.337z"/>
                  </svg>
                ) : (
                  <CreditCardIcon className="w-5 h-5 mr-2" />
                )}
                {paymentMethod === 'paypal' ? 'Pay with PayPal' : t('booking.confirmBooking')}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentStep;
