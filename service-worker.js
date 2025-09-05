/* Simple service worker for PrankPay PWA
   Caches core assets on install and serves from cache when possible.
*/

const CACHE_NAME = 'prankpay-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/sounds/payment.mp3',
  './assets/images/nfcpay.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  // Ensure the new worker installs and tells the old to skip waiting when ready
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve();
        })
      ))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => client.postMessage({ type: 'SW_ACTIVATED' }));
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestURL = new URL(event.request.url);
  // Only handle same-origin requests
  if (requestURL.origin !== location.origin) return;

  // For navigation requests, serve index.html from cache fallback to network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then((cached) => {
        return cached || fetch(event.request).then((networkResp) => {
          // Cache a copy of index.html for future navigations
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', networkResp.clone()));
          return networkResp;
        }).catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  // For other requests, try cache first, then network, and cache successful responses
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResp) => {
        if (!networkResp || networkResp.status !== 200) return networkResp;
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResp.clone()));
        return networkResp;
      }).catch(() => {
        // Optionally return a fallback image for images
        if (event.request.destination === 'image') return caches.match('./assets/images/nfcpay.png');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
