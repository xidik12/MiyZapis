import React from 'react';
import { Clock, CalendarOff } from 'lucide-react';

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

export const MiniCardView: React.FC<MiniCardViewProps> = ({ schedule, onDayClick, locale }) => {
  const dayLabels = DAY_SHORT[locale] || DAY_SHORT.en;

  return (
    <div className="space-y-2">
      {schedule.map((day, index) => {
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
                  {locale === 'uk' ? 'Вихідний' : locale === 'ru' ? 'Выходной' : 'Day Off'}
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
            className="w-full bg-bg-card/80 backdrop-blur-xl rounded-xl border border-white/5 shadow-card p-3 active:scale-[0.98] transition-all"
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
                    ({day.breaks.length} {locale === 'uk' ? 'перерв' : locale === 'ru' ? 'перерыв' : 'break'}{day.breaks.length > 1 && locale === 'en' ? 's' : ''})
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
          </button>
        );
      })}
    </div>
  );
};
