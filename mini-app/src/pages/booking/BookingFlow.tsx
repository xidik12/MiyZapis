import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  ChevronDown,
  Check,
  User,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { useLocale, t, formatCurrency } from '@/hooks/useLocale';
import { bookingFlowStrings, commonStrings, specialistProfileStrings } from '@/utils/translations';
import { createBookingAsync } from '@/store/slices/bookingsSlice';
import { fetchServiceAsync } from '@/store/slices/servicesSlice';
import { apiService } from '@/services/api.service';
import type { Service } from '@/store/slices/servicesSlice';

interface BookingStep {
  id: string;
  title: string;
  completed: boolean;
}

interface TimeSlot {
  date: string;
  slots: string[];
}

export const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const locale = useLocale();
  const {
    user,
    mainButton,
    backButton,
    hapticFeedback,
    showAlert,
    showConfirm
  } = useTelegram();

  // Redux state
  const { selectedService, isLoading: serviceLoading } = useAppSelector((state) => state.services);
  const { isCreating } = useAppSelector((state) => state.bookings);

  // Refs for button handler cleanup
  const mainButtonHandlerRef = useRef<(() => void) | null>(null);
  const currentStepRef = useRef(0);

  // Component state
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    notes: ''
  });

  // Extended slots state (days 8-14)
  const [extendedSlots, setExtendedSlots] = useState<TimeSlot[]>([]);
  const [loadingExtended, setLoadingExtended] = useState(false);
  const [showExtended, setShowExtended] = useState(false);

  // Track which fields the user has interacted with (for inline validation)
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const markFieldTouched = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string): string | undefined => {
    if (!touchedFields[field]) return undefined;
    const value = bookingDetails[field as keyof typeof bookingDetails];
    if ((field === 'firstName' || field === 'phone') && !value.trim()) {
      return t(bookingFlowStrings, 'requiredField', locale);
    }
    return undefined;
  };

  const serviceId = searchParams.get('serviceId') || location.state?.serviceId;
  const specialistId = searchParams.get('specialistId') || location.state?.specialistId;

  // Guard: redirect back if required params are missing
  useEffect(() => {
    if (!serviceId || !specialistId) {
      navigate(-1);
    }
  }, []);

  // 3 steps: datetime, details, payment (service review is now a persistent banner)
  const bookingSteps: BookingStep[] = [
    { id: 'datetime', title: t(bookingFlowStrings, 'dateTime', locale), completed: false },
    { id: 'details', title: t(bookingFlowStrings, 'details', locale), completed: false },
    { id: 'payment', title: t(bookingFlowStrings, 'payment', locale), completed: false }
  ];

  // Load service data on mount — always fetch to avoid stale Redux state from previous specialist
  useEffect(() => {
    if (serviceId) {
      dispatch(fetchServiceAsync(serviceId));
    }
  }, [serviceId, dispatch]);

  // Load availability when service is loaded
  useEffect(() => {
    if (selectedService && specialistId) {
      loadAvailability();
    }
  }, [selectedService, specialistId]);

  // Parallel availability loader for a date range
  const loadSlotsForRange = async (startDay: number, endDay: number): Promise<TimeSlot[]> => {
    if (!specialistId) return [];

    const today = new Date();
    const dateStrings: string[] = [];
    for (let i = startDay; i < endDay; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dateStrings.push(date.toISOString().split('T')[0]);
    }

    // Fire all requests concurrently
    const results = await Promise.allSettled(
      dateStrings.map(dateStr =>
        apiService.getSpecialistAvailability(specialistId, dateStr)
          .then(availability => ({ date: dateStr, availability }))
      )
    );

    const slots: TimeSlot[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { date, availability } = result.value;
        if (availability && Array.isArray(availability) && availability.length > 0) {
          slots.push({ date, slots: availability });
        }
      }
    }

    return slots;
  };

  const loadAvailability = async () => {
    if (!specialistId) return;

    setLoadingAvailability(true);
    setAvailabilityError(null);
    setShowExtended(false);
    setExtendedSlots([]);

    try {
      // Get availability for the next 7 days (parallelized)
      const slots = await loadSlotsForRange(0, 7);

      if (slots.length === 0) {
        setAvailabilityError(t(bookingFlowStrings, 'noSlotsAvailable', locale));
      }

      setAvailableSlots(slots);
    } catch (error) {
      setAvailabilityError(t(commonStrings, 'error', locale));
    } finally {
      setLoadingAvailability(false);
    }
  };

  const loadExtendedDates = async () => {
    setLoadingExtended(true);
    try {
      const slots = await loadSlotsForRange(7, 14);
      setExtendedSlots(slots);
      setShowExtended(true);
    } catch (error) {
      // Silently fail — user still has first 7 days
    } finally {
      setLoadingExtended(false);
    }
  };

  // Keep currentStepRef in sync so back handler always sees latest step
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStepRef.current > 0) {
      setCurrentStep(prev => prev - 1);
      hapticFeedback.impactLight();
    } else {
      navigate(-1);
    }
  }, [hapticFeedback, navigate]);

  // Configure Telegram UI
  useEffect(() => {
    backButton.show();
    backButton.onClick(handleBack);

    return () => {
      backButton.hide();
      backButton.offClick(handleBack);
      mainButton.hide();
      // Clean up any remaining main button handler
      if (mainButtonHandlerRef.current) {
        mainButton.offClick(mainButtonHandlerRef.current);
        mainButtonHandlerRef.current = null;
      }
    };
  }, [handleBack]);

  // Helper to swap the main button handler without accumulating listeners
  const setMainButtonHandler = useCallback((handler: () => void) => {
    if (mainButtonHandlerRef.current) {
      mainButton.offClick(mainButtonHandlerRef.current);
    }
    mainButtonHandlerRef.current = handler;
    mainButton.onClick(handler);
  }, [mainButton]);

  // Update main button based on current step
  useEffect(() => {
    const step = bookingSteps[currentStep];

    switch (step.id) {
      case 'datetime':
        if (selectedDate && selectedTime) {
          mainButton.setText(t(commonStrings, 'continue', locale));
          mainButton.show();
          setMainButtonHandler(handleDateTimeNext);
        } else {
          mainButton.hide();
        }
        break;

      case 'details':
        if (bookingDetails.firstName && bookingDetails.phone) {
          mainButton.setText(t(commonStrings, 'continue', locale));
          mainButton.show();
          setMainButtonHandler(handleDetailsNext);
        } else {
          mainButton.hide();
        }
        break;

      case 'payment':
        mainButton.setText(t(bookingFlowStrings, 'bookAndPay', locale));
        mainButton.show();
        setMainButtonHandler(handlePayment);
        break;
    }
  }, [currentStep, selectedDate, selectedTime, bookingDetails, locale]);

  const handleDateTimeNext = () => {
    setCurrentStep(1);
    hapticFeedback.impactLight();
  };

  const handleDetailsNext = () => {
    setCurrentStep(2);
    hapticFeedback.impactLight();
  };

  const handlePayment = async () => {
    const confirmed = await showConfirm(
      `${t(commonStrings, 'confirm', locale)} ${formatDate(selectedDate)} ${t(commonStrings, 'at', locale) || 'at'} ${selectedTime}?`
    );

    if (confirmed) {
      mainButton.showProgress();

      try {
        if (!selectedService || !specialistId) {
          throw new Error('Missing service or specialist information');
        }

        // Backend expects scheduledAt (ISO8601)
        const scheduledAt = new Date(`${selectedDate}T${selectedTime}`);

        // Create booking via Redux
        const result = await dispatch(createBookingAsync({
          serviceId: selectedService.id,
          specialistId: specialistId,
          scheduledAt: scheduledAt.toISOString(),
          notes: bookingDetails.notes
        })).unwrap();

        await showAlert(t(bookingFlowStrings, 'bookingSuccess', locale));
        hapticFeedback.notificationSuccess();
        navigate('/bookings');
      } catch (error: unknown) {
        const errorMsg = error?.message || error?.response?.data?.message || '';
        if (errorMsg.includes('CANNOT_BOOK_OWN_SERVICE')) {
          await showAlert(t(specialistProfileStrings, 'cannotBookOwn', locale));
        } else {
          await showAlert(t(bookingFlowStrings, 'bookingFailed', locale));
        }
        hapticFeedback.notificationError();
      } finally {
        mainButton.hideProgress();
      }
    }
  };

  const handleTimeSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    hapticFeedback.selectionChanged();
  };

  const handleInputChange = (field: string, value: string) => {
    setBookingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    };

    // Use appropriate locale for date formatting
    const localeMap = { en: 'en-US', uk: 'uk-UA', ru: 'ru-RU' };
    return date.toLocaleDateString(localeMap[locale], options);
  };

  // Compact persistent service+specialist banner
  const renderServiceBanner = () => {
    if (!selectedService) return null;

    return (
      <div className="px-4 py-2 bg-bg-card border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-hover flex-shrink-0 overflow-hidden">
            {selectedService.images && selectedService.images[0] ? (
              <img
                src={selectedService.images[0]}
                alt={selectedService.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <Calendar size={20} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">
              {selectedService.name}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {selectedService.specialist?.name || ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 text-xs text-text-secondary">
            <span>{selectedService.duration}{t(commonStrings, 'min', locale)}</span>
            <span className="font-semibold text-accent-primary text-sm">
              {formatCurrency(selectedService.price, undefined, locale)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderStepIndicator = () => (
    <div className="px-4 py-3 bg-bg-card border-b border-white/5">
      <div className="flex items-center justify-between">
        {bookingSteps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${index < bookingSteps.length - 1 ? 'flex-1' : ''}`}
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index < currentStep ? 'bg-accent-primary text-white' :
                  index === currentStep ? 'bg-accent-primary text-white' : 'bg-bg-hover text-text-muted'}
              `}
            >
              {index < currentStep ? <Check size={16} /> : index + 1}
            </div>
            {index < bookingSteps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  index < currentStep ? 'bg-accent-primary' : 'bg-bg-hover'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium text-text-primary">
          {bookingSteps[currentStep].title}
        </p>
      </div>
    </div>
  );

  const renderDateTimeStep = () => {
    const allSlots = showExtended ? [...availableSlots, ...extendedSlots] : availableSlots;

    return (
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-text-primary mb-3">
            {t(bookingFlowStrings, 'selectDate', locale)}
          </h3>

          {loadingAvailability ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : availabilityError ? (
            <div className="bg-bg-card rounded-2xl p-6 text-center border border-white/5">
              <p className="text-text-secondary">{availabilityError}</p>
              <Button
                variant="secondary"
                onClick={loadAvailability}
                className="mt-4"
              >
                {t(commonStrings, 'retry', locale) || 'Retry'}
              </Button>
            </div>
          ) : allSlots.length === 0 ? (
            <div className="bg-bg-card rounded-2xl p-6 text-center border border-white/5">
              <p className="text-text-secondary">
                {t(bookingFlowStrings, 'noSlotsAvailable', locale)}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allSlots.map((daySlots) => (
                <div key={daySlots.date} className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/5">
                  <div className="mb-3">
                    <h4 className="font-medium text-text-primary">
                      {formatDate(daySlots.date)}
                    </h4>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {daySlots.slots.map((time) => (
                      <button
                        key={`${daySlots.date}-${time}`}
                        onClick={() => handleTimeSlotSelect(daySlots.date, time)}
                        className={`
                          py-2 px-3 rounded-lg text-sm font-medium transition-colors touch-manipulation
                          ${selectedDate === daySlots.date && selectedTime === time
                            ? 'bg-accent-primary text-white'
                            : 'bg-bg-secondary text-text-primary hover:bg-accent-primary hover:text-white'
                          }
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Show more dates button */}
              {!showExtended && (
                <Button
                  variant="secondary"
                  onClick={loadExtendedDates}
                  disabled={loadingExtended}
                  className="w-full"
                >
                  {loadingExtended ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <ChevronDown size={16} className="mr-2" />
                  )}
                  {t(bookingFlowStrings, 'showMoreDates', locale)}
                </Button>
              )}
            </div>
          )}
        </div>

        {selectedDate && selectedTime && selectedService && (
          <div className="bg-accent-green/15 rounded-2xl p-4 shadow-card border border-white/5">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-accent-green" />
              <div>
                <p className="font-medium text-accent-green">
                  {formatDate(selectedDate)} {t(commonStrings, 'at', locale) || 'at'} {selectedTime}
                </p>
                <p className="text-sm text-accent-green/80">
                  {t(bookingFlowStrings, 'duration', locale)}: {selectedService.duration} {t(commonStrings, 'min', locale)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDetailsStep = () => (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-text-primary mb-3">
          {t(bookingFlowStrings, 'contactInfo', locale)}
        </h3>

        <div className="space-y-4">
          <Input
            label={`${t(bookingFlowStrings, 'firstName', locale)} *`}
            value={bookingDetails.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            onBlur={() => markFieldTouched('firstName')}
            error={getFieldError('firstName')}
            icon={<User size={18} />}
            placeholder={t(bookingFlowStrings, 'firstName', locale)}
            required
          />

          <Input
            label={t(bookingFlowStrings, 'lastName', locale)}
            value={bookingDetails.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            icon={<User size={18} />}
            placeholder={t(bookingFlowStrings, 'lastName', locale)}
          />

          <Input
            label={`${t(bookingFlowStrings, 'phoneNumber', locale)} *`}
            type="tel"
            value={bookingDetails.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            onBlur={() => markFieldTouched('phone')}
            error={getFieldError('phone')}
            icon={<Phone size={18} />}
            placeholder={t(bookingFlowStrings, 'phoneNumber', locale)}
            required
          />

          <Input
            label={t(bookingFlowStrings, 'email', locale)}
            type="email"
            value={bookingDetails.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            icon={<Mail size={18} />}
            placeholder={t(bookingFlowStrings, 'email', locale)}
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              {t(bookingFlowStrings, 'specialNotes', locale)}
            </label>
            <textarea
              value={bookingDetails.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t(bookingFlowStrings, 'specialNotes', locale)}
              rows={3}
              className="w-full bg-bg-secondary border border-white/5 rounded-xl px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => {
    if (!selectedService) return null;

    return (
      <div className="p-4 space-y-4">
        <div className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/5">
          <h3 className="font-semibold text-text-primary mb-3">
            {t(bookingFlowStrings, 'bookingSummary', locale)}
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t(bookingFlowStrings, 'service', locale)}:</span>
              <span className="font-medium text-text-primary">{selectedService.name}</span>
            </div>

            {selectedService.specialist && (
              <div className="flex justify-between">
                <span className="text-text-secondary">{t(bookingFlowStrings, 'specialist', locale)}:</span>
                <span className="font-medium text-text-primary">{selectedService.specialist?.name || ''}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-text-secondary">{t(bookingFlowStrings, 'dateTime', locale)}:</span>
              <span className="font-medium text-text-primary">
                {selectedDate && formatDate(selectedDate)} {selectedTime}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-text-secondary">{t(bookingFlowStrings, 'duration', locale)}:</span>
              <span className="font-medium text-text-primary">
                {selectedService.duration} {t(commonStrings, 'min', locale)}
              </span>
            </div>

            <div className="border-t border-white/5 pt-3 mt-3">
              <div className="flex justify-between text-lg font-semibold">
                <span className="text-text-primary">{t(bookingFlowStrings, 'total', locale)}:</span>
                <span className="text-accent-primary">{formatCurrency(selectedService.price, undefined, locale)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/5">
          <h4 className="font-medium text-text-primary mb-3">
            {t(bookingFlowStrings, 'paymentMethod', locale)}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent-primary/10 border border-accent-primary">
              <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-text-primary">
                  {t(bookingFlowStrings, 'telegramPayments', locale)}
                </p>
                <p className="text-sm text-accent-primary">{t(bookingFlowStrings, 'securePaymentViaTelegram', locale)}</p>
              </div>
              <div className="w-4 h-4 rounded-full bg-accent-primary" />
            </div>
          </div>
        </div>

        {bookingDetails.notes && (
          <div className="bg-bg-card rounded-2xl p-4 shadow-card border border-white/5">
            <h4 className="font-medium text-text-primary mb-2">
              {t(bookingFlowStrings, 'specialNotes', locale)}
            </h4>
            <p className="text-text-secondary">{bookingDetails.notes}</p>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (bookingSteps[currentStep].id) {
      case 'datetime':
        return renderDateTimeStep();
      case 'details':
        return renderDetailsStep();
      case 'payment':
        return renderPaymentStep();
      default:
        return null;
    }
  };

  if (isCreating) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header title={t(bookingFlowStrings, 'processing', locale)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4 mx-auto" />
            <p className="text-text-secondary">
              {t(bookingFlowStrings, 'processing', locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header title={t(bookingFlowStrings, 'bookAppointment', locale)} />

      {renderStepIndicator()}
      {renderServiceBanner()}

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {renderCurrentStep()}
      </div>
    </div>
  );
};
