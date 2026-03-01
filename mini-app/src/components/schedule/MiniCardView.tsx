import React from 'react';
import { Clock, CalendarOff, User } from 'lucide-react';
import { format, parseISO, getDay } from 'date-fns';
import { t } from '@/hooks/useLocale';
import { commonStrings, scheduleStrings } from '@/utils/translations';
import type { Locale } from '@/utils/categories';

interface DaySchedule {
  dayOfWeek: number;
  dayKey: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breaks: { id: string; startTime: string; endTime: string }[];
}

interface MiniCardViewProps {
  schedule: DaySchedule[];
  onDayClick: (dayIndex: number) => void;
  locale: string;
  bookings?: Record<string, unknown>[];
}

const DAY_SHORT: Record<string, string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// Convert JS getDay() (0=Sun) to our dayOfWeek (0=Mon)
const jsToScheduleDay = (jsDay: number): number => (jsDay === 0 ? 6 : jsDay - 1);

export const MiniCardView: React.FC<MiniCardViewProps> = ({ schedule, onDayClick, locale, bookings = [] }) => {
  const dayLabels = DAY_SHORT[locale] || DAY_SHORT.en;

  // Group bookings by weekday
  const bookingsByDay: Record<number, any[]> = {};
  bookings.forEach((b: Record<string, unknown>) => {
    const dateStr = b.scheduledAt || b.startTime || b.createdAt;
    if (!dateStr) return;
    try {
      const d = parseISO(dateStr);
      const dayIdx = jsToScheduleDay(getDay(d));
      if (!bookingsByDay[dayIdx]) bookingsByDay[dayIdx] = [];
      bookingsByDay[dayIdx].push(b);
    } catch {
      // skip invalid
    }
  });

  return (
    <div className="space-y-2">
      {schedule.map((day, index) => {
        const dayBookings = bookingsByDay[index] || [];

        if (!day.isWorking) {
          return (
            <button
              key={day.dayKey}
              onClick={() => onDayClick(index)}
              className="w-full flex items-center gap-3 p-3 bg-bg-card/50 backdrop-blur rounded-xl border border-white/5 opacity-60 active:scale-[0.98] transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center flex-shrink-0">
                <CalendarOff size={16} className="text-text-muted" />
              </div>
              <div className="text-left">
                <span className="text-sm font-medium text-text-secondary">{dayLabels[index]}</span>
                <p className="text-xs text-text-muted">
                  {t(commonStrings, 'dayOff', locale as Locale)}
                </p>
              </div>
            </button>
          );
        }

        const startMin = timeToMinutes(day.startTime);
        const endMin = timeToMinutes(day.endTime);
        const totalMin = endMin - startMin;

        // Build segments: work, break, work, break, work...
        const segments: { type: 'work' | 'break'; start: number; end: number }[] = [];
        const sortedBreaks = [...day.breaks].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );

        let cursor = startMin;
        for (const brk of sortedBreaks) {
          const brkStart = timeToMinutes(brk.startTime);
          const brkEnd = timeToMinutes(brk.endTime);
          if (brkStart > cursor) {
            segments.push({ type: 'work', start: cursor, end: brkStart });
          }
          segments.push({ type: 'break', start: brkStart, end: brkEnd });
          cursor = brkEnd;
        }
        if (cursor < endMin) {
          segments.push({ type: 'work', start: cursor, end: endMin });
        }

        return (
          <button
            key={day.dayKey}
            onClick={() => onDayClick(index)}
            className="w-full bg-bg-card/80 backdrop-blur-xl rounded-xl border border-white/5 shadow-card p-3 active:scale-[0.98] transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent-primary/10 flex items-center justify-center">
                  <Clock size={14} className="text-accent-primary" />
                </div>
                <span className="text-sm font-semibold text-text-primary">{dayLabels[index]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span>{day.startTime}</span>
                <span>-</span>
                <span>{day.endTime}</span>
                {day.breaks.length > 0 && (
                  <span className="text-text-muted">
                    ({day.breaks.length} {t(scheduleStrings, 'break', locale as Locale)})
                  </span>
                )}
              </div>
            </div>

            {/* Time bar */}
            <div className="h-3 rounded-full bg-bg-secondary overflow-hidden flex">
              {segments.map((seg, si) => {
                const widthPct = totalMin > 0 ? ((seg.end - seg.start) / totalMin) * 100 : 0;
                return (
                  <div
                    key={si}
                    className={`h-full ${seg.type === 'work' ? 'bg-accent-green' : 'bg-accent-yellow/40'}`}
                    style={{ width: `${widthPct}%` }}
                  />
                );
              })}
            </div>

            {/* Bookings count for this day */}
            {dayBookings.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <User size={12} className="text-accent-primary" />
                <span className="text-xs text-accent-primary font-medium">
                  {dayBookings.length} {t(scheduleStrings, 'appointments', locale as Locale)}
                </span>
                {dayBookings[0] && (
                  <span className="text-xs text-text-muted truncate">
                    — {dayBookings[0].customer?.firstName || dayBookings[0].customerName || ''}{' '}
                    {(() => {
                      const dateStr = dayBookings[0].scheduledAt || dayBookings[0].startTime;
                      if (!dateStr) return '';
                      try { return format(parseISO(dateStr), 'HH:mm'); } catch { return ''; }
                    })()}
                  </span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
