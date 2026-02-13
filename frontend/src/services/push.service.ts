import { apiClient } from './api';

/**
 * Utility to convert a base64url-encoded VAPID public key to a Uint8Array
 * suitable for PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser supports Web Push notifications.
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check whether the user has already granted notification permission.
 */
export function isPushPermissionGranted(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

/**
 * Check whether push notifications have been denied.
 */
export function isPushPermissionDenied(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'denied';
}

/**
 * Fetch the public VAPID key from the backend.
 */
export async function getVapidKey(): Promise<string | null> {
  try {
    const response = await apiClient.get<{ publicKey: string }>('/push/vapid-key');
    return response.data?.publicKey || null;
  } catch (error) {
    console.error('[Push] Failed to fetch VAPID key:', error);
    return null;
  }
}

/**
 * Register the service worker for push if not already registered.
 * Returns the ServiceWorkerRegistration.
 */
async function getOrRegisterSW(): Promise<ServiceWorkerRegistration> {
  const existingRegistration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (existingRegistration) {
    return existingRegistration;
  }
  return navigator.serviceWorker.register('/sw.js');
}

/**
 * Subscribe to Web Push notifications.
 * 1. Requests notification permission
 * 2. Registers the service worker
 * 3. Creates a PushManager subscription
 * 4. Sends the subscription to the backend
 *
 * Returns true on success, false on failure.
 */
export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications are not supported in this browser');
    return false;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission denied by user');
      return false;
    }

    // Fetch VAPID public key
    const vapidKey = await getVapidKey();
    if (!vapidKey) {
      console.error('[Push] Could not retrieve VAPID public key');
      return false;
    }

    // Register service worker
    const registration = await getOrRegisterSW();

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    // Send subscription to backend
    const subscriptionJSON = subscription.toJSON();
    await apiClient.post('/push/subscribe', {
      subscription: {
        endpoint: subscriptionJSON.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys?.p256dh,
          auth: subscriptionJSON.keys?.auth,
        },
      },
    });

    console.log('[Push] Successfully subscribed to push notifications');
    return true;
  } catch (error) {
    console.error('[Push] Failed to subscribe to push notifications:', error);
    return false;
  }
}

/**
 * Unsubscribe from Web Push notifications.
 * Removes the PushManager subscription and notifies the backend.
 *
 * Returns true on success, false on failure.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      return true; // No registration means already unsubscribed
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true; // No subscription means already unsubscribed
    }

    const endpoint = subscription.endpoint;

    // Unsubscribe from PushManager
    await subscription.unsubscribe();

    // Notify backend
    try {
      await apiClient.post('/push/unsubscribe', { endpoint });
    } catch (backendError) {
      // Non-fatal: subscription was removed locally even if backend call fails
      console.warn('[Push] Backend unsubscribe call failed (non-fatal):', backendError);
    }

    console.log('[Push] Successfully unsubscribed from push notifications');
    return true;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Check if the current browser is subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch (error) {
    console.error('[Push] Error checking push subscription status:', error);
    return false;
  }
}

export const pushService = {
  isPushSupported,
  isPushPermissionGranted,
  isPushPermissionDenied,
  getVapidKey,
  subscribeToPush,
  unsubscribeFromPush,
  isPushSubscribed,
};

export default pushService;
