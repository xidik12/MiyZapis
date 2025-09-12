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
  if (points >= 5000) return 'platinum';
  if (points >= 1500) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
};

/**
 * Get tier name for display purposes
 */
export const getTierName = (tier: string): string => {
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
 */
export const getPointsToNextTier = (currentPoints: number): { nextTier: string; pointsNeeded: number } => {
  if (currentPoints < 500) {
    return {
      nextTier: 'Silver',
      pointsNeeded: 500 - currentPoints
    };
  }
  if (currentPoints < 1500) {
    return {
      nextTier: 'Gold',
      pointsNeeded: 1500 - currentPoints
    };
  }
  if (currentPoints < 5000) {
    return {
      nextTier: 'Platinum', 
      pointsNeeded: 5000 - currentPoints
    };
  }
  return {
    nextTier: 'Platinum (Max)',
    pointsNeeded: 0
  };
};
