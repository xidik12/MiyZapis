import React, { useEffect, useRef, useCallback, useState } from 'react';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService, subscribeToPaymentUpdates } from '../../services/socket.service';
import { translateProfession } from '@/utils/profession';
import { toast } from 'react-toastify';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser, selectIsAuthenticated } from '../../store/slices/authSlice';
import { specialistService, serviceService, bookingService } from '../../services';
import { waitlistService } from '../../services/waitlist.service';
import { paymentService } from '../../services/payment.service';
import { loyaltyService } from '@/services/loyalty.service';
import { RewardsService } from '@/services/rewards.service';
import { filterSlotsByDuration } from '../../utils/timeSlotUtils';
import { environment } from '@/config/environment';
import { logger } from '@/utils/logger';
import { ArrowLeftIcon, ShieldCheckIcon } from '@/components/icons';
import { useCurrency } from '@/contexts/CurrencyContext';
import { fireSuccessConfetti } from '@/utils/confetti';
import { PageLoader } from '@/components/ui';
import type { RecurrenceData } from '@/components/modals/RecurringBookingModal';

// Booking sub-components
import { useBookingState } from './hooks/useBookingState';
import type { BookingStep } from './types';
import BookingProgress from './components/BookingProgress';
import NavigationButtons from './components/NavigationButtons';
import WaitlistModal from './components/WaitlistModal';
import GuestCheckout from './components/GuestCheckout';
import ServiceSelect from './steps/ServiceSelect';
import DateTimePicker from './steps/DateTimePicker';
import BookingDetails from './steps/BookingDetails';
import PaymentStep from './steps/PaymentStep';
import Confirmation from './steps/Confirmation';

const BookingFlow: React.FC = () => {
  const { serviceId: paramServiceId, specialistId } = useParams();
  const [searchParams] = useSearchParams();
  const queryServiceId = searchParams.get('service');
  // If this booking was opened from a notified waitlist entry, claim the slot on success
  const waitlistIdFromParam = searchParams.get('waitlistId') || null;

  // Marketplace acquisition: where this booking originated. Threaded from the
  // entry point via ?source= (search results = DISCOVERY, embed widget = EMBED);
  // defaults to DIRECT. Persisted on the Booking for new-client attribution.
  const ALLOWED_SOURCES = ['DIRECT', 'DISCOVERY', 'EMBED', 'MARKETPLACE'] as const;
  const rawSource = (searchParams.get('source') || '').toUpperCase();
  const bookingSource = (ALLOWED_SOURCES as readonly string[]).includes(rawSource)
    ? (rawSource as (typeof ALLOWED_SOURCES)[number])
    : 'DIRECT';

  // Always prioritize service ID from URL params, then query params, then specialist route
  const serviceId = paramServiceId || queryServiceId;
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Mobile summary panel: collapsible toggle state
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Guest checkout: show the inline OTP flow in place of the sign-in banner
  const [showGuestCheckout, setShowGuestCheckout] = useState(false);

  const { bookingState: state, dispatch } = useBookingState();

  // Ref to prevent duplicate booking submissions
  const bookingInProgressRef = useRef<boolean>(false);

  // Helper to get specialist ID from various sources
  const getSpecialistId = useCallback(() => {
    return state.specialist?.id || state.service?.specialistId || state.service?.specialist?.id || specialistId;
  }, [state.specialist, state.service, specialistId]);

  // Calculate discount preview
  const calculateDiscount = useCallback(() => {
    if (!state.selectedRedemptionId) return 0;

    const selectedRedemption = state.redemptions.find(r => r.id === state.selectedRedemptionId);
    if (!selectedRedemption || !state.service) return 0;

    const basePrice = (state.service?.price ?? state.service?.basePrice ?? 0);
    const reward = selectedRedemption.reward;

    switch (reward.type) {
      case 'PERCENTAGE_OFF':
        return reward.discountPercent ? (basePrice * reward.discountPercent) / 100 : 0;
      case 'DISCOUNT_VOUCHER':
        return Math.min(reward.discountAmount || 0, basePrice);
      case 'FREE_SERVICE':
        return basePrice;
      default:
        return 0;
    }
  }, [state.selectedRedemptionId, state.redemptions, state.service]);

  const discount = calculateDiscount();
  const finalPrice = Math.max(0, ((state.service?.price ?? state.service?.basePrice ?? 0) - discount));
  const { formatPrice } = useCurrency();

  // Streamlined 3-step flow when service is pre-selected and not a group session
  // Full flow for complex bookings (no service pre-selected, or group sessions)
  const isSimplifiedFlow = Boolean(serviceId && state.service && !state.service.isGroupSession);

  const steps: BookingStep[] = isSimplifiedFlow
    ? [
        { id: 'datetime', title: t('booking.selectDateTime'), completed: false },
        ...(environment.PAYMENTS_ENABLED
          ? [{ id: 'payment', title: t('booking.detailsAndPayment') || 'Details & Payment', completed: false }]
          : [{ id: 'details', title: t('booking.bookingDetails'), completed: false }]),
        { id: 'confirmation', title: t('booking.confirmation'), completed: false },
      ]
    : [
        { id: 'service', title: t('booking.selectService'), completed: false },
        { id: 'datetime', title: t('booking.selectDateTime'), completed: false },
        { id: 'details', title: t('booking.bookingDetails'), completed: false },
        ...(environment.PAYMENTS_ENABLED ? [{ id: 'payment', title: t('booking.payment'), completed: false }] : []),
        { id: 'confirmation', title: t('booking.confirmation'), completed: false },
      ];

  // ─── Effects ───────────────────────────────────────────────────────────────

  // Save abandoned booking state to localStorage
  useEffect(() => {
    if (serviceId && state.service) {
      const abandonedBooking = {
        serviceId,
        specialistId: state.service?.specialistId || state.service?.specialist?.id,
        specialistName: state.specialist?.user?.firstName,
        serviceName: state.service?.name,
        timestamp: Date.now(),
      };
      localStorage.setItem('miyzapis_abandoned_booking', JSON.stringify(abandonedBooking));
    }
  }, [serviceId, state.service, state.specialist]);

  // Reset payment state when payment method changes
  useEffect(() => {
    logger.debug(`BookingFlow: Payment method changed to ${state.paymentMethod}, resetting payment state`);
    dispatch({ type: 'SET_PAYMENT_RESULT', payload: null });
    dispatch({ type: 'SET_SHOW_QR_CODE', payload: false });
    dispatch({ type: 'SET_PAYMENT_TIME_REMAINING', payload: 0 });
    if (state.paymentTimeoutId) {
      clearTimeout(state.paymentTimeoutId);
      dispatch({ type: 'SET_PAYMENT_TIMEOUT_ID', payload: null });
    }
    if (state.pollingIntervalId) {
      clearInterval(state.pollingIntervalId);
      dispatch({ type: 'SET_POLLING_INTERVAL_ID', payload: null });
    }
  }, [state.paymentMethod]);

  // Cleanup timeouts and socket listeners on component unmount
  useEffect(() => {
    return () => {
      if (state.paymentTimeoutId) {
        clearTimeout(state.paymentTimeoutId);
      }
      if (state.pollingIntervalId) {
        clearInterval(state.pollingIntervalId);
      }
      (socketService as any).off('payment:completed');
      (socketService as any).off('notification:new');
    };
  }, [state.paymentTimeoutId, state.pollingIntervalId]);

  // Fetch booking data (specialist + service)
  useEffect(() => {
    const fetchBookingData = async () => {
      if (!serviceId && !specialistId) return;

      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        if (serviceId) {
          try {
            logger.debug('BookingFlow: Fetching service with ID:', serviceId);
            const serviceData = await serviceService.getService(serviceId);
            logger.debug('BookingFlow: Service fetched successfully:', serviceData);
            dispatch({ type: 'SET_SERVICE', payload: serviceData });

            const currentSpecialistId = serviceData.specialistId || serviceData.specialist?.id;
            if (currentSpecialistId) {
              logger.debug('BookingFlow: Fetching specialist with ID:', currentSpecialistId);
              const specialistData = await specialistService.getPublicProfile(currentSpecialistId);
              logger.debug('BookingFlow: Specialist fetched successfully:', specialistData);
              dispatch({ type: 'SET_SPECIALIST', payload: specialistData });
            } else if (serviceData.specialist) {
              logger.debug('BookingFlow: Using embedded specialist data:', serviceData.specialist);
              dispatch({ type: 'SET_SPECIALIST', payload: serviceData.specialist });
            } else {
              logger.warn('BookingFlow: Service has no specialistId or specialist data:', serviceData);
            }
          } catch (error) {
            logger.warn('Service not found by ID, trying specialist approach:', error);
            if (specialistId) {
              const specialistData = await specialistService.getPublicProfile(specialistId);
              dispatch({ type: 'SET_SPECIALIST', payload: specialistData });

              const services = await specialistService.getSpecialistServices(specialistId);
              if (services.length > 0) {
                const foundService = services.find(s => s.id === serviceId) || services[0];
                dispatch({ type: 'SET_SERVICE', payload: foundService });
              }
            }
          }
        } else if (specialistId) {
          const specialistData = await specialistService.getPublicProfile(specialistId);
          dispatch({ type: 'SET_SPECIALIST', payload: specialistData });

          const services = await specialistService.getSpecialistServices(specialistId);
          if (services.length > 0) {
            dispatch({ type: 'SET_SERVICE', payload: services[0] });
          }
        }
      } catch (error) {
        logger.error('Error fetching booking data:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchBookingData();
  }, [specialistId, serviceId]);

  // Fetch loyalty data
  useEffect(() => {
    const fetchLoyaltyData = async () => {
      if (!user || !state.service) return;

      try {
        const loyalty = await loyaltyService.getUserLoyalty().catch(() => null);
        dispatch({ type: 'SET_LOYALTY_DATA', payload: loyalty });

        const servicePrice = state.service.price || state.service.basePrice || 0;
        const earnedPoints = Math.floor(servicePrice * 0.01);
        dispatch({ type: 'SET_POINTS_TO_EARN', payload: earnedPoints });
      } catch (error) {
        logger.error('Error fetching loyalty data:', error);
      }
    };

    fetchLoyaltyData();
  }, [user, state.service]);

  // Fetch user's approved redemptions
  useEffect(() => {
    const fetchRedemptions = async () => {
      if (!state.service) return;
      try {
        const items = await RewardsService.getUserRedemptions();
        const currentSpecialistId = state.service?.specialistId || state.service?.specialist?.id;
        const approved = items.filter(r => r.status === 'APPROVED');
        const applicable = approved.filter(r => {
          if (currentSpecialistId && r.reward.specialistId !== currentSpecialistId) return false;
          if (r.reward.serviceIds) {
            try {
              const allowed = JSON.parse(r.reward.serviceIds as any);
              if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(state.service.id)) return false;
            } catch (_) {
              // Ignore malformed serviceIds JSON
            }
          }
          if (r.expiresAt && new Date(r.expiresAt) < new Date()) return false;
          return true;
        });
        dispatch({ type: 'SET_REDEMPTIONS', payload: applicable });
      } catch (e) {
        // non-fatal
      }
    };
    fetchRedemptions();
  }, [state.service]);

  // Fetch available dates
  useEffect(() => {
    const fetchAvailableDates = async () => {
      const currentSpecialistId = getSpecialistId();
      if (!currentSpecialistId) {
        logger.debug('BookingFlow: Cannot fetch dates - specialistId not found');
        return;
      }

      dispatch({ type: 'SET_DATES_LOADING', payload: true });
      try {
        logger.debug('BookingFlow: Fetching available dates for specialist:', currentSpecialistId);
        const dateData = await specialistService.getAvailableDates(currentSpecialistId);
        logger.debug('BookingFlow: Available dates received:', dateData.availableDates);
        const dates = dateData.availableDates || [];
        dispatch({ type: 'SET_AVAILABLE_DATES', payload: dates });

        if (!state.selectedDate && dates.length > 0) {
          const firstDate = new Date(dates[0].date);
          logger.debug('BookingFlow: Auto-selecting first available date:', firstDate);
          dispatch({ type: 'SET_SELECTED_DATE', payload: firstDate });
        }
      } catch (error) {
        logger.error('BookingFlow: Error fetching available dates:', error);
        dispatch({ type: 'SET_AVAILABLE_DATES', payload: [] });
      } finally {
        dispatch({ type: 'SET_DATES_LOADING', payload: false });
      }
    };

    fetchAvailableDates();

    const sid = getSpecialistId();
    if (sid && socketService.isSocketConnected()) {
      try {
        socketService.subscribeToAvailability(sid);
      } catch (error) {
        logger.warn('Failed to subscribe to availability updates:', error);
      }
    }
    const onAvail = (data: unknown) => {
      const sidData = (data as any)?.specialistId || (data as any)?.id;
      if (!sid || sidData !== sid) return;
      try {
        if (state.selectedDate) {
          refreshSlots();
        }
      } catch (err) {
        logger.warn('BookingFlow: Error refreshing slots on availability update:', err);
      }
    };
    socketService.on('availability:updated', onAvail as any);
    return () => {
      socketService.off('availability:updated', onAvail as any);
      if (sid && socketService.isSocketConnected()) {
        try {
          socketService.unsubscribeFromAvailability(sid);
        } catch (error) {
          logger.warn('Failed to unsubscribe from availability updates:', error);
        }
      }
    };
  }, [state.specialist, state.service, specialistId]);

  // Fetch available time slots when date is selected
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      const currentSpecialistId = getSpecialistId();

      if (!currentSpecialistId || !state.selectedDate) {
        logger.debug('BookingFlow: Cannot fetch slots - specialistId:', currentSpecialistId, 'selectedDate:', state.selectedDate);
        dispatch({ type: 'SET_SLOTS_LOADING', payload: false });
        return;
      }

      dispatch({ type: 'SET_SLOTS_LOADING', payload: true });
      try {
        const dateStr = state.selectedDate.toISOString().split('T')[0];
        const slots = await specialistService.getAvailableSlots(currentSpecialistId, dateStr);

        const serviceDuration = state.service?.duration || 60;
        const filteredSlots = filterSlotsByDuration(slots || [], serviceDuration);
        logger.debug('BookingFlow: Filtered slots for duration', serviceDuration, 'minutes:', filteredSlots);

        dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: filteredSlots });
      } catch (error) {
        logger.error('BookingFlow: Error fetching available slots:', error);
        dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: [] });
        toast.error(t('booking.loadSlotsError') || 'Unable to load available time slots. Please try again.');
      } finally {
        dispatch({ type: 'SET_SLOTS_LOADING', payload: false });
      }
    };

    fetchAvailableSlots();

    const refreshInterval = setInterval(() => {
      if (state.currentStep === 1 && state.selectedDate) {
        logger.debug('BookingFlow: Auto-refreshing available slots...');
        fetchAvailableSlots();
      }
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [state.specialist, state.service, specialistId, state.selectedDate, state.currentStep]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const refreshSlots = async () => {
    try {
      const currentSpecialistId = getSpecialistId();
      if (!currentSpecialistId || !state.selectedDate) return;
      const dateStr = state.selectedDate.toISOString().split('T')[0];
      const slots = await specialistService.getAvailableSlots(currentSpecialistId, dateStr);

      const serviceDuration = state.service?.duration || 60;
      const filteredSlots = filterSlotsByDuration(slots || [], serviceDuration);
      dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: filteredSlots });
    } catch (e) {
      logger.warn('BookingFlow: Error refreshing time slots:', e);
    }
  };

  const handlePaymentTimeout = async () => {
    logger.debug('BookingFlow: Payment timeout reached');

    try {
      if (state.paymentTimeoutId) {
        clearTimeout(state.paymentTimeoutId);
        dispatch({ type: 'SET_PAYMENT_TIMEOUT_ID', payload: null });
      }

      dispatch({ type: 'SET_PAYMENT_TIME_REMAINING', payload: 0 });
      toast.error(t('booking.paymentExpired') || 'Payment time expired. Your booking slot has been released. Please start over.');
      dispatch({ type: 'SET_PAYMENT_RESULT', payload: null });
      dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
      dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
      await refreshSlots();
    } catch (error) {
      logger.error('BookingFlow: Error handling payment timeout:', error);
    }
  };

  // If this booking was initiated from a waitlist "Book Now", silently mark the entry BOOKED.
  // bookingId must be the ID of the booking that was just created.
  const claimWaitlistIfNeeded = async (bookingId: string) => {
    if (!waitlistIdFromParam) return;
    try {
      await waitlistService.bookWaitlistSlot(waitlistIdFromParam, { bookingId });
    } catch (err) {
      // Non-critical: booking already created; don't block the user
      logger.warn('BookingFlow: Failed to mark waitlist entry BOOKED', err);
    }
  };

  const handleNextStep = async () => {
    // Auth gate: block advancement to the booking-creation step for unauthenticated users.
    // The next step after 'details' (payments disabled) or 'payment' (payments enabled)
    // is 'confirmation', which triggers createBooking(). Intercept here instead of
    // letting the API call fail with a 401.
    if (!isAuthenticated) {
      const nextStepId = steps[state.currentStep + 1]?.id;
      const isAboutToCreateBooking =
        (!environment.PAYMENTS_ENABLED && steps[state.currentStep]?.id === 'details' && nextStepId === 'confirmation') ||
        (environment.PAYMENTS_ENABLED && steps[state.currentStep]?.id === 'payment');
      if (isAboutToCreateBooking) {
        setShowGuestCheckout(true);
        return;
      }
    }

    if (environment.PAYMENTS_ENABLED && steps[state.currentStep]?.id === 'payment' && state.paymentMethod !== 'pay_at_venue') {
      if (!state.paymentResult || (state.paymentResult.requiresPayment && state.paymentResult.status !== 'COMPLETED')) {
        toast.error(t('booking.completePaymentFirst') || 'Please complete payment before proceeding to confirmation.');
        return;
      }
    }

    if (!environment.PAYMENTS_ENABLED && steps[state.currentStep]?.id === 'details' && steps[state.currentStep + 1]?.id === 'confirmation') {
      if (bookingInProgressRef.current) {
        logger.warn('BookingFlow: Booking already in progress, ignoring duplicate submission');
        return;
      }

      try {
        bookingInProgressRef.current = true;
        dispatch({ type: 'SET_PAYMENT_LOADING', payload: true });
        const [hours, minutes] = state.selectedTime!.split(':').map(Number);
        const scheduledAt = new Date(state.selectedDate!);
        scheduledAt.setHours(hours, minutes, 0, 0);

        const bookingData = {
          serviceId: state.service.id,
          scheduledAt: scheduledAt.toISOString(),
          duration: state.service.duration || 60,
          customerNotes: state.bookingNotes || undefined,
          participantCount: state.participantCount,
          loyaltyPointsUsed: 0,
          rewardRedemptionId: state.selectedRedemptionId || undefined,
          source: bookingSource, // marketplace acquisition attribution
        };

        logger.debug('BookingFlow: Creating free booking (payments disabled)', bookingData);

        let result: Record<string, unknown>;
        if (state.isRecurring && state.recurrenceData) {
          logger.debug('BookingFlow: Creating recurring booking series', state.recurrenceData);
          const recurringResult = await bookingService.createRecurringBooking({
            ...(bookingData as any),
            recurrence: {
              frequency: state.recurrenceData.frequency,
              daysOfWeek: state.recurrenceData.daysOfWeek,
              endType: state.recurrenceData.endType,
              occurrences: state.recurrenceData.occurrences,
              endDate: state.recurrenceData.endDate,
            },
          });
          result = {
            booking: recurringResult.parentBooking,
            childrenCount: recurringResult.childrenCount,
            message: recurringResult.message,
          };
        } else {
          result = await bookingService.createBooking(bookingData as any);
        }
        logger.debug('BookingFlow: Booking created successfully:', result);

        // Mark waitlist entry BOOKED if this booking came from a waitlist notification
        const _bookingId1 = (result as any).booking?.id || (result as any).id;
        if (_bookingId1) await claimWaitlistIfNeeded(_bookingId1);

        dispatch({ type: 'SET_BOOKING_RESULT', payload: result });
        localStorage.removeItem('miyzapis_abandoned_booking');
        toast.success(state.isRecurring && state.recurrenceData
          ? `${t('booking.recurringCreated') || 'Recurring booking created!'} ${(result as any).childrenCount || 0} ${t('booking.additionalScheduled') || 'additional bookings scheduled.'}`
          : (t('booking.manualBookingMessage') || 'Booking created successfully!'));
        fireSuccessConfetti();
        bookingInProgressRef.current = false;
        dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
        dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
      } catch (error: unknown) {
        logger.error('BookingFlow: Error creating booking:', error);
        const _err1 = error as any;

        if (_err1?.response?.status === 409 && state.bookingResult) {
          logger.debug('BookingFlow: Ignoring 409 error - booking already succeeded');
          bookingInProgressRef.current = false;
          dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
          dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
          return;
        }

        toast.error(_err1?.message || t('booking.createFailed') || 'Failed to create booking');
        bookingInProgressRef.current = false;
        dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
        return;
      }
      return;
    }

    if (state.currentStep < steps.length - 1) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep + 1 });
    }
  };

  const handlePrevStep = () => {
    if (state.currentStep > 0) {
      dispatch({ type: 'SET_CURRENT_STEP', payload: state.currentStep - 1 });
    }
  };

  const handleApplyGiftCard = async () => {
    if (!state.giftCardCode.trim() || !state.bookingResult?.id) return;

    dispatch({ type: 'SET_GIFT_CARD_LOADING', payload: true });
    dispatch({ type: 'SET_GIFT_CARD_ERROR', payload: '' });

    try {
      const result = await paymentService.applyGiftCardToBooking(
        state.bookingResult.id,
        state.giftCardCode.trim()
      );
      dispatch({ type: 'SET_GIFT_CARD_APPLIED', payload: true });
      dispatch({ type: 'SET_GIFT_CARD_APPLIED_AMOUNT', payload: result.appliedAmount });
      dispatch({ type: 'SET_GIFT_CARD_REMAINING_BALANCE', payload: result.remainingCardBalance });
    } catch (error) {
      dispatch({
        type: 'SET_GIFT_CARD_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to apply gift card',
      });
    } finally {
      dispatch({ type: 'SET_GIFT_CARD_LOADING', payload: false });
    }
  };

  const handleRemoveGiftCard = () => {
    dispatch({ type: 'SET_GIFT_CARD_CODE', payload: '' });
    dispatch({ type: 'SET_GIFT_CARD_APPLIED', payload: false });
    dispatch({ type: 'SET_GIFT_CARD_APPLIED_AMOUNT', payload: 0 });
    dispatch({ type: 'SET_GIFT_CARD_REMAINING_BALANCE', payload: 0 });
    dispatch({ type: 'SET_GIFT_CARD_ERROR', payload: '' });
  };

  const handleBookingSubmit = async () => {
    // Auth gate: handleBookingSubmit is called from PaymentStep when payments are enabled.
    // A guest who reaches this path without a session must verify first.
    if (!isAuthenticated) {
      setShowGuestCheckout(true);
      return;
    }

    if (bookingInProgressRef.current) {
      logger.warn('BookingFlow: Booking already in progress, ignoring duplicate submission');
      return;
    }

    const currentSpecialistId = getSpecialistId();

    logger.debug('BookingFlow: Starting booking process...');
    logger.debug('BookingFlow: Booking data check:', {
      specialist: !!state.specialist,
      service: !!state.service,
      selectedDate: state.selectedDate,
      selectedTime: state.selectedTime,
      currentSpecialistId
    });

    if (!state.specialist || !state.service || !state.selectedDate || !state.selectedTime) {
      logger.error('BookingFlow: Missing required booking data');
      return;
    }

    try {
      bookingInProgressRef.current = true;
      dispatch({ type: 'SET_PAYMENT_LOADING', payload: true });

      logger.debug('BookingFlow: Checking slot availability...');
      const currentSlots = await specialistService.getAvailableSlots(currentSpecialistId, state.selectedDate as any);
      const serviceDuration = state.service.duration || 60;
      const filteredAvailableSlots = filterSlotsByDuration(currentSlots, serviceDuration);

      if (!filteredAvailableSlots.includes(state.selectedTime)) {
        throw new Error('SLOT_NO_LONGER_AVAILABLE');
      }
      logger.debug('BookingFlow: Slot still available, proceeding with payment...');

      dispatch({ type: 'SET_AVAILABLE_SLOTS', payload: state.availableSlots.filter(slot => slot !== state.selectedTime) });

      const [hours, minutes] = state.selectedTime.split(':').map(Number);
      const scheduledAt = new Date(state.selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      logger.debug('BookingFlow: Creating payment intent...');
      logger.debug('BookingFlow: Wallet-first enabled:', state.useWalletFirst);
      if ((user as any)?.walletBalance > 0) {
        logger.debug('BookingFlow: User wallet balance: $', (user as any).walletBalance);
      }

      // Pay at venue — create booking directly without payment
      if (state.paymentMethod === 'pay_at_venue') {
        const [hours, minutes] = state.selectedTime.split(':').map(Number);
        const scheduledAtVenue = new Date(state.selectedDate);
        scheduledAtVenue.setHours(hours, minutes, 0, 0);

        const bookingData = {
          serviceId: state.service.id,
          scheduledAt: scheduledAtVenue.toISOString(),
          duration: state.service.duration || 60,
          customerNotes: state.bookingNotes || undefined,
          participantCount: state.participantCount,
          loyaltyPointsUsed: 0,
          rewardRedemptionId: state.selectedRedemptionId || undefined,
          paymentMethod: 'PAY_AT_VENUE',
          source: bookingSource, // marketplace acquisition attribution
        };

        logger.debug('BookingFlow: Creating pay-at-venue booking', bookingData);

        let result: Record<string, unknown>;
        if (state.isRecurring && state.recurrenceData) {
          const recurringResult = await bookingService.createRecurringBooking({
            ...(bookingData as any),
            recurrence: {
              frequency: state.recurrenceData.frequency,
              daysOfWeek: state.recurrenceData.daysOfWeek,
              endType: state.recurrenceData.endType,
              occurrences: state.recurrenceData.occurrences,
              endDate: state.recurrenceData.endDate,
            },
          });
          result = {
            booking: recurringResult.parentBooking,
            childrenCount: recurringResult.childrenCount,
            message: recurringResult.message,
          };
        } else {
          result = await bookingService.createBooking(bookingData as any);
        }

        // Mark waitlist entry BOOKED if this booking came from a waitlist notification
        const _bookingId2 = (result as any).booking?.id || (result as any).id;
        if (_bookingId2) await claimWaitlistIfNeeded(_bookingId2);

        dispatch({ type: 'SET_BOOKING_RESULT', payload: result });
        localStorage.removeItem('miyzapis_abandoned_booking');
        toast.success(t('booking.bookingConfirmedPayAtVenue') || 'Booking confirmed! Pay at the venue.');
        fireSuccessConfetti();
        bookingInProgressRef.current = false;
        dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
        dispatch({ type: 'SET_CURRENT_STEP', payload: steps.length - 1 });
        return;
      }

      const paymentData = {
        serviceId: state.service.id,
        specialistId: currentSpecialistId,
        scheduledAt: scheduledAt.toISOString(),
        duration: state.service.duration || 60,
        customerNotes: state.bookingNotes || undefined,
        loyaltyPointsUsed: 0,
        useWalletFirst: state.useWalletFirst,
        amount: finalPrice,
        currency: state.service.currency || 'USD',
        serviceName: state.service.name,
        specialistName: state.specialist.user?.firstName && state.specialist.user?.lastName
          ? `${state.specialist.user.firstName} ${state.specialist.user.lastName}`
          : state.specialist.businessName || 'Specialist',
        ...(state.service.isGroupSession ? { participantCount: state.participantCount } : {})
      };

      let depositResult;
      if (state.paymentMethod === 'paypal') {
        logger.debug('BookingFlow: Creating PayPal order...');

        const paypalOrderData = {
          bookingId: `booking-${Date.now()}`,
          amount: finalPrice,
          currency: 'USD',
          description: `${state.service.name} - ${paymentData.specialistName}`,
          bookingData: {
            serviceId: state.service.id,
            specialistId: currentSpecialistId,
            scheduledAt: scheduledAt.toISOString(),
            duration: state.service.duration || 60,
            customerNotes: state.bookingNotes || undefined,
            serviceName: state.service.name,
            specialistName: paymentData.specialistName,
            servicePrice: state.service.price,
            serviceCurrency: state.service.currency || 'USD',
            loyaltyPointsUsed: 0,
            rewardRedemptionId: state.selectedRedemptionId || undefined,
            source: bookingSource, // marketplace acquisition attribution
          }
        };

        const paypalResult = await paymentService.createPayPalOrder(paypalOrderData as any);
        logger.debug('BookingFlow: PayPal order created:', paypalResult);

        if (paypalResult.approvalUrl) {
          window.open(paypalResult.approvalUrl, '_blank');

          dispatch({ type: 'SET_CURRENT_STEP', payload: steps.length - 1 });
          dispatch({
            type: 'SET_BOOKING_RESULT',
            payload: {
              status: 'PENDING_PAYMENT',
              paymentMethod: 'paypal',
              service: state.service,
              specialist: state.specialist,
              scheduledAt: scheduledAt.toISOString(),
              message: 'Payment link opened. Complete payment to confirm your booking.'
            }
          });

          dispatch({
            type: 'SET_PAYMENT_RESULT',
            payload: {
              paymentUrl: paypalResult.approvalUrl,
              finalAmount: finalPrice,
              status: 'pending',
              remainingAmount: finalPrice,
              paymentMethod: 'PAYPAL',
              message: 'Payment processing. You will receive an email confirmation once payment is verified.'
            }
          });

          dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
          return;
        } else {
          throw new Error('PayPal order created but no approval URL received');
        }
      } else {
        logger.debug('BookingFlow: Creating Coinbase Commerce charge...');
        depositResult = await paymentService.createCryptoPaymentIntent(paymentData as any);
        logger.debug('BookingFlow: Coinbase charge created:', depositResult);
      }

      dispatch({ type: 'SET_PAYMENT_RESULT', payload: depositResult });

      if ((depositResult as any).requiresPayment) {
        const timeoutDuration = 15 * 60 * 1000;
        dispatch({ type: 'SET_PAYMENT_TIME_REMAINING', payload: timeoutDuration });

        let remaining = timeoutDuration;
        const countdownTimer = setInterval(() => {
          remaining -= 1000;
          if (remaining <= 0) {
            clearInterval(countdownTimer);
            handlePaymentTimeout();
          } else {
            dispatch({ type: 'SET_PAYMENT_TIME_REMAINING', payload: remaining });
          }
        }, 1000);

        const timeoutId = setTimeout(() => {
          clearInterval(countdownTimer);
          handlePaymentTimeout();
        }, timeoutDuration);

        dispatch({ type: 'SET_PAYMENT_TIMEOUT_ID', payload: timeoutId });

        const handlePaymentCompleted = (paymentEventData: Record<string, unknown>) => {
          logger.debug('BookingFlow: Payment completed via socket:', paymentEventData);

          if (paymentEventData.paymentId === depositResult.paymentId) {
            clearTimeout(timeoutId);
            clearInterval(countdownTimer);
            dispatch({ type: 'SET_PAYMENT_TIMEOUT_ID', payload: null });
            dispatch({ type: 'SET_PAYMENT_TIME_REMAINING', payload: 0 });

            dispatch({
              type: 'SET_PAYMENT_RESULT',
              payload: {
                ...depositResult,
                status: 'COMPLETED',
                requiresPayment: false
              }
            });

            if (paymentEventData.bookingId) {
              bookingService.getBooking(paymentEventData.bookingId as string)
                .then(booking => {
                  logger.debug('BookingFlow: Booking created via webhook:', booking);
                  dispatch({ type: 'SET_BOOKING_RESULT', payload: booking });
                  localStorage.removeItem('miyzapis_abandoned_booking');
                  dispatch({ type: 'SET_CURRENT_STEP', payload: steps.length - 1 });
                  toast.success(t('booking.paymentConfirmed') || 'Payment completed! Your booking is confirmed.');
                  fireSuccessConfetti();
                })
                .catch(err => {
                  logger.error('BookingFlow: Error fetching booking after payment:', err);
                  toast.error(t('booking.paymentNoDetails') || 'Payment completed but booking details unavailable. Check your bookings page.');
                });
            } else {
              dispatch({ type: 'SET_CURRENT_STEP', payload: steps.length - 1 });
              toast.success(t('booking.paymentProcessing') || 'Payment completed! Your booking is being processed.');
            }

            cleanupSocketListeners();
            if (state.pollingIntervalId) {
              clearInterval(state.pollingIntervalId);
              dispatch({ type: 'SET_POLLING_INTERVAL_ID', payload: null });
            }
          }
        };

        const handleNotificationReceived = (notificationData: Record<string, unknown>) => {
          logger.debug('BookingFlow: Notification received via socket:', notificationData);
          if (notificationData.type === 'PAYMENT_COMPLETED' && notificationData.data) {
            handlePaymentCompleted(notificationData.data as Record<string, unknown>);
          }
        };

        logger.debug('BookingFlow: Setting up enhanced payment subscription for payment:', depositResult.paymentId);
        const unsubscribePayment = subscribeToPaymentUpdates(depositResult.paymentId!, handlePaymentCompleted);
        socketService.on('notification:new', handleNotificationReceived);

        const cleanupSocketListeners = () => {
          unsubscribePayment();
          socketService.off('notification:new', handleNotificationReceived);
        };

        const pollPaymentStatus = async () => {
          try {
            logger.debug('BookingFlow: Polling payment status for:', depositResult.paymentId);
            const paymentStatus = await paymentService.getPaymentStatus(depositResult.paymentId!);

            if (paymentStatus.status === 'PAID' || paymentStatus.status === 'COMPLETED') {
              logger.debug('BookingFlow: Payment confirmed via polling:', paymentStatus);
              handlePaymentCompleted({
                paymentId: depositResult.paymentId,
                bookingId: paymentStatus.bookingId,
                status: 'PAID',
                amount: paymentStatus.amount,
                currency: paymentStatus.currency,
                type: 'DEPOSIT',
                confirmedAt: new Date(),
              });
              return true;
            }
          } catch (error) {
            logger.warn('BookingFlow: Error polling payment status:', error);
          }
          return false;
        };

        const pollingInterval = setInterval(async () => {
          const completed = await pollPaymentStatus();
          if (completed) {
            clearInterval(pollingInterval);
            dispatch({ type: 'SET_POLLING_INTERVAL_ID', payload: null });
          }
        }, 10000);

        dispatch({ type: 'SET_POLLING_INTERVAL_ID', payload: pollingInterval });
      }

      if (depositResult.status === 'COMPLETED') {
        logger.debug('BookingFlow: Payment completed with wallet, creating booking...');
        const bookingPaymentData = {
          serviceId: state.service.id,
          scheduledAt: scheduledAt.toISOString(),
          duration: state.service.duration || 60,
          customerNotes: state.bookingNotes || undefined,
          loyaltyPointsUsed: 0,
          rewardRedemptionId: state.selectedRedemptionId,
          source: bookingSource, // marketplace acquisition attribution
        };

        const bookingResult = await bookingService.createBookingWithPayment({
          ...(bookingPaymentData as any),
          paymentId: depositResult.paymentId!
        });
        logger.debug('BookingFlow: Booking created after wallet payment:', bookingResult);
        // Mark waitlist entry BOOKED if this booking came from a waitlist notification
        const _bookingId3 = (bookingResult as any).booking?.id || (bookingResult as any).id;
        if (_bookingId3) await claimWaitlistIfNeeded(_bookingId3);
        dispatch({ type: 'SET_BOOKING_RESULT', payload: bookingResult });
        localStorage.removeItem('miyzapis_abandoned_booking');
        fireSuccessConfetti();
        dispatch({ type: 'SET_CURRENT_STEP', payload: steps.length - 1 });
      } else {
        logger.debug('BookingFlow: External payment required, navigating to payment step');
        dispatch({ type: 'SET_CURRENT_STEP', payload: steps.length - 1 });
      }

      return depositResult;
    } catch (error: unknown) {
      logger.error('BookingFlow: Error in booking/payment flow:', error);
      const _err = error as any;
      const code = _err?.apiError?.code;
      const status = _err?.response?.status || _err?.apiError?.status;

      logger.debug('BookingFlow: Refreshing slots after error');
      await refreshSlots();

      if (_err?.message === 'SLOT_NO_LONGER_AVAILABLE') {
        toast.warning(t('booking.slotConflict') || 'This time slot was just booked by someone else. Please choose another.');
        dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
        dispatch({ type: 'SET_CONFLICT_HINT', payload: { active: true, lastTried: state.selectedTime } });
      } else if (code === 'BOOKING_CONFLICT' || status === 409 || _err?.message?.includes('time slot')) {
        if (!state.bookingResult) {
          toast.warning(t('booking.slotConflict') || 'This time slot was just booked by someone else. Please choose another.');
          dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
          dispatch({ type: 'SET_CONFLICT_HINT', payload: { active: true, lastTried: state.selectedTime } });
        } else {
          logger.debug('BookingFlow: Ignoring 409 error - booking already succeeded');
        }
      } else {
        toast.error(_err?.message || t('booking.createFailed') || 'Failed to process booking. Please try again.');
      }
    } finally {
      bookingInProgressRef.current = false;
      dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user || !state.service) return;

    const currentSpecialistId = getSpecialistId();
    if (!currentSpecialistId) return;

    // Use selected date if available; otherwise use tomorrow as a "notify me whenever" placeholder
    const preferredDate = state.selectedDate
      ? state.selectedDate.toISOString()
      : (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          return tomorrow.toISOString();
        })();

    dispatch({ type: 'SET_WAITLIST_LOADING', payload: true });
    try {
      await waitlistService.joinWaitlist({
        serviceId: state.service.id,
        specialistId: currentSpecialistId,
        preferredDate,
        preferredTime: state.waitlistPreferredTime || undefined,
        notes: state.waitlistNotes || undefined,
      });
      dispatch({ type: 'SET_WAITLIST_JOINED', payload: true });
      dispatch({ type: 'SET_SHOW_WAITLIST_MODAL', payload: false });
      dispatch({ type: 'SET_WAITLIST_NOTES', payload: '' });
      dispatch({ type: 'SET_WAITLIST_PREFERRED_TIME', payload: '' });
      toast.success(t('waitlist.joinedSuccess') || 'You have been added to the waitlist! We will notify you when a slot becomes available.');
    } catch (error: unknown) {
      const code = (error as any)?.apiError?.code || (error as any)?.response?.data?.error?.code;
      if (code === 'ALREADY_ON_WAITLIST') {
        dispatch({ type: 'SET_WAITLIST_JOINED', payload: true });
        dispatch({ type: 'SET_SHOW_WAITLIST_MODAL', payload: false });
      } else {
        toast.error(t('waitlist.joinFailed') || 'Failed to join waitlist. Please try again.');
      }
    } finally {
      dispatch({ type: 'SET_WAITLIST_LOADING', payload: false });
    }
  };

  // ─── Render Guards ─────────────────────────────────────────────────────────

  if (state.loading) {
    return <PageLoader />;
  }

  if (!state.specialist || !state.service) {
    logger.debug('BookingFlow: Missing data - specialist:', state.specialist, 'service:', state.service);
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

  const isOwnService = Boolean(
    user?.userType === 'specialist' &&
    user?.id &&
    (
      state.specialist?.user?.id === user.id ||
      state.service?.specialist?.user?.id === user.id
    )
  );

  if (user?.userType === 'specialist' && (state.specialist || state.service)) {
    logger.debug('BookingFlow: Specialist booking check:', {
      userId: user.id,
      specialistUserId: state.specialist?.user?.id,
      serviceSpecialistUserId: state.service?.specialist?.user?.id,
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
            className="bg-primary-600 text-white py-2 px-6 rounded-xl hover:bg-primary-700 transition-colors"
          >
            {t('navigation.goBack')}
          </button>
        </div>
      </div>
    );
  }

  // ─── Step Rendering ────────────────────────────────────────────────────────

  const renderStepContent = () => {
    const currentStepId = steps[state.currentStep]?.id;

    switch (currentStepId) {
      case 'service':
        return <ServiceSelect service={state.service} />;

      case 'datetime':
        return (
          <DateTimePicker
            availableDates={state.availableDates}
            datesLoading={state.datesLoading}
            selectedDate={state.selectedDate}
            onDateSelect={(date) => {
              dispatch({ type: 'SET_SELECTED_DATE', payload: date });
              dispatch({ type: 'SET_WAITLIST_JOINED', payload: false });
            }}
            selectedTime={state.selectedTime}
            onTimeSelect={(time) => dispatch({ type: 'SET_SELECTED_TIME', payload: time })}
            availableSlots={state.availableSlots}
            slotsLoading={state.slotsLoading}
            service={state.service}
            conflictHint={state.conflictHint}
            onConflictHintDismiss={() => {
              dispatch({ type: 'SET_CONFLICT_HINT', payload: { active: false } });
              toast.success(t('booking.timeUpdated') || 'Time updated -- review and proceed when ready');
            }}
            user={user as Record<string, unknown> | null}
            waitlistJoined={state.waitlistJoined}
            onShowWaitlist={() => dispatch({ type: 'SET_SHOW_WAITLIST_MODAL', payload: true })}
          />
        );

      case 'details':
        return (
          <BookingDetails
            service={state.service}
            specialist={state.specialist}
            selectedDate={state.selectedDate}
            selectedTime={state.selectedTime}
            bookingNotes={state.bookingNotes}
            onBookingNotesChange={(v) => dispatch({ type: 'SET_BOOKING_NOTES', payload: v })}
            participantCount={state.participantCount}
            onParticipantCountChange={(v) => dispatch({ type: 'SET_PARTICIPANT_COUNT', payload: v })}
            isRecurring={state.isRecurring}
            recurrenceData={state.recurrenceData}
            showRecurringModal={state.showRecurringModal}
            onToggleRecurring={() => {
              if (state.isRecurring) {
                dispatch({ type: 'SET_IS_RECURRING', payload: false });
                dispatch({ type: 'SET_RECURRENCE_DATA', payload: null });
              } else {
                dispatch({ type: 'SET_IS_RECURRING', payload: true });
                dispatch({ type: 'SET_SHOW_RECURRING_MODAL', payload: true });
              }
            }}
            onShowRecurringModal={() => dispatch({ type: 'SET_SHOW_RECURRING_MODAL', payload: true })}
            onCloseRecurringModal={() => {
              dispatch({ type: 'SET_SHOW_RECURRING_MODAL', payload: false });
              if (!state.recurrenceData) {
                dispatch({ type: 'SET_IS_RECURRING', payload: false });
              }
            }}
            onSaveRecurrence={(data: RecurrenceData) => {
              dispatch({ type: 'SET_RECURRENCE_DATA', payload: data });
              dispatch({ type: 'SET_IS_RECURRING', payload: true });
            }}
            redemptions={state.redemptions}
            selectedRedemptionId={state.selectedRedemptionId}
            onSelectedRedemptionIdChange={(v) => dispatch({ type: 'SET_SELECTED_REDEMPTION_ID', payload: v })}
            discount={discount}
            finalPrice={finalPrice}
            loyaltyData={state.loyaltyData}
            pointsToEarn={state.pointsToEarn}
          />
        );

      case 'payment':
        return (
          <PaymentStep
            service={state.service}
            specialist={state.specialist}
            selectedDate={state.selectedDate}
            selectedTime={state.selectedTime}
            paymentMethod={state.paymentMethod}
            onPaymentMethodChange={(m) => dispatch({ type: 'SET_PAYMENT_METHOD', payload: m })}
            useWalletFirst={state.useWalletFirst}
            onUseWalletFirstChange={(v) => dispatch({ type: 'SET_USE_WALLET_FIRST', payload: v })}
            giftCardCode={state.giftCardCode}
            onGiftCardCodeChange={(code) => dispatch({ type: 'SET_GIFT_CARD_CODE', payload: code })}
            giftCardLoading={state.giftCardLoading}
            giftCardApplied={state.giftCardApplied}
            giftCardAppliedAmount={state.giftCardAppliedAmount}
            giftCardRemainingBalance={state.giftCardRemainingBalance}
            giftCardError={state.giftCardError}
            onApplyGiftCard={handleApplyGiftCard}
            onRemoveGiftCard={handleRemoveGiftCard}
            paymentLoading={state.paymentLoading}
            paymentResult={state.paymentResult}
            paymentOptions={state.paymentOptions}
            showQRCode={state.showQRCode}
            onToggleQRCode={() => dispatch({ type: 'SET_SHOW_QR_CODE', payload: !state.showQRCode })}
            paymentTimeRemaining={state.paymentTimeRemaining}
            onBookingSubmit={handleBookingSubmit}
            stepsLength={steps.length}
            onSetCurrentStep={(s) => dispatch({ type: 'SET_CURRENT_STEP', payload: s })}
            onSetBookingResult={(r) => dispatch({ type: 'SET_BOOKING_RESULT', payload: r })}
            onSetPaymentResult={(r) => dispatch({ type: 'SET_PAYMENT_RESULT', payload: r })}
            redemptions={state.redemptions}
            selectedRedemptionId={state.selectedRedemptionId}
            onSelectedRedemptionIdChange={(v) => dispatch({ type: 'SET_SELECTED_REDEMPTION_ID', payload: v })}
            discount={discount}
            finalPrice={finalPrice}
            loyaltyData={state.loyaltyData}
            pointsToEarn={state.pointsToEarn}
            showInlineDetails={isSimplifiedFlow}
            bookingNotes={state.bookingNotes}
            onBookingNotesChange={(v) => dispatch({ type: 'SET_BOOKING_NOTES', payload: v })}
            isRecurring={state.isRecurring}
            recurrenceData={state.recurrenceData}
            onToggleRecurring={() => {
              if (state.isRecurring) {
                dispatch({ type: 'SET_IS_RECURRING', payload: false });
                dispatch({ type: 'SET_RECURRENCE_DATA', payload: null });
              } else {
                dispatch({ type: 'SET_IS_RECURRING', payload: true });
                dispatch({ type: 'SET_SHOW_RECURRING_MODAL', payload: true });
              }
            }}
            onShowRecurringModal={() => dispatch({ type: 'SET_SHOW_RECURRING_MODAL', payload: true })}
          />
        );

      case 'confirmation':
        return (
          <Confirmation
            service={state.service}
            specialist={state.specialist}
            selectedDate={state.selectedDate}
            selectedTime={state.selectedTime}
            bookingResult={state.bookingResult}
            paymentResult={state.paymentResult}
            showQRCode={state.showQRCode}
            onToggleQRCode={() => dispatch({ type: 'SET_SHOW_QR_CODE', payload: !state.showQRCode })}
            isRecurring={state.isRecurring}
            loyaltyData={state.loyaltyData}
            pointsToEarn={state.pointsToEarn}
            finalPrice={finalPrice}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            {t('navigation.back')}
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {t('booking.bookService')}
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mt-2 truncate">
            {state.specialist.user?.firstName} {state.specialist.user?.lastName} · {translateProfession(state.specialist.businessName, t)}
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:items-start">
          {/* LEFT: stepper + step content + nav */}
          <div className="min-w-0">
            <BookingProgress steps={steps} currentStep={state.currentStep} />

            {/* ── Auth gate — shown only to unauthenticated users ── */}
            {!isAuthenticated && (
              <div className="mb-4">
                {showGuestCheckout ? (
                  /* ── Guest OTP flow ── */
                  <GuestCheckout
                    onSuccess={() => {
                      setShowGuestCheckout(false);
                      // Redux + localStorage tokens are now set; isAuthenticated becomes true.
                      // The component will re-render authenticated and the booking can proceed.
                    }}
                    onSignIn={() => {
                      setShowGuestCheckout(false);
                      window.location.href = `/auth/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`;
                    }}
                  />
                ) : (
                  /* ── Sign-in banner with "Continue as guest" option ── */
                  <div className="rounded-2xl border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-primary-900 dark:text-primary-100 leading-snug">
                          {t('booking.signInToBook') || 'Sign in to book this appointment'}
                        </p>
                        <p className="text-sm text-primary-700 dark:text-primary-300 mt-0.5">
                          {t('booking.signInToBookDesc') || 'You need an account to complete your booking.'}
                        </p>
                      </div>
                      <a
                        href={`/auth/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`}
                        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition active:scale-[0.96]"
                      >
                        {t('auth.signIn') || 'Sign in'}
                      </a>
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-700">
                      <button
                        type="button"
                        onClick={() => setShowGuestCheckout(true)}
                        className="w-full min-h-[44px] text-center text-sm text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-primary-100 font-medium transition py-2.5 active:scale-[0.97]"
                      >
                        {t('guest.continueAsGuest') || 'Or continue as guest with email verification →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── FIX 2: Mobile-only price summary (lg:hidden) ── */}
            <div className="lg:hidden mb-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {/* Collapsed header — always visible */}
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {state.service?.name || '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="tabular-nums text-sm font-bold text-gray-900 dark:text-white">
                    {formatPrice(finalPrice, (state.service?.currency as 'USD' | 'EUR' | 'UAH') || 'UAH')}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${mobileSummaryOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expandable details */}
              {mobileSummaryOpen && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-3 space-y-3">
                  {/* Cancellation policy */}
                  {state.service?.cancellationWindowHours && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {(t('policy.freeCancellation') || 'Free cancellation up to {{hours}}h before.').replace('{{hours}}', String(state.service.cancellationWindowHours))}
                    </p>
                  )}

                  {/* Not charged yet */}
                  <p className="text-center text-xs text-gray-400 dark:text-gray-500">{t('booking.notChargedYet') || 'You won’t be charged yet'}</p>
                </div>
              )}
            </div>

            <div className="mb-4 sm:mb-6 md:mb-8 min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={steps[state.currentStep]?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </div>

            <NavigationButtons
              steps={steps}
              currentStep={state.currentStep}
              paymentLoading={state.paymentLoading}
              selectedDate={state.selectedDate}
              selectedTime={state.selectedTime}
              service={state.service}
              paymentResult={state.paymentResult}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
            />
          </div>

          {/* RIGHT: sticky booking summary (ProfiHub-style) */}
          <aside className="hidden lg:block">
            <div className="lg:sticky lg:top-24 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('booking.summary')}</h3>

              {/* Specialist */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                {state.specialist.user?.avatar ? (
                  <img src={getAbsoluteImageUrl(state.specialist.user.avatar)} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <span className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center font-semibold">
                    {(state.specialist.user?.firstName || 'M').charAt(0)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {state.specialist.user?.firstName} {state.specialist.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {translateProfession(state.specialist.businessName, t)}
                  </p>
                </div>
              </div>

              {/* Service */}
              <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{t('booking.service')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{state.service?.name || '—'}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                  {formatPrice(state.service?.price ?? state.service?.basePrice ?? 0, (state.service?.currency as 'USD' | 'EUR' | 'UAH') || 'UAH')}
                </p>
              </div>

              {/* Date & time */}
              <div className="py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{t('booking.dateTime')}</p>
                <p className={`text-sm font-medium ${state.selectedDate ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                  {state.selectedDate
                    ? `${new Date(state.selectedDate).toLocaleDateString()}${state.selectedTime ? `, ${state.selectedTime}` : ''}`
                    : t('booking.notSelected')}
                </p>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between py-4">
                <span className="font-semibold text-gray-900 dark:text-white">{t('booking.estimatedTotal')}</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatPrice(finalPrice, (state.service?.currency as 'USD' | 'EUR' | 'UAH') || 'UAH')}
                </span>
              </div>

              {/* Cancellation policy notice */}
              {state.service?.cancellationWindowHours && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                  {(t('policy.freeCancellation') || 'Free cancellation up to {{hours}}h before.').replace('{{hours}}', String(state.service.cancellationWindowHours))}
                </p>
              )}

              {/* Secure note */}
              <div className="flex gap-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                <ShieldCheckIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('booking.secureBooking')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{t('booking.secureBookingDesc')}</p>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">{t('booking.notChargedYet')}</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Waitlist Modal */}
      <WaitlistModal
        show={state.showWaitlistModal}
        onClose={() => dispatch({ type: 'SET_SHOW_WAITLIST_MODAL', payload: false })}
        onJoin={handleJoinWaitlist}
        selectedDate={state.selectedDate}
        service={state.service}
        waitlistPreferredTime={state.waitlistPreferredTime}
        onPreferredTimeChange={(v) => dispatch({ type: 'SET_WAITLIST_PREFERRED_TIME', payload: v })}
        waitlistNotes={state.waitlistNotes}
        onNotesChange={(v) => dispatch({ type: 'SET_WAITLIST_NOTES', payload: v })}
        waitlistLoading={state.waitlistLoading}
      />
    </div>
  );
};

export default BookingFlow;
