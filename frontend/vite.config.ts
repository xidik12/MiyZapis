import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// Optional bundle size analyser. Adds `dist/stats.html` when ANALYZE=true.
// Falls back to a no-op if the package isn't installed yet.
function tryVisualizer() {
  if (!process.env.ANALYZE) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { visualizer } = require('rollup-plugin-visualizer');
    return visualizer({ filename: 'dist/stats.html', template: 'treemap', gzipSize: true, brotliSize: true });
  } catch {
    console.warn('[vite] rollup-plugin-visualizer not installed — `npm i -D rollup-plugin-visualizer` to enable');
    return null;
  }
}

export default defineConfig({
  plugins: [
    svgr(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'miyzapis_logo.png'],
      manifest: {
        name: 'МійЗапис — Booking Platform',
        short_name: 'МійЗапис',
        description: 'Book specialists, manage appointments, and grow your business.',
        theme_color: '#3b97f2',
        background_color: '#f4f7fb',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'maskable' },
          { src: '/miyzapis_logo.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Current API host. The old Railway URL was cached here for months
            // after the migration to Hostinger/Coolify — invalidate by deploy.
            urlPattern: /^https:\/\/api\.miyzapis\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 10,
            }
          },
          {
            urlPattern: /^https:\/\/.*\.googleusercontent\.com\/.*/i,
            handler: 'NetworkOnly',
            options: { cacheName: 'google-images-cache' }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    }),
    tryVisualizer(),
  ].filter(Boolean) as any,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['localhost', 'miyzapis.com', '.miyzapis.com'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://api.miyzapis.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: ['localhost', 'miyzapis.com', '.miyzapis.com'],
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        // Hand-tuned manual chunks so large libraries land in their own files.
        // Lets the browser cache the heavy bits across deploys when only app
        // code changes, and reveals offenders in the bundle visualiser.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['react-redux', '@reduxjs/toolkit', 'redux-persist'],
          'stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          'i18n': ['react-i18next', 'i18next'],
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] || '';
          if (name && (name.includes('logo') || name.includes('favicon') || name.includes('manifest'))) {
            return `[name].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        },
      }
    },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
