// MiyZapis prerender service — renders the SPA with headless Chromium so that
// search crawlers and AI answer engines (which don't run JS) receive fully
// populated HTML. Caddy reverse-proxies bot user-agents here; everyone else is
// served the normal SPA. SSRF-guarded to the miyzapis.com origin only.

const express = require('express');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 3000;
const ALLOWED_HOSTS = new Set(['miyzapis.com', 'www.miyzapis.com']);
const ORIGIN = 'https://miyzapis.com';
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
          const root = document.getElementById('root');
          const txt = root && root.innerText ? root.innerText.trim() : '';
          // The loading shell is tiny ("Loading…"); a rendered page is large.
          return txt.length > 400;
        },
        { timeout: 9000, polling: 300 }
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
  let raw = req.query.url;
  if (!raw) {
    // path form: everything after the leading slash is the URL (may be encoded)
    raw = req.originalUrl.replace(/^\/+/, '');
    try { raw = decodeURIComponent(raw); } catch (_) {}
  }
  if (!raw || raw === 'favicon.ico') return res.status(400).send('missing url');

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
    const html = await render(url);
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
