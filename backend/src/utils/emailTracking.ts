/**
 * Email open/click tracking utilities.
 *
 * injectTracking(html, opts) rewrites an HTML email body to:
 *  - Replace every http(s) anchor href with a click-tracking redirect URL
 *  - Append a 1×1 transparent GIF tracking pixel before </body> (or at end)
 *
 * All tracking URLs are absolute (required for email clients).
 */

export interface TrackingOptions {
  campaignId: string;
  customerId: string;
  /** Absolute base API URL, e.g. https://api.miyzapis.com/api/v1 */
  baseApiUrl: string;
}

/**
 * Returns true for URLs that should be rewritten (http/https only).
 * Leaves mailto:, tel:, #anchors, and relative paths untouched.
 */
function isTrackableUrl(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

export function injectTracking(html: string, opts: TrackingOptions): string {
  const { campaignId, customerId, baseApiUrl } = opts;

  // 1. Rewrite <a href="http(s)://..."> links to click-tracking endpoint.
  //    Matches both single- and double-quoted href attributes.
  const withLinks = html.replace(
    /(<a\s[^>]*href\s*=\s*)(['"])(https?:\/\/[^'"]*)\2/gi,
    (_match, prefix, quote, originalUrl) => {
      if (!isTrackableUrl(originalUrl)) return _match;
      const redirectUrl = `${baseApiUrl}/track/c/${campaignId}/click?u=${encodeURIComponent(customerId)}&r=${encodeURIComponent(originalUrl)}`;
      return `${prefix}${quote}${redirectUrl}${quote}`;
    },
  );

  // 2. Build tracking pixel img tag.
  const pixelUrl = `${baseApiUrl}/track/c/${campaignId}/open.gif?u=${encodeURIComponent(customerId)}`;
  const pixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;outline:none;text-decoration:none;" />`;

  // 3. Inject pixel before </body> if present, otherwise append.
  if (/<\/body>/i.test(withLinks)) {
    return withLinks.replace(/<\/body>/i, `${pixel}</body>`);
  }
  return withLinks + pixel;
}
