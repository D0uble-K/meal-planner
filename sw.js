/**
 * Service Worker cho ứng dụng Hôm Nay Ăn Gì
 * Đảm bảo ứng dụng chạy mượt mà ngay cả khi offline (mất mạng/wifi)
 */

const CACHE_NAME = 'meal-planner-v1.5.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/api.js',
  './js/store.js',
  './js/ui.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Cài đặt Service Worker và lưu cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Caching failed for some external assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// Kích hoạt SW và dọn dẹp cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Chiến lược Fetch: Network First cho API, Cache First cho static files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Đối với request Google Script hoặc API: thử network, nếu lỗi trả về fallback
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ 
          status: 'offline', 
          message: 'Đang ở chế độ ngoại tuyến' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Đối với các tài nguyên tĩnh: Cache First kèm cập nhật ngầm
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Tải ngầm bản mới để cập nhật cho lần sau
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Nếu không có mạng và không có trong cache, trả về trang chính nếu là navigate
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
