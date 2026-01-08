import React from 'react';
import { calculateTier, getTierName } from '@/utils/formatPoints';
import {
  StarIcon,
  TrophyIcon,
  SparklesIcon,
} from '@/components/icons';

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
    bg: 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/20',
    text: 'text-red-800 dark:text-red-300',
    border: 'border border-red-200 dark:border-red-800/40',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  silver: {
    bg: 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border border-blue-200 dark:border-blue-800/40',
    iconColor: 'text-blue-500 dark:text-blue-300',
  },
  gold: {
    bg: 'bg-gradient-to-r from-accent-50 to-accent-100 dark:from-accent-900/20 dark:to-accent-900/20',
    text: 'text-accent-800 dark:text-accent-300',
    border: 'border-2 border-accent-500 dark:border-accent-400',
    iconColor: 'text-accent-600 dark:text-accent-400',
  },
  platinum: {
    bg: 'bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-900/20',
    text: 'text-primary-800 dark:text-primary-300',
    border: 'border border-primary-200 dark:border-primary-800/40',
    iconColor: 'text-primary-500 dark:text-primary-300',
  },
};

const TierIcon: React.FC<{ tier: TierKey; className?: string }> = ({ tier, className }) => {
  switch (tier) {
    case 'gold':
      return <TrophyIcon className={className} />;
    case 'platinum':
      return <StarIcon className={className} />;
    case 'silver':
      return <SparklesIcon className={className} />;
    case 'bronze':
    default:
      return <SparklesIcon className={className} />;
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

