const CACHE_NAME = "timex-shell-v2";
const BASE_PATH = new URL(".", self.registration.scope).pathname;
const APP_PATH = `${BASE_PATH}app.html`;
const APP_SHELL = ["", "app.html", "manifest.webmanifest", "icons/timex.svg", "icons/icon-192.png"]
  .map((path) => new URL(path, self.registration.scope).href);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("timex-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            return caches.open(CACHE_NAME)
              .then((cache) => cache.put(url.pathname, copy))
              .then(() => response)
              .catch((error) => {
                console.error("TimeX could not cache this page for offline use.", error);
                return response;
              });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          const fallback = url.pathname === BASE_PATH ? BASE_PATH : APP_PATH;
          return cached ||
            (await caches.match(url.pathname)) ||
            (await caches.match(fallback)) ||
            caches.match(BASE_PATH);
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          return caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .then(() => response)
            .catch((error) => {
              console.error("TimeX could not cache an app resource for offline use.", error);
              return response;
            });
        }
        return response;
      });
    }),
  );
});
