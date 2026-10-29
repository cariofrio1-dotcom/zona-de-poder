"use strict";

const CACHE_NAME = "zona-de-poder-v1";
const APP_FILES = [
  "./",
  "./index.html",
  "./calculadoradecalorias.html",
  "./MACROS.html",
  "./interfazdeaplicacion.html",
  "./sitioweb.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./pwa.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("zona-de-poder-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cacheUrl = new URL(request.url);
      cacheUrl.search = "";
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(cacheUrl, response.clone());
        return response;
      } catch {
        const cachedPage = await cache.match(cacheUrl);
        if (cachedPage) return cachedPage;
        const fallback = await cache.match(new URL("./index.html", self.registration.scope));
        if (fallback) return fallback;
        return new Response("Esta página aún no está guardada para consultarla sin conexión.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await cache.put(request, response.clone());
    return response;
  })());
});
