import React, { useState, useEffect } from 'react';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { bookingService } from '../../services/booking.service';
import { isFeatureEnabled } from '../../config/features';
import { retryRequest } from '../../services/api';

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

interface CalendarBlock {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  isAvailable: boolean;
  reason?: string;
  isRecurring: boolean;
  recurringDays?: string[];
}

interface AddTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editingBlock?: CalendarBlock | null;
  preSelectedDate?: Date;
  preSelectedTime?: string;
}

const AddTimeModal: React.FC<AddTimeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBlock,
  preSelectedDate,
  preSelectedTime
}) => {
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
    if (editingBlock) {
      const start = new Date(editingBlock.startDateTime);
      const end = new Date(editingBlock.endDateTime);

      setFormData({
        date: start.toISOString().split('T')[0],
        startTime: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
        endTime: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
        isAvailable: editingBlock.isAvailable,
        reason: editingBlock.reason || '',
        isRecurring: editingBlock.isRecurring,
        recurringDays: editingBlock.recurringDays || []
      });
    } else if (preSelectedDate) {
      setFormData({
        date: preSelectedDate.toISOString().split('T')[0],
        startTime: preSelectedTime || '09:00',
        endTime: preSelectedTime ? calculateEndTime(preSelectedTime, 60) : '10:00',
        isAvailable: true,
        reason: '',
        isRecurring: false,
        recurringDays: []
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
  }, [editingBlock, preSelectedDate, preSelectedTime, isOpen]);

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-auto my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {editingBlock ? t('schedule.editTimeSlot') : t('schedule.addTimeSlot')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg touch-manipulation"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
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
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.startTime')}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base"
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center cursor-pointer py-3">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{t('schedule.availableForBooking')}</span>
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
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base"
                />
              </div>
            )}

            <div>
              <label className="flex items-center cursor-pointer py-3">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{t('schedule.repeatWeekly')}</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.repeatOnDays')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {weekDays.map(day => (
                    <label key={day.key} className="flex items-center cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={formData.recurringDays.includes(day.key)}
                        onChange={() => toggleRecurringDay(day.key)}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{t(`schedule.${day.key}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                {t('schedule.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                {editingBlock ? t('schedule.update') : t('schedule.add')}
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
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<CalendarBlock[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>();
  const [preSelectedTime, setPreSelectedTime] = useState<string | undefined>();
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [expandedHours, setExpandedHours] = useState<Record<string, boolean>>({});

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  function getWeekDays(weekStart: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }

  function goToPreviousWeek() {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  }

  function goToNextWeek() {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  }

  function goToToday() {
    setCurrentWeekStart(getWeekStart(new Date()));
  }

  function getFormattedDateRange(startDate: Date, endDate: Date): string {
    const months = ['january', 'february', 'march', 'april', 'may', 'june',
                   'july', 'august', 'september', 'october', 'november', 'december'];

    const startMonth = t(`month.${months[startDate.getMonth()]}`) || months[startDate.getMonth()];
    const endMonth = t(`month.${months[endDate.getMonth()]}`) || months[endDate.getMonth()];
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();

    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startMonth} ${startDay} - ${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  }

  const weekDays = getWeekDays(currentWeekStart);
  const timeSlots = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours

  // Generate 15-minute time slots for a day (from 00:00 to 23:45)
  const generate15MinSlots = () => {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const fifteenMinSlots = generate15MinSlots();

  // Load availability blocks
  useEffect(() => {
    const loadAvailabilityBlocks = async () => {
      if (!isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
        setLoading(false);
        setError(null);
        setAvailabilityBlocks([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get all availability blocks for the week
        const startDate = weekDays[0].toISOString().split('T')[0];
        const endDate = weekDays[6].toISOString().split('T')[0];

        const blocks = await retryRequest(
          () => specialistService.getAvailabilityBlocks(startDate, endDate),
          3,
          2000
        );

        if (Array.isArray(blocks) && blocks.length > 0) {
          const formattedBlocks = blocks.map(block => ({
            id: block.id,
            startDateTime: new Date(block.startDateTime),
            endDateTime: new Date(block.endDateTime),
            isAvailable: block.isAvailable !== false,
            reason: block.reason || '',
            isRecurring: block.isRecurring || block.recurring || false,
            recurringDays: block.recurringDays || [],
          }));
          setAvailabilityBlocks(formattedBlocks);
        } else {
          setAvailabilityBlocks([]);
        }
      } catch (err: any) {
        console.error('Error loading availability blocks:', err);
        setError(err.message || 'Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };

    loadAvailabilityBlocks();
  }, [currentWeekStart]);

  // Load bookings for the week
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const startDate = weekDays[0].toISOString().split('T')[0];
        const endDate = weekDays[6].toISOString().split('T')[0];

        const result = await bookingService.getBookings({
          startDate,
          endDate,
          status: ['PENDING', 'CONFIRMED'], // Only show upcoming bookings
        });

        setBookings(result.bookings || []);
      } catch (err) {
        console.error('Error loading bookings:', err);
      }
    };

    loadBookings();
  }, [currentWeekStart]);

  // Check if we should prompt to generate availability from working hours
  useEffect(() => {
    if (!loading && availabilityBlocks.length === 0 && user?.workingHours) {
      // User has working hours but no availability blocks - offer to generate
      setShowGeneratePrompt(true);
    }
  }, [loading, availabilityBlocks.length, user?.workingHours]);

  const handleGenerateFromWorkingHours = async () => {
    if (!isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
      return;
    }

    setOperationInProgress(true);
    setShowGeneratePrompt(false);
    try {
      await retryRequest(
        () => specialistService.generateAvailabilityFromWorkingHours(),
        2,
        1500
      );

      // Reload availability blocks
      const startDate = weekDays[0].toISOString().split('T')[0];
      const endDate = weekDays[6].toISOString().split('T')[0];

      const blocks = await retryRequest(
        () => specialistService.getAvailabilityBlocks(startDate, endDate),
        3,
        2000
      );

      if (Array.isArray(blocks) && blocks.length > 0) {
        const formattedBlocks = blocks.map(block => ({
          id: block.id,
          startDateTime: new Date(block.startDateTime),
          endDateTime: new Date(block.endDateTime),
          isAvailable: block.isAvailable !== false,
          reason: block.reason || '',
          isRecurring: block.isRecurring || block.recurring || false,
          recurringDays: block.recurringDays || [],
        }));
        setAvailabilityBlocks(formattedBlocks);
      }

      setError(null);
    } catch (err: any) {
      console.error('Error generating availability:', err);
      setError(err.message || 'Failed to generate availability from working hours');
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleAddTimeSlot = async (formData: any) => {
    if (!isFeatureEnabled('ENABLE_SPECIALIST_SCHEDULE_API')) {
      return;
    }

    setOperationInProgress(true);
    try {
      // Create local datetime and convert to ISO string (preserves local timezone)
      const startDate = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDate = new Date(`${formData.date}T${formData.endTime}:00`);
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();

      const result = await retryRequest(
        () => specialistService.createAvailabilityBlock({
          startDateTime,
          endDateTime,
          isAvailable: formData.isAvailable,
          reason: formData.reason || (formData.isAvailable ? 'Available time' : 'Blocked time'),
          recurring: formData.isRecurring,
          recurringDays: formData.recurringDays || [],
        }),
        2,
        1500
      );

      const newBlock: CalendarBlock = {
        id: result.block.id,
        startDateTime: new Date(result.block.startDateTime),
        endDateTime: new Date(result.block.endDateTime),
        isAvailable: result.block.isAvailable,
        reason: result.block.reason,
        isRecurring: result.block.isRecurring,
        recurringDays: result.block.recurringDays,
      };

      setAvailabilityBlocks(prev => [...prev, newBlock]);
      setError(null);
      setPreSelectedDate(undefined);
      setPreSelectedTime(undefined);
    } catch (err: any) {
      console.error('Error adding time slot:', err);
      setError(err.message || 'Failed to add time slot');
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleEditTimeSlot = async (formData: any) => {
    if (!editingBlock) return;

    setOperationInProgress(true);
    try {
      // Create local datetime and convert to ISO string (preserves local timezone)
      const startDate = new Date(`${formData.date}T${formData.startTime}:00`);
      const endDate = new Date(`${formData.date}T${formData.endTime}:00`);
      const startDateTime = startDate.toISOString();
      const endDateTime = endDate.toISOString();

      const result = await retryRequest(
        () => specialistService.updateAvailabilityBlock(editingBlock.id, {
          startDateTime,
          endDateTime,
          isAvailable: formData.isAvailable,
          reason: formData.reason || (formData.isAvailable ? 'Available time' : 'Blocked time'),
          recurring: formData.isRecurring,
          recurringDays: formData.recurringDays || [],
        }),
        2,
        1500
      );

      setAvailabilityBlocks(prev => prev.map(block =>
        block.id === editingBlock.id
          ? {
              ...block,
              startDateTime: new Date(result.block.startDateTime),
              endDateTime: new Date(result.block.endDateTime),
              isAvailable: result.block.isAvailable,
              reason: result.block.reason,
              isRecurring: result.block.isRecurring,
              recurringDays: result.block.recurringDays,
            }
          : block
      ));

      setEditingBlock(null);
      setError(null);
    } catch (err: any) {
      console.error('Error editing time slot:', err);
      setError(err.message || 'Failed to edit time slot');
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleDeleteTimeSlot = async (id: string) => {
    setOperationInProgress(true);
    try {
      await retryRequest(
        () => specialistService.deleteAvailabilityBlock(id),
        2,
        1000
      );
      setAvailabilityBlocks(prev => prev.filter(block => block.id !== id));
      setError(null);
    } catch (err: any) {
      console.error('Error deleting time slot:', err);
      setError(err.message || 'Failed to delete time slot');
    } finally {
      setOperationInProgress(false);
    }
  };

  const openEditModal = (block: CalendarBlock) => {
    setEditingBlock(block);
    setShowAddModal(true);
  };

  const handleCellClick = (date: Date, hour: number) => {
    setPreSelectedDate(date);
    setPreSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
    setEditingBlock(null);
    setShowAddModal(true);
  };

  // Check status of a specific 15-minute slot
  const getSlotStatus = (date: Date, timeSlot: string): 'available' | 'booked' | 'blocked' | 'empty' => {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotStart.getMinutes() + 15);

    // First, check if there's a booking for this slot
    for (const booking of bookings) {
      if (!booking.date || !booking.time) continue;

      const bookingDate = new Date(booking.date);
      const [bookingHour, bookingMinute] = booking.time.split(':').map(Number);
      const bookingStart = new Date(bookingDate);
      bookingStart.setHours(bookingHour, bookingMinute, 0, 0);
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setMinutes(bookingStart.getMinutes() + (booking.duration || 60));

      // Check if this 15-min slot overlaps with the booking
      if (slotStart < bookingEnd && slotEnd > bookingStart) {
        return 'booked';
      }
    }

    // Then check if there's an availability block
    for (const block of availabilityBlocks) {
      const blockStart = new Date(block.startDateTime);
      const blockEnd = new Date(block.endDateTime);

      // Check if this 15-min slot overlaps with the block
      if (slotStart < blockEnd && slotEnd > blockStart) {
        // If block is marked as not available (blocked time), show as blocked
        return block.isAvailable ? 'available' : 'blocked';
      }
    }

    return 'empty';
  };

  const getBlocksForCell = (date: Date, hour: number): CalendarBlock[] => {
    return availabilityBlocks.filter(block => {
      const blockStart = new Date(block.startDateTime);
      const blockEnd = new Date(block.endDateTime);

      // Compare using local date components (not ISO/UTC)
      const blockYear = blockStart.getFullYear();
      const blockMonth = blockStart.getMonth();
      const blockDay = blockStart.getDate();

      const cellYear = date.getFullYear();
      const cellMonth = date.getMonth();
      const cellDay = date.getDate();

      // First check if the block is on the same day (local time)
      if (blockYear !== cellYear || blockMonth !== cellMonth || blockDay !== cellDay) {
        return false;
      }

      // Then check if the block overlaps with this hour (local time)
      const blockHour = blockStart.getHours();
      const blockEndHour = blockEnd.getHours();
      const blockEndMinute = blockEnd.getMinutes();

      // Block overlaps with hour if:
      // - Block starts in this hour, OR
      // - Block ends in this hour (and not exactly at hour:00), OR
      // - Block spans across this hour
      return (blockHour === hour) ||
             (blockEndHour === hour && blockEndMinute > 0) ||
             (blockHour < hour && (blockEndHour > hour || (blockEndHour === hour && blockEndMinute > 0)));
    });
  };

  const toggleHourExpanded = (dayIndex: number, hour: number) => {
    const key = `${dayIndex}-${hour}`;
    setExpandedHours(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isHourExpanded = (dayIndex: number, hour: number): boolean => {
    const key = `${dayIndex}-${hour}`;
    return !!expandedHours[key];
  };

  const getHourSummary = (day: Date, hour: number) => {
    const blocks = getBlocksForCell(day, hour);
    const availableCount = blocks.filter(b => b.isAvailable).length;
    const blockedCount = blocks.filter(b => !b.isAvailable).length;
    const totalCount = blocks.length;

    // Also check if there are any bookings for this hour
    const hasBookings = bookings.some(booking => {
      if (!booking.date || !booking.time) return false;
      const bookingDate = new Date(booking.date);
      const [bookingHour] = booking.time.split(':').map(Number);
      return bookingDate.toDateString() === day.toDateString() && bookingHour === hour;
    });

    return { availableCount, blockedCount, totalCount, hasBookings };
  };

  if (loading) {
    return (
      <FullScreenHandshakeLoader
        title={t('schedule.loadingTitle') || 'Loading schedule'}
        subtitle={t('schedule.loadingSubtitle') || 'Preparing your availability'}
      />
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">{t('dashboard.nav.schedule')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm md:text-base">{t('schedule.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            setPreSelectedDate(undefined);
            setPreSelectedTime(undefined);
            setEditingBlock(null);
            setShowAddModal(true);
          }}
          disabled={operationInProgress}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
            operationInProgress
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700'
          } text-white whitespace-nowrap`}
        >
          {operationInProgress && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
          )}
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">{t('schedule.addTime')}</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{t('common.error') || 'Ошибка'}</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-sm font-medium text-red-800 dark:text-red-200 hover:text-red-600 dark:hover:text-red-400"
                >
                  {t('common.dismiss') || 'Закрыть'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate from Working Hours Prompt */}
      {showGeneratePrompt && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t('schedule.generatePromptTitle') || 'Автоматически создать расписание'}
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>{t('schedule.generatePromptMessage') || 'У вас настроены рабочие часы, но нет доступных слотов. Хотите автоматически создать расписание на основе ваших рабочих часов?'}</p>
              </div>
              <div className="mt-3 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleGenerateFromWorkingHours}
                  disabled={operationInProgress}
                  className="text-sm font-medium text-blue-800 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                >
                  {operationInProgress ? (t('common.loading') || 'Загрузка...') : (t('schedule.generateButton') || 'Создать расписание')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGeneratePrompt(false)}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {t('common.cancel') || 'Отмена'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {getFormattedDateRange(weekDays[0], weekDays[6])}
            </h2>
          </div>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <button
          onClick={goToToday}
          className="px-4 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors font-medium text-sm"
        >
          {t('schedule.today') || 'Сегодня'}
        </button>
      </div>

      {/* Calendar - Card Based Design */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day, dayIndex) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = dayNames[day.getDay()];
          const dayLabel = t(`weekday.${dayName}`) || day.toLocaleDateString('en-US', { weekday: 'long' });

          return (
            <div key={dayIndex} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              {/* Day Header */}
              <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                isToday ? 'bg-primary-50 dark:bg-primary-900/20' : ''
              }`}>
                <div className={`text-sm font-medium ${
                  isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {dayLabel}
                </div>
                <div className={`text-2xl font-bold ${
                  isToday ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {day.getDate()}
                </div>
              </div>

              {/* Hour Cards */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
                {timeSlots.map(hour => {
                  const { availableCount, blockedCount, totalCount, hasBookings } = getHourSummary(day, hour);
                  const blocks = getBlocksForCell(day, hour);
                  const expanded = isHourExpanded(dayIndex, hour);
                  const isPast = new Date(new Date(day).setHours(hour, 0, 0, 0)) < new Date();

                  // Only show hours that have availability blocks OR bookings
                  // Don't show completely empty hours
                  if (totalCount === 0 && !hasBookings) return null;

                  return (
                    <div key={hour} className={`${isPast ? 'opacity-50' : ''}`}>
                      {/* Hour Card Header */}
                      <button
                        onClick={() => toggleHourExpanded(dayIndex, hour)}
                        className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <ClockIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {`${hour.toString().padStart(2, '0')}:00`}
                            </div>
                            <div className="flex items-center space-x-3 mt-1">
                              {totalCount === 0 ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                  {t('schedule.noSlotsClickToAdd') || 'Click to add availability'}
                                </span>
                              ) : (
                                <>
                                  {availableCount > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                      <CheckIcon className="w-3 h-3 mr-1" />
                                      {availableCount}
                                    </span>
                                  )}
                                  {blockedCount > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                                      <XMarkIcon className="w-3 h-3 mr-1" />
                                      {blockedCount}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="ml-2">
                          {expanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Time Slots - Show 15-minute blocks */}
                      {expanded && (
                        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900/30">
                          <div className="grid grid-cols-4 gap-2">
                            {[0, 15, 30, 45].map(minute => {
                              const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                              const status = getSlotStatus(day, timeSlot);
                              const isPastSlot = new Date(new Date(day).setHours(hour, minute)) < new Date();

                              return (
                                <button
                                  key={timeSlot}
                                  onClick={() => {
                                    setPreSelectedDate(day);
                                    setPreSelectedTime(timeSlot);
                                    setEditingBlock(null);
                                    setShowAddModal(true);
                                  }}
                                  disabled={isPastSlot || status === 'booked'}
                                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                    isPastSlot
                                      ? 'opacity-40 cursor-not-allowed bg-gray-200 dark:bg-gray-700'
                                      : status === 'booked'
                                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-400 dark:border-red-600 cursor-not-allowed'
                                      : status === 'available'
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 border-2 border-green-300 dark:border-green-700'
                                      : status === 'blocked'
                                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/50 border-2 border-orange-300 dark:border-orange-700'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-dashed border-gray-300 dark:border-gray-500'
                                  }`}
                                >
                                  <div className="text-center">
                                    <div className="font-semibold">{timeSlot}</div>
                                    <div className="text-xs mt-1">
                                      {status === 'booked' && '🔒 Booked'}
                                      {status === 'available' && '✓ Available'}
                                      {status === 'blocked' && '⊘ Unavailable'}
                                      {status === 'empty' && '+ Add'}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {/* Show existing blocks list below for reference */}
                          {blocks.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {blocks.map(block => {
                            const blockStart = new Date(block.startDateTime);
                            const blockEnd = new Date(block.endDateTime);

                            return (
                              <div
                                key={block.id}
                                className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                                  block.isAvailable
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${
                                      block.isAvailable
                                        ? 'text-green-900 dark:text-green-100'
                                        : 'text-red-900 dark:text-red-100'
                                    }`}>
                                      {blockStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                      {' - '}
                                      {blockEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                    </div>
                                    {block.reason && (
                                      <div className={`text-xs mt-1 ${
                                        block.isAvailable
                                          ? 'text-green-700 dark:text-green-300'
                                          : 'text-red-700 dark:text-red-300'
                                      }`}>
                                        {block.reason}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 ml-3">
                                    <button
                                      onClick={() => openEditModal(block)}
                                      className={`p-2 rounded-lg transition-colors ${
                                        block.isAvailable
                                          ? 'hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300'
                                          : 'hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300'
                                      }`}
                                      aria-label="Edit time slot"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTimeSlot(block.id)}
                                      disabled={operationInProgress}
                                      className={`p-2 rounded-lg transition-colors ${
                                        block.isAvailable
                                          ? 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400'
                                          : 'hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300'
                                      } disabled:opacity-50`}
                                      aria-label="Delete time slot"
                                    >
                                      <TrashIcon className="w-4 h-4" />
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
                    </div>
                  );
                })}
              </div>

              {/* Add Time for This Day */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setPreSelectedDate(day);
                    setPreSelectedTime('09:00');
                    setEditingBlock(null);
                    setShowAddModal(true);
                  }}
                  disabled={operationInProgress}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Time</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('schedule.availableSlots')}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {availabilityBlocks.filter(b => b.isAvailable).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('schedule.blockedSlots')}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {availabilityBlocks.filter(b => !b.isAvailable).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('schedule.totalSlots')}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{availabilityBlocks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AddTimeModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingBlock(null);
          setPreSelectedDate(undefined);
          setPreSelectedTime(undefined);
        }}
        onSave={editingBlock ? handleEditTimeSlot : handleAddTimeSlot}
        editingBlock={editingBlock}
        preSelectedDate={preSelectedDate}
        preSelectedTime={preSelectedTime}
      />
    </div>
  );
};

export default SpecialistSchedule;
