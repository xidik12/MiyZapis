import React, { useState, useEffect } from 'react';
import { 
  CalendarIcon, 
  ClockIcon, 
  PlusIcon, 
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { isFeatureEnabled } from '../../config/features';

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reason?: string;
  isRecurring: boolean;
  recurringDays?: string[];
}

interface AddTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeSlot: Omit<TimeSlot, 'id'>) => void;
  editingSlot?: TimeSlot | null;
}

const AddTimeModal: React.FC<AddTimeModalProps> = ({ isOpen, onClose, onSave, editingSlot }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    isAvailable: true,
    reason: '',
    isRecurring: false,
    recurringDays: [] as string[]
  });

  useEffect(() => {
    if (editingSlot) {
      setFormData({
        date: editingSlot.date,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
        isAvailable: editingSlot.isAvailable,
        reason: editingSlot.reason || '',
        isRecurring: editingSlot.isRecurring,
        recurringDays: editingSlot.recurringDays || []
      });
    } else {
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        isAvailable: true,
        reason: '',
        isRecurring: false,
        recurringDays: []
      });
    }
  }, [editingSlot, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const toggleRecurringDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays.includes(day) 
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day]
    }));
  };

  const weekDays = [
    { key: 'monday' },
    { key: 'tuesday' },
    { key: 'wednesday' },
    { key: 'thursday' },
    { key: 'friday' },
    { key: 'saturday' },
    { key: 'sunday' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingSlot ? t('schedule.editTimeSlot') : t('schedule.addTimeSlot')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('schedule.date')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.startTime')}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.endTime')}
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('schedule.availableForBooking')}</span>
              </label>
            </div>

            {!formData.isAvailable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.reasonUnavailable')}
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder={t('schedule.reasonPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t('schedule.repeatWeekly')}</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.repeatOnDays')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {weekDays.map(day => (
                    <label key={day.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.recurringDays.includes(day.key)}
                        onChange={() => toggleRecurringDay(day.key)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{t(`schedule.${day.key}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('schedule.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingSlot ? t('schedule.update') : t('schedule.add')} {t('schedule.addTimeSlot')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const SpecialistSchedule: React.FC = () => {
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate default schedule from working hours
  const generateDefaultSchedule = (workingHours: any): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const today = new Date();
    
    // Generate slots for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Check if the specialist works on this day
      if (workingHours && workingHours[dayName] && workingHours[dayName].isWorking) {
        const startTime = workingHours[dayName].startTime || '09:00';
        const endTime = workingHours[dayName].endTime || '17:00';
        
        // Create hourly slots
        const start = new Date(`2000-01-01T${startTime}:00`);
        const end = new Date(`2000-01-01T${endTime}:00`);
        
        while (start < end) {
          const slotStart = start.toTimeString().substring(0, 5);
          start.setHours(start.getHours() + 1);
          const slotEnd = start.toTimeString().substring(0, 5);
          
          slots.push({
            id: `default-${date.toISOString().split('T')[0]}-${slotStart}`,
            date: date.toISOString().split('T')[0],
            startTime: slotStart,
            endTime: slotEnd,
            isAvailable: true,
            reason: '',
            isRecurring: false,
          });
        }
      }
    }
    
    return slots;
  };

  // Load blocked slots from API
  useEffect(() => {
    const loadAvailabilityBlocks = async () => {
      if (!isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
        setLoading(false);
        setError(null);
        setTimeSlots([]); // Empty schedule until API is ready
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get all availability blocks for the next 30 days
        const startDate = new Date().toISOString().split('T')[0];
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const availabilityBlocks = await specialistService.getAvailabilityBlocks(startDate, endDate);
        console.log('📦 Schedule: Availability blocks received:', availabilityBlocks);
        
        // Convert availability blocks to time slots format
        let formattedSlots: TimeSlot[] = Array.isArray(availabilityBlocks) && availabilityBlocks.length > 0 
          ? availabilityBlocks.map(block => ({
              id: block.id,
              date: block.startDateTime?.split('T')[0] || new Date().toISOString().split('T')[0],
              startTime: block.startDateTime?.split('T')[1]?.substring(0, 5) || '09:00',
              endTime: block.endDateTime?.split('T')[1]?.substring(0, 5) || '10:00',
              isAvailable: block.isAvailable !== false, // Default to available
              reason: block.reason || '',
              isRecurring: block.recurring || block.isRecurring || false,
            }))
          : [];
        
        // If no availability blocks, generate default schedule from working hours
        if (formattedSlots.length === 0) {
          console.log('📅 Schedule: No availability blocks, generating default schedule from working hours');
          formattedSlots = generateDefaultSchedule(user?.workingHours);
          console.log('📅 Schedule: Generated default slots:', formattedSlots.length);
        }
        
        setTimeSlots(formattedSlots);
      } catch (err: any) {
        setError(err.message || 'Failed to load schedule');
        console.error('Error loading availability blocks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAvailabilityBlocks();
  }, [user]);

  const handleAddTimeSlot = async (newSlot: Omit<TimeSlot, 'id'>) => {
    if (!isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
      console.warn('Schedule API is disabled. Enable ENABLE_SPECIALIST_SCHEDULE_API to use this feature.');
      return;
    }

    try {
      const startDateTime = `${newSlot.date}T${newSlot.startTime}:00`;
      const endDateTime = `${newSlot.date}T${newSlot.endTime}:00`;
      
      // Use the correct API based on whether this is an available or blocked slot
      const result = await specialistService.createAvailabilityBlock({
        startDateTime,
        endDateTime,
        isAvailable: newSlot.isAvailable,
        reason: newSlot.reason || (newSlot.isAvailable ? 'Available time' : 'Blocked time'),
        recurring: newSlot.isRecurring,
        recurringDays: newSlot.recurringDays || [],
      });
      
      const slot: TimeSlot = {
        id: result.block.id,
        ...newSlot,
      };
      
      setTimeSlots(prev => [...prev, slot].sort((a, b) => 
        new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime()
      ));
    } catch (err: any) {
      console.error('Error adding time slot:', err);
      setError(err.message || 'Failed to add time slot');
    }
  };

  const handleEditTimeSlot = async (updatedSlot: Omit<TimeSlot, 'id'>) => {
    if (!editingSlot) return;
    
    if (!isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
      console.warn('Schedule API is disabled. Enable ENABLE_SPECIALIST_SCHEDULE_API to use this feature.');
      return;
    }
    
    try {
      const startDateTime = `${updatedSlot.date}T${updatedSlot.startTime}:00`;
      const endDateTime = `${updatedSlot.date}T${updatedSlot.endTime}:00`;
      
      // Use the update API to modify the existing availability block
      const result = await specialistService.updateAvailabilityBlock(editingSlot.id, {
        startDateTime,
        endDateTime,
        isAvailable: updatedSlot.isAvailable,
        reason: updatedSlot.reason || (updatedSlot.isAvailable ? 'Available time' : 'Blocked time'),
        recurring: updatedSlot.isRecurring,
        recurringDays: updatedSlot.recurringDays || [],
      });
      
      setTimeSlots(prev => prev.map(slot => 
        slot.id === editingSlot.id 
          ? { ...updatedSlot, id: result.block.id }
          : slot
      ).sort((a, b) => 
        new Date(a.date + ' ' + a.startTime).getTime() - new Date(b.date + ' ' + b.startTime).getTime()
      ));
      
      setEditingSlot(null);
    } catch (err: any) {
      console.error('Error editing time slot:', err);
      setError(err.message || 'Failed to edit time slot');
    }
  };

  const handleDeleteTimeSlot = async (id: string) => {
    if (!isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
      console.warn('Schedule API is disabled. Enable ENABLE_SPECIALIST_SCHEDULE_API to use this feature.');
      return;
    }
    
    try {
      await specialistService.deleteAvailabilityBlock(id);
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
    } catch (err: any) {
      console.error('Error deleting time slot:', err);
      setError(err.message || 'Failed to delete time slot');
    }
  };

  const openEditModal = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setShowAddModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];
    
    const weekday = t(`weekday.${weekdays[date.getDay()]}`);
    const month = t(`month.${months[date.getMonth()]}`);
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${weekday}, ${month} ${day}, ${year}`;
  };

  const translateReason = (reason: string) => {
    // Map common English reasons to translation keys
    const reasonMapping: { [key: string]: string } = {
      'Personal appointment': 'schedule.personalAppointment',
    };
    
    return reasonMapping[reason] ? t(reasonMapping[reason]) : reason;
  };

  const getUpcomingSlots = () => {
    const today = new Date().toISOString().split('T')[0];
    return timeSlots.filter(slot => slot.date >= today).slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading schedule</div>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.nav.schedule')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('schedule.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>{t('schedule.addTime')}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('schedule.availableSlots')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {timeSlots.filter(slot => slot.isAvailable).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <XMarkIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('schedule.blockedSlots')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {timeSlots.filter(slot => !slot.isAvailable).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('schedule.totalSlots')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{timeSlots.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('schedule.upcomingSchedule')}</h2>
        </div>
        
        <div className="p-6">
          {getUpcomingSlots().length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('schedule.noScheduleSet')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('schedule.noScheduleDescription')}
              </p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('schedule.addFirstSlot')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {getUpcomingSlots().map((slot) => (
                <div 
                  key={slot.id}
                  className={`p-4 rounded-lg border-2 ${
                    slot.isAvailable 
                      ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' 
                      : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        slot.isAvailable 
                          ? 'bg-green-100 dark:bg-green-800' 
                          : 'bg-red-100 dark:bg-red-800'
                      }`}>
                        {slot.isAvailable ? (
                          <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {formatDate(slot.date)}
                          </h3>
                          {slot.isRecurring && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                              {t('schedule.recurring')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        {slot.reason && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {translateReason(slot.reason)}
                          </p>
                        )}
                        {slot.isRecurring && slot.recurringDays && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {t('schedule.repeats')}: {slot.recurringDays.map(day => t(`schedule.${day}`)).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(slot)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTimeSlot(slot.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Time Modal */}
      <AddTimeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingSlot(null);
        }}
        onSave={editingSlot ? handleEditTimeSlot : handleAddTimeSlot}
        editingSlot={editingSlot}
      />
    </div>
  );
};

export default SpecialistSchedule;