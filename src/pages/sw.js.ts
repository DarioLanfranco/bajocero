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

  const sw = `const CACHE_NAME = 'bajocero-cache-v8';
const RUNTIME_CACHE = 'bajocero-runtime-v8';
const MAX_RUNTIME_ENTRIES = 50;

const PRECACHE_URLS = ${JSON.stringify(PRECACHE_URLS, null, 2)};

const ASSET_EXT_RE = /\\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff2?)$/;

function normalizeUrl(url) {
  const u = new URL(url);
  let path = u.pathname.replace(/\\/$/, '') || '/';
  return path;
}

async function precacheUrl(cache, url) {
  try {
    const res = await fetch(url);
    if (res.ok) await cache.put(url, res);
  } catch (e) {}
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => precacheUrl(cache, url))))
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

async function trimRuntimeCache() {
  const cache = await caches.open(RUNTIME_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME_ENTRIES) {
    const toDelete = keys.slice(0, keys.length - MAX_RUNTIME_ENTRIES);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

function isCacheable(response) {
  return Boolean(response && response.ok && response.status === 200 && response.type !== 'opaque');
}

function fallbackResponse() {
  return caches.match('${base}/404.html').then((r) => r || new Response('', { status: 408 }));
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (!isCacheable(response)) throw new Error('HTTP ' + response.status);
    const clone = response.clone();
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, clone);
    trimRuntimeCache();
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const normalized = normalizeUrl(request.url);
    const indexUrl = normalized + '/index.html';
    const indexCached = await caches.match(indexUrl);
    if (indexCached) return indexCached;
    return fallbackResponse();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (!isCacheable(response)) return response;
    const clone = response.clone();
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, clone);
    trimRuntimeCache();
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

async function staleWhileRevalidate(request) {
  let response;
  try {
    response = await fetch(request);
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const normalized = normalizeUrl(request.url);
    const indexCached = await caches.match(normalized + '/index.html');
    if (indexCached) return indexCached;
    return fallbackResponse();
  }

  if (!isCacheable(response)) return response;

  const clone = response.clone();
  caches
    .open(RUNTIME_CACHE)
    .then((cache) => {
      cache.put(request, clone);
      trimRuntimeCache();
    })
    .catch(() => {});
  return response;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (ASSET_EXT_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});`;

  return new Response(sw, {
    headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
  });
};