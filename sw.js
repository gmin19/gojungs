const CACHE_NAME = 'okinawa-trip-v1';
const urlsToCache = [
  './',
  './index.html',
  './schedule.html',
  './mapcode.html',
  './place.html',
  './dining.html',
  './shopping.html',
  './decalogue.html',
  './house.html',
  './lawson.html',
  './talk.html',
  './car.html',
  './emergency.html',
  './room.html',
  './admin.html',
  './common.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

// 설치 시 캐시 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 요청 시 캐시에서 파일 꺼내주기 (오프라인 대응)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 있으면 그거 반환, 없으면 인터넷 요청
        return response || fetch(event.request);
      })
  );
});

// 업데이트 시 구버전 캐시 삭제
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});