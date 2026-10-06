// Service worker de la Sábana (PWA offline). Cachea el "app shell" y deja pasar
// las peticiones a Supabase (otra origin / POST) hacia la red.
const CACHE = 'sabana-v56';
const ASSETS = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // POST (Supabase) -> red
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;       // Supabase u otros -> red
  // Cache-first con relleno en segundo plano
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match('./'))
    )
  );
});
