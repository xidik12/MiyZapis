import React, { useState, useEffect } from 'react';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';
import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAppSelector } from '../../hooks/redux';
import { selectUser } from '../../store/slices/authSlice';
import { specialistService } from '../../services/specialist.service';
import { bookingService } from '../../services/booking.service';

interface AvailabilityBlock {
  id: string;
  startDateTime: string;
  endDateTime: string;
  isAvailable: boolean;
  specialistId: string;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
  hasBooking: boolean;
  blockId?: string;
}

interface DaySchedule {
  date: Date;
  dayName: string;
  slots: TimeSlot[];
}

const Schedule: React.FC = () => {
  const { t } = useLanguage();
  const user = useAppSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  function generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  }

  function getWeekDays(startDate: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  }

  function hasAvailabilityBlock(date: Date, time: string, blocks: AvailabilityBlock[]): { isAvailable: boolean; blockId?: string } {
    const [hours, minutes] = time.split(':').map(Number);

    // Create slot timestamp in local browser time (which should be Cambodia time)
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    const slotStartLocal = slotDate.getTime();
    const slotEndLocal = slotStartLocal + (15 * 60 * 1000); // Add 15 minutes

    for (const block of blocks) {
      // Blocks from API are in UTC, convert them to local time for comparison
      const blockStartLocal = new Date(block.startDateTime).getTime();
      const blockEndLocal = new Date(block.endDateTime).getTime();

      // Check if slot falls within this block
      if (slotStartLocal >= blockStartLocal && slotEndLocal <= blockEndLocal) {
        return { isAvailable: block.isAvailable, blockId: block.id };
      }
    }
    return { isAvailable: false };
  }

  function hasBooking(date: Date, time: string, bookingsList: Booking[]): boolean {
    const [hours, minutes] = time.split(':').map(Number);

    // Create slot timestamp in local browser time (which should be Cambodia time)
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);
    const slotStartLocal = slotDate.getTime();
    const slotEndLocal = slotStartLocal + (15 * 60 * 1000);

    for (const booking of bookingsList) {
      const bookingStartLocal = new Date(booking.startTime).getTime();
      const bookingEndLocal = new Date(booking.endTime).getTime();

      if (slotStartLocal < bookingEndLocal && slotEndLocal > bookingStartLocal) {
        return true;
      }
    }
    return false;
  }

  function buildWeekSchedule(
    weekDays: Date[],
    blocks: AvailabilityBlock[],
    bookingsList: Booking[]
  ): DaySchedule[] {
    const timeSlots = generateTimeSlots();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return weekDays.map(date => {
      const dayName = dayNames[date.getDay()];
      const slots: TimeSlot[] = timeSlots.map(time => {
        const { isAvailable, blockId } = hasAvailabilityBlock(date, time, blocks);
        const booked = hasBooking(date, time, bookingsList);
        return { time, isAvailable, hasBooking: booked, blockId };
      });
      return { date, dayName, slots };
    });
  }

  async function loadScheduleData() {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);
      const weekDays = getWeekDays(currentWeekStart);
      const startDate = formatDateForAPI(weekDays[0]);
      const endDate = formatDateForAPI(weekDays[6]);
      console.log('📅 Loading schedule for week:', startDate, 'to', endDate);

      const blocks = await specialistService.getAvailabilityBlocks(startDate, endDate, 1000);
      console.log('📦 Loaded availability blocks:', blocks);
      console.log('📦 Block details:', blocks.map(b => ({
        id: b.id,
        start: b.startDateTime,
        end: b.endDateTime,
        isAvailable: b.isAvailable,
        startLocal: new Date(b.startDateTime).toLocaleString(),
        endLocal: new Date(b.endDateTime).toLocaleString()
      })));
      setAvailabilityBlocks(Array.isArray(blocks) ? blocks : []);

      const bookingsData = await bookingService.getBookings({
        startDate,
        endDate,
        status: ['PENDING', 'CONFIRMED'],
      });
      console.log('📅 Loaded bookings:', bookingsData);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);

      const schedule = buildWeekSchedule(
        weekDays,
        Array.isArray(blocks) ? blocks : [],
        Array.isArray(bookingsData) ? bookingsData : []
      );
      setWeekSchedule(schedule);
    } catch (err: any) {
      console.error('Error loading schedule:', err);
      setError(err.message || 'Failed to load schedule');
      setWeekSchedule([]);
    } finally {
      setLoading(false);
    }
  }

  function goToPreviousWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  }

  function goToNextWeek() {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  }

  function goToToday() {
    setCurrentWeekStart(getMonday(new Date()));
  }

  function handleSlotClick(date: Date, time: string, slot: TimeSlot) {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowAddModal(true);
  }

  async function handleSaveAvailability(formData: {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }) {
    if (!selectedDate || !selectedTime) return;
    try {
      setLoading(true);
      const dateStr = formatDateForAPI(selectedDate);
      
      // Create datetime in local Cambodia timezone
      const startDateTime = new Date(`${dateStr}T${formData.startTime}:00`);
      const endDateTime = new Date(`${dateStr}T${formData.endTime}:00`);
      
      const data = {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        isAvailable: formData.isAvailable,
      };
      console.log('💾 Saving availability block:', data);
      await specialistService.createAvailabilityBlock(data);
      setShowAddModal(false);
      setSelectedDate(null);
      setSelectedTime(null);
      await loadScheduleData();
    } catch (err: any) {
      console.error('Error saving availability:', err);
      setError(err.message || 'Failed to save availability');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScheduleData();
  }, [currentWeekStart, user?.id]);

  const totalSlots = weekSchedule.reduce((sum, day) =>
    sum + day.slots.filter(s => s.isAvailable).length, 0
  );
  const bookedSlots = weekSchedule.reduce((sum, day) =>
    sum + day.slots.filter(s => s.hasBooking).length, 0
  );
  const availableSlots = totalSlots - bookedSlots;

  if (loading && weekSchedule.length === 0) {
    return <FullScreenHandshakeLoader message="Loading schedule..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('schedule.title') || 'Schedule'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('schedule.description') || 'Configure your work schedule and availability'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('schedule.availableSlots') || 'Available Slots'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{availableSlots}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('schedule.bookedSlots') || 'Booked Slots'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookedSlots}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('schedule.totalSlots') || 'Total Slots'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalSlots}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6">
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {weekSchedule.length > 0 && `${formatDateForAPI(weekSchedule[0].date)} - ${formatDateForAPI(weekSchedule[6].date)}`}
              </h2>
              <button
                onClick={goToToday}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1"
              >
                {t('schedule.today') || 'Today'}
              </button>
            </div>

            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 text-left text-sm font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10">
                    {t('schedule.time') || 'Time'}
                  </th>
                  {weekSchedule.map((day, idx) => (
                    <th key={idx} className="p-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                      <div>{day.dayName}</div>
                      <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        {day.date.getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generateTimeSlots().map((time, timeIdx) => {
                  const hasAnySlot = weekSchedule.some(day =>
                    day.slots[timeIdx]?.isAvailable || day.slots[timeIdx]?.hasBooking
                  );
                  if (!hasAnySlot) return null;

                  return (
                    <tr key={time} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="p-2 text-sm text-gray-600 dark:text-gray-400 sticky left-0 bg-white dark:bg-gray-800">
                        {time}
                      </td>
                      {weekSchedule.map((day, dayIdx) => {
                        const slot = day.slots[timeIdx];
                        return (
                          <td key={dayIdx} className="p-1">
                            <button
                              onClick={() => handleSlotClick(day.date, time, slot)}
                              className={`w-full h-8 rounded text-xs font-medium transition-all ${ 
                                slot.hasBooking
                                  ? 'bg-blue-500 text-white cursor-default'
                                  : slot.isAvailable
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                                  : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                              }`}
                              disabled={slot.hasBooking}
                            >
                              {slot.hasBooking ? '📅' : slot.isAvailable ? '✓' : '+'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded mr-2"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Not Set</span>
          </div>
        </div>
      </div>

      {showAddModal && selectedDate && selectedTime && (
        <AddAvailabilityModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setSelectedDate(null);
            setSelectedTime(null);
          }}
          onSave={handleSaveAvailability}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
        />
      )}
    </div>
  );
};

interface AddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { startTime: string; endTime: string; isAvailable: boolean }) => void;
  selectedDate: Date;
  selectedTime: string;
}

const AddAvailabilityModal: React.FC<AddAvailabilityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  selectedTime,
}) => {
  const { t } = useLanguage();
  const [startTime, setStartTime] = useState(selectedTime);
  const [endTime, setEndTime] = useState(() => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 60, 0, 0);
    const h = endDate.getHours().toString().padStart(2, '0');
    const m = endDate.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  });
  const [isAvailable, setIsAvailable] = useState(true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ startTime, endTime, isAvailable });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('schedule.addTimeSlot') || 'Add Availability'}
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
                {t('schedule.date') || 'Date'}
              </label>
              <input
                type="text"
                value={selectedDate.toLocaleDateString()}
                disabled
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.startTime') || 'Start Time'}
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('schedule.endTime') || 'End Time'}
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  {t('schedule.availableForBooking') || 'Available for booking'}
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {t('common.save') || 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
