import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ServiceService } from '@/services/service';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

function parseArr(v: unknown): string[] {
  try { return typeof v === 'string' ? JSON.parse(v) : (Array.isArray(v) ? v : []); }
  catch { return []; }
}

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

// Cached brand lockup (full logo + "MiyZapis" name, transparent) — no white background.
let _iconCache: { buffer: Buffer; width: number; height: number } | null = null;
const ICON_H = 104;
async function loadBrandIcon(): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  if (_iconCache) return _iconCache;
  try {
    const base = (process.env.FRONTEND_URL || 'https://miyzapis.com').replace(/\/$/, '');
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${base}/miyzapis-logo-full.png`, { signal: ctrl.signal });
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

// Generic 1200×630 branded share-card renderer used for every entity type.
async function renderCard(opts: {
  name: string;
  subtitle: string;
  priceLabel?: string;
  bgSrc?: string | null;
  avatarSrc?: string | null;
  cta?: string;
}): Promise<Buffer> {
  const name = opts.name || 'MiyZapis';
  const subtitle = opts.subtitle || '';
  const priceLabel = opts.priceLabel || '';
  const cta = opts.cta || 'Book on miyzapis.com';

  // ── Background: photo (cover + scrim) or a brand gradient ──
  const photo = opts.bgSrc ? await loadImageBuffer(opts.bgSrc) : null;
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

  const icon = await loadBrandIcon();
  const iconLeft = 48;
  const iconTop = 38;

  const avatarBuf = opts.avatarSrc ? await loadImageBuffer(opts.avatarSrc) : null;
  const AV = 84;
  const avatarCircle = avatarBuf ? await circleImage(avatarBuf, AV) : null;

  const nameLines = wrap(name, 28, 2);
  const NAME_LAST = 430;
  const nameSvg = nameLines
    .map((l, i) => `<text x="64" y="${NAME_LAST - (nameLines.length - 1 - i) * 64}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="58" font-weight="800" fill="#ffffff">${escapeXml(l)}</text>`)
    .join('');
  const subTextX = avatarCircle ? 64 + AV + 18 : 64;
  const subTextY = 524;
  const avatarTop = 471;

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
    ${priceLabel ? `
    <rect x="${W - 56 - (priceLabel.length * 23 + 52)}" y="42" rx="24" ry="24" width="${priceLabel.length * 23 + 52}" height="60" fill="${BRAND_YELLOW}"/>
    <text x="${W - 56 - 26}" y="83" text-anchor="end" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="34" font-weight="800" fill="#1e293b">${escapeXml(priceLabel)}</text>` : ''}
    <g filter="url(#ds)">${nameSvg}
    <text x="${subTextX}" y="${subTextY}" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="32" font-weight="600" fill="#f1f5f9">${escapeXml(subtitle.slice(0, 54))}</text>
    </g>
    <text x="64" y="596" font-family="Noto Sans, DejaVu Sans, sans-serif" font-size="27" font-weight="700" fill="${BRAND_YELLOW}" filter="url(#ds)">${escapeXml(cta)}</text>
  </svg>`;

  const layers: sharp.OverlayOptions[] = [
    { input: Buffer.from(overlay), top: 0, left: 0 },
    ...(icon ? [{ input: icon.buffer, top: iconTop, left: iconLeft }] : []),
    ...(avatarCircle ? [{ input: avatarCircle, top: avatarTop, left: 64 }] : []),
  ];

  try {
    return await base.composite(layers).png().toBuffer();
  } catch (e) {
    logger.error('OG card composite failed', { error: e });
    return await sharp({ create: { width: W, height: H, channels: 4, background: BRAND_BLUE } })
      .composite(layers).png().toBuffer();
  }
}

/** Branded share card for a service. */
export async function generateServiceOgCard(serviceId: string): Promise<Buffer> {
  const service: any = await ServiceService.getService(serviceId);
  if (!service) throw new Error('SERVICE_NOT_FOUND');
  const images = parseArr(service.images);
  const sp = service.specialist || {};
  const portfolio = parseArr(sp.portfolioImages);
  const businessName = sp.businessName || `${sp.user?.firstName || ''} ${sp.user?.lastName || ''}`.trim() || 'MiyZapis';
  const rating = sp.rating != null ? Number(sp.rating) : null;
  const price = service.basePrice != null ? Number(service.basePrice) : null;
  const currency = service.currency || 'UAH';
  return renderCard({
    name: service.name || 'Service',
    subtitle: `${rating != null ? `★ ${rating.toFixed(1)}  ·  ` : ''}${businessName}`,
    priceLabel: price != null && price !== 0 ? `${price.toLocaleString('en-US')} ${currency}` : '',
    bgSrc: images[0] || portfolio[0],
    avatarSrc: sp.user?.avatar,
  });
}

/** Branded share card for a specialist profile. */
export async function generateSpecialistOgCard(specialistId: string): Promise<Buffer> {
  const s: any = await prisma.specialist.findUnique({
    where: { id: specialistId },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  });
  if (!s) throw new Error('SPECIALIST_NOT_FOUND');
  const portfolio = parseArr(s.portfolioImages);
  const specialties = parseArr(s.specialties);
  const businessName = s.businessName || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'MiyZapis';
  const rating = s.rating != null ? Number(s.rating) : null;
  const bits: string[] = [];
  if (rating != null && rating > 0) bits.push(`★ ${rating.toFixed(1)}${s.reviewCount ? ` (${s.reviewCount})` : ''}`);
  if (specialties[0]) bits.push(specialties[0]);
  const subtitle = bits.join('  ·  ') || (s.bio || '').replace(/\s+/g, ' ').trim().slice(0, 48);
  return renderCard({
    name: businessName,
    subtitle,
    bgSrc: portfolio[0],
    avatarSrc: s.user?.avatar,
    cta: 'Book on miyzapis.com',
  });
}

/** Branded share card for a community / marketplace post. */
export async function generatePostOgCard(postId: string): Promise<Buffer> {
  const p: any = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: { firstName: true, lastName: true, avatar: true } } },
  });
  if (!p) throw new Error('POST_NOT_FOUND');
  const images = parseArr(p.images);
  const isListing = p.type === 'SALE' || p.type === 'RENT';
  const price = p.price != null ? Number(p.price) : null;
  const currency = p.currency || 'UAH';
  const author = `${p.author?.firstName || ''} ${p.author?.lastName || ''}`.trim();
  const typeLabel = p.type === 'SALE' ? 'For sale' : p.type === 'RENT' ? 'For rent' : 'Community';
  return renderCard({
    name: p.title || 'Post',
    subtitle: `${typeLabel}${author ? `  ·  ${author}` : ''}`,
    priceLabel: isListing && price != null && price !== 0 ? `${price.toLocaleString('en-US')} ${currency}` : '',
    bgSrc: images[0],
    avatarSrc: p.author?.avatar,
    cta: 'View on miyzapis.com',
  });
}
