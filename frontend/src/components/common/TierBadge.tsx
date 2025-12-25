import React from 'react';
import { calculateTier, getTierName } from '@/utils/formatPoints';
import { TrophyIcon, StarIcon, SparklesIcon } from '@/components/icons';
// Note: Use active prop for filled icons: <Icon active />

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
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border border-amber-200 dark:border-amber-800/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-900/30',
    text: 'text-slate-800 dark:text-slate-300',
    border: 'border border-slate-200 dark:border-slate-800/40',
    iconColor: 'text-slate-500 dark:text-slate-300',
  },
  gold: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-300',
    border: 'border border-yellow-200 dark:border-yellow-800/40',
    iconColor: 'text-yellow-500 dark:text-yellow-300',
  },
  platinum: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border border-indigo-200 dark:border-indigo-800/40',
    iconColor: 'text-indigo-500 dark:text-indigo-300',
  },
};

const TierIcon: React.FC<{ tier: TierKey; className?: string }> = ({ tier, className }) => {
  switch (tier) {
    case 'gold':
      return <TrophyIcon className={className} active />;
    case 'platinum':
      return <StarIcon className={className} active />;
    case 'silver':
      return <SparklesIcon className={className} active />;
    case 'bronze':
    default:
      return <SparklesIcon className={className} active />;
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

