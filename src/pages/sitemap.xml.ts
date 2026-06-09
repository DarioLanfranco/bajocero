import type { APIRoute } from 'astro';

const PAGES = [
  { loc: '/', priority: '1.00' },
  { loc: '/terminos', priority: '0.30' },
  { loc: '/privacidad', priority: '0.30' },
];

export const GET: APIRoute = async () => {
  const urlset = PAGES.map(
    (page) => `
    <url>
      <loc>${page.loc}</loc>
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
