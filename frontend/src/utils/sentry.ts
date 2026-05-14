// Sentry error monitoring for the React frontend.
// Gated on VITE_SENTRY_DSN — no-op when unset. The import is lazy so the
// dependency only loads when actually configured.

let initialised = false;

export function initSentry(): void {
  if (initialised) return;
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  // Dynamic import so Sentry is only fetched when used. The await happens
  // outside the synchronous app boot path; if it fails, the page still loads.
  import('@sentry/react')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        environment: (import.meta as any).env?.MODE || 'production',
        tracesSampleRate: Number((import.meta as any).env?.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
        // Don't report common transient failures.
        ignoreErrors: [
          'ResizeObserver loop limit exceeded',
          'Non-Error promise rejection captured',
          /NetworkError when attempting to fetch/i,
        ],
      });
      initialised = true;
    })
    .catch(() => {
      // Swallow — @sentry/react isn't installed, that's fine while gating
      // by env var. Once `npm i @sentry/react` runs, this just starts working.
    });
}
