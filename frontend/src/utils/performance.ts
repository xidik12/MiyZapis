/**
 * Performance monitoring and measurement utilities
 *
 * These utilities help measure and track frontend performance metrics
 * including load times, render times, and Core Web Vitals
 */

import { logger } from './logger';

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
}

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitals {
  /** Largest Contentful Paint - measures loading performance */
  LCP?: number;
  /** First Input Delay - measures interactivity */
  FID?: number;
  /** Cumulative Layout Shift - measures visual stability */
  CLS?: number;
  /** First Contentful Paint - measures when first content is rendered */
  FCP?: number;
  /** Time to First Byte - measures server response time */
  TTFB?: number;
}

/**
 * Bundle size information
 */
export interface BundleInfo {
  totalSize: number;
  chunks: Array<{ name: string; size: number }>;
}

/**
 * Measure execution time of a function
 */
export const measureExecutionTime = async <T>(
  name: string,
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  logger.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

  return { result, duration };
};

/**
 * Mark a performance milestone
 */
export const markPerformance = (name: string): void => {
  if (performance.mark) {
    performance.mark(name);
  }
};

/**
 * Measure time between two performance marks
 */
export const measurePerformance = (
  name: string,
  startMark: string,
  endMark: string
): number | null => {
  if (!performance.measure) return null;

  try {
    performance.measure(name, startMark, endMark);
    const measures = performance.getEntriesByName(name, 'measure');
    if (measures.length > 0) {
      const duration = measures[0].duration;
      logger.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    }
  } catch (error) {
    logger.warn('Failed to measure performance:', error);
  }

  return null;
};

/**
 * Get Core Web Vitals metrics
 */
export const getCoreWebVitals = (): Promise<CoreWebVitals> => {
  return new Promise((resolve) => {
    const vitals: CoreWebVitals = {};

    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        logger.warn('LCP measurement not supported');
      }

      // FID - First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            vitals.FID = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        logger.warn('FID measurement not supported');
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          vitals.CLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        logger.warn('CLS measurement not supported');
      }
    }

    // FCP and TTFB from Navigation Timing
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation') as any[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        vitals.TTFB = nav.responseStart - nav.requestStart;
      }

      const paintEntries = performance.getEntriesByType('paint') as any[];
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          vitals.FCP = entry.startTime;
        }
      });
    }

    // Return metrics after a delay to capture CLS and LCP
    setTimeout(() => {
      resolve(vitals);
    }, 3000);
  });
};

/**
 * Get bundle size information
 */
export const getBundleInfo = (): BundleInfo => {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const jsResources = resources.filter((r) => r.name.endsWith('.js'));

  let totalSize = 0;
  const chunks: Array<{ name: string; size: number }> = [];

  jsResources.forEach((resource) => {
    const size = resource.transferSize || resource.encodedBodySize || 0;
    totalSize += size;

    const name = resource.name.split('/').pop() || 'unknown';
    chunks.push({ name, size });
  });

  return {
    totalSize,
    chunks: chunks.sort((a, b) => b.size - a.size),
  };
};

/**
 * Log performance report
 */
export const logPerformanceReport = async (): Promise<void> => {
  logger.info('=== Performance Report ===');

  // Core Web Vitals
  const vitals = await getCoreWebVitals();
  logger.info('Core Web Vitals:', {
    LCP: vitals.LCP ? `${vitals.LCP.toFixed(2)}ms` : 'N/A',
    FID: vitals.FID ? `${vitals.FID.toFixed(2)}ms` : 'N/A',
    CLS: vitals.CLS ? vitals.CLS.toFixed(3) : 'N/A',
    FCP: vitals.FCP ? `${vitals.FCP.toFixed(2)}ms` : 'N/A',
    TTFB: vitals.TTFB ? `${vitals.TTFB.toFixed(2)}ms` : 'N/A',
  });

  // Bundle info
  const bundleInfo = getBundleInfo();
  logger.info('Bundle Info:', {
    totalSize: `${(bundleInfo.totalSize / 1024).toFixed(2)} KB`,
    chunks: bundleInfo.chunks.slice(0, 5).map((chunk) => ({
      name: chunk.name,
      size: `${(chunk.size / 1024).toFixed(2)} KB`,
    })),
  });

  // Navigation timing
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (nav) {
    logger.info('Navigation Timing:', {
      domContentLoaded: `${(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart).toFixed(2)}ms`,
      loadComplete: `${(nav.loadEventEnd - nav.loadEventStart).toFixed(2)}ms`,
      domInteractive: `${nav.domInteractive.toFixed(2)}ms`,
    });
  }

  logger.info('=== End Performance Report ===');
};

/**
 * Monitor component render performance
 */
export class ComponentPerformanceMonitor {
  private renderCounts = new Map<string, number>();
  private renderTimes = new Map<string, number[]>();

  /**
   * Track a component render
   */
  trackRender(componentName: string, renderTime: number): void {
    // Update render count
    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);

    // Update render times
    const times = this.renderTimes.get(componentName) || [];
    times.push(renderTime);
    this.renderTimes.set(componentName, times);

    // Log if render is slow (> 16ms)
    if (renderTime > 16) {
      logger.warn(
        `[Performance] Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`
      );
    }
  }

  /**
   * Get component statistics
   */
  getStats(componentName: string): {
    renderCount: number;
    averageRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
  } | null {
    const count = this.renderCounts.get(componentName);
    const times = this.renderTimes.get(componentName);

    if (!count || !times || times.length === 0) {
      return null;
    }

    return {
      renderCount: count,
      averageRenderTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxRenderTime: Math.max(...times),
      minRenderTime: Math.min(...times),
    };
  }

  /**
   * Get all component statistics
   */
  getAllStats(): Array<{
    component: string;
    renderCount: number;
    averageRenderTime: number;
    maxRenderTime: number;
  }> {
    const stats: Array<{
      component: string;
      renderCount: number;
      averageRenderTime: number;
      maxRenderTime: number;
    }> = [];

    this.renderCounts.forEach((_, componentName) => {
      const componentStats = this.getStats(componentName);
      if (componentStats) {
        stats.push({
          component: componentName,
          ...componentStats,
        });
      }
    });

    return stats.sort((a, b) => b.renderCount - a.renderCount);
  }

  /**
   * Reset all statistics
   */
  reset(): void {
    this.renderCounts.clear();
    this.renderTimes.clear();
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new ComponentPerformanceMonitor();

/**
 * React hook to measure component render time
 */
export const useRenderTime = (componentName: string): void => {
  const startTime = performance.now();

  // This runs after render completes
  Promise.resolve().then(() => {
    const renderTime = performance.now() - startTime;
    performanceMonitor.trackRender(componentName, renderTime);
  });
};

/**
 * Initialize performance monitoring
 * Call this in your app's entry point
 */
export const initPerformanceMonitoring = (): void => {
  // Log performance report after initial load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logPerformanceReport();
    }, 2000);
  });

  // Make performance utilities available in console for debugging
  if (import.meta.env.DEV) {
    (window as any).performance_utils = {
      getReport: logPerformanceReport,
      getCoreWebVitals,
      getBundleInfo,
      getComponentStats: () => performanceMonitor.getAllStats(),
      resetComponentStats: () => performanceMonitor.reset(),
    };

    logger.info(
      'Performance utilities available in console: window.performance_utils'
    );
  }
};

export default {
  measureExecutionTime,
  markPerformance,
  measurePerformance,
  getCoreWebVitals,
  getBundleInfo,
  logPerformanceReport,
  performanceMonitor,
  initPerformanceMonitoring,
};
