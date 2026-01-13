import React from 'react';
import { LoadingAnimation, LoadingAnimationType } from './LoadingAnimation';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  className?: string;
  type?: LoadingAnimationType;
  text?: string;
}

/**
 * LoadingSpinner - Modern loading spinner with multiple animation types
 * @deprecated Use LoadingAnimation directly for more control
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
  type = 'spinner',
  text,
}) => {
  return (
    <LoadingAnimation
      type={type}
      size={size}
      color={color}
      className={className}
      text={text}
    />
  );
};
