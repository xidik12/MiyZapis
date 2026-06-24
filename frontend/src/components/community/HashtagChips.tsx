// A horizontally-scrolling row of clickable hashtag chips, derived
// from the trending tags in the current feed.

import React from 'react';
import { HashtagIcon } from '@heroicons/react/24/outline';
import type { ParsedHashtag } from '@/utils/hashtags';

interface HashtagChipsProps {
  tags: Array<ParsedHashtag & { count?: number }>;
  activeSlug?: string;
  onSelect: (slug: string | null) => void;
  label?: string;
}

export const HashtagChips: React.FC<HashtagChipsProps> = ({ tags, activeSlug, onSelect, label }) => {
  if (!tags.length) return null;

  return (
    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      {label && (
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mr-1">
          {label}
        </span>
      )}
      {tags.map((tag) => {
        const active = tag.slug === activeSlug;
        return (
          <button
            key={tag.slug}
            onClick={() => onSelect(active ? null : tag.slug)}
            className={[
              'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition active:scale-[0.96]',
              'border',
              active
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400',
            ].join(' ')}
          >
            <HashtagIcon className="w-3.5 h-3.5" />
            <span className="font-medium">{tag.display}</span>
            {typeof tag.count === 'number' && tag.count > 1 && (
              <span className={`tabular-nums ${active ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                {tag.count}
              </span>
            )}
          </button>
        );
      })}
      {activeSlug && (
        <button
          onClick={() => onSelect(null)}
          className="shrink-0 inline-flex items-center px-3 py-1.5 rounded-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline-offset-2 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default HashtagChips;
