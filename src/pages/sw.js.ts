import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL;

  const PRECACHE_URLS = [
    `${base}/`,
    `${base}/productos/`,
    `${base}/conocenos/`,
    `${base}/info/`,
    `${base}/terminos/`,
    `${base}/privacidad/`,
    `${base}/404.html`,
    `${base}/manifest.json`,
    `${base}/icon-192.png`,
    `${base}/icon-512.png`,
  ];

  const sw = `const CACHE_NAME = 'bajocero-cache-v3';
const RUNTIME_CACHE = 'bajocero-runtime-v3';

const PRECACHE_URLS = ${JSON.stringify(PRECACHE_URLS, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request)),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, clone));
        return response;
      });
    }),
  );
});`;

  return new Response(sw, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
  });
};