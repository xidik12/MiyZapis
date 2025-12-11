import React, { useState, useCallback, useEffect } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { getAbsoluteImageUrl } from '../../utils/imageUrl';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: boolean;
  lazy?: boolean;
  onError?: (error: Event) => void;
  onLoad?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const Avatar: React.FC<AvatarProps> = React.memo(({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackIcon = true,
  lazy = false,
  onError,
  onLoad
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!src);

  const handleImageError = useCallback((error: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    setImageLoading(false);
    onError?.(error.nativeEvent);
  }, [onError]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
    } else {
      setImageError(false);
      setImageLoading(false);
    }
  }, [src]);

  // Process the image URL to ensure it's absolute
  const absoluteSrc = src ? getAbsoluteImageUrl(src) : null;

  // If no valid src or loading failed, show fallback
  if (!absoluteSrc || imageError) {
    return (
      <UserCircleIcon
        className={`${sizeClasses[size]} text-gray-400 dark:text-gray-500 ${className}`}
      />
    );
  }

  // Simple and direct approach - just like the working navbar
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {imageLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse`}
        />
      )}

      <img
        src={absoluteSrc}
        alt={alt}
        className={`${sizeClasses[size]} rounded-full object-cover transition-opacity duration-200 ${
          imageLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading={lazy ? 'lazy' : 'eager'}
      />
    </div>
  );
});