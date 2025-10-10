import React, { useState, useEffect } from 'react';
import { socketService, subscribeToPaymentUpdates, ensureSocketConnection } from '../../services/socket.service';
import { translateProfession } from '@/utils/profession';
import { toast } from 'react-toastify';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService, serviceService, bookingService } from '../../services';
import { paymentService } from '../../services/payment.service';
import { paypalService } from '../../services/paypal.service';
import { loyaltyService, UserLoyalty } from '@/services/loyalty.service';
import { RewardsService, type RewardRedemption, type LoyaltyReward } from '@/services/rewards.service';
import { filterSlotsByDuration, calculateEndTime } from '../../utils/timeSlotUtils';
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
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [selectedRedemptionId, setSelectedRedemptionId] = useState<string>('');

  // Payment states
  const [useWalletFirst, setUseWalletFirst] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'paypal' | 'wayforpay'>('crypto');
  const [paymentLoading, setPaymentLoading] = useState<boolean>(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const [paymentOptions, setPaymentOptions] = useState<any>(null);
  const [paymentTimeoutId, setPaymentTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [paymentTimeRemaining, setPaymentTimeRemaining] = useState<number>(0);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);


  // Reset payment state when payment method changes
  useEffect(() => {
    console.log(`🔄 BookingFlow: Payment method changed to ${paymentMethod}, resetting payment state`);
    setPaymentResult(null);
    setShowQRCode(false);
    setPaymentTimeRemaining(0);
    if (paymentTimeoutId) {
      clearTimeout(paymentTimeoutId);
      setPaymentTimeoutId(null);
    }
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  }, [paymentMethod]);

  // Cleanup timeouts and socket listeners on component unmount
  useEffect(() => {
    return () => {
      if (paymentTimeoutId) {
        clearTimeout(paymentTimeoutId);
      }
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      // Clean up any active socket listeners
      socketService.off('payment:completed');
      socketService.off('notification:new');
    };
  }, [paymentTimeoutId, pollingIntervalId]);

  // Calculate discount preview
  const calculateDiscount = () => {
    if (!selectedRedemptionId) return 0;

    const selectedRedemption = redemptions.find(r => r.id === selectedRedemptionId);
    if (!selectedRedemption || !service) return 0;

    const basePrice = (service?.price ?? service?.basePrice ?? 0);
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
  };

  const discount = calculateDiscount();
  const finalPrice = Math.max(0, ((service?.price ?? service?.basePrice ?? 0) - discount));

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

  // Fetch user's approved redemptions and filter for this specialist/service
  useEffect(() => {
    const fetchRedemptions = async () => {
      if (!service) return;
      try {
        const items = await RewardsService.getUserRedemptions();
        const currentSpecialistId = service?.specialistId || service?.specialist?.id;
        const approved = items.filter(r => r.status === 'APPROVED');
        const applicable = approved.filter(r => {
          // Specialist match
          if (currentSpecialistId && r.reward.specialistId !== currentSpecialistId) return false;

          // Service restriction
          if (r.reward.serviceIds) {
            try {
              const allowed = JSON.parse(r.reward.serviceIds as any);
              if (Array.isArray(allowed) && allowed.length > 0 && !allowed.includes(service.id)) return false;
            } catch (_) {}
          }

          // Not expired
          if (r.expiresAt && new Date(r.expiresAt) < new Date()) return false;
          return true;
        });
        setRedemptions(applicable);
      } catch (e) {
        // non-fatal
      }
    };
    fetchRedemptions();
  }, [service]);

  // Payment options removed - using direct Coinbase Commerce only

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
        const dates = dateData.availableDates || [];
        setAvailableDates(dates);

        // Auto-select the first available date if none is selected
        if (!selectedDate && dates.length > 0) {
          const firstDate = new Date(dates[0].date);
          console.log('📅 BookingFlow: Auto-selecting first available date:', firstDate);
          setSelectedDate(firstDate);

          // Show a subtle notification about auto-selection
          setTimeout(() => {
            toast.info(`Auto-selected ${firstDate.toLocaleDateString()} - earliest available date`);
          }, 1000);
        }
      } catch (error) {
        console.error('❌ BookingFlow: Error fetching available dates:', error);
        setAvailableDates([]);
      }
    };

    fetchAvailableDates();

    // Subscribe to availability updates (if backend emits)
    const sid = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;
    if (sid && socketService.isSocketConnected()) {
      try {
        socketService.subscribeToAvailability(sid);
      } catch (error) {
        console.warn('Failed to subscribe to availability updates:', error);
      }
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
      if (sid && socketService.isSocketConnected()) {
        try {
          socketService.unsubscribeFromAvailability(sid);
        } catch (error) {
          console.warn('Failed to unsubscribe from availability updates:', error);
        }
      }
    };
  }, [specialist, service, specialistId]);

  useEffect(() => {
    // Fetch available time slots when date is selected
    const fetchAvailableSlots = async () => {
      const currentSpecialistId = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;
      
      if (!currentSpecialistId || !selectedDate) {
        console.log('🔍 BookingFlow: Cannot fetch slots - specialistId:', currentSpecialistId, 'selectedDate:', selectedDate);
        setSlotsLoading(false);
        return;
      }

      setSlotsLoading(true);
      try {
        console.log('📅 BookingFlow: Fetching available slots for specialist:', currentSpecialistId, 'date:', selectedDate.toISOString().split('T')[0]);
        const dateStr = selectedDate.toISOString().split('T')[0];
        const slots = await specialistService.getAvailableSlots(currentSpecialistId, dateStr);
        console.log('✅ BookingFlow: Available slots received:', slots);

        // Filter slots based on service duration to ensure consecutive availability
        const serviceDuration = service?.duration || 60;
        const filteredSlots = filterSlotsByDuration(slots || [], serviceDuration);
        console.log('🔍 BookingFlow: Filtered slots for duration', serviceDuration, 'minutes:', filteredSlots);

        setAvailableSlots(filteredSlots);
      } catch (error) {
        console.error('❌ BookingFlow: Error fetching available slots:', error);
        // Don't show any slots if there's an error - better to show empty than incorrect availability
        setAvailableSlots([]);
        toast.error(t('booking.loadSlotsError') || 'Unable to load available time slots. Please try again.');
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [specialist, service, specialistId, selectedDate]);

  const handleNextStep = () => {
    // Security check: Prevent bypassing payment step
    if (currentStep === 3) {
      // Step 3 is payment - user cannot proceed without completing payment
      if (!paymentResult || (paymentResult.requiresPayment && paymentResult.status !== 'COMPLETED')) {
        toast.error('Please complete payment before proceeding to confirmation.');
        return;
      }
    }

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

      // Filter slots based on service duration
      const serviceDuration = service?.duration || 60;
      const filteredSlots = filterSlotsByDuration(slots || [], serviceDuration);
      setAvailableSlots(filteredSlots);
    } catch (e) {}
  };

  // Handle payment timeout
  const handlePaymentTimeout = async () => {
    console.log('⏰ BookingFlow: Payment timeout reached');

    try {
      // Clear any existing timeouts
      if (paymentTimeoutId) {
        clearTimeout(paymentTimeoutId);
        setPaymentTimeoutId(null);
      }

      setPaymentTimeRemaining(0);

      // Show timeout message
      toast.error('Payment time expired. Your booking slot has been released. Please start over.');

      // Reset payment states
      setPaymentResult(null);
      setPaymentLoading(false);

      // Go back to time selection to choose a new slot
      setCurrentStep(1);

      // Refresh available slots
      await refreshSlots();

    } catch (error) {
      console.error('❌ BookingFlow: Error handling payment timeout:', error);
    }
  };

  const handleBookingSubmit = async () => {
    const currentSpecialistId = specialist?.id || service?.specialistId || service?.specialist?.id || specialistId;

    console.log('📋 BookingFlow: Starting booking process...');
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
      setPaymentLoading(true);

      // Step 1: Check slot availability before starting payment process
      console.log('🕒 BookingFlow: Checking slot availability...');
      const currentSlots = await specialistService.getAvailableSlots(currentSpecialistId, selectedDate);
      const serviceDuration = service.duration || 60;
      const availableSlots = filterSlotsByDuration(currentSlots, serviceDuration);

      if (!availableSlots.includes(selectedTime)) {
        throw new Error('SLOT_NO_LONGER_AVAILABLE');
      }
      console.log('✅ BookingFlow: Slot still available, proceeding with payment...');

      // Combine date and time into scheduledAt DateTime
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      // Step 2: Start payment process (will check wallet first if useWalletFirst=true)
      console.log('💳 BookingFlow: Creating payment intent...');
      console.log('💰 BookingFlow: Wallet-first enabled:', useWalletFirst);
      if (user?.walletBalance > 0) {
        console.log('💰 BookingFlow: User wallet balance: $', user.walletBalance);
      }

      // Deposit amount is $1 = 100 cents (finalPrice is already in cents)
      const depositAmount = 100; // $1 deposit in cents

      const paymentData = {
        serviceId: service.id,
        specialistId: currentSpecialistId,
        scheduledAt: scheduledAt.toISOString(),
        duration: service.duration || 60,
        customerNotes: bookingNotes || undefined,
        loyaltyPointsUsed: 0,
        useWalletFirst,
        amount: depositAmount, // $1 deposit in cents
        currency: service.currency || 'USD',
        serviceName: service.name,
        specialistName: specialist.user?.firstName && specialist.user?.lastName
          ? `${specialist.user.firstName} ${specialist.user.lastName}`
          : specialist.businessName || 'Specialist'
      };

      let depositResult;
      if (paymentMethod === 'paypal') {
        // Handle PayPal payment
        console.log('💳 BookingFlow: Creating PayPal order...');

        // Deposit is always $1 USD (100 cents) regardless of service currency
        // PayPal doesn't support UAH, so always use USD for deposits
        const paypalOrderData = {
          bookingId: `booking-${Date.now()}`, // Temporary booking ID
          amount: depositAmount, // Always 100 cents = $1.00 USD
          currency: 'USD', // Always USD for deposits
          description: `${service.name} - ${paymentData.specialistName}`,
          bookingData: {
            serviceId: service.id,
            specialistId: currentSpecialistId,
            scheduledAt: scheduledAt.toISOString(),
            duration: service.duration || 60,
            customerNotes: bookingNotes || undefined,
            serviceName: service.name,
            specialistName: paymentData.specialistName,
            servicePrice: service.price,
            serviceCurrency: service.currency || 'USD'
          }
        };

        const paypalResult = await paymentService.createPayPalOrder(paypalOrderData);
        console.log('✅ BookingFlow: PayPal order created:', paypalResult);

        // For PayPal, open approval URL in new window or redirect
        if (paypalResult.approvalUrl) {
          // Open PayPal in new window
          window.open(paypalResult.approvalUrl, '_blank');

          // Immediately show payment pending confirmation
          setCurrentStep(4);
          setBookingResult({
            status: 'PENDING_PAYMENT',
            paymentMethod: 'paypal',
            service,
            specialist,
            scheduledAt: scheduledAt.toISOString(),
            message: 'Payment link opened. Complete payment to confirm your booking.'
          });

          setPaymentResult({
            paymentUrl: paypalResult.approvalUrl,
            finalAmount: depositAmount,
            status: 'pending',
            remainingAmount: depositAmount,
            paymentMethod: 'PAYPAL',
            message: 'Payment processing. You will receive an email confirmation once payment is verified.'
          });

          setPaymentLoading(false);
          // Return early - no need for timeout/socket logic since we're showing immediate confirmation
          return;
        } else {
          throw new Error('PayPal order created but no approval URL received');
        }
      } else if (paymentMethod === 'wayforpay') {
        // Handle WayForPay payment
        console.log('💳 BookingFlow: Creating WayForPay invoice...');
        // Convert USD cents to UAH kopecks (1 USD = 40 UAH, so 100 cents = 4000 kopecks)
        const wayforpayAmount = depositAmount * 40; // Convert $1 (100 cents) to 40 UAH (4000 kopecks)
        const wayforpayInvoiceData = {
          bookingId: `booking-${Date.now()}`, // Temporary booking ID
          amount: wayforpayAmount, // Amount in UAH kopecks
          currency: 'UAH',
          description: `${service.name} - ${paymentData.specialistName}`,
          customerEmail: user?.email || '', // Will be filled from user context if available
          customerPhone: user?.phone || '',
          bookingData: {
            serviceId: service.id,
            specialistId: currentSpecialistId,
            scheduledAt: scheduledAt.toISOString(),
            duration: service.duration || 60,
            customerNotes: bookingNotes || undefined,
            serviceName: service.name,
            specialistName: paymentData.specialistName,
            servicePrice: service.price,
            serviceCurrency: service.currency || 'USD'
          }
        };

        const wayforpayResult = await paymentService.createWayForPayInvoice(wayforpayInvoiceData);
        console.log('✅ BookingFlow: WayForPay invoice created:', wayforpayResult);

        // Store result for UI with proper structure
        depositResult = {
          paymentUrl: wayforpayResult.paymentUrl || wayforpayResult.invoice?.paymentUrl,
          finalAmount: depositAmount,
          status: 'PENDING',
          remainingAmount: depositAmount,
          paymentMethod: 'WAYFORPAY',
          wayforpayPayment: wayforpayResult.invoice, // Include invoice with formData
          message: 'Complete your WayForPay payment'
        };
      } else {
        // Handle crypto payment with Coinbase Commerce
        console.log('💳 BookingFlow: Creating Coinbase Commerce charge...');
        depositResult = await paymentService.createCryptoPaymentIntent(paymentData);
        console.log('✅ BookingFlow: Coinbase charge created:', depositResult);
      }

      // Store payment result for UI
      setPaymentResult(depositResult);

      // Start payment timeout for external payments (15 minutes)
      if (depositResult.requiresPayment) {
        const timeoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
        setPaymentTimeRemaining(timeoutDuration);

        // Start countdown timer
        const countdownInterval = setInterval(() => {
          setPaymentTimeRemaining(prev => {
            if (prev <= 1000) {
              clearInterval(countdownInterval);
              handlePaymentTimeout();
              return 0;
            }
            return prev - 1000;
          });
        }, 1000);

        // Set main timeout
        const timeoutId = setTimeout(() => {
          clearInterval(countdownInterval);
          handlePaymentTimeout();
        }, timeoutDuration);

        setPaymentTimeoutId(timeoutId);

        // Listen for payment completion via socket
        const handlePaymentCompleted = (paymentData: any) => {
          console.log('💳 BookingFlow: Payment completed via socket:', paymentData);

          if (paymentData.paymentId === depositResult.paymentId) {
            // Clear timeout using fresh timeoutId reference
            clearTimeout(timeoutId);
            clearInterval(countdownInterval);
            setPaymentTimeoutId(null);
            setPaymentTimeRemaining(0);

            // Update payment result
            setPaymentResult({
              ...depositResult,
              status: 'COMPLETED',
              requiresPayment: false
            });

            // Booking should be created by webhook, fetch the booking result
            if (paymentData.bookingId) {
              bookingService.getBooking(paymentData.bookingId)
                .then(booking => {
                  console.log('✅ BookingFlow: Booking created via webhook:', booking);
                  setBookingResult(booking);
                  // Navigate to confirmation
                  setCurrentStep(steps.length - 1);
                  toast.success('Payment completed! Your booking is confirmed.');
                })
                .catch(err => {
                  console.error('❌ BookingFlow: Error fetching booking after payment:', err);
                  toast.error('Payment completed but booking details unavailable. Check your bookings page.');
                });
            } else {
              // Navigate to confirmation even without booking details
              setCurrentStep(steps.length - 1);
              toast.success('Payment completed! Your booking is being processed.');
            }

            // Clean up listeners and polling using enhanced cleanup
            cleanupSocketListeners();
            if (pollingIntervalId) {
              clearInterval(pollingIntervalId);
              setPollingIntervalId(null);
            }
          }
        };

        // Also listen to notifications for payment completion (fallback)
        const handleNotificationReceived = (notificationData: any) => {
          console.log('💳 BookingFlow: Notification received via socket:', notificationData);

          // Check if this is a payment completion notification
          if (notificationData.type === 'PAYMENT_COMPLETED' && notificationData.data) {
            const paymentData = notificationData.data;
            handlePaymentCompleted(paymentData);
          }
        };

        // Enhanced WebSocket subscription with auto-reconnection
        console.log('💳 BookingFlow: Setting up enhanced payment subscription for payment:', depositResult.paymentId);
        const unsubscribePayment = subscribeToPaymentUpdates(depositResult.paymentId, handlePaymentCompleted);

        // Also listen to general notifications as fallback
        socketService.on('notification:new', handleNotificationReceived);

        // Store unsubscribe function for cleanup
        const cleanupSocketListeners = () => {
          unsubscribePayment();
          socketService.off('notification:new', handleNotificationReceived);
        };

        // Update existing cleanup to use the new function
        const originalHandlePaymentCompleted = handlePaymentCompleted;
        const enhancedHandlePaymentCompleted = (paymentData: any) => {
          originalHandlePaymentCompleted(paymentData);
          cleanupSocketListeners();
        };

        // Set up polling as fallback mechanism
        const pollPaymentStatus = async () => {
          try {
            console.log('🔍 BookingFlow: Polling payment status for:', depositResult.paymentId);
            const paymentStatus = await paymentService.getPaymentStatus(depositResult.paymentId);

            if (paymentStatus.status === 'PAID' || paymentStatus.status === 'COMPLETED') {
              console.log('✅ BookingFlow: Payment confirmed via polling:', paymentStatus);
              handlePaymentCompleted({
                paymentId: depositResult.paymentId,
                bookingId: paymentStatus.bookingId,
                status: 'PAID',
                amount: paymentStatus.amount,
                currency: paymentStatus.currency,
                type: 'DEPOSIT',
                confirmedAt: new Date(),
              });
              return true; // Stop polling
            }
          } catch (error) {
            console.warn('🔍 BookingFlow: Error polling payment status:', error);
          }
          return false; // Continue polling
        };

        // Start polling every 10 seconds as fallback
        const pollingInterval = setInterval(async () => {
          const completed = await pollPaymentStatus();
          if (completed) {
            clearInterval(pollingInterval);
            setPollingIntervalId(null);
          }
        }, 10000);

        setPollingIntervalId(pollingInterval);

        // Clear polling when component unmounts or payment times out
        const originalTimeoutHandler = () => {
          clearInterval(pollingInterval);
          setPollingIntervalId(null);
          handlePaymentTimeout();
        };

        // Update the timeout to clear polling - but handlePaymentCompleted already clears it
        // No need to recreate timeout since handlePaymentCompleted handles cleanup
      }

      // Step 3: Handle payment result
      if (depositResult.status === 'COMPLETED') {
        // Payment completed with wallet balance - create booking immediately
        console.log('💰 BookingFlow: Payment completed with wallet, creating booking...');
        const bookingData = {
          serviceId: service.id,
          scheduledAt: scheduledAt.toISOString(),
          duration: service.duration || 60,
          customerNotes: bookingNotes || undefined,
          loyaltyPointsUsed: 0,
          rewardRedemptionId: selectedRedemptionId
        };

        const bookingResult = await bookingService.createBookingWithPayment({
          ...bookingData,
          paymentId: depositResult.paymentId
        });
        console.log('✅ BookingFlow: Booking created after wallet payment:', bookingResult);
        setBookingResult(bookingResult);

        // Navigate to confirmation step
        setCurrentStep(steps.length - 1);
      } else {
        // Payment requires crypto/external payment - navigate to payment step to show payment interface
        console.log('⏳ BookingFlow: External payment required, navigating to payment step');
        console.log('💳 BookingFlow: Payment details:', {
          amount: depositResult.finalAmount,
          paymentUrl: depositResult.paymentUrl,
          qrCode: !!depositResult.qrCodeData,
          status: depositResult.status
        });

        // Navigate to payment step (step 3) to show payment interface
        setCurrentStep(3);
      }

      return depositResult;
    } catch (error: any) {
      console.error('❌ BookingFlow: Error in booking/payment flow:', error);
      const code = error?.apiError?.code;
      const status = error?.response?.status || error?.apiError?.status;

      if (error?.message === 'SLOT_NO_LONGER_AVAILABLE') {
        toast.warning(t('booking.slotConflict') || 'This time slot was just booked by someone else. Please choose another.');
        await refreshSlots();
        setCurrentStep(1); // Go back to time selection
        setConflictHint({ active: true, lastTried: selectedTime });
      } else if (code === 'BOOKING_CONFLICT' || status === 409 || error?.message?.includes('time slot')) {
        toast.warning(t('booking.slotConflict') || 'This time slot was just booked by someone else. Please choose another.');
        await refreshSlots();
        setCurrentStep(1); // Go back to time selection
        setConflictHint({ active: true, lastTried: selectedTime });
      } else {
        toast.error(error?.message || t('booking.createFailed') || 'Failed to process booking. Please try again.');
      }
    } finally {
      setPaymentLoading(false);
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
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                  {getDisplayDates().slice(0, 14).map(({ date, dateInfo }) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2 sm:p-3 text-xs sm:text-sm rounded-lg border transition-colors relative mobile-touch-target ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300 active:scale-95'
                      }`}
                      title={`${dateInfo.availableSlots} available slots (${dateInfo.workingHours})`}
                    >
                      <div className="text-center">
                        <div className="font-medium text-sm sm:text-base">{date.getDate()}</div>
                        <div className="text-xs opacity-75">
                          {date.toLocaleDateString(language || 'en', { weekday: 'short' })}
                        </div>
                        <div className="text-xs text-primary-600 font-medium mt-1">
                          {dateInfo.availableSlots} slots
                        </div>
                      </div>
                      {dateInfo.availableSlots === 1 && (
                        <span className="absolute -top-1 -right-1 text-[10px] px-1 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">1</span>
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
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                    {availableSlots.map((slot: any) => {
                      const time = typeof slot === 'string' ? slot : slot.time;
                      const count = typeof slot === 'string' ? undefined : slot.count;
                      const serviceDuration = service?.duration || 60;
                      const endTime = calculateEndTime(time, serviceDuration);

                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`relative px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg border transition-colors mobile-touch-target ${
                            selectedTime === time
                              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300 active:scale-95'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-medium">{time}</div>
                            {serviceDuration > 15 && (
                              <div className="text-xs opacity-75">to {endTime}</div>
                            )}
                          </div>
                          {count === 1 && (
                            <span className="absolute -top-1 -right-1 text-[10px] px-1 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">1</span>
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

            {/* Reward Selection */}
            {redemptions.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <GiftIcon className="w-6 h-6 mr-3 text-purple-600" />
                  {t('booking.applyReward') || 'Apply a Reward'}
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('booking.selectReward') || 'Choose a reward to apply'}
                    </label>
                    <select
                      value={selectedRedemptionId}
                      onChange={(e) => setSelectedRedemptionId(e.target.value)}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 ${
                        selectedRedemptionId ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700' : ''
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
                  </div>

                  {/* Show confirmation when reward is selected */}
                  {selectedRedemptionId && discount > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            {t('booking.rewardApplied') || 'Reward Applied!'}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {t('booking.youSave') || 'You save'} {formatPrice(discount, service.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  {/* Show discount breakdown if reward is selected */}
                  {discount > 0 && (
                    <>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('booking.originalPrice') || 'Original Price'}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatPrice(service.price || service.basePrice || 0, service.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-green-600 dark:text-green-400">{t('booking.discount') || 'Reward Discount'}</span>
                        <span className="text-sm text-green-600 dark:text-green-400">
                          -{formatPrice(discount, service.currency)}
                        </span>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-2 mb-2"></div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{t('booking.total')}</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(discount > 0 ? finalPrice : (service.price || service.basePrice || 0), service.currency)}
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
                    {formatPrice(discount > 0 ? finalPrice : (service.price || service.basePrice || 0), service.currency)}
                  </span>
                </div>

                {/* Show discount breakdown in order summary */}
                {discount > 0 && (
                  <div className="text-sm space-y-1 mb-3 pb-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>Original Price:</span>
                      <span>{formatPrice(service.price || service.basePrice || 0, service.currency)}</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Reward Discount:</span>
                      <span>-{formatPrice(discount, service.currency)}</span>
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
                    onChange={(e) => setSelectedRedemptionId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg ${
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
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
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
                            {t('booking.youSave') || 'You save'} {formatPrice(discount, service.currency)}
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
                  <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="crypto"
                      checked={paymentMethod === 'crypto'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'crypto' | 'paypal' | 'wayforpay')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
                  <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'crypto' | 'paypal' | 'wayforpay')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
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

                  {/* WayForPay Payment Option */}
                  <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="wayforpay"
                      checked={paymentMethod === 'wayforpay'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'crypto' | 'paypal' | 'wayforpay')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                          <CreditCardIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">WayForPay</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Ukrainian payment system with cards and banking</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Support for UAH and other local payment methods</div>
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
                    onChange={(e) => setUseWalletFirst(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Use my wallet balance first (if available)
                  </span>
                </label>
              </div>

              {/* Payment Information */}
              {paymentOptions && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 dark:text-blue-100 mb-2">Payment Information</div>
                    <div className="space-y-1 text-blue-800 dark:text-blue-200">
                      <div>Deposit Amount: ${paymentOptions.depositConfiguration.amountUSD} / ₴{paymentOptions.depositConfiguration.amountUAH}</div>
                      <div>Currency: {paymentOptions.depositConfiguration.currency}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show payment interface if payment result exists */}
              {paymentResult ? (
                <div className="space-y-4">
                  {/* Payment Section for all external payments */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                      💳 Complete Your {
                        paymentMethod === 'paypal' ? 'PayPal' :
                        paymentMethod === 'wayforpay' ? 'WayForPay' :
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
                          Amount: {formatPrice(paymentResult.finalAmount / 100 || 1, service.currency)}
                        </p>
                        <a
                          href={paymentResult.paymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            // Immediately show payment pending confirmation
                            setCurrentStep(4);
                            setBookingResult({
                              status: 'PENDING_PAYMENT',
                              paymentMethod: 'paypal',
                              service,
                              specialist,
                              scheduledAt: `${selectedDate?.toISOString().split('T')[0]}T${selectedTime}`,
                              message: 'Payment link opened. Complete payment to confirm your booking.'
                            });
                            setPaymentResult({
                              status: 'pending',
                              message: 'Payment processing. You will receive an email confirmation once payment is verified.'
                            });
                          }}
                          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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

                    {/* WayForPay Payment Interface */}
                    {paymentMethod === 'wayforpay' && paymentResult.paymentUrl && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Amount: {formatPrice(paymentResult.finalAmount / 100 || 1, service.currency)}
                        </p>
                        <form
                          id="wayforpayForm"
                          action={paymentResult.paymentUrl}
                          method="POST"
                          target="_blank"
                        >
                          {/* Add form fields from wayforpayPayment.formData if available */}
                          {paymentResult.wayforpayPayment?.formData && Object.entries(paymentResult.wayforpayPayment.formData).map(([key, value]: [string, any]) => {
                            if (Array.isArray(value)) {
                              return value.map((item: any, index: number) => (
                                <input
                                  key={`${key}-${index}`}
                                  type="hidden"
                                  name={`${key}[${index}]`}
                                  value={String(item)}
                                />
                              ));
                            }
                            return (
                              <input
                                key={key}
                                type="hidden"
                                name={key}
                                value={String(value)}
                              />
                            );
                          })}
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CreditCardIcon className="w-4 h-4 mr-2" />
                            Pay with WayForPay
                          </button>
                        </form>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Click to complete your payment securely on WayForPay.
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
                                Amount: {formatPrice(paymentResult.finalAmount / 100 || 1, service.currency)}
                              </p>
                              <a
                                href={paymentResult.paymentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  // Immediately show payment pending confirmation
                                  setCurrentStep(4);
                                  setBookingResult({
                                    status: 'PENDING_PAYMENT',
                                    paymentMethod: 'crypto',
                                    service,
                                    specialist,
                                    scheduledAt: `${selectedDate?.toISOString().split('T')[0]}T${selectedTime}`,
                                    message: 'Payment link opened. Complete payment to confirm your booking.'
                                  });
                                  setPaymentResult({
                                    status: 'pending',
                                    message: 'Payment processing. You will receive an email confirmation once payment is verified.'
                                  });
                                }}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                                onClick={() => setShowQRCode(!showQRCode)}
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
                                ⏱️ Time remaining: {Math.floor(paymentTimeRemaining / 60000)}:{String(Math.floor((paymentTimeRemaining % 60000) / 1000)).padStart(2, '0')}
                              </p>
                            )}
                            <p>📧 You'll receive confirmation once payment is verified.</p>
                            <p className="text-xs text-gray-400 mt-1">Your booking slot is temporarily reserved during payment.</p>
                          </div>
                        </>
                      )}
                  </div>

                  {/* Payment Complete Section */}
                  {!paymentResult.requiresPayment && paymentResult.status === 'COMPLETED' && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                        ✅ Payment Complete
                      </h4>
                      <p className="text-sm text-green-800 dark:text-green-200">
                        {paymentResult.message || 'Payment processed successfully with wallet balance'}
                      </p>
                      <button
                        onClick={() => setCurrentStep(steps.length - 1)}
                        className="mt-3 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        View Booking Details
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleBookingSubmit}
                  disabled={paymentLoading}
                  className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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

      case 4: // Confirmation
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

              {/* Payment Required Section */}
              {needsPayment && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                    💳 Payment Required
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
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        💰 Complete Fiat Payment
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Session expires: {new Date(paymentResult.onrampSession.expiresAt).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {paymentResult?.qrCodeData && (
                    <div className="mt-4">
                      <button
                        onClick={() => setShowQRCode(!showQRCode)}
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
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    ✅ Payment Complete
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    {paymentResult.message || 'Payment processed successfully'}
                  </p>
                </div>
              )}

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
                        New balance: {((loyaltyData?.currentPoints || 0) + pointsToEarn).toLocaleString()} points
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
              
              {isPending && !isPendingPayment && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t('booking.waitingForSpecialistConfirmation')}
                  </p>
                </div>
              )}

              {isPendingPayment && paymentResult?.message && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {paymentResult.message}
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
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between overflow-x-auto pb-2 px-1">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center min-w-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 ${
                    index <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-2 sm:ml-3 hidden sm:block">
                  <p
                    className={`text-xs sm:text-sm font-medium whitespace-nowrap ${
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
                    className={`w-4 sm:w-8 md:w-12 h-0.5 mx-1 sm:mx-2 md:mx-4 flex-shrink-0 ${
                      index < currentStep
                        ? 'bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          {/* Mobile step indicator */}
          <div className="sm:hidden mt-2 text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {currentStep < steps.length - 1 && (
          <div className="flex justify-between gap-3 sm:gap-4 pb-safe-bottom">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-3 sm:py-2 rounded-lg transition-colors flex-shrink-0 mobile-touch-target ${
                currentStep === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
              }`}
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="text-sm sm:text-base">{t('navigation.prev') || 'Prev'}</span>
            </button>

            <button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && (!selectedDate || !selectedTime)) ||
                (currentStep === 2 && !service) ||
                (currentStep === 3 && (!paymentResult || (paymentResult.requiresPayment && paymentResult.status !== 'COMPLETED')))
              }
              className="flex items-center px-3 sm:px-4 md:px-6 py-3 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex-shrink-0 mobile-touch-target active:scale-95"
            >
              <span className="text-sm sm:text-base">{t('navigation.next') || 'Next'}</span>
              <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingFlow;
