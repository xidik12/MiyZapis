/**
 * Utility function to ensure image URLs are absolute and point to the correct domain
 * - Static assets (logo.svg, etc.) stay on frontend domain
 * - Uploaded files (/uploads/*) go to backend domain
 */
export function getAbsoluteImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // If it's already an absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Static assets (like logo.svg) should stay on frontend domain
  if (url.startsWith('/') && !url.startsWith('/uploads')) {
    return url; // Keep relative for static assets
  }
  
  // If it's a relative URL starting with /uploads, convert to absolute backend URL
  if (url.startsWith('/uploads')) {
    return `https://miyzapis-backend-production.up.railway.app${url}`;
  }
  
  // If it's just a filename or other relative path, assume it's in uploads
  if (!url.startsWith('/')) {
    return `https://miyzapis-backend-production.up.railway.app/uploads/${url}`;
  }
  
  // Default: keep as relative
  return url;
}