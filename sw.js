const CACHE_NAME = "faire-food-qc-shell-v3";
// index.html is network-first now — every load tries the live version
// first, and only falls back to cache if there's genuinely no connection.
// Previously it was cache-first, which meant everyone was always one
// version behind until they happened to reload twice; this is the fix.
const NETWORK_FIRST_FILES = ["./index.html"];
// Firebase and EmailJS almost never change and matter most for a genuine
// offline cold start, so they stay cache-first with a background refresh.
const CACHE_FIRST_FILES = [
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./firebase-app-compat.js",
  "./firebase-database-compat.js",
  "./emailjs.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([...NETWORK_FIRST_FILES, ...CACHE_FIRST_FILES]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Live data itself (Firebase reads/writes) always goes straight to the
// network regardless of the logic below — only these static shell/library
// files are ever served from cache.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isNetworkFirst = NETWORK_FIRST_FILES.some((f) => url.pathname.endsWith(f.replace("./", "")))
    || event.request.mode === "navigate"; // covers the bare app URL with no filename too
  const isCacheFirst = CACHE_FIRST_FILES.some((f) => url.pathname.endsWith(f.replace("./", "")));

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else if (isCacheFirst) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  }
  // else: let the browser handle it normally (network)
});
