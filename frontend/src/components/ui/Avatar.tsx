import React, { useState, useRef, useCallback, useEffect } from 'react';
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

export const Avatar: React.FC<AvatarProps> = ({ 
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
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for lazy loading
  const setRef = useCallback((node: HTMLImageElement | null) => {
    if (imgRef.current) {
      observerRef.current?.unobserve(imgRef.current);
    }
    
    if (node && lazy && !shouldLoad) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setShouldLoad(true);
            observerRef.current?.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
    
    imgRef.current = node;
  }, [lazy, shouldLoad]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const handleImageError = useCallback((error: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('🚨 Avatar image failed to load:', src);
    console.log('🔍 This is likely due to missing files on the backend server.');
    console.log('💡 Consider: 1) Re-uploading avatar, 2) Check if files moved to cloud storage, 3) Backend file serving issue');
    setImageError(true);
    setImageLoading(false);
    onError?.(error.nativeEvent);
  }, [onError, src]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    onLoad?.();
  }, [onLoad]);

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      setImageLoading(true);
      if (!lazy) {
        setShouldLoad(true);
      }
    } else {
      setImageError(false);
      setImageLoading(false);
    }
  }, [src, lazy]);

  // Process the image URL to ensure it's absolute
  const absoluteSrc = src ? getAbsoluteImageUrl(src) : null;
  
  // Debug logging for avatar URLs
  if (src && absoluteSrc !== src) {
    console.log('🔄 Avatar URL transformed:', { original: src, absolute: absoluteSrc });
  }

  // If no src provided or image failed to load, show fallback
  if (!absoluteSrc || imageError) {
    if (fallbackIcon) {
      return (
        <UserCircleIcon 
          className={`${sizeClasses[size]} text-gray-400 dark:text-gray-500 ${className}`}
        />
      );
    } else {
      return (
        <div 
          className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center ${className}`}
        >
          <UserCircleIcon className="w-2/3 h-2/3 text-gray-400 dark:text-gray-500" />
        </div>
      );
    }
  }

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Loading skeleton */}
      {imageLoading && (
        <div 
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse`}
        />
      )}
      
      {/* Lazy loading placeholder */}
      {lazy && !shouldLoad && (
        <div 
          ref={setRef}
          className={`${sizeClasses[size]} bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center ${className}`}
        >
          <UserCircleIcon className="w-2/3 h-2/3 text-gray-300 dark:text-gray-600" />
        </div>
      )}
      
      {/* Actual image */}
      {shouldLoad && (
        <img
          ref={lazy ? setRef : undefined}
          src={absoluteSrc}
          alt={alt}
          className={`${sizeClasses[size]} rounded-full object-cover transition-opacity duration-200 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          } ${className}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading={lazy ? 'lazy' : 'eager'}
        />
      )}
    </div>
  );
};