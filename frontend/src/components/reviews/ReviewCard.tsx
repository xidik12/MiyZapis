import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import {
  StarIcon,
  HeartIcon,
  ChatCircleIcon as ChatBubbleLeftIcon,
  ShareIcon,
  CheckCircleIcon as CheckBadgeIcon
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { SpecialistResponse } from './SpecialistResponse';

export interface ReviewCardData {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isVerified: boolean;
  helpfulCount: number;
  isHelpful?: boolean;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  service?: {
    id: string;
    name: string;
  };
  response?: {
    id: string;
    responseText: string;
    createdAt: string;
    respondedBy: {
      id: string;
      businessName?: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    helpfulCount?: number;
    isHelpful?: boolean;
  };
}

interface ReviewCardProps {
  review: ReviewCardData;
  onMarkHelpful?: (reviewId: string, helpful: boolean) => void;
  onMarkResponseHelpful?: (responseId: string, helpful: boolean) => void;
  index?: number;
}

const ReviewCardComponent: React.FC<ReviewCardProps> = ({
  review,
  onMarkHelpful,
  onMarkResponseHelpful,
  index = 0
}) => {
  const [showFullComment, setShowFullComment] = useState(false);
  const [showResponse, setShowResponse] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  const customerName = `${review.customer.firstName} ${review.customer.lastName}`;
  const customerInitial = review.customer.firstName.charAt(0).toUpperCase();
  const hasAvatar = review.customer.avatar;
  const isLongComment = review.comment && review.comment.length > 200;
  const displayComment = showFullComment || !isLongComment
    ? review.comment
    : review.comment?.substring(0, 200) + '...';

  const handleHelpfulClick = () => {
    if (onMarkHelpful) {
      onMarkHelpful(review.id, !review.isHelpful);
    }
  };

  const handleCommentClick = () => {
    // Toggle showing the specialist response if it exists
    if (review.response) {
      setShowResponse(!showResponse);
    } else {
      toast.info('No responses yet for this review');
    }
  };

  const handleShareClick = async () => {
    if (isSharing) return;

    try {
      setIsSharing(true);

      // Try to use Web Share API if available (mobile)
      if (navigator.share) {
        await navigator.share({
          title: `Review by ${customerName}`,
          text: review.comment || `${review.rating} star review`,
          url: window.location.href
        });
        toast.success('Shared successfully!');
      } else {
        // Fallback: Copy to clipboard
        const reviewUrl = `${window.location.origin}${window.location.pathname}#review-${review.id}`;
        await navigator.clipboard.writeText(reviewUrl);
        toast.success('Review link copied to clipboard!');
      }
    } catch (error: any) {
      // User cancelled share or clipboard failed
      if (error.name !== 'AbortError') {
        console.error('[ReviewCard] Share error:', error);
        toast.error('Failed to share review');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`w-4 h-4 sm:w-5 sm:h-5 ${
              star <= review.rating
                ? 'text-yellow-500'
                : 'text-gray-300 dark:text-gray-600'
            }`}
            active={star <= review.rating}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3, ease: 'easeOut' }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      {/* Header Section */}
      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          {/* Avatar */}
          {hasAvatar ? (
            <Avatar
              src={review.customer.avatar}
              alt={customerName}
              size="lg"
              className="w-10 h-10 sm:w-12 sm:h-12"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">
                {customerInitial}
              </span>
            </div>
          )}

          {/* Customer Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                {customerName}
              </h3>
              {review.isVerified && (
                <CheckBadgeIcon
                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                  title="Verified Purchase"
                />
              )}
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              {renderStars()}
            </div>

            {/* Timestamp */}
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Service Badge */}
        {review.service && (
          <div className="mb-2.5 sm:mb-3">
            <span className="inline-block px-2.5 sm:px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
              {review.service.name}
            </span>
          </div>
        )}

        {/* Comment */}
        {review.comment && (
          <div className="mb-2.5 sm:mb-3">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm whitespace-pre-wrap break-words">
              {displayComment}
            </p>
            {isLongComment && (
              <button
                onClick={() => setShowFullComment(!showFullComment)}
                className="text-primary-600 dark:text-primary-400 text-xs sm:text-sm font-semibold mt-1 hover:underline"
              >
                {showFullComment ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {review.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold"
              >
                🏷️ {tag}
              </span>
            ))}
          </div>
        )}

        {/* Engagement Section */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handleHelpfulClick}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
              review.isHelpful
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <HeartIcon
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${review.isHelpful ? 'text-primary-600 dark:text-primary-400' : ''}`}
              active={review.isHelpful}
            />
            <span className="text-xs font-semibold whitespace-nowrap">{review.helpfulCount} Helpful</span>
          </button>

          <button
            onClick={handleCommentClick}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
              showResponse && review.response
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ChatBubbleLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap">
              {review.response ? '1 Comment' : 'Comment'}
            </span>
          </button>

          <button
            onClick={handleShareClick}
            disabled={isSharing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShareIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap">{isSharing ? 'Sharing...' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Specialist Response */}
      {review.response && (
        <SpecialistResponse
          response={review.response}
          onMarkHelpful={onMarkResponseHelpful}
          isExpanded={showResponse}
          onToggle={() => setShowResponse(!showResponse)}
        />
      )}
    </motion.div>
  );
};

export const ReviewCard = React.memo(ReviewCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.review.id === nextProps.review.id &&
    prevProps.review.isHelpful === nextProps.review.isHelpful &&
    prevProps.review.helpfulCount === nextProps.review.helpfulCount &&
    prevProps.review.response?.isHelpful === nextProps.review.response?.isHelpful &&
    prevProps.index === nextProps.index
  );
});
