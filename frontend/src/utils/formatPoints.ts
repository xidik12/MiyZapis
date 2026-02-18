/**
 * Utility function to format loyalty points consistently across the app
 * This formats points as numbers (e.g., "1,234") without currency symbols
 */
export const formatPoints = (points: number | undefined | null): string => {
  if (points == null || isNaN(points)) {
    return '0';
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(points);
};

/**
 * Calculate tier based on loyalty points
 */
export const calculateTier = (points: number): string => {
  if (points >= 2000) return 'platinum';
  if (points >= 1000) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
};

/**
 * Get tier name for display purposes
 * @param tier - the tier key (bronze, silver, gold, platinum)
 * @param t - optional translation function from useLanguage()
 */
export const getTierName = (tier: string, t?: (key: string) => string): string => {
  if (t) {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return t('loyalty.tiers.bronze');
      case 'silver':
        return t('loyalty.tiers.silver');
      case 'gold':
        return t('loyalty.tiers.gold');
      case 'platinum':
        return t('loyalty.tiers.platinum');
      default:
        return t('loyalty.tiers.bronze');
    }
  }
  switch (tier.toLowerCase()) {
    case 'bronze':
      return 'Bronze';
    case 'silver':
      return 'Silver';
    case 'gold':
      return 'Gold';
    case 'platinum':
      return 'Platinum';
    default:
      return 'Bronze';
  }
};

/**
 * Get points needed for next tier
 * @param currentPoints - current loyalty points
 * @param t - optional translation function from useLanguage()
 */
export const getPointsToNextTier = (currentPoints: number, t?: (key: string) => string): { nextTier: string; pointsNeeded: number } => {
  if (t) {
    if (currentPoints < 500) {
      return { nextTier: t('loyalty.tiers.silver'), pointsNeeded: 500 - currentPoints };
    }
    if (currentPoints < 1000) {
      return { nextTier: t('loyalty.tiers.gold'), pointsNeeded: 1000 - currentPoints };
    }
    if (currentPoints < 2000) {
      return { nextTier: t('loyalty.tiers.platinum'), pointsNeeded: 2000 - currentPoints };
    }
    return { nextTier: `${t('loyalty.tiers.platinum')} (Max)`, pointsNeeded: 0 };
  }
  if (currentPoints < 500) {
    return { nextTier: 'Silver', pointsNeeded: 500 - currentPoints };
  }
  if (currentPoints < 1000) {
    return { nextTier: 'Gold', pointsNeeded: 1000 - currentPoints };
  }
  if (currentPoints < 2000) {
    return { nextTier: 'Platinum', pointsNeeded: 2000 - currentPoints };
  }
  return { nextTier: 'Platinum (Max)', pointsNeeded: 0 };
};
