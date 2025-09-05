/* Simple service worker for PrankPay PWA
   Caches core assets on install and serves from cache when possible.
*/

// Generate a dynamic cache name so each new service worker installation
// gets its own cache (automatic version-busting). This ensures CSS/JS
// changes are fetched fresh when a new SW is deployed.
let CACHE_NAME = 'prankpay-' + Date.now();
const ASSETS = [
  './',
  './index.html',
  './offline.html',
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

// Listen for messages from the page (e.g., skip waiting)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message; calling skipWaiting()');
    self.skipWaiting();
  }
});

// Debug helper: list caches on demand
function logCurrentCaches() {
  caches.keys().then(keys => console.log('[SW] Current caches:', keys));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const requestURL = new URL(event.request.url);
  // Only handle same-origin requests
  if (requestURL.origin !== location.origin) return;

  // For navigation requests, serve index.html from cache fallback to network
  if (event.request.mode === 'navigate') {
    // Network-first for navigation: try network, fallback to cached index.html or offline.html
    event.respondWith(
      fetch(event.request).then((networkResp) => {
        // Cache a copy of index.html if we fetched successfully
        if (networkResp && networkResp.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', networkResp.clone()));
        }
        return networkResp;
      }).catch(() => {
        return caches.match('./index.html').then((cached) => cached || caches.match('./offline.html'));
      })
    );
    return;
  }

  // For other requests: stale-while-revalidate — serve cache if available, fetch network and update cache
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request).then((networkResp) => {
        if (networkResp && networkResp.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResp.clone()));
        }
        return networkResp;
      }).catch(() => null);

      // Return cached response if present, otherwise wait for network; if both fail, provide fallbacks
      return cached || networkFetch.then(resp => resp).catch(() => {
        if (event.request.destination === 'image') return caches.match('./assets/images/nfcpay.png');
        return caches.match('./offline.html') || new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
