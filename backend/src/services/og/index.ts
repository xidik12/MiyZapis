import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ServiceService } from '@/services/service';
import { logger } from '@/utils/logger';

const W = 1200;
const H = 630;
const BRAND_BLUE = '#2563eb';
const BRAND_YELLOW = '#facc15';

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
    const used = lines.join(' ').length;
    if (used < (text || '').trim().length) lines[maxLines - 1] = lines[maxLines - 1].replace(/.{1}$/, '…');
  }
  return lines.length ? lines : [''];
}

// Load an image (local upload path or remote URL) as a buffer.
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

// Cached brand icon (the handshake+leaf mark, transparent) — no white background.
let _iconCache: { buffer: Buffer; width: number; height: number } | null = null;
const ICON_H = 92;
async function loadBrandIcon(): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  if (_iconCache) return _iconCache;
  try {
    const base = (process.env.FRONTEND_URL || 'https://miyzapis.com').replace(/\/$/, '');
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${base}/miyzapis_logo.png`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) return null;
    const resized = await sharp(Buffer.from(await res.arrayBuffer())).resize({ height: ICON_H }).png().toBuffer();
    const meta = await sharp(resized).metadata();
    _iconCache = { buffer: resized, width: meta.width || ICON_H, height: meta.height || ICON_H };
    return _iconCache;
  } catch {
    return null;
  }
}

// Crop an image to a circle of the given size (with a thin white ring).
async function circleImage(buf: Buffer, size: number): Promise<Buffer | null> {
  try {
    const resized = await sharp(buf).resize(size, size, { fit: 'cover', position: 'attention' }).png().toBuffer();
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
    const masked = await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    // White ring
    const ring = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1.5}" fill="none" stroke="#ffffff" stroke-width="3"/></svg>`);
    return await sharp(masked).composite([{ input: ring, blend: 'over' }]).png().toBuffer();
  } catch {
    return null;
  }
}

/**
 * Generate a 1200×630 branded share card (PNG) for a service.
 */
export async function generateServiceOgCard(serviceId: string): Promise<Buffer> {
  const service: any = await ServiceService.getService(serviceId);
  if (!service) throw new Error('SERVICE_NOT_FOUND');

  const name: string = service.name || 'Service';
  const parseArr = (v: any): string[] => {
    try { return typeof v === 'string' ? JSON.parse(v) : (Array.isArray(v) ? v : []); }
    catch { return []; }
  };
  const images: string[] = parseArr(service.images);
  const sp = service.specialist || {};
  const portfolio: string[] = parseArr(sp.portfolioImages);
  const businessName: string = sp.businessName
    || `${sp.user?.firstName || ''} ${sp.user?.lastName || ''}`.trim()
    || 'MiyZapis';
  const rating: number | null = sp.rating != null ? Number(sp.rating) : null;
  const price = service.basePrice != null ? Number(service.basePrice) : null;
  const currency: string = service.currency || 'UAH';
  const priceLabel = price != null ? (price === 0 ? '' : `${price.toLocaleString('en-US')} ${currency}`) : '';

  // ── Background: service photo → portfolio photo → brand gradient ──
  const bgSrc = images[0] || portfolio[0];
  const photo = bgSrc ? await loadImageBuffer(bgSrc) : null;
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

  // Brand icon (no chip) + avatar circle.
  const icon = await loadBrandIcon();
  const iconW = icon?.width || ICON_H;
  const iconH = icon?.height || ICON_H;
  const iconLeft = 52;
  const iconTop = 40;
  const wordmarkX = iconLeft + iconW + 16;
  const wordmarkY = iconTop + iconH / 2 + 16; // vertically centered with the icon

  const avatarBuf = sp.user?.avatar ? await loadImageBuffer(sp.user.avatar) : null;
  const AV = 84;
  const avatarCircle = avatarBuf ? await circleImage(avatarBuf, AV) : null;

  // Bottom-anchored layout: name grows upward, avatar+subtitle then CTA below it.
  const nameLines = wrap(name, 28, 2);
  const NAME_LAST = 430; // baseline of the last name line
  const nameSvg = nameLines
    .map((l, i) => `<text x="64" y="${NAME_LAST - (nameLines.length - 1 - i) * 64}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="58" font-weight="800" fill="#ffffff">${escapeXml(l)}</text>`)
    .join('');
  const star = rating != null ? `★ ${rating.toFixed(1)}  ·  ` : '';
  const subtitle = `${star}${businessName}`;
  const subTextX = avatarCircle ? 64 + AV + 18 : 64;
  const subTextY = 524;       // subtitle baseline
  const avatarTop = 471;      // avatar vertically centered on the subtitle line

  const overlay = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.45"/>
        <stop offset="42%" stop-color="#000000" stop-opacity="0.1"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.86"/>
      </linearGradient>
      <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000000" flood-opacity="0.55"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
    <!-- brand wordmark (icon composited separately) -->
    <text x="${wordmarkX}" y="${wordmarkY}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="46" font-weight="800" fill="#ffffff" filter="url(#ds)">MiyZapis</text>
    ${priceLabel ? `
    <rect x="${W - 56 - (priceLabel.length * 23 + 52)}" y="42" rx="24" ry="24" width="${priceLabel.length * 23 + 52}" height="60" fill="${BRAND_YELLOW}"/>
    <text x="${W - 56 - 26}" y="83" text-anchor="end" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="34" font-weight="800" fill="#1e293b">${escapeXml(priceLabel)}</text>` : ''}
    <g filter="url(#ds)">${nameSvg}
    <text x="${subTextX}" y="${subTextY}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="32" font-weight="600" fill="#f1f5f9">${escapeXml(subtitle.slice(0, 54))}</text>
    </g>
    <text x="64" y="596" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="27" font-weight="700" fill="${BRAND_YELLOW}" filter="url(#ds)">Book on miyzapis.com</text>
  </svg>`;

  const layers: sharp.OverlayOptions[] = [
    { input: Buffer.from(overlay), top: 0, left: 0 },
    ...(icon ? [{ input: icon.buffer, top: iconTop, left: iconLeft }] : []),
    ...(avatarCircle ? [{ input: avatarCircle, top: avatarTop, left: 64 }] : []),
  ];

  try {
    return await base.composite(layers).png().toBuffer();
  } catch (e) {
    logger.error('OG card composite failed', { serviceId, error: e });
    return await sharp({ create: { width: W, height: H, channels: 4, background: BRAND_BLUE } })
      .composite(layers)
      .png()
      .toBuffer();
  }
}
