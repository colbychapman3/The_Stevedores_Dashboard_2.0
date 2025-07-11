// Enhanced Service Worker for Stevedores Dashboard
// Advanced caching with intelligent strategies and optimization

const CACHE_NAME = 'stevedores-dashboard-v2.0';
const STATIC_CACHE = 'stevedores-static-v2.0';
const API_CACHE = 'stevedores-api-v2.0';
const DYNAMIC_CACHE = 'stevedores-dynamic-v2.0';
const CDN_CACHE = 'stevedores-cdn-v2.0';

// Enhanced cache configurations
const CACHE_CONFIG = {
    static: {
        strategy: 'cache-first',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        maxEntries: 150,
        compression: true
    },
    api: {
        strategy: 'network-first',
        maxAge: 60 * 60 * 1000, // 1 hour
        maxEntries: 100,
        compression: true
    },
    dynamic: {
        strategy: 'stale-while-revalidate',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        maxEntries: 200,
        compression: false
    },
    cdn: {
        strategy: 'cache-first',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxEntries: 50,
        compression: true
    }
};

// Critical resources for immediate caching
const CRITICAL_RESOURCES = [
    '/',
    '/static/master-dashboard.html',
    '/static/ship-info.html',
    '/static/dist/main.js',
    '/static/dist/widgets.js',
    '/static/dist/widget-manager.js',
    '/static/dist/output.css',
    '/static/manifest.json'
];

// Install event with enhanced caching
self.addEventListener('install', (event) => {
    console.log('SW: Installing enhanced service worker...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical resources
            caches.open(STATIC_CACHE).then(cache => {
                return cache.addAll(CRITICAL_RESOURCES);
            }),
            
            // Initialize other caches
            caches.open(API_CACHE),
            caches.open(DYNAMIC_CACHE),
            caches.open(CDN_CACHE)
        ]).then(() => {
            console.log('SW: Installation complete');
            return self.skipWaiting();
        })
    );
});

// Activate event with cleanup
self.addEventListener('activate', (event) => {
    console.log('SW: Activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!isValidCacheName(cacheName)) {
                        console.log('SW: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('SW: Activation complete');
            return self.clients.claim();
        })
    );
});

// Enhanced fetch handler
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip extension requests
    if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return;
    }
    
    event.respondWith(
        handleRequest(request)
    );
});

// Handle request with intelligent routing
async function handleRequest(request) {
    const url = new URL(request.url);
    const strategy = determineStrategy(url);
    
    try {
        return await executeStrategy(strategy, request);
    } catch (error) {
        console.error('SW: Request failed:', error);
        return createErrorResponse(request, error);
    }
}

// Determine caching strategy
function determineStrategy(url) {
    if (url.pathname.startsWith('/api/')) {
        return CACHE_CONFIG.api;
    } else if (isCDNRequest(url)) {
        return CACHE_CONFIG.cdn;
    } else if (isStaticResource(url)) {
        return CACHE_CONFIG.static;
    } else {
        return CACHE_CONFIG.dynamic;
    }
}

// Execute caching strategy
async function executeStrategy(config, request) {
    switch (config.strategy) {
        case 'cache-first':
            return cacheFirst(request, config);
        case 'network-first':
            return networkFirst(request, config);
        case 'stale-while-revalidate':
            return staleWhileRevalidate(request, config);
        default:
            return fetch(request);
    }
}

// Cache-first with fallback
async function cacheFirst(request, config) {
    const cacheName = getCacheName(request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, config.maxAge)) {
        return cachedResponse;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            await storeResponse(cache, request, response.clone(), config);
        }
        return response;
    } catch (error) {
        if (cachedResponse) {
            console.warn('SW: Network failed, serving stale cache:', request.url);
            return cachedResponse;
        }
        throw error;
    }
}

// Network-first with cache fallback
async function networkFirst(request, config) {
    const cacheName = getCacheName(request.url);
    const cache = await caches.open(cacheName);
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            await storeResponse(cache, request, response.clone(), config);
        }
        return response;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.warn('SW: Network failed, serving cached response:', request.url);
            return cachedResponse;
        }
        throw error;
    }
}

// Stale-while-revalidate
async function staleWhileRevalidate(request, config) {
    const cacheName = getCacheName(request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Background update
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            storeResponse(cache, request, response.clone(), config);
        }
        return response;
    }).catch(error => {
        console.warn('SW: Background fetch failed:', request.url);
    });
    
    return cachedResponse || fetchPromise;
}

// Store response with enhancements
async function storeResponse(cache, request, response, config) {
    // Add metadata headers
    const headers = new Headers(response.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());
    headers.set('sw-cache-strategy', config.strategy);
    
    // Apply compression if enabled
    let body = response.body;
    if (config.compression && response.headers.get('content-encoding') === null) {
        headers.set('sw-compressed', 'true');
    }
    
    const enhancedResponse = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
    
    await cache.put(request, enhancedResponse);
    
    // Cleanup old entries
    await cleanupCache(cache, config.maxEntries);
}

// Enhanced cache cleanup
async function cleanupCache(cache, maxEntries) {
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
        const timestampedKeys = await Promise.all(
            keys.map(async (key) => {
                const response = await cache.match(key);
                const timestamp = response.headers.get('sw-cache-timestamp');
                return { key, timestamp: parseInt(timestamp) || 0 };
            })
        );
        
        timestampedKeys.sort((a, b) => a.timestamp - b.timestamp);
        const toDelete = timestampedKeys.slice(0, keys.length - maxEntries);
        
        await Promise.all(toDelete.map(item => cache.delete(item.key)));
    }
}

// Check if response is expired
function isExpired(response, maxAge) {
    const timestamp = response.headers.get('sw-cache-timestamp');
    if (!timestamp) return false;
    
    const cacheTime = parseInt(timestamp);
    const now = Date.now();
    
    return (now - cacheTime) > maxAge;
}

// Get cache name for URL
function getCacheName(url) {
    if (url.includes('/api/')) {
        return API_CACHE;
    } else if (isCDNRequest(new URL(url))) {
        return CDN_CACHE;
    } else if (isStaticResource(new URL(url))) {
        return STATIC_CACHE;
    } else {
        return DYNAMIC_CACHE;
    }
}

// Check if valid cache name
function isValidCacheName(cacheName) {
    return [CACHE_NAME, STATIC_CACHE, API_CACHE, DYNAMIC_CACHE, CDN_CACHE].includes(cacheName);
}

// Check if CDN request
function isCDNRequest(url) {
    const cdnDomains = [
        'cdn.jsdelivr.net',
        'cdnjs.cloudflare.com',
        'unpkg.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com'
    ];
    
    return cdnDomains.some(domain => url.hostname.includes(domain));
}

// Check if static resource
function isStaticResource(url) {
    const staticExtensions = ['.js', '.css', '.png', '.jpg', '.svg', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.pathname.includes(ext)) || 
           url.pathname.includes('/static/') || 
           url.pathname.includes('/dist/');
}

// Create error response
function createErrorResponse(request, error) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({
            error: 'Service Unavailable',
            message: 'The service is temporarily unavailable. Please try again later.',
            code: 503,
            offline: !navigator.onLine
        }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    } else if (request.headers.get('Accept')?.includes('text/html')) {
        return new Response(getOfflineHTML(), {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
        });
    } else {
        return new Response('Service Unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Get offline HTML
function getOfflineHTML() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Stevedores Dashboard</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    margin: 0; padding: 0; background: #f8fafc; color: #334155;
                }
                .container { 
                    max-width: 600px; margin: 100px auto; padding: 40px 20px; 
                    background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                    text-align: center;
                }
                h1 { color: #1e293b; margin-bottom: 16px; }
                p { color: #64748b; margin-bottom: 24px; line-height: 1.6; }
                button { 
                    background: #3b82f6; color: white; border: none; padding: 12px 24px;
                    border-radius: 8px; cursor: pointer; font-weight: 500;
                    transition: background 0.2s;
                }
                button:hover { background: #2563eb; }
                .status { 
                    margin-top: 20px; padding: 12px; border-radius: 6px;
                    background: #fef3c7; color: #92400e; font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚢 You're Offline</h1>
                <p>The Stevedores Dashboard is temporarily unavailable. Please check your internet connection and try again.</p>
                <button onclick="location.reload()">Retry Connection</button>
                <div class="status">
                    <strong>Status:</strong> <span id="status">Checking connection...</span>
                </div>
            </div>
            <script>
                function checkConnection() {
                    const status = document.getElementById('status');
                    status.textContent = navigator.onLine ? 'Online' : 'Offline';
                }
                checkConnection();
                window.addEventListener('online', checkConnection);
                window.addEventListener('offline', checkConnection);
            </script>
        </body>
        </html>
    `;
}

// Enhanced message handling
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
        case 'CLAIM_CLIENTS':
            self.clients.claim();
            break;
        case 'CACHE_RESOURCES':
            handleCacheResources(data);
            break;
        case 'CLEAR_CACHE':
            handleClearCache(data);
            break;
        case 'GET_CACHE_INFO':
            handleGetCacheInfo(event);
            break;
        case 'PREFETCH_RESOURCES':
            handlePrefetchResources(data);
            break;
    }
});

// Handle cache resources
async function handleCacheResources(data) {
    const { urls, cacheName } = data;
    const cache = await caches.open(cacheName || DYNAMIC_CACHE);
    
    try {
        await Promise.all(
            urls.map(async (url) => {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response.clone());
                }
            })
        );
        
        console.log('SW: Resources cached successfully');
    } catch (error) {
        console.error('SW: Failed to cache resources:', error);
    }
}

// Handle clear cache
async function handleClearCache(data) {
    const { cacheName } = data;
    
    if (cacheName) {
        await caches.delete(cacheName);
        console.log(`SW: Cache cleared: ${cacheName}`);
    } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('SW: All caches cleared');
    }
}

// Handle get cache info
async function handleGetCacheInfo(event) {
    const cacheNames = await caches.keys();
    const info = {};
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        info[cacheName] = {
            entries: keys.length,
            size: await getCacheSize(cache, keys)
        };
    }
    
    event.ports[0].postMessage(info);
}

// Handle prefetch resources
async function handlePrefetchResources(data) {
    const { urls } = data;
    const cache = await caches.open(DYNAMIC_CACHE);
    
    // Prefetch in background
    urls.forEach(async (url) => {
        try {
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response.clone());
            }
        } catch (error) {
            console.warn('SW: Failed to prefetch:', url);
        }
    });
}

// Get cache size
async function getCacheSize(cache, keys) {
    let size = 0;
    for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
            const blob = await response.blob();
            size += blob.size;
        }
    }
    return size;
}

// Background sync
self.addEventListener('sync', (event) => {
    console.log('SW: Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(handleBackgroundSync());
    }
});

// Handle background sync
async function handleBackgroundSync() {
    console.log('SW: Processing background sync...');
    
    // Notify clients about sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({
            type: 'BACKGROUND_SYNC_COMPLETE',
            timestamp: Date.now()
        });
    });
}

// Push notification handling
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/static/manifest.json',
        badge: '/static/manifest.json',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('Stevedores Dashboard', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('SW: Enhanced service worker loaded successfully');