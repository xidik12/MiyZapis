import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSelector } from '@/hooks/redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { communityService, Post, PostType } from '@/services';
import { PageLoader } from '@/components/ui';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';
import { formatDateRelative } from '@/utils/dateUtils';
import {
  PlusIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

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
  const [activeFilter, setActiveFilter] = useState<PostType | 'ALL'>(
    (searchParams.get('type') as PostType) || 'ALL'
  );
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );

  // Fetch posts
  const fetchPosts = async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filters: Record<string, unknown> = {
        page,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (activeFilter !== 'ALL') {
        filters.type = activeFilter;
      }

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
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
  };

  useEffect(() => {
    fetchPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    if ((location.state as { refresh?: boolean } | null)?.refresh) {
      fetchPosts(1);
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Handle search
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

  // Handle filter change
  const handleFilterChange = (filter: PostType | 'ALL') => {
    setActiveFilter(filter);
    setCurrentPage(1);
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

  // Handle like
  const handleLike = async (postId: string) => {
    if (!isAuthenticated) {
      // Could show a login modal here
      return;
    }

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

  // Load more
  const loadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchPosts(currentPage + 1, true);
    }
  };

  // Using shared formatDateRelative from @/utils/dateUtils
  const formatDate = (dateString: string) =>
    formatDateRelative(dateString, undefined, {
      justNow: t('community.justNow') || 'Just now',
      ago: t('community.ago') || 'ago',
      yesterday: t('community.yesterday') || 'Yesterday',
    });

  if (loading && posts.length === 0) {
    return <PageLoader />;
  }

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

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Type Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('ALL')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'ALL'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t('community.allPosts') || 'All'}
            </button>
            <button
              onClick={() => handleFilterChange('DISCUSSION')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'DISCUSSION'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t('community.type.discussion') || 'Discussions'}
            </button>
            <button
              onClick={() => handleFilterChange('SALE')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeFilter === 'SALE'
                  ? 'bg-green-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {t('community.type.sale') || 'Marketplace'}
            </button>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('community.searchPlaceholder') || 'Search posts...'}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Posts List */}
        {posts.length === 0 && !loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('community.noPostsYet') || 'No posts yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('community.beFirstToPost') || 'Be the first to share!'}
            </p>
            {isAuthenticated && (
              <Link
                to="/community/create"
                className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                {t('community.createPost') || 'Create Post'}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
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
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {post.type === 'DISCUSSION'
                          ? t('community.type.discussion') || 'Discussion'
                          : t('community.type.sale') || 'Marketplace'}
                      </span>
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

                    {/* Price for Sale posts */}
                    {post.type === 'SALE' && post.price != null && (
                      <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                        {post.price.toLocaleString()} {post.currency || 'UAH'}
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
                        className={`flex items-center gap-1.5 transition-colors ${
                          post.isLiked
                            ? 'text-red-500'
                            : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                        }`}
                        disabled={!isAuthenticated}
                      >
                        {post.isLiked ? (
                          <HeartIconSolid className="w-5 h-5" />
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
                    </div>
                  </div>

                  {/* Post Image Preview */}
                  {post.images && post.images.length > 0 && (
                    <div className="flex-shrink-0 hidden sm:block">
                      <img
                        src={getAbsoluteImageUrl(post.images[0])}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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

        {/* Login Prompt for unauthenticated users */}
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
    </div>
  );
};

export default CommunityPage;
