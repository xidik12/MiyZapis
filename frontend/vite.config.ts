import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const enableCrossOriginHeaders = process.env.VITE_ENABLE_CROSS_ORIGIN_HEADERS === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-192.png', 'favicon-512.png', 'logo.svg', 'logo.png', 'favicon.ico'],
      manifest: {
        name: 'Panhaha – Connect & Book',
        short_name: 'Panhaha',
        description: 'Panhaha – Cambodian professional service booking platform',
        theme_color: '#1E40AF',
        background_color: '#DC2626',
        display: 'standalone',
        icons: [
          {
            src: 'favicon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.bookingplatform\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 1 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
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
        target: process.env.VITE_API_URL || 'https://huddle-backend-production.up.railway.app',
        changeOrigin: true,
        secure: true
      }
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'miyzapis-frontend.up.railway.app',
      'miyzapis.com',
      'www.miyzapis.com',
      'localhost',
      '127.0.0.1',
      '0.0.0.0'
    ],
    headers: enableCrossOriginHeaders
      ? {
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Cross-Origin-Embedder-Policy': 'credentialless'
        }
      : {}
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: (assetInfo) => {
          // Keep logos and manifest files with original names
          if (assetInfo.name && (
            assetInfo.name.includes('logo') || 
            assetInfo.name.includes('favicon') ||
            assetInfo.name.includes('manifest')
          )) {
            return `[name].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        },
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          state: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          ui: ['framer-motion', 'lucide-react'],
          stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js']
        }
      }
    }
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
