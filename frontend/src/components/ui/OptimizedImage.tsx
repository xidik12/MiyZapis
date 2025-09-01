import React, { useState, useEffect, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  fallbackSrc?: string;
  webpSupported?: boolean;
}

// Check if browser supports WebP
const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Cache WebP support detection
let webpSupported: boolean | null = null;
let webpCheckPromise: Promise<boolean> | null = null;

const getWebPSupport = async (): Promise<boolean> => {
  if (webpSupported !== null) {
    return webpSupported;
  }
  
  if (!webpCheckPromise) {
    webpCheckPromise = checkWebPSupport();
  }
  
  webpSupported = await webpCheckPromise;
  return webpSupported;
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  fallbackSrc,
  alt = '',
  onError,
  onLoad,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Check WebP support on component mount
  useEffect(() => {
    getWebPSupport().then(setSupportsWebP);
  }, []);

  // Update image source when src prop changes
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
    
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⏰ Image loading timeout for:', src);
      setHasError(true);
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    setTimeoutId(timeout);
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [src, timeoutId]);

  // Generate fallback URL for WebP images
  const generateFallbackSrc = (originalSrc: string): string => {
    if (fallbackSrc) {
      return fallbackSrc;
    }
    
    // If the source is a WebP image, try to convert to JPEG
    if (originalSrc.includes('.webp')) {
      return originalSrc.replace(/\.webp$/i, '.jpg');
    }
    
    return originalSrc;
  };

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    console.log('🚨 OptimizedImage failed to load:', imageSrc);
    
    // If this is a WebP image and we haven't tried the fallback yet
    if (imageSrc.includes('.webp') && !hasError) {
      const fallback = generateFallbackSrc(imageSrc);
      if (fallback !== imageSrc) {
        console.log('🔄 Trying WebP fallback:', fallback);
        setImageSrc(fallback);
        setHasError(false);
        return;
      }
    }
    
    // If WebP is not supported and we're loading a WebP image
    if (supportsWebP === false && imageSrc.includes('.webp')) {
      const fallback = generateFallbackSrc(imageSrc);
      if (fallback !== imageSrc) {
        console.log('🔄 WebP not supported, trying fallback:', fallback);
        setImageSrc(fallback);
        return;
      }
    }
    
    console.log('❌ All image loading attempts failed for:', src);
    setHasError(true);
    setIsLoading(false);
    onError?.(event);
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Clear timeout when image loads successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    setIsLoading(false);
    setHasError(false);
    onLoad?.(event);
  };

  // Show loading state
  if (isLoading && !hasError) {
    return (
      <div className={`bg-gray-200 animate-pulse ${className}`} {...props}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className={`bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center ${className}`} {...props}>
        <div className="text-gray-400 text-sm text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Image failed to load
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={handleImageError}
      onLoad={handleImageLoad}
      className={className}
      {...props}
    />
  );
};

export default OptimizedImage;