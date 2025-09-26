const CACHE = 'gp1st-v7';
const ASSETS = [
  '.', 'index.html', 'styles.css', 'app.js', 'content.json', 'assets/gp1.png',
  'assets/carousel/manifest.json',
  'assets/carousel/1.jpg','assets/carousel/2.jpg','assets/carousel/3.jpg',
  'assets/carousel/4.jpg','assets/carousel/5.jpg','assets/carousel/6.jpg'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k!==CACHE).map(k => caches.delete(k)))));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if(url.origin === location.origin){
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});