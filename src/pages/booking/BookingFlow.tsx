import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
// Mock customer data removed - now using real API data
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';

interface BookingStep {
  id: number;
  title: string;
  completed: boolean;
}

const BookingFlow: React.FC = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const user = useAppSelector(selectUser);
  
  // Mock service data based on serviceId
  const service = {
    id: serviceId || '1',
    name: t('booking.individualPsychConsultation'),
    description: t('booking.professionalPsychSupport'),
    price: 800,
    currency: 'UAH',
    duration: '60 ' + t('specialistProfile.minutes'),
    specialist: mockCustomerData.favoriteSpecialists[0],
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    type: 'online' as 'online' | 'offline',
    notes: '',
    paymentMethod: 'card',
  });

  const steps: BookingStep[] = [
    { id: 1, title: t('booking.step.dateTime'), completed: currentStep > 1 },
    { id: 2, title: t('booking.step.details'), completed: currentStep > 2 },
    { id: 3, title: t('booking.step.payment'), completed: currentStep > 3 },
    { id: 4, title: t('booking.step.confirmation'), completed: false },
  ];

  // Mock available time slots
  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];

  // Mock available dates (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date.toISOString().split('T')[0];
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingComplete = () => {
    // In a real app, this would make an API call
    navigate('/bookings');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US',
      { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }
    );
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 font-medium
              ${currentStep === step.id 
                ? 'bg-primary-600 border-primary-600 text-white' 
                : step.completed 
                  ? 'bg-success-600 border-success-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }
            `}>
              {step.completed ? (
                <CheckCircleIcon className="w-6 h-6" />
              ) : (
                step.id
              )}
            </div>
            <span className={`ml-2 text-sm font-medium ${
              currentStep === step.id ? 'text-primary-600' : 'text-gray-500'
            }`}>
              {step.title}
            </span>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 ${
                step.completed ? 'bg-success-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Оберіть дату та час
      </h2>
      
      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Доступні дати
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableDates.map((date) => (
            <button
              key={date}
              onClick={() => setBookingData({ ...bookingData, date })}
              className={`p-3 text-center rounded-xl border transition-colors ${
                bookingData.date === date
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="text-sm font-medium">
                {formatDate(date)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      {bookingData.date && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Доступний час
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setBookingData({ ...bookingData, time })}
                className={`p-3 text-center rounded-lg border transition-colors ${
                  bookingData.time === time
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Деталі бронювання
      </h2>

      {/* Meeting Type */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Тип зустрічі
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setBookingData({ ...bookingData, type: 'online' })}
            className={`p-4 rounded-xl border transition-colors ${
              bookingData.type === 'online'
                ? 'bg-primary-50 border-primary-600 text-primary-600'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="text-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Онлайн</div>
              <div className="text-sm text-gray-500">{t('booking.videoCall')}</div>
            </div>
          </button>
          <button
            onClick={() => setBookingData({ ...bookingData, type: 'offline' })}
            className={`p-4 rounded-xl border transition-colors ${
              bookingData.type === 'offline'
                ? 'bg-primary-50 border-primary-600 text-primary-600'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          >
            <div className="text-center">
              <MapPinIcon className="w-8 h-8 mx-auto mb-2" />
              <div className="font-medium">Офлайн</div>
              <div className="text-sm text-gray-500">В офісі спеціаліста</div>
            </div>
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('booking.additionalNotes')}
        </h3>
        <textarea
          value={bookingData.notes}
          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
          placeholder="Опишіть що вас турбує або що ви хотіли б обговорити..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none h-24 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Оплата
      </h2>

      {/* Payment Method */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Спосіб оплати
        </h3>
        <div className="space-y-3">
          <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={bookingData.paymentMethod === 'card'}
              onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
              className="mr-3"
            />
            <CreditCardIcon className="w-6 h-6 mr-3 text-gray-400" />
            <div>
              <div className="font-medium">Банківська картка</div>
              <div className="text-sm text-gray-500">Visa, Mastercard</div>
            </div>
          </label>
          <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={bookingData.paymentMethod === 'cash'}
              onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
              className="mr-3"
            />
            <div className="w-6 h-6 mr-3 bg-green-500 rounded flex items-center justify-center">
              <span className="text-white text-xs">₴</span>
            </div>
            <div>
              <div className="font-medium">Готівка</div>
              <div className="text-sm text-gray-500">Оплата після сеансу</div>
            </div>
          </label>
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
          Підсумок оплати
        </h4>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Послуга</span>
            <span>{formatPrice(service.price, service.currency)}</span>
          </div>
          <div className="flex justify-between">
            <span>Тривалість</span>
            <span>{service.duration}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Всього</span>
              <span>{formatPrice(service.price, service.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircleIcon className="w-10 h-10 text-success-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Бронювання підтверджено!
      </h2>
      
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 max-w-md mx-auto">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Деталі вашого бронювання:
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span>Спеціаліст:</span>
            <span className="font-medium">{service.specialist.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Послуга:</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Дата:</span>
            <span className="font-medium">{formatDate(bookingData.date)}</span>
          </div>
          <div className="flex justify-between">
            <span>Час:</span>
            <span className="font-medium">{bookingData.time}</span>
          </div>
          <div className="flex justify-between">
            <span>Тип:</span>
            <span className="font-medium">
              {bookingData.type === 'online' ? t('booking.online') : t('booking.offline')}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Вартість:</span>
            <span className="font-medium">{formatPrice(service.price, service.currency)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-gray-600 dark:text-gray-400">
          Ми надіслали підтвердження на вашу електронну пошту.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/bookings"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Переглянути бронювання
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            На головну
          </Link>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.date && bookingData.time;
      case 2:
        return bookingData.type;
      case 3:
        return bookingData.paymentMethod;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-surface rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Бронювання послуги
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {service.name}
              </p>
            </div>
          </div>

          {/* Specialist Info */}
          <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">
                {service.specialist.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {service.specialist.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {service.specialist.profession}
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center">
                  <StarIconSolid className="w-4 h-4 text-yellow-400 mr-1" />
                  <span>{service.specialist.rating}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span>{service.specialist.reviewCount} відгуків</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-surface rounded-2xl shadow-lg p-8">
          {renderStepIndicator()}

          <div className="mb-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation */}
          {currentStep < 4 && (
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2 inline" />
                Назад
              </button>
              
              <button
                onClick={currentStep === 3 ? handleBookingComplete : handleNext}
                disabled={!canProceed()}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  canProceed()
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentStep === 3 ? t('booking.confirmBooking') : t('booking.next')}
                {currentStep < 3 && <ArrowRightIcon className="w-5 h-5 ml-2 inline" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingFlow;