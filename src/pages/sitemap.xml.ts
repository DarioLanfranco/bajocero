import type { APIRoute } from 'astro';

const SITE_URL = 'https://bajocero.com.ar';

const PAGES = [
  { loc: '/', priority: '1.00', changefreq: 'weekly', lastmod: '2026-06-11' },
  { loc: '/productos', priority: '0.80', changefreq: 'weekly', lastmod: '2026-06-11' },
  { loc: '/info', priority: '0.50', changefreq: 'monthly', lastmod: '2026-06-11' },
  { loc: '/terminos', priority: '0.30', changefreq: 'yearly', lastmod: '2026-05-01' },
  { loc: '/privacidad', priority: '0.30', changefreq: 'yearly', lastmod: '2026-05-01' },
];

export const GET: APIRoute = async () => {
  const urlset = PAGES.map(
    (page) => `
    <url>
      <loc>${SITE_URL}${page.loc}</loc>
      <lastmod>${page.lastmod}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
