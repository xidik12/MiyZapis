import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CalendarIcon, ClockIcon, ArrowPathIcon } from '@/components/icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface RecurringBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recurrenceData: RecurrenceData) => void;
  initialData?: RecurrenceData;
}

export interface RecurrenceData {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  endType: 'never' | 'after' | 'on';
  occurrences?: number;
  endDate?: string;
  monthlyType?: 'day' | 'weekday'; // e.g., "15th" or "2nd Monday"
}

export const RecurringBookingModal: React.FC<RecurringBookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState<RecurrenceData>(
    initialData || {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [],
      endType: 'never',
      occurrences: 10,
      endDate: '',
      monthlyType: 'day'
    }
  );

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  const toggleDay = (day: number) => {
    const days = formData.daysOfWeek || [];
    if (days.includes(day)) {
      setFormData({ ...formData, daysOfWeek: days.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, daysOfWeek: [...days, day].sort() });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                <ArrowPathIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('recurring.title') || 'Recurring Booking'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('recurring.frequency') || 'Repeat'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['daily', 'weekly', 'biweekly', 'monthly'].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => setFormData({ ...formData, frequency: freq as any })}
                    className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
                      formData.frequency === freq
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t(`recurring.${freq}`) || freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Days of Week (for weekly/biweekly) */}
            {(formData.frequency === 'weekly' || formData.frequency === 'biweekly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('recurring.repeatOn') || 'Repeat on'}
                </label>
                <div className="flex gap-2">
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
                        formData.daysOfWeek?.includes(day.value)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Type */}
            {formData.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('recurring.monthlyType') || 'Monthly on'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, monthlyType: 'day' })}
                    className={`px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                      formData.monthlyType === 'day'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t('recurring.sameDayOfMonth') || 'Same day of month'}
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, monthlyType: 'weekday' })}
                    className={`px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                      formData.monthlyType === 'weekday'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {t('recurring.sameWeekdayOfMonth') || 'Same weekday of month'}
                  </button>
                </div>
              </div>
            )}

            {/* End Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {t('recurring.ends') || 'Ends'}
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="radio"
                    checked={formData.endType === 'never'}
                    onChange={() => setFormData({ ...formData, endType: 'never' })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('recurring.never') || 'Never'}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="radio"
                    checked={formData.endType === 'after'}
                    onChange={() => setFormData({ ...formData, endType: 'after' })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    {t('recurring.after') || 'After'}
                  </span>
                  <input
                    type="number"
                    value={formData.occurrences}
                    onChange={(e) => setFormData({ ...formData, occurrences: parseInt(e.target.value) })}
                    min="1"
                    max="52"
                    disabled={formData.endType !== 'after'}
                    className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('recurring.occurrences') || 'occurrences'}
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="radio"
                    checked={formData.endType === 'on'}
                    onChange={() => setFormData({ ...formData, endType: 'on' })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                    {t('recurring.on') || 'On'}
                  </span>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={formData.endType !== 'on'}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                {t('recurring.summary') || 'Summary'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {/* Generate summary based on settings */}
                {formData.frequency === 'weekly' && formData.daysOfWeek && formData.daysOfWeek.length > 0
                  ? `Every week on ${formData.daysOfWeek.map(d => weekDays[d].label).join(', ')}`
                  : `Every ${formData.frequency}`}
                {formData.endType === 'never' && ', forever'}
                {formData.endType === 'after' && `, ${formData.occurrences} times`}
                {formData.endType === 'on' && formData.endDate && `, until ${formData.endDate}`}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors font-medium"
            >
              {t('common.save') || 'Save'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
