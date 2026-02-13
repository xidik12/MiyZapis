// Semantic chart colors that work in both light and dark themes
export const chartColors = {
  primary: 'var(--color-primary-500, #667eea)',
  secondary: 'var(--color-secondary-500, #764ba2)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Extended palette for multi-series charts
  series: [
    '#667eea', // primary
    '#10b981', // success green
    '#f59e0b', // warning amber
    '#ef4444', // error red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ],
} as const;

export function getSeriesColor(index: number): string {
  return chartColors.series[index % chartColors.series.length];
}
