self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('eduprime-cache-v1').then((cache) => {
      return cache.addAll(['/', '/logo.png', '/principal_sign.png', '/class_teacher_sign.png']);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});