var CACHE_NAME = 'lms-sman1pultibar-v4';
var ASSETS_TO_CACHE = [
  './',
  'index.html',
  'logo.png',
  'bg-sekolah.jpg',
  'manifest.json'
];

// Tahap Install: Simpan aset lokal ke cache browser
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Tahap Activate: Hapus cache versi lama jika ada pembaruan
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Tahap Fetch: Network-First untuk index.html, Cache-First untuk gambar/manifest
self.addEventListener('fetch', function (event) {
  var requestUrl = new URL(event.request.url);

  // Jangan intervensi request eksternal ke Google Apps Script
  if (requestUrl.origin !== location.origin) {
    return;
  }

  // Untuk dokumen HTML utama, utamakan versi terbaru dari jaringan lalu fallback ke cache
  if (event.request.mode === 'navigate' || requestUrl.pathname.endsWith('index.html') || requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(function (networkResponse) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(function () {
          return caches.match('index.html');
        })
    );
    return;
  }

  // Untuk aset statis (logo.png, bg-sekolah.jpg, manifest.json), sajikan instan dari cache
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(function () {
        return new Response(
          '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Koneksi Terputus - SMAN 1 Pulau Tiga Barat</title>' +
          '<style>body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f0f9ff;color:#0f172a;font-family:sans-serif;text-align:center;padding:24px;}' +
          'img{width:96px;height:96px;margin-bottom:16px;}h2{margin:0 0 8px;font-size:1.25rem;}p{color:#475569;font-size:0.9rem;max-width:340px;line-height:1.5;margin-bottom:20px;}' +
          'button{background:#0284c7;color:#fff;border:none;padding:12px 24px;border-radius:10px;font-weight:700;cursor:pointer;}</style></head>' +
          '<body><img src="logo.png" alt="Logo"><h2>Koneksi Internet Terputus</h2><p>Periksa jaringan seluler atau Wi-Fi Anda untuk mengakses LMS SMAN 1 Pulau Tiga Barat.</p>' +
          '<button onclick="window.location.reload()">Coba Hubungkan Ulang</button></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      });
    })
  );
});
