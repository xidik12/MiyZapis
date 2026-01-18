import React from 'react';
import { motion } from 'framer-motion';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { Booking } from '../../types';

interface TimeBlock {
  id: string;
  startDateTime: string;
  endDateTime: string;
  isAvailable: boolean;
  reason?: string;
  isRecurring?: boolean;
}

interface MonthViewProps {
  currentDate: Date;
  bookings: Booking[];
  timeBlocks?: TimeBlock[];
  onDateClick?: (date: Date) => void;
  onBookingClick?: (booking: Booking) => void;
  onTimeBlockClick?: (timeBlock: TimeBlock) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  bookings,
  timeBlocks = [],
  onDateClick,
  onBookingClick,
  onTimeBlockClick
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getBookingsForDay = (date: Date): Booking[] => {
    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.scheduledAt);
      return isSameDay(bookingDate, date);
    }).slice(0, 3); // Limit to 3 bookings per day for display
  };

  const getTimeBlocksForDay = (date: Date): TimeBlock[] => {
    return timeBlocks.filter(block => {
      const blockDate = parseISO(block.startDateTime);
      return isSameDay(blockDate, date) && block.isAvailable;
    });
  };

  const getBookingColor = (status: string): string => {
    const colors: Record<string, string> = {
      confirmed: 'bg-primary-600',
      pending: 'bg-primary-600',
      completed: 'bg-primary-600',
      cancelled: 'bg-red-600',
      in_progress: 'bg-primary-600',
      failed: 'bg-red-600',
      no_show: 'bg-gray-400'
    };
    return colors[status.toLowerCase()] || 'bg-primary-600';
  };

  const rows: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {/* Header - Day names */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {rows.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((day, dayIndex) => {
              const dayBookings = getBookingsForDay(day);
              const dayTimeBlocks = getTimeBlocksForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              const totalBookings = bookings.filter(b =>
                isSameDay(parseISO(b.scheduledAt), day)
              ).length;

              return (
                <motion.div
                  key={dayIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.01 }}
                  onClick={() => onDateClick?.(day)}
                  className={`min-h-[100px] sm:min-h-[120px] p-2 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0 ${
                    isCurrentMonth
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      : 'bg-gray-50/50 dark:bg-gray-900/30'
                  } cursor-pointer transition-colors relative group`}
                >
                  {/* Date number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-semibold ${
                        isDayToday
                          ? 'flex items-center justify-center w-7 h-7 rounded-full bg-primary-600 text-white'
                          : isCurrentMonth
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {totalBookings > 3 && (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        +{totalBookings - 3}
                      </span>
                    )}
                  </div>

                  {/* Time Blocks and Bookings */}
                  <div className="space-y-1">
                    {/* Show available time blocks count */}
                    {dayTimeBlocks.length > 0 && (
                      <div className="text-[10px] sm:text-xs text-primary-600 dark:text-primary-400 font-medium">
                        {dayTimeBlocks.length} slot{dayTimeBlocks.length > 1 ? 's' : ''} available
                      </div>
                    )}

                    {/* Show bookings */}
                    {dayBookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick?.(booking);
                        }}
                        className={`${getBookingColor(booking.status)} text-white text-[10px] sm:text-xs px-1.5 py-1 rounded truncate hover:opacity-80 transition-opacity cursor-pointer`}
                        title={`${format(parseISO(booking.scheduledAt), 'HH:mm')} - ${booking.service?.name || 'Booking'}`}
                      >
                        <span className="font-medium">
                          {format(parseISO(booking.scheduledAt), 'HH:mm')}
                        </span>{' '}
                        <span className="hidden sm:inline">
                          {booking.service?.name || 'Booking'}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Hover overlay - Add booking button */}
                  {isCurrentMonth && (
                    <div className="absolute inset-0 bg-primary-50/0 dark:bg-primary-900/0 group-hover:bg-primary-50/30 dark:group-hover:bg-primary-900/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                      <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                        Click to add
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          Status:
        </span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-600"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Cancelled/Failed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary-100 dark:bg-primary-900/30"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Available Slots</span>
        </div>
      </div>
    </div>
  );
};
