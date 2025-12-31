import React, { useState, useRef, useEffect } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /**
   * Placeholder to show while image is loading
   * Can be a base64 blur hash, solid color, or skeleton
   */
  placeholder?: string;
  /**
   * Fallback image to show if main image fails to load
   */
  fallback?: string;
  /**
   * Threshold for Intersection Observer (0-1)
   * 0 = load as soon as any pixel is visible
   * 0.1 = load when 10% is visible
   * Default: 0.1
   */
  threshold?: number;
  /**
   * Root margin for Intersection Observer
   * Loads image X pixels before it enters viewport
   * Default: '50px' (loads 50px before visible)
   */
  rootMargin?: string;
  /**
   * Wrapper className for the container div
   */
  wrapperClassName?: string;
  /**
   * Whether to show a skeleton loader instead of placeholder
   */
  skeleton?: boolean;
  /**
   * Callback when image successfully loads
   */
  onLoad?: () => void;
  /**
   * Callback when image fails to load
   */
  onError?: () => void;
}

/**
 * LazyImage component with Intersection Observer
 * Only loads images when they're about to enter the viewport
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Blur placeholder support
 * - Fallback image on error
 * - Skeleton loader option
 * - Configurable threshold and root margin
 *
 * @example
 * <LazyImage
 *   src="/large-image.jpg"
 *   alt="Description"
 *   placeholder="/blur-placeholder.jpg"
 *   fallback="/default-avatar.png"
 * />
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  wrapperClassName = '',
  skeleton = false,
  className = '',
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Create Intersection Observer
    if (imageRef && !isLoaded && !hasError) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            // When image enters viewport, load it
            if (entry.isIntersecting) {
              setImageSrc(src);
              // Disconnect observer after loading starts
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        {
          threshold,
          rootMargin,
        }
      );

      observerRef.current.observe(imageRef);
    }

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [imageRef, src, threshold, rootMargin, isLoaded, hasError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    if (fallback) {
      setImageSrc(fallback);
    }
    onError?.();
  };

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Skeleton loader (only shown when skeleton=true and not loaded) */}
      {skeleton && !isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Actual image */}
      <img
        ref={setImageRef}
        src={imageSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy" // Native lazy loading as fallback
        {...props}
      />

      {/* Loading overlay with blur effect (only when placeholder exists) */}
      {placeholder && !isLoaded && !skeleton && (
        <div className="absolute inset-0 backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 transition-opacity duration-300" />
      )}
    </div>
  );
};

/**
 * Simple lazy image without placeholder/skeleton
 * Just uses native loading="lazy" attribute
 *
 * @example
 * <SimpleLazyImage src="/image.jpg" alt="Description" />
 */
export const SimpleLazyImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  src,
  alt,
  className = '',
  ...props
}) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      {...props}
    />
  );
};

export default LazyImage;
