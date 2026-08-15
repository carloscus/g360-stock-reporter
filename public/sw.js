/**
 * @file sw.js
 * @description Service Worker para StockPulse CIPSA
 *              Cache estático + localStorage como persistencia de datos.
 *              Estrategias: cache-first (assets), network-first (API),
 *              localStorage-sync para datos de stock.
 * @version 2.0.0
 */

const CACHE_NAME = 'stockpulse-v4';
const DATA_CACHE = 'stockpulse-data-v4';
const STOCK_READ_API_KEY = 'cipsa2026';

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

// Instalación — precache estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación — limpiar caches antiguos y controlar los clients de una vez
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — estrategia por tipo
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo interceptar requests del mismo origen
  if (url.origin !== self.location.origin) return;

  // API del stock → network-first con localStorage sync
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirst(request, CACHE_NAME));
    syncToLocalStorage(request.url);
    return;
  }

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

// Sincroniza la respuesta de la API a localStorage del SW
async function syncToLocalStorage(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const client = await self.clients.get(self.windowClient?.id);
      if (client) {
        client.postMessage({ type: 'STOCK_SYNC', data });
      }
    }
  } catch { /* noop */ }
}

// Mensajes del cliente (página) al SW
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Notificación de nueva versión
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stock') {
    event.waitUntil(
      fetch('https://g360-stock-api.onrender.com/api/v1/stock', {
        headers: { 'X-API-Key': STOCK_READ_API_KEY },
      })
        .then((res) => res.json())
        .then((data) => {
          const cache = caches.open(DATA_CACHE);
          // Se sincroniza vía message al cliente
        })
        .catch(() => {})
    );
  }
});


