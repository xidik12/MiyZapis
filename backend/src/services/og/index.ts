import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ServiceService } from '@/services/service';
import { logger } from '@/utils/logger';

const W = 1200;
const H = 630;

// Brand palette (matches the MiyZapis logo: blue + yellow accent).
const BRAND_BLUE = '#2563eb';
const BRAND_YELLOW = '#facc15';

// Candidate upload roots — mirrors server.ts so we read the same files that are served.
const UPLOAD_ROOTS = [
  '/app/uploads',
  process.env.UPLOAD_DIR || '',
  path.join(process.cwd(), 'uploads'),
  './uploads',
  '/tmp/uploads',
].filter(Boolean);

function escapeXml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Greedy word-wrap to a max characters-per-line, capped to maxLines (… on overflow).
function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = (text || '').trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length <= maxChars) {
      line = (line + ' ' + w).trim();
    } else {
      if (line) lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    // Indicate truncation if there was more text than fit.
    const used = lines.join(' ').length;
    if (used < (text || '').trim().length) lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, '…');
  }
  return lines.length ? lines : [''];
}

// Try to load the service's first image as a buffer (local file or remote URL).
async function loadImageBuffer(img?: string): Promise<Buffer | null> {
  if (!img) return null;
  try {
    if (/^https?:\/\//i.test(img)) {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(img, { signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    }
    // Local path like "/uploads/abc.jpg" or "abc.jpg"
    const rel = img.replace(/^\/?uploads\//, '').replace(/^\//, '');
    for (const root of UPLOAD_ROOTS) {
      const p = path.join(root, rel);
      if (fs.existsSync(p)) return fs.readFileSync(p);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate a 1200×630 branded share card (PNG) for a service.
 * Used as og:image so shared links render a beautiful card on any platform.
 */
export async function generateServiceOgCard(serviceId: string): Promise<Buffer> {
  const service: any = await ServiceService.getService(serviceId);
  if (!service) throw new Error('SERVICE_NOT_FOUND');

  const name: string = service.name || 'Service';
  const images: string[] = (() => {
    try { return typeof service.images === 'string' ? JSON.parse(service.images) : (service.images || []); }
    catch { return []; }
  })();
  const sp = service.specialist || {};
  const businessName: string = sp.businessName
    || `${sp.user?.firstName || ''} ${sp.user?.lastName || ''}`.trim()
    || 'MiyZapis';
  const rating: number | null = sp.rating != null ? Number(sp.rating) : null;
  const price = service.basePrice != null ? Number(service.basePrice) : null;
  const currency: string = service.currency || 'UAH';
  const priceLabel = price != null
    ? (price === 0 ? '' : `${price.toLocaleString('en-US')} ${currency}`)
    : '';

  // ── Background: service photo (cover + darkened) or a brand gradient ──
  const photo = await loadImageBuffer(images[0]);
  let base: sharp.Sharp;
  if (photo) {
    base = sharp(photo).resize(W, H, { fit: 'cover', position: 'attention' });
  } else {
    const grad = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1e3a8a"/><stop offset="100%" stop-color="${BRAND_BLUE}"/>
      </linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>`;
    base = sharp(Buffer.from(grad));
  }

  const nameLines = wrap(name, 30, 2);
  const nameSvg = nameLines
    .map((l, i) => `<text x="64" y="${430 + i * 64}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="56" font-weight="700" fill="#ffffff">${escapeXml(l)}</text>`)
    .join('');
  const subY = 430 + nameLines.length * 64 + 8;
  const star = rating != null ? `★ ${rating.toFixed(1)}  ·  ` : '';
  const subtitle = `${star}${businessName}`;

  const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="40%" stop-color="#000000" stop-opacity="0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
    <!-- brand wordmark -->
    <circle cx="76" cy="70" r="16" fill="${BRAND_YELLOW}"/>
    <text x="102" y="80" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="34" font-weight="800" fill="#ffffff">MiyZapis</text>
    ${priceLabel ? `
    <rect x="${W - 64 - (priceLabel.length * 22 + 48)}" y="44" rx="22" ry="22" width="${priceLabel.length * 22 + 48}" height="56" fill="${BRAND_YELLOW}"/>
    <text x="${W - 64 - 24}" y="82" text-anchor="end" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="32" font-weight="800" fill="#1e293b">${escapeXml(priceLabel)}</text>` : ''}
    <!-- service name -->
    ${nameSvg}
    <!-- subtitle: rating + specialist -->
    <text x="64" y="${subY}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="30" font-weight="500" fill="#e5e7eb">${escapeXml(subtitle.slice(0, 60))}</text>
    <!-- footer cta -->
    <text x="64" y="586" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="26" font-weight="600" fill="${BRAND_YELLOW}">Book on miyzapis.com</text>
  </svg>`;

  try {
    return await base
      .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
      .png()
      .toBuffer();
  } catch (e) {
    logger.error('OG card composite failed', { serviceId, error: e });
    // Last-resort: just the overlay on a plain brand background.
    return await sharp({ create: { width: W, height: H, channels: 4, background: BRAND_BLUE } })
      .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
      .png()
      .toBuffer();
  }
}
