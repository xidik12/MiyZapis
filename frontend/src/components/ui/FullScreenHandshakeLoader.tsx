import React from 'react';

interface FullScreenHandshakeLoaderProps {
  title?: string;
  subtitle?: string;
  message?: string;
}

// Simple, smooth loader with minimal design
export const FullScreenHandshakeLoader: React.FC<FullScreenHandshakeLoaderProps> = ({
  title,
  subtitle,
  message,
}) => {
  const displayTitle = title || message || 'Loading...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="flex flex-col items-center">
        {/* Simple spinner */}
        <div className="relative w-12 h-12 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-700" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-600 animate-spin" />
        </div>

        {/* Text */}
        <p className="text-base font-medium text-gray-900 dark:text-white">
          {displayTitle}
        </p>
        {subtitle && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default FullScreenHandshakeLoader;
