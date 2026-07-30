// @ts-check
import { defineConfig } from 'astro/config';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  site: 'https://dariolanfranco.github.io',
  base: '/bajocero',
  output: 'static',
  build: {
    format: 'directory',
    rollupOptions: {
      output: {
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
  vite: {
    plugins: [
      viteCompression({ algorithm: 'brotliCompress', ext: '.br', threshold: 1024 }),
      viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 1024 }),
    ],
  },
});
