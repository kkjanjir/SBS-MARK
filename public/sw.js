const CACHE_NAME = 'sbs-erp-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/logo.png',
        '/principal_sign.png',
        '/class_teacher_sign.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      // Agar net nahi hai aur page mang raha hai, toh offline wala cached page de do
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});