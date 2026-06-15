import React, { Suspense, lazy, useMemo } from 'react';
import animationData from '@/assets/animations/empty-state.json';

// lottie-web is ~250KB — lazy so empty states don't weigh on the main bundle.
const Lottie = lazy(() => import('lottie-react'));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Static, dependency-free mark shown under reduced-motion or while the runtime
// loads — mirrors the animation's azure-card motif so there's no visual jump.
const StaticMark: React.FC<{ size: number }> = ({ size }) => (
  <svg viewBox="0 0 512 512" style={{ width: size, height: size }} fill="none" aria-hidden="true">
    <rect x="161" y="186" width="190" height="150" rx="28" stroke="rgb(37 99 235)" strokeWidth="11" />
    <rect x="190" y="232" width="96" height="13" rx="6" fill="rgb(37 99 235)" opacity="0.45" />
    <rect x="178" y="262" width="72" height="13" rx="6" fill="rgb(37 99 235)" opacity="0.28" />
    <circle cx="350" cy="176" r="13" fill="rgb(217 154 37)" />
  </svg>
);

interface EmptyStateProps {
  /** Bold heading. */
  title?: string;
  /** Supporting line under the title. */
  description?: string;
  /** Optional CTA (button/link) rendered below. */
  action?: React.ReactNode;
  /** Illustration size in px (default 160). */
  size?: number;
  className?: string;
}

/**
 * Friendly empty state with a subtle, on-brand looping Lottie illustration.
 * Falls back to a matching static mark under prefers-reduced-motion. Decorative
 * art is aria-hidden; the title/description carry the meaning.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  size = 160,
  className = '',
}) => {
  const noMotion = useMemo(prefersReducedMotion, []);

  return (
    <div className={`flex flex-col items-center justify-center text-center py-10 px-4 ${className}`}>
      <div style={{ width: size, height: size }} aria-hidden="true">
        {noMotion ? (
          <StaticMark size={size} />
        ) : (
          <Suspense fallback={<StaticMark size={size} />}>
            <Lottie animationData={animationData} loop autoplay style={{ width: '100%', height: '100%' }} />
          </Suspense>
        )}
      </div>
      {title && (
        <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      )}
      {description && (
        <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
