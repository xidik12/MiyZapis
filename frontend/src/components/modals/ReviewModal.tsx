import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { XIcon as XMarkIcon, StarIcon } from '@/components/icons';
;
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
// Note: Use active prop for filled icons: <Icon active />

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: {
    rating: number;
    comment: string;
    tags: string[];
  }) => Promise<void>;
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

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  bookingId,
  serviceName: propServiceName,
  specialistName: propSpecialistName,
  booking,
  isLoading = false,
  loading = false // backward compatibility
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState(0);

  const availableTags = [
    'professional',
    'punctual', 
    'friendly',
    'skilled',
    'clean',
    'affordable',
    'quick',
    'thorough',
    'communicative',
    'reliable'
  ];

  const displayTags = [
    'Professional',
    'Punctual',
    'Friendly',
    'Skilled',
    'Clean',
    'Affordable',
    'Quick',
    'Thorough',
    'Communicative',
    'Reliable'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.warning(t('reviews.pleaseSelectRating'));
      return;
    }

    try {
      await onSubmit({
        rating,
        comment,
        tags: selectedTags
      });
      
      // Reset form
      setRating(5);
      setComment('');
      setSelectedTags([]);
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(t('reviews.submitError'));
    }
  };

  const toggleTag = (tag: string, displayTag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Determine loading state (support both old and new prop names)
  const actualLoading = isLoading || loading;
  
  // Determine service name from either booking object or direct props
  const serviceName = propServiceName || 
    booking?.service?.name || 
    booking?.serviceName || 
    'Unknown Service';
  
  // Determine specialist name from either booking object or direct props  
  const specialistName = propSpecialistName || 
    (booking?.specialist 
      ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
      : booking?.specialistName) || 
    'Unknown Specialist';

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const getFocusable = () => Array.from(panel.querySelectorAll<HTMLElement>('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    panel.addEventListener('keydown', handleKey as any);
    setTimeout(() => (getFocusable()[0] || panel).focus(), 0);
    return () => panel.removeEventListener('keydown', handleKey as any);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-end sm:items-start justify-center px-0 sm:px-4 py-0 sm:py-4" onClick={onClose}>
      <div ref={panelRef} className={`relative w-full max-w-lg shadow-lg rounded-t-lg sm:rounded-xl ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-300'
      } my-0 sm:my-8 mx-auto min-h-fit max-h-full`} style={{ 
        marginTop: 'max(0rem, 2vh)',
        maxHeight: 'calc(100vh - 2rem)'
      }} role="dialog" aria-modal="true" aria-labelledby="review-title" onClick={(e) => e.stopPropagation()} tabIndex={-1}>
        <div className="p-3 sm:p-6 overflow-y-auto max-h-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 id="review-title" className={`text-base sm:text-lg font-medium truncate ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {t('reviews.leaveReview')}
            </h3>
            <button
              onClick={onClose}
              className={`flex-shrink-0 p-1 ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              disabled={actualLoading}
              aria-label="Close review dialog"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Service Info */}
            <div className={`text-xs sm:text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p className="break-words"><span className="font-medium">{t('booking.service')}:</span> {serviceName}</p>
              <p className="break-words"><span className="font-medium">{t('booking.specialist')}:</span> {specialistName}</p>
            </div>
            
            {/* Rating */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('reviews.rating')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-1 justify-center sm:justify-start">
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
                    <StarIcon
                      className={`h-6 w-6 sm:h-8 sm:w-8 ${
                        (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      active={(hoverRating || rating) >= star}
                    />
                  </button>
                ))}
                <span className={`ml-2 text-xs sm:text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {rating > 0 && `${rating}/5`}
                </span>
              </div>
            </div>
            
            {/* Comment */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('reviews.comment')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className={`mt-1 block w-full border rounded-xl shadow-sm px-2 sm:px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder={t('reviews.commentPlaceholder')}
                disabled={actualLoading}
              />
            </div>
            
            {/* Tags */}
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('reviews.tags')}
              </label>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {availableTags.map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag, displayTags[index])}
                    disabled={actualLoading}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {displayTags[index]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={actualLoading}
                className={`w-full sm:w-auto px-3 sm:px-4 py-2 border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={actualLoading || rating === 0}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-transparent rounded-xl shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {actualLoading && <LoadingSpinner size="sm" className="mr-2" />}
                {t('reviews.submitReview')}
              </button>
            </div>
          </form>
          <p className="mt-2 sm:mt-4 text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">Press Esc or click outside to close</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
