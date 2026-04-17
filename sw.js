const CACHE_NAME = 'bp-tracker-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@unocss/runtime',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Scripts are handled with a different strategy to avoid stale code
const SCRIPTS = [
  './js/app.js',
  './js/api.js',
  './js/ui.js',
  './js/chartManager.js',
  './config.js'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...ASSETS, ...SCRIPTS]))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // For our local scripts, try network first, then cache
  if (SCRIPTS.some(s => url.pathname.endsWith(s.replace('./', '')))) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // For other assets, cache first
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
