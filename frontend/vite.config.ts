import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
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
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
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
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    global: 'globalThis'
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
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
        manualChunks: (id) => {
          // Keep React and React-DOM together in one chunk for proper initialization
          if (id.includes('node_modules')) {
            // Core React bundle - must load first
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // React ecosystem that depends on React
            if (id.includes('react-router') || id.includes('react-redux') || id.includes('@reduxjs')) {
              return 'vendor-react-eco';
            }
            // Redux without React dependencies
            if (id.includes('redux') && !id.includes('react')) {
              return 'vendor-state';
            }
            // UI libraries
            if (id.includes('framer-motion') || id.includes('@heroicons') || id.includes('lucide')) {
              return 'vendor-ui';
            }
            // Network libraries
            if (id.includes('axios') || id.includes('socket.io')) {
              return 'vendor-network';
            }
            // Date/time libraries
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // Payment libraries
            if (id.includes('@stripe')) {
              return 'vendor-stripe';
            }
            // Everything else
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})