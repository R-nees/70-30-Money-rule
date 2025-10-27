const CACHE_NAME = "7030-static-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "https://cdn.jsdelivr.net/npm/chart.js",
  "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js",
  "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener("activate", (ev) => {
  ev.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))));
  self.clients.claim();
});
self.addEventListener("fetch", (ev) => {
  ev.respondWith(caches.match(ev.request).then(res => res || fetch(ev.request).catch(()=>caches.match("./"))));
});


