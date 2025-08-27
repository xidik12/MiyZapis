/**
 * Utility function to ensure image URLs are absolute and point to the backend domain
 */
export function getAbsoluteImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // If it's already an absolute URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative URL starting with /uploads, convert to absolute backend URL
  if (url.startsWith('/uploads')) {
    return `https://miyzapis-backend-production.up.railway.app${url}`;
  }
  
  // If it's just a filename or other relative path, assume it's in uploads
  if (!url.startsWith('/')) {
    return `https://miyzapis-backend-production.up.railway.app/uploads/${url}`;
  }
  
  // Default: prepend backend domain
  return `https://miyzapis-backend-production.up.railway.app${url}`;
}