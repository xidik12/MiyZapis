import React from 'react';
import { motion } from 'framer-motion';
import { format, startOfWeek, addDays, isSameDay, isToday, isPast, parseISO } from 'date-fns';
import { PlusIcon } from '@/components/icons';

interface TimeBlock {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  isAvailable: boolean;
  reason?: string;
  isRecurring: boolean;
}

interface Booking {
  id: string;
  scheduledAt: string;
  duration: number;
  service: {
    name: string;
  };
  customer: {
    firstName: string;
    lastName: string;
  };
  status: string;
}

interface WeekViewProps {
  currentDate: Date;
  timeBlocks: TimeBlock[];
  bookings?: Booking[];
  onBlockClick?: (block: TimeBlock) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onBookingClick?: (booking: Booking) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  timeBlocks,
  bookings = [],
  onBlockClick,
  onTimeSlotClick,
  onBookingClick
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getBlocksForDay = (day: Date) => {
    return timeBlocks.filter(block =>
      isSameDay(new Date(block.startDateTime), day)
    );
  };

  const getBookingsForDay = (day: Date) => {
    return bookings.filter(booking => {
      const bookingDate = parseISO(booking.scheduledAt);
      return isSameDay(bookingDate, day);
    });
  };

  const getBlockStyle = (block: TimeBlock, day: Date) => {
    const start = new Date(block.startDateTime);
    const end = new Date(block.endDateTime);

    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();

    // Calculate position and height
    const top = ((startHour - 6) * 60 + startMinute) / 60; // hours from 6 AM
    const duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const height = duration / 60;

    return {
      top: `${top * 4}rem`, // 4rem per hour
      height: `${height * 4}rem`,
      minHeight: '2rem'
    };
  };

  const getBookingStyle = (booking: Booking) => {
    const bookingTime = parseISO(booking.scheduledAt);
    const hours = bookingTime.getHours();
    const minutes = bookingTime.getMinutes();
    const duration = booking.duration; // in minutes

    // Calculate position and height
    const top = ((hours - 6) * 60 + minutes) / 60; // hours from 6 AM
    const height = duration / 60;

    return {
      top: `${top * 4}rem`, // 4rem per hour
      height: `${height * 4}rem`,
      minHeight: '2rem'
    };
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-700">
        {/* Time column header */}
        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 border-r border-gray-200 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">TIME</span>
        </div>
        {/* Day headers */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`p-3 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${
              isToday(day) ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-900/50'
            }`}
          >
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {format(day, 'EEE')}
            </div>
            <div
              className={`text-2xl font-bold mt-1 ${
                isToday(day)
                  ? 'text-primary-600 dark:text-primary-400'
                  : isPast(day)
                  ? 'text-gray-400 dark:text-gray-600'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
        <div className="grid grid-cols-8">
          {/* Hours column */}
          <div className="border-r border-gray-200 dark:border-gray-700">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b border-gray-100 dark:border-gray-800 p-2 text-right"
              >
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayBlocks = getBlocksForDay(day);
            const dayIsPast = isPast(day) && !isToday(day);

            return (
              <div
                key={day.toISOString()}
                className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 relative"
              >
                {HOURS.map((hour) => (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    onClick={() => {
                      if (!dayIsPast && onTimeSlotClick) {
                        onTimeSlotClick(day, `${hour.toString().padStart(2, '0')}:00`);
                      }
                    }}
                    className={`h-16 border-b border-gray-100 dark:border-gray-800 relative group ${
                      !dayIsPast
                        ? 'hover:bg-primary-50/30 dark:hover:bg-primary-900/10 cursor-pointer'
                        : 'bg-gray-50/50 dark:bg-gray-900/30 cursor-not-allowed'
                    }`}
                  >
                    {/* Add button on hover */}
                    {!dayIsPast && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="p-1.5 bg-primary-600 rounded-lg shadow-md">
                          <PlusIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Time blocks overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {dayBlocks.map((block, index) => {
                    const style = getBlockStyle(block, day);
                    return (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBlockClick) onBlockClick(block);
                        }}
                        style={style}
                        className={`absolute left-1 right-1 rounded-lg p-2 shadow-md pointer-events-auto cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                          block.isAvailable
                            ? 'bg-green-500 text-white border-2 border-green-600'
                            : 'bg-red-500 text-white border-2 border-red-600'
                        } ${block.isRecurring ? 'border-dashed' : ''}`}
                      >
                        <div className="text-xs font-bold">
                          {format(new Date(block.startDateTime), 'h:mm a')}
                        </div>
                        <div className="text-xs">
                          {block.isAvailable ? 'Available' : (block.reason || 'Blocked')}
                        </div>
                        {block.isRecurring && (
                          <div className="text-xs opacity-75 mt-1">
                            🔄 Recurring
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bookings overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {getBookingsForDay(day).map((booking, index) => {
                    const style = getBookingStyle(booking);
                    const statusColors = {
                      confirmed: 'bg-blue-500 border-blue-600',
                      pending: 'bg-yellow-500 border-yellow-600',
                      completed: 'bg-green-500 border-green-600',
                      cancelled: 'bg-gray-500 border-gray-600',
                    };
                    const statusColor = statusColors[booking.status as keyof typeof statusColors] || 'bg-blue-500 border-blue-600';

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBookingClick) onBookingClick(booking);
                        }}
                        style={style}
                        className={`absolute left-1 right-1 rounded-lg p-2 shadow-lg pointer-events-auto cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-105 text-white border-2 ${statusColor}`}
                      >
                        <div className="text-xs font-bold truncate">
                          {booking.service.name}
                        </div>
                        <div className="text-xs truncate">
                          {booking.customer.firstName} {booking.customer.lastName}
                        </div>
                        <div className="text-xs opacity-90">
                          {format(parseISO(booking.scheduledAt), 'h:mm a')} • {booking.duration}min
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
