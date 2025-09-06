import React, { useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useLanguage } from '../../contexts/LanguageContext';
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
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoverRating, setHoverRating] = useState(0);

  const availableTags = [
    'Professional',
    'On Time',
    'Great Communication',
    'High Quality',
    'Friendly',
    'Would Recommend',
    'Clean Workspace',
    'Fair Price'
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

  const toggleTag = (tag: string) => {
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 max-w-lg shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {t('reviews.leaveReview')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Service Info */}
            <div className="text-sm text-gray-600">
              <p><span className="font-medium">{t('booking.service')}:</span> {serviceName}</p>
              <p><span className="font-medium">{t('booking.specialist')}:</span> {specialistName}</p>
            </div>
            
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <span className="ml-2 text-sm text-gray-600">
                  {rating > 0 && `${rating}/5`}
                </span>
              </div>
            </div>
            
            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reviews.comment')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
                placeholder={t('reviews.commentPlaceholder')}
                disabled={loading}
              />
            </div>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('reviews.tags')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    disabled={loading}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || rating === 0}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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