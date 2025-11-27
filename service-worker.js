// ==========================
// VRIX – OFFLINE CAPABLE
// ==========================
const CACHE_NAME = "vrix-cache-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./weekly.html",
  "./monthly.html",
  "./settings.html",
  "./css/style.css",
  "./js/app.js",
  "./js/quote.js",
  "./manifest.json",

  // icons
  "./img/vrix-logo-192.png",
  "./img/vrix-logo-512.png"
];

// Install event → cache all files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate → delete old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch → offline-first for all assets and pages
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;                  // serve from cache
      return fetch(event.request).then((res) => { // else fetch network
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return res;
      }).catch(() => {
        // fallback for offline navigation
        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("./index.html");
        }
      });
    })
  );
});
