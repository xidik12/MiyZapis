/**
 * Utility function to ensure image URLs are absolute and point to the correct domain
 * - Static assets (miyzapis_logo.png, etc.) stay on frontend domain
 * - Uploaded files (/uploads/*) go to backend domain
 */
import { environment } from '../config/environment';

export function getAbsoluteImageUrl(url: string | undefined | null | any): string {
  // Debug logging for all inputs
  console.log('🔧 getAbsoluteImageUrl input:', { url, type: typeof url, length: url?.length });
  
  if (!url) {
    console.log('❌ getAbsoluteImageUrl: Empty/null URL provided');
    return '';
  }
  
  // Handle case where url is an object with imageUrl property (portfolio images)
  if (typeof url === 'object' && url.imageUrl) {
    console.log('📦 getAbsoluteImageUrl: Extracting imageUrl from object');
    url = url.imageUrl;
  }
  
  // Ensure url is now a string
  if (typeof url !== 'string') {
    console.log('❌ getAbsoluteImageUrl: URL is not a string after processing:', typeof url);
    return '';
  }
  
  // Check for empty strings
  if (url.trim() === '') {
    console.log('❌ getAbsoluteImageUrl: URL is empty string');
    return '';
  }
  
  // Handle data URLs (base64 encoded images)
  if (url.startsWith('data:')) {
    return url;
  }
  
  // Warn about Google URLs that should be stored in backend
  if (url.includes('googleusercontent.com') || url.includes('google.com')) {
    // Be noisy only in debug; otherwise keep console clean in production
    const msg = '⚠️ Google avatar URL detected - this should be saved to backend storage:';
    if (environment.DEBUG) {
      console.warn(msg, url);
    } else {
      try { console.debug(msg, url); } catch {}
    }
  }
  
  // If it's already an absolute URL, check if it's S3 and needs proxying
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Upgrade HTTP to HTTPS to prevent Mixed Content warnings
    if (url.startsWith('http://') && !url.includes('localhost')) {
      url = url.replace('http://', 'https://');
      console.log('🔒 Upgraded HTTP to HTTPS to prevent Mixed Content warning');
    }
    // Convert S3 URLs to use backend proxy to handle CORS issues
    if (url.includes('miyzapis-storage.s3.ap-southeast-2.amazonaws.com')) {
      const s3Path = url.replace('https://miyzapis-storage.s3.ap-southeast-2.amazonaws.com/', '');
      const proxyUrl = `${environment.API_URL}/files/s3-proxy/${s3Path}`;
      console.log('🔄 Converting S3 URL to proxy:', proxyUrl.substring(0, 80) + '...');
      return proxyUrl;
    }
    
    console.log('✅ Returning absolute URL as-is:', url.substring(0, 50) + '...');
    return url;
  }
  
  // Handle WebP images specifically - add error handling
  if (url.toLowerCase().includes('.webp')) {
    // For WebP images, ensure proper server handling
    if (url.startsWith('/uploads')) {
      return `${environment.API_URL.replace('/api/v1', '')}${url}`;
    }
  }
  
  // Static assets (like logo.svg) should stay on frontend domain
  if (url.startsWith('/') && !url.startsWith('/uploads')) {
    return url; // Keep relative for static assets
  }
  
  // If it's a relative URL starting with /uploads, convert to absolute backend URL
  if (url.startsWith('/uploads')) {
    const finalUrl = `${environment.API_URL.replace('/api/v1', '')}${url}`;
    console.log('🔗 getAbsoluteImageUrl: Converting /uploads URL:', finalUrl);
    return finalUrl;
  }

  // If it's just a filename or other relative path, assume it's in uploads
  if (!url.startsWith('/')) {
    const finalUrl = `${environment.API_URL.replace('/api/v1', '')}/uploads/${url}`;
    console.log('🔗 getAbsoluteImageUrl: Converting filename to uploads URL:', finalUrl);
    return finalUrl;
  }
  
  // Default: keep as relative
  console.log('🔗 getAbsoluteImageUrl: Keeping relative URL:', url);
  return url;
}
