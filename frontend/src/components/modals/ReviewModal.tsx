import React, { useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: {
    rating: number;
    comment: string;
    tags: string[];
  }) => Promise<void>;
  booking: {
    id: string;
    service?: { id: string; name: string };
    serviceName?: string;
    specialist?: { id: string; firstName: string; lastName: string };
    specialistName?: string;
  };
  loading?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  booking,
  loading = false
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
      alert(t('reviews.pleaseSelectRating'));
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
      alert(t('reviews.submitError'));
    }
  };

  const toggleTag = (tag: string, displayTag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const serviceName = booking.service?.name || booking.serviceName || 'Unknown Service';
  const specialistName = booking.specialist 
    ? `${booking.specialist.firstName} ${booking.specialist.lastName}`
    : booking.specialistName || 'Unknown Specialist';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center px-4 py-4 sm:p-4">
      <div className={`relative w-full max-w-lg shadow-lg rounded-md ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-600' 
          : 'bg-white border-gray-300'
      } my-4 sm:my-8 mx-auto min-h-fit max-h-full`} style={{ 
        marginTop: 'max(1rem, 2vh)',
        maxHeight: 'calc(100vh - 2rem)'
      }}>
        <div className="p-4 sm:p-6 overflow-y-auto max-h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {t('reviews.leaveReview')}
            </h3>
            <button
              onClick={onClose}
              className={`${
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-gray-200' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Service Info */}
            <div className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <p><span className="font-medium">{t('booking.service')}:</span> {serviceName}</p>
              <p><span className="font-medium">{t('booking.specialist')}:</span> {specialistName}</p>
            </div>
            
            {/* Rating */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('reviews.rating')} <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    disabled={loading}
                  >
                    {(hoverRating || rating) >= star ? (
                      <StarIconSolid className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </button>
                ))}
                <span className={`ml-2 text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {rating > 0 && `${rating}/5`}
                </span>
              </div>
            </div>
            
            {/* Comment */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('reviews.comment')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className={`mt-1 block w-full border rounded-md shadow-sm px-3 py-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                placeholder={t('reviews.commentPlaceholder')}
                disabled={loading}
              />
            </div>
            
            {/* Tags */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('reviews.tags')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag, displayTags[index])}
                    disabled={loading}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`w-full sm:w-auto px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                }`}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading && <LoadingSpinner size="sm" className="mr-2" />}
                {t('reviews.submitReview')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;