import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader,
  Lock
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { telegramPaymentService, PaymentResult } from '@/services/telegramPayment.service';

interface PaymentComponentProps {
  bookingData: {
    serviceId: string;
    specialistId: string;
    customerId: string;
    serviceName: string;
    specialistName: string;
    date: string;
    time: string;
    duration: number;
    amount: number;
    currency: string;
  };
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
  onPaymentCancel: () => void;
}

export const PaymentComponent: React.FC<PaymentComponentProps> = ({
  bookingData,
  onPaymentSuccess,
  onPaymentError,
  onPaymentCancel
}) => {
  const { hapticFeedback, showAlert, showConfirm } = useTelegram();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'telegram' | 'card'>('telegram');
  const [isPaymentAvailable, setIsPaymentAvailable] = useState(false);

  useEffect(() => {
    // Check if Telegram Payments is available
    setIsPaymentAvailable(telegramPaymentService.isPaymentAvailable());
  }, []);

  const handleTelegramPayment = async () => {
    if (!isPaymentAvailable) {
      await showAlert('Telegram Payments is not available on your device.');
      return;
    }

    const confirmed = await showConfirm(
      `Pay ${telegramPaymentService.formatAmount(bookingData.amount, bookingData.currency)} for your booking?`
    );

    if (!confirmed) {
      onPaymentCancel();
      return;
    }

    setIsProcessing(true);
    hapticFeedback.impactLight();

    try {
      const result = await telegramPaymentService.createBookingPayment(bookingData);

      if (result.success) {
        hapticFeedback.notificationSuccess();
        onPaymentSuccess(result);
      } else {
        hapticFeedback.notificationError();
        onPaymentError(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      hapticFeedback.notificationError();
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    await showAlert('Card payment via Stripe coming soon!');
    // TODO: Implement Stripe payment integration
  };

  const formatDateTime = () => {
    const date = new Date(`${bookingData.date}T${bookingData.time}`);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isProcessing) {
    return (
      <div className="text-center py-8">
        <LoadingSpinner size="lg" className="mb-4 mx-auto" />
        <h3 className="text-lg font-semibold text-primary mb-2">
          Processing Payment
        </h3>
        <p className="text-secondary">
          Please complete the payment in Telegram...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Booking Summary */}
      <Card>
        <h3 className="font-semibold text-primary mb-3">Booking Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary">Service:</span>
            <span className="font-medium text-primary">{bookingData.serviceName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Specialist:</span>
            <span className="font-medium text-primary">{bookingData.specialistName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Date & Time:</span>
            <span className="font-medium text-primary">{formatDateTime()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary">Duration:</span>
            <span className="font-medium text-primary">{bookingData.duration} minutes</span>
          </div>
          <div className="border-t pt-2 mt-3">
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-primary">Total:</span>
              <span className="font-bold text-accent">
                {telegramPaymentService.formatAmount(bookingData.amount, bookingData.currency)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Methods */}
      <div>
        <h4 className="font-semibold text-primary mb-3">Payment Method</h4>
        <div className="space-y-3">
          {/* Telegram Payment */}
          <Card
            hover={isPaymentAvailable}
            onClick={() => isPaymentAvailable && setPaymentMethod('telegram')}
            className={`
              ${paymentMethod === 'telegram' ? 'border-accent bg-blue-50' : ''}
              ${!isPaymentAvailable ? 'opacity-50' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <div>
                  <h5 className="font-medium text-primary">Telegram Payments</h5>
                  <p className="text-sm text-secondary">
                    {isPaymentAvailable ? 'Secure payment via Telegram' : 'Not available on this device'}
                  </p>
                </div>
              </div>
              {isPaymentAvailable && (
                <div className={`w-4 h-4 rounded-full ${paymentMethod === 'telegram' ? 'bg-accent' : 'border-2 border-gray-300'}`} />
              )}
            </div>
          </Card>

          {/* Card Payment (Stripe) */}
          <Card
            hover
            onClick={() => setPaymentMethod('card')}
            className={paymentMethod === 'card' ? 'border-accent bg-blue-50' : ''}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <CreditCard size={18} className="text-white" />
                </div>
                <div>
                  <h5 className="font-medium text-primary">Credit/Debit Card</h5>
                  <p className="text-sm text-secondary">Powered by Stripe</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full ${paymentMethod === 'card' ? 'bg-accent' : 'border-2 border-gray-300'}`} />
            </div>
          </Card>
        </div>
      </div>

      {/* Security Info */}
      <Card className="bg-green-50 border-green-200">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <h5 className="font-medium text-green-800">Secure Payment</h5>
            <p className="text-sm text-green-700">
              Your payment information is encrypted and secure. We don't store your card details.
            </p>
          </div>
        </div>
      </Card>

      {/* Payment Features */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-secondary">Instant confirmation</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-secondary">Refund protection</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Lock size={16} className="text-green-500" />
          <span className="text-secondary">256-bit encryption</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-secondary">24/7 support</span>
        </div>
      </div>

      {/* Payment Actions */}
      <div className="space-y-2 pt-4">
        {paymentMethod === 'telegram' && isPaymentAvailable && (
          <Button
            onClick={handleTelegramPayment}
            fullWidth
            loading={isProcessing}
            className="flex items-center justify-center gap-2"
          >
            <span className="text-sm font-bold bg-white text-blue-600 px-1 rounded">T</span>
            Pay with Telegram
          </Button>
        )}

        {paymentMethod === 'card' && (
          <Button
            onClick={handleCardPayment}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Pay with Card
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={onPaymentCancel}
          fullWidth
          className="text-secondary"
        >
          Cancel Payment
        </Button>
      </div>

      {/* Terms */}
      <div className="text-xs text-secondary text-center pt-2 border-t">
        <p>
          By proceeding with payment, you agree to our{' '}
          <button className="text-accent underline">Terms of Service</button>
          {' '}and{' '}
          <button className="text-accent underline">Privacy Policy</button>.
        </p>
      </div>
    </div>
  );
};