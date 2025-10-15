import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: { rating: number; comment: string; tags: string[] }) => Promise<void>;
  bookingId?: string;
  serviceName?: string;
  specialistName?: string;
  booking?: {
    id: string;
    service?: { id: string; name: string };
    serviceName?: string;
    specialist?: { id: string; firstName: string; lastName: string };
    specialistName?: string;
  };
  isLoading?: boolean;
  loading?: boolean; // backward compatibility
}

const AVAILABLE_TAGS = [
  'professional',
  'punctual',
  'friendly',
  'skilled',
  'clean',
  'affordable',
  'quick',
  'thorough',
  'communicative',
  'reliable',
] as const;

const DISPLAY_TAGS = [
  'Professional',
  'Punctual',
  'Friendly',
  'Skilled',
  'Clean',
  'Affordable',
  'Quick',
  'Thorough',
  'Communicative',
  'Reliable',
] as const;

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  serviceName: propServiceName,
  specialistName: propSpecialistName,
  booking,
  isLoading = false,
  loading = false,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);

  const availableTags = AVAILABLE_TAGS;
  const displayTags = DISPLAY_TAGS;

  const actualLoading = isLoading || loading;

  const serviceName =
    propServiceName ||
    booking?.service?.name ||
    booking?.serviceName ||
    'Unknown Service';

  const specialistName =
    propSpecialistName ||
    (booking?.specialist
      ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
      : booking?.specialistName) ||
    'Unknown Specialist';

  useEffect(() => {
    if (!isOpen) return;

    const form = formRef.current;
    if (!form) return;

    const getFocusable = () =>
      Array.from(
        form.querySelectorAll<HTMLElement>(
          'a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    form.addEventListener('keydown', handleKeyDown as EventListener);
    const focusable = getFocusable();
    window.requestAnimationFrame(() => (focusable[0] || form).focus());

    return () => {
      form.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (rating === 0) {
      toast.warning(t('reviews.pleaseSelectRating'));
      return;
    }

    try {
      await onSubmit({
        rating,
        comment,
        tags: selectedTags,
      });

      setRating(5);
      setComment('');
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('reviews.submitError'));
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((value) => value !== tag) : [...prev, tag]
    );
  };

  const containerClasses =
    theme === 'dark'
      ? 'bg-gray-800 border border-gray-600'
      : 'bg-white border border-gray-200';
  const headerTextClass = theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  const labelTextClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const mutedTextClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const textareaClasses =
    theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500';
  const cancelButtonClasses =
    theme === 'dark'
      ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50';

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      position="bottom"
      closeOnBackdrop={!actualLoading}
      closeOnEscape={!actualLoading}
      ariaLabel={t('reviews.leaveReview')}
      containerClassName={`${containerClasses} shadow-2xl`}
      contentClassName="flex flex-col"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex h-full flex-col">
        <div className="modal-header">
          <h3 id="review-title" className={`text-base sm:text-lg font-semibold ${headerTextClass}`}>
            {t('reviews.leaveReview')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={actualLoading}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close review dialog"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="modal-body space-y-4">
            <div className={`text-xs sm:text-sm ${mutedTextClass}`}>
              <p className="break-words">
                <span className="font-medium">{t('booking.service')}:</span> {serviceName}
              </p>
              <p className="break-words">
                <span className="font-medium">{t('booking.specialist')}:</span> {specialistName}
              </p>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium ${labelTextClass}`}>
                {t('reviews.rating')} <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 flex items-center justify-center space-x-1 sm:justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    disabled={actualLoading}
                  >
                    {(hoverRating || rating) >= star ? (
                      <StarIconSolid className="h-6 w-6 text-yellow-400 sm:h-8 sm:w-8" />
                    ) : (
                      <StarIcon className="h-6 w-6 text-gray-300 sm:h-8 sm:w-8" />
                    )}
                  </button>
                ))}
                <span className={`ml-2 text-xs sm:text-sm ${mutedTextClass}`}>
                  {rating > 0 && `${rating}/5`}
                </span>
              </div>
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium ${labelTextClass}`}>
                {t('reviews.comment')}
              </label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                className={`mt-2 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${textareaClasses}`}
                placeholder={t('reviews.commentPlaceholder')}
                disabled={actualLoading}
              />
            </div>

            <div>
              <label className={`block text-xs sm:text-sm font-medium ${labelTextClass}`}>
                {t('reviews.tags')}
              </label>
              <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
                {availableTags.map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    disabled={actualLoading}
                    className={`rounded-full border px-3 py-1 text-xs sm:text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'border-blue-200 bg-blue-100 text-blue-800'
                        : theme === 'dark'
                          ? 'border-gray-600 bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {displayTags[index]}
                  </button>
                ))}
              </div>
            </div>

            <p className={`text-center text-xs sm:text-left ${mutedTextClass}`}>
              {t('reviews.dismissHint') || 'Press Esc or tap outside to close'}
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            disabled={actualLoading}
            className={`w-full rounded-md px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${cancelButtonClasses}`}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={actualLoading || rating === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {actualLoading && <LoadingSpinner size="sm" className="text-white" />}
            {t('reviews.submitReview')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReviewModal;
