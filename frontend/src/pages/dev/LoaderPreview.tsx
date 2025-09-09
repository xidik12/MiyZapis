import React from 'react';
import { FullScreenHandshakeLoader } from '@/components/ui/FullScreenHandshakeLoader';

const LoaderPreview: React.FC = () => {
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6 text-gray-600 dark:text-gray-300">
        Loader preview is disabled in production builds.
      </div>
    );
  }

  return (
    <FullScreenHandshakeLoader
      title="Loading preview"
      subtitle="Specialist and client are connecting"
    />
  );
};

export default LoaderPreview;

