import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  format,
  getDay,
} from 'date-fns';

interface DaySchedule {
  dayOfWeek: number;
  dayKey: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  breaks: { id: string; startTime: string; endTime: string }[];
}

interface MiniMonthViewProps {
  schedule: DaySchedule[];
  onDayClick: (dayIndex: number) => void;
  locale: string;
  bookingDates?: Set<string>; // Set of 'YYYY-MM-DD' strings
}

const WEEKDAY_LABELS: Record<string, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  uk: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

const MONTH_NAMES: Record<string, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
};

// Convert JS getDay() (0=Sun) to our dayOfWeek (0=Mon)
const jsToScheduleDay = (jsDay: number): number => (jsDay === 0 ? 6 : jsDay - 1);

export const MiniMonthView: React.FC<MiniMonthViewProps> = ({ schedule, onDayClick, locale, bookingDates }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekdays = WEEKDAY_LABELS[locale] || WEEKDAY_LABELS.en;
  const monthNames = MONTH_NAMES[locale] || MONTH_NAMES.en;

  return (
    <div className="bg-bg-card/80 backdrop-blur-xl rounded-2xl border border-white/5 shadow-card p-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-bg-hover transition-colors"
        >
          <ChevronLeft size={18} className="text-text-secondary" />
        </button>
        <h3 className="font-semibold text-text-primary">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-bg-hover transition-colors"
        >
          <ChevronRight size={18} className="text-text-secondary" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((label) => (
          <div key={label} className="text-center text-[10px] font-medium text-text-muted py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, currentMonth);
          const today = isToday(d);
          const scheduleDay = jsToScheduleDay(getDay(d));
          const daySchedule = schedule[scheduleDay];
          const isWorking = daySchedule?.isWorking ?? false;
          const dateStr = format(d, 'yyyy-MM-dd');
          const hasBooking = bookingDates?.has(dateStr) ?? false;

          return (
            <button
              key={i}
              onClick={() => onDayClick(scheduleDay)}
              className={`relative flex flex-col items-center justify-center py-2 rounded-lg transition-all active:scale-95 ${
                !inMonth
                  ? 'opacity-30'
                  : today
                  ? 'bg-accent-primary/15 border border-accent-primary/30'
                  : 'hover:bg-bg-hover'
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  !inMonth ? 'text-text-muted' : today ? 'text-accent-primary' : 'text-text-primary'
                }`}
              >
                {format(d, 'd')}
              </span>
              {inMonth && (
                <div className="flex gap-0.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isWorking ? 'bg-accent-green' : 'bg-text-muted/30'
                    }`}
                  />
                  {hasBooking && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
