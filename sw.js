var CACHE_NAME = "qianling-app-v5";
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
    var cleanUrl = new URL(e.request.url);
    cleanUrl.search = "";
    var cleanReq = new Request(cleanUrl.href, { method: "GET" });
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(cleanReq, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(cleanReq).then(function (m) { return m || caches.match(e.request).then(function (m2) { return m2 || caches.match("./"); }); });
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
