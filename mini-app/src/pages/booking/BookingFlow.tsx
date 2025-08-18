import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Calendar,
  Clock, 
  MapPin, 
  Star, 
  ChevronRight,
  Check,
  User,
  Phone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';

interface BookingStep {
  id: string;
  title: string;
  completed: boolean;
}

const bookingSteps: BookingStep[] = [
  { id: 'service', title: 'Select Service', completed: false },
  { id: 'datetime', title: 'Date & Time', completed: false },
  { id: 'details', title: 'Details', completed: false },
  { id: 'payment', title: 'Payment', completed: false }
];

// Mock data - replace with actual API calls
const mockService = {
  id: '1',
  name: 'Hair Styling & Color',
  description: 'Professional hair styling and coloring service',
  duration: 120,
  price: 85,
  specialist: {
    id: '1',
    name: 'Sarah Johnson',
    avatar: '/api/placeholder/100/100',
    rating: 4.9,
    reviews: 127,
    location: 'Downtown Beauty Studio, 123 Main St'
  }
};

const mockAvailableSlots = [
  { date: '2024-01-15', slots: ['09:00', '10:30', '14:00', '15:30', '17:00'] },
  { date: '2024-01-16', slots: ['09:00', '11:00', '13:30', '16:00'] },
  { date: '2024-01-17', slots: ['10:00', '12:00', '14:30', '17:30'] }
];

export const BookingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    user, 
    mainButton, 
    backButton, 
    hapticFeedback,
    showAlert,
    showConfirm 
  } = useTelegram();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingDetails, setBookingDetails] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    notes: ''
  });

  const serviceId = searchParams.get('serviceId');
  const specialistId = searchParams.get('specialistId');

  // Configure Telegram UI
  useEffect(() => {
    backButton.show();
    backButton.onClick(handleBack);
    
    return () => {
      backButton.hide();
      backButton.offClick(handleBack);
      mainButton.hide();
    };
  }, []);

  // Update main button based on current step
  useEffect(() => {
    updateMainButton();
  }, [currentStep, selectedDate, selectedTime, bookingDetails]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      hapticFeedback.impactLight();
    } else {
      navigate(-1);
    }
  };

  const updateMainButton = () => {
    const step = bookingSteps[currentStep];
    
    switch (step.id) {
      case 'service':
        mainButton.setText('Continue');
        mainButton.show();
        mainButton.onClick(handleServiceNext);
        break;
        
      case 'datetime':
        if (selectedDate && selectedTime) {
          mainButton.setText('Continue');
          mainButton.show();
          mainButton.onClick(handleDateTimeNext);
        } else {
          mainButton.hide();
        }
        break;
        
      case 'details':
        if (bookingDetails.firstName && bookingDetails.phone) {
          mainButton.setText('Continue');
          mainButton.show();
          mainButton.onClick(handleDetailsNext);
        } else {
          mainButton.hide();
        }
        break;
        
      case 'payment':
        mainButton.setText('Book & Pay');
        mainButton.show();
        mainButton.onClick(handlePayment);
        break;
    }
  };

  const handleServiceNext = () => {
    setCurrentStep(1);
    hapticFeedback.impactLight();
  };

  const handleDateTimeNext = () => {
    setCurrentStep(2);
    hapticFeedback.impactLight();
  };

  const handleDetailsNext = () => {
    setCurrentStep(3);
    hapticFeedback.impactLight();
  };

  const handlePayment = async () => {
    const confirmed = await showConfirm(
      `Confirm booking for ${selectedDate} at ${selectedTime}?`
    );
    
    if (confirmed) {
      setIsLoading(true);
      mainButton.showProgress();
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await showAlert('Booking confirmed! You will receive a confirmation message.');
        hapticFeedback.notificationSuccess();
        navigate('/bookings');
      } catch (error) {
        await showAlert('Booking failed. Please try again.');
        hapticFeedback.notificationError();
      } finally {
        setIsLoading(false);
        mainButton.hideProgress();
      }
    }
  };

  const handleTimeSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    hapticFeedback.selectionChanged();
  };

  const handleInputChange = (field: string, value: string) => {
    setBookingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStepIndicator = () => (
    <div className="px-4 py-3 bg-header">
      <div className="flex items-center justify-between">
        {bookingSteps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${index < bookingSteps.length - 1 ? 'flex-1' : ''}`}
          >
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index < currentStep ? 'bg-accent text-white' : 
                  index === currentStep ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'}
              `}
            >
              {index < currentStep ? <Check size={16} /> : index + 1}
            </div>
            {index < bookingSteps.length - 1 && (
              <div 
                className={`h-0.5 flex-1 mx-2 ${
                  index < currentStep ? 'bg-accent' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2">
        <p className="text-sm font-medium text-primary">
          {bookingSteps[currentStep].title}
        </p>
      </div>
    </div>
  );

  const renderServiceStep = () => (
    <div className="p-4 space-y-4">
      <Card>
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-lg bg-gray-200 flex-shrink-0">
            <img
              src="/api/placeholder/80/80"
              alt={mockService.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-primary mb-1">
              {mockService.name}
            </h3>
            <p className="text-sm text-secondary mb-2">
              {mockService.description}
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Clock size={14} className="text-secondary" />
                <span>{mockService.duration}min</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-accent">${mockService.price}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <img
              src={mockService.specialist.avatar}
              alt={mockService.specialist.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-primary">
              {mockService.specialist.name}
            </h4>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Star size={12} className="text-yellow-400 fill-current" />
                <span>{mockService.specialist.rating}</span>
                <span className="text-secondary">({mockService.specialist.reviews})</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-secondary mt-1">
              <MapPin size={12} />
              <span>{mockService.specialist.location}</span>
            </div>
          </div>
          
          <ChevronRight size={18} className="text-secondary" />
        </div>
      </Card>
    </div>
  );

  const renderDateTimeStep = () => (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-primary mb-3">Select Date & Time</h3>
        
        <div className="space-y-4">
          {mockAvailableSlots.map((daySlots) => (
            <Card key={daySlots.date}>
              <div className="mb-3">
                <h4 className="font-medium text-primary">
                  {formatDate(daySlots.date)}
                </h4>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {daySlots.slots.map((time) => (
                  <button
                    key={`${daySlots.date}-${time}`}
                    onClick={() => handleTimeSlotSelect(daySlots.date, time)}
                    className={`
                      py-2 px-3 rounded-lg text-sm font-medium transition-colors touch-manipulation
                      ${selectedDate === daySlots.date && selectedTime === time
                        ? 'bg-accent text-white'
                        : 'bg-secondary text-primary hover:bg-accent hover:text-white'
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedDate && selectedTime && (
        <Card className="bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                {formatDate(selectedDate)} at {selectedTime}
              </p>
              <p className="text-sm text-green-600">
                Duration: {mockService.duration} minutes
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-primary mb-3">Contact Information</h3>
        
        <div className="space-y-4">
          <Input
            label="First Name *"
            value={bookingDetails.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            icon={<User size={18} />}
            placeholder="Enter your first name"
            required
          />
          
          <Input
            label="Last Name"
            value={bookingDetails.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            icon={<User size={18} />}
            placeholder="Enter your last name"
          />
          
          <Input
            label="Phone Number *"
            type="tel"
            value={bookingDetails.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            icon={<Phone size={18} />}
            placeholder="Enter your phone number"
            required
          />
          
          <Input
            label="Email"
            type="email"
            value={bookingDetails.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            icon={<Mail size={18} />}
            placeholder="Enter your email"
          />
          
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Special Notes
            </label>
            <textarea
              value={bookingDetails.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any special requests or notes..."
              rows={3}
              className="input-telegram resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="p-4 space-y-4">
      <Card>
        <h3 className="font-semibold text-primary mb-3">Booking Summary</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-secondary">Service:</span>
            <span className="font-medium text-primary">{mockService.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-secondary">Specialist:</span>
            <span className="font-medium text-primary">{mockService.specialist.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-secondary">Date & Time:</span>
            <span className="font-medium text-primary">
              {selectedDate && formatDate(selectedDate)} at {selectedTime}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-secondary">Duration:</span>
            <span className="font-medium text-primary">{mockService.duration} min</span>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between text-lg font-semibold">
              <span className="text-primary">Total:</span>
              <span className="text-accent">${mockService.price}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h4 className="font-medium text-primary mb-3">Payment Method</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-800">Telegram Payments</p>
              <p className="text-sm text-blue-600">Secure payment via Telegram</p>
            </div>
            <div className="w-4 h-4 rounded-full bg-blue-600" />
          </div>
        </div>
      </Card>

      {bookingDetails.notes && (
        <Card>
          <h4 className="font-medium text-primary mb-2">Special Notes</h4>
          <p className="text-secondary">{bookingDetails.notes}</p>
        </Card>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (bookingSteps[currentStep].id) {
      case 'service':
        return renderServiceStep();
      case 'datetime':
        return renderDateTimeStep();
      case 'details':
        return renderDetailsStep();
      case 'payment':
        return renderPaymentStep();
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-primary">
        <Header title="Processing..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mb-4 mx-auto" />
            <p className="text-secondary">Processing your booking...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-primary">
      <Header title="Book Appointment" />
      
      {renderStepIndicator()}
      
      <div className="flex-1 overflow-y-auto pb-20">
        {renderCurrentStep()}
      </div>
    </div>
  );
};