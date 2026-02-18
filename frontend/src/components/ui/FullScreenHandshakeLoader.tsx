import React from 'react';
import { FullScreenLoader } from './FullScreenLoader';
import { LoadingAnimationType } from './LoadingAnimation';
import { useLanguage } from '@/contexts/LanguageContext';

interface FullScreenHandshakeLoaderProps {
  title?: string;
  subtitle?: string;
  message?: string;
  animationType?: LoadingAnimationType;
}

/**
 * FullScreenHandshakeLoader - Legacy component for backward compatibility
 * @deprecated Use FullScreenLoader directly for more features
 */
export const FullScreenHandshakeLoader: React.FC<FullScreenHandshakeLoaderProps> = ({
  title,
  subtitle,
  message,
  animationType = 'pulse',
}) => {
  const { t } = useLanguage();
  const resolvedTitle = title || message || t('ui.loader.connecting');
  const resolvedSubtitle = subtitle || t('ui.loader.almostDone');
  return (
    <FullScreenLoader
      isOpen={true}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      animationType={animationType}
    />
  );
};

export default FullScreenHandshakeLoader;
