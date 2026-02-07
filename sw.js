/**
 * Service Worker for Fitness Pro App
 * Provides offline functionality and caching for PWA experience
 */

const CACHE_NAME = 'fitness-pro-v1.0.3';
const STATIC_CACHE = 'fitness-static-v2';
const DYNAMIC_CACHE = 'fitness-dynamic-v2';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js?v=2',
  '/icons/icon.svg',
  '/js/components/Navbar.js',
  '/js/components/FloatCoach.js',
  '/js/components/VideoPlayer.js',
  '/js/services/DataManager.js',
  '/js/services/AICoach.js',
  '/js/services/Analytics.js',
  '/js/services/AuthService.js',
  '/js/services/BackupService.js',
  '/js/services/NutritionService.js',
  '/js/services/EmailService.js',
  '/js/services/SyncQueueService.js',
  '/js/services/IndexedDBService.js',
  '/js/services/GamificationService.js',
  '/js/services/RecommendationEngine.js',
  '/js/services/i18nService.js',
  '/js/services/VideoService.js',
  '/js/services/CoachingEngine.js',
  '/js/utils/NotificationManager.js',
  '/js/utils/AudioGuide.js',
  '/js/utils/Config.js',
  '/js/utils/ErrorHandler.js',
  '/js/utils/PerformanceMonitor.js',
  '/js/utils/StateManager.js',
  '/js/utils/TestRunner.js',
  '/js/views/Home.js',
  '/js/views/Exercises.js',
  '/js/views/ActiveWorkout.js',
  '/js/views/Profile.js',
  '/js/views/Progress.js',
  '/js/views/Nutrition.js',
  '/js/views/Onboarding.js',
  '/js/views/Workouts.js',
  '/js/views/RunTracker.js',
  '/js/views/AdminDashboard.js',
  '/js/views/Gamification.js',
  '/js/views/VideoLibrary.js',
  '/js/views/AICoach.js'
];

// External resources that can be cached
const EXTERNAL_RESOURCES = [
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// API endpoints to cache responses
const API_CACHE_PATTERNS = [
  /^https:\/\/world\.openfoodfacts\.org\/api/,
  /^https:\/\/generativelanguage\.googleapis\.com/
];

/**
 * Install Event - Cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS.concat(EXTERNAL_RESOURCES));
      }),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch Event - Handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request.url)) {
    // Static assets: Cache First strategy
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request.url)) {
    // API requests: Network First strategy with short cache
    event.respondWith(networkFirstShortCache(request));
  } else if (isImageRequest(request.url)) {
    // Images: Cache First with fallback
    event.respondWith(cacheFirstWithFallback(request));
  } else {
    // Other requests: Network First strategy
    event.respondWith(networkFirst(request));
  }
});

/**
 * Cache First Strategy - Good for static assets
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Cache First failed:', error);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    throw error;
  }
}

/**
 * Network First Strategy - Good for dynamic content
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }

    throw error;
  }
}

/**
 * Network First with Short Cache - Good for API requests
 */
async function networkFirstShortCache(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses with short TTL
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);

      // Add timestamp for TTL checking
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: {
          ...networkResponse.headers,
          'sw-cache-timestamp': Date.now()
        }
      });

      cache.put(request, responseWithTimestamp.clone());
      return networkResponse;
    }

    return networkResponse;
  } catch (error) {
    // Check cache with TTL (5 minutes for API responses)
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      const isStale = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) > 5 * 60 * 1000;

      if (!isStale) {
        return cachedResponse;
      }
    }

    throw error;
  }
}

/**
 * Cache First with Fallback - Good for images
 */
async function cacheFirstWithFallback(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed image requests
    if (isImageRequest(request.url)) {
      return new Response(
        '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#334155"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#94a3b8">Immagine non disponibile</text></svg>',
        {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'max-age=86400'
          }
        }
      );
    }

    throw error;
  }
}

/**
 * Background Sync for workout data
 */
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);

  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

/**
 * Push Notification Handler
 */
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const options = {
    body: 'È ora del tuo allenamento giornaliero! 💪',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'workout-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'start-workout',
        title: 'Inizia Ora'
      },
      {
        action: 'remind-later',
        title: 'Ricorda Dopo'
      }
    ]
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.title = data.title || 'Fitness Pro';
  }

  event.waitUntil(
    self.registration.showNotification('Fitness Pro', options)
  );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'start-workout') {
    event.waitUntil(
      clients.openWindow('/#/active')
    );
  } else if (event.action === 'remind-later') {
    // Schedule another notification in 1 hour
    setTimeout(() => {
      self.registration.showNotification('Fitness Pro', {
        body: 'Promemoria: non dimenticare il tuo allenamento! 🏃‍♂️',
        icon: '/icon-192x192.png',
        tag: 'workout-reminder-later'
      });
    }, 60 * 60 * 1000);
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Helper Functions
 */
function isStaticAsset(url) {
  return STATIC_ASSETS.some(asset => url.includes(asset)) ||
    EXTERNAL_RESOURCES.some(resource => url.startsWith(resource));
}

function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url) ||
    url.includes('images.unsplash.com') ||
    url.includes('image_url');
}

/**
 * Sync workout data when online
 */
async function syncWorkoutData() {
  try {
    // Get pending workout logs from IndexedDB or localStorage
    const clients = await self.clients.matchAll();

    if (clients.length > 0) {
      // Send message to main app to sync data
      clients[0].postMessage({
        type: 'SYNC_WORKOUT_DATA',
        timestamp: Date.now()
      });
    }

    console.log('Service Worker: Workout data sync initiated');
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
    throw error;
  }
}

/**
 * Periodic cleanup of old cache entries
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEANUP_CACHE') {
    event.waitUntil(cleanupCache());
  }
});

async function cleanupCache() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();

  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const request of requests) {
    const response = await cache.match(request);
    const timestamp = response?.headers.get('sw-cache-timestamp');

    if (timestamp && (now - parseInt(timestamp)) > maxAge) {
      await cache.delete(request);
      console.log('Service Worker: Cleaned up old cache entry:', request.url);
    }
  }
}

console.log('Service Worker: Script loaded');
