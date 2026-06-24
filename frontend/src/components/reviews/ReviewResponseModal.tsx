import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { XIcon } from '@/components/icons';
import { InlineLoader } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReviewResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (responseText: string) => Promise<void>;
  reviewerName: string;
  reviewText?: string;
  rating: number;
}

export const ReviewResponseModal: React.FC<ReviewResponseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  reviewerName,
  reviewText,
  rating
}) => {
  const { t } = useLanguage();
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!responseText.trim()) {
      toast.error(t('reviews.response.emptyError') || 'Please enter a response');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(responseText.trim());
      setResponseText('');
      onClose();
      toast.success(t('reviews.response.success') || 'Response posted successfully');
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[ReviewResponseModal] Error submitting response:', error);
      toast.error(err.message || t('reviews.response.error') || 'Failed to post response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setResponseText('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('reviews.response.title') || 'Respond to Review'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('reviews.response.subtitle') || `Responding to ${reviewerName}'s review`}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition active:scale-[0.96] disabled:opacity-50"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Review Preview */}
            {reviewText && (
              <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {reviewerName}
                  </span>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-sm ${
                          star <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  "{reviewText}"
                </p>
              </div>
            )}

            {/* Response Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('reviews.response.label') || 'Your Response'}
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={t('reviews.response.placeholder') || 'Thank you for your feedback...'}
                  rows={5}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  maxLength={1000}
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('reviews.response.hint') || 'Be professional and courteous in your response'}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                    {responseText.length}/1000
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !responseText.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center gap-2"
                >
                  {isSubmitting && (
                    <InlineLoader size="sm" color="white" />
                  )}
                  {isSubmitting
                    ? (t('reviews.response.submitting') || 'Posting...')
                    : (t('reviews.response.submit') || 'Post Response')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
