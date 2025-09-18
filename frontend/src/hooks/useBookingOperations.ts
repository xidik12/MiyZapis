import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppDispatch } from '../store';
import { cancelBooking, fetchBookings } from '../store/slices/bookingSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { Booking } from '../types';

export const useBookingOperations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRescheduleBooking = useCallback((bookingId: string) => {
    toast.info(t('booking.rescheduleAlert'));
  }, [t]);

  const handleCancelBooking = useCallback(async (bookingId: string) => {
    try {
      const result = await dispatch(cancelBooking({
        bookingId,
        reason: 'Customer requested cancellation'
      }));

      if (cancelBooking.fulfilled.match(result)) {
        toast.success(t('bookings.cancelledSuccessfully'));
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error(t('bookings.cancelFailed') || 'Failed to cancel booking. Please try again.');
    }
  }, [dispatch, t]);

  const handleBookAgain = useCallback(async (booking: Booking) => {
    const serviceName = booking.service?.name || booking.serviceName || 'this service';
    const specialistName = booking.specialist?.firstName && booking.specialist?.lastName
      ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
      : booking.specialistName || 'the specialist';

    const { confirm } = await import('../components/ui/Confirm');
    const confirmed = await confirm({
      title: 'Book again?',
      message: `Would you like to book ${serviceName} with ${specialistName} again?`,
      confirmText: t('actions.book') || 'Book',
      cancelText: t('actions.cancel') || 'Cancel'
    });

    if (confirmed) {
      const serviceId = booking.service?.id || booking.serviceId;

      if (serviceId) {
        navigate(`/booking/${serviceId}`);
      } else {
        const specialistId = booking.specialist?.id || booking.specialistId;
        if (specialistId) {
          navigate(`/specialist/${specialistId}`);
        } else {
          toast.error(t('errors.serviceNotFound'));
        }
      }
    }
  }, [navigate, t]);

  const refreshBookings = useCallback((userType: 'customer' | 'specialist') => {
    dispatch(fetchBookings({ filters: {}, userType }));
  }, [dispatch]);

  return {
    handleRescheduleBooking,
    handleCancelBooking,
    handleBookAgain,
    refreshBookings
  };
};