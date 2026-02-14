import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  CreditCard,
  Wallet,
  Banknote,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { paymentProcessingStrings, commonStrings } from '@/utils/translations';

type PaymentMethod = 'telegram' | 'card' | 'wallet' | 'cash';
type PaymentState = 'select' | 'processing' | 'success' | 'failure';

interface BookingDetails {
  id: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
    currency?: string;
  };
  specialist: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  startTime: string;
  endTime: string;
  status: string;
}

const PAYMENT_METHODS: { id: PaymentMethod; icon: React.ReactNode; color: string }[] = [
  { id: 'telegram', icon: <span className="text-white text-sm font-bold">T</span>, color: 'bg-[#2AABEE]' },
  { id: 'card', icon: <CreditCard size={18} className="text-white" />, color: 'bg-accent-primary' },
  { id: 'wallet', icon: <Wallet size={18} className="text-white" />, color: 'bg-accent-green' },
  { id: 'cash', icon: <Banknote size={18} className="text-white" />, color: 'bg-accent-yellow' },
];

export const PaymentProcessingPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('telegram');
  const [paymentState, setPaymentState] = useState<PaymentState>('select');

  const p = (key: string) => t(paymentProcessingStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const getMethodName = (method: PaymentMethod) => {
    const names: Record<PaymentMethod, string> = {
      telegram: p('telegramPay'),
      card: p('cardPayment'),
      wallet: p('walletPayment'),
      cash: p('cashPayment'),
    };
    return names[method];
  };

  const getMethodDescription = (method: PaymentMethod) => {
    const desc: Record<PaymentMethod, string> = {
      telegram: locale === 'uk' ? 'Безпечна оплата через Telegram' : locale === 'ru' ? 'Безопасная оплата через Telegram' : 'Secure payment via Telegram',
      card: locale === 'uk' ? 'Visa, Mastercard' : locale === 'ru' ? 'Visa, Mastercard' : 'Visa, Mastercard',
      wallet: locale === 'uk' ? 'Оплата з балансу гаманця' : locale === 'ru' ? 'Оплата с баланса кошелька' : 'Pay from wallet balance',
      cash: locale === 'uk' ? 'Оплата на місці' : locale === 'ru' ? 'Оплата на месте' : 'Pay at the venue',
    };
    return desc[method];
  };

  const fetchBooking = useCallback(async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBooking(bookingId) as any;
      setBooking(data);
    } catch {
      setError(c('error'));
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const localeMap = { en: 'en-US', uk: 'uk-UA', ru: 'ru-RU' };
    return date.toLocaleDateString(localeMap[locale], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePayment = async () => {
    if (!booking || !bookingId) return;

    hapticFeedback.impactMedium();
    setPaymentState('processing');

    try {
      if (selectedMethod === 'telegram') {
        // Telegram Payments flow
        const paymentIntent = await apiService.createPaymentIntent(bookingId) as any;
        const invoiceUrl = paymentIntent?.invoiceUrl || paymentIntent?.url;

        if (invoiceUrl && window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(invoiceUrl, async (status: string) => {
            if (status === 'paid') {
              try {
                await apiService.confirmPayment(paymentIntent.id || paymentIntent.paymentIntentId);
                setPaymentState('success');
                hapticFeedback.notificationSuccess();
                dispatch(addToast({ type: 'success', title: p('paymentSuccess'), message: '' }));
              } catch {
                setPaymentState('failure');
                hapticFeedback.notificationError();
              }
            } else if (status === 'cancelled' || status === 'failed') {
              setPaymentState('failure');
              hapticFeedback.notificationError();
            } else {
              // User closed the invoice without paying
              setPaymentState('select');
            }
          });
        } else {
          // Fallback: standard payment intent flow
          const intent = await apiService.createPaymentIntent(bookingId) as any;
          await apiService.confirmPayment(intent.id || intent.paymentIntentId);
          setPaymentState('success');
          hapticFeedback.notificationSuccess();
          dispatch(addToast({ type: 'success', title: p('paymentSuccess'), message: '' }));
        }
      } else if (selectedMethod === 'cash') {
        // Cash payments - just confirm booking, no online payment needed
        // Simulate a brief processing time for UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPaymentState('success');
        hapticFeedback.notificationSuccess();
        dispatch(addToast({ type: 'success', title: p('paymentSuccess'), message: '' }));
      } else {
        // Card or Wallet payment
        const intent = await apiService.createPaymentIntent(bookingId) as any;
        await apiService.confirmPayment(intent.id || intent.paymentIntentId);
        setPaymentState('success');
        hapticFeedback.notificationSuccess();
        dispatch(addToast({ type: 'success', title: p('paymentSuccess'), message: '' }));
      }
    } catch {
      setPaymentState('failure');
      hapticFeedback.notificationError();
      dispatch(addToast({ type: 'error', title: c('error'), message: p('paymentFailed') }));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error || !booking) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header showBackButton title={p('title')} />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="text-center py-12 w-full">
            <XCircle size={40} className="text-accent-red mx-auto mb-3" />
            <p className="text-text-primary font-medium mb-2">{error || c('error')}</p>
            <Button variant="secondary" onClick={() => fetchBooking()}>
              {c('retry')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Processing state
  if (paymentState === 'processing') {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={p('title')} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4 mx-auto" />
            <p className="text-text-primary font-semibold text-lg mb-1">{p('processing')}</p>
            <p className="text-text-secondary text-sm">{p('secure')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentState === 'success') {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={p('title')} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center w-full max-w-sm">
            <div className="w-20 h-20 bg-accent-green/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-accent-green" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">{p('paymentSuccess')}</h2>
            <p className="text-text-secondary text-sm mb-6">
              {booking.service.name} - {formatDate(booking.startTime)} {c('at')} {formatTime(booking.startTime)}
            </p>

            <Card className="mb-6 text-left">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-secondary text-sm">{locale === 'uk' ? 'Послуга' : locale === 'ru' ? 'Услуга' : 'Service'}</span>
                  <span className="text-text-primary text-sm font-medium">{booking.service.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-sm">{p('total')}</span>
                  <span className="text-accent-primary text-sm font-bold">${booking.service.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary text-sm">{locale === 'uk' ? 'Метод' : locale === 'ru' ? 'Метод' : 'Method'}</span>
                  <span className="text-text-primary text-sm font-medium">{getMethodName(selectedMethod)}</span>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <Button onClick={() => navigate('/bookings')} className="w-full">
                {p('backToBookings')}
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')} className="w-full">
                {locale === 'uk' ? 'На головну' : locale === 'ru' ? 'На главную' : 'Go Home'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failure state
  if (paymentState === 'failure') {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header showBackButton title={p('title')} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center w-full max-w-sm">
            <div className="w-20 h-20 bg-accent-red/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-accent-red" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">{p('paymentFailed')}</h2>
            <p className="text-text-secondary text-sm mb-6">
              {locale === 'uk'
                ? 'Щось пішло не так. Спробуйте ще раз.'
                : locale === 'ru'
                  ? 'Что-то пошло не так. Попробуйте снова.'
                  : 'Something went wrong. Please try again.'}
            </p>

            <div className="space-y-3">
              <Button onClick={() => { setPaymentState('select'); hapticFeedback.impactLight(); }} className="w-full">
                {p('tryAgain')}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/bookings')} className="w-full">
                {p('backToBookings')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default: Select payment method
  const specialistName = booking.specialist.name
    || `${booking.specialist.firstName || ''} ${booking.specialist.lastName || ''}`.trim()
    || '';

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header showBackButton title={p('title')} />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Booking Summary */}
        <div className="px-4 pt-4">
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-3">{p('bookingSummary')}</h3>

            <div className="space-y-3">
              {/* Service */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent-primary/15 flex items-center justify-center flex-shrink-0">
                  <Calendar size={18} className="text-accent-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{booking.service.name}</p>
                  <p className="text-xs text-text-secondary">
                    {formatDate(booking.startTime)} {c('at')} {formatTime(booking.startTime)}
                  </p>
                </div>
              </div>

              {/* Specialist */}
              {specialistName && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                    {booking.specialist.avatar ? (
                      <img src={booking.specialist.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User size={16} className="text-text-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{specialistName}</p>
                    <p className="text-xs text-text-secondary">
                      <Clock size={12} className="inline mr-1" />
                      {booking.service.duration} {c('min')}
                    </p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-white/5 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-text-secondary">{p('total')}</span>
                  <span className="text-xl font-bold text-accent-primary">
                    ${booking.service.price}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="px-4 pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">{p('selectMethod')}</h3>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(method => (
              <button
                key={method.id}
                onClick={() => { setSelectedMethod(method.id); hapticFeedback.selectionChanged(); }}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 touch-manipulation ${
                  selectedMethod === method.id
                    ? 'bg-accent-primary/10 border-accent-primary shadow-lg shadow-accent-primary/10'
                    : 'bg-bg-card/80 backdrop-blur-xl border-white/5 shadow-card'
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${method.color} flex items-center justify-center flex-shrink-0`}>
                  {method.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className={`text-sm font-medium ${
                    selectedMethod === method.id ? 'text-accent-primary' : 'text-text-primary'
                  }`}>
                    {getMethodName(method.id)}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {getMethodDescription(method.id)}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedMethod === method.id
                    ? 'border-accent-primary'
                    : 'border-white/20'
                }`}>
                  {selectedMethod === method.id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent-green/10">
            <Shield size={16} className="text-accent-green flex-shrink-0" />
            <p className="text-xs text-accent-green">{p('secure')}</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-white/5 p-4 z-20">
        <Button onClick={handlePayment} size="lg" className="w-full">
          {p('payNow')} - ${booking.service.price}
        </Button>
      </div>
    </div>
  );
};
