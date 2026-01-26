/**
 * Panhaha Design System
 * Colors, typography, spacing for BookingBot mobile app
 *
 * Color Usage Guidelines:
 * - PRIMARY (Crimson Red): Energy, action, CTAs, buttons
 * - SECONDARY (Deep Sea Blue): Trust, structure, backgrounds, headers
 * - ACCENT (Gold): Borders, highlights, premium features ONLY
 */

// PRIMARY - Bright Crimson Red (was SECONDARY)
// Use for: CTAs, buttons, important actions, brand energy
export const PRIMARY_COLORS = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#DC2626', // Main primary - Crimson Red
  600: '#B91C1C',
  700: '#991B1B',
  800: '#7F1D1D',
  900: '#450A0A',
  950: '#2D0A0A',
};

// SECONDARY - Deep Sea Blue (NEW Panhaha color)
// Use for: Trust elements, structure, headers, backgrounds
export const SECONDARY_COLORS = {
  50: '#E6F1F5',
  100: '#CCE3EB',
  200: '#99C7D7',
  300: '#66ABC3',
  400: '#338FAF',
  500: '#00739B', // Main secondary - Deep Sea Blue
  600: '#005C7C',
  700: '#00455D',
  800: '#002E3E',
  900: '#001F29',
  950: '#000B0F',
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
export const SUCCESS_COLOR = '#10B981'; // Emerald Green
export const WARNING_COLOR = '#F59E0B'; // Amber Yellow
export const ERROR_COLOR = PRIMARY_COLORS[500]; // Crimson Red
export const INFO_COLOR = SECONDARY_COLORS[500]; // Deep Sea Blue

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

// Typography system (matching web's tailwind.config.js)
export const TYPOGRAPHY = {
  // Display text (hero, landing pages)
  displayLg: { fontSize: 72, lineHeight: 79.2, fontWeight: '700' as const },
  displayMd: { fontSize: 60, lineHeight: 66, fontWeight: '700' as const },
  displaySm: { fontSize: 48, lineHeight: 57.6, fontWeight: '700' as const },
  // Headings
  h1: { fontSize: 36, lineHeight: 45, fontWeight: '600' as const },
  h2: { fontSize: 30, lineHeight: 39, fontWeight: '600' as const },
  h3: { fontSize: 24, lineHeight: 32.4, fontWeight: '600' as const },
  h4: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  h5: { fontSize: 18, lineHeight: 26.1, fontWeight: '600' as const },
  h6: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  // Body text
  bodyLg: { fontSize: 18, lineHeight: 27, fontWeight: '400' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySm: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
  // Small text
  caption: { fontSize: 12, lineHeight: 16.8, fontWeight: '400' as const },
  overline: { fontSize: 10, lineHeight: 14, fontWeight: '500' as const },
};

// Shadows (elevation for React Native)
export const SHADOWS = {
  sm: { elevation: 2, shadowOpacity: 0.05 },
  md: { elevation: 4, shadowOpacity: 0.1 },
  lg: { elevation: 8, shadowOpacity: 0.15 },
  xl: { elevation: 12, shadowOpacity: 0.2 },
  '2xl': { elevation: 16, shadowOpacity: 0.25 },
};

