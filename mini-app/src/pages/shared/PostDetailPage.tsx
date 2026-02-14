import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Heart,
  MessageCircle,
  Eye,
  User,
  Send,
  Trash2,
  CornerDownRight,
  Share,
  ArrowLeft,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { RootState, AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { postDetailStrings, communityStrings, commonStrings } from '@/utils/translations';

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: string;
  image?: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: PostAuthor;
  parentId?: string | null;
  replies?: Comment[];
  createdAt: string;
}

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const locale = useLocale();
  const { hapticFeedback } = useTelegram();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const inputRef = useRef<HTMLInputElement>(null);

  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const s = (key: string) => t(postDetailStrings, key, locale);
  const cm = (key: string) => t(communityStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCommunityPost(id) as any;
      setPost(data);
    } catch {
      setError(c('error'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsLoading(true);
      const data = await apiService.getPostComments(id) as any;
      const items: Comment[] = data.items || data || [];
      // Nest replies under their parent comments
      const topLevel: Comment[] = [];
      const repliesMap: Record<string, Comment[]> = {};

      items.forEach((comment: Comment) => {
        if (comment.parentId) {
          if (!repliesMap[comment.parentId]) {
            repliesMap[comment.parentId] = [];
          }
          repliesMap[comment.parentId].push(comment);
        } else {
          topLevel.push(comment);
        }
      });

      topLevel.forEach(comment => {
        comment.replies = repliesMap[comment.id] || [];
      });

      setComments(topLevel);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 1) {
      return locale === 'uk' ? 'Щойно' : locale === 'ru' ? 'Только что' : 'Just now';
    }
    if (diffHrs < 24) {
      const hrs = Math.floor(diffHrs);
      return locale === 'uk' ? `${hrs}г тому` : locale === 'ru' ? `${hrs}ч назад` : `${hrs}h ago`;
    }
    if (diffHrs < 48) {
      return locale === 'uk' ? 'Вчора' : locale === 'ru' ? 'Вчера' : 'Yesterday';
    }
    return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' });
  };

  const handleLike = async () => {
    if (!post) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    hapticFeedback.impactLight();

    // Optimistic update
    setPost(prev => prev ? {
      ...prev,
      isLiked: !prev.isLiked,
      likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
    } : null);

    try {
      if (post.isLiked) {
        await apiService.unlikeCommunityPost(post.id);
      } else {
        await apiService.likeCommunityPost(post.id);
      }
    } catch {
      // Revert on failure
      setPost(prev => prev ? {
        ...prev,
        isLiked: post.isLiked,
        likesCount: post.likesCount,
      } : null);
    }
  };

  const handleSubmitComment = async () => {
    if (!id || !commentText.trim()) return;
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    try {
      setSubmitting(true);
      hapticFeedback.impactLight();

      const data: { content: string; parentId?: string } = { content: commentText.trim() };
      if (replyingTo) {
        data.parentId = replyingTo.id;
      }

      await apiService.createComment(id, data);
      dispatch(addToast({ type: 'success', title: s('commentAdded'), message: '' }));
      hapticFeedback.notificationSuccess();
      setCommentText('');
      setReplyingTo(null);
      fetchComments();

      // Update post comment count optimistically
      setPost(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);
    } catch {
      dispatch(addToast({ type: 'error', title: c('error'), message: s('commentFailed') }));
      hapticFeedback.notificationError();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      hapticFeedback.impactLight();
      await apiService.deleteComment(id, commentId);
      dispatch(addToast({ type: 'success', title: s('commentDeleted'), message: '' }));
      fetchComments();
      setPost(prev => prev ? { ...prev, commentsCount: Math.max(0, prev.commentsCount - 1) } : null);
    } catch {
      dispatch(addToast({ type: 'error', title: c('error'), message: '' }));
      hapticFeedback.notificationError();
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo({ id: comment.id, authorName: `${comment.author.firstName} ${comment.author.lastName}` });
    hapticFeedback.selectionChanged();
    inputRef.current?.focus();
  };

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: post.content.slice(0, 100),
        url: window.location.href,
      });
    }
    hapticFeedback.selectionChanged();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-primary">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-bg-primary">
        <Header showBackButton title={cm('title')} />
        <div className="flex-1 flex items-center justify-center px-4">
          <Card className="text-center py-12 w-full">
            <p className="text-text-primary font-medium mb-2">{error || c('error')}</p>
            <Button variant="secondary" onClick={() => fetchPost()}>
              {c('retry')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-10' : ''}`}>
      <div className="flex gap-2.5 py-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
          {comment.author.avatar ? (
            <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={14} className="text-text-secondary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-medium text-text-primary truncate">
              {comment.author.firstName} {comment.author.lastName}
            </span>
            <span className="text-xs text-text-muted flex-shrink-0">{formatDate(comment.createdAt)}</span>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4 mt-1.5">
            {!isReply && (
              <button
                onClick={() => handleReply(comment)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-primary transition-colors"
              >
                <CornerDownRight size={12} />
                {s('reply')}
              </button>
            )}
            {user && comment.author.id === (user as any).id && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-red transition-colors"
              >
                <Trash2 size={12} />
                {s('deleteComment')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(reply => renderComment(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        showBackButton
        title={cm('title')}
        rightContent={
          <button onClick={handleShare} className="p-2 touch-manipulation">
            <Share size={20} className="text-text-secondary" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Post Content */}
        <div className="px-4 pt-4">
          <Card>
            {/* Author */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={18} className="text-text-secondary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {post.author.firstName} {post.author.lastName}
                </p>
                <p className="text-xs text-text-secondary">{formatDate(post.createdAt)}</p>
              </div>
              <span className="px-2.5 py-1 bg-accent-primary/15 text-accent-primary rounded-full text-xs font-medium">
                {post.type.charAt(0) + post.type.slice(1).toLowerCase()}
              </span>
            </div>

            {/* Title & Content */}
            <h1 className="text-lg font-bold text-text-primary mb-2">{post.title}</h1>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

            {/* Post Image */}
            {post.image && (
              <div className="rounded-xl overflow-hidden mb-3">
                <img src={post.image} alt="" className="w-full object-cover max-h-72" />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-5 pt-3 border-t border-white/5">
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 touch-manipulation"
              >
                <Heart
                  size={18}
                  className={post.isLiked ? 'text-accent-red fill-accent-red' : 'text-text-secondary'}
                />
                <span className={`text-sm ${post.isLiked ? 'text-accent-red' : 'text-text-secondary'}`}>
                  {post.likesCount}
                </span>
              </button>
              <div className="flex items-center gap-1.5">
                <MessageCircle size={18} className="text-text-secondary" />
                <span className="text-sm text-text-secondary">{post.commentsCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={18} className="text-text-secondary" />
                <span className="text-sm text-text-secondary">{post.viewsCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Comments Section */}
        <div className="px-4 pt-4">
          <h3 className="text-sm font-semibold text-text-primary mb-2">
            {s('comments')} ({post.commentsCount})
          </h3>

          {commentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : comments.length === 0 ? (
            <Card className="text-center py-8">
              <MessageCircle size={32} className="text-text-secondary mx-auto mb-2" />
              <p className="text-text-primary font-medium text-sm">{s('noComments')}</p>
              <p className="text-text-secondary text-xs mt-1">{s('beFirstComment')}</p>
            </Card>
          ) : (
            <div className="divide-y divide-white/5">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Comment Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg-secondary/95 backdrop-blur-xl border-t border-white/5 px-4 py-3 z-20">
        {/* Reply indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <CornerDownRight size={14} className="text-accent-primary" />
              <span className="text-xs text-accent-primary">
                {s('reply')} {replyingTo.authorName}
              </span>
            </div>
            <button
              onClick={() => { setReplyingTo(null); hapticFeedback.selectionChanged(); }}
              className="text-xs text-text-muted"
            >
              {c('cancel')}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !submitting && handleSubmitComment()}
            placeholder={s('addComment')}
            className="input-telegram flex-1 py-2.5 px-4 rounded-xl text-sm"
            disabled={submitting}
          />
          <button
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || submitting}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
              commentText.trim() && !submitting
                ? 'bg-accent-primary text-white'
                : 'bg-bg-hover text-text-muted'
            }`}
          >
            {submitting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
