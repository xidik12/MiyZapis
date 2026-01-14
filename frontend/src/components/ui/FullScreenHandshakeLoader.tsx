import React from 'react';

interface FullScreenHandshakeLoaderProps {
  title?: string;
  subtitle?: string;
}

// Smooth, elegant loader with minimal motion
export const FullScreenHandshakeLoader: React.FC<FullScreenHandshakeLoaderProps> = ({
  title = 'Loading...',
  subtitle = 'Connect & Book',
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden backdrop-blur-md bg-white/80 dark:bg-secondary-900/80 transition-opacity duration-300"
    aria-busy="true"
    aria-live="polite"
  >
    {/* Subtle background glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-primary-500/5 blur-[80px] opacity-60"
      style={{ animation: 'gentle-pulse 4s ease-in-out infinite' }}
    />

    <div className="relative z-10 flex flex-col items-center text-center px-6">
      {/* Simplified loader container */}
      <div className="relative mb-8">
        {/* Single smooth rotating ring */}
        <div className="relative">
          {/* Outer circle - solid border */}
          <div
            className="w-20 h-20 rounded-full border-2 border-primary-500/20"
            style={{ animation: 'smooth-rotate 3s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-10 bg-primary-500 rounded-full" />
          </div>

          {/* Center icon - gentle breathing effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display font-bold text-xl bg-primary-500 shadow-lg"
              style={{ animation: 'gentle-breathe 2s ease-in-out infinite' }}
            >
              H
            </div>
          </div>
        </div>
      </div>

      {/* Text with fade-in */}
      <div className="backdrop-blur-sm bg-white/40 dark:bg-white/5 px-6 py-3 rounded-xl border border-white/30 dark:border-white/10 shadow-lg">
        <h2
          className="text-lg sm:text-2xl font-display font-semibold text-primary-600 dark:text-primary-400"
          style={{ animation: 'fade-in 0.5s ease-out' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-1.5 text-sm sm:text-base text-secondary-600 dark:text-secondary-400"
            style={{ animation: 'fade-in 0.5s ease-out 0.1s backwards' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Smooth progress dots */}
      <div className="flex gap-1.5 mt-6" style={{ animation: 'fade-in 0.5s ease-out 0.2s backwards' }}>
        <div
          className="w-1.5 h-1.5 rounded-full bg-primary-500/70"
          style={{ animation: 'smooth-dot-pulse 1.5s ease-in-out infinite' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full bg-primary-500/70"
          style={{ animation: 'smooth-dot-pulse 1.5s ease-in-out 0.2s infinite' }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full bg-primary-500/70"
          style={{ animation: 'smooth-dot-pulse 1.5s ease-in-out 0.4s infinite' }}
        />
      </div>
    </div>
  </div>
);

export default FullScreenHandshakeLoader;
