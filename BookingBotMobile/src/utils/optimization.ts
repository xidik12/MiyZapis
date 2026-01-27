/**
 * Optimization utilities
 * Helpers for component memoization and re-render prevention
 */
import { DependencyList, useCallback, useEffect, useMemo, useRef } from 'react';
import { isEqual } from 'lodash';

/**
 * Deep comparison for React.memo
 * Only use for props that are objects/arrays
 */
export const deepEqual = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  return isEqual(prevProps, nextProps);
};

/**
 * Shallow comparison for React.memo
 * Use for simple props (strings, numbers, booleans)
 */
export const shallowEqual = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  return prevKeys.every((key) => prevProps[key] === nextProps[key]);
};

/**
 * Hook to prevent unnecessary effects
 * Only runs effect when dependencies deeply change
 */
export const useDeepCompareEffect = (
  effect: React.EffectCallback,
  deps: DependencyList
) => {
  const ref = useRef<DependencyList>(deps);

  if (!isEqual(ref.current, deps)) {
    ref.current = deps;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, [ref.current]);
};

/**
 * Hook to memoize expensive calculations with deep comparison
 */
export const useDeepCompareMemo = <T>(
  factory: () => T,
  deps: DependencyList
): T => {
  const ref = useRef<DependencyList>(deps);
  const valueRef = useRef<T>();

  if (!isEqual(ref.current, deps)) {
    ref.current = deps;
    valueRef.current = factory();
  }

  return valueRef.current as T;
};

/**
 * Hook to create stable callback with deep comparison
 */
export const useDeepCompareCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, [useDeepCompareMemo(() => deps, deps)]) as T;
};

/**
 * Hook to debounce a value
 * Useful for search inputs to reduce re-renders
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook to throttle a function
 * Prevents function from being called too frequently
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T => {
  const lastRan = useRef<number>(Date.now());

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = now;
      }
    }) as T,
    [callback, delay]
  );
};

/**
 * Hook to track previous value
 * Useful for comparing with current value
 */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * Hook to detect if component is mounted
 * Prevents state updates on unmounted components
 */
export const useIsMounted = () => {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
};

/**
 * Safe state setter that only updates if component is mounted
 */
export const useSafeState = <T>(
  initialState: T
): [T, (value: T | ((prev: T) => T)) => void] => {
  const [state, setState] = React.useState<T>(initialState);
  const isMounted = useIsMounted();

  const setSafeState = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (isMounted()) {
        setState(value);
      }
    },
    [isMounted]
  );

  return [state, setSafeState];
};

/**
 * Memoization helper for expensive computations
 */
export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
};

// Add React import for useState
import React from 'react';
