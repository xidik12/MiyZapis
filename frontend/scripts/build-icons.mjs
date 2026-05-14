#!/usr/bin/env node
// Build-time icon pipeline. Takes the canonical SVG mark from src/assets/images/logo.svg
// and produces every raster size we ship: PWA icons, apple-touch, email logo, OG image.
//
// Re-run with `npm run build:icons` after redesigning the logo. Outputs go to public/.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp is not installed. Run: npm i -D sharp');
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src/assets/images/logo.svg');
const OUT = resolve(ROOT, 'public');

const TARGETS = [
  { name: 'favicon.png', size: 64, density: 384 },
  { name: 'apple-touch-icon.png', size: 180, density: 384 },
  { name: 'pwa-192x192.png', size: 192, density: 384 },
  { name: 'pwa-512x512.png', size: 512, density: 384 },
  { name: 'miyzapis_logo.png', size: 512, density: 384 },
  { name: 'email-logo.png', size: 240, density: 384 },
  { name: 'og-image.png', size: 1200, density: 384, background: '#f4f7fb' },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const svg = await readFile(SRC);
  for (const t of TARGETS) {
    const pipeline = sharp(svg, { density: t.density }).resize(t.size, t.size, {
      fit: 'contain',
      background: t.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    });
    const buf = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    await writeFile(resolve(OUT, t.name), buf);
    console.log(`  ✓ ${t.name.padEnd(24)} ${(buf.length / 1024).toFixed(1).padStart(7)} KB  (${t.size}×${t.size})`);
  }
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
