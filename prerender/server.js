// MiyZapis prerender service — renders the SPA with headless Chromium so that
// search crawlers and AI answer engines (which don't run JS) receive fully
// populated HTML. Caddy reverse-proxies bot user-agents here; everyone else is
// served the normal SPA. SSRF-guarded to the miyzapis.com origin only.

const express = require('express');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 3000;
const ALLOWED_HOSTS = new Set(['miyzapis.com', 'www.miyzapis.com']);
const ORIGIN = 'https://miyzapis.com';
const API = process.env.API_URL || 'https://api.miyzapis.com/api/v1';

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function applyMeta(html, { title, description, image, canonical }) {
  // Remove ALL existing occurrences (incl. client-rendered react-helmet data-rh
  // duplicates) then insert exactly one — so crawlers can't pick a stale/wrong tag.
  const set = (re, rep) => {
    html = html.replace(re, '');
    html = html.replace('</head>', `${rep}\n</head>`);
  };
  if (title) {
    set(/<title>[^<]*<\/title>/gi, `<title>${esc(title)}</title>`);
    set(/<meta property="og:title"[^>]*>/gi, `<meta property="og:title" content="${esc(title)}">`);
    set(/<meta name="twitter:title"[^>]*>/gi, `<meta name="twitter:title" content="${esc(title)}">`);
  }
  if (description) {
    set(/<meta name="description"[^>]*>/gi, `<meta name="description" content="${esc(description)}">`);
    set(/<meta property="og:description"[^>]*>/gi, `<meta property="og:description" content="${esc(description)}">`);
    set(/<meta name="twitter:description"[^>]*>/gi, `<meta name="twitter:description" content="${esc(description)}">`);
  }
  if (image) {
    set(/<meta property="og:image"[^>]*>/gi, `<meta property="og:image" content="${esc(image)}">`);
    set(/<meta name="twitter:image"[^>]*>/gi, `<meta name="twitter:image" content="${esc(image)}">`);
    set(/<meta name="twitter:card"[^>]*>/gi, `<meta name="twitter:card" content="summary_large_image">`);
  }
  if (canonical) {
    set(/<link rel="canonical"[^>]*>/gi, `<link rel="canonical" href="${esc(canonical)}">`);
    set(/<meta property="og:url"[^>]*>/gi, `<meta property="og:url" content="${esc(canonical)}">`);
  }
  return html;
}

// For entity routes, fetch the entity and inject correct share meta server-side
// (guarantees the right card regardless of client-side render timing).
async function injectEntityMeta(pathname, html) {
  try {
    const svc = pathname.match(/^\/service\/([^/?#]+)/);
    if (svc) {
      const id = decodeURIComponent(svc[1]);
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${API}/services/${id}`, { signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) return html;
      const body = await res.json();
      const s = (body && body.data && body.data.service) || body.service || body.data || body;
      if (!s || !s.name) return html;
      const sp = s.specialist || {};
      const biz = sp.businessName || `${sp.user?.firstName || ''} ${sp.user?.lastName || ''}`.trim() || 'MiyZapis';
      const desc = String(s.description || `${s.name} — ${biz}`).replace(/\s+/g, ' ').trim().slice(0, 200);
      return applyMeta(html, {
        title: `${s.name} — ${biz} | MiyZapis`,
        description: desc,
        image: `${API}/services/${id}/og.png`,
        canonical: `${ORIGIN}/service/${id}`,
      });
    }

    const spec = pathname.match(/^\/specialist\/([^/?#]+)/);
    if (spec) {
      const id = decodeURIComponent(spec[1]);
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${API}/specialists/${id}/public`, { signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) return html;
      const body = await res.json();
      const s = (body && body.data && body.data.specialist) || body.specialist || body.data || body;
      if (!s) return html;
      const biz = s.businessName || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'MiyZapis';
      const desc = String(s.bio || `Book ${biz} on MiyZapis.`).replace(/\s+/g, ' ').trim().slice(0, 200);
      return applyMeta(html, {
        title: `${biz} — MiyZapis`,
        description: desc,
        image: `${API}/specialists/${id}/og.png`,
        canonical: `${ORIGIN}/specialist/${id}`,
      });
    }

    // Specialist by public slug (/s/:slug — used by Share / "Tell a Friend").
    const slugM = pathname.match(/^\/s\/([^/?#]+)/);
    if (slugM) {
      const slug = decodeURIComponent(slugM[1]);
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${API}/specialists/by-slug/${slug}`, { signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) return html;
      const body = await res.json();
      const s = (body && body.data && body.data.specialist) || body.specialist || body.data || body;
      if (!s || !s.id) return html;
      const biz = s.businessName || `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.trim() || 'MiyZapis';
      const desc = String(s.bio || `Book ${biz} on MiyZapis.`).replace(/\s+/g, ' ').trim().slice(0, 200);
      return applyMeta(html, {
        title: `${biz} — MiyZapis`,
        description: desc,
        image: `${API}/specialists/${s.id}/og.png`,
        canonical: `${ORIGIN}/s/${slug}`,
      });
    }

    const post = pathname.match(/^\/community\/post\/([^/?#]+)/);
    if (post) {
      const id = decodeURIComponent(post[1]);
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`${API}/community/posts/${id}`, { signal: ctrl.signal });
      clearTimeout(to);
      if (!res.ok) return html;
      const body = await res.json();
      const p = (body && body.data && body.data.post) || body.post || body.data || body;
      if (!p || !p.title) return html;
      const desc = String(p.content || p.title).replace(/\s+/g, ' ').trim().slice(0, 200);
      return applyMeta(html, {
        title: `${p.title} — MiyZapis`,
        description: desc,
        image: `${API}/community/posts/${id}/og.png`,
        canonical: `${ORIGIN}/community/post/${id}`,
      });
    }
  } catch (_) { /* fall through to unmodified html */ }
  return html;
}
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h
const CACHE_MAX = 1000;
const NAV_TIMEOUT = 15000;
// A normal desktop Chrome UA so our own render requests are NOT re-classified as
// a bot by Caddy (prevents a render→Caddy→render loop).
const RENDER_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const app = express();
const cache = new Map(); // url -> { html, ts }
let browser = null;
let launching = null;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  if (launching) return launching;
  launching = puppeteer
    .launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--disable-extensions',
      ],
    })
    .then((b) => {
      browser = b;
      launching = null;
      b.on('disconnected', () => {
        browser = null;
      });
      return b;
    })
    .catch((e) => {
      launching = null;
      throw e;
    });
  return launching;
}

function cacheGet(url) {
  const hit = cache.get(url);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }
  return hit.html;
}

function cacheSet(url, html) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(url, { html, ts: Date.now() });
}

// Keep JSON-LD; drop executable scripts + the SW registration so the snapshot is
// a clean static document (no double hydration, no JS needed by the consumer).
function cleanHtml(html) {
  return html
    .replace(/<script(?![^>]*application\/ld\+json)[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link[^>]+rel=["']?modulepreload["']?[^>]*>/gi, '');
}

async function render(targetUrl) {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setUserAgent(RENDER_UA);
    await page.setViewport({ width: 1280, height: 900 });
    // Skip heavy resources we don't need for an HTML snapshot — faster renders.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const t = req.resourceType();
      if (t === 'image' || t === 'media' || t === 'font') return req.abort();
      req.continue();
    });
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
    // Data-driven SPA pages (profiles, search) fetch AFTER first paint, so
    // networkidle2 can fire on the empty shell. Wait until the app has actually
    // rendered substantial content before snapshotting.
    await page
      .waitForFunction(
        () => {
          // Data-driven pages (service/specialist/post) set window.prerenderReady
          // = false on mount and true once their dynamic OG meta is applied — wait
          // for that so the snapshot includes the right tags. Pages that don't use
          // it fall back to a "substantial content" check.
          const w = /** @type {any} */ (window);
          if (w.prerenderReady === true) return true;
          if (w.prerenderReady === false) return false;
          const root = document.getElementById('root');
          const txt = root && root.innerText ? root.innerText.trim() : '';
          return txt.length > 400;
        },
        { timeout: 9000, polling: 250 }
      )
      .catch(() => {});
    // Small settle for late JSON-LD injection (react-helmet-async).
    await new Promise((r) => setTimeout(r, 900));
    const html = await page.content();
    return cleanHtml(html);
  } finally {
    await page.close().catch(() => {});
  }
}

app.get('/healthz', (_req, res) => res.json({ ok: true, cached: cache.size }));

// Prerender entrypoint. Accepts either /render?url=<full-url> or the
// prerender.io-style /<full-url> path. Only miyzapis.com is allowed.
app.get(/.*/, async (req, res) => {
  // Two call forms:
  //   ?url=<full-url>            (manual / explicit)
  //   the original request path  (Caddy reverse-proxies bots straight through,
  //                               so "/s/foo?x=1" → render https://miyzapis.com/s/foo?x=1)
  let raw = req.query.url;
  if (!raw) {
    raw = req.originalUrl.replace(/^\/+/, ''); // '' for the homepage
    try { raw = decodeURIComponent(raw); } catch (_) {}
  }
  if (raw === 'favicon.ico' || raw === 'healthz') return res.status(400).send('bad');

  let parsed;
  try {
    parsed = new URL(raw.startsWith('http') ? raw : `${ORIGIN}/${raw}`);
  } catch (_) {
    return res.status(400).send('bad url');
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) return res.status(403).send('host not allowed');
  parsed.protocol = 'https:';
  const url = parsed.toString();

  const cached = cacheGet(url);
  if (cached) {
    res.set('X-Prerender-Cache', 'HIT');
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(cached);
  }

  try {
    let html = await render(url);
    html = await injectEntityMeta(parsed.pathname, html);
    cacheSet(url, html);
    res.set('X-Prerender-Cache', 'MISS');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (e) {
    console.error('render failed', url, e && e.message);
    res.status(503).send('render failed');
  }
});

app.listen(PORT, () => console.log(`prerender listening on :${PORT}`));
