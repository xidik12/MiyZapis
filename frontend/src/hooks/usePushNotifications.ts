import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  isPushSubscribed,
  isPushPermissionDenied,
  subscribeToPush,
  unsubscribeFromPush,
} from '../services/push.service';

interface UsePushNotificationsReturn {
  /** Whether the browser supports Web Push */
  isSupported: boolean;
  /** Whether the user is currently subscribed */
  isSubscribed: boolean;
  /** Whether the user has permanently denied notification permission */
  isDenied: boolean;
  /** Whether a subscribe/unsubscribe operation is in progress */
  isLoading: boolean;
  /** Subscribe the user to push notifications */
  subscribe: () => Promise<boolean>;
  /** Unsubscribe the user from push notifications */
  unsubscribe: () => Promise<boolean>;
  /** Toggle subscription state */
  toggle: () => Promise<boolean>;
  /** Refresh the subscription status from the browser */
  refresh: () => Promise<void>;
}

/**
 * React hook to manage Web Push notification subscriptions.
 *
 * Usage:
 *   const { isSupported, isSubscribed, toggle, isLoading } = usePushNotifications();
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported] = useState(() => isPushSupported());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!isSupported) return;
    try {
      const subscribed = await isPushSubscribed();
      setIsSubscribed(subscribed);
      setIsDenied(isPushPermissionDenied());
    } catch {
      // Silently fail status check
    }
  }, [isSupported]);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await subscribeToPush();
      if (success) {
        setIsSubscribed(true);
      }
      setIsDenied(isPushPermissionDenied());
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPush();
      if (success) {
        setIsSubscribed(false);
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggle = useCallback(async (): Promise<boolean> => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  const refresh = useCallback(async () => {
    await checkStatus();
  }, [checkStatus]);

  return {
    isSupported,
    isSubscribed,
    isDenied,
    isLoading,
    subscribe,
    unsubscribe,
    toggle,
    refresh,
  };
}

export default usePushNotifications;
