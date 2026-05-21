// Hashtag detection + rendering utilities for community posts.
//
// We let users discover-by-topic by parsing #tags from post content (no
// schema change needed — tags live inline in `content`). When the feed
// is rendered we extract the tags, deduplicate, and show them as
// clickable chips above the card.

const HASHTAG_RE = /(^|\s)#([\p{L}\p{N}_-]{2,32})\b/giu;

export interface ParsedHashtag {
  /** Lowercase canonical form, no `#`. Used for filtering. */
  slug: string;
  /** Display form preserving the user's casing. */
  display: string;
}

/**
 * Extract unique hashtags from a body of text. Returns them in
 * first-appearance order. Tags must be 2-32 chars of letters/digits/_/-.
 */
export function extractHashtags(text: string | null | undefined): ParsedHashtag[] {
  if (!text || typeof text !== 'string') return [];
  const seen = new Set<string>();
  const tags: ParsedHashtag[] = [];
  for (const m of text.matchAll(HASHTAG_RE)) {
    const raw = m[2];
    const slug = raw.toLowerCase();
    if (seen.has(slug)) continue;
    seen.add(slug);
    tags.push({ slug, display: raw });
  }
  return tags;
}

/**
 * Return the top N most-used tags across a list of posts, ranked by
 * usage count. Useful for a "trending tags" chip rail at the top of
 * the feed.
 */
export function topHashtags(
  posts: Array<{ title?: string; content?: string }>,
  limit: number = 12,
): Array<ParsedHashtag & { count: number }> {
  const counter = new Map<string, { slug: string; display: string; count: number }>();
  for (const p of posts) {
    const blob = `${p.title || ''} ${p.content || ''}`;
    for (const tag of extractHashtags(blob)) {
      const row = counter.get(tag.slug);
      if (row) row.count += 1;
      else counter.set(tag.slug, { ...tag, count: 1 });
    }
  }
  return Array.from(counter.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Build a search query that matches a hashtag — the community feed
 * already searches by substring, so `#tag` works directly.
 */
export function hashtagToSearchQuery(slug: string): string {
  return `#${slug}`;
}
