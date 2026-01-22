import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon,
  TrashIcon
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { ReviewComment } from '@/services/reviews.service';
import { useLanguage } from '@/contexts/LanguageContext';

interface CommentThreadProps {
  comments: ReviewComment[];
  currentUserId?: string;
  onPostComment: (content: string, parentId?: string) => Promise<void>;
  onReact: (commentId: string, reaction: 'like' | 'dislike' | null) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

interface CommentItemProps {
  comment: ReviewComment;
  currentUserId?: string;
  onReply: (commentId: string) => void;
  onReact: (commentId: string, reaction: 'like' | 'dislike' | null) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  isReplyOpen: boolean;
  onCancelReply: () => void;
  onSubmitReply: (content: string, parentId: string) => Promise<void>;
  replies: ReviewComment[];
  depth: number;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onReact,
  onDelete,
  isReplyOpen,
  onCancelReply,
  onSubmitReply,
  replies,
  depth
}) => {
  const { t } = useLanguage();
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwnComment = currentUserId === comment.user.id;
  const userName = `${comment.user.firstName} ${comment.user.lastName}`;
  const initial = comment.user.firstName.charAt(0).toUpperCase();

  const handleLikeClick = async () => {
    await onReact(comment.id, comment.userReaction === 'like' ? null : 'like');
  };

  const handleDislikeClick = async () => {
    await onReact(comment.id, comment.userReaction === 'dislike' ? null : 'dislike');
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmitReply(replyContent.trim(), comment.id);
      setReplyContent('');
      onCancelReply();
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('reviews.comments.deleteConfirm') || 'Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(comment.id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 sm:ml-12 border-l-2 border-gray-200 dark:border-gray-700 pl-3 sm:pl-4' : ''}`}>
      <div className="py-3">
        {/* Comment Header */}
        <div className="flex items-start gap-2 sm:gap-3 mb-2">
          {comment.user.avatar ? (
            <Avatar
              src={comment.user.avatar}
              alt={userName}
              size="sm"
              className="w-8 h-8"
            />
          ) : (
            <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">{initial}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {userName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
            </div>

            {/* Comment Content */}
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words mb-2">
              {comment.content}
            </p>

            {/* Engagement Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Like Button */}
              <button
                onClick={handleLikeClick}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95 ${
                  comment.userReaction === 'like'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <HandThumbUpIcon className="w-3 h-3" />
                <span className="text-xs font-semibold">{comment.likeCount || 0}</span>
              </button>

              {/* Dislike Button */}
              <button
                onClick={handleDislikeClick}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:scale-105 active:scale-95 ${
                  comment.userReaction === 'dislike'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <HandThumbDownIcon className="w-3 h-3" />
                <span className="text-xs font-semibold">{comment.dislikeCount || 0}</span>
              </button>

              {/* Reply Button */}
              {depth < 3 && ( // Limit nesting depth
                <button
                  onClick={() => onReply(comment.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-105 active:scale-95"
                >
                  <ChatBubbleLeftIcon className="w-3 h-3" />
                  <span className="text-xs font-semibold">
                    {t('reviews.comments.reply') || 'Reply'}
                  </span>
                </button>
              )}

              {/* Delete Button (own comments only) */}
              {isOwnComment && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="w-3 h-3" />
                  <span className="text-xs font-semibold">
                    {isDeleting ? (t('common.deleting') || 'Deleting...') : (t('common.delete') || 'Delete')}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Reply Input */}
        <AnimatePresence>
          {isReplyOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 ml-8 sm:ml-11"
            >
              <div className="flex gap-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t('reviews.comments.replyPlaceholder') || 'Write a reply...'}
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={onCancelReply}
                  disabled={isSubmitting}
                  className="px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="px-3 py-1 text-xs font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (t('common.posting') || 'Posting...') : (t('reviews.comments.post') || 'Post')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested Replies */}
        {replies.length > 0 && (
          <div className="mt-2">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                onReply={onReply}
                onReact={onReact}
                onDelete={onDelete}
                isReplyOpen={false}
                onCancelReply={() => {}}
                onSubmitReply={onSubmitReply}
                replies={[]}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CommentThread: React.FC<CommentThreadProps> = ({
  comments,
  currentUserId,
  onPostComment,
  onReact,
  onDelete
}) => {
  const { t } = useLanguage();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Build comment tree structure
  const commentTree = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onPostComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleSubmitReply = async (content: string, parentId: string) => {
    await onPostComment(content, parentId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="p-4 sm:p-6">
        {/* Comment count header */}
        <div className="flex items-center gap-2 mb-4">
          <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {comments.length} {comments.length === 1
              ? (t('reviews.comments.comment') || 'Comment')
              : (t('reviews.comments.comments') || 'Comments')}
          </h3>
        </div>

        {/* New Comment Input */}
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('reviews.comments.placeholder') || 'Add a comment...'}
            rows={3}
            className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
            disabled={isSubmitting}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (t('common.posting') || 'Posting...') : (t('reviews.comments.post') || 'Post Comment')}
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-1">
          {commentTree.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('reviews.comments.empty') || 'No comments yet. Be the first to comment!'}
              </p>
            </div>
          ) : (
            commentTree.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onReply={handleReply}
                onReact={onReact}
                onDelete={onDelete}
                isReplyOpen={replyingTo === comment.id}
                onCancelReply={handleCancelReply}
                onSubmitReply={handleSubmitReply}
                replies={getReplies(comment.id)}
                depth={0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
