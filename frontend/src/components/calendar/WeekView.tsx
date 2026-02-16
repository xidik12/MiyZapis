import React from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday, isPast, parseISO } from 'date-fns';
import { Booking } from '../../types';

interface TimeBlock {
  id: string;
  startDateTime: Date;
  endDateTime: Date;
  isAvailable: boolean;
  reason?: string;
  isRecurring: boolean;
}

interface WeekViewProps {
  currentDate: Date;
  timeBlocks: TimeBlock[];
  bookings?: Booking[];
  onBlockClick?: (block: TimeBlock) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  onBookingClick?: (booking: Booking) => void;
  onBookingReschedule?: (bookingId: string, newDate: Date, newTime: string) => void;
  onBookingRightClick?: (booking: Booking, e: React.MouseEvent) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  timeBlocks,
  bookings = [],
  onBlockClick,
  onTimeSlotClick,
  onBookingClick,
}) => {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Merge consecutive same-type blocks into single range blocks
  const mergeBlocks = (blocks: TimeBlock[]): TimeBlock[] => {
    if (blocks.length === 0) return [];
    const sorted = [...blocks].sort(
      (a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    );
    const merged: TimeBlock[] = [];
    let current = { ...sorted[0] };
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      const gap = Math.abs(new Date(next.startDateTime).getTime() - new Date(current.endDateTime).getTime());
      if (gap < 60000 && next.isAvailable === current.isAvailable) {
        current = { ...current, endDateTime: next.endDateTime };
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    return merged;
  };

  const getBlocksForDay = (day: Date) =>
    mergeBlocks(timeBlocks.filter(b => isSameDay(new Date(b.startDateTime), day)));

  const getBookingsForDay = (day: Date) =>
    bookings
      .filter(b => isSameDay(parseISO(b.scheduledAt), day))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const statusColors: Record<string, string> = {
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {weekDays.map((day) => {
        const dayBlocks = getBlocksForDay(day);
        const dayBookings = getBookingsForDay(day);
        const dayIsPast = isPast(day) && !isToday(day);
        const available = dayBlocks.filter(b => b.isAvailable);
        const blocked = dayBlocks.filter(b => !b.isAvailable);

        return (
          <div
            key={day.toISOString()}
            className={`rounded-xl border overflow-hidden ${
              isToday(day)
                ? 'border-primary-400 dark:border-primary-500 ring-1 ring-primary-200 dark:ring-primary-800'
                : 'border-gray-200 dark:border-gray-700'
            } ${dayIsPast ? 'opacity-60' : ''}`}
          >
            {/* Day header */}
            <div
              className={`px-3 py-2.5 text-center border-b ${
                isToday(day)
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {format(day, 'EEE')}
              </div>
              <div
                className={`text-lg font-bold ${
                  isToday(day)
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-900 dark:text-white'
                }`}
              >
                {format(day, 'd')}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 p-2 space-y-1.5 min-h-[120px]">
              {/* Availability ranges */}
              {available.length > 0 && (
                <div className="space-y-1">
                  {available.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => onBlockClick?.(block)}
                      className="w-full text-left px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          {format(new Date(block.startDateTime), 'h:mm a')} – {format(new Date(block.endDateTime), 'h:mm a')}
                        </span>
                      </div>
                      {block.isRecurring && (
                        <div className="text-[9px] text-emerald-500/70 dark:text-emerald-400/60 ml-3 mt-0.5">
                          Recurring
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Blocked ranges */}
              {blocked.length > 0 && (
                <div className="space-y-1">
                  {blocked.map((block) => (
                    <button
                      key={block.id}
                      onClick={() => onBlockClick?.(block)}
                      className="w-full text-left px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/15 hover:bg-red-100 dark:hover:bg-red-900/25 transition-colors"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-[11px] font-medium text-red-600 dark:text-red-400">
                          {format(new Date(block.startDateTime), 'h:mm a')} – {format(new Date(block.endDateTime), 'h:mm a')}
                        </span>
                      </div>
                      {block.reason && (
                        <div className="text-[9px] text-red-400/80 dark:text-red-400/60 ml-3 mt-0.5 truncate">
                          {block.reason}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Divider if there are both availability and bookings */}
              {(available.length > 0 || blocked.length > 0) && dayBookings.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
              )}

              {/* Bookings */}
              {dayBookings.length > 0 && (
                <div className="space-y-1">
                  {dayBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => onBookingClick?.(booking)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg transition-colors hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600 ${
                        statusColors[booking.status] || statusColors.confirmed
                      }`}
                    >
                      <div className="text-[11px] font-semibold truncate">
                        {booking.service?.name || 'Booking'}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {format(parseISO(booking.scheduledAt), 'h:mm a')} · {booking.duration}min
                      </div>
                      {booking.customer?.firstName && (
                        <div className="text-[10px] opacity-70 truncate">
                          {booking.customer.firstName} {booking.customer.lastName || ''}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {available.length === 0 && blocked.length === 0 && dayBookings.length === 0 && (
                <button
                  onClick={() => !dayIsPast && onTimeSlotClick?.(day, '09:00')}
                  className={`w-full py-4 text-center rounded-lg border border-dashed border-gray-200 dark:border-gray-700 ${
                    dayIsPast
                      ? 'cursor-not-allowed'
                      : 'hover:border-primary-300 hover:bg-primary-50/50 dark:hover:border-primary-700 dark:hover:bg-primary-900/10 cursor-pointer'
                  }`}
                >
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">
                    {dayIsPast ? 'No activity' : 'Add availability'}
                  </div>
                </button>
              )}

              {/* Add slot button for days that have blocks but user may want more */}
              {!dayIsPast && (available.length > 0 || blocked.length > 0) && (
                <button
                  onClick={() => onTimeSlotClick?.(day, '09:00')}
                  className="w-full py-1 text-center text-[10px] text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  + Add slot
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
