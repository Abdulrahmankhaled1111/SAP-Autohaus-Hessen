const CACHE_NAME = "autohaus-hessen-pwa-v20260620-ux-suite";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/assets/app.css",
  "/assets/app.js",
  "/assets/launchpad.css",
  "/assets/launchpad.js",
  "/assets/session.js",
  "/assets/pwa.js",
  "/assets/icons/favicon.svg",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/maskable-512.png"
];

const NETWORK_ONLY_PREFIXES = [
  "/api/",
  "/user-api",
  "/logout",
  "/login"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (NETWORK_ONLY_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (["style", "script", "image", "font", "manifest"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline.html");
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    return caches.match(request);
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}
