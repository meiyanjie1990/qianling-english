var CACHE_NAME = "qianling-app-v1";
var PRECACHE = [
  "./", "index.html", "logic.js", "ui.js", "content.json",
  "manifest.json", "version.json",
  "icon-192.png", "icon-512.png", "apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (c) { return c.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var pathname = new URL(e.request.url).pathname;
  var isFresh = pathname.endsWith("/content.json") || pathname.endsWith("/version.json");
  if (isFresh) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (m) { return m || caches.match("./"); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (m) { return m || fetch(e.request); })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "CLEAR_CACHE") {
    e.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
    );
  }
});
