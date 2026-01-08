/**
 * Design system constants matching web version
 * Colors, typography, spacing extracted from tailwind.config.js
 */

// Primary - Dark Navy Blue
export const PRIMARY_COLORS = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#1E40AF', // Main primary
  600: '#1E3A8A',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#172554',
  950: '#0F1729',
};

// Secondary - Bright Crimson Red
export const SECONDARY_COLORS = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#DC2626', // Main secondary
  600: '#B91C1C',
  700: '#991B1B',
  800: '#7F1D1D',
  900: '#450A0A',
  950: '#2D0A0A',
};

// Accent - Rich Gold (for borders/outlines only)
export const ACCENT_COLORS = {
  50: '#FEFCE8',
  100: '#FEF9C3',
  200: '#FEF08A',
  300: '#FDE047',
  400: '#FACC15',
  500: '#EAB308', // Gold
  600: '#CA8A04',
  700: '#A16207',
  800: '#854D0E',
  900: '#713F12',
  950: '#422006',
};

// Neutral grays
export const NEUTRAL_COLORS = {
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  950: '#09090B',
};

// Semantic colors
export const SUCCESS_COLOR = PRIMARY_COLORS[500];
export const WARNING_COLOR = SECONDARY_COLORS[500];
export const ERROR_COLOR = SECONDARY_COLORS[500];
export const INFO_COLOR = PRIMARY_COLORS[500];

// Spacing scale (in pixels for React Native)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

// Font sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

// Font weights
export const FONT_WEIGHTS = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Shadows (elevation for React Native)
export const SHADOWS = {
  sm: { elevation: 2, shadowOpacity: 0.05 },
  md: { elevation: 4, shadowOpacity: 0.1 },
  lg: { elevation: 8, shadowOpacity: 0.15 },
  xl: { elevation: 12, shadowOpacity: 0.2 },
  '2xl': { elevation: 16, shadowOpacity: 0.25 },
};

