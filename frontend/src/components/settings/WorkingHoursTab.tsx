import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { specialistService } from '@/services/specialist.service';
import { toast } from 'react-toastify';
import { ClockIcon, MapPinIcon } from '@/components/icons';
import type { SpecialistProfile, BusinessHours } from '@/hooks/useSpecialistProfile';

interface WorkingHoursTabProps {
  profile: SpecialistProfile;
  onProfileChange: (field: string, value: unknown) => void;
  saving: boolean;
  onSave: () => Promise<void>;
}

// ── Constants ──────────────────────────────────────────────────────────────────

type DayKey = keyof BusinessHours;

const DAYS_ORDER: DayKey[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_NAMES: Record<string, Record<DayKey, string>> = {
  uk: {
    monday: 'Понеділок',
    tuesday: 'Вівторок',
    wednesday: 'Середа',
    thursday: 'Четвер',
    friday: "П'ятниця",
    saturday: 'Субота',
    sunday: 'Неділя',
  },
  ru: {
    monday: 'Понедельник',
    tuesday: 'Вторник',
    wednesday: 'Среда',
    thursday: 'Четверг',
    friday: 'Пятница',
    saturday: 'Суббота',
    sunday: 'Воскресенье',
  },
  en: {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function crossesMidnight(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em <= sh * 60 + sm;
}

// ── Component ──────────────────────────────────────────────────────────────────

const WorkingHoursTab: React.FC<WorkingHoursTabProps> = ({
  profile,
  onProfileChange,
  saving,
  onSave,
}) => {
  const { language } = useLanguage();
  const [syncing, setSyncing] = useState(false);

  // Localised labels
  const label = useCallback(
    (uk: string, ru: string, en: string) =>
      language === 'uk' ? uk : language === 'ru' ? ru : en,
    [language],
  );

  const getDayName = useCallback(
    (day: DayKey) => DAY_NAMES[language]?.[day] ?? DAY_NAMES.en[day],
    [language],
  );

  // ── Day‑level change handlers ──────────────────────────────────────────────

  const handleToggle = useCallback(
    (day: DayKey, checked: boolean) => {
      const hours = profile.businessHours[day];
      onProfileChange('businessHours', {
        ...profile.businessHours,
        [day]: {
          isOpen: checked,
          startTime: hours.startTime || '09:00',
          endTime: hours.endTime || '17:00',
        },
      });
    },
    [profile.businessHours, onProfileChange],
  );

  const handleTimeChange = useCallback(
    (day: DayKey, field: 'startTime' | 'endTime', value: string) => {
      const hours = profile.businessHours[day];
      onProfileChange('businessHours', {
        ...profile.businessHours,
        [day]: {
          isOpen: hours.isOpen,
          startTime: field === 'startTime' ? value : hours.startTime || '09:00',
          endTime: field === 'endTime' ? value : hours.endTime || '17:00',
        },
      });
    },
    [profile.businessHours, onProfileChange],
  );

  // ── Save + sync ────────────────────────────────────────────────────────────

  const handleSaveAndSync = useCallback(async () => {
    try {
      setSyncing(true);

      // 1. Save the profile (including working hours)
      await onSave();

      // 2. Generate availability blocks from working hours
      await specialistService.generateAvailabilityFromWorkingHours();

      toast.success(
        label(
          'Графік роботи збережено та розклад оновлено',
          'График работы сохранён и расписание обновлено',
          'Working hours saved and schedule updated',
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      toast.error(
        label(
          `Помилка збереження: ${message}`,
          `Ошибка сохранения: ${message}`,
          `Save error: ${message}`,
        ),
      );
    } finally {
      setSyncing(false);
    }
  }, [onSave, label]);

  const isBusy = saving || syncing;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Info box ───────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <svg
          className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          {label(
            'Збереження графіку роботи автоматично згенерує слоти доступності на наступні 4 тижні у вашому Розкладі.',
            'Сохранение графика работы автоматически сгенерирует слоты доступности на следующие 4 недели в вашем Расписании.',
            'Saving working hours will automatically generate availability slots for the next 4 weeks in your Schedule.',
          )}
        </p>
      </div>

      {/* ── Working Hours ──────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          {label('Графік роботи', 'График работы', 'Working Hours')}
        </h3>

        <div className="space-y-3">
          {DAYS_ORDER.map((day) => {
            const hours = profile.businessHours?.[day] ?? {
              isOpen: false,
              startTime: '09:00',
              endTime: '17:00',
            };

            return (
              <div
                key={day}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                {/* Day name */}
                <div className="w-full sm:w-32">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {getDayName(day)}
                  </span>
                </div>

                {/* Open toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hours.isOpen}
                    onChange={(e) => handleToggle(day, e.target.checked)}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {label('Відкрито', 'Открыто', 'Open')}
                  </span>
                </label>

                {/* Time inputs (visible when open) */}
                {hours.isOpen && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={hours.startTime || '09:00'}
                        onChange={(e) =>
                          handleTimeChange(day, 'startTime', e.target.value)
                        }
                        className="px-2 py-1 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={hours.endTime || '17:00'}
                        onChange={(e) =>
                          handleTimeChange(day, 'endTime', e.target.value)
                        }
                        className="px-2 py-1 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>

                    {/* Midnight crossing warning */}
                    {crossesMidnight(hours.startTime, hours.endTime) && (
                      <div className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1 mt-1">
                        <svg
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          {label(
                            'Увага: Час роботи перетинає північ. Слоти будуть генеруватися від часу початку до 23:45, а потім від 00:00 до часу закінчення.',
                            'Внимание: Время работы пересекает полночь. Слоты будут генерироваться от времени начала до 23:45, а затем от 00:00 до времени окончания.',
                            'Warning: Business hours cross midnight. Slots will be generated from start time to 11:45 PM, then from 12:00 AM to end time.',
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Service Area ───────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPinIcon className="h-5 w-5" />
          {label('Зона обслуговування', 'Зона обслуживания', 'Service Area')}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {label('Радіус (км)', 'Радиус (км)', 'Radius (km)')}
            </label>
            <input
              type="number"
              min="0"
              max="500"
              value={
                profile.serviceArea?.radius === 0
                  ? ''
                  : profile.serviceArea?.radius || ''
              }
              onChange={(e) => {
                const radius =
                  e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                onProfileChange('serviceArea', {
                  ...(profile.serviceArea || { radius: 0, cities: [] }),
                  radius,
                });
              }}
              placeholder="0"
              className="w-full sm:w-40 px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* ── Save button ────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          disabled={isBusy}
          onClick={handleSaveAndSync}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          {isBusy && (
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isBusy
            ? label('Збереження...', 'Сохранение...', 'Saving...')
            : label('Зберегти', 'Сохранить', 'Save')}
        </button>
      </div>
    </div>
  );
};

export default WorkingHoursTab;
