// AI Concierge — a natural-language assistant that turns requests like
// "I want a haircut near me this afternoon" into real, bookable options with
// locations + navigation. The LLM (Gemini) does the language understanding and
// orchestration; it NEVER invents prices, availability, or locations — it calls
// the tools below, which read the live database. Deterministic code owns
// correctness (search gate, distance, reachability); the model owns presentation.
//
// Gated on GEMINI_API_KEY: if unset, isConciergeEnabled() is false and the
// controller returns 503, so this is safe to ship before the key is configured.

import {
  GoogleGenerativeAI,
  type FunctionDeclarationsTool,
  SchemaType,
} from '@google/generative-ai';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

export function isConciergeEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

// ── Geo helpers ────────────────────────────────────────────────────────────
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
// Rough urban travel-time estimate (Phase 1). Upgrade to Google Distance Matrix
// for real ETAs later — the SDK (@googlemaps/google-maps-services-js) is present.
const URBAN_KMH = 24;
function etaMinutes(km: number): number {
  return Math.max(3, Math.round((km / URBAN_KMH) * 60));
}
function directionsUrl(destLat: number, destLng: number, origin?: { lat: number; lng: number }): string {
  const o = origin ? `&origin=${origin.lat},${origin.lng}` : '';
  return `https://www.google.com/maps/dir/?api=1${o}&destination=${destLat},${destLng}`;
}

export interface ConciergeOption {
  serviceId: string;
  serviceName: string;
  price: number;
  currency: string;
  durationMinutes: number;
  specialistId: string;
  businessName: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm?: number;
  etaMinutes?: number;
  navUrl?: string;
  bookUrl: string;
}

export interface ConciergeProduct {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  inStock: number;
  shopName: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm?: number;
  etaMinutes?: number;
  navUrl?: string;
  shopUrl: string;
}

// ── Tool: search products across shops (RETAIL, in stock, gated shops only) ──
async function searchProductsTool(
  args: { query: string; city?: string; maxPrice?: number },
  ctx: { lat?: number; lng?: number },
): Promise<{ products: ConciergeProduct[] }> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      type: 'RETAIL',
      stockQty: { gt: 0 },
      salePrice: { not: null },
      ...(typeof args.maxPrice === 'number' ? { salePrice: { lte: args.maxPrice, not: null } } : {}),
      OR: [
        { name: { contains: args.query, mode: 'insensitive' } },
        { sku: { contains: args.query, mode: 'insensitive' } },
        { barcode: { contains: args.query, mode: 'insensitive' } },
        { description: { contains: args.query, mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, salePrice: true, currency: true, stockQty: true, ownerId: true },
    take: 15,
  });
  if (products.length === 0) return { products: [] };

  // Resolve the owning shop's public profile + location (products.ownerId = the
  // specialist's userId). Only surface shops that pass the same completeness gate
  // as search (business name + a contact + a location).
  const ownerIds = [...new Set(products.map((p) => p.ownerId))];
  const shops = await prisma.specialist.findMany({
    where: {
      userId: { in: ownerIds },
      user: { isActive: true },
      businessName: { not: null },
      AND: [
        { businessName: { not: '' } },
        { OR: [{ businessPhone: { not: null } }, { whatsappNumber: { not: null } }] },
        { OR: [{ preciseAddress: { not: null } }, { address: { not: null } }] },
      ],
      ...(args.city ? { city: { contains: args.city, mode: 'insensitive' } } : {}),
    },
    select: { userId: true, slug: true, id: true, businessName: true, address: true, preciseAddress: true, city: true, latitude: true, longitude: true },
  });
  const byOwner = new Map(shops.map((s) => [s.userId, s]));

  const out: ConciergeProduct[] = [];
  for (const p of products) {
    const shop = byOwner.get(p.ownerId);
    if (!shop) continue; // shop not public/complete → skip
    const item: ConciergeProduct = {
      productId: p.id,
      productName: p.name,
      price: Number(p.salePrice),
      currency: p.currency || 'UAH',
      inStock: Number(p.stockQty),
      shopName: shop.businessName || 'Shop',
      address: shop.preciseAddress || shop.address || null,
      city: shop.city || null,
      lat: shop.latitude ?? null,
      lng: shop.longitude ?? null,
      shopUrl: `/specialist/${shop.slug || shop.id}`,
    };
    if (item.lat != null && item.lng != null) {
      item.navUrl = directionsUrl(item.lat, item.lng, ctx.lat != null && ctx.lng != null ? { lat: ctx.lat, lng: ctx.lng } : undefined);
      if (ctx.lat != null && ctx.lng != null) {
        item.distanceKm = Math.round(haversineKm(ctx.lat, ctx.lng, item.lat, item.lng) * 10) / 10;
        item.etaMinutes = etaMinutes(item.distanceKm);
      }
    }
    out.push(item);
  }
  if (ctx.lat != null && ctx.lng != null) out.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  return { products: out.slice(0, 8) };
}

// ── Tool: search services (mirrors the marketplace "complete profile" gate) ──
async function searchServicesTool(
  args: { query?: string; city?: string; maxPrice?: number },
  ctx: { lat?: number; lng?: number },
): Promise<{ options: ConciergeOption[] }> {
  const rows = await prisma.service.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      ...(args.query
        ? {
            OR: [
              { name: { contains: args.query, mode: 'insensitive' } },
              { category: { contains: args.query, mode: 'insensitive' } },
              { description: { contains: args.query, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(typeof args.maxPrice === 'number' ? { basePrice: { lte: args.maxPrice } } : {}),
      specialist: {
        user: { isActive: true },
        businessName: { not: null },
        AND: [
          { businessName: { not: '' } },
          { OR: [{ businessPhone: { not: null } }, { whatsappNumber: { not: null } }] },
          { OR: [{ preciseAddress: { not: null } }, { address: { not: null } }] },
        ],
        ...(args.city ? { city: { contains: args.city, mode: 'insensitive' } } : {}),
      },
    },
    select: {
      id: true, name: true, basePrice: true, currency: true, duration: true,
      specialist: {
        select: {
          id: true, slug: true, businessName: true, address: true, preciseAddress: true,
          city: true, latitude: true, longitude: true,
        },
      },
    },
    take: 8,
  });

  const options: ConciergeOption[] = rows.map((s) => {
    const sp = s.specialist!;
    const opt: ConciergeOption = {
      serviceId: s.id,
      serviceName: s.name,
      price: Number(s.basePrice),
      currency: s.currency || 'UAH',
      durationMinutes: s.duration || 60,
      specialistId: sp.id,
      businessName: sp.businessName || 'Specialist',
      address: sp.preciseAddress || sp.address || null,
      city: sp.city || null,
      lat: sp.latitude ?? null,
      lng: sp.longitude ?? null,
      bookUrl: `/specialist/${sp.slug || sp.id}?service=${s.id}`,
    };
    if (opt.lat != null && opt.lng != null) {
      opt.navUrl = directionsUrl(opt.lat, opt.lng, ctx.lat != null && ctx.lng != null ? { lat: ctx.lat, lng: ctx.lng } : undefined);
      if (ctx.lat != null && ctx.lng != null) {
        opt.distanceKm = Math.round(haversineKm(ctx.lat, ctx.lng, opt.lat, opt.lng) * 10) / 10;
        opt.etaMinutes = etaMinutes(opt.distanceKm);
      }
    }
    return opt;
  });

  // Sort by distance when we know where the user is.
  if (ctx.lat != null && ctx.lng != null) {
    options.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  }
  return { options };
}

// ── Tool: soonest availability for a specialist ─────────────────────────────
async function availabilityTool(args: { specialistId: string }): Promise<{ slots: string[] }> {
  const now = new Date();
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const spec = await prisma.specialist.findUnique({ where: { id: args.specialistId }, select: { userId: true } });
  if (!spec) return { slots: [] };

  const [blocks, bookings] = await Promise.all([
    prisma.availabilityBlock.findMany({
      where: { specialistId: args.specialistId, isAvailable: true, endDateTime: { gte: now }, startDateTime: { lte: horizon } },
      select: { startDateTime: true, endDateTime: true },
      orderBy: { startDateTime: 'asc' },
      take: 50,
    }),
    prisma.booking.findMany({
      where: { specialistId: spec.userId, scheduledAt: { gte: now, lte: horizon }, status: { in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] } },
      select: { scheduledAt: true },
    }),
  ]);

  const booked = new Set(bookings.map((b) => new Date(b.scheduledAt).getTime()));
  const slots: string[] = [];
  for (const b of blocks) {
    // Offer hourly slot starts within each open block that aren't already booked.
    let t = Math.max(b.startDateTime.getTime(), now.getTime());
    // round up to the next hour
    t = Math.ceil(t / (60 * 60 * 1000)) * (60 * 60 * 1000);
    for (; t + 30 * 60 * 1000 <= b.endDateTime.getTime() && slots.length < 6; t += 60 * 60 * 1000) {
      if (!booked.has(t)) slots.push(new Date(t).toISOString());
    }
    if (slots.length >= 6) break;
  }
  return { slots };
}

const tools: FunctionDeclarationsTool[] = [
  {
    functionDeclarations: [
      {
        name: 'search_services',
        description: 'Search MiyZapis for real, bookable services (e.g. haircut, manicure). Returns specialists with price, location and a navigation link. Call this for ANY service request.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Service or category, e.g. "haircut", "manicure"' },
            city: { type: SchemaType.STRING, description: 'Optional city to narrow results' },
            maxPrice: { type: SchemaType.NUMBER, description: 'Optional maximum price' },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_availability',
        description: 'Get the soonest available appointment start times (ISO 8601) for a specialist. Call this BEFORE quoting any time. Never invent times.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: { specialistId: { type: SchemaType.STRING } },
          required: ['specialistId'],
        },
      },
      {
        name: 'search_products',
        description: 'Find real, in-stock RETAIL products for sale across shops (e.g. "shampoo", "hair wax", a brand/SKU). Returns the shop, price, stock, location and a navigation link. Use when the user wants to BUY a physical product.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            query: { type: SchemaType.STRING, description: 'Product name, brand, or SKU/barcode' },
            city: { type: SchemaType.STRING, description: 'Optional city to narrow results' },
            maxPrice: { type: SchemaType.NUMBER, description: 'Optional maximum price' },
          },
          required: ['query'],
        },
      },
    ],
  },
];

export interface ConciergeTurn {
  role: 'user' | 'model';
  text: string;
}

export async function runConcierge(input: {
  message: string;
  history?: ConciergeTurn[];
  lat?: number;
  lng?: number;
  city?: string;
}): Promise<{ reply: string; options: ConciergeOption[]; products: ConciergeProduct[] }> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const nowIso = new Date().toISOString();

  const systemInstruction = [
    'You are the MiyZapis Concierge — a warm, concise assistant for a Ukrainian booking marketplace.',
    'Use the tools to find REAL services and REAL availability. NEVER invent prices, times, availability, distances, or locations.',
    'For any service request, call search_services. Before you name a specific appointment time, call get_availability for that specialist.',
    `The current time is ${nowIso}. The user's location is ${input.lat != null ? `${input.lat},${input.lng}` : 'unknown'}.`,
    'Reachability rule: only suggest an appointment time the user can realistically reach — the slot must be at least (now + travel ETA + 10 min buffer) in the future. Each option includes etaMinutes when the location is known.',
    'Always include, for each recommendation: the business name, the price with currency, the location/address, how far it is (distance + ETA if known), and remind them a navigation link + Book button are on the card.',
    'If the user wants BOTH a service and to buy a product (e.g. "haircut and buy X"), call BOTH search_services and search_products, then present a combined plan: the specialist + a reachable time, AND a nearby shop that has the product in stock — prefer a shop close to the specialist so the trip is one route. Mention both prices and that Navigate/Book buttons are on the cards.',
    'Honor stated preferences: if the user says "cheapest" sort by price, "closest" by distance, "soonest" by earliest reachable availability; if unspecified, lead with the best balance of near + soon + well-reviewed. Offer 1–3 options, not a long list.',
    'Keep replies short and skimmable. If nothing matches, say so honestly and suggest broadening the search.',
  ].join('\n');

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL, tools, systemInstruction });
  const chat = model.startChat({
    history: (input.history || []).map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
  });

  const collectedOptions: ConciergeOption[] = [];
  const collectedProducts: ConciergeProduct[] = [];
  let result = await chat.sendMessage(input.message);

  for (let i = 0; i < 5; i++) {
    const calls = result.response.functionCalls();
    if (!calls || calls.length === 0) break;

    const responses = [];
    for (const call of calls) {
      let out: unknown = {};
      try {
        if (call.name === 'search_services') {
          const r = await searchServicesTool(call.args as any, { lat: input.lat, lng: input.lng });
          collectedOptions.push(...r.options);
          out = r;
        } else if (call.name === 'search_products') {
          const r = await searchProductsTool(call.args as any, { lat: input.lat, lng: input.lng });
          collectedProducts.push(...r.products);
          out = r;
        } else if (call.name === 'get_availability') {
          out = await availabilityTool(call.args as any);
        }
      } catch (e) {
        logger.warn('Concierge tool failed', { tool: call.name, error: e instanceof Error ? e.message : e });
        out = { error: 'tool_failed' };
      }
      responses.push({ functionResponse: { name: call.name, response: out as object } });
    }
    result = await chat.sendMessage(responses);
  }

  // De-dupe by id, keep the order the model saw.
  const seen = new Set<string>();
  const options = collectedOptions.filter((o) => (seen.has(o.serviceId) ? false : (seen.add(o.serviceId), true)));
  const seenP = new Set<string>();
  const products = collectedProducts.filter((p) => (seenP.has(p.productId) ? false : (seenP.add(p.productId), true)));

  return { reply: result.response.text(), options, products };
}
