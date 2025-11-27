const CACHE_NAME = "vrix-cache-v1";
const ASSETS = [
  "index.html",
  "weekly.html",
  "monthly.html",
  "settings.html",
  "css/style.css",
  "js/app.js",
  "img/vrix-logo.png",
  "img/vrix-logo-192.png",
  "img/vrix-logo-512.png"
];

// Install: cache core files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate: clean old caches if any
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
});

// Fetch: try cache first, then network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          // Optional: return offline fallback page
          caches.match("index.html")
        )
      );
    })
  );
});