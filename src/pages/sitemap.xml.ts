import type { APIRoute } from 'astro';

export const get: APIRoute = async () => {
  return {
    body: '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
  };
};
