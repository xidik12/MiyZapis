import { initSentry } from './utils/sentry';
// Initialise error monitoring as early as possible. No-op when DSN unset.
initSentry();

import { initCuteTilt } from './utils/cuteTilt';
// Cursor-tracking 3D parallax for [data-tilt] elements.
// Single delegated listener; skips itself if prefers-reduced-motion.
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCuteTilt, { once: true });
  } else {
    initCuteTilt();
  }
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { store, persistor } from './store';
import { environment } from './config/environment';
import { TelegramProvider } from './providers/TelegramProvider';
import './styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

// Platform is currently free — no payments, no Stripe Elements bootstrap.
// Re-add @stripe/react-stripe-js + Elements wrapper if/when paid features ship.

// Loading component for PersistGate — the canonical azure-ring + gold-dot mark,
// CSS-animated (no framer dependency in the bootstrap path) so it matches every
// other loader in the app.
const LoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="text-center">
      <svg className="animate-spin h-12 w-12 mx-auto text-primary-600 dark:text-primary-400" viewBox="0 0 50 50" fill="none">
        <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" opacity="0.18" />
        <path d="M25 5 a20 20 0 0 1 20 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="45" cy="25" r="2.6" fill="#d99a25" />
      </svg>
      <p className="mt-4 text-gray-600 dark:text-gray-400">Loading МійЗапис...</p>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
    
    // Log to analytics service if available
    if (environment.ENABLE_ANALYTICS) {
      // Analytics logging would go here
    }

    // Handle stale chunk errors by forcing a clean reload
    const msg = String(error?.message || '').toLowerCase();
    const isChunkLoadError =
      msg.includes('failed to fetch dynamically imported module') ||
      msg.includes('importing a module script failed') ||
      msg.includes('chunkloaderror') ||
      msg.includes('loading chunk');

    if (isChunkLoadError) {
      // Prevent infinite reload loops: only retry once
      const reloadKey = 'chunk_error_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      if (lastReload && Date.now() - Number(lastReload) < 30000) {
        // Already reloaded within 30s — stop retrying to prevent infinite loop
        return;
      }
      sessionStorage.setItem(reloadKey, String(Date.now()));

      // Attempt to unregister service workers and clear caches, then hard-reload
      (async () => {
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map((r) => r.unregister()));
          }
          if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map((n) => caches.delete(n)));
          }
        } catch (e) {
          console.warn('Chunk error recovery encountered an issue:', e);
        } finally {
          window.location.reload();
        }
      })();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-4">
              We're sorry, but something unexpected happened. Please refresh the page or try again later.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 font-semibold transition-all duration-200"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// App initialization
const initializeApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <HelmetProvider>
      <ErrorBoundary>
        <Provider store={store}>
          <PersistGate loading={<LoadingComponent />} persistor={persistor}>
            <TelegramProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <App />
              <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable={false}
                  pauseOnHover
                  theme={"auto" as any}
                  toastClassName="custom-toast"
                  style={{ zIndex: 9999 }}
                />
            </BrowserRouter>
            </TelegramProvider>
          </PersistGate>
        </Provider>
      </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>
  );
};

// Development logging
if (environment.DEBUG) {
  console.log('🚀 Starting МійЗапис in development mode');
  console.log('Environment:', environment);
}

// Service worker is registered automatically by vite-plugin-pwa via registerSW.js
// (injected into index.html at build time). The SW uses skipWaiting + clientsClaim,
// so a new build's SW activates and claims the page immediately after a deploy.
// BUT the already-open tab keeps running the OLD cached JS until it reloads — which
// is why fresh deploys (e.g. nav changes) can appear "stuck" on the previous version.
// Reload once when a new SW takes control so the page picks up the fresh bundle.
if ('serviceWorker' in navigator) {
  // Whether a SW was already controlling this page when it loaded. A controllerchange
  // when one ALREADY existed = a real update → reload; the first-ever install =
  // initial claim → don't reload (avoids a pointless first-visit refresh).
  const hadController = !!navigator.serviceWorker.controller;
  let swReloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (swReloading || !hadController) return;
    swReloading = true;
    window.location.reload();
  });
  // Proactively check for a newer SW on load + when the tab regains focus.
  const checkForUpdate = () =>
    navigator.serviceWorker.getRegistration().then((r) => r?.update()).catch(() => {});
  checkForUpdate();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}

// Initialize the application
initializeApp();
