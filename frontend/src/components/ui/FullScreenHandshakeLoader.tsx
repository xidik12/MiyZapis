import React from 'react';
import { FullScreenLoader } from './FullScreenLoader';
import { LoadingAnimationType } from './LoadingAnimation';

interface FullScreenHandshakeLoaderProps {
  title?: string;
  subtitle?: string;
  animationType?: LoadingAnimationType;
}

/**
 * FullScreenHandshakeLoader - Legacy component for backward compatibility
 * @deprecated Use FullScreenLoader directly for more features
 */
export const FullScreenHandshakeLoader: React.FC<FullScreenHandshakeLoaderProps> = ({
  title = 'Loading',
  subtitle = 'Getting things ready for you',
  animationType = 'pulse',
}) => {
  return (
    <FullScreenLoader
      isOpen={true}
      title={title}
      subtitle={subtitle}
      animationType={animationType}
    />
  );
};

export default FullScreenHandshakeLoader;
