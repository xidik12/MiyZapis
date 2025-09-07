import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { bookingService } from '../../services/booking.service';
import { Booking as ApiBooking } from '../../types';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Avatar } from '../../components/ui/Avatar';
import { validateReviewTags } from '../../constants/reviewTags';
import ReviewModal from '../../components/modals/ReviewModal';
import { ReviewsService, CreateReviewData } from '../../services/reviews.service';

// Use the API booking type and extend it for UI needs
interface Booking extends Omit<ApiBooking, 'status'> {
  status: 'upcoming' | 'completed' | 'cancelled' | 'in_progress';
  specialistAvatar?: string;
  specialistRating?: number;
  canCancel: boolean;
  canReschedule: boolean;
  hasReview: boolean;
}

// Status color mapping
const statusColors = {
  upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  rescheduled: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

// Map API booking status to UI status
const mapApiStatusToUIStatus = (apiStatus: string): 'upcoming' | 'completed' | 'cancelled' | 'in_progress' => {
  switch (apiStatus.toLowerCase()) {
    case 'pending':
    case 'confirmed':
      return 'upcoming';
    case 'in_progress':
    case 'started':
      return 'in_progress';
    case 'completed':
    case 'finished':
      return 'completed';
    case 'cancelled':
    case 'canceled':
    case 'no_show':
      return 'cancelled';
    default:
      return 'upcoming';
  }
};

const CustomerBookings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { formatPrice } = useCurrency();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  
  const reviewsService = new ReviewsService();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const response = await bookingService.getBookings();
        
        // Transform API bookings to UI format
        const transformedBookings: Booking[] = response.bookings.map((booking: ApiBooking) => {
          // Parse date and time from scheduledAt
          const scheduledDate = new Date(booking.scheduledAt);
          
          return {
            ...booking,
            // Map API status to UI status
            status: mapApiStatusToUIStatus(booking.status),
            // Extract date and time
            date: scheduledDate.toISOString().split('T')[0],
            time: scheduledDate.toTimeString().split(' ')[0],
            // Default values for UI-specific fields
            specialistAvatar: booking.specialist?.profileImage || '',
            specialistRating: booking.specialist?.rating || 5,
            canCancel: ['pending', 'confirmed'].includes(booking.status) && 
                      new Date(booking.scheduledAt) > new Date(Date.now() + 24 * 60 * 60 * 1000),
            canReschedule: ['pending', 'confirmed'].includes(booking.status) && 
                          new Date(booking.scheduledAt) > new Date(Date.now() + 24 * 60 * 60 * 1000),
            hasReview: booking.review ? true : false,
          };
        });
        
        setBookings(transformedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'upcoming') return booking.status === 'upcoming' || booking.status === 'in_progress';
    if (activeTab === 'past') return booking.status === 'completed';
    if (activeTab === 'cancelled') return booking.status === 'cancelled';
    return false;
  });

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId, 'Customer requested cancellation');
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const, canCancel: false, canReschedule: false }
            : booking
        )
      );
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  const handleRescheduleBooking = (bookingId: string) => {
    // In a real app, this would open a reschedule modal/flow
    alert(t('booking.rescheduleAlert'));
  };

  const handleLeaveReview = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setBookingToReview(booking);
      setReviewModalOpen(true);
    }
  };

  const handleSubmitReview = async (reviewData: {
    rating: number;
    comment: string;
    tags: string[];
  }) => {
    if (!bookingToReview) return;

    setReviewLoading(true);
    try {
      // Validate and filter tags to only include valid ones
      const validTags = validateReviewTags(reviewData.tags);

      const createData: CreateReviewData = {
        bookingId: bookingToReview.id,
        specialistId: bookingToReview.specialist?.id || bookingToReview.specialistId || '',
        serviceId: bookingToReview.service?.id || bookingToReview.serviceId || undefined,
        rating: reviewData.rating,
        comment: reviewData.comment || undefined,
        tags: validTags.length > 0 ? validTags : undefined,
        isRecommended: reviewData.rating >= 4
      };

      await reviewsService.createReview(createData);
      
      // Update the booking to mark it as reviewed
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingToReview.id 
            ? { ...booking, hasReview: true }
            : booking
        )
      );
      
      setReviewModalOpen(false);
      setBookingToReview(null);
      
      alert(t('reviews.reviewSubmitted'));
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(t('reviews.submitError'));
    } finally {
      setReviewLoading(false);
    }
  };

  const handleBookAgain = (booking: Booking) => {
    const serviceName = booking.service?.name || booking.serviceName || 'this service';
    const specialistName = booking.specialist?.firstName && booking.specialist?.lastName 
      ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
      : booking.specialistName || 'the specialist';
    
    const confirmed = window.confirm(
      `Would you like to book ${serviceName} with ${specialistName} again?`
    );
    
    if (confirmed) {
      // Get the service ID from the booking
      const serviceId = booking.service?.id || booking.serviceId;
      
      if (serviceId) {
        // Navigate to the booking flow with the service ID
        navigate(`/booking/${serviceId}`);
      } else {
        // If no service ID, try to navigate using specialist ID
        const specialistId = booking.specialist?.id || booking.specialistId;
        if (specialistId) {
          navigate(`/specialist/${specialistId}`);
        } else {
          alert(t('errors.serviceNotFound'));
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'upcoming': return t('common.upcoming');
      case 'in_progress': return t('common.inProgress');
      case 'completed': return t('common.completed');
      case 'cancelled': return t('common.cancelled');
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('customer.bookings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('customer.bookings.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'upcoming', label: t('customer.bookings.upcoming') },
                { key: 'past', label: t('customer.bookings.past') },
                { key: 'cancelled', label: t('customer.bookings.cancelled') },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs dark:bg-gray-700 dark:text-gray-300">
                    {bookings.filter(b => {
                      if (tab.key === 'upcoming') return b.status === 'upcoming' || b.status === 'in_progress';
                      if (tab.key === 'past') return b.status === 'completed';
                      if (tab.key === 'cancelled') return b.status === 'cancelled';
                      return false;
                    }).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeTab === 'upcoming' && t('customer.bookings.noUpcoming')}
              {activeTab === 'past' && t('customer.bookings.noPast')}
              {activeTab === 'cancelled' && t('empty.noCancelledBookings')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {activeTab === 'upcoming' && t('empty.bookFirstService')}
              {activeTab === 'past' && t('empty.completedBookingsHere')}
              {activeTab === 'cancelled' && t('empty.cancelledBookingsHere')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Specialist Avatar */}
                      <Avatar
                        src={booking.specialistAvatar}
                        alt={booking.specialistName}
                        size="lg"
                        lazy={true}
                      />
                      
                      {/* Booking Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {booking.service?.name || booking.serviceName || 'Unknown Service'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <UserIcon className="h-4 w-4 mr-1" />
                          <span className="mr-4">
                            {booking.specialist?.firstName && booking.specialist?.lastName 
                              ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
                              : booking.specialistName || 'Unknown Specialist'
                            }
                          </span>
                          {booking.specialistRating && (
                            <div className="flex items-center">
                              <StarIconSolid className="h-4 w-4 text-yellow-400 mr-1" />
                              <span>{booking.specialistRating}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span className="mr-4">{formatDate(booking.date)}</span>
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>{formatTime(booking.time)} ({booking.duration} min)</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                          <span>
                            {booking.locationType === 'online' ? t('booking.onlineSession') : 
                             booking.location || booking.specialist?.businessAddress || 'Location TBD'}
                          </span>
                        </div>
                        
                        {booking.customerNotes && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            <span className="font-medium">{t('booking.notes')}:</span> {booking.customerNotes}
                          </div>
                        )}
                        
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatPrice(booking.totalPrice || booking.price || booking.service?.price || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center flex-wrap gap-3">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          {t('customer.bookings.viewDetails')}
                        </button>
                        
                        {booking.locationType !== 'online' && (
                          <button className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t('common.call')}</span>
                          </button>
                        )}
                        
                        <button className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 font-medium flex items-center">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">{t('common.message')}</span>
                        </button>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-2">
                        {booking.canReschedule && (
                          <button
                            onClick={() => handleRescheduleBooking(booking.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t('customer.bookings.reschedule')}</span>
                          </button>
                        )}
                        
                        {booking.canCancel && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 shadow-sm text-xs font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t('customer.bookings.cancel')}</span>
                          </button>
                        )}
                        
                        {booking.status === 'completed' && !booking.hasReview && (
                          <button
                            onClick={() => handleLeaveReview(booking.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-yellow-300 dark:border-yellow-600 shadow-sm text-xs font-medium rounded-md text-yellow-700 dark:text-yellow-400 bg-white dark:bg-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                          >
                            <StarIcon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t('customer.bookings.leaveReview')}</span>
                          </button>
                        )}
                        
                        {booking.status === 'completed' && (
                          <button
                            onClick={() => handleBookAgain(booking)}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 border border-transparent shadow-sm text-xs font-medium rounded-md text-white hover:bg-blue-700"
                          >
                            {t('customer.bookings.bookAgain')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800 dark:border-gray-700">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('booking.details')}</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.service')}</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedBooking.service?.name || selectedBooking.serviceName || 'Unknown Service'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.specialist')}</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedBooking.specialist?.firstName && selectedBooking.specialist?.lastName 
                      ? `${selectedBooking.specialist.firstName} ${selectedBooking.specialist.lastName}`
                      : selectedBooking.specialistName || 'Unknown Specialist'
                    }
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.date')}</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.time')}</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{formatTime(selectedBooking.time)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.location')}</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedBooking.locationType === 'online' 
                      ? t('booking.onlineSession')
                      : selectedBooking.location || selectedBooking.specialist?.businessAddress || 'Location TBD'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.price')}</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatPrice(selectedBooking.totalPrice || selectedBooking.price || selectedBooking.service?.price || 0)}
                  </p>
                </div>
                
                {selectedBooking.customerNotes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('booking.notes')}</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{selectedBooking.customerNotes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Review Modal */}
      {reviewModalOpen && bookingToReview && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setBookingToReview(null);
          }}
          onSubmit={handleSubmitReview}
          booking={bookingToReview}
          loading={reviewLoading}
        />
      )}
    </div>
  );
};

export default CustomerBookings;