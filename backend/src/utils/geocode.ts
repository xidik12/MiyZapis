/**
 * Geocoding utility — OpenStreetMap Nominatim (free, no API key).
 * Policy: max 1 req/sec, must send User-Agent header.
 * All errors are swallowed and return null so callers stay non-blocking.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MiyZapis/1.0 (info@incognitogeneration.com)';
const TIMEOUT_MS = 8_000;

export interface Coords {
  lat: number;
  lng: number;
}

/**
 * Geocode a free-form query to {lat, lng}.
 * Returns null on any failure (network, parse, timeout, no results).
 */
export async function geocodeAddress(query: string): Promise<Coords | null> {
  if (!query || !query.trim()) return null;

  try {
    const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query.trim())}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) return null;

    const data = await res.json() as Array<{ lat: string; lon: string }>;
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (!isFinite(lat) || !isFinite(lng)) return null;

    return { lat, lng };
  } catch {
    // Network error, abort, JSON parse failure — all silent
    return null;
  }
}
