import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { RootState, AppDispatch } from '../../store';
import { fetchBookings, cancelBooking } from '../../store/slices/bookingSlice';
import { Booking } from '../../types';
import { FilterState } from '../../types/booking';
import { CalendarIcon, EyeIcon, ClockIcon } from '@/components/icons';
import { Avatar } from '../../components/ui/Avatar';
import ReviewModal from '../../components/modals/ReviewModal';
import BookingDetailModal from '../../components/modals/BookingDetailModal';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { getTranslatedServiceName, getTranslatedDuration, statusColors } from '../../utils/bookingUtils';
import { validateReviewTags } from '../../constants/reviewTags';
import { reviewsService } from '../../services/reviews.service';


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
  
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    dateRange: 'all',
    serviceType: 'all',
    searchTerm: ''
  });
  
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
  
  const handleRescheduleBooking = (_bookingId: string) => {
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
      toast.error(t('bookings.cancelFailed') || 'Failed to cancel booking. Please try again.');
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
    } catch (error: any) {
      console.error('Failed to submit review:', error);

      // Handle specific error codes
      if (error?.response?.status === 409 || error?.status === 409) {
        toast.error(t('reviews.alreadyExists') || 'You have already reviewed this booking');
        setShowReviewModal(false);
        setBookingToReview(null);
      } else {
        const errorMessage = error?.response?.data?.message || error?.message || t('reviews.submitError');
        toast.error(errorMessage);
      }
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
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8 space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('customer.bookings.title')}
            </h1>
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-300 mt-1">
              {t('customer.bookings.subtitle')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-6 p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('bookings.status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
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
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
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
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
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
                  className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white"
                >
                  <option value="date">{t('filters.date')}</option>
                  <option value="amount">{t('filters.amount')}</option>
                  <option value="status">{t('filters.status')}</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white text-sm min-w-[3rem] flex items-center justify-center"
                  title={sortOrder === 'asc' ? t('filters.ascending') : t('filters.descending')}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
          {paginatedBookings.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-400">
                <CalendarIcon className="w-full h-full" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('bookings.noBookings')}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('bookings.noBookingsDescription')}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.service')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.specialist')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.dateTime')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.amount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {getTranslatedDuration(booking.duration || '60 min', t)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
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
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {scheduledDate.toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(booking.totalAmount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
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
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
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
              
              {/* Mobile Card View */}
              <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedBookings.map((booking) => {
                  const scheduledDate = new Date(booking.scheduledAt);
                  const specialistName = booking.specialist?.firstName && booking.specialist?.lastName 
                    ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
                    : booking.specialistName || 'Unknown Specialist';
                  const specialistAvatar = booking.specialist?.profileImage || booking.specialist?.user?.avatar;

                  return (
                    <div key={booking.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {getTranslatedDuration(booking.duration || '60 min', t)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${statusColors[booking.status] || statusColors.PENDING}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).toLowerCase()}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                            title={t('actions.viewDetails')}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar
                          src={specialistAvatar}
                          alt={specialistName}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {specialistName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{scheduledDate.toLocaleDateString()}</span>
                          <ClockIcon className="w-4 h-4 ml-2" />
                          <span>{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPrice(booking.totalAmount)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              {t('pagination.showing')} {((currentPage - 1) * itemsPerPage) + 1} {t('pagination.to')} {Math.min(currentPage * itemsPerPage, filteredAndSortedBookings.length)} {t('pagination.of')} {filteredAndSortedBookings.length} {t('pagination.results')}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-1 sm:gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('pagination.previous')}
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium border rounded-xl ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
        getTranslatedServiceName={(serviceName: string) => getTranslatedServiceName(serviceName, t)}
        getTranslatedDuration={(duration: string | number) => getTranslatedDuration(duration, t)}
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
          serviceName={getTranslatedServiceName(bookingToReview.service?.name || bookingToReview.serviceName || 'Unknown Service', t)}
        />
      )}
    </div>
  );
};

export default CustomerBookings;
