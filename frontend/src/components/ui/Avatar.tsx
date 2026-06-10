import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { UserCircleIcon } from '@/components/icons';
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

const AvatarComponent: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'md',
  className = '',
  fallbackIcon: _fallbackIcon = true,
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

  // Process the image URL to ensure it's absolute (memoized for performance)
  const absoluteSrc = useMemo(() =>
    src ? getAbsoluteImageUrl(src) : null,
    [src]
  );

  // If no valid src or loading failed, show a quiet initials placeholder
  // (clean and intentional — not a generic icon). Falls back to the icon only
  // when no usable initials can be derived from `alt`.
  if (!absoluteSrc || imageError) {
    const initials = (alt || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-lg', xl: 'text-2xl' }[size];
    if (!initials) {
      return (
        <UserCircleIcon
          className={`${sizeClasses[size]} text-gray-400 dark:text-gray-500 ${className}`}
        />
      );
    }
    return (
      <span
        className={`${sizeClasses[size]} ${textSize} inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-semibold select-none ${className}`}
        aria-label={alt}
      >
        {initials}
      </span>
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
};

// Export with custom comparison function for better memoization
export const Avatar = React.memo(AvatarComponent, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.src === nextProps.src &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className &&
    prevProps.lazy === nextProps.lazy &&
    prevProps.alt === nextProps.alt
  );
});