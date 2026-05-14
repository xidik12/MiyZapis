const express = require('express');
const path = require('path');
const app = express();

const DIST = path.join(__dirname, 'dist');

// Security headers on every response.
app.use((_req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=(), payment=(self)');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// Static files. Vite-hashed assets are safe to cache forever; HTML, manifest,
// and service worker must always be revalidated.
app.use(express.static(DIST, {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    if (
      filePath.endsWith('.html') ||
      filePath.endsWith('/manifest.json') ||
      filePath.endsWith('/manifest.webmanifest') ||
      filePath.endsWith('/sw.js') ||
      filePath.endsWith('/registerSW.js')
    ) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  },
}));

// SPA fallback. Real 404 for missing static assets — never serve index.html for
// JS/CSS/images/fonts, otherwise the browser tries to parse HTML as the wrong
// content type and the page silently fails.
const ASSET_EXT = /\.(js|mjs|css|map|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?|ttf|eot|json|xml|txt|wasm)$/i;

app.get('*', (req, res) => {
  if (req.path.startsWith('/assets/') || ASSET_EXT.test(req.path)) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(DIST, 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${port}`);
});
