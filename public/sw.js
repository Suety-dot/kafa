// Service worker de Kafa: permite instalarla como aplicación y muestra un aviso si no hay conexión.
// No guarda datos de la Fundación en el dispositivo: los registros siempre van al servidor.
const CACHE = "kafa-v1";
const OFFLINE = "/sin-conexion.html";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, "/icon-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match(OFFLINE)));
  }
});
