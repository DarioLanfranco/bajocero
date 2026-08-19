import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET as robotsGET } from '../pages/robots.txt.ts';
import { GET as sitemapGET } from '../pages/sitemap.xml.ts';

const SITE = 'https://bajocero-omega.vercel.app';

beforeEach(() => {
  vi.stubEnv('BASE_URL', '/');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('robots.txt', () => {
  it('emits an absolute Sitemap URL per RFC 9309', async () => {
    const res = await robotsGET({} as never);
    const text = await res.text();

    expect(text).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  });
});

describe('sitemap.xml', () => {
  it('includes every indexable route with trailing slash', async () => {
    const res = await sitemapGET({} as never);
    const xml = await res.text();

    expect(xml).toContain(`<loc>${SITE}/</loc>`);
    expect(xml).toContain(`<loc>${SITE}/productos/</loc>`);
    expect(xml).toContain(`<loc>${SITE}/conocenos/</loc>`);
    expect(xml).toContain(`<loc>${SITE}/ideal/</loc>`);
    expect(xml).toContain(`<loc>${SITE}/info/</loc>`);
    expect(xml).toContain(`<loc>${SITE}/terminos/</loc>`);
    expect(xml).toContain(`<loc>${SITE}/privacidad/</loc>`);
  });

  it('does not emit double slashes or malformed locs', async () => {
    const res = await sitemapGET({} as never);
    const xml = await res.text();

    expect(xml).not.toContain('bajocero//');
    expect(xml).not.toContain('//ideal');
  });

  it('does not expose the 404 error page', async () => {
    const res = await sitemapGET({} as never);
    const xml = await res.text();

    expect(xml).not.toContain('404');
  });
});
