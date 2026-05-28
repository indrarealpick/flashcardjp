const CACHE_NAME = 'flashcard-jp-v1';
const STATIC_ASSETS = [
  '/flashcardjp/',
  '/flashcardjp/index.html',
  '/flashcardjp/manifest.json',
  '/flashcardjp/android_playstore_512.png',
  '/flashcardjp/android_launcher_192.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Serif+JP:wght@400;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('Cache addAll error (non-fatal):', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip Supabase API calls — always network
  if (e.request.url.includes('supabase.co') ||
      e.request.url.includes('openrouter.ai')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful GET responses
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Offline fallback — serve from cache
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Fallback to main index.html for navigation
          if (e.request.mode === 'navigate') {
            return caches.match('/flashcardjp/');
          }
        });
      })
  );
});
