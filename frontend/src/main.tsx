import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { store, persistor } from './store';
import { environment } from './config/environment';
import './styles/globals.css';
import 'react-toastify/dist/ReactToastify.css';

// Initialize Stripe (only if publishable key is provided)
const stripePromise = environment.STRIPE_PUBLISHABLE_KEY ? loadStripe(environment.STRIPE_PUBLISHABLE_KEY) : null;

// Loading component for PersistGate
const LoadingComponent = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading МійЗапис...</p>
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
              className="bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 font-semibold transition-all duration-200"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left" open>
                <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto max-h-40">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
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
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              {stripePromise ? (
                <Elements stripe={stripePromise}>
                  <App />
                </Elements>
              ) : (
                <App />
              )}
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
                  theme="auto"
                  toastClassName="custom-toast"
                  style={{ zIndex: 9999 }}
                />
            </BrowserRouter>
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
// (injected into index.html at build time). No manual registration needed here.
// The PWA service worker (sw.js) handles both precaching and offline support.

// Initialize the application
initializeApp();
