import React from 'react';
import { calculateTier, getTierName } from '@/utils/formatPoints';
import {
  StarIcon as StarIconSolid,
  TrophyIcon as TrophyIconSolid,
  SparklesIcon as SparklesIconSolid,
} from '@heroicons/react/24/solid';

type TierKey = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierBadgeProps {
  tier?: string | null;
  points?: number | null;
  className?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

// Centralized styles for tier skins used across the app
const TIER_STYLES: Record<
  TierKey,
  {
    bg: string;
    text: string;
    border: string;
    iconColor: string;
  }
> = {
  bronze: {
    bg: 'bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border border-amber-200 dark:border-amber-800/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  silver: {
    bg: 'bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-900/30 dark:to-gray-900/30',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border border-slate-200 dark:border-slate-800/40',
    iconColor: 'text-slate-500 dark:text-slate-300',
  },
  gold: {
    bg: 'bg-gradient-to-r from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border border-yellow-200 dark:border-yellow-800/40',
    iconColor: 'text-yellow-500 dark:text-yellow-300',
  },
  platinum: {
    bg: 'bg-gradient-to-r from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border border-indigo-200 dark:border-indigo-800/40',
    iconColor: 'text-indigo-500 dark:text-indigo-300',
  },
};

const TierIcon: React.FC<{ tier: TierKey; className?: string }> = ({ tier, className }) => {
  switch (tier) {
    case 'gold':
      return <TrophyIconSolid className={className} />;
    case 'platinum':
      return <StarIconSolid className={className} />;
    case 'silver':
      return <SparklesIconSolid className={className} />;
    case 'bronze':
    default:
      return <SparklesIconSolid className={className} />;
  }
};

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, points, className = '', size = 'sm', showLabel = true }) => {
  const normalized: TierKey = (tier?.toLowerCase() as TierKey) || (calculateTier(points || 0) as TierKey);
  const styles = TIER_STYLES[normalized] || TIER_STYLES.bronze;
  const label = getTierName(normalized);

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${styles.bg} ${styles.border} ${styles.text} ${className}`}> 
      <TierIcon tier={normalized} className={`${styles.iconColor} ${iconSize}`} />
      {showLabel && <span className="font-medium leading-none">{label}</span>}
    </span>
  );
};

export default TierBadge;

