const CACHE_NAME = 'lms-sman1ptb-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json'
];

// Tahap Install: Simpan aset lokal penting (logo & kerangka utama) ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Tahap Activate: Hapus cache versi lama jika ada pembaruan
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Tahap Fetch: Sajikan aset lokal instan & tampilkan pesan ramah jika offline
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Jangan intervensi request eksternal ke Google Apps Script / Google Drive
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Untuk navigasi halaman utama: Network First, fallback ke Cache / Offline UI
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match('/index.html').then((cachedPage) => {
            if (cachedPage) return cachedPage;
            return new Response(
              '<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Offline - SMAN 1 Pulau Tiga Barat</title><style>body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:24px;}img{width:100px;height:100px;object-fit:contain;margin-bottom:16px;}h2{font-size:18px;margin:0 0 8px;}p{font-size:13px;color:#94a3b8;max-width:320px;margin:0 0 20px;line-height:1.5;}button{padding:10px 24px;background:#00ffaa;color:#0f172a;border:none;border-radius:8px;font-weight:700;cursor:pointer;}</style></head><body><img src="logo.png" alt="Logo"><h2>SMAN 1 Pulau Tiga Barat</h2><p>Perangkat Anda sedang tidak terhubung ke internet. Silakan periksa koneksi data atau Wi-Fi Anda.</p><button onclick="window.location.reload()">Coba Hubungkan Ulang</button></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
            );
          });
        })
    );
    return;
  }

  // Untuk aset statis lokal (logo.png, manifest.json): Cache First agar 0 detik
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
