/**
 * @file sw.js
 * @description Service Worker para StockPulse CIPSA
 *              Cache estático + localStorage como persistencia de datos.
 *              Estrategias: cache-first (assets con hash), network-first (HTML).
 *              El API vive en otro origen: el SW no lo intercepta ni duplica
 *              sus requests (el polling lo orquesta app-root con probes ~1 KB).
 * @version 2.1.0
 */

const CACHE_NAME = 'stockpulse-v5';

const STATIC_ASSETS = [
  '/g360-stock-reporter/',
  '/g360-stock-reporter/index.html',
  '/g360-stock-reporter/exceljs.min.js',
  '/g360-stock-reporter/g360-signature.js',
  '/g360-stock-reporter/pwa-register.js',
  '/g360-stock-reporter/favicon.svg',
  '/g360-stock-reporter/favicon-32x32.png',
  '/g360-stock-reporter/favicon-16x16.png',
  '/g360-stock-reporter/apple-touch-icon.png',
  '/g360-stock-reporter/icon-192.png',
  '/g360-stock-reporter/icon-512.png',
  '/g360-stock-reporter/manifest.json',
];

// Instalación — precache estáticos (tolerante: un 404 no tumba el install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});

// Activación — limpiar caches antiguos (incluye v4 y data legacy) y controlar los clients de una vez
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — estrategia por tipo
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen (el API es cross-origin
  // y lo gestiona app-root: no duplicar sus requests aquí)
  if (url.origin !== self.location.origin) return;

  // Assets estáticos → cache-first
  if (url.pathname.startsWith('/g360-stock-reporter/assets/') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.js')) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // HTML → network-first
  event.respondWith(networkFirst(request, CACHE_NAME));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Mensajes del cliente (página) al SW
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});



