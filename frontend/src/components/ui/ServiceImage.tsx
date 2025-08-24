import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ServiceImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  lazy?: boolean;
  onError?: (error: Event) => void;
  onLoad?: () => void;
}

export const ServiceImage: React.FC<ServiceImageProps> = ({
  src,
  alt,
  className = '',
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
      if (!lazy) {
        setShouldLoad(true);
      }
    } else {
      setImageError(false);
      setImageLoading(false);
    }
  }, [src, lazy]);

  // If no src provided or image failed to load, show fallback
  if (!src || imageError) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <PhotoIcon className="w-12 h-12 text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Loading skeleton */}
      {imageLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      
      {/* Lazy loading placeholder */}
      {lazy && !shouldLoad && (
        <div 
          ref={setRef}
          className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}
        >
          <PhotoIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        </div>
      )}
      
      {/* Actual image */}
      {shouldLoad && (
        <img
          ref={lazy ? setRef : undefined}
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading={lazy ? 'lazy' : 'eager'}
        />
      )}
    </div>
  );
};