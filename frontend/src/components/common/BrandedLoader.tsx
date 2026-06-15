import React, { Suspense, lazy, useMemo } from 'react';
import animationData from '@/assets/animations/brand-loader.json';

const Lottie = lazy(() => import('lottie-react'));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Lightweight CSS spinner — same azure-ring + gold-dot mark. Used as the
// reduced-motion alternative and as the Suspense fallback while lottie-web loads
// (so the very first appearance is instant, never a blank gap).
const CssSpinner: React.FC<{ size: number }> = ({ size }) => (
  <svg
    className="animate-spin text-primary-600 dark:text-primary-400"
    style={{ width: size, height: size }}
    viewBox="0 0 50 50"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" opacity="0.18" />
    <path d="M25 5 a20 20 0 0 1 20 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <circle cx="45" cy="25" r="2.6" fill="#d99a25" />
  </svg>
);

interface Props {
  /** Rendered size in px (default 72). */
  size?: number;
  className?: string;
}

/**
 * MiyZapis-branded loading spinner — a hand-authored Lottie of the azure ring
 * with the gold dot riding its leading edge. Falls back to the matching CSS
 * spinner under prefers-reduced-motion and while the Lottie runtime loads.
 */
export const BrandedLoader: React.FC<Props> = ({ size = 72, className = '' }) => {
  const noMotion = useMemo(prefersReducedMotion, []);
  const fallback = <CssSpinner size={size} />;

  return (
    <div className={className} style={{ width: size, height: size }} role="status" aria-label="Loading">
      {noMotion ? (
        fallback
      ) : (
        <Suspense fallback={fallback}>
          <Lottie animationData={animationData} loop autoplay style={{ width: '100%', height: '100%' }} />
        </Suspense>
      )}
    </div>
  );
};

export default BrandedLoader;
