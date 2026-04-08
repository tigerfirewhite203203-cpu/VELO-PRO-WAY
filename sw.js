const CACHE_NAME = 'veloway-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/i18n.js',
    '/js/map-module.js',
    '/js/routing-module.js',
    '/js/navigation-module.js',
    '/js/social-module.js',
    '/js/app.js',
    '/js/sw-register.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Network first for API calls, cache first for assets
    if (e.request.url.includes('nominatim') ||
        e.request.url.includes('osrm') ||
        e.request.url.includes('opentopodata') ||
        e.request.url.includes('tile')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
    } else {
        e.respondWith(
            caches.match(e.request).then(cached => cached || fetch(e.request))
        );
    }
});
