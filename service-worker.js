const CACHE_NAME = 'hausanschluss-cache-v21';
const TILE_CACHE_NAME = 'hausanschluss-tiles-v1';
const ASSETS = [
  './', './index.html', './app.js', './manifest.json', './icon.svg',
  './assets/logo-trinkwasser.png', './assets/logo-lindenfels.jpg', './assets/logo-lautertal.png',
  './assets/artikel.json',
  './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png',
  './assets/leaflet/leaflet.css', './assets/leaflet/leaflet.js',
  './assets/leaflet/images/marker-icon.png', './assets/leaflet/images/marker-icon-2x.png',
  './assets/leaflet/images/marker-shadow.png', './assets/leaflet/images/layers.png',
  './assets/leaflet/images/layers-2x.png'
];
// Kartenkacheln von OpenStreetMap werden separat (in einem eigenen, unbegrenzt
// wachsenden Cache) zwischengespeichert, damit bereits angesehene Kartenausschnitte
// auch ohne Netz/Empfang vor Ort wieder angezeigt werden können.
function isMapTile(url) {
  return /^https:\/\/[abc]\.tile\.openstreetmap\.org\//.test(url);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== TILE_CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const sameOrigin = url.startsWith(self.location.origin);
  const tile = isMapTile(url);
  if (!sameOrigin && !tile) return; // fremde Requests unangetastet lassen

  const cacheName = tile ? TILE_CACHE_NAME : CACHE_NAME;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((resp) => {
        const respClone = resp.clone();
        caches.open(cacheName).then((cache) => cache.put(event.request, respClone));
        return resp;
      }).catch(() => cached);
    })
  );
});
