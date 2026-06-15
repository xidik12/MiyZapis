import React, { Suspense, lazy, useMemo } from 'react';
import { CheckCircleIcon } from '@/components/icons';
import animationData from '@/assets/animations/booking-success.json';

// lottie-web is ~250KB — load it only where an animation actually plays.
const Lottie = lazy(() => import('lottie-react'));

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Props {
  /** Rendered size (px). Default 96. */
  size?: number;
  className?: string;
}

/**
 * "Booking confirmed" success mark — a one-shot Lottie (azure pop + checkmark +
 * gold ring burst). Falls back to the static checkmark when the user prefers
 * reduced motion or while the runtime is still loading. Decorative — the
 * adjacent heading carries the meaning, so it's aria-hidden.
 */
export const SuccessAnimation: React.FC<Props> = ({ size = 96, className = '' }) => {
  const reduce = useMemo(prefersReducedMotion, []);
  const fallback = (
    <CheckCircleIcon className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-green-600" />
  );

  if (reduce) return <div className={`mx-auto mb-4 ${className}`}>{fallback}</div>;

  return (
    <div
      className={`mx-auto mb-4 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Suspense fallback={fallback}>
        <Lottie
          animationData={animationData}
          loop={false}
          autoplay
          style={{ width: '100%', height: '100%' }}
        />
      </Suspense>
    </div>
  );
};

export default SuccessAnimation;
