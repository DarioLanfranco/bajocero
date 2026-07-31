import { describe, it, expect } from 'vitest';
import { GET } from '../pages/sw.js.ts';

describe('Service Worker generation', () => {
  it('responds with a JavaScript payload', async () => {
    const res = await GET({} as never);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/javascript');
  });

  it('registers install, activate and fetch lifecycle handlers', async () => {
    const res = await GET({} as never);
    const sw = await res.text();

    expect(sw).toContain("self.addEventListener('install'");
    expect(sw).toContain("self.addEventListener('activate'");
    expect(sw).toContain("self.addEventListener('fetch'");
  });

  it('implements network-first, cache-first and stale-while-revalidate strategies', async () => {
    const res = await GET({} as never);
    const sw = await res.text();

    expect(sw).toContain('networkFirst');
    expect(sw).toContain('cacheFirst');
    expect(sw).toContain('staleWhileRevalidate');
    expect(sw).toContain('CACHE_NAME');
    expect(sw).toContain('RUNTIME_CACHE');
  });

  it('precaches navigational pages and PWA assets', async () => {
    const res = await GET({} as never);
    const sw = await res.text();

    expect(sw).toContain('manifest.json');
    expect(sw).toContain('icon-192.png');
    expect(sw).toContain('icon-512.png');
    expect(sw).toContain('404.html');
    expect(sw).toContain('productos');
  });
});
