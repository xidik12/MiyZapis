import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Eye,
  Search,
  Plus,
  User,
  Tag,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useTelegram } from '@/components/telegram/TelegramProvider';
import { useAppSelector } from '@/hooks/redux';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import apiService from '@/services/api.service';
import { useLocale, t } from '@/hooks/useLocale';
import { formatDateRelative } from '@/utils/dateUtils';
import { communityStrings, commonStrings } from '@/utils/translations';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  type: string;
  image?: string;
  images?: string[];
  price?: number | null;
  currency?: string | null;
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

const POST_TYPES = ['ALL', 'DISCUSSION', 'SALE'];

const CURRENCY_SYMBOLS: Record<string, string> = {
  UAH: '₴', USD: '$', EUR: '€', GBP: '£',
};

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

  const cm = (key: string) => t(communityStrings, key, locale);
  const c = (key: string) => t(commonStrings, key, locale);

  const fetchPosts = useCallback(async (pageNum: number, append = false) => {
    try {
      if (!append) setLoading(true);
      const params: Record<string, unknown> = { page: pageNum, limit: 15 };
      if (activeFilter !== 'ALL') params.type = activeFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await apiService.getCommunityPosts(params) as any;
      const rawItems = data.items || data.posts || (Array.isArray(data) ? data : []);
      const items = rawItems.map((p: Record<string, unknown>) => {
        // Parse images from JSON string if needed
        let parsedImages: string[] = [];
        if (Array.isArray(p.images)) {
          parsedImages = p.images;
        } else if (typeof p.images === 'string') {
          try { parsedImages = JSON.parse(p.images); } catch { parsedImages = []; }
        }

        return {
          ...p,
          images: parsedImages,
          likeCount: p.likeCount ?? 0,
          commentCount: p.commentCount ?? 0,
          viewCount: p.viewCount ?? 0,
          isLiked: p.isLiked ?? false,
          author: p.author || { id: '', firstName: '?', lastName: '' },
        };
      });
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

  // Using shared formatDateRelative from @/utils/dateUtils
  const formatDate = (dateStr: string) =>
    formatDateRelative(dateStr, locale, (key) => c(key));

  const getTypeBadge = (type: string) => {
    if (type === 'SALE') {
      return { label: cm('sale'), color: 'bg-accent-green/15 text-accent-green' };
    }
    return { label: cm('discussion'), color: 'bg-bg-secondary text-text-secondary' };
  };

  const getFirstImage = (post: CommunityPost): string | null => {
    if (post.images && post.images.length > 0) return post.images[0];
    if (post.image) return post.image;
    return null;
  };

  const formatPrice = (price: number | null | undefined, currency: string | null | undefined) => {
    if (price == null) return null;
    const sym = CURRENCY_SYMBOLS[(currency || 'UAH').toUpperCase()] || currency || '';
    return `${sym}${Number(price).toLocaleString()}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Header
        title={cm('title')}
        rightContent={
          isAuthenticated ? (
            <button
              onClick={() => { navigate('/community/create'); hapticFeedback.impactLight(); }}
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
              placeholder={cm('searchPosts')}
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
                    ? type === 'SALE'
                      ? 'bg-accent-green text-white'
                      : 'bg-accent-primary text-white'
                    : 'bg-bg-secondary text-text-secondary'
                }`}
              >
                {type === 'ALL' ? cm('all') : type === 'SALE' ? cm('sale') : cm('discussion')}
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
              <p className="text-text-primary font-medium">{cm('noPosts')}</p>
              <p className="text-text-secondary text-sm mt-1">{cm('beFirst')}</p>
              {isAuthenticated && (
                <Button size="sm" onClick={() => navigate('/community/create')} className="mt-4">
                  {cm('createPost')}
                </Button>
              )}
            </Card>
          ) : (
            <>
              {posts.map(post => {
                const badge = getTypeBadge(post.type);
                const firstImage = getFirstImage(post);
                const priceStr = post.type === 'SALE' ? formatPrice(post.price, post.currency) : null;

                return (
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-sm font-semibold text-text-primary mb-1">{post.title}</h3>
                    <p className="text-sm text-text-secondary line-clamp-3 mb-3">{post.content}</p>

                    {/* Price badge for SALE posts */}
                    {priceStr && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <Tag size={14} className="text-accent-green" />
                        <span className="text-sm font-bold text-accent-green">{priceStr}</span>
                      </div>
                    )}

                    {/* Image */}
                    {firstImage && (
                      <div className="rounded-xl overflow-hidden mb-3 max-h-48">
                        <img src={firstImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-5 pt-2 border-t border-white/5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleLike(post); }}
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
                );
              })}

              {hasMore && (
                <Button
                  variant="secondary"
                  onClick={() => { const n = page + 1; setPage(n); fetchPosts(n, true); }}
                  className="w-full"
                >
                  {c('loadMore')}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
