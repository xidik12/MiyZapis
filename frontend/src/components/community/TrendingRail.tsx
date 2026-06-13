// Horizontal-scrolling rail of trending posts. Shown at the top of the
// community feed when there are >= 3 posts to recommend. Uses the
// existing Post type from communityService.

import React from 'react';
import { Link } from 'react-router-dom';
import { FireIcon, HeartIcon, ChatCircleIcon as ChatBubbleLeftIcon } from '@/components/icons';
import type { Post } from '@/services';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';

interface TrendingRailProps {
  posts: Post[];
  label?: string;
}

/**
 * Pick the trending posts from a feed: most-liked + most-commented
 * combined score, biased toward recency (anything older than ~30d is
 * de-weighted).
 */
export function rankTrending(posts: Post[]): Post[] {
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  return [...posts]
    .map((p) => {
      const ageMs = now - new Date(p.createdAt).getTime();
      const recencyMultiplier = ageMs < THIRTY_DAYS ? 1 : 0.4;
      const score = ((p.likeCount || 0) * 2 + (p.commentCount || 0) * 3 + (p.viewCount || 0) * 0.1) * recencyMultiplier;
      return { post: p, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((row) => row.post);
}

export const TrendingRail: React.FC<TrendingRailProps> = ({ posts, label }) => {
  const trending = rankTrending(posts);
  if (trending.length < 3) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <FireIcon className="w-5 h-5 text-orange-500" active />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
          {label || 'Trending'}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {trending.map((post) => {
          const firstImage = (() => {
            if (!post.images) return null;
            try {
              const arr = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
              return Array.isArray(arr) && arr.length ? getAbsoluteImageUrl(arr[0]) : null;
            } catch {
              return null;
            }
          })();

          return (
            <Link
              key={post.id}
              to={`/community/${post.id}`}
              className="shrink-0 w-64 sm:w-72 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-400 hover:shadow-lg transition-all"
              data-float
            >
              {firstImage && (
                <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  <img
                    src={firstImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <HeartIcon className="w-3.5 h-3.5 text-rose-500" active />
                    {post.likeCount || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ChatBubbleLeftIcon className="w-3.5 h-3.5 text-primary-500" active />
                    {post.commentCount || 0}
                  </span>
                  {post.type === 'SALE' && post.price != null && (
                    <span className="ml-auto text-emerald-600 dark:text-emerald-400 font-semibold">
                      {post.price} {post.currency || 'UAH'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default TrendingRail;
