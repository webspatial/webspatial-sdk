const CACHE_NAME = 'webspatial-test-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.js',
  '/src/index.css',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE)
    }),
  )
})

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request)
    }),
  )
})
