import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import {
  StarIcon,
  HeartIcon,
  ChatCircleIcon as ChatBubbleLeftIcon,
  ShareIcon,
  CheckCircleIcon as CheckBadgeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  FlagIcon
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { SpecialistResponse } from './SpecialistResponse';
import { CommentThread } from './CommentThread';
import { reviewsService, ReviewComment } from '@/services/reviews.service';
import { RootState } from '@/store';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ReviewCardData {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  isVerified: boolean;
  likeCount: number;
  dislikeCount: number;
  userReaction?: 'like' | 'dislike' | null;
  commentCount?: number;
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
    likeCount?: number;
    dislikeCount?: number;
    userReaction?: 'like' | 'dislike' | null;
  };
}

interface ReviewCardProps {
  review: ReviewCardData;
  onReact?: (reviewId: string, reaction: 'like' | 'dislike' | null) => void;
  onReactToResponse?: (responseId: string, reaction: 'like' | 'dislike' | null) => void;
  onRespondToReview?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  index?: number;
}

const ReviewCardComponent: React.FC<ReviewCardProps> = ({
  review,
  onReact,
  onReactToResponse,
  onRespondToReview,
  onReport,
  index = 0
}) => {
  const { t } = useLanguage();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [showFullComment, setShowFullComment] = useState(false);
  const [showResponse, setShowResponse] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const customerName = `${review.customer.firstName} ${review.customer.lastName}`;
  const customerInitial = review.customer.firstName.charAt(0).toUpperCase();
  const hasAvatar = review.customer.avatar;
  const isLongComment = review.comment && review.comment.length > 200;
  const displayComment = showFullComment || !isLongComment
    ? review.comment
    : review.comment?.substring(0, 200) + '...';

  // Auto-expand comments if there are any
  useEffect(() => {
    const loadCommentsIfNeeded = async () => {
      if (review.commentCount && review.commentCount > 0 && comments.length === 0 && !isLoadingComments && !showComments) {
        try {
          setIsLoadingComments(true);
          const loadedComments = await reviewsService.getReviewComments(review.id);
          setComments(loadedComments);
          setShowComments(true);
        } catch (error: any) {
          console.error('[ReviewCard] Error auto-loading comments:', error);
          // Don't show error toast for auto-load, just fail silently
        } finally {
          setIsLoadingComments(false);
        }
      }
    };

    loadCommentsIfNeeded();
  }, [review.id, review.commentCount]); // Only run when review changes

  const handleLikeClick = () => {
    if (onReact) {
      // Toggle like: if already liked, remove it; otherwise set to like
      onReact(review.id, review.userReaction === 'like' ? null : 'like');
    }
  };

  const handleDislikeClick = () => {
    if (onReact) {
      // Toggle dislike: if already disliked, remove it; otherwise set to dislike
      onReact(review.id, review.userReaction === 'dislike' ? null : 'dislike');
    }
  };

  const handleReportClick = () => {
    if (onReport) {
      onReport(review.id);
    }
  };

  const handleCommentClick = async () => {
    // Toggle comment thread visibility
    if (showComments) {
      setShowComments(false);
    } else {
      // Load comments if not already loaded
      if (comments.length === 0 && !isLoadingComments) {
        try {
          setIsLoadingComments(true);
          const loadedComments = await reviewsService.getReviewComments(review.id);
          setComments(loadedComments);
          setShowComments(true);
        } catch (error: any) {
          console.error('[ReviewCard] Error loading comments:', error);
          toast.error(t('reviews.comments.loadError') || 'Failed to load comments');
        } finally {
          setIsLoadingComments(false);
        }
      } else {
        setShowComments(true);
      }
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

  // Comment handlers
  const handlePostComment = async (content: string, parentId?: string) => {
    try {
      const newComment = await reviewsService.createReviewComment(review.id, content, parentId);
      setComments(prevComments => [...prevComments, newComment]);
    } catch (error: any) {
      console.error('[ReviewCard] Error posting comment:', error);
      toast.error(error.message || 'Failed to post comment');
      throw error; // Re-throw so CommentThread can handle it
    }
  };

  const handleReactToComment = async (commentId: string, reaction: 'like' | 'dislike' | null) => {
    try {
      await reviewsService.reactToComment(review.id, commentId, reaction);

      // Update local state
      setComments(prevComments =>
        prevComments.map(comment => {
          if (comment.id === commentId) {
            const oldReaction = comment.userReaction;
            const newLikeCount = reaction === 'like'
              ? comment.likeCount + 1
              : oldReaction === 'like'
              ? comment.likeCount - 1
              : comment.likeCount;
            const newDislikeCount = reaction === 'dislike'
              ? comment.dislikeCount + 1
              : oldReaction === 'dislike'
              ? comment.dislikeCount - 1
              : comment.dislikeCount;

            return {
              ...comment,
              userReaction: reaction,
              likeCount: newLikeCount,
              dislikeCount: newDislikeCount
            };
          }
          return comment;
        })
      );
    } catch (error: any) {
      console.error('[ReviewCard] Error reacting to comment:', error);
      toast.error(error.message || 'Failed to react to comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await reviewsService.deleteComment(review.id, commentId);

      // Remove comment from local state
      setComments(prevComments => prevComments.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      console.error('[ReviewCard] Error deleting comment:', error);
      toast.error(error.message || 'Failed to delete comment');
      throw error; // Re-throw so CommentThread can handle it
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
          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
              review.userReaction === 'like'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <HandThumbUpIcon
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${review.userReaction === 'like' ? 'text-green-600 dark:text-green-400' : ''}`}
            />
            <span className="text-xs font-semibold whitespace-nowrap">{review.likeCount || 0}</span>
          </button>

          {/* Dislike Button */}
          <button
            onClick={handleDislikeClick}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
              review.userReaction === 'dislike'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <HandThumbDownIcon
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${review.userReaction === 'dislike' ? 'text-red-600 dark:text-red-400' : ''}`}
            />
            <span className="text-xs font-semibold whitespace-nowrap">{review.dislikeCount || 0}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleCommentClick}
            disabled={isLoadingComments}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              showComments
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <ChatBubbleLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap">
              {(() => {
                if (isLoadingComments) {
                  return t('reviews.comments.loading') || 'Loading...';
                }

                // Use loaded comments length if available, otherwise use commentCount from review data
                const count = comments.length > 0 ? comments.length : (review.commentCount || 0);

                if (count > 0) {
                  return `${count} ${count === 1 ? (t('reviews.comments.comment') || 'Comment') : (t('reviews.comments.comments') || 'Comments')}`;
                }

                return t('reviews.comments.comment') || 'Comment';
              })()}
            </span>
          </button>

          {/* Respond Button (for specialists) */}
          {onRespondToReview && !review.response && (
            <button
              onClick={() => onRespondToReview(review.id)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <ChatBubbleLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Respond</span>
            </button>
          )}

          {/* Report Button */}
          {onReport && (
            <button
              onClick={handleReportClick}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <FlagIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-xs font-semibold whitespace-nowrap">Report</span>
            </button>
          )}

          {/* Share Button */}
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
      {review.response && showResponse && (
        <SpecialistResponse
          response={review.response}
          onReact={onReactToResponse ? (responseId, reaction) => onReactToResponse(review.id, reaction) : undefined}
          isExpanded={showResponse}
          onToggle={() => setShowResponse(!showResponse)}
        />
      )}

      {/* Comment Thread */}
      {showComments && (
        <CommentThread
          comments={comments}
          currentUserId={currentUser?.id}
          onPostComment={handlePostComment}
          onReact={handleReactToComment}
          onDelete={handleDeleteComment}
        />
      )}
    </motion.div>
  );
};

export const ReviewCard = React.memo(ReviewCardComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.review.id === nextProps.review.id &&
    prevProps.review.userReaction === nextProps.review.userReaction &&
    prevProps.review.likeCount === nextProps.review.likeCount &&
    prevProps.review.dislikeCount === nextProps.review.dislikeCount &&
    prevProps.review.response?.userReaction === nextProps.review.response?.userReaction &&
    prevProps.review.response?.likeCount === nextProps.review.response?.likeCount &&
    prevProps.review.response?.dislikeCount === nextProps.review.response?.dislikeCount &&
    prevProps.index === nextProps.index
  );
});
