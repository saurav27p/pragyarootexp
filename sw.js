const CACHE = "pragyaroot-exp-v2";
const CORE = [
  "./",
  "./index.html",
  "./assets/css/shared.css",
  "./assets/js/shared.js",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./404.html"
];
self.addEventListener("install", function(event){
  event.waitUntil(caches.open(CACHE).then(function(cache){ return cache.addAll(CORE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener("activate", function(event){
  event.waitUntil(caches.keys().then(function(keys){ return Promise.all(keys.filter(function(key){ return key !== CACHE; }).map(function(key){ return caches.delete(key); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then(function(response){ var copy = response.clone(); caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); }); return response; }).catch(function(){ return caches.match("./index.html"); }));
    return;
  }
  event.respondWith(caches.match(event.request).then(function(cached){ return cached || fetch(event.request).then(function(response){ if (response && response.ok) { var copy = response.clone(); caches.open(CACHE).then(function(cache){ cache.put(event.request, copy); }); } return response; }).catch(function(){ return cached; }); }));
});
