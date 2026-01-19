import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import { CalendarIcon, ClockIcon, PlusIcon, XMarkIcon, CheckIcon, TrashIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon, ChevronUpIcon, Squares2X2Icon, ListBulletIcon, FunnelIcon, ArrowPathIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, EllipsisVerticalIcon, CalendarDaysIcon } from '@/components/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { isFeatureEnabled } from '../../config/features';
import { retryRequest } from '../../services/api';
import { WeekView } from '@/components/calendar/WeekView';
import { MonthView } from '@/components/calendar/MonthView';
import { fetchBookings } from '../../store/slices/bookingSlice';
import { RootState } from '../../store';
import BookingDetailModal from '../../components/modals/BookingDetailModal';
import { RecurringBookingModal, RecurrenceData } from '../../components/modals/RecurringBookingModal';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { Booking } from '../../types';
import { findBookingConflicts } from '../../utils/bookingConflicts';
import { downloadICalFile, openInGoogleCalendar, exportMultipleBookings } from '../../utils/calendarExport';

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

      // Extract UTC date and time components (stored times are meant to be displayed as-is)
      const year = start.getUTCFullYear();
      const month = (start.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = start.getUTCDate().toString().padStart(2, '0');

      setFormData({
        date: `${year}-${month}-${day}`,
        startTime: `${start.getUTCHours().toString().padStart(2, '0')}:${start.getUTCMinutes().toString().padStart(2, '0')}`,
        endTime: `${end.getUTCHours().toString().padStart(2, '0')}:${end.getUTCMinutes().toString().padStart(2, '0')}`,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {editingBlock ? t('schedule.editTimeSlot') : t('schedule.addTimeSlot')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl touch-manipulation"
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
                className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base touch-manipulation"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.startTime')}
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base touch-manipulation"
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base touch-manipulation"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center cursor-pointer py-2 touch-manipulation">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 touch-manipulation"
                />
                <span className="ml-3 sm:ml-2 text-sm text-gray-700 dark:text-gray-300">{t('schedule.availableForBooking')}</span>
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
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-base touch-manipulation"
                />
              </div>
            )}

            <div>
              <label className="flex items-center cursor-pointer py-2 touch-manipulation">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 touch-manipulation"
                />
                <span className="ml-3 sm:ml-2 text-sm text-gray-700 dark:text-gray-300">{t('schedule.repeatWeekly')}</span>
              </label>
            </div>

            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.repeatOnDays')}
                </label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {weekDays.map(day => (
                    <label key={day.key} className="flex items-center cursor-pointer py-1 touch-manipulation">
                      <input
                        type="checkbox"
                        checked={formData.recurringDays.includes(day.key)}
                        onChange={() => toggleRecurringDay(day.key)}
                        className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 touch-manipulation"
                      />
                      <span className="ml-3 sm:ml-2 text-sm text-gray-700 dark:text-gray-300">{t(`schedule.${day.key}`)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors font-medium touch-manipulation"
              >
                {t('schedule.cancel')}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 sm:py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-colors font-medium touch-manipulation"
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
  const dispatch = useAppDispatch();
  const bookings = useAppSelector((state: RootState) => state.booking.bookings);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>();
  const [preSelectedTime, setPreSelectedTime] = useState<string | undefined>();
  const [showGeneratePrompt, setShowGeneratePrompt] = useState(false);
  const [expandedHours, setExpandedHours] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'card' | 'week' | 'month'>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showBookingDetailModal, setShowBookingDetailModal] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    pending: true,
    confirmed: true,
    completed: true,
    cancelled: false,
    in_progress: true
  });
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; booking: Booking | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    booking: null
  });
  const [conflicts, setConflicts] = useState<any[]>([]);

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

  // Filter bookings based on status filters
  const filteredBookings = bookings.filter(booking => {
    const status = booking.status.toLowerCase();
    return statusFilters[status] !== false;
  });

  // Toggle status filter
  const toggleStatusFilter = (status: string) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Handle booking click
  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetailModal(true);
  };

  // Handle booking reschedule via drag and drop
  const handleBookingReschedule = async (bookingId: string, newDate: Date, newTime: string) => {
    try {
      const [hours, minutes] = newTime.split(':').map(Number);
      const newDateTime = new Date(newDate);
      newDateTime.setHours(hours, minutes, 0, 0);

      // TODO: Call API to reschedule booking
      toast.success(t('schedule.bookingRescheduled') || `Booking rescheduled to ${newDateTime.toLocaleString()}`);

      // Reload bookings
      dispatch(fetchBookings({ filters: {}, userType: 'specialist' }));
    } catch (error) {
      console.error('Failed to reschedule booking:', error);
      toast.error(t('schedule.rescheduleError') || 'Failed to reschedule booking');
    }
  };

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
    dispatch(fetchBookings({ filters: {}, userType: 'specialist' }));
  }, [dispatch, currentWeekStart]);

  // Detect conflicts when bookings change
  useEffect(() => {
    const bookingConflicts = findBookingConflicts(bookings);
    setConflicts(bookingConflicts);

    if (bookingConflicts.length > 0) {
      toast.warning(`⚠️ ${bookingConflicts.length} booking conflict(s) detected`);
    }
  }, [bookings]);

  // Check if we should prompt to generate availability from working hours
  useEffect(() => {
    if (!loading && availabilityBlocks.length === 0 && (user as any)?.workingHours) {
      // User has working hours but no availability blocks - offer to generate
      setShowGeneratePrompt(true);
    }
  }, [loading, availabilityBlocks.length, user]);

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
      const startDateTime = toUtcIsoString(formData.date, formData.startTime);
      const endDateTime = toUtcIsoString(formData.date, formData.endTime);

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
      toast.success('Time slot added successfully');
    } catch (err: any) {
      console.error('Error adding time slot:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.message || 'Failed to add time slot. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOperationInProgress(false);
    }
  };

  const handleEditTimeSlot = async (formData: any) => {
    if (!editingBlock) return;

    setOperationInProgress(true);
    try {
      const startDateTime = toUtcIsoString(formData.date, formData.startTime);
      const endDateTime = toUtcIsoString(formData.date, formData.endTime);

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
      toast.success('Time slot updated successfully');
    } catch (err: any) {
      console.error('Error editing time slot:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.message || 'Failed to edit time slot. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
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
      toast.success('Time slot deleted successfully');
    } catch (err: any) {
      console.error('Error deleting time slot:', err);
      const errorMessage = err?.response?.data?.error?.message || err?.message || 'Failed to delete time slot. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
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

  const getBlocksForCell = (date: Date, hour: number): CalendarBlock[] => {
    return availabilityBlocks.filter(block => {
      const blockStart = new Date(block.startDateTime);
      const blockEnd = new Date(block.endDateTime);

      // Compare using UTC date components (timezone-agnostic)
      const blockYear = blockStart.getUTCFullYear();
      const blockMonth = blockStart.getUTCMonth();
      const blockDay = blockStart.getUTCDate();

      const cellYear = date.getFullYear();
      const cellMonth = date.getMonth();
      const cellDay = date.getDate();

      // First check if the block is on the same day (UTC time)
      if (blockYear !== cellYear || blockMonth !== cellMonth || blockDay !== cellDay) {
        return false;
      }

      // Then check if the block overlaps with this hour (UTC time)
      const blockHour = blockStart.getUTCHours();
      const blockEndHour = blockEnd.getUTCHours();
      const blockEndMinute = blockEnd.getUTCMinutes();

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
    return { availableCount, blockedCount, totalCount };
  };

  const statusOptions = [
    { key: 'pending', label: t('bookings.pending') || 'Pending', color: 'yellow', icon: '⏳' },
    { key: 'confirmed', label: t('bookings.confirmed') || 'Confirmed', color: 'blue', icon: '✓' },
    { key: 'in_progress', label: t('bookings.inProgress') || 'In Progress', color: 'purple', icon: '▶' },
    { key: 'completed', label: t('bookings.completed') || 'Completed', color: 'green', icon: '✓✓' },
    { key: 'cancelled', label: t('bookings.cancelled') || 'Cancelled', color: 'gray', icon: '✕' }
  ];

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
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title={t('schedule.weeklyView')}
            >
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{t('schedule.week')}</span>
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title={t('schedule.monthlyView')}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{t('schedule.month')}</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title={t('schedule.cardView')}
            >
              <ListBulletIcon className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">{t('schedule.cards')}</span>
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={() => exportMultipleBookings(filteredBookings)}
            disabled={filteredBookings.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('schedule.exportToCalendar')}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('schedule.export') || 'Export'}</span>
          </button>

          {/* Add Time Button */}
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
            <span className="sm:hidden">{t('schedule.add')}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
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
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Status Filter Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium text-sm border border-gray-200 dark:border-gray-600 flex items-center gap-2"
            >
              <FunnelIcon className="w-4 h-4" />
              <span>{t('schedule.filter') || 'Filter'}</span>
              {Object.values(statusFilters).filter(v => !v).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">
                  {Object.values(statusFilters).filter(v => !v).length}
                </span>
              )}
            </button>

            {/* Status Filter Dropdown */}
            {showStatusFilter && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t('schedule.filterByStatus') || 'Filter by Status'}
                  </h3>
                  <button
                    onClick={() => setShowStatusFilter(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-2">
                  {statusOptions.map(status => (
                    <label
                      key={status.key}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={statusFilters[status.key] !== false}
                          onChange={() => toggleStatusFilter(status.key)}
                          className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{status.icon} {status.label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${status.color}-100 dark:bg-${status.color}-900/30 text-${status.color}-700 dark:text-${status.color}-300`}>
                        {bookings.filter(b => b.status.toLowerCase() === status.key).length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-xl hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors font-medium text-sm"
          >
            {t('schedule.today') || 'Сегодня'}
          </button>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === 'week' ? (
        <WeekView
          currentDate={currentWeekStart}
          timeBlocks={availabilityBlocks.map(block => ({
            id: block.id,
            startDateTime: block.startDateTime,
            endDateTime: block.endDateTime,
            isAvailable: block.isAvailable,
            reason: block.reason,
            isRecurring: block.isRecurring,
          }))}
          bookings={filteredBookings}
          onBlockClick={(block) => {
            const originalBlock = availabilityBlocks.find(b => b.id === block.id);
            if (originalBlock) {
              openEditModal(originalBlock);
            }
          }}
          onBookingClick={handleBookingClick}
          onBookingReschedule={handleBookingReschedule}
          onTimeSlotClick={(date, time) => {
            handleCellClick(date, parseInt(time.split(':')[0]));
          }}
          onBookingRightClick={(booking, e) => {
            e.preventDefault();
            setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, booking });
          }}
        />
      ) : viewMode === 'month' ? (
        <MonthView
          currentDate={currentWeekStart}
          bookings={filteredBookings}
          timeBlocks={availabilityBlocks.map(block => ({
            id: block.id,
            startDateTime: block.startDateTime,
            endDateTime: block.endDateTime,
            isAvailable: block.isAvailable,
            reason: block.reason,
            isRecurring: block.isRecurring,
          }))}
          onDateClick={(date) => {
            setPreSelectedDate(date);
            setPreSelectedTime('09:00');
            setEditingBlock(null);
            setShowAddModal(true);
          }}
          onBookingClick={handleBookingClick}
          onTimeBlockClick={(block) => {
            const originalBlock = availabilityBlocks.find(b => b.id === block.id);
            if (originalBlock) {
              openEditModal(originalBlock);
            }
          }}
        />
      ) : (
        // Card Based Design
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
                  const { availableCount, blockedCount, totalCount } = getHourSummary(day, hour);
                  const blocks = getBlocksForCell(day, hour);
                  const expanded = isHourExpanded(dayIndex, hour);
                  const isPast = new Date(new Date(day).setHours(hour, 0, 0, 0)) < new Date();
                  const isCurrentHour = isToday && new Date().getHours() === hour;

                  // Skip hours with no slots
                  if (totalCount === 0) return null;

                  // Auto-expand current hour or if it's the only slot today
                  const shouldAutoExpand = isCurrentHour || (isToday && totalCount <= 3);

                  return (
                    <motion.div
                      key={hour}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: isPast ? 0.5 : 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={isCurrentHour ? 'ring-2 ring-primary-400 dark:ring-primary-600 rounded-lg' : ''}
                    >
                      {/* Hour Card Header */}
                      <button
                        onClick={() => toggleHourExpanded(dayIndex, hour)}
                        className={`w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left flex items-center justify-between group ${
                          isCurrentHour ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
                            <ClockIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                              {`${hour.toString().padStart(2, '0')}:00`}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {availableCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 leading-none">
                                  <CheckIcon className="w-3 h-3" />
                                  {availableCount}
                                </span>
                              )}
                              {blockedCount > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 leading-none">
                                  <XMarkIcon className="w-3 h-3" />
                                  {blockedCount}
                                </span>
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

                      {/* Event Preview when collapsed */}
                      {!expanded && blocks.length > 0 && (
                        <div className="px-4 pb-3">
                          <div className={`text-xs truncate ${
                            blocks[0].isAvailable
                              ? 'text-green-700 dark:text-green-300'
                              : 'text-red-700 dark:text-red-300'
                          }`}>
                            {blocks[0].isAvailable ? '✓ Available' : '✗ ' + (blocks[0].reason || 'Blocked')}
                            {blocks.length > 1 && ` +${blocks.length - 1} more`}
                          </div>
                        </div>
                      )}

                      {/* Expanded Time Slots with Animation */}
                      <AnimatePresence>
                        {(expanded || shouldAutoExpand) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-2 bg-gray-50 dark:bg-gray-900/30">
                              {blocks.map((block, idx) => {
                                const blockStart = new Date(block.startDateTime);
                                const blockEnd = new Date(block.endDateTime);

                                return (
                                  <motion.div
                                    key={block.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`p-3 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                                      block.isAvailable
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30'
                                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                                    }`}
                                  >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${
                                      block.isAvailable
                                        ? 'text-green-900 dark:text-green-100'
                                        : 'text-red-900 dark:text-red-100'
                                    }`}>
                                      {blockStart.getUTCHours().toString().padStart(2, '0')}:{blockStart.getUTCMinutes().toString().padStart(2, '0')}
                                      {' - '}
                                      {blockEnd.getUTCHours().toString().padStart(2, '0')}:{blockEnd.getUTCMinutes().toString().padStart(2, '0')}
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
                                      className={`p-2 rounded-xl transition-colors ${
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
                                      className={`p-2 rounded-xl transition-colors ${
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
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
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
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Time</span>
                </button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-2 bg-green-100 dark:bg-green-900 rounded-xl w-9 h-9 flex-shrink-0">
              <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 leading-tight">{t('schedule.availableSlots')}</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {availabilityBlocks.filter(b => b.isAvailable).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-xl">
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
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

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isOpen={showBookingDetailModal}
          onClose={() => {
            setShowBookingDetailModal(false);
            setSelectedBooking(null);
          }}
          onReschedule={(bookingId) => {
            toast.info(t('schedule.rescheduleBooking') || 'Reschedule booking feature coming soon');
            setShowBookingDetailModal(false);
          }}
          onCancel={(bookingId) => {
            toast.info(t('schedule.cancelBooking') || 'Cancel booking feature coming soon');
            setShowBookingDetailModal(false);
          }}
          onBookAgain={(booking) => {
            toast.info(t('schedule.bookAgain') || 'Book again feature coming soon');
            setShowBookingDetailModal(false);
          }}
          onLeaveReview={(bookingId) => {
            toast.info(t('schedule.leaveReview') || 'Leave review feature coming soon');
            setShowBookingDetailModal(false);
          }}
          getTranslatedServiceName={(name) => name}
          getTranslatedDuration={(duration) => `${duration} ${t('common.minutes') || 'min'}`}
        />
      )}

      {/* Context Menu */}
      {contextMenu.booking && (
        <ContextMenu
          isOpen={contextMenu.isOpen}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0, booking: null })}
          items={[
            {
              label: t('schedule.viewDetails') || 'View Details',
              icon: <CalendarIcon className="w-5 h-5" />,
              onClick: () => {
                if (contextMenu.booking) {
                  setSelectedBooking(contextMenu.booking);
                  setShowBookingDetailModal(true);
                }
              }
            },
            {
              label: t('schedule.exportToCalendar') || 'Export to Calendar',
              icon: <ArrowDownTrayIcon className="w-5 h-5" />,
              onClick: () => {
                if (contextMenu.booking) {
                  downloadICalFile(contextMenu.booking);
                  toast.success(t('schedule.exportSuccess') || 'Booking exported successfully');
                }
              }
            },
            {
              label: t('schedule.openInGoogle') || 'Open in Google Calendar',
              icon: <CalendarDaysIcon className="w-5 h-5" />,
              onClick: () => {
                if (contextMenu.booking) {
                  openInGoogleCalendar(contextMenu.booking);
                }
              }
            },
            { divider: true, label: '', onClick: () => {} },
            {
              label: t('schedule.reschedule') || 'Reschedule',
              icon: <ClockIcon className="w-5 h-5" />,
              onClick: () => {
                toast.info(t('schedule.rescheduleBooking') || 'Reschedule feature coming soon');
              },
              disabled: contextMenu.booking?.status === 'completed' || contextMenu.booking?.status === 'cancelled'
            },
            {
              label: t('schedule.cancel') || 'Cancel Booking',
              icon: <XMarkIcon className="w-5 h-5" />,
              onClick: () => {
                toast.info(t('schedule.cancelBooking') || 'Cancel booking feature coming soon');
              },
              danger: true,
              disabled: contextMenu.booking?.status === 'completed' || contextMenu.booking?.status === 'cancelled'
            }
          ]}
        />
      )}

      {/* Recurring Booking Modal */}
      <RecurringBookingModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        onSave={(recurrenceData: RecurrenceData) => {
          console.log('Create recurring bookings:', recurrenceData);
          toast.info(t('schedule.recurringFeature') || 'Recurring booking feature coming soon');
          // TODO: Implement recurring booking creation logic
        }}
      />

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl shadow-lg p-4 max-w-sm z-40">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                {t('schedule.conflictsDetected') || 'Booking Conflicts Detected'}
              </h3>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {conflicts.length} {conflicts.length === 1 ? 'conflict' : 'conflicts'} found in your schedule
              </p>
              <button
                onClick={() => setConflicts([])}
                className="text-xs font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-400 mt-2"
              >
                {t('common.dismiss') || 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

  const toUtcIsoString = (date: string, time: string) => {
    // Parse date and time components
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    // Create date in UTC to avoid timezone conversion
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

    if (Number.isNaN(utcDate.getTime())) {
      throw new Error('Invalid date or time');
    }

    return utcDate.toISOString();
  };

export default SpecialistSchedule;
