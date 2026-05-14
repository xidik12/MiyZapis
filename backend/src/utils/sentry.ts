// Sentry error monitoring (gated on SENTRY_DSN env var — silent if unset).
// Initialised at process start before any other imports that might throw.
import { logger } from '@/utils/logger';

let sentryInitialised = false;

export function initSentry(): void {
  if (sentryInitialised) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    logger.info('Sentry disabled — SENTRY_DSN not set');
    return;
  }
  try {
    // Lazy require so the dep doesn't load (or fail) when DSN is unset.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'production',
      release: process.env.npm_package_version,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: Number(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0'),
      // Strip noisy errors we explicitly handle elsewhere.
      ignoreErrors: ['EMAIL_NOT_VERIFIED', 'AUTHENTICATION_REQUIRED', 'VALIDATION_ERROR'],
    });
    sentryInitialised = true;
    logger.info('Sentry initialised', { environment: process.env.NODE_ENV });
  } catch (err) {
    logger.warn('Sentry init failed — continuing without it', { error: (err as Error).message });
  }
}

export function captureException(err: unknown, context?: Record<string, unknown>): void {
  if (!sentryInitialised) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/node');
    Sentry.withScope((scope: { setExtras: (c: Record<string, unknown>) => void }) => {
      if (context) scope.setExtras(context);
      Sentry.captureException(err);
    });
  } catch {
    // never throw from error reporter
  }
}
