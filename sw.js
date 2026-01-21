// [중요] 내용을 수정할 때마다 버전을 올려주세요 (v2 -> v3)
const CACHE_NAME = 'okinawa-trip-v2';

// 오프라인에서 실행하기 위해 저장할 파일 목록
const urlsToCache = [
  './',
  './index.html',        // 메인 홈 (메뉴판)
  './schedule.html',     // 일정표 (기존 index.html)
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
  './common.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // 외부 리소스 (폰트, 스타일, 아이콘)
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap'
];

// 1. 설치 (Install): 캐시 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // 대기하지 않고 즉시 활성화
  self.skipWaiting();
});

// 2. 요청 (Fetch): 오프라인 대응
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 있으면 반환, 없으면 네트워크 요청
        return response || fetch(event.request);
      })
  );
});

// 3. 활성화 (Activate): 구버전 캐시 정리
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // v2가 아닌 옛날 캐시(v1 등)는 삭제
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 모든 탭에서 즉시 제어권 가져오기
  self.clients.claim();
});