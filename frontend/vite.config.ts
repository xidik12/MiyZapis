import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Booking Platform',
        short_name: 'BookingApp',
        description: 'Professional service booking platform',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/miyzapis-backend-production\.up\.railway\.app\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 1 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/.*\.googleusercontent\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'google-images-cache'
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
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
        target: process.env.VITE_API_URL || 'https://miyzapis-backend-production.up.railway.app',
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
        assetFileNames: (assetInfo) => {
          // Keep logos and manifest files with original names
          const name = assetInfo.names?.[0] || '';
          if (name && (
            name.includes('logo') ||
            name.includes('favicon') ||
            name.includes('manifest')
          )) {
            return `[name].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        },
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // React core + use-sync-external-store must stay together
          // to avoid CJS-to-ESM interop issues (useSyncExternalStore undefined error)
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/') ||
            id.includes('/use-sync-external-store/')
          ) {
            return 'react-vendor';
          }

          // Redux state management
          if (
            id.includes('/@reduxjs/toolkit/') ||
            id.includes('/react-redux/') ||
            id.includes('/redux/') ||
            id.includes('/redux-persist/') ||
            id.includes('/reselect/') ||
            id.includes('/immer/')
          ) {
            return 'redux';
          }

          // Animation library (~140KB)
          if (id.includes('/framer-motion/')) {
            return 'animation';
          }

          // Router
          if (id.includes('/react-router-dom/') || id.includes('/react-router/')) {
            return 'router';
          }

          // Charts (~250KB)
          if (id.includes('/recharts/') || id.includes('/d3-')) {
            return 'charts';
          }

          // Date utilities
          if (id.includes('/date-fns/') || id.includes('/react-datepicker/')) {
            return 'date-utils';
          }
        },
      }
    },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})