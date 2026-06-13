import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { communityService, Post, PostType } from '@/services';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { formatDateRelative } from '@/utils/dateUtils';
import {
  PlusIcon,
  HeartIcon,
  ChatCircleIcon as ChatBubbleLeftIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  StarIcon as BookmarkIcon,
  FunnelIcon,
  XIcon as XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon as HeartIconSolid,
  StarIcon as BookmarkIconSolid,
} from '@/components/icons';
import CreatePostFAB from '@/components/community/CreatePostFAB';
import HashtagChips from '@/components/community/HashtagChips';
import TrendingRail from '@/components/community/TrendingRail';
import { topHashtags, hashtagToSearchQuery } from '@/utils/hashtags';

type SortBy = 'createdAt' | 'likeCount' | 'commentCount';
type ViewMode = 'ALL' | PostType | 'SAVED';

interface FilterPreset {
  name: string;
  data: {
    activeFilter: ViewMode;
    searchQuery: string;
    sortBy: SortBy;
    minPrice: string;
    maxPrice: string;
  };
}

const PRESETS_KEY = 'community-presets';
const MAX_PRESETS = 8;

// ── Skeleton loader ─────────────────────────────────────────────────────────
const PostCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-start gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 min-w-0">
        {/* Badge row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Title */}
        <div className="h-6 w-3/4 rounded-md bg-gray-200 dark:bg-gray-700 mb-2" />
        {/* Content lines */}
        <div className="space-y-1.5 mt-3">
          <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Meta */}
        <div className="flex items-center gap-4 mt-4">
          <div className="h-3.5 w-24 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3.5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Action pills */}
        <div className="flex items-center gap-6 mt-4">
          <div className="h-5 w-10 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-10 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-10 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      {/* Image thumb */}
      <div className="flex-shrink-0 hidden sm:block w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);

// ── Lightbox ────────────────────────────────────────────────────────────────
interface LightboxProps {
  images: string[];
  index: number;
  onClose: () => void;
  onNav: (idx: number) => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, index, onClose, onNav }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNav((index - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') onNav((index + 1) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, index, onClose, onNav]);

  return (
    <div
      className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full select-none">
        {index + 1} / {images.length}
      </div>
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <XMarkIcon className="w-8 h-8" />
      </button>
      {/* Image */}
      <img
        src={getAbsoluteImageUrl(images[index])}
        alt={`Image ${index + 1}`}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      />
      {/* Arrow buttons */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
            onClick={(e) => { e.stopPropagation(); onNav((index - 1 + images.length) % images.length); }}
            aria-label="Previous image"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-colors"
            onClick={(e) => { e.stopPropagation(); onNav((index + 1) % images.length); }}
            aria-label="Next image"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </>
      )}
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const CommunityPage: React.FC = () => {
  const { t } = useLanguage();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<ViewMode>(
    (searchParams.get('type') as ViewMode) || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Presets state
  const [presets, setPresets] = useState<FilterPreset[]>(() => {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      return raw ? (JSON.parse(raw) as FilterPreset[]) : [];
    } catch {
      return [];
    }
  });
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState('');
  const presetInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // Active hashtag filter (drives a #-prefixed search query)
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null);

  // Trending hashtags derived from the current feed
  const topTags = useMemo(() => topHashtags(posts, 12), [posts]);

  const handleHashtagSelect = (slug: string | null) => {
    setActiveHashtag(slug);
    setSearchQuery(slug ? hashtagToSearchQuery(slug) : '');
    setCurrentPage(1);
    setSearchParams((params) => {
      if (slug) params.set('search', hashtagToSearchQuery(slug));
      else params.delete('search');
      params.set('page', '1');
      return params;
    });
  };

  // Persist presets to localStorage
  useEffect(() => {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }, [presets]);

  // Focus preset input when shown
  useEffect(() => {
    if (showPresetInput) presetInputRef.current?.focus();
  }, [showPresetInput]);

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) return;
    const newPreset: FilterPreset = {
      name,
      data: { activeFilter, searchQuery, sortBy, minPrice, maxPrice },
    };
    setPresets((prev) => {
      const without = prev.filter((p) => p.name !== name);
      return [newPreset, ...without].slice(0, MAX_PRESETS);
    });
    setPresetName('');
    setShowPresetInput(false);
  };

  const applyPreset = (preset: FilterPreset) => {
    setActiveFilter(preset.data.activeFilter);
    setSearchQuery(preset.data.searchQuery);
    setSortBy(preset.data.sortBy);
    setMinPrice(preset.data.minPrice);
    setMaxPrice(preset.data.maxPrice);
    setCurrentPage(1);
    setSearchParams((params) => {
      if (preset.data.activeFilter === 'ALL') {
        params.delete('type');
      } else {
        params.set('type', preset.data.activeFilter);
      }
      if (preset.data.searchQuery) {
        params.set('search', preset.data.searchQuery);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      return params;
    });
  };

  const deletePreset = (name: string) => {
    setPresets((prev) => prev.filter((p) => p.name !== name));
  };

  // Fetch posts
  const fetchPosts = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (activeFilter === 'SAVED') {
        try {
          const response = await communityService.getBookmarkedPosts(page, 20);
          if (append) {
            setPosts((prev) => [...prev, ...response.posts]);
          } else {
            setPosts(response.posts);
          }
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(page);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message || 'Failed to load saved posts');
        } finally {
          setLoading(false);
          setLoadingMore(false);
        }
        return;
      }

      const filters: Record<string, unknown> = {
        page,
        limit: 20,
        sortBy,
        sortOrder: 'desc',
      };

      if (activeFilter !== 'ALL') {
        filters.type = activeFilter;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      if ((activeFilter === 'SALE' || activeFilter === 'RENT') && minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min) && min >= 0) filters.minPrice = min;
      }
      if ((activeFilter === 'SALE' || activeFilter === 'RENT') && maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max) && max >= 0) filters.maxPrice = max;
      }

      const response = await communityService.getPosts(filters, { skipCache: true });

      if (append) {
        setPosts((prev) => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }

      setTotalPages(response.pagination.totalPages);
      setCurrentPage(page);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilter, searchQuery, sortBy, minPrice, maxPrice]);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    if ((location.state as { refresh?: boolean } | null)?.refresh) {
      fetchPosts(1);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(1);
    setSearchParams((params) => {
      if (searchQuery) {
        params.set('search', searchQuery);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      return params;
    });
  };

  const handleFilterChange = (filter: ViewMode) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    if (filter !== 'SALE' && filter !== 'RENT') {
      setMinPrice('');
      setMaxPrice('');
    }
    setSearchParams((params) => {
      if (filter === 'ALL') {
        params.delete('type');
      } else {
        params.set('type', filter);
      }
      params.set('page', '1');
      return params;
    });
  };

  const handleSortChange = (value: SortBy) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handlePriceRangeApply = () => {
    fetchPosts(1);
  };

  const handleLike = async (postId: string) => {
    if (!isAuthenticated) return;
    try {
      const response = await communityService.togglePostLike(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, isLiked: response.liked, likeCount: response.likeCount }
            : post
        )
      );
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!isAuthenticated) return;
    try {
      const response = await communityService.toggleBookmark(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, isBookmarked: response.bookmarked }
            : post
        )
      );
    } catch (err) {
      console.error('Failed to bookmark post:', err);
    }
  };

  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchPosts(currentPage + 1, true);
    }
  };

  const formatDate = (dateString: string) =>
    formatDateRelative(dateString, undefined, {
      justNow: t('community.justNow') || 'Just now',
      ago: t('community.ago') || 'ago',
      yesterday: t('community.yesterday') || 'Yesterday',
    });

  const filterButtonBase = 'cursor-pointer px-4 py-2 rounded-lg font-medium transition-all duration-200';
  const filterButtonInactive = 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('community.title') || 'Community'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('community.subtitle') || 'Join discussions and discover listings'}
            </p>
          </div>
          {isAuthenticated && (
            <Link
              to="/community/create"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              {t('community.createPost') || 'Create Post'}
            </Link>
          )}
        </div>

        {/* Trending posts — ranked by likes + comments + recency. Hidden if < 3 candidates. */}
        <TrendingRail posts={posts} label={t('community.trending') || 'Trending'} />

        {/* Trending hashtags derived from the feed content. Click to filter, click again to clear. */}
        <HashtagChips
          tags={topTags}
          activeSlug={activeHashtag ?? undefined}
          onSelect={handleHashtagSelect}
          label={t('community.topics') || 'Topics'}
        />

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Type Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`${filterButtonBase} ${
                activeFilter === 'ALL'
                  ? 'bg-primary-500 text-white'
                  : filterButtonInactive
              }`}
            >
              {t('community.allPosts') || 'All'}
            </button>
            <button
              onClick={() => handleFilterChange('DISCUSSION')}
              className={`${filterButtonBase} ${
                activeFilter === 'DISCUSSION'
                  ? 'bg-blue-500 text-white'
                  : filterButtonInactive
              }`}
            >
              {t('community.type.discussion') || 'Discussions'}
            </button>
            <button
              onClick={() => handleFilterChange('SALE')}
              className={`${filterButtonBase} ${
                activeFilter === 'SALE'
                  ? 'bg-green-500 text-white'
                  : filterButtonInactive
              }`}
            >
              {t('community.type.sale') || 'Marketplace'}
            </button>
            <button
              onClick={() => handleFilterChange('RENT')}
              className={`${filterButtonBase} ${
                activeFilter === 'RENT'
                  ? 'bg-amber-500 text-white'
                  : filterButtonInactive
              }`}
            >
              {t('community.type.rent') || 'Rent'}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => handleFilterChange('SAVED')}
                className={`${filterButtonBase} ${
                  activeFilter === 'SAVED'
                    ? 'bg-indigo-500 text-white'
                    : filterButtonInactive
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BookmarkIconSolid className="w-4 h-4" active />
                  {t('community.savedPosts') || 'Saved Posts'}
                </span>
              </button>
            )}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('community.searchPlaceholder') || 'Search posts...'}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            className="cursor-pointer px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 hover:border-primary-300"
            onChange={(e) => handleSortChange(e.target.value as SortBy)}
          >
            <option value="createdAt">{t('community.sort.latest') || 'Latest'}</option>
            <option value="likeCount">{t('community.sort.popular') || 'Most Popular'}</option>
            <option value="commentCount">{t('community.sort.discussed') || 'Most Discussed'}</option>
          </select>

          {/* Save Filter Preset button */}
          <div className="relative">
            {showPresetInput ? (
              <div className="flex items-center gap-1">
                <input
                  ref={presetInputRef}
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') savePreset();
                    if (e.key === 'Escape') { setShowPresetInput(false); setPresetName(''); }
                  }}
                  placeholder="Preset name"
                  className="w-32 px-2 py-1.5 text-sm border border-primary-300 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={savePreset}
                  disabled={!presetName.trim() || presets.length >= MAX_PRESETS}
                  className="px-2 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {t('common.save') || 'Save'}
                </button>
                <button
                  onClick={() => { setShowPresetInput(false); setPresetName(''); }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowPresetInput(true)}
                disabled={presets.length >= MAX_PRESETS}
                title={t('community.saveFilter') || 'Save filter preset'}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 transition-all disabled:opacity-40"
              >
                <FunnelIcon className="w-4 h-4" />
                {t('community.saveFilter') || 'Save filter'}
              </button>
            )}
          </div>
        </div>

        {/* Preset chips */}
        {presets.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((preset) => (
              <div
                key={preset.name}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 group"
              >
                <button
                  onClick={() => applyPreset(preset)}
                  className="hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
                >
                  {preset.name}
                </button>
                <button
                  onClick={() => deletePreset(preset.name)}
                  className="ml-1 text-primary-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove preset ${preset.name}`}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Price Range Filter */}
        {(activeFilter === 'SALE' || activeFilter === 'RENT') && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {t('community.priceRange') || 'Price range'}:
            </span>
            <input
              type="number"
              min="0"
              placeholder={t('community.minPrice') || 'Min price'}
              value={minPrice}
              className="w-24 sm:w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              onChange={(e) => setMinPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceRangeApply()}
            />
            <span className="text-gray-500 dark:text-gray-400">&mdash;</span>
            <input
              type="number"
              min="0"
              placeholder={t('community.maxPrice') || 'Max price'}
              value={maxPrice}
              className="w-24 sm:w-28 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              onChange={(e) => setMaxPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePriceRangeApply()}
            />
            <button
              onClick={handlePriceRangeApply}
              className="px-3 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {t('common.apply') || 'Apply'}
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Skeleton loaders */}
        {loading && posts.length === 0 && (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Posts List */}
        {!loading && posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeFilter === 'SAVED' ? (
                <BookmarkIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChatBubbleLeftIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeFilter === 'SAVED'
                ? t('community.savedPosts') || 'Saved Posts'
                : t('community.noPostsYet') || 'No posts yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {activeFilter === 'SAVED'
                ? t('community.noSavedPostsDesc') || 'Bookmark posts to find them here later'
                : t('community.beFirstToPost') || 'Be the first to share!'}
            </p>
            {isAuthenticated && activeFilter !== 'SAVED' && (
              <Link
                to="/community/create"
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('community.createPost') || 'Create Post'}
              </Link>
            )}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                data-tilt-soft
                className={`cursor-pointer bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 p-6 hover:shadow-lg transition-all duration-200 relative ${
                  post.listingStatus && post.listingStatus !== 'ACTIVE' ? 'opacity-75' : ''
                }`}
              >
                {/* Listing Status Overlay */}
                {post.listingStatus && post.listingStatus !== 'ACTIVE' && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                      post.listingStatus === 'SOLD'
                        ? 'bg-red-500 text-white'
                        : 'bg-orange-500 text-white'
                    }`}>
                      {post.listingStatus === 'SOLD'
                        ? t('community.listingStatus.sold') || 'Sold'
                        : t('community.listingStatus.rented') || 'Rented'}
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Author Avatar */}
                  <div className="flex-shrink-0">
                    {post.author.avatar ? (
                      <img
                        src={getAbsoluteImageUrl(post.author.avatar)}
                        alt={post.author.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {post.author.firstName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 min-w-0">
                    {/* Type Badge and Title */}
                    <div className="flex items-start gap-2 mb-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.type === 'DISCUSSION'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : post.type === 'RENT'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {post.type === 'DISCUSSION'
                          ? t('community.type.discussion') || 'Discussion'
                          : post.type === 'RENT'
                          ? t('community.type.rent') || 'Rent'
                          : t('community.type.sale') || 'Marketplace'}
                      </span>
                      {post.condition && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {post.condition === 'NEW' ? t('community.condition.new') || 'New' :
                           post.condition === 'LIKE_NEW' ? t('community.condition.likeNew') || 'Like New' :
                           t('community.condition.used') || 'Used'}
                        </span>
                      )}
                      {post.isPinned && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Pinned
                        </span>
                      )}
                    </div>

                    <Link to={`/community/post/${post.id}`}>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                        {post.title}
                      </h2>
                    </Link>

                    {/* Price for Sale/Rent posts — embossed badge */}
                    {(post.type === 'SALE' || post.type === 'RENT') && post.price != null && (
                      <p className={`inline-block text-lg font-bold mt-1 px-2 py-0.5 rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] ${
                        post.type === 'RENT'
                          ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20'
                          : 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20'
                      }`}>
                        {post.price.toLocaleString()} {post.currency || 'UAH'}
                        {post.type === 'RENT' && <span className="text-sm font-normal text-gray-500"> / {t('community.perMonth') || 'mo'}</span>}
                      </p>
                    )}

                    {/* Preview content */}
                    <p className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {post.content.substring(0, 200)}
                      {post.content.length > 200 && '...'}
                    </p>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>
                        {post.author.firstName} {post.author.lastName.charAt(0)}.
                      </span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6 mt-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`cursor-pointer flex items-center gap-1.5 hover:scale-110 active:scale-95 transition-all duration-200 ${
                          post.isLiked
                            ? 'text-red-500'
                            : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                        }`}
                        disabled={!isAuthenticated}
                      >
                        {post.isLiked ? (
                          <HeartIconSolid className="w-5 h-5" active />
                        ) : (
                          <HeartIcon className="w-5 h-5" />
                        )}
                        <span>{post.likeCount}</span>
                      </button>

                      <Link
                        to={`/community/post/${post.id}`}
                        className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
                      >
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        <span>{post.commentCount}</span>
                      </Link>

                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                        <EyeIcon className="w-5 h-5" />
                        <span>{post.viewCount}</span>
                      </div>

                      {isAuthenticated && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBookmark(post.id);
                          }}
                          className={`cursor-pointer flex items-center gap-1.5 hover:scale-110 active:scale-95 transition-all duration-200 ${
                            post.isBookmarked
                              ? 'text-indigo-500'
                              : 'text-gray-500 dark:text-gray-400 hover:text-indigo-500'
                          }`}
                          title={post.isBookmarked ? t('community.bookmarked') || 'Saved' : t('community.bookmark') || 'Save'}
                        >
                          {post.isBookmarked ? (
                            <BookmarkIconSolid className="w-5 h-5" active />
                          ) : (
                            <BookmarkIcon className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Post Image Preview — clickable for lightbox */}
                  {post.images && post.images.length > 0 && (
                    <div className="flex-shrink-0 hidden sm:block">
                      <img
                        src={getAbsoluteImageUrl(post.images[0])}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          setLightbox({ images: post.images!, index: 0 });
                        }}
                      />
                      {post.images.length > 1 && (
                        <span className="block text-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                          +{post.images.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Load More */}
        {currentPage < totalPages && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
            >
              {loadingMore
                ? t('common.loading') || 'Loading...'
                : t('community.loadMore') || 'Load More'}
            </button>
          </div>
        )}

        {/* Login Prompt */}
        {!isAuthenticated && posts.length > 0 && (
          <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('community.joinCommunity') || 'Join the Community'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('community.loginToParticipate') ||
                'Login to like posts, comment, and share your own content'}
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors font-medium"
              >
                {t('auth.login') || 'Login'}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                {t('auth.register') || 'Register'}
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNav={(idx) => setLightbox({ ...lightbox, index: idx })}
        />
      )}

      {/* Mobile-first floating create button. Authenticated-only; hides on scroll-down. */}
      <CreatePostFAB />
    </div>
  );
};

export default CommunityPage;
