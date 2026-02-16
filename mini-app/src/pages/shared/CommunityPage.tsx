import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Eye,
  Search,
  Plus,
  User,
  Image,
  Send,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useAppSelector } from '@/hooks/redux';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { addToast } from '@/store/slices/uiSlice';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { communityStrings, commonStrings } from '@/utils/translations';

// Matches backend response from getPosts() exactly
interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: string;
  image?: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  createdAt: string;
}

const POST_TYPES = ['ALL', 'DISCUSSION', 'TIP', 'QUESTION', 'SHOWCASE', 'EVENT'];

export const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hapticFeedback } = useTelegram();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const locale = useLocale();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', type: 'DISCUSSION' });
  const [creating, setCreating] = useState(false);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      if (!append) setLoading(true);
      const params: any = { page: pageNum, limit: 15 };
      if (activeFilter !== 'ALL') params.type = activeFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await apiService.getCommunityPosts(params) as any;
      const rawItems = data.items || data.posts || (Array.isArray(data) ? data : []);
      const items = rawItems.map((p: any) => ({
        ...p,
        likeCount: p.likeCount ?? 0,
        commentCount: p.commentCount ?? 0,
        viewCount: p.viewCount ?? 0,
        isLiked: p.isLiked ?? false,
        author: p.author || { id: '', firstName: '?', lastName: '' },
      }));
      if (append) {
        setPosts(prev => [...prev, ...items]);
      } else {
        setPosts(items);
      }
      setHasMore(pageNum < (data.pagination?.totalPages || 1));
    } catch {
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [activeFilter, fetchPosts]);

  const handleSearch = () => {
    setPage(1);
    fetchPosts(1);
  };

  const handleLike = async (post: CommunityPost) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    hapticFeedback.impactLight();
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ));

    try {
      if (post.isLiked) {
        await apiService.unlikeCommunityPost(post.id);
      } else {
        await apiService.likeCommunityPost(post.id);
      }
    } catch {
      setPosts(prev => prev.map(p =>
        p.id === post.id
          ? { ...p, isLiked: post.isLiked, likeCount: post.likeCount }
          : p
      ));
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      const msg = locale === 'uk' ? 'Заголовок та вміст обов\'язкові' : locale === 'ru' ? 'Заголовок и содержание обязательны' : 'Title and content are required';
      dispatch(addToast({ type: 'warning', title: t(communityStrings, 'missingFields', locale), message: msg }));
      return;
    }

    try {
      setCreating(true);
      await apiService.createCommunityPost(newPost);
      const successTitle = locale === 'uk' ? 'Опубліковано!' : locale === 'ru' ? 'Опубликовано!' : 'Posted!';
      const successMsg = locale === 'uk' ? 'Ваш пост опубліковано' : locale === 'ru' ? 'Ваш пост опубликован' : 'Your post has been published';
      dispatch(addToast({ type: 'success', title: successTitle, message: successMsg }));
      hapticFeedback.notificationSuccess();
      setShowCreatePost(false);
      setNewPost({ title: '', content: '', type: 'DISCUSSION' });
      fetchPosts(1);
    } catch {
      const errorMsg = locale === 'uk' ? 'Не вдалося створити пост' : locale === 'ru' ? 'Не удалось создать пост' : 'Failed to create post';
      dispatch(addToast({ type: 'error', title: t(commonStrings, 'error', locale), message: errorMsg }));
      hapticFeedback.notificationError();
    } finally {
      setCreating(false);
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={t(communityStrings, 'title', locale)}
        rightContent={
          isAuthenticated ? (
            <button
              onClick={() => { setShowCreatePost(true); hapticFeedback.impactLight(); }}
              className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center"
            >
              <Plus size={18} className="text-white" />
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto pb-20 page-stagger">
        {/* Search */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t(communityStrings, 'searchPosts', locale)}
              className="input-telegram w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {POST_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { setActiveFilter(type); hapticFeedback.selectionChanged(); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  activeFilter === type
                    ? 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary'
                }`}
              >
                {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        <div className="px-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <LoadingSpinner />
            </div>
          ) : posts.length === 0 ? (
            <Card className="text-center py-12">
              <MessageCircle size={40} className="text-text-secondary mx-auto mb-3" />
              <p className="text-text-primary font-medium">{t(communityStrings, 'noPosts', locale)}</p>
              <p className="text-text-secondary text-sm mt-1">{t(communityStrings, 'beFirst', locale)}</p>
              {isAuthenticated && (
                <Button size="sm" onClick={() => setShowCreatePost(true)} className="mt-4">
                  {t(communityStrings, 'createPost', locale)}
                </Button>
              )}
            </Card>
          ) : (
            <>
              {posts.map(post => (
                <Card key={post.id} hover onClick={() => { hapticFeedback.impactLight(); navigate(`/community/post/${post.id}`); }}>
                  {/* Author */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-bg-secondary flex-shrink-0">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={16} className="text-text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {post.author.firstName} {post.author.lastName}
                      </p>
                      <p className="text-xs text-text-secondary">{formatDate(post.createdAt)}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-bg-secondary rounded-full text-xs text-text-secondary">
                      {post.type.charAt(0) + post.type.slice(1).toLowerCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{post.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-3 mb-3">{post.content}</p>

                  {post.image && (
                    <div className="rounded-xl overflow-hidden mb-3 max-h-48">
                      <img src={post.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-5 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleLike(post)}
                      className="flex items-center gap-1.5"
                    >
                      <Heart
                        size={16}
                        className={post.isLiked ? 'text-accent-red fill-accent-red' : 'text-text-secondary'}
                      />
                      <span className="text-xs text-text-secondary">{post.likeCount}</span>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle size={16} className="text-text-secondary" />
                      <span className="text-xs text-text-secondary">{post.commentCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Eye size={16} className="text-text-secondary" />
                      <span className="text-xs text-text-secondary">{post.viewCount}</span>
                    </div>
                  </div>
                </Card>
              ))}

              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={() => { const n = page + 1; setPage(n); fetchPosts(n, true); }}
                  className="w-full"
                >
                  {locale === 'uk' ? 'Завантажити ще' : locale === 'ru' ? 'Загрузить ещё' : 'Load More'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Post Sheet */}
      <Sheet isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} title={t(communityStrings, 'createPost', locale)}>
        <div className="space-y-4">
          <Input
            label={t(communityStrings, 'postTitle', locale)}
            value={newPost.title}
            onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
            placeholder={locale === 'uk' ? 'Заголовок посту' : locale === 'ru' ? 'Заголовок поста' : 'Post title'}
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t(communityStrings, 'content', locale)}</label>
            <textarea
              value={newPost.content}
              onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
              rows={4}
              className="input-telegram w-full rounded-xl text-sm resize-none"
              placeholder={t(communityStrings, 'whatsOnMind', locale)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">{t(communityStrings, 'type', locale)}</label>
            <div className="flex flex-wrap gap-2">
              {POST_TYPES.filter(t => t !== 'ALL').map(type => (
                <button
                  key={type}
                  onClick={() => setNewPost(p => ({ ...p, type }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    newPost.type === type
                      ? 'bg-accent-primary text-white'
                      : 'bg-bg-secondary text-text-secondary'
                  }`}
                >
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleCreatePost} className="w-full" disabled={creating}>
            <Send size={16} className="mr-2" />
            {creating
              ? (locale === 'uk' ? 'Публікація...' : locale === 'ru' ? 'Публикация...' : 'Publishing...')
              : t(communityStrings, 'publishPost', locale)
            }
          </Button>
        </div>
      </Sheet>
    </div>
  );
};
