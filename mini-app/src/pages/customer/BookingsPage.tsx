import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar,
  Clock,
  MapPin,
  Star,
  MoreVertical,
  Phone,
  MessageCircle,
  Navigation,
  RefreshCw,
  X,
  Check
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Sheet } from '@/components/ui/Sheet';
import { useTelegram } from '@/components/telegram/TelegramProvider';

// Mock data - replace with actual API calls
const mockBookings = [
  {
    id: '1',
    status: 'confirmed',
    date: '2024-01-15',
    time: '14:00',
    service: {
      name: 'Hair Styling & Color',
      duration: 120,
      price: 85
    },
    specialist: {
      name: 'Sarah Johnson',
      avatar: '/api/placeholder/60/60',
      rating: 4.9,
      phone: '+1234567890',
      location: 'Downtown Beauty Studio'
    }
  },
  {
    id: '2',
    status: 'pending',
    date: '2024-01-18',
    time: '10:30',
    service: {
      name: 'Deep Tissue Massage',
      duration: 60,
      price: 120
    },
    specialist: {
      name: 'Michael Chen',
      avatar: '/api/placeholder/60/60',
      rating: 4.8,
      phone: '+1234567891',
      location: 'Zen Wellness Center'
    }
  },
  {
    id: '3',
    status: 'completed',
    date: '2024-01-10',
    time: '16:00',
    service: {
      name: 'Personal Training',
      duration: 45,
      price: 75
    },
    specialist: {
      name: 'Emma Rodriguez',
      avatar: '/api/placeholder/60/60',
      rating: 4.9,
      phone: '+1234567892',
      location: 'FitLife Gym'
    },
    canReview: true
  }
];

const statusConfig = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-green-100 text-green-800',
    icon: Check
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-blue-100 text-blue-800',
    icon: Check
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800',
    icon: X
  }
};

export const BookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    hapticFeedback, 
    showAlert, 
    showConfirm, 
    openLink 
  } = useTelegram();

  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);

  const filteredBookings = mockBookings.filter(booking => {
    const bookingDate = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    
    if (selectedTab === 'upcoming') {
      return bookingDate >= now || booking.status === 'pending' || booking.status === 'confirmed';
    } else {
      return bookingDate < now || booking.status === 'completed' || booking.status === 'cancelled';
    }
  });

  const handleTabChange = (tab: 'upcoming' | 'past') => {
    setSelectedTab(tab);
    hapticFeedback.selectionChanged();
  };

  const handleBookingPress = (booking: any) => {
    setSelectedBooking(booking);
    setShowBookingSheet(true);
    hapticFeedback.impactLight();
  };

  const handleCallSpecialist = (phone: string) => {
    openLink(`tel:${phone}`);
    hapticFeedback.impactLight();
  };

  const handleMessageSpecialist = async () => {
    await showAlert('This will send a message via the bot. Feature coming soon!');
    hapticFeedback.impactLight();
  };

  const handleGetDirections = (location: string) => {
    // Use Telegram's location sharing or external maps
    openLink(`https://maps.google.com/?q=${encodeURIComponent(location)}`);
    hapticFeedback.impactLight();
  };

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = await showConfirm('Are you sure you want to cancel this booking?');
    
    if (confirmed) {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        await showAlert('Booking cancelled successfully.');
        hapticFeedback.notificationSuccess();
        setShowBookingSheet(false);
      } catch (error) {
        await showAlert('Failed to cancel booking. Please try again.');
        hapticFeedback.notificationError();
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleRescheduleBooking = (bookingId: string) => {
    setShowBookingSheet(false);
    navigate(`/booking/reschedule/${bookingId}`);
    hapticFeedback.impactLight();
  };

  const handleLeaveReview = (bookingId: string) => {
    setShowBookingSheet(false);
    navigate(`/booking/review/${bookingId}`);
    hapticFeedback.impactLight();
  };

  const formatDate = (dateString: string, timeString: string) => {
    const date = new Date(`${dateString}T${timeString}`);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      })
    };
  };

  const renderBookingCard = (booking: any) => {
    const StatusIcon = statusConfig[booking.status as keyof typeof statusConfig]?.icon || Clock;
    const formatted = formatDate(booking.date, booking.time);

    return (
      <Card
        key={booking.id}
        hover
        onClick={() => handleBookingPress(booking)}
        className="mb-3"
      >
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <img
              src={booking.specialist.avatar}
              alt={booking.specialist.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-primary truncate">
                {booking.service.name}
              </h3>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[booking.status as keyof typeof statusConfig]?.color}`}>
                <div className="flex items-center gap-1">
                  <StatusIcon size={10} />
                  {statusConfig[booking.status as keyof typeof statusConfig]?.label}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-secondary mb-2">
              {booking.specialist.name}
            </p>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar size={14} className="text-secondary" />
                <span>{formatted.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-secondary" />
                <span>{formatted.time}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-accent">
                ${booking.service.price}
              </span>
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-current" />
                <span className="text-sm">{booking.specialist.rating}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderBookingDetails = () => {
    if (!selectedBooking) return null;

    const formatted = formatDate(selectedBooking.date, selectedBooking.time);
    const canCancel = selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed';
    const canReschedule = selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed';

    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3">
            <img
              src={selectedBooking.specialist.avatar}
              alt={selectedBooking.specialist.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-lg font-semibold text-primary">
            {selectedBooking.service.name}
          </h3>
          <p className="text-secondary">{selectedBooking.specialist.name}</p>
        </div>

        <Card>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary">Date:</span>
              <span className="font-medium">{formatted.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Time:</span>
              <span className="font-medium">{formatted.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Duration:</span>
              <span className="font-medium">{selectedBooking.service.duration} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Price:</span>
              <span className="font-medium text-accent">${selectedBooking.service.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Status:</span>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedBooking.status as keyof typeof statusConfig]?.color}`}>
                {statusConfig[selectedBooking.status as keyof typeof statusConfig]?.label}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={18} className="text-secondary" />
            <div>
              <p className="font-medium text-primary">{selectedBooking.specialist.location}</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => handleCallSpecialist(selectedBooking.specialist.phone)}
              className="flex items-center justify-center gap-2"
            >
              <Phone size={16} />
              Call
            </Button>
            
            <Button
              variant="secondary"
              onClick={handleMessageSpecialist}
              className="flex items-center justify-center gap-2"
            >
              <MessageCircle size={16} />
              Message
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={() => handleGetDirections(selectedBooking.specialist.location)}
            fullWidth
            className="flex items-center justify-center gap-2"
          >
            <Navigation size={16} />
            Get Directions
          </Button>

          {canReschedule && (
            <Button
              variant="secondary"
              onClick={() => handleRescheduleBooking(selectedBooking.id)}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Reschedule
            </Button>
          )}

          {selectedBooking.canReview && (
            <Button
              onClick={() => handleLeaveReview(selectedBooking.id)}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              <Star size={16} />
              Leave Review
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => handleCancelBooking(selectedBooking.id)}
              fullWidth
              loading={isLoading}
              className="flex items-center justify-center gap-2"
            >
              <X size={16} />
              Cancel Booking
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading && !showBookingSheet) {
    return (
      <div className="flex flex-col min-h-screen bg-primary">
        <Header title="My Bookings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4 mx-auto" />
            <p className="text-secondary">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Header 
        title="My Bookings"
        rightContent={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/booking')}
          >
            Book New
          </Button>
        }
      />

      {/* Tabs */}
      <div className="px-4 py-3 bg-header">
        <div className="flex bg-secondary rounded-lg p-1">
          <button
            onClick={() => handleTabChange('upcoming')}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors touch-manipulation
              ${selectedTab === 'upcoming' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-secondary'
              }
            `}
          >
            Upcoming
          </button>
          <button
            onClick={() => handleTabChange('past')}
            className={`
              flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors touch-manipulation
              ${selectedTab === 'past' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-secondary'
              }
            `}
          >
            Past
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">
              No {selectedTab} bookings
            </h3>
            <p className="text-secondary mb-4">
              {selectedTab === 'upcoming' 
                ? "You don't have any upcoming appointments."
                : "You haven't completed any bookings yet."
              }
            </p>
            {selectedTab === 'upcoming' && (
              <Button onClick={() => navigate('/')}>
                Find Services
              </Button>
            )}
          </div>
        ) : (
          <div>
            {filteredBookings.map(renderBookingCard)}
          </div>
        )}
      </div>

      {/* Booking Details Sheet */}
      <Sheet
        isOpen={showBookingSheet}
        onClose={() => setShowBookingSheet(false)}
        height="auto"
      >
        {renderBookingDetails()}
      </Sheet>
    </div>
  );
};