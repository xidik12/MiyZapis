const express = require('express');
const path = require('path');
const app = express();

// Security and CORS headers (matching vite preview config)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  next();
});

// Serve static files from the dist directory with caching
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, filePath) => {
    // Don't cache HTML files (they reference hashed assets)
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Handle React Router SPA fallback
// IMPORTANT: Only serve index.html for navigation requests, NOT for missing assets.
// If a stale service worker or cached HTML references old hashed filenames,
// returning index.html for .js/.css requests causes blank pages because the
// browser silently fails to parse HTML as JavaScript.
app.get('*', (req, res) => {
  // Return 404 for missing static asset requests (hashed filenames, fonts, images)
  if (req.path.startsWith('/assets/') || req.path.match(/\.(js|css|map|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/)) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Frontend server running on port ${port}`);
});
