import type { APIRoute } from 'astro';

const PAGES = [
  { loc: '/', priority: '1.00', changefreq: 'weekly' },
  { loc: '/productos', priority: '0.80', changefreq: 'weekly' },
  { loc: '/info', priority: '0.50', changefreq: 'monthly' },
  { loc: '/terminos', priority: '0.30', changefreq: 'yearly' },
  { loc: '/privacidad', priority: '0.30', changefreq: 'yearly' },
];

export const GET: APIRoute = async () => {
  const urlset = PAGES.map(
    (page) => `
    <url>
      <loc>${page.loc}</loc>
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
