import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
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

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  specialistId: string;
  specialistName: string;
  specialistAvatar: string;
  specialistRating: number;
  date: string;
  time: string;
  duration: number;
  price: number;
  currency: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'in_progress';
  location: {
    type: 'online' | 'specialist_location' | 'customer_location';
    address?: string;
    notes?: string;
  };
  notes?: string;
  canCancel: boolean;
  canReschedule: boolean;
  hasReview: boolean;
}

// Mock data for bookings
const getMockBookings = (t: (key: string) => string): Booking[] => [
  {
    id: '1',
    serviceId: 'service-1',
    serviceName: t('service.hairCutStyle'),
    specialistId: 'specialist-1',
    specialistName: t('specialist.sarahJohnson'),
    specialistAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    specialistRating: 4.9,
    date: '2024-01-15',
    time: '14:00',
    duration: 90,
    price: 1200,
    currency: 'UAH',
    status: 'upcoming',
    location: {
      type: 'specialist_location',
      address: t('location.beautyStudio'),
    },
    notes: t('notes.bringPhotos'),
    canCancel: true,
    canReschedule: true,
    hasReview: false,
  },
  {
    id: '2',
    serviceId: 'service-2',
    serviceName: t('service.personalTraining'),
    specialistId: 'specialist-2',
    specialistName: t('specialist.michaelChen'),
    specialistAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    specialistRating: 4.8,
    date: '2024-01-10',
    time: '10:00',
    duration: 60,
    price: 800,
    currency: 'UAH',
    status: 'completed',
    location: {
      type: 'specialist_location',
      address: t('location.fitLifeGym'),
    },
    canCancel: false,
    canReschedule: false,
    hasReview: false,
  },
  {
    id: '3',
    serviceId: 'service-3',
    serviceName: t('service.businessConsultation'),
    specialistId: 'specialist-3',
    specialistName: t('specialist.emilyRodriguez'),
    specialistAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    specialistRating: 5.0,
    date: '2024-01-08',
    time: '16:00',
    duration: 120,
    price: 2000,
    currency: 'UAH',
    status: 'completed',
    location: {
      type: 'online',
      notes: 'Zoom meeting link will be provided',
    },
    canCancel: false,
    canReschedule: false,
    hasReview: true,
  },
  {
    id: '4',
    serviceId: 'service-4',
    serviceName: t('service.massageTherapy'),
    specialistId: 'specialist-4',
    specialistName: t('specialist.davidKumar'),
    specialistAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    specialistRating: 4.7,
    date: '2024-01-05',
    time: '11:00',
    duration: 90,
    price: 1000,
    currency: 'UAH',
    status: 'cancelled',
    location: {
      type: 'specialist_location',
      address: t('location.zenWellness'),
    },
    canCancel: false,
    canReschedule: false,
    hasReview: false,
  },
];

const CustomerBookings: React.FC = () => {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBookings(getMockBookings(t));
      setIsLoading(false);
    }, 1000);
  }, [t]);

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'upcoming') return booking.status === 'upcoming' || booking.status === 'in_progress';
    if (activeTab === 'past') return booking.status === 'completed';
    if (activeTab === 'cancelled') return booking.status === 'cancelled';
    return false;
  });

  const handleCancelBooking = (bookingId: string) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as const, canCancel: false, canReschedule: false }
          : booking
      )
    );
  };

  const handleRescheduleBooking = (bookingId: string) => {
    // In a real app, this would open a reschedule modal/flow
    alert(t('booking.rescheduleAlert'));
  };

  const handleLeaveReview = (bookingId: string) => {
    // In a real app, this would open a review modal
    alert(t('booking.reviewAlert'));
  };

  const handleBookAgain = (booking: Booking) => {
    // In a real app, this would redirect to the service booking page
    alert(`${t('common.book')} ${t('common.again')}: ${booking.serviceName}`);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('customer.bookings.title')}
          </h1>
          <p className="text-gray-600">
            {t('customer.bookings.subtitle')}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
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
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
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
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'upcoming' && t('customer.bookings.noUpcoming')}
              {activeTab === 'past' && t('customer.bookings.noPast')}
              {activeTab === 'cancelled' && t('empty.noCancelledBookings')}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'upcoming' && t('empty.bookFirstService')}
              {activeTab === 'past' && t('empty.completedBookingsHere')}
              {activeTab === 'cancelled' && t('empty.cancelledBookingsHere')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Specialist Avatar */}
                      <img
                        src={booking.specialistAvatar}
                        alt={booking.specialistName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      
                      {/* Booking Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {booking.serviceName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <UserIcon className="h-4 w-4 mr-1" />
                          <span className="mr-4">{booking.specialistName}</span>
                          <div className="flex items-center">
                            <StarIconSolid className="h-4 w-4 text-yellow-400 mr-1" />
                            <span>{booking.specialistRating}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          <span className="mr-4">{formatDate(booking.date)}</span>
                          <ClockIcon className="h-4 w-4 mr-1" />
                          <span>{formatTime(booking.time)} ({booking.duration} min)</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <MapPinIcon className="h-4 w-4 mr-1" />
                                                  <span>
                          {booking.location.type === 'online' ? t('booking.onlineSession') : booking.location.address}
                        </span>
                        </div>
                        
                        {booking.notes && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">{t('booking.notes')}:</span> {booking.notes}
                          </div>
                        )}
                        
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(booking.price)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {t('customer.bookings.viewDetails')}
                        </button>
                        
                        {booking.location.type !== 'online' && (
                          <button className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center">
                            <PhoneIcon className="h-4 w-4 mr-1" />
                            {t('common.call')}
                          </button>
                        )}
                        
                        <button className="text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center">
                          <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                          {t('common.message')}
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {booking.canReschedule && (
                          <button
                            onClick={() => handleRescheduleBooking(booking.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            {t('customer.bookings.reschedule')}
                          </button>
                        )}
                        
                        {booking.canCancel && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            {t('customer.bookings.cancel')}
                          </button>
                        )}
                        
                        {booking.status === 'completed' && !booking.hasReview && (
                          <button
                            onClick={() => handleLeaveReview(booking.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-yellow-300 shadow-sm text-xs font-medium rounded-md text-yellow-700 bg-white hover:bg-yellow-50"
                          >
                            <StarIcon className="h-4 w-4 mr-1" />
                            {t('customer.bookings.leaveReview')}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t('booking.details')}</h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('booking.service')}</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.serviceName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('booking.specialist')}</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedBooking.specialistName}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('booking.date')}</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('booking.time')}</label>
                    <p className="mt-1 text-sm text-gray-900">{formatTime(selectedBooking.time)}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('booking.location')}</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedBooking.location.type === 'online' 
                      ? t('booking.onlineSession')
                      : selectedBooking.location.address
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('booking.price')}</label>
                  <p className="mt-1 text-sm text-gray-900">{formatPrice(selectedBooking.price)}</p>
                </div>
                
                {selectedBooking.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">{t('booking.notes')}</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBooking.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerBookings;