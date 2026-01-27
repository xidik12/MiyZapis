/**
 * Performance monitoring utilities
 * Track render times, memory usage, and navigation performance
 */
import { InteractionManager, PixelRatio } from 'react-native';
import { useEffect, useRef } from 'react';

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

/**
 * Global performance metrics storage
 */
const performanceMetrics: PerformanceMetrics[] = [];

/**
 * Log performance metrics
 */
export const logPerformance = (componentName: string, renderTime: number) => {
  if (__DEV__) {
    performanceMetrics.push({
      componentName,
      renderTime,
      timestamp: Date.now(),
    });

    // Log slow renders (> 16ms = below 60fps)
    if (renderTime > 16) {
      console.warn(
        `⚠️  Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }

    // Keep only last 100 metrics
    if (performanceMetrics.length > 100) {
      performanceMetrics.shift();
    }
  }
};

/**
 * Get performance report
 */
export const getPerformanceReport = () => {
  if (!__DEV__) return null;

  const componentStats = performanceMetrics.reduce((acc, metric) => {
    if (!acc[metric.componentName]) {
      acc[metric.componentName] = {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity,
      };
    }

    const stats = acc[metric.componentName];
    stats.count += 1;
    stats.totalTime += metric.renderTime;
    stats.maxTime = Math.max(stats.maxTime, metric.renderTime);
    stats.minTime = Math.min(stats.minTime, metric.renderTime);

    return acc;
  }, {} as Record<string, { count: number; totalTime: number; maxTime: number; minTime: number }>);

  const report = Object.entries(componentStats).map(([name, stats]) => ({
    component: name,
    renders: stats.count,
    avgTime: (stats.totalTime / stats.count).toFixed(2),
    maxTime: stats.maxTime.toFixed(2),
    minTime: stats.minTime.toFixed(2),
  }));

  return report.sort((a, b) => parseFloat(b.avgTime) - parseFloat(a.avgTime));
};

/**
 * Print performance report to console
 */
export const printPerformanceReport = () => {
  if (!__DEV__) return;

  const report = getPerformanceReport();
  if (!report || report.length === 0) {
    console.log('📊 No performance metrics collected yet');
    return;
  }

  console.log('\n📊 Performance Report:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.table(report);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

/**
 * Hook to measure component render time
 * @param componentName - Name of the component for logging
 */
export const useRenderTime = (componentName: string) => {
  const renderStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    logPerformance(componentName, renderTime);
  });

  // Update start time for next render
  renderStartTime.current = Date.now();
};

/**
 * Run callback after interactions are complete
 * Useful for deferring non-critical work
 */
export const runAfterInteractions = (callback: () => void) => {
  InteractionManager.runAfterInteractions(() => {
    callback();
  });
};

/**
 * Check if device is low-end based on pixel ratio
 * Low-end devices may need reduced animations
 */
export const isLowEndDevice = () => {
  const pixelRatio = PixelRatio.get();
  return pixelRatio < 2;
};

/**
 * Get optimal image quality based on device
 */
export const getOptimalImageQuality = () => {
  const pixelRatio = PixelRatio.get();

  if (pixelRatio >= 3) {
    return 0.9; // High quality for high-res devices
  } else if (pixelRatio >= 2) {
    return 0.85; // Good quality for standard devices
  } else {
    return 0.75; // Lower quality for low-end devices
  }
};

/**
 * Measure function execution time
 */
export const measureExecutionTime = <T extends (...args: any[]) => any>(
  fn: T,
  label: string
): T => {
  return ((...args: Parameters<T>) => {
    const start = Date.now();
    const result = fn(...args);
    const duration = Date.now() - start;

    if (__DEV__ && duration > 10) {
      console.log(`⏱️  ${label}: ${duration}ms`);
    }

    return result;
  }) as T;
};

/**
 * Memory warning utilities
 */
let memoryWarningCallback: (() => void) | null = null;

export const onMemoryWarning = (callback: () => void) => {
  memoryWarningCallback = callback;
};

export const clearMemoryWarning = () => {
  memoryWarningCallback = null;
};

/**
 * Clear performance metrics
 */
export const clearPerformanceMetrics = () => {
  performanceMetrics.length = 0;
};
