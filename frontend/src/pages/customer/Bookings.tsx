import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { addMonths, subMonths } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { RootState, AppDispatch } from '../../store';
import { fetchBookings, cancelBooking } from '../../store/slices/bookingSlice';
import { Booking } from '../../types';
import { FilterState } from '../../types/booking';
import { CalendarIcon, EyeIcon, ClockIcon, StarIcon, ListBulletsIcon, CheckCircleIcon } from '@/components/icons';
import ReviewModal from '../../components/modals/ReviewModal';
import BookingDetailModal from '../../components/modals/BookingDetailModal';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { getTranslatedServiceName, getTranslatedDuration, statusColors } from '../../utils/bookingUtils';
import { validateReviewTags } from '../../constants/reviewTags';
import { reviewsService } from '../../services/reviews.service';
import { logger } from '@/utils/logger';
import { MonthView } from '@/components/calendar/MonthView';
import { waitlistService, type WaitlistEntry } from '@/services/waitlist.service';


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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'bookings' | 'waitlist'>('bookings');
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const itemsPerPage = 10;

  // Load waitlist entries
  useEffect(() => {
    if (activeTab === 'waitlist') {
      loadWaitlist();
    }
  }, [activeTab]);

  const loadWaitlist = async () => {
    setWaitlistLoading(true);
    try {
      const data = await waitlistService.getMyWaitlist();
      setWaitlistEntries(data.entries);
    } catch (error) {
      logger.error('Failed to load waitlist:', error);
      toast.error(t('waitlist.loadFailed') || 'Failed to load waitlist entries');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleCancelWaitlist = async (entryId: string) => {
    try {
      await waitlistService.leaveWaitlist(entryId);
      setWaitlistEntries(prev => prev.filter(e => e.id !== entryId));
      toast.success(t('waitlist.cancelledSuccess') || 'Removed from waitlist');
    } catch (error: any) {
      logger.error('Failed to cancel waitlist entry:', error);
      toast.error(error?.message || t('waitlist.cancelFailed') || 'Failed to cancel waitlist entry');
    }
  };

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

  // Pagination (memoized for performance)
  const totalPages = Math.ceil(filteredAndSortedBookings.length / itemsPerPage);
  const paginatedBookings = useMemo(() =>
    filteredAndSortedBookings.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    ),
    [filteredAndSortedBookings, currentPage, itemsPerPage]
  );

  const handleRescheduleBooking = (_bookingId: string) => {
    toast.info(t('booking.rescheduleAlert'));
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const result = await dispatch(cancelBooking({ bookingId, reason: 'Customer requested cancellation' }));
      if (cancelBooking.fulfilled.match(result)) {
        toast.success(t('bookings.cancelledSuccessfully'));
      }
    } catch (error) {
      logger.error('Failed to cancel booking:', error);
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
  };

  const handleSubmitReview = async (reviewData: {
    rating: number;
    comment: string;
    tags: string[];
  }) => {
    if (!bookingToReview) return;

    setReviewLoading(true);
    try {
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

      dispatch(fetchBookings({ filters: {}, userType: 'customer' }));

      toast.success(t('reviews.reviewSubmitted'));
    } catch (error: any) {
      logger.error('Failed to submit review:', error);

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

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status] || statusColors.PENDING;
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${colorClass}`}>
        {t(`dashboard.booking.status.${status}`) || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </span>
    );
  };

  if (isLoading) {
    return <FullScreenHandshakeLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{t('errors.loadingFailed')}</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => dispatch(fetchBookings({ filters: {}, userType: 'customer' }))}
                className="bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 font-medium py-2 px-4 rounded-xl transition-colors"
              >
                {t('actions.retry')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
              {t('customer.bookings.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              {t('customer.bookings.subtitle')}
            </p>
          </div>
          <div className="flex items-center mt-3 sm:mt-0 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListBulletsIcon className="w-4 h-4 mr-1.5" />
              {t('bookings.listView') || 'List'}
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4 mr-1.5" />
              {t('bookings.calendarView') || 'Calendar'}
            </button>
          </div>
        </div>

        {/* Bookings / Waitlist Tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6 sm:mb-8 w-fit">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'bookings'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4 mr-1.5" />
            {t('customer.bookings.title') || 'My Bookings'}
          </button>
          <button
            onClick={() => setActiveTab('waitlist')}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'waitlist'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ClockIcon className="w-4 h-4 mr-1.5" />
            {t('waitlist.title') || 'Waitlist'}
            {waitlistEntries.length > 0 && (
              <span className="ml-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                {waitlistEntries.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'bookings' && (<>
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.total')}</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{filteredAndSortedBookings.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.confirmed')}</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {filteredAndSortedBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'confirmed').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.pending')}</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {filteredAndSortedBookings.filter(b => b.status === 'PENDING' || b.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.completed')}</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {filteredAndSortedBookings.filter(b => b.status === 'COMPLETED' || b.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Filters and Search (list mode only) */}
        {viewMode === 'list' && <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                {t('filters.search')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder={t('filters.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                {t('bookings.status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                {t('filters.dateRange')}
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{t('filters.allTime')}</option>
                <option value="today">{t('filters.today')}</option>
                <option value="week">{t('filters.thisWeek')}</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                {t('filters.sortBy')}
              </label>
              <div className="flex space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                  className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="date">{t('filters.date')}</option>
                  <option value="amount">{t('filters.amount')}</option>
                  <option value="status">{t('filters.status')}</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg hover:bg-gray-50 dark:hover:bg-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="mb-6 sm:mb-8">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCalendarDate(prev => subMonths(prev, 1))}
                className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  {t('calendar.today') || 'Today'}
                </button>
              </div>
              <button
                onClick={() => setCalendarDate(prev => addMonths(prev, 1))}
                className="p-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Month Grid */}
            <MonthView
              currentDate={calendarDate}
              bookings={filteredAndSortedBookings}
              onBookingClick={(booking) => {
                setSelectedBooking(booking);
                setShowDetailModal(true);
              }}
              onDateClick={(date) => {
                setCalendarDate(date);
              }}
            />
          </div>
        )}

        {/* Bookings List */}
        {viewMode === 'list' && (paginatedBookings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900 dark:text-white">
              {t('bookings.noBookings')}
            </h3>
            <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('bookings.noBookingsDescription')}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {paginatedBookings.map((booking) => {
                const scheduledDate = new Date(booking.scheduledAt);
                const specialistName = booking.specialist?.firstName && booking.specialist?.lastName
                  ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
                  : booking.specialistName || 'Unknown Specialist';

                return (
                  <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
                    {/* Header with specialist and status */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {booking.specialist
                            ? `${booking.specialist.firstName?.[0] || ''}${booking.specialist.lastName?.[0] || ''}`
                            : (booking.specialistName?.split(' ').map(n => n[0]).join('') || 'S')
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {specialistName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ID: #{booking.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    {/* Service and amount */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('bookings.service')}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getTranslatedDuration(booking.duration || '60 min', t)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('bookings.amount')}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(booking.totalAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Date and time */}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      <span>{scheduledDate.toLocaleDateString()}</span>
                      <ClockIcon className="w-4 h-4 ml-3 mr-1" />
                      <span>{scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors"
                      >
                        {t('actions.viewDetails')}
                      </button>
                      {(booking.status === 'COMPLETED' || booking.status === 'completed') && (
                        <button
                          onClick={() => handleLeaveReview(booking.id)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium py-2 px-3 rounded-xl transition-colors flex items-center"
                        >
                          <StarIcon className="w-4 h-4 mr-1" />
                          {t('customer.bookings.leaveReview')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.specialist')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.service')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.dateTime')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        {t('bookings.amount')}
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

                      return (
                        <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white font-medium text-sm">
                                    {booking.specialist
                                      ? `${booking.specialist.firstName?.[0] || ''}${booking.specialist.lastName?.[0] || ''}`
                                      : (booking.specialistName ? booking.specialistName.split(' ').map(n => n[0]).join('') : 'S')
                                    }
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {specialistName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">ID: #{booking.id.slice(0, 8)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {getTranslatedServiceName(booking.service?.name || booking.serviceName || 'Unknown Service', t)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {getTranslatedDuration(booking.duration || '60 min', t)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {scheduledDate.toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(booking.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {formatPrice(booking.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setShowDetailModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                title={t('actions.viewDetails')}
                              >
                                <EyeIcon className="w-4 h-4 mr-1" />
                                {t('bookings.view') || t('actions.viewDetails')}
                              </button>
                              {(booking.status === 'COMPLETED' || booking.status === 'completed') && (
                                <button
                                  onClick={() => handleLeaveReview(booking.id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-xl text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                                  title={t('customer.bookings.leaveReview')}
                                >
                                  <StarIcon className="w-4 h-4 mr-1" />
                                  <span className="hidden xl:inline">{t('customer.bookings.leaveReview')}</span>
                                  <span className="xl:hidden">Review</span>
                                </button>
                              )}
                              {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-xl text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                  title={t('bookings.cancelBooking')}
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  {t('actions.cancel')}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ))}

        {/* Pagination (list mode only) */}
        {viewMode === 'list' && totalPages > 1 && filteredAndSortedBookings.length > 0 && (
          <div className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex justify-between flex-1 sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {t('pagination.previous')}
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {t('pagination.next')}
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t('pagination.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('pagination.to')}{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredAndSortedBookings.length)}
                      </span> {t('pagination.of')}{' '}
                      <span className="font-medium">{filteredAndSortedBookings.length}</span> {t('pagination.results')}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        ←
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
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        →
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>)}

      {/* Waitlist Tab Content */}
      {activeTab === 'waitlist' && (
        <div>
          {waitlistLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('waitlist.loading') || 'Loading waitlist...'}
              </p>
            </div>
          ) : waitlistEntries.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-12 text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                {t('waitlist.empty') || 'No waitlist entries'}
              </h3>
              <p className="mt-1 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {t('waitlist.emptyDescription') || 'You are not on any waitlists. When booking, if no time slots are available, you can join the waitlist to be notified when a slot opens up.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {waitlistEntries.map((entry) => {
                const preferredDate = new Date(entry.preferredDate);
                const specialistName = entry.specialist?.user
                  ? `${entry.specialist.user.firstName} ${entry.specialist.user.lastName}`
                  : t('waitlist.unknownSpecialist') || 'Specialist';
                const isNotified = entry.status === 'NOTIFIED';

                return (
                  <div
                    key={entry.id}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 sm:p-5 ${
                      isNotified
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10'
                        : 'border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    {isNotified && (
                      <div className="flex items-center mb-3 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg w-fit">
                        <CheckCircleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-1.5" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                          {t('waitlist.slotAvailable') || 'A slot is now available! Book now.'}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {entry.specialist?.user
                              ? `${entry.specialist.user.firstName?.[0] || ''}${entry.specialist.user.lastName?.[0] || ''}`
                              : 'S'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {specialistName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {entry.service.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center">
                            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                            <span>{preferredDate.toLocaleDateString()}</span>
                          </div>
                          {entry.preferredTime && (
                            <div className="flex items-center">
                              <ClockIcon className="w-3.5 h-3.5 mr-1" />
                              <span className="capitalize">{entry.preferredTime}</span>
                            </div>
                          )}
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            isNotified
                              ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                              : 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                          }`}>
                            {isNotified
                              ? (t('waitlist.statusNotified') || 'Slot Available')
                              : (t('waitlist.statusWaiting') || 'Waiting')}
                          </span>
                        </div>

                        {entry.notes && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
                            {entry.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {isNotified && (
                          <button
                            onClick={() => {
                              const serviceId = entry.serviceId;
                              if (serviceId) {
                                navigate(`/booking/${serviceId}`);
                              }
                            }}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-xl transition-colors"
                          >
                            {t('waitlist.bookNow') || 'Book Now'}
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelWaitlist(entry.id)}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {t('waitlist.cancel') || 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
    </div>
  );
};

export default CustomerBookings;
