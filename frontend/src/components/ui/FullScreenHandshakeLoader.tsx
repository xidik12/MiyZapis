import React from 'react';

interface FullScreenHandshakeLoaderProps {
  title?: string;
  subtitle?: string;
}

// Panhaha themed loader with Gen-Z glass-morph aesthetic
export const FullScreenHandshakeLoader: React.FC<FullScreenHandshakeLoaderProps> = ({
  title = 'Loading...',
  subtitle = 'Connect & Book',
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden backdrop-blur-2xl bg-white/50 dark:bg-secondary-900/50"
    aria-busy="true"
    aria-live="polite"
  >
    {/* Animated gradient orbs */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,0,81,0.2),rgba(255,0,81,0))] blur-[140px] opacity-70 animate-pulse"
      style={{ animationDuration: '3s' }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-48 -right-48 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,245,255,0.2),rgba(0,245,255,0))] blur-[160px] opacity-65 animate-pulse"
      style={{ animationDuration: '4s', animationDelay: '1s' }}
    />

    {/* Center glow */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,0,81,0.15),transparent)] blur-[100px] opacity-50 animate-pulse"
      style={{ animationDuration: '2.5s' }}
    />

    <div className="relative z-10 flex flex-col items-center text-center px-6">
      {/* Glass-morph loader container */}
      <div className="relative mb-10">
        {/* Glass effect background */}
        <div className="absolute inset-[-40px] rounded-full backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-2xl" />

        {/* Panhaha animated logo */}
        <div className="relative">
          {/* Outer rotating ring - Primary color */}
          <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />

          {/* Inner rotating ring - Accent color */}
          <div
            className="absolute inset-0 w-24 h-24 rounded-full border-4 border-accent-500/30 border-t-accent-500 animate-spin"
            style={{ transform: 'scale(0.75)', animationDuration: '1.5s', animationDirection: 'reverse' }}
          />

          {/* Center icon */}
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-display font-bold text-2xl bg-panhaha-gradient shadow-2xl shadow-primary-500/50 animate-pulse">
              H
            </div>
          </div>

          {/* Orbiting dots */}
          <div className="absolute inset-0 w-24 h-24 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
          </div>
          <div className="absolute inset-0 w-24 h-24 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-500 shadow-lg shadow-accent-500/50" />
          </div>
        </div>
      </div>

      {/* Text with glass effect */}
      <div className="backdrop-blur-md bg-white/30 dark:bg-white/5 px-6 py-3 rounded-2xl border border-white/20 dark:border-white/10 shadow-xl">
        <h2 className="text-lg sm:text-2xl font-display font-semibold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent animate-fade-in">
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-2 text-sm sm:text-base text-secondary-600 dark:text-secondary-300 animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Loading dots animation */}
      <div className="flex gap-2 mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-accent-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

export default FullScreenHandshakeLoader;
