const CACHE = 'gp1st-v8';

const ASSETS = [
  '.', 'index.html',
  // cache-busted assets (match what index.html loads)
  'styles.css?v=8', 'app.js?v=8',
  // also keep the base names as a fallback
  'styles.css', 'app.js',
  'content.json',
  'assets/gp1.png',
  'assets/carousel/manifest.json',
  'assets/carousel/1.jpg','assets/carousel/2.jpg','assets/carousel/3.jpg',
  'assets/carousel/4.jpg','assets/carousel/5.jpg','assets/carousel/6.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(res => res || fetch(event.request))
    );
  }
});
