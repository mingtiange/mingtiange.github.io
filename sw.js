/* 观象 · Service Worker
   策略：
   - 导航请求：网络优先，失败回落缓存，再回落离线页
   - 同源静态资源：缓存优先，后台更新（stale-while-revalidate）
   更新站点后把 VERSION 加一，旧缓存会在 activate 时清掉。 */

const VERSION = "v1";
const CACHE = `guanxiang-${VERSION}`;
const OFFLINE = "/offline.html";

const PRECACHE = [
  "/",
  "/index.html",
  OFFLINE,
  "/manifest.json",
  "/assets/css/style.css",
  "/assets/css/page.css",
  "/assets/js/app.js",
  "/assets/js/divination.js",
  "/assets/js/rng.js",
  "/data/gua.json",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/icon-maskable-512.png",
  "/assets/og.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match(OFFLINE))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});
