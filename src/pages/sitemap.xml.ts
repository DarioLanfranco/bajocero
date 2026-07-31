import type { APIRoute } from 'astro';
import { canonicalizePath } from '../utils/seo';
import { withBase } from '../utils/format';

const LAST_MOD = new Date().toISOString().split('T')[0];

const PAGES = [
  { loc: '/', priority: '1.00', changefreq: 'weekly' },
  { loc: '/productos', priority: '0.80', changefreq: 'weekly' },
  { loc: '/conocenos', priority: '0.70', changefreq: 'monthly' },
  { loc: '/ideal', priority: '0.80', changefreq: 'weekly' },
  { loc: '/info', priority: '0.50', changefreq: 'monthly' },
  { loc: '/terminos', priority: '0.30', changefreq: 'yearly' },
  { loc: '/privacidad', priority: '0.30', changefreq: 'yearly' },
];

export const GET: APIRoute = async () => {
  const urlset = PAGES.map(
    (page) =>
      `\n    <url>\n      <loc>${canonicalizePath(withBase(page.loc))}</loc>\n      <lastmod>${LAST_MOD}</lastmod>\n      <changefreq>${page.changefreq}</changefreq>\n      <priority>${page.priority}</priority>\n    </url>`,
  ).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
