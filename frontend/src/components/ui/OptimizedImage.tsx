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
  
  // Debug logging for OptimizedImage
  console.log('🖼️ OptimizedImage init:', { 
    src, 
    fallbackSrc, 
    alt: alt?.substring(0, 30), 
    isBackendUpload: src.includes('miyzapis-backend-production.up.railway.app/uploads/'),
    className 
  });

  // Check WebP support on component mount
  useEffect(() => {
    getWebPSupport().then(setSupportsWebP);
  }, []);

  // Update image source when src prop changes
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
    
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    // For backend uploads, try a faster pre-check using fetch
    const isBackendUpload = src.includes('miyzapis-backend-production.up.railway.app/uploads/') || 
                            src.includes('miyzapis-backend-production.up.railway.app/api/v1/files/s3-proxy/');
    
    if (isBackendUpload && !src.startsWith('data:')) {
      // Pre-check backend files with HEAD request to detect 404s faster
      fetch(src, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.log('🚨 Backend file HEAD check failed:', response.status, src);
            
            // Special handling for portfolio images
            if (src.includes('/uploads/portfolio_')) {
              console.log('📁 Portfolio image missing - may need migration or re-upload');
            }
            
            setHasError(true);
            setIsLoading(false);
            return;
          }
          // File exists, proceed with normal image loading with appropriate timeout
          // Use longer timeout for S3 proxy URLs
          const timeoutDuration = src.includes('/s3-proxy/') ? 10000 : 2000;
          const timeout = setTimeout(() => {
            if (src.includes('/s3-proxy/')) {
              console.log('⏰ S3 proxy image loading timeout after HEAD success:', src);
              console.log('💡 S3 proxy image may be large or have slow network connection.');
            } else {
              console.log('⏰ Backend file loading timeout after HEAD success:', src);
            }
            setHasError(true);
            setIsLoading(false);
          }, timeoutDuration);
          setTimeoutId(timeout);
        })
        .catch((fetchError) => {
          // Network error or file doesn't exist
          console.log('🚨 Backend file HEAD request failed - file likely missing:', src);
          console.log('💡 Suggestion: Files may have been lost during deployment. Consider re-uploading images or implementing cloud storage.');
          setHasError(true);
          setIsLoading(false);
        });
    } else {
      // For non-backend files or data URLs, use different timeout based on type
      let timeoutDuration = 3000;
      
      // Longer timeout for base64 images as they might be large
      if (src.startsWith('data:image/')) {
        const sizeKB = Math.round(src.length / 1024);
        if (sizeKB > 200) {
          timeoutDuration = 10000; // 10 seconds for large base64 images
          console.log(`🖼️ Large base64 image detected (${sizeKB}KB), using extended timeout`);
        }
      }
      
      // Longer timeout for Google/external avatar services as they might be slower
      if (src.includes('googleusercontent.com') || src.includes('gravatar.com') || src.includes('github.com')) {
        timeoutDuration = 8000; // 8 seconds for external avatar services
        console.log(`🌐 External avatar service detected, using extended timeout: ${src}`);
      }
      
      // Longer timeout for S3 images as they might be larger and take time to load
      if (src.includes('s3.ap-southeast-2.amazonaws.com') || src.includes('miyzapis-storage')) {
        timeoutDuration = 10000; // 10 seconds for S3 images
        console.log(`☁️ S3 image detected, using extended timeout: ${src}`);
      }
      
      const timeout = setTimeout(() => {
        if (src.startsWith('data:image/')) {
          const sizeKB = Math.round(src.length / 1024);
          console.log(`⏰ Base64 image timeout (${sizeKB}KB):`, src.substring(0, 50) + '...');
          console.log('💡 Consider converting large images to files for better performance');
        } else if (src.includes('googleusercontent.com')) {
          console.log('⏰ Google avatar loading timeout for:', src);
          console.log('💡 This might be due to network issues or CORS. Google avatars should work.');
        } else if (src.includes('s3.ap-southeast-2.amazonaws.com') || src.includes('miyzapis-storage')) {
          console.log('⏰ S3 image loading timeout for:', src);
          console.log('💡 S3 image might be large or have slow network connection. Check S3 CORS configuration.');
        } else {
          console.log('⏰ Image loading timeout for:', src);
        }
        setHasError(true);
        setIsLoading(false);
      }, timeoutDuration);
      
      setTimeoutId(timeout);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [src]); // Removed timeoutId from dependencies to prevent infinite loop

  // Generate fallback URL for WebP images
  const generateFallbackSrc = (originalSrc: string): string => {
    if (fallbackSrc) {
      return fallbackSrc;
    }
    
    // Handle base64 data URLs - they should work directly
    if (originalSrc.startsWith('data:')) {
      return originalSrc;
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
    
    // Clear timeout when we get an error
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    
    // Special handling for Google avatars
    if (imageSrc.includes('googleusercontent.com')) {
      console.log('❌ Google avatar failed to load - this might be due to:');
      console.log('   1. Network connectivity issues');
      console.log('   2. CORS policy changes by Google');
      console.log('   3. Avatar URL expiration');
      console.log('   💡 Consider implementing avatar download to backend storage');
    }
    
    // Don't retry for base64 data URLs - they should work or fail immediately
    if (imageSrc.startsWith('data:')) {
      console.log('❌ Base64 image failed to load - this indicates corrupted data');
      setHasError(true);
      setIsLoading(false);
      onError?.(event);
      return;
    }

    // If this is a WebP image and we haven't tried the fallback yet
    if (imageSrc.includes('.webp') && !hasError) {
      const fallback = generateFallbackSrc(imageSrc);
      if (fallback !== imageSrc) {
        console.log('🔄 Trying WebP fallback:', fallback);
        setImageSrc(fallback);
        setHasError(false);
        setIsLoading(true); // Reset loading state for retry
        return;
      }
    }
    
    // If WebP is not supported and we're loading a WebP image
    if (supportsWebP === false && imageSrc.includes('.webp')) {
      const fallback = generateFallbackSrc(imageSrc);
      if (fallback !== imageSrc) {
        console.log('🔄 WebP not supported, trying fallback:', fallback);
        setImageSrc(fallback);
        setIsLoading(true); // Reset loading state for retry
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
          {(() => {
            const isBackendUpload = src.includes('miyzapis-backend-production.up.railway.app/uploads/');
            const isPortfolioImage = src.includes('portfolio_');
            const isAvatarImage = src.includes('avatar_');
            
            return (
              <>
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isAvatarImage ? (
                    // User icon for avatars
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  ) : isPortfolioImage ? (
                    // Gallery icon for portfolio
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  ) : (
                    // Default image icon
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  )}
                </svg>
                {isBackendUpload ? (
                  <div>
                    <div className="font-medium">Image unavailable</div>
                    <div className="text-xs mt-1">Re-upload needed</div>
                  </div>
                ) : (
                  'Image failed to load'
                )}
              </>
            );
          })()}
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