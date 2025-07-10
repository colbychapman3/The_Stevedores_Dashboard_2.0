const CACHE_NAME = 'stevedores-dashboard-v3';
const STATIC_CACHE = 'static-cache-v3';
const DYNAMIC_CACHE = 'dynamic-cache-v3';
const API_CACHE = 'api-cache-v3';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/wizard',
  '/master',
  '/calendar', 
  '/analytics',
  '/ship-info',
  '/static/js/wizard.js',
  '/static/js/master-dashboard.js',
  '/static/js/ship-info.js',
  '/static/js/offline-storage.js',
  '/static/dist/output.css',
  '/static/manifest.json',
  '/static/sw.js'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css'
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/ships',
  '/api/analytics',
  '/api/ships/stats',
  '/api/ships/berths'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache external resources with error handling
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching external resources');
        return Promise.allSettled(
          EXTERNAL_RESOURCES.map(url => 
            fetch(url, { mode: 'cors' })
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                throw new Error(`Failed to fetch ${url}`);
              })
              .catch(error => {
                console.warn(`Failed to cache external resource: ${url}`, error);
              })
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker installation complete');
      // Force activation
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  const cacheWhitelist = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activation complete');
    })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Handle other requests
  event.respondWith(handleOtherRequests(request));
});

// Handle API requests with cache-first strategy for GET requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isCacheableAPI = CACHEABLE_APIS.some(api => url.pathname.startsWith(api));
  
  if (isCacheableAPI) {
    try {
      // Try cache first for performance
      const cached = await caches.match(request);
      
      // If we have cached data, return it immediately and update in background
      if (cached) {
        // Background fetch to update cache
        fetch(request)
          .then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(API_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
          })
          .catch(error => {
            console.warn('Background API update failed:', error);
          });
        
        return cached;
      }
      
      // No cache, try network
      const response = await fetch(request);
      
      if (response.ok) {
        // Cache successful responses
        const responseClone = response.clone();
        const cache = await caches.open(API_CACHE);
        cache.put(request, responseClone);
        
        return response;
      }
      
      throw new Error(`API request failed: ${response.status}`);
      
    } catch (error) {
      console.warn('API request failed, checking cache:', error);
      
      // Try to return cached version as fallback
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      
      // Return offline response for critical APIs
      return new Response(JSON.stringify({
        error: 'offline',
        message: 'This data is not available offline',
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }
  }
  
  // For non-cacheable APIs, just try network
  return fetch(request);
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('Static asset request failed:', error);
    
    // Try to return cached version
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return a generic error response
    return new Response('Resource not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('Navigation request failed, checking cache:', error);
    
    // Try cached version
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Fallback to main page
    const mainPage = await caches.match('/');
    if (mainPage) {
      return mainPage;
    }
    
    // Ultimate fallback
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Stevedores Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>🚢 Stevedores Dashboard</h1>
            <p>You're currently offline and this page isn't cached yet.</p>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Handle other requests
async function handleOtherRequests(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Not available offline', { status: 503 });
  }
}

// Helper function to determine if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  
  // Check file extensions
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const hasStaticExtension = staticExtensions.some(ext => url.pathname.endsWith(ext));
  
  // Check if it's from static folder
  const isStaticFolder = url.pathname.startsWith('/static/');
  
  // Check if it's an external CDN resource
  const isExternalCDN = EXTERNAL_RESOURCES.some(resource => request.url.startsWith(resource));
  
  return hasStaticExtension || isStaticFolder || isExternalCDN;
}

// Handle messages from clients
self.addEventListener('message', event => {
  const { action, data } = event.data;
  
  switch (action) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      if (data && data.urls) {
        caches.open(DYNAMIC_CACHE).then(cache => {
          return cache.addAll(data.urls);
        });
      }
      break;
      
    case 'CLEAR_CACHE':
      if (data && data.cacheName) {
        caches.delete(data.cacheName);
      } else {
        // Clear all caches
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        });
      }
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
  }
});

// Get cache information
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const cacheInfo = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheInfo[cacheName] = {
      count: keys.length,
      urls: keys.map(request => request.url)
    };
  }
  
  return cacheInfo;
}

// Background sync for when online
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Trigger background sync in the main app
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            action: 'SYNC_DATA'
          });
        });
      })
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/static/icons/icon-192x192.png',
    badge: '/static/icons/icon-72x72.png',
    data: {
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Stevedores Dashboard', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      // Focus existing client or open new one
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

console.log('Service Worker loaded successfully');
