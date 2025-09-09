import React from 'react';

interface FullScreenHandshakeLoaderProps {
  title?: string;
  subtitle?: string;
}

// A themed, full-screen loader with two avatars subtly moving toward a handshake.
export const FullScreenHandshakeLoader: React.FC<FullScreenHandshakeLoaderProps> = ({
  title = 'Loading... ',
  subtitle = 'Getting things ready for you',
}) => {
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
        {/* CSS-only loader */}
        <div className="loader text-primary-600 dark:text-primary-400 mb-6" />

        {/* Text */}
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 animate-fade-in">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 animate-fade-in" style={{ animationDelay: '80ms' }}>
            {/* Hide raw i18n keys (when provider not ready) and show friendly fallback */}
            {subtitle.includes('.') ? 'Please wait…' : subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default FullScreenHandshakeLoader;
