// BELT.Hz Service Worker v1.3.0
const CACHE = 'belt-hz-v1.3.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const accept = req.headers.get('accept') || '';
  const isDoc = req.mode === 'navigate' || accept.includes('text/html');

  // index.html / Navigationen: NETWORK-FIRST — Updates sofort sichtbar,
  // Cache nur als Offline-Fallback.
  if (isDoc) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then(c => c || caches.match('./')))
    );
    return;
  }

  // Übrige Assets (Icons, Manifest, ...): CACHE-FIRST, Netz als Nachlader.
  e.respondWith(
    caches.match(req)
      .then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (!res || !res.ok || res.type === 'opaque') return res;
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
          return res;
        });
      })
      .catch(() => caches.match('./index.html'))
  );
});
