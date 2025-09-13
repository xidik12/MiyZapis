import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { RootState, AppDispatch } from '../../store';
import { fetchBookings, updateBookingStatus, cancelBooking } from '../../store/slices/bookingSlice';
import { Booking, BookingStatus } from '../../types';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  CheckIcon,
  StarIcon,
  XMarkIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import ReviewModal from '../../components/modals/ReviewModal';
import { reviewsService } from '../../services/reviews.service';
import { validateReviewTags } from '../../constants/reviewTags';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { messagesService } from '../../services/messages.service';
import { Avatar } from '../../components/ui/Avatar';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

// Status colors for bookings (matching backend status values)
const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  IN_PROGRESS: 'bg-purple-100 text-purple-800 border-purple-200',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200',
  // Legacy lowercase support for compatibility
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  inProgress: 'bg-purple-100 text-purple-800 border-purple-200',
  noShow: 'bg-gray-100 text-gray-800 border-gray-200'
};

interface FilterState {
  status: string;
  dateRange: string;
  serviceType: string;
  searchTerm: string;
}

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
  onBookAgain: (booking: Booking) => void;
  onLeaveReview: (bookingId: string) => void;
  getTranslatedServiceName: (serviceName: string) => string;
  getTranslatedDuration: (duration: string | number) => string;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ 
  booking, 
  isOpen, 
  onClose, 
  onReschedule,
  onCancel,
  onBookAgain,
  onLeaveReview,
  getTranslatedServiceName,
  getTranslatedDuration
}) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [message, setMessage] = useState('');
  
  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  if (!isOpen || !booking) return null;
  
  const scheduledDate = new Date(booking.scheduledAt);
  const isUpcoming = ['PENDING', 'CONFIRMED'].includes(booking.status) && scheduledDate > new Date();
  const canCancel = isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
  const canReschedule = isUpcoming && scheduledDate > new Date(Date.now() + 24 * 60 * 60 * 1000);
  const canReview = booking.status === 'COMPLETED' && !booking.review;
  const canBookAgain = booking.status === 'COMPLETED';

  // Get specialist info - handle both nested and flat structures
  const specialistName = booking.specialist?.firstName && booking.specialist?.lastName 
    ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
    : booking.specialistName || 'Unknown Specialist';
  
  const specialistAvatar = booking.specialist?.profileImage || booking.specialist?.user?.avatar;
  const specialistRating = booking.specialist?.rating || 5;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {t('bookings.bookingDetails')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Status Badge */}
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[booking.status] || statusColors.PENDING}`}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              #{booking.id.substring(0, 8)}...
            </span>
          </div>

          {/* Service Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('bookings.serviceDetails')}
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  <strong>{getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service')}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4" />
                <span>
                  {getTranslatedDuration(booking.duration || '60 min')}
                </span>
              </div>
            </div>
          </div>

          {/* Specialist Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('bookings.specialistDetails')}
            </h3>
            <div className="flex items-start space-x-3">
              <Avatar
                src={specialistAvatar}
                alt={specialistName}
                size="md"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-900 dark:text-white">{specialistName}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <StarIcon
                      key={index}
                      className={`w-4 h-4 ${
                        index < Math.floor(specialistRating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                    {specialistRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              {t('bookings.paymentDetails')}
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>{t('bookings.totalAmount')}:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPrice(booking.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{t('bookings.paymentStatus')}:</span>
                <span className={`font-medium ${
                  booking.paymentStatus === 'PAID' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {booking.paymentStatus || 'PENDING'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(booking.customerNotes || booking.specialistNotes) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                {t('bookings.notes')}
              </h3>
              {booking.customerNotes && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                    {t('bookings.yourNotes')}:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {booking.customerNotes}
                  </p>
                </div>
              )}
              {booking.specialistNotes && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                    {t('bookings.specialistNotes')}:
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {booking.specialistNotes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl sm:rounded-b-2xl">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {canCancel && (
              <button
                onClick={() => {
                  onCancel(booking.id);
                  onClose();
                }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-200 dark:border-red-800"
              >
                <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                {t('actions.cancel')}
              </button>
            )}
            
            {canReschedule && (
              <button
                onClick={() => {
                  onReschedule(booking.id);
                  onClose();
                }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
              >
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                {t('actions.reschedule')}
              </button>
            )}
            
            {canReview && (
              <button
                onClick={() => {
                  onLeaveReview(booking.id);
                  onClose();
                }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-200 dark:border-green-800"
              >
                <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                {t('actions.review')}
              </button>
            )}
            
            {canBookAgain && (
              <button
                onClick={() => {
                  onBookAgain(booking);
                  onClose();
                }}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
              >
                <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                {t('actions.bookAgain')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get the booking currency
const getBookingCurrency = (booking: Booking): 'USD' | 'EUR' | 'UAH' => {
  // Use the service's stored currency, defaulting to UAH if not specified
  return (booking.service?.currency as 'USD' | 'EUR' | 'UAH') || 'UAH';
};

const CustomerBookings: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  // Redux state
  const { bookings, isLoading, error } = useSelector((state: RootState) => state.booking);
  
  // Load customer bookings
  useEffect(() => {
    dispatch(fetchBookings({ filters: {}, userType: 'customer' }));
  }, [dispatch]);
  
  // Simple service name translation
  const getTranslatedServiceName = (serviceName: string): string => {
    const serviceMapping: { [key: string]: string } = {
      'Консультація з психології': 'service.consultation',
      'Індивідуальна терапія': 'service.individualTherapy',
      'Сімейна консультація': 'service.familyConsultation',
      'Групова терапія': 'service.groupTherapy',
      'Експрес-консультація': 'service.expressConsultation',
      'Підліткова психологія': 'service.teenPsychology',
      'Терапія пар': 'service.coupleTherapy',
      'Психологічна консультація': 'service.psychologyConsultation',
    };
    
    return serviceMapping[serviceName] ? t(serviceMapping[serviceName]) : serviceName;
  };
  
  // Duration translation function
  const getTranslatedDuration = (duration: string | number): string => {
    // Handle both string and number types
    const durationStr = typeof duration === 'string' ? duration : `${duration} хв`;
    // Replace Ukrainian abbreviation with translated one
    return durationStr.replace(/\s*хв\s*$/i, ` ${t('time.minutes')}`);
  };
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
    serviceType: 'all',
    searchTerm: ''
  });
  
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [bookingToReview, setBookingToReview] = useState<Booking | null>(null);
  const itemsPerPage = 10;
  
  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesStatus = filters.status === 'all' || booking.status === filters.status;
      const specialistName = booking.specialist ? `${booking.specialist.firstName || ''} ${booking.specialist.lastName || ''}`.trim() : (booking.specialistName || '');
      const serviceName = booking.service?.name || booking.serviceName || '';
      const matchesSearch = !filters.searchTerm || 
        specialistName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        serviceName.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const bookingDate = booking.scheduledAt ? new Date(booking.scheduledAt) : (booking.date ? new Date(booking.date) : null);
      const matchesDateRange = filters.dateRange === 'all' || (
        bookingDate && filters.dateRange === 'today' && bookingDate.toDateString() === new Date().toDateString()
      ) || (
        bookingDate && filters.dateRange === 'week' && 
        bookingDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      
      return matchesStatus && matchesSearch && matchesDateRange;
    });
    
    // Sort bookings
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.scheduledAt);
          bVal = new Date(b.scheduledAt);
          break;
        case 'amount':
          aVal = a.totalAmount;
          bVal = b.totalAmount;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
    
    return filtered;
  }, [bookings, filters, sortBy, sortOrder]);
  
  // Pagination
  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);
  const paginatedBookings = filteredAndSortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handleRescheduleBooking = (bookingId: string) => {
    // In a real app, this would open a reschedule modal/flow
    toast.info(t('booking.rescheduleAlert'));
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const result = await dispatch(cancelBooking({ bookingId, reason: 'Customer requested cancellation' }));
      if (cancelBooking.fulfilled.match(result)) {
        toast.success(t('bookings.cancelledSuccessfully'));
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking. Please try again.');
    }
  };

  const handleLeaveReview = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking) {
      setBookingToReview(booking);
      setShowReviewModal(true);
    }
  };

  const handleBookAgain = async (booking: Booking) => {
    const serviceName = booking.service?.name || booking.serviceName || 'this service';
    const specialistName = booking.specialist?.firstName && booking.specialist?.lastName 
      ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
      : booking.specialistName || 'the specialist';
    
    const { confirm } = await import('../../components/ui/Confirm');
    const confirmed = await confirm({
      title: 'Book again?',
      message: `Would you like to book ${serviceName} with ${specialistName} again?`,
      confirmText: t('actions.book') || 'Book',
      cancelText: t('actions.cancel') || 'Cancel'
    });
    
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
          toast.error(t('errors.serviceNotFound'));
        }
      }
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

      const createData = {
        bookingId: bookingToReview.id,
        rating: reviewData.rating,
        comment: reviewData.comment || undefined,
        tags: validTags.length > 0 ? validTags : undefined,
        isPublic: true,
        wouldRecommend: reviewData.rating >= 4
      };

      await reviewsService.createReview(createData);
      
      setShowReviewModal(false);
      setBookingToReview(null);
      
      // Refresh bookings to show updated review status
      dispatch(fetchBookings({ filters: {}, userType: 'customer' }));
      
      toast.success(t('reviews.reviewSubmitted'));
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(t('reviews.submitError'));
    } finally {
      setReviewLoading(false);
    }
  };

  if (isLoading) {
    return <FullScreenHandshakeLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errors.loadingFailed')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchBookings({ filters: {}, userType: 'customer' }))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('customer.bookings.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {t('customer.bookings.subtitle')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('bookings.status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">{t('filters.all')}</option>
                <option value="PENDING">{t('status.pending')}</option>
                <option value="CONFIRMED">{t('status.confirmed')}</option>
                <option value="IN_PROGRESS">{t('status.inProgress')}</option>
                <option value="COMPLETED">{t('status.completed')}</option>
                <option value="CANCELLED">{t('status.cancelled')}</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('filters.dateRange')}
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">{t('filters.allTime')}</option>
                <option value="today">{t('filters.today')}</option>
                <option value="week">{t('filters.thisWeek')}</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('filters.search')}
              </label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder={t('filters.searchPlaceholder')}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('filters.sortBy')}
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                  className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">{t('filters.date')}</option>
                  <option value="amount">{t('filters.amount')}</option>
                  <option value="status">{t('filters.status')}</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white text-sm"
                  title={sortOrder === 'asc' ? t('filters.ascending') : t('filters.descending')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {paginatedBookings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <CalendarIcon className="w-full h-full" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('bookings.noBookings')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t('bookings.noBookingsDescription')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('bookings.service')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('bookings.specialist')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('bookings.dateTime')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('bookings.amount')}
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('bookings.status')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('bookings.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedBookings.map((booking) => {
                    const scheduledDate = new Date(booking.scheduledAt);
                    const specialistName = booking.specialist?.firstName && booking.specialist?.lastName 
                      ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
                      : booking.specialistName || 'Unknown Specialist';
                    const specialistAvatar = booking.specialist?.profileImage || booking.specialist?.user?.avatar;

                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-3 sm:px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service')}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {getTranslatedDuration(booking.duration || '60 min')}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <Avatar
                              src={specialistAvatar}
                              alt={specialistName}
                              size="sm"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {specialistName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {scheduledDate.toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(booking.totalAmount)}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[booking.status] || statusColors.PENDING}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title={t('actions.viewDetails')}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
              {t('pagination.showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('pagination.to')} {Math.min(currentPage * itemsPerPage, filteredAndSortedBookings.length)} {t('pagination.of')} {filteredAndSortedBookings.length} {t('pagination.results')}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('pagination.previous')}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium border rounded-lg ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBooking(null);
        }}
        onReschedule={handleRescheduleBooking}
        onCancel={handleCancelBooking}
        onBookAgain={handleBookAgain}
        onLeaveReview={handleLeaveReview}
        getTranslatedServiceName={getTranslatedServiceName}
        getTranslatedDuration={getTranslatedDuration}
      />

      {/* Review Modal */}
      {showReviewModal && bookingToReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setBookingToReview(null);
          }}
          onSubmit={handleSubmitReview}
          isLoading={reviewLoading}
          bookingId={bookingToReview.id}
          specialistName={
            bookingToReview.specialist?.firstName && bookingToReview.specialist?.lastName 
              ? `${bookingToReview.specialist.firstName} ${bookingToReview.specialist.lastName}`
              : bookingToReview.specialistName || 'Unknown Specialist'
          }
          serviceName={getTranslatedServiceName(bookingToReview.service?.name || bookingToReview.serviceName || 'Unknown Service')}
        />
      )}
    </div>
  );
};

export default CustomerBookings;