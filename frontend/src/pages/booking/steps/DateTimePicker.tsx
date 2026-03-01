import React from 'react';
import { ClockIcon, CheckCircleIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { calculateEndTime } from '../../../utils/timeSlotUtils';
import type { AvailableDateInfo, ConflictHint } from '../types';

interface DateTimePickerProps {
  availableDates: AvailableDateInfo[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  availableSlots: string[];
  slotsLoading: boolean;
  service: Record<string, unknown>;
  conflictHint: ConflictHint;
  onConflictHintDismiss: () => void;
  user: Record<string, unknown> | null;
  waitlistJoined: boolean;
  onShowWaitlist: () => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  availableDates,
  selectedDate,
  onDateSelect,
  selectedTime,
  onTimeSelect,
  availableSlots,
  slotsLoading,
  service,
  conflictHint,
  onConflictHintDismiss,
  user,
  waitlistJoined,
  onShowWaitlist,
}) => {
  const { t, language } = useLanguage();

  const getDisplayDates = () => {
    return availableDates.map(dateInfo => ({
      date: new Date(dateInfo.date),
      dateInfo,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          {t('booking.selectDate')}
        </h3>

        {getDisplayDates().length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {getDisplayDates().slice(0, 14).map(({ date, dateInfo }) => (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`p-2 sm:p-3 text-xs sm:text-sm rounded-xl border transition-colors relative mobile-touch-target ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300 active:scale-95'
                }`}
                title={`${dateInfo.availableSlots} available slots (${dateInfo.workingHours})`}
              >
                <div className="text-center">
                  <div className="font-medium text-sm sm:text-base">{date.getDate()}</div>
                  <div className="text-xs opacity-75">
                    {date.toLocaleDateString(language || 'en', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-primary-600 font-medium mt-1">
                    {dateInfo.availableSlots} slots
                  </div>
                </div>
                {dateInfo.availableSlots === 1 && (
                  <span className="absolute -top-1 -right-1 text-[10px] px-1 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">1</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {t('booking.noAvailableDates')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {t('booking.noSlotsInNext30Days') || 'The specialist has no available time slots in the next 30 days'}
            </p>
          </div>
        )}
      </div>

      {selectedDate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('booking.selectTime')}
          </h3>
          {conflictHint.active && (
            <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-2 rounded-xl mb-4">
              <div className="text-sm">{t('booking.timeConflict') || 'That time just got booked. Try next available?'}</div>
              <button
                onClick={() => {
                  if (!availableSlots || availableSlots.length === 0) return;
                  const idx = conflictHint.lastTried ? availableSlots.indexOf(conflictHint.lastTried) : -1;
                  const next = idx >= 0 && idx < availableSlots.length - 1 ? availableSlots[idx + 1] : availableSlots[0];
                  onTimeSelect(next);
                  onConflictHintDismiss();
                }}
                className="btn btn-error btn-sm text-white"
              >
                {t('booking.tryNextAvailable') || 'Try next available'}
              </button>
            </div>
          )}

          {slotsLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-3"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('booking.loadingSlots') || 'Loading available times...'}
              </p>
            </div>
          ) : availableSlots.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                const morning: typeof availableSlots = [];
                const afternoon: typeof availableSlots = [];
                const evening: typeof availableSlots = [];

                availableSlots.forEach((slot: string | Record<string, unknown>) => {
                  const time = typeof slot === 'string' ? slot : slot.time;
                  const hour = parseInt(time.split(':')[0], 10);
                  if (hour < 12) morning.push(slot);
                  else if (hour < 17) afternoon.push(slot);
                  else evening.push(slot);
                });

                const sections = [
                  { label: t('booking.morning') || 'Morning', slots: morning },
                  { label: t('booking.afternoon') || 'Afternoon', slots: afternoon },
                  { label: t('booking.evening') || 'Evening', slots: evening },
                ].filter(s => s.slots.length > 0);

                return sections.map(section => (
                  <div key={section.label}>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{section.label}</h4>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {section.slots.map((slot: string | Record<string, unknown>) => {
                        const time = typeof slot === 'string' ? slot : slot.time;
                        const count = typeof slot === 'string' ? undefined : slot.count;
                        const serviceDuration = service?.duration || 60;
                        const endTime = calculateEndTime(time, serviceDuration);

                        return (
                          <button
                            key={time}
                            onClick={() => onTimeSelect(time)}
                            className={`relative px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl border transition-colors mobile-touch-target ${
                              selectedTime === time
                                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-primary-300 active:scale-95'
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-medium">{time}</div>
                              {serviceDuration > 15 && (
                                <div className="text-xs opacity-75">to {endTime}</div>
                              )}
                            </div>
                            {count === 1 && (
                              <span className="absolute -top-1 -right-1 text-[10px] px-1 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">1</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t('booking.noAvailableSlots')}
              </p>
              {user && !waitlistJoined && (
                <button
                  onClick={onShowWaitlist}
                  className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors shadow-sm"
                >
                  <ClockIcon className="w-4 h-4 mr-2" />
                  {t('waitlist.joinWaitlist') || 'Join Waitlist'}
                </button>
              )}
              {waitlistJoined && (
                <div className="inline-flex items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-xl">
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  {t('waitlist.alreadyJoined') || 'You are on the waitlist for this date'}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
