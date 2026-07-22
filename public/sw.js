/*
 * Wata service worker — makes the app installable and launchable offline.
 * Data is already offline-first (IndexedDB); this caches the app *shell*
 * (HTML/JS/CSS) so a cold start with no signal still opens the app.
 *
 * Only same-origin GETs are touched — Supabase auth/data requests pass
 * straight through so they never get a stale cached response.
 */
const VERSION = 'wata-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Offline and never-visited: fall back to a shell we likely have.
    return (
      (await cache.match('/today')) || (await cache.match('/')) || Response.error()
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // leave Supabase etc. alone

  // Hashed, immutable build assets and our icons: cache-first.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Page navigations: fresh when online, cached when not.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, PAGE_CACHE));
  }
});
