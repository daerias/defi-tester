import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'aed.png', 'connector.png'],
      manifest: {
        name: 'STK Defi Tester',
        short_name: 'Defi Tester',
        description: 'Defibrillator-Schockenergie Toleranzprüfung',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
        globIgnores: ['**/test defi v2/**'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(pdf|png|jpg|webp).*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-resources',
              expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ],
})
