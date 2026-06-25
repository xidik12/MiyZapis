import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { XIcon as XMarkIcon, CalendarIcon, ClockIcon } from '@/components/icons';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface RescheduleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newScheduledAt: string, reason?: string) => Promise<void>;
  serviceName: string;
  currentScheduledAt: string;
  isLoading?: boolean;
}

const RescheduleBookingModal: React.FC<RescheduleBookingModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  serviceName,
  currentScheduledAt,
  isLoading = false,
}) => {
  const { t } = useLanguage();

  const todayStr = new Date().toISOString().split('T')[0];

  // Pre-populate with the current booking date/time
  const currentDate = new Date(currentScheduledAt);
  const defaultDate = currentDate > new Date() ? currentDate.toISOString().split('T')[0] : todayStr;
  const defaultTime = currentDate > new Date()
    ? currentDate.toTimeString().slice(0, 5)
    : '10:00';

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      const d = new Date(currentScheduledAt);
      if (d > new Date()) {
        setDate(d.toISOString().split('T')[0]);
        setTime(d.toTimeString().slice(0, 5));
      } else {
        setDate(todayStr);
        setTime('10:00');
      }
      setReason('');
      setError(null);
    }
  }, [isOpen, currentScheduledAt]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!date || !time) {
      setError(t('bookings.reschedule.selectDateAndTime') || 'Please select a date and time');
      return;
    }

    const newScheduledAt = new Date(`${date}T${time}:00`);
    const now = new Date();
    if (newScheduledAt <= now) {
      setError(t('bookings.reschedule.mustBeFuture') || 'The new time must be in the future');
      return;
    }

    try {
      await onConfirm(newScheduledAt.toISOString(), reason || undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
        className="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-xl shadow-2xl max-w-[calc(100vw-2rem)] sm:max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
              {t('bookings.reschedule.title') || 'Reschedule Booking'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition active:scale-[0.96] flex-shrink-0 disabled:opacity-50"
          >
            <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={(e) => handleSubmit(e)} className="p-3 sm:p-6 space-y-4">
          {/* Service name */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('bookings.service') || 'Service'}:</span>{' '}
            {serviceName}
          </div>

          {/* Current time */}
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1">
            <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {t('bookings.reschedule.currentTime') || 'Current time'}:{' '}
              {new Date(currentScheduledAt).toLocaleString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Date picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('bookings.reschedule.newDate') || 'New date'} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={(e) => { setDate(e.target.value); setError(null); }}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
            />
          </div>

          {/* Time picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('bookings.reschedule.newTime') || 'New time'} <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => { setTime(e.target.value); setError(null); }}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-60"
            />
          </div>

          {/* Reason (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t('bookings.reschedule.reason') || 'Reason (optional)'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              disabled={isLoading}
              placeholder={t('bookings.reschedule.reasonPlaceholder') || 'e.g. scheduling conflict, personal reasons…'}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none disabled:opacity-60"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="p-3 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-none sm:min-w-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl transition active:scale-[0.96] border border-gray-300 dark:border-gray-600 whitespace-nowrap justify-center flex items-center disabled:opacity-50"
          >
            {t('actions.cancel') || 'Cancel'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isLoading || !date || !time}
            className="flex-1 min-w-[calc(50%-0.25rem)] sm:flex-none sm:min-w-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl transition active:scale-[0.96] border border-transparent whitespace-nowrap justify-center flex items-center gap-1.5"
          >
            {isLoading && <LoadingSpinner size="sm" />}
            {t('bookings.reschedule.confirm') || 'Confirm Reschedule'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RescheduleBookingModal;
