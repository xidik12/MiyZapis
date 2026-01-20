import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice';
import { communityService, Comment, Post } from '@/services';
import { PageLoader } from '@/components/ui';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [activeReply, setActiveReply] = useState<string | null>(null);

  const isOwner = post && user ? post.authorId === user.id : false;

  const loadPost = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await communityService.getPostById(postId);
      setPost(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    try {
      setCommentsLoading(true);
      const response = await communityService.getComments(postId, 1, 50);
      setComments(response.comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    loadPost();
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handlePostLike = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      toast.info(t('community.loginToLike') || 'Login to like posts');
      return;
    }
    try {
      const response = await communityService.togglePostLike(post.id);
      setPost({ ...post, isLiked: response.liked, likeCount: response.likeCount });
    } catch (err) {
      toast.error(t('community.likeFailed') || 'Failed to like post');
    }
  };

  const updateCommentLike = (items: Comment[], commentId: string, liked: boolean, likeCount: number): Comment[] => {
    return items.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, isLiked: liked, likeCount };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: updateCommentLike(comment.replies, commentId, liked, likeCount) };
      }
      return comment;
    });
  };

  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      toast.info(t('community.loginToLike') || 'Login to like comments');
      return;
    }
    try {
      const response = await communityService.toggleCommentLike(commentId);
      setComments((prev) => updateCommentLike(prev, commentId, response.liked, response.likeCount));
    } catch (err) {
      toast.error(t('community.likeFailed') || 'Failed to like comment');
    }
  };

  const handleCreateComment = async () => {
    if (!postId || !commentText.trim()) return;
    if (!isAuthenticated) {
      toast.info(t('community.loginToComment') || 'Login to comment');
      return;
    }
    try {
      await communityService.createComment(postId, commentText.trim());
      setCommentText('');
      loadComments();
      toast.success(t('community.commentAdded') || 'Comment added');
    } catch (err: any) {
      toast.error(err.message || t('community.commentFailed') || 'Failed to add comment');
    }
  };

  const handleReply = async (parentId: string) => {
    if (!postId) return;
    const content = replyText[parentId]?.trim();
    if (!content) return;
    if (!isAuthenticated) {
      toast.info(t('community.loginToComment') || 'Login to comment');
      return;
    }
    try {
      await communityService.createComment(postId, content, parentId);
      setReplyText((prev) => ({ ...prev, [parentId]: '' }));
      setActiveReply(null);
      loadComments();
      toast.success(t('community.commentAdded') || 'Comment added');
    } catch (err: any) {
      toast.error(err.message || t('community.commentFailed') || 'Failed to add reply');
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;
    if (!window.confirm(t('community.deleteConfirm') || 'Delete this post?')) {
      return;
    }
    try {
      await communityService.deletePost(post.id);
      toast.success(t('community.postDeleted') || 'Post deleted');
      navigate('/community');
    } catch (err: any) {
      toast.error(err.message || t('community.deleteFailed') || 'Failed to delete post');
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  const renderComment = (comment: Comment, depth: number = 0) => (
    <div key={comment.id} className={`border-l ${depth > 0 ? 'ml-4 pl-4' : ''} border-gray-200 dark:border-gray-700`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {comment.author.avatar ? (
            <img
              src={getAbsoluteImageUrl(comment.author.avatar)}
              alt={comment.author.firstName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {comment.author.firstName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-white">
              {comment.author.firstName} {comment.author.lastName?.charAt(0)}.
            </span>
            <span>{formatDate(comment.createdAt)}</span>
          </div>
          <p className="mt-1 text-gray-700 dark:text-gray-300">{comment.content}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={() => handleCommentLike(comment.id)}
              className={`flex items-center gap-1 ${comment.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              {comment.isLiked ? <HeartIconSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
              <span>{comment.likeCount}</span>
            </button>
            <button
              onClick={() => setActiveReply(activeReply === comment.id ? null : comment.id)}
              className="hover:text-primary-500"
            >
              {t('community.reply') || 'Reply'}
            </button>
          </div>
          {activeReply === comment.id && (
            <div className="mt-3">
              <textarea
                value={replyText[comment.id] || ''}
                onChange={(e) => setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                placeholder={t('community.addReply') || 'Write a reply...'}
                className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                rows={3}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => handleReply(comment.id)}
                  className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
                >
                  {t('community.postReply') || 'Post reply'}
                </button>
                <button
                  onClick={() => setActiveReply(null)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
              </div>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map((reply) => renderComment(reply, depth + 1))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <PageLoader />;
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-red-500">{error || 'Post not found'}</p>
        <Link to="/community" className="text-primary-500 hover:underline mt-4 inline-flex items-center">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          {t('community.backToCommunity') || 'Back to Community'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/community" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-primary-500 mb-6">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          {t('community.backToCommunity') || 'Back to Community'}
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.type === 'DISCUSSION'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}
                >
                  {post.type === 'DISCUSSION'
                    ? t('community.type.discussion') || 'Discussion'
                    : t('community.type.sale') || 'Marketplace'}
                </span>
                {post.isPinned && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                    {t('community.pinned') || 'Pinned'}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {post.author.firstName} {post.author.lastName} • {formatDate(post.createdAt)}
              </div>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <Link
                  to={`/community/edit/${post.id}`}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.edit') || 'Edit'}
                </Link>
                <button
                  onClick={handleDeletePost}
                  className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  {t('common.delete') || 'Delete'}
                </button>
              </div>
            )}
          </div>

          {post.type === 'SALE' && post.price != null && (
            <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="text-xl font-bold text-green-700 dark:text-green-300">
                {post.price.toLocaleString()} {post.currency || 'UAH'}
              </div>
              {post.isPreview ? (
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                  {t('community.loginToView') || 'Login to view full content'}
                </p>
              ) : (
                <div className="mt-3 text-sm text-green-700 dark:text-green-300 space-y-1">
                  {post.contactPhone && <div>{t('community.form.contactPhone') || 'Contact Phone'}: {post.contactPhone}</div>}
                  {post.contactEmail && <div>{t('community.form.contactEmail') || 'Contact Email'}: {post.contactEmail}</div>}
                </div>
              )}
            </div>
          )}

          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {post.images.map((image, index) => (
                <img
                  key={`${post.id}-image-${index}`}
                  src={getAbsoluteImageUrl(image)}
                  alt={`${post.title} ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          <div className="mt-6 text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {post.content}
          </div>

          {post.isPreview && !isAuthenticated && (
            <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
              <p className="text-primary-700 dark:text-primary-300">
                {t('community.loginToView') || 'Login to view full content'}
              </p>
              <div className="mt-3 flex gap-3">
                <Link to="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
                  {t('auth.login') || 'Login'}
                </Link>
                <Link to="/register" className="px-4 py-2 border border-primary-200 text-primary-700 rounded-lg">
                  {t('auth.register') || 'Register'}
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center gap-6 mt-6 text-gray-500 dark:text-gray-400">
            <button
              onClick={handlePostLike}
              className={`flex items-center gap-1.5 ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              {post.isLiked ? <HeartIconSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
              <span>{post.likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5">
              <ChatBubbleLeftIcon className="w-5 h-5" />
              <span>{post.commentCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <EyeIcon className="w-5 h-5" />
              <span>{post.viewCount}</span>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('community.comments') || 'Comments'}
          </h2>

          {isAuthenticated ? (
            <div className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('community.addComment') || 'Add a comment...'}
                className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                rows={4}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleCreateComment}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  {t('community.postComment') || 'Post comment'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl text-gray-600 dark:text-gray-400">
              {t('community.loginToComment') || 'Login to comment'}
            </div>
          )}

          {commentsLoading ? (
            <div className="text-gray-500 dark:text-gray-400">{t('common.loading') || 'Loading...'}</div>
          ) : comments.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              {t('community.noComments') || 'No comments yet'}
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
