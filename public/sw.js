const CACHE = 'saiyan-fitness-v3';
const FONT_CACHE = 'saiyan-fonts-v1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      '/saiyan-fitness-app/',
      '/saiyan-fitness-app/index.html',
    ]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE && n !== FONT_CACHE).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Handle notification actions
self.addEventListener('notificationclick', e => {
  e.notification.close();

  // Handle 'skip' action from timer notification
  if (e.action === 'skip') {
    e.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SKIP_TIMER' }));
        if (clients.length > 0) clients[0].focus();
      })
    );
    return;
  }

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/saiyan-fitness-app/');
      }
    })
  );
});

// Handle messages from the app (timer notification)
self.addEventListener('message', e => {
  if (!e.data) return;

  // Force activate new SW immediately when app requests it
  if (e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (e.data.type === 'TIMER_DONE') {
    self.registration.showNotification('Saiyan Fitness', {
      body: e.data.message || 'Repos termin\u00e9 ! Reprends ta s\u00e9rie !',
      icon: '/saiyan-fitness-app/icon-192.png',
      badge: '/saiyan-fitness-app/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'rest-timer',
      renotify: true,
      requireInteraction: false,
    });
  }
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Font caching
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(e.request).then(cached =>
          cached || fetch(e.request).then(resp => { cache.put(e.request, resp.clone()); return resp; })
        )
      )
    );
    return;
  }

  // OpenFoodFacts API - network only
  if (url.hostname.includes('openfoodfacts.org')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Supabase API - network only
  if (url.hostname.includes('supabase.co')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // HTML/JS navigation requests - network first (ensures fresh app on each visit)
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => caches.match(e.request).then(c => c || caches.match('/saiyan-fitness-app/index.html')))
    );
    return;
  }

  // Other assets (JS/CSS/images) - stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(resp => {
        if (resp.ok) {
          caches.open(CACHE).then(c => c.put(e.request, resp.clone()));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
