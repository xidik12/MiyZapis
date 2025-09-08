import React from 'react';

interface FullScreenHandshakeLoaderProps {
  title?: string;
  subtitle?: string;
  lightGifSrc?: string; // Shown in light theme
  darkGifSrc?: string;  // Shown in dark theme
}

// A themed, full-screen loader with two avatars subtly moving toward a handshake.
export const FullScreenHandshakeLoader: React.FC<FullScreenHandshakeLoaderProps> = ({
  title = 'Loading... ',
  subtitle = 'Getting things ready for you',
  lightGifSrc,
  darkGifSrc,
}) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  // Safe theme detection without requiring ThemeProvider
  const isDark = (() => {
    try {
      const root = document.documentElement;
      if (root.classList.contains('dark')) return true;
      // fallback to system preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  })();
  const gifSrc = isDark ? darkGifSrc : lightGifSrc;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Background gradient responsive to theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(1200px_800px_at_70%_-20%,rgba(59,130,246,0.12),transparent),radial-gradient(1000px_600px_at_-10%_120%,rgba(251,191,36,0.12),transparent)] dark:bg-[radial-gradient(1200px_800px_at_70%_-20%,rgba(59,130,246,0.08),transparent),radial-gradient(1000px_600px_at_-10%_120%,rgba(251,191,36,0.08),transparent)]" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center text-center px-6">
        {/* Animated avatars */}
        {gifSrc && !imgFailed ? (
          <img
            src={gifSrc}
            alt="Connecting"
            className="mb-6 w-28 h-28 sm:w-36 sm:h-36 object-contain animate-fade-in"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="relative flex items-center justify-center mb-6">
            {/* Left avatar */}
            <div className="handshake-avatar-left">
              <div className="avatar-circle from-primary-500 to-indigo-500" />
            </div>
            {/* Middle pulse */}
            <div className="mx-6">
              <div className="handshake-pulse" />
            </div>
            {/* Right avatar */}
            <div className="handshake-avatar-right">
              <div className="avatar-circle from-amber-400 to-rose-500" />
            </div>
          </div>
        )}

        {/* Text */}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 animate-fade-in">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '80ms' }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default FullScreenHandshakeLoader;
