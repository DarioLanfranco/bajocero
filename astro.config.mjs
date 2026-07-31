// @ts-check
import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';
import viteCompression from 'vite-plugin-compression';

const BASE = '/bajocero';

export default defineConfig({
  site: 'https://dariolanfranco.github.io',
  base: BASE,
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      experimental: {
        directoryAndTrailingSlashHandler: true,
      },
      includeAssets: ['favicon.ico', 'favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: `${BASE}/`,
        name: 'Bajo cero e-commerce',
        short_name: 'Bajo Cero',
        description:
          'Descubrí una experiencia gastronómica única con platos supercongelados IQF listos para disfrutar en minutos. Rápido, conveniente y delicioso.',
        start_url: `${BASE}/`,
        scope: `${BASE}/`,
        lang: 'es',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#121212',
        icons: [
          { src: `${BASE}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: `${BASE}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        screenshots: [
          { src: `${BASE}/assets/images/og-image.png`, sizes: '1200x630', type: 'image/png', form_factor: 'narrow' },
          { src: `${BASE}/assets/images/og-image.png`, sizes: '1200x630', type: 'image/png', form_factor: 'wide' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: `${BASE}/`,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'bajocero-navigation' },
          },
          {
            urlPattern: /^https:\/\/docs\.google\.com\/spreadsheets\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bajocero-catalog-data',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 10, maxAgeSeconds: 30 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/ik\.imagekit\.io\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'bajocero-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  vite: {
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          /** @param {string} id */
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('jspdf') || id.includes('html2canvas')) return 'pdf';
              return 'vendor';
            }
            if (id.includes('src/store/cart') || id.includes('src/scripts/cart')) return 'cart';
            if (id.includes('src/scripts/catalog')) return 'catalog';
          },
        },
      },
    },
    plugins: [
      viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
      viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    ],
  },
});
