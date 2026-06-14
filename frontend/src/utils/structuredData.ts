// Builders for schema.org JSON-LD injected on public pages (specialist profile,
// business page). These make MiyZapis specialists + services machine-readable by
// Google rich results, AI assistants, and other crawlers.
//
// Design rule: only emit fields we actually have. Every optional field is omitted
// (not null) when missing, so the resulting object stays valid for validators.
//
// Reserve-with-Google note: the `potentialAction` ReserveAction on each Offer is
// the canonical hint a booking aggregator looks for. A *live* "Reserve with
// Google" integration additionally requires Google Actions Center onboarding +
// the /discovery/feed data feed (see backend). This JSON-LD is the on-page half.

const SITE_URL = 'https://miyzapis.com';

// Strip undefined / null / '' / empty-array / empty-object keys recursively so
// the emitted JSON-LD never carries dead fields.
export function prune<T>(obj: T): T {
  if (Array.isArray(obj)) {
    const arr = obj.map((v) => prune(v)).filter((v) => v !== undefined);
    return arr as unknown as T;
  }
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const pv = prune(v);
      if (pv === undefined || pv === null || pv === '') continue;
      if (Array.isArray(pv) && pv.length === 0) continue;
      if (typeof pv === 'object' && !Array.isArray(pv) && Object.keys(pv).length === 0) continue;
      out[k] = pv;
    }
    return out as T;
  }
  return obj;
}

const fullName = (user: any): string =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();

const locationParts = (s: any): string[] => {
  const parts: string[] = [];
  if (s?.city) parts.push(s.city);
  if (s?.state && s.state !== s.city) parts.push(s.state);
  if (s?.country && s.country !== s.city && s.country !== s.state) parts.push(s.country);
  return parts;
};

// Best-effort price range string from a list of services, e.g. "$20–$120".
function priceRange(services: any[]): string | undefined {
  const prices = services
    .map((svc) => Number(svc?.price ?? svc?.basePrice ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (prices.length === 0) return undefined;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? String(min) : `${min}–${max}`;
}

// Build a single service → schema.org Offer (wrapping a Service) with a
// ReserveAction pointing at the SPA booking URL.
function buildOffer(svc: any, providerName: string) {
  if (!svc?.id) return undefined;
  const price = Number(svc?.price ?? svc?.basePrice ?? 0);
  const bookingUrl = `${SITE_URL}/booking/${svc.id}`;
  return prune({
    '@type': 'Offer',
    name: svc.name,
    price: price > 0 ? price : undefined,
    priceCurrency: price > 0 ? svc.currency || 'UAH' : undefined,
    itemOffered: prune({
      '@type': 'Service',
      name: svc.name,
      description: svc.description,
      provider: providerName ? { '@type': 'Person', name: providerName } : undefined,
      // ISO-8601 duration, e.g. PT45M
      ...(svc.duration ? { serviceType: svc.name } : {}),
    }),
    potentialAction: prune({
      '@type': 'ReserveAction',
      target: prune({
        '@type': 'EntryPoint',
        urlTemplate: bookingUrl,
        inLanguage: 'uk',
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      }),
      result: { '@type': 'Reservation', name: `Booking: ${svc.name}` },
    }),
  });
}

export interface SpecialistLdInput {
  specialist: any;
  services: any[];
}

// HealthAndBeautyBusiness describing a single specialist + their bookable
// services. Falls back gracefully when fields are missing.
export function buildSpecialistJsonLd({ specialist: s, services }: SpecialistLdInput): object {
  if (!s) return {};
  const name = fullName(s.user) || s.businessName || 'Specialist';
  const slug = s.slug || s.id;
  const url = `${SITE_URL}/s/${slug}`;
  const image = s.user?.avatar || s.avatar || undefined;
  const description = s.bio || s.bioUk || s.bioRu || undefined;
  const area = locationParts(s);
  const offers = (services || []).map((svc) => buildOffer(svc, name)).filter(Boolean);

  const aggregateRating =
    Number(s.reviewCount) > 0 && Number(s.rating) > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: Number(s.rating),
          reviewCount: Number(s.reviewCount),
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return prune({
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name,
    url,
    image,
    description,
    priceRange: priceRange(services || []),
    address: s.city
      ? prune({
          '@type': 'PostalAddress',
          addressLocality: s.city,
          addressRegion: s.state,
          addressCountry: s.country,
        })
      : undefined,
    areaServed: area.length > 0 ? area.join(', ') : undefined,
    aggregateRating,
    makesOffer: offers.length > 0 ? offers : undefined,
    sameAs: socialSameAs(s),
  });
}

// Collect external social/profile URLs into schema.org `sameAs`.
function socialSameAs(s: any): string[] | undefined {
  let social: Record<string, string> = {};
  try {
    social = typeof s.socialMedia === 'string' ? JSON.parse(s.socialMedia) : s.socialMedia || {};
  } catch {
    social = {};
  }
  const urls = [social.instagram, social.facebook, social.linkedin, social.website]
    .filter(Boolean)
    .map((u: string) => (u.startsWith('http') ? u : `https://${u}`));
  return urls.length > 0 ? urls : undefined;
}

// BreadcrumbList — navigation trail for the page.
// items: ordered array of { name, url } pairs (Home first).
export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]): object {
  if (!items || items.length === 0) return {};
  return prune({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) =>
      prune({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: item.url,
      }),
    ),
  });
}

// ItemList — a collection of named links (categories, search results, etc.).
// items: array of { name, url, image? } — positions are 1-based.
export function buildItemListJsonLd(
  items: { name: string; url: string; image?: string }[],
): object {
  if (!items || items.length === 0) return {};
  return prune({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, idx) =>
      prune({
        '@type': 'ListItem',
        position: idx + 1,
        url: item.url,
        name: item.name,
        image: item.image,
      }),
    ),
  });
}

export interface BusinessLdInput {
  business: any;
}

// LocalBusiness describing a multi-specialist business: its specialists become
// `employee` / `department` entries and aggregated services become `makesOffer`.
export function buildBusinessJsonLd({ business: b }: BusinessLdInput): object {
  if (!b) return {};
  const url = `${SITE_URL}/biz/${b.slug}`;
  const members = (b.members ?? []).filter(
    (m: any) => m.role === 'OWNER' || m.role === 'SPECIALIST',
  );

  const employees = members
    .map((m: any) => {
      const u = m.user;
      const name = fullName(u);
      if (!name) return undefined;
      const spec = u?.specialist;
      const specUrl = spec?.slug ? `${SITE_URL}/s/${spec.slug}` : undefined;
      return prune({
        '@type': 'Person',
        name,
        image: u?.avatar,
        url: specUrl,
        jobTitle: spec?.businessName,
      });
    })
    .filter(Boolean);

  // Aggregate services across member specialists into makesOffer.
  const offers: any[] = [];
  for (const m of members) {
    const spec = m.user?.specialist;
    const provider = fullName(m.user);
    const svcs = spec?.services || [];
    for (const svc of svcs) {
      const offer = buildOffer(svc, provider);
      if (offer) offers.push(offer);
    }
  }

  return prune({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: b.name,
    url,
    image: b.logoUrl,
    description: b.description,
    telephone: b.phone,
    email: b.email,
    address: b.address ? { '@type': 'PostalAddress', streetAddress: b.address } : undefined,
    sameAs: b.websiteUrl ? [b.websiteUrl] : undefined,
    employee: employees.length > 0 ? employees : undefined,
    department: employees.length > 0 ? employees : undefined,
    makesOffer: offers.length > 0 ? offers : undefined,
  });
}
