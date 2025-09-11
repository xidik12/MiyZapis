import React, { useState, useEffect } from 'react';
import { socketService } from '../../services/socket.service';
import { translateProfession } from '@/utils/profession';
import { toast } from 'react-toastify';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService, serviceService, bookingService } from '../../services';
import { loyaltyService, UserLoyalty } from '@/services/loyalty.service';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  GiftIcon,
  StarIcon,
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
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const user = useAppSelector(selectUser);
  
  const [specialist, setSpecialist] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availableDates, setAvailableDates] = useState<Array<{
    date: string;
    dayName: string;
    workingHours: string;
    availableSlots: number;
    totalSlots: number;
  }>>([]);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [conflictHint, setConflictHint] = useState<{ active: boolean; lastTried?: string }>({ active: false });
  const [loyaltyData, setLoyaltyData] = useState<UserLoyalty | null>(null);
  const [pointsToEarn, setPointsToEarn] = useState<number>(0);

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
          try {
            console.log('🔍 BookingFlow: Fetching service with ID:', serviceId);
            const serviceData = await serviceService.getService(serviceId);
            console.log('✅ BookingFlow: Service fetched successfully:', serviceData);
            setService(serviceData);
            
            // Fetch specialist data from the service
            const currentSpecialistId = serviceData.specialistId || serviceData.specialist?.id;
            if (currentSpecialistId) {
              console.log('🔍 BookingFlow: Fetching specialist with ID:', currentSpecialistId);
              const specialistData = await specialistService.getPublicProfile(currentSpecialistId);
              console.log('✅ BookingFlow: Specialist fetched successfully:', specialistData);
              setSpecialist(specialistData);
            } else if (serviceData.specialist) {
              // Use embedded specialist data if available
              console.log('✅ BookingFlow: Using embedded specialist data:', serviceData.specialist);
              setSpecialist(serviceData.specialist);
            } else {
              console.warn('⚠️ BookingFlow: Service has no specialistId or specialist data:', serviceData);
            }
          } catch (error) {
            console.warn('Service not found by ID, trying specialist approach:', error);
            // If service fetch fails, try to find specialist services
            if (specialistId) {
              const specialistData = await specialistService.getPublicProfile(specialistId);
              setSpecialist(specialistData);
              
              const services = await specialistService.getSpecialistServices(specialistId);
              if (services.length > 0) {
                // Find service by ID or use first service
                const foundService = services.find(s => s.id === serviceId) || services[0];
                setService(foundService);
              }
            }
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

  // Fetch loyalty data and calculate points to earn
  useEffect(() => {
    const fetchLoyaltyData = async () => {
      if (!user || !service) return;
      
      try {
        const loyalty = await loyaltyService.getUserLoyalty().catch(() => null);
        setLoyaltyData(loyalty);

        // Calculate points to earn (typically 1% of service price)
        const servicePrice = service.price || service.basePrice || 0;
        const earnedPoints = Math.floor(servicePrice * 0.01); // 1 point per 1 currency unit spent
        setPointsToEarn(earnedPoints);
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      }
    };

    fetchLoyaltyData();
  }, [user, service]);

  useEffect(() => {
    // Fetch available dates when specialist is loaded
    const fetchAvailableDates = async () => {
      const currentSpecialistId = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;
      
      if (!currentSpecialistId) {
        console.log('🔍 BookingFlow: Cannot fetch dates - specialistId not found');
        return;
      }

      try {
        console.log('📅 BookingFlow: Fetching available dates for specialist:', currentSpecialistId);
        const dateData = await specialistService.getAvailableDates(currentSpecialistId);
        console.log('✅ BookingFlow: Available dates received:', dateData.availableDates);
        setAvailableDates(dateData.availableDates || []);
      } catch (error) {
        console.error('❌ BookingFlow: Error fetching available dates:', error);
        setAvailableDates([]);
      }
    };

    fetchAvailableDates();

    // Subscribe to availability updates (if backend emits)
    const sid = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;
    if (sid) {
      try { socketService.subscribeToAvailability(sid); } catch {}
    }
    const onAvail = (data: any) => {
      const sidData = data?.specialistId || data?.id;
      if (!sid || sidData !== sid) return;
      // If current selected date matches update, refresh slots/dates
      try {
        if (selectedDate) {
          refreshSlots();
        }
      } catch {}
    };
    socketService.on('availability:updated', onAvail as any);
    return () => {
      socketService.off('availability:updated', onAvail as any);
      if (sid) {
        try { socketService.unsubscribeFromAvailability(sid); } catch {}
      }
    };
  }, [specialist, service, specialistId]);

  useEffect(() => {
    // Fetch available time slots when date is selected
    const fetchAvailableSlots = async () => {
      const currentSpecialistId = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;
      
      if (!currentSpecialistId || !selectedDate) {
        console.log('🔍 BookingFlow: Cannot fetch slots - specialistId:', currentSpecialistId, 'selectedDate:', selectedDate);
        return;
      }

      try {
        console.log('📅 BookingFlow: Fetching available slots for specialist:', currentSpecialistId, 'date:', selectedDate.toISOString().split('T')[0]);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const slots = await specialistService.getAvailableSlots(currentSpecialistId, dateStr);
        console.log('✅ BookingFlow: Available slots received:', slots);
        setAvailableSlots(slots || []);
      } catch (error) {
        console.error('❌ BookingFlow: Error fetching available slots:', error);
        // Don't show any slots if there's an error - better to show empty than incorrect availability
        setAvailableSlots([]);
        toast.error('Unable to load available time slots. Please try again.');
      }
    };

    fetchAvailableSlots();
  }, [specialist, service, specialistId, selectedDate]);

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

  const refreshSlots = async () => {
    try {
      const currentSpecialistId = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;
      if (!currentSpecialistId || !selectedDate) return;
      const dateStr = selectedDate.toISOString().split('T')[0];
      const slots = await specialistService.getAvailableSlots(currentSpecialistId, dateStr);
      setAvailableSlots(slots || []);
    } catch (e) {}
  };

  const handleBookingSubmit = async () => {
    const currentSpecialistId = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;
    
    console.log('📋 BookingFlow: Attempting to create booking...');
    console.log('🔍 BookingFlow: Booking data check:', {
      specialist: !!specialist,
      service: !!service,
      selectedDate: selectedDate,
      selectedTime: selectedTime,
      currentSpecialistId
    });
    
    if (!specialist || !service || !selectedDate || !selectedTime) {
      console.error('❌ BookingFlow: Missing required booking data');
      return;
    }

    try {
      // Combine date and time into scheduledAt DateTime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);
      
      const bookingData = {
        serviceId: service.id,
        scheduledAt: scheduledAt.toISOString(),
        duration: service.duration || 60, // Default to 60 minutes if not specified
        customerNotes: bookingNotes || undefined,
        loyaltyPointsUsed: 0, // Default to 0
      };
      
      console.log('📤 BookingFlow: Sending booking data:', bookingData);
      const result = await bookingService.createBooking(bookingData);
      console.log('✅ BookingFlow: Booking created successfully:', result);
      
      // Store booking result for confirmation step
      setBookingResult(result);
      
      // Navigate to confirmation step
      setCurrentStep(steps.length - 1);
    } catch (error: any) {
      console.error('❌ BookingFlow: Error creating booking:', error);
      const code = error?.apiError?.code;
      const status = error?.response?.status || error?.apiError?.status;
      if (code === 'BOOKING_CONFLICT' || status === 409 || error?.message?.includes('time slot')) {
        toast.warning('This time slot was just booked by someone else. Please choose another.');
        await refreshSlots();
        setCurrentStep(1); // Ensure user stays on time selection
        setConflictHint({ active: true, lastTried: selectedTime });
      } else {
        toast.error('Failed to create booking. Please try again.');
      }
    }
  };

  // Convert available dates to Date objects for display
  const getDisplayDates = () => {
    return availableDates.map(dateInfo => ({
      date: new Date(dateInfo.date),
      dateInfo
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!specialist || !service) {
    console.log('❌ BookingFlow: Missing data - specialist:', specialist, 'service:', service);
    console.log('🔍 BookingFlow: Service ID from params:', serviceId);
    console.log('🔍 BookingFlow: Specialist ID from params:', specialistId);
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

  // Prevent specialists from booking their own services (client-side UX guard)
  const isOwnService = Boolean(
    user?.userType === 'specialist' &&
    user?.id &&
    (
      specialist?.user?.id === user.id ||
      service?.specialist?.user?.id === user.id
    )
  );
  
  // Debug logging for specialists
  if (user?.userType === 'specialist' && (specialist || service)) {
    console.log('🔍 BookingFlow: Specialist booking check:', {
      userId: user.id,
      specialistUserId: specialist?.user?.id,
      serviceSpecialistUserId: service?.specialist?.user?.id,
      isOwnService
    });
  }

  if (isOwnService) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t('booking.cannotBookOwn') || "You can't book your own service"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('booking.cannotBookOwnDesc') || 'Please ask a customer to book this service.'}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-primary-600 text-white py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors"
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
                      {formatPrice(service.price || service.basePrice || 0, service.currency)}
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
              
              {getDisplayDates().length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                  {getDisplayDates().slice(0, 14).map(({ date, dateInfo }) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 text-sm rounded-lg border transition-colors relative ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                      }`}
                      title={`${dateInfo.availableSlots} available slots (${dateInfo.workingHours})`}
                    >
                      <div className="text-center">
                        <div className="font-medium">{date.getDate()}</div>
                        <div className="text-xs opacity-75">
                          {date.toLocaleDateString(language || 'en', { weekday: 'short' })}
                        </div>
                        <div className="text-xs text-primary-600 font-medium mt-1">
                          {dateInfo.availableSlots} slots
                        </div>
                      </div>
                      {dateInfo.availableSlots === 1 && (
                        <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Only 1</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {t('booking.noAvailableDates')}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    The specialist has no available time slots in the next 30 days
                  </p>
                </div>
              )}
            </div>

            {selectedDate && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {t('booking.selectTime')}
                </h3>
                {conflictHint.active && (
                  <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-lg mb-4">
                    <div className="text-sm">{t('booking.timeConflict') || 'That time just got booked. Try next available?'}</div>
                    <button
                      onClick={() => {
                        if (!availableSlots || availableSlots.length === 0) return;
                        const idx = conflictHint.lastTried ? availableSlots.indexOf(conflictHint.lastTried) : -1;
                        const next = idx >= 0 && idx < availableSlots.length - 1 ? availableSlots[idx + 1] : availableSlots[0];
                        setSelectedTime(next);
                        setConflictHint({ active: false });
                        setTimeout(() => handleBookingSubmit(), 50);
                      }}
                      className="btn btn-error btn-sm text-white"
                    >
                      {t('booking.tryNextAvailable') || 'Try next available'}
                    </button>
                  </div>
                )}
                
                {availableSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSlots.map((slot: any) => {
                      const time = typeof slot === 'string' ? slot : slot.time;
                      const count = typeof slot === 'string' ? undefined : slot.count;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`relative px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            selectedTime === time
                              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                          }`}
                        >
                          {time}
                          {count === 1 && (
                            <span className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">1</span>
                          )}
                        </button>
                      );
                    })}
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
                    {selectedDate?.toLocaleDateString(language || 'en')} {selectedTime}
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
                      {formatPrice(service.price || service.basePrice || 0, service.currency)}
                    </span>
                  </div>
                  
                  {/* Loyalty Points to Earn */}
                  {loyaltyData && pointsToEarn > 0 && (
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center space-x-2">
                        <GiftIcon className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                          Points you'll earn
                        </span>
                      </div>
                      <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        +{pointsToEarn} points
                      </span>
                    </div>
                  )}
                  
                  {/* Current Loyalty Points */}
                  {loyaltyData && (
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Your current points
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {loyaltyData?.currentPoints?.toLocaleString() || '0'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3: // Payment
        return (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                {t('booking.payment')}
              </h3>
              
              {/* Order Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-900 dark:text-white">{service.name}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatPrice(service.price || service.basePrice || 0, service.currency)}
                  </span>
                </div>
                
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
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <GiftIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Loyalty Rewards</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {loyaltyData.tier?.name || 'Bronze'} Member Benefits
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
                        {loyaltyData.currentPoints.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Current points</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-purple-600 dark:text-purple-400 text-center mt-3">
                    After this booking: {(loyaltyData.currentPoints + pointsToEarn).toLocaleString()} points
                  </p>
                </div>
              )}
              
              <div className="text-center py-4 mb-6">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('booking.paymentIntegrationPending')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Complete booking to earn your loyalty points
                </p>
              </div>
              
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
        const booking = bookingResult?.booking;
        const isAutoBooked = booking?.status === 'CONFIRMED';
        const isPending = booking?.status === 'PENDING';
        
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
              <CheckCircleIcon className={`w-16 h-16 mx-auto mb-4 ${isAutoBooked ? 'text-green-600' : 'text-yellow-600'}`} />
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isAutoBooked ? t('booking.bookingConfirmed') : t('booking.bookingRequested')}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isAutoBooked 
                  ? t('booking.autoBookingConfirmed') 
                  : t('booking.manualBookingMessage')
                }
              </p>

              {/* Loyalty Points Earned Notification */}
              {loyaltyData && pointsToEarn > 0 && isAutoBooked && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-3 mb-2">
                    <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <GiftIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-purple-600 dark:text-purple-400">
                        🎉 You earned {pointsToEarn} loyalty points!
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        New balance: {(loyaltyData.currentPoints + pointsToEarn).toLocaleString()} points
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => window.open('/loyalty', '_blank')}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                    >
                      <StarIcon className="h-4 w-4 mr-1" />
                      View Loyalty Dashboard
                    </button>
                  </div>
                </div>
              )}
              
              {isPending && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t('booking.waitingForSpecialistConfirmation')}
                  </p>
                </div>
              )}
              
              <button
                onClick={() => navigate('/customer/bookings')}
                className="bg-primary-600 text-white py-2 px-6 rounded-lg hover:bg-primary-700 transition-colors"
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
              </div>
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
            {specialist.user?.firstName} {specialist.user?.lastName} - {translateProfession(specialist.businessName, t)}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
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
                <div className="ml-3 hidden md:block">
                  <p
                    className={`text-sm font-medium whitespace-nowrap ${
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
                    className={`w-8 sm:w-12 h-0.5 mx-2 sm:mx-4 flex-shrink-0 ${
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
          <div className="flex justify-between gap-4">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-4 sm:px-6 py-2 rounded-lg transition-colors flex-shrink-0 ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">{t('navigation.previous')}</span>
              <span className="sm:hidden">{t('navigation.prev') || 'Prev'}</span>
            </button>
            
            <button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && (!selectedDate || !selectedTime)) ||
                (currentStep === 2 && !service)
              }
              className="flex items-center px-4 sm:px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0"
            >
              <span className="hidden sm:inline">{t('navigation.next')}</span>
              <span className="sm:hidden">{t('navigation.next') || 'Next'}</span>
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;
