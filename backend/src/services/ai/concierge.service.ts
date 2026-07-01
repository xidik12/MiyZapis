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

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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

// Real drive-time via Google Distance Matrix when a server Maps key is configured
// (GOOGLE_MAPS_API_KEY), else Haversine estimate. Batched: one request per tool.
async function travelMatrix(
  origin: { lat: number; lng: number },
  dests: Array<{ lat: number; lng: number }>,
): Promise<Array<{ km: number; min: number }>> {
  const fallback = () => dests.map((d) => {
    const km = Math.round(haversineKm(origin.lat, origin.lng, d.lat, d.lng) * 10) / 10;
    return { km, min: etaMinutes(km) };
  });
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || dests.length === 0) return fallback();
  try {
    // Google Routes API (Compute Route Matrix) — the legacy Distance Matrix API is
    // retired. Needs the Routes API enabled AND allowed on the key's API restrictions.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    let rows: any;
    try {
      const res = await fetch('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,condition',
        },
        body: JSON.stringify({
          origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
          destinations: dests.map((d) => ({ waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } } })),
          travelMode: 'DRIVE',
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`routes ${res.status}`);
      rows = await res.json();
    } finally {
      clearTimeout(timer);
    }
    // Start from Haversine, upgrade any pair the Routes API resolved.
    const out = dests.map((d) => {
      const km = Math.round(haversineKm(origin.lat, origin.lng, d.lat, d.lng) * 10) / 10;
      return { km, min: etaMinutes(km) };
    });
    for (const r of Array.isArray(rows) ? rows : []) {
      const i = r?.destinationIndex;
      if (typeof i === 'number' && r?.condition === 'ROUTE_EXISTS' && r.distanceMeters != null && r.duration) {
        const km = Math.round(Number(r.distanceMeters) / 100) / 10;
        const secs = parseInt(String(r.duration).replace('s', ''), 10);
        out[i] = { km, min: Math.max(1, Math.round((Number.isFinite(secs) ? secs : 0) / 60)) };
      }
    }
    return out;
  } catch (e) {
    logger.warn('Routes API failed, using Haversine', { error: e instanceof Error ? e.message : e });
    return fallback();
  }
}

// Set navUrl for every located item, and distance/ETA (real or estimated) when we
// know the user's origin. Works for both service options and product items.
async function assignTravel<T extends { lat: number | null; lng: number | null; navUrl?: string; distanceKm?: number; etaMinutes?: number }>(
  items: T[],
  origin?: { lat?: number; lng?: number },
): Promise<void> {
  const hasOrigin = origin?.lat != null && origin?.lng != null;
  for (const it of items) {
    if (it.lat != null && it.lng != null) {
      it.navUrl = directionsUrl(it.lat, it.lng, hasOrigin ? { lat: origin!.lat!, lng: origin!.lng! } : undefined);
    }
  }
  if (!hasOrigin) return;
  const located = items.filter((it) => it.lat != null && it.lng != null);
  const travel = await travelMatrix({ lat: origin!.lat!, lng: origin!.lng! }, located.map((it) => ({ lat: it.lat!, lng: it.lng! })));
  located.forEach((it, i) => { it.distanceKm = travel[i].km; it.etaMinutes = travel[i].min; });
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
  imageUrl: string | null;
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
    select: { id: true, name: true, salePrice: true, currency: true, stockQty: true, ownerId: true, imageUrl: true },
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
      imageUrl: p.imageUrl || null,
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
    out.push(item);
  }
  await assignTravel(out, ctx);
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
    return opt;
  });

  await assignTravel(options, ctx);
  // Sort by distance when we know where the user is.
  if (ctx.lat != null && ctx.lng != null) {
    options.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  }
  return { options };
}

// ── Tool: book an appointment for the current user ──────────────────────────
async function bookTool(args: { serviceId: string; startTime: string }, userId?: string): Promise<any> {
  if (!userId) return { error: 'not_signed_in' };
  try {
    const svc = await prisma.service.findUnique({ where: { id: args.serviceId }, select: { duration: true, name: true, isActive: true } });
    if (!svc || !svc.isActive) return { error: 'service_unavailable' };
    const when = new Date(args.startTime);
    if (isNaN(when.getTime()) || when <= new Date()) return { error: 'invalid_or_past_time' };
    const { BookingService } = await import('@/services/booking');
    const booking = await BookingService.createBooking({
      customerId: userId,
      serviceId: args.serviceId,
      scheduledAt: when,
      duration: svc.duration,
      loyaltyPointsUsed: 0,
    });
    return { success: true, bookingId: booking.id, status: booking.status, scheduledAt: when.toISOString(), serviceName: svc.name };
  } catch (e) {
    // Surface actionable failures (e.g. missing contact details, slot taken).
    return { error: e instanceof Error ? e.message : 'booking_failed' };
  }
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
        name: 'book_appointment',
        description: 'Book an appointment for the CURRENT signed-in user. Call this ONLY after the user has explicitly confirmed a specific service AND a specific start time (e.g. they said "yes, book it"). Returns the booking status.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            serviceId: { type: SchemaType.STRING, description: 'The service id from search_services' },
            startTime: { type: SchemaType.STRING, description: 'ISO 8601 start datetime, from get_availability' },
          },
          required: ['serviceId', 'startTime'],
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
  userId?: string;
}): Promise<{ reply: string; options: ConciergeOption[]; products: ConciergeProduct[] }> {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);
  const nowIso = new Date().toISOString();

  const systemInstruction = [
    'You are the MiyZapis Concierge — a warm, concise assistant for a Ukrainian booking marketplace.',
    'Use the tools to find REAL services and REAL availability. NEVER invent prices, times, availability, distances, or locations.',
    'For any service request, call search_services. IMPORTANT: search_services matches by SERVICE type/category (e.g. "haircut", "manicure", "massage"), NOT by business name — always query the service type, then pick the result matching the business the user named. Before you name a specific appointment time, call get_availability for that specialist, and when booking use one of the returned slots verbatim.',
    `The current time is ${nowIso}. The user's location is ${input.lat != null ? `${input.lat},${input.lng}` : 'unknown'}.`,
    'Reachability rule: only suggest an appointment time the user can realistically reach — the slot must be at least (now + travel ETA + 10 min buffer) in the future. Each option includes etaMinutes when the location is known.',
    'Always include, for each recommendation: the business name, the price with currency, the location/address, how far it is (distance + ETA if known), and remind them a navigation link + Book button are on the card.',
    'You CAN book on the user\'s behalf: once they pick a specific service and time, ASK them to confirm ("Shall I book <service> at <business> for <time>?"). Only after they clearly say yes, call book_appointment with that serviceId + startTime, then tell them the result (booked/pending confirmation) or the reason it failed (e.g. they need to add a phone number in settings). Never book without an explicit confirmation.',
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
  const toolCallLog: Array<{ name: string; args: unknown; ok: boolean }> = [];
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
        } else if (call.name === 'book_appointment') {
          out = await bookTool(call.args as any, input.userId);
        }
      } catch (e) {
        logger.warn('Concierge tool failed', { tool: call.name, error: e instanceof Error ? e.message : e });
        out = { error: 'tool_failed' };
      }
      toolCallLog.push({ name: call.name, args: call.args, ok: !(out && (out as { error?: unknown }).error) });
      responses.push({ functionResponse: { name: call.name, response: out as object } });
    }
    result = await chat.sendMessage(responses);
  }

  // De-dupe by id, keep the order the model saw.
  const seen = new Set<string>();
  const options = collectedOptions.filter((o) => (seen.has(o.serviceId) ? false : (seen.add(o.serviceId), true)));
  const seenP = new Set<string>();
  const products = collectedProducts.filter((p) => (seenP.has(p.productId) ? false : (seenP.add(p.productId), true)));

  const reply = result.response.text();

  // Persist the whole exchange (prompt, reply, tool calls, results) for review.
  try {
    const cap = (v: unknown) => JSON.stringify(v).slice(0, 12000);
    await prisma.conciergeLog.create({
      data: {
        userId: input.userId || null,
        message: input.message.slice(0, 4000),
        reply: reply.slice(0, 8000),
        toolCalls: cap(toolCallLog),
        options: cap(options),
        products: cap(products),
        lat: input.lat ?? null,
        lng: input.lng ?? null,
      },
    });
  } catch (e) {
    logger.warn('Concierge log write failed', { error: e instanceof Error ? e.message : e });
  }

  return { reply, options, products };
}
