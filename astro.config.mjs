// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://dariolanfranco.github.io',
  base: '/bajocero',
  output: 'static',
  build: {
    format: 'directory',
  },
});
