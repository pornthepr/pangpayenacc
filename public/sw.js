// Minimal offline support: "เปิดดูข้อมูลล่าสุดได้เมื่อเน็ตหลุด" (requirement
// section 8) — only caches full-page navigations so a page the user already
// opened can still render while offline. Everything else (API calls to
// Supabase, POSTs, JS/CSS chunks) passes straight through untouched; there is
// no asset precaching and no offline write queue (explicitly future work).
const CACHE_NAME = "pangpayenacc-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached ?? caches.match("/")))
  );
});
