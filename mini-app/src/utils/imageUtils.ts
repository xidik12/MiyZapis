/**
 * Image URL resolution utility.
 *
 * Handles three cases:
 *  1. Relative paths starting with `/uploads/` — prepend the API origin.
 *  2. Legacy Railway URLs — rewrite to current API domain.
 *  3. Already-absolute URLs — return as-is.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

/** Derive the origin (scheme + host) from the full API base URL. */
function getApiOrigin(): string {
  try {
    const url = new URL(API_BASE_URL);
    return url.origin;
  } catch {
    // Fallback: strip the path portion
    return API_BASE_URL.replace(/\/api\/v\d+\/?$/, '');
  }
}

const API_ORIGIN = getApiOrigin();

/**
 * Resolve an image URL to a fully-qualified absolute URL.
 *
 * - `/uploads/abc.jpg`  → `https://api.miyzapis.com/uploads/abc.jpg`
 * - `https://old-railway.app/uploads/abc.jpg` → `https://api.miyzapis.com/uploads/abc.jpg`
 * - `https://example.com/photo.jpg` → unchanged
 * - `null` / `undefined` / `''` → `''`
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';

  // Relative path — prepend API origin
  if (url.startsWith('/uploads/') || url.startsWith('/files/')) {
    return `${API_ORIGIN}${url}`;
  }

  // Legacy Railway URLs — rewrite host
  if (url.includes('railway.app')) {
    try {
      const parsed = new URL(url);
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}`;
    } catch {
      return url;
    }
  }

  return url;
}

/**
 * Default handler for <img> onError — hides the broken image icon.
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
}
