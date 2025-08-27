import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService, serviceService, bookingService } from '../../services';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface BookingStep {
  id: string;
  title: string;
  completed: boolean;
}

const BookingFlow: React.FC = () => {
  const { serviceId: paramServiceId, specialistId } = useParams();
  const [searchParams] = useSearchParams();
  const queryServiceId = searchParams.get('service');
  
  // Always prioritize service ID from URL params, then query params, then specialist route
  const serviceId = paramServiceId || queryServiceId;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const user = useAppSelector(selectUser);
  
  const [specialist, setSpecialist] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookingNotes, setBookingNotes] = useState('');

  const steps: BookingStep[] = [
    { id: 'service', title: t('booking.selectService'), completed: false },
    { id: 'datetime', title: t('booking.selectDateTime'), completed: false },
    { id: 'details', title: t('booking.bookingDetails'), completed: false },
    { id: 'payment', title: t('booking.payment'), completed: false },
    { id: 'confirmation', title: t('booking.confirmation'), completed: false },
  ];

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!serviceId && !specialistId) return;

      try {
        setLoading(true);
        
        if (serviceId) {
          // Primary flow: fetch by service ID
          const serviceData = await serviceService.getService(serviceId);
          setService(serviceData);
          
          // Fetch specialist data from the service
          if (serviceData.specialistId) {
            const specialistData = await specialistService.getPublicProfile(serviceData.specialistId);
            setSpecialist(specialistData);
          }
        } else if (specialistId) {
          // Fallback: fetch by specialist ID (for backward compatibility)
          const specialistData = await specialistService.getPublicProfile(specialistId);
          setSpecialist(specialistData);
          
          // Fetch specialist's first service
          const services = await specialistService.getSpecialistServices(specialistId);
          if (services.length > 0) {
            setService(services[0]); // Select first service by default
          }
        }

      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [specialistId, serviceId]);

  useEffect(() => {
    // Fetch available time slots when date is selected
    const fetchAvailableSlots = async () => {
      if (!specialistId || !selectedDate) return;

      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const slots = await specialistService.getAvailableSlots(specialistId, dateStr);
        setAvailableSlots(slots || []);
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setAvailableSlots([]);
      }
    };

    fetchAvailableSlots();
  }, [specialistId, selectedDate]);

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingSubmit = async () => {
    if (!specialist || !service || !selectedDate || !selectedTime) {
      return;
    }

    try {
      const bookingData = {
        specialistId,
        serviceId: service.id,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        notes: bookingNotes,
      };

      const booking = await bookingService.createBooking(bookingData);
      
      // Navigate to confirmation step
      setCurrentStep(steps.length - 1);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  // Generate available dates (next 30 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!specialist || !service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('errors.bookingDataNotFound')}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('navigation.goBack')}
          </button>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Service Selection
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('booking.selectedService')}
              </h3>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {service.description}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      <span>{service.duration} {t('time.minutes')}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(service.price, service.currency)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 1: // Date & Time Selection
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('booking.selectDate')}
              </h3>
              
              <div className="grid grid-cols-7 gap-2">
                {getAvailableDates().slice(0, 14).map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      selectedDate?.toDateString() === date.toDateString()
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="font-medium">{date.getDate()}</div>
                      <div className="text-xs opacity-75">
                        {date.toLocaleDateString(language, { weekday: 'short' })}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {t('booking.selectTime')}
                </h3>
                
                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 text-sm rounded-lg border transition-colors ${
                          selectedTime === time
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    {t('booking.noAvailableSlots')}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 2: // Booking Details
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('booking.bookingDetails')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('booking.additionalNotes')}
                  </label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder={t('booking.notesPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Booking Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('booking.summary')}
              </h3>
              
              <div className="space-y-3">
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
                    {selectedDate?.toLocaleDateString(language)} {selectedTime}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('booking.duration')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {service.duration} {t('time.minutes')}
                  </span>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{t('booking.total')}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(service.price, service.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Payment
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('booking.payment')}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                {t('booking.paymentIntegrationPending')}
              </p>
              
              <button
                onClick={handleBookingSubmit}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
              >
                <CreditCardIcon className="w-5 h-5 mr-2" />
                {t('booking.confirmBooking')}
              </button>
            </div>
          </div>
        );

      case 4: // Confirmation
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('booking.bookingConfirmed')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('booking.confirmationMessage')}
              </p>
              
              <button
                onClick={() => navigate('/customer/bookings')}
                className="bg-primary-600 text-white py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('booking.viewBookings')}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {t('navigation.back')}
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('booking.bookService')}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {specialist.user?.firstName} {specialist.user?.lastName} - {specialist.businessName}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    index <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      index <= currentStep
                        ? 'text-primary-600'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-4 ${
                      index < currentStep
                        ? 'bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              {t('navigation.previous')}
            </button>
            
            <button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && (!selectedDate || !selectedTime)) ||
                (currentStep === 2 && !service)
              }
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {t('navigation.next')}
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;