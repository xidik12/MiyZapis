// Shared types for programmatic SEO content (service landing pages, city pages,
// and answer-style guides/blog). All user-facing strings are localized for the
// platform's three languages so landing pages render natively for each visitor.

export interface Localized {
  uk: string;
  ru: string;
  en: string;
}

export interface LocalizedFaq {
  q: Localized;
  a: Localized;
}

// A bookable service category we want a dedicated SEO landing page for.
// URL: /services/<slug>   (and /services/<slug>/<citySlug> for the city variant)
export interface SeoService {
  slug: string;            // kebab-case, e.g. "manikiur" or "manicure"
  query: string;           // search term used to fetch matching specialists
  emoji: string;           // lightweight glyph for hero/cards
  name: Localized;         // "Манікюр"
  tagline: Localized;      // one-line subtitle under the H1
  intro: Localized;        // 1–2 paragraph plain-text intro (no HTML)
  whatToExpect: Localized; // short paragraph: what the service involves / what to look for
  priceHint: Localized;    // typical price guidance in UAH (plain text)
  faqs: LocalizedFaq[];    // 4–6 Q&A for the FAQ section + FAQPage JSON-LD
  related: string[];       // related service slugs (internal linking)
}

// A city we surface in city×service landing pages.
export interface SeoCity {
  slug: string;            // kebab-case latin, e.g. "kyiv"
  name: Localized;         // "Київ"
  locative: Localized;     // "у Києві" — composes "Манікюр <locative>"
  region: Localized;       // "Київська область"
}

// An answer-style guide/blog article (AEO/GEO content).
// URL: /blog/<slug>
export interface BlogArticle {
  slug: string;
  title: Localized;
  excerpt: Localized;      // 1–2 sentence summary (meta description + card)
  body: Localized;         // Markdown body
  faqs?: LocalizedFaq[];   // optional FAQ block → FAQPage JSON-LD
  category: Localized;     // e.g. "Поради клієнтам"
  emoji: string;
  publishedAt: string;     // ISO date, e.g. "2026-06-15"
  readingMinutes: number;
}

export type Lang = 'uk' | 'ru' | 'en';

// Helper: pick the active language with a uk→en fallback chain.
export const pick = (l: Localized | undefined, lang: Lang): string => {
  if (!l) return '';
  return l[lang] || l.uk || l.en || '';
};
