// AI信長 Service Worker
// アプリ本体（画面・アイコン）だけを端末に保存し、起動を速くする。
// Claude や Fish Audio との通信は保存せず、毎回ネットに取りに行く。
// ★ index.html などを更新したら、下の VERSION の数字を上げること（家族の端末にも新しい版が届く）

const VERSION = "v1";
const CACHE = "ai-nobunaga-" + VERSION;
const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("ai-nobunaga-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  // 自分のサイト以外（Claude API・中継URL）と GET 以外には手を出さない
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // 画面（HTML）は「ネット優先・つながらなければ保存版」：更新がすぐ反映される
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./index.html", copy)); return res; })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  // アイコンなどは「保存版優先」
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
