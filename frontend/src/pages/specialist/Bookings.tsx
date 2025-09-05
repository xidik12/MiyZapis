import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { RootState, AppDispatch } from '../../store';
import { fetchBookings, updateBookingStatus } from '../../store/slices/bookingSlice';
import { Booking, BookingStatus } from '../../types';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  CheckIcon
} from '@heroicons/react/24/outline';

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
  paymentStatus: string;
  searchTerm: string;
}

interface BookingDetailModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (bookingId: string, newStatus: keyof typeof statusColors) => void;
  getTranslatedServiceName: (serviceName: string) => string;
  getTranslatedDuration: (duration: string | number) => string;
}

interface PaymentConfirmationModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingId: string, paymentConfirmed: boolean, notes?: string) => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ 
  booking, 
  isOpen, 
  onClose, 
  onStatusChange,
  getTranslatedServiceName,
  getTranslatedDuration
}) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [selectedStatus, setSelectedStatus] = useState(booking?.status || 'PENDING');
  const [message, setMessage] = useState('');
  
  if (!isOpen || !booking) return null;
  
  const handleStatusChange = () => {
    onStatusChange(booking.id, selectedStatus as keyof typeof statusColors);
    onClose();
  };
  
  const handleSendMessage = () => {
    // In real app, this would send a message to the customer
    setMessage('');
    // Show success notification
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{t('bookingDetails.title')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('bookingDetails.customerInfo')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookingDetails.name')}</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.customer 
                    ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() 
                    : (booking.customerName || 'Unknown Customer')
                  }
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookingDetails.contact')}</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.customer?.phoneNumber || booking.customer?.email || booking.customerEmail || booking.customerPhone || t('bookingDetails.contactNotAvailable')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Service Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('bookingDetails.serviceInfo')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.service')}</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.service?.name || getTranslatedServiceName(booking.serviceName || 'Unknown Service')}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookingDetails.duration')}</label>
                <p className="font-medium text-gray-900 dark:text-white">{booking.duration} {t('time.minutes')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.amount')}</label>
                <p className="font-medium text-gray-900 dark:text-white">{formatPrice(booking.totalAmount, getBookingCurrency(booking))}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.type')}</label>
                <div className="flex items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.meetingLink 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.meetingLink ? t('bookings.online') : t('bookings.inPerson')}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Appointment Details */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('bookingDetails.appointmentDetails')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.date')}</label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('uk-UA') : booking.date}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookingDetails.time')}</label>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(booking.scheduledAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            {booking.meetingLink && (
              <div className="mt-4">
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookingDetails.meetingLink')}</label>
                <p className="font-medium text-blue-600 hover:text-blue-800">
                  <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="underline">
                    {t('bookingDetails.joinMeeting')}
                  </a>
                </p>
              </div>
            )}
            {booking.notes && (
              <div className="mt-4">
                <label className="text-sm text-gray-600 dark:text-gray-300">{t('bookingDetails.notes')}</label>
                <p className="font-medium text-gray-700 dark:text-gray-300">{booking.notes}</p>
              </div>
            )}
          </div>
          
          {/* Status Management */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('bookingDetails.statusManagement')}</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'NO_SHOW'].map((status) => (
                <label key={status} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value as BookingStatus)}
                    className="sr-only"
                  />
                  <span className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}>
                    {t(`dashboard.booking.status.${status}`)}
                  </span>
                </label>
              ))}
            </div>
            <button
              onClick={handleStatusChange}
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {t('bookingDetails.updateStatus')}
            </button>
          </div>
          
          {/* Quick Message */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('bookingDetails.sendMessage')}</h4>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('bookingDetails.messagePlaceholder')}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
              rows={3}
            />
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
              >
                {t('bookingDetails.sendMessageButton')}
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                {t('bookingDetails.template')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirm
}) => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [completionNotes, setCompletionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(booking.id, true, completionNotes);
      onClose();
      setCompletionNotes('');
    } catch (error) {
      console.error('Failed to complete booking with payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclinePayment = () => {
    onConfirm(booking.id, false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Confirmation</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 dark:bg-yellow-900/20 rounded-full mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white text-center mb-2">
              Complete Booking
            </h4>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Has the customer paid for this service?
            </p>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Service:</span>
              <span className="font-medium dark:text-white">{booking.service?.name || booking.serviceName}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Customer:</span>
              <span className="font-medium dark:text-white">
                {booking.customer 
                  ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() 
                  : (booking.customerName || 'Unknown Customer')
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Amount:</span>
              <span className="font-bold text-green-600">{formatPrice(booking.totalAmount, getBookingCurrency(booking))}</span>
            </div>
          </div>

          {/* Completion Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Completion Notes (Optional)
            </label>
            <textarea
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add any notes about the completed service..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              Yes, Payment Received
            </button>
            <button
              onClick={handleDeclinePayment}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              No, Not Paid Yet
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            Only complete the booking if payment has been received from the customer.
          </p>
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

const SpecialistBookings: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { bookings, isLoading, error } = useSelector((state: RootState) => state.booking);
  
  // Load bookings on component mount
  useEffect(() => {
    dispatch(fetchBookings({ filters: {}, userType: 'specialist' }));
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
    paymentStatus: 'all',
    searchTerm: ''
  });
  
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingToComplete, setBookingToComplete] = useState<Booking | null>(null);
  const itemsPerPage = 10;
  
  // Filter and sort bookings
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(booking => {
      const matchesStatus = filters.status === 'all' || booking.status === filters.status;
      const customerName = booking.customer ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() : (booking.customerName || '');
      const serviceName = booking.service?.name || booking.serviceName || '';
      const matchesSearch = !filters.searchTerm || 
        customerName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
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
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
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
  
  const handleStatusChange = async (bookingId: string, newStatus: keyof typeof statusColors) => {
    // If trying to complete a booking, show payment confirmation modal instead
    if (newStatus === 'COMPLETED') {
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        setBookingToComplete(booking);
        setShowPaymentModal(true);
        return;
      }
    }

    try {
      console.log('📝 Updating booking status:', { bookingId, newStatus });
      
      const result = await dispatch(updateBookingStatus({ 
        bookingId, 
        status: newStatus as BookingStatus 
      }));
      
      if (updateBookingStatus.fulfilled.match(result)) {
        console.log('✅ Booking status updated successfully');
        // Optionally show a success toast here
      } else {
        console.error('❌ Failed to update booking status:', result.payload);
        // Optionally show an error toast here
      }
    } catch (error: any) {
      console.error('❌ Failed to update booking status:', error);
    }
  };

  const handlePaymentConfirmation = async (bookingId: string, paymentConfirmed: boolean, notes?: string) => {
    try {
      console.log('📝 Completing booking with payment confirmation:', { bookingId, paymentConfirmed, notes });
      
      if (!paymentConfirmed) {
        // Show a message that payment must be received first
        alert('Please ensure payment is received before completing the booking.');
        return;
      }

      // Use the new booking service method
      const { bookingService } = await import('../../services/booking.service');
      const result = await bookingService.completeBookingWithPayment(bookingId, {
        paymentConfirmed,
        completionNotes: notes,
      });
      console.log('✅ Booking completed with payment confirmation:', result);

      // Refresh bookings to show updated status
      dispatch(fetchBookings({ filters: {}, userType: 'specialist' }));
      
    } catch (error: any) {
      console.error('❌ Failed to complete booking with payment confirmation:', error);
      alert(`Failed to complete booking: ${error.message}`);
    }
  };
  
  const handleBulkStatusChange = async (_newStatus: keyof typeof statusColors) => {
    try {
      // In a real app, this would call the booking service to update multiple statuses
      // TODO: Implement actual API call when backend bulk update is ready
      // await dispatch(updateMultipleBookingStatuses({ bookingIds: selectedBookings, status: newStatus }));
      setSelectedBookings([]);
    } catch (error) {
      console.error('Failed to bulk update booking statuses:', error);
    }
  };
  
  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    }
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(paginatedBookings.map(b => b.id));
    } else {
      setSelectedBookings([]);
    }
  };
  
  const openBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };
  
  const getStatusBadge = (status: BookingStatus) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}>
        {t(`dashboard.booking.status.${status}`)}
      </span>
    );
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">{t('common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => dispatch(fetchBookings({ filters: {}, userType: 'specialist' }))}
                className="bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {t('common.retry')}
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('dashboard.nav.bookings')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('bookings.subtitle')}
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-4 lg:mt-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.total')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredAndSortedBookings.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.confirmed')}</p>
              <p className="text-xl font-bold text-green-600">
                {filteredAndSortedBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'confirmed').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.pending')}</p>
              <p className="text-xl font-bold text-yellow-600">
                {filteredAndSortedBookings.filter(b => b.status === 'PENDING' || b.status === 'pending').length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('bookings.completed')}</p>
              <p className="text-xl font-bold text-blue-600">
                {filteredAndSortedBookings.filter(b => b.status === 'COMPLETED' || b.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('bookings.search')}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('bookings.searchPlaceholder')}
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('bookings.status')}</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{t('bookings.allStatus')}</option>
                <option value="PENDING">{t('bookings.pending')}</option>
                <option value="CONFIRMED">{t('bookings.confirmed')}</option>
                <option value="COMPLETED">{t('bookings.completed')}</option>
                <option value="CANCELLED">{t('dashboard.booking.status.CANCELLED')}</option>
                <option value="IN_PROGRESS">{t('dashboard.booking.status.IN_PROGRESS')}</option>
                <option value="noShow">{t('dashboard.booking.status.noShow')}</option>
              </select>
            </div>
            
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('bookings.dateRange')}</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{t('bookings.allDates')}</option>
                <option value="today">{t('bookings.today')}</option>
                <option value="week">{t('bookings.thisWeek')}</option>
                <option value="month">{t('bookings.thisMonth')}</option>
              </select>
            </div>
            
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('bookings.sortBy')}</label>
              <div className="flex space-x-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="date">{t('bookings.date')}</option>
                  <option value="amount">{t('bookings.amount')}</option>
                  <option value="status">{t('bookings.status')}</option>
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
        </div>
        
        {/* Bulk Actions */}
        {selectedBookings.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {selectedBookings.length} {t('bookings.selected')}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkStatusChange('confirmed')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  {t('bookings.confirm')}
                </button>
                <button
                  onClick={() => handleBulkStatusChange('cancelled')}
                  className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  {t('bookings.cancel')}
                </button>
                <button
                  onClick={() => setSelectedBookings([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  {t('bookings.clear')}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Bookings Cards */}
        <div className="lg:hidden space-y-4">
          {paginatedBookings.map((booking) => (
            <div key={booking.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4">
              {/* Header with checkbox and customer */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedBookings.includes(booking.id)}
                    onChange={(e) => handleSelectBooking(booking.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3">
                      {booking.customer 
                        ? `${booking.customer.firstName?.[0] || ''}${booking.customer.lastName?.[0] || ''}`
                        : (booking.customerName?.split(' ').map(n => n[0]).join('') || 'U')
                      }
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {booking.customer 
                          ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() 
                          : (booking.customerName || 'Unknown Customer')
                        }
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        ID: #{booking.id}
                      </p>
                    </div>
                  </div>
                </div>
                {getStatusBadge(booking.status)}
              </div>

              {/* Service and details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('bookings.service')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {booking.service?.name || getTranslatedServiceName(booking.serviceName || 'Unknown Service')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {booking.duration} {t('time.minutes')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('bookings.amount')}</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(booking.totalAmount, getBookingCurrency(booking))}
                  </p>
                </div>
              </div>

              {/* Date and type */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('bookings.dateTime')}</p>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('uk-UA') : booking.date}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : booking.time}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('bookings.type')}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    booking.meetingLink 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                  }`}>
                    {booking.meetingLink ? t('bookings.online') : t('bookings.inPerson')}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openBookingDetails(booking)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                >
                  {t('bookings.view')}
                </button>
                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => {
                      setBookingToComplete(booking);
                      setShowPaymentModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                  >
                    {t('bookings.complete')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Bookings Table */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedBookings.length === paginatedBookings.length && paginatedBookings.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('bookings.customer')}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('bookings.type')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    {t('bookings.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={(e) => handleSelectBooking(booking.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {booking.customer 
                                ? `${booking.customer.firstName?.[0] || ''}${booking.customer.lastName?.[0] || ''}` 
                                : (booking.customerName ? booking.customerName.split(' ').map(n => n[0]).join('') : 'UC')
                              }
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {booking.customer 
                              ? `${booking.customer.firstName || ''} ${booking.customer.lastName || ''}`.trim() 
                              : (booking.customerName || 'Unknown Customer')
                            }
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">ID: #{booking.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {booking.service?.name || getTranslatedServiceName(booking.serviceName || 'Unknown Service')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{getTranslatedDuration(booking.duration)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('uk-UA') : booking.date}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : booking.time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(booking.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatPrice(booking.totalAmount, getBookingCurrency(booking))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        booking.meetingLink 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.meetingLink ? t('bookings.online') : t('bookings.inPerson')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openBookingDetails(booking)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                          title={t('bookings.view')}
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {t('bookings.view')}
                        </button>
                        {(booking.status === 'PENDING' || booking.status === 'pending') ? (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'CONFIRMED')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            title={t('bookings.confirm')}
                          >
                            <CheckIcon className="w-4 h-4 mr-1" />
                            {t('bookings.confirm')}
                          </button>
                        ) : (booking.status === 'CONFIRMED' || booking.status === 'confirmed') ? (
                          <button
                            onClick={() => handleStatusChange(booking.id, 'COMPLETED')}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title={t('bookings.complete')}
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-1" />
                            {t('bookings.complete')}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && filteredAndSortedBookings.length > 0 && (
          <div className="mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex justify-between flex-1 sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {t('bookings.previous')}
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {t('bookings.next')}
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {t('bookings.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('bookings.to')}{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, filteredAndSortedBookings.length)}
                      </span> {t('bookings.of')}{' '}
                      <span className="font-medium">{filteredAndSortedBookings.length}</span> {t('bookings.results')}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                      >
                        ←
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                      ))}
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
        
        {/* No Results */}
        {filteredAndSortedBookings.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('bookings.noBookingsFound')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('bookings.noBookingsDescription')}
            </p>
          </div>
        )}
      </div>
      
      {/* Booking Detail Modal */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onStatusChange={handleStatusChange}
        getTranslatedServiceName={getTranslatedServiceName}
        getTranslatedDuration={getTranslatedDuration}
      />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        booking={bookingToComplete}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setBookingToComplete(null);
        }}
        onConfirm={handlePaymentConfirmation}
      />
      </div>
  );
};

export default SpecialistBookings;