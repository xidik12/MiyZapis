import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarIcon, ClockIcon } from '@/components/icons';
import { useLanguage } from '../../../contexts/LanguageContext';

interface WaitlistModalProps {
  show: boolean;
  onClose: () => void;
  onJoin: () => void;
  selectedDate: Date | null;
  service: Record<string, unknown>;
  waitlistPreferredTime: string;
  onPreferredTimeChange: (value: string) => void;
  waitlistNotes: string;
  onNotesChange: (value: string) => void;
  waitlistLoading: boolean;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({
  show,
  onClose,
  onJoin,
  selectedDate,
  service,
  waitlistPreferredTime,
  onPreferredTimeChange,
  waitlistNotes,
  onNotesChange,
  waitlistLoading,
}) => {
  const { t, language } = useLanguage();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t('waitlist.joinWaitlist') || 'Join Waitlist'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('waitlist.joinDescription') || 'Get notified when a slot opens up for this date.'}
            </p>

            {/* Date confirmation */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 mb-4">
              <div className="flex items-center text-sm">
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {selectedDate?.toLocaleDateString(language || 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center text-sm mt-1">
                <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {service?.name} ({service?.duration} {t('time.minutes') || 'min'})
                </span>
              </div>
            </div>

            {/* Preferred time */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('waitlist.preferredTime') || 'Preferred time (optional)'}
              </label>
              <select
                value={waitlistPreferredTime}
                onChange={(e) => onPreferredTimeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
              >
                <option value="">{t('waitlist.anyTime') || 'Any time'}</option>
                <option value="morning">{t('booking.morning') || 'Morning'}</option>
                <option value="afternoon">{t('booking.afternoon') || 'Afternoon'}</option>
                <option value="evening">{t('booking.evening') || 'Evening'}</option>
              </select>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('waitlist.notes') || 'Notes (optional)'}
              </label>
              <textarea
                value={waitlistNotes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder={t('waitlist.notesPlaceholder') || 'Any additional preferences...'}
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                {t('actions.cancel') || 'Cancel'}
              </button>
              <button
                onClick={onJoin}
                disabled={waitlistLoading}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center"
              >
                {waitlistLoading ? (
                  <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <ClockIcon className="w-4 h-4 mr-2" />
                )}
                {waitlistLoading
                  ? (t('waitlist.joining') || 'Joining...')
                  : (t('waitlist.joinWaitlist') || 'Join Waitlist')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WaitlistModal;
