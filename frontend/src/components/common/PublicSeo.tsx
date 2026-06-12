// PublicSeo — sets a dynamic <title>, OpenGraph/Twitter meta and (optionally) a
// JSON-LD <script> for public, shareable pages (specialist profile, business
// page, embed). Built on react-helmet-async (already wrapped by HelmetProvider
// in main.tsx), which manages insertion + cleanup on unmount automatically.
//
// SPA LIMITATION: these tags are written client-side after JS runs. Crawlers
// that do NOT execute JS (some basic bots) won't see them. However most social
// scrapers (Telegram, Facebook, Twitter/X) and AI assistants either run JS or
// honour late-injected meta, so link unfurls + AI ingestion work in practice.
// True SSR/prerender would close the gap but is out of scope here.

import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface PublicSeoProps {
  title: string;
  description?: string;
  image?: string;
  url: string;
  /** og:type — 'profile' for people, 'website'/'business.business' otherwise. */
  type?: string;
  /** schema.org JSON-LD object; emitted as <script type="application/ld+json">. */
  jsonLd?: object | null;
}

const DEFAULT_IMAGE = 'https://miyzapis.com/og-image.png';

const PublicSeo: React.FC<PublicSeoProps> = ({
  title,
  description,
  image,
  url,
  type = 'website',
  jsonLd,
}) => {
  const img = image || DEFAULT_IMAGE;
  const hasLd = jsonLd && Object.keys(jsonLd).length > 0;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />

      {/* OpenGraph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={img} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="МійЗапис" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={img} />

      {hasLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default PublicSeo;
