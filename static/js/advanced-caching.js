/**
 * Advanced Caching Strategy Module
 * Implements sophisticated caching with CDN optimization and intelligent cache management
 */

class AdvancedCacheManager {
  constructor() {
    this.cacheName = 'stevedores-dashboard-v2';
    this.apiCacheName = 'stevedores-api-cache';
    this.staticCacheName = 'stevedores-static-cache';
    this.dynamicCacheName = 'stevedores-dynamic-cache';
    
    this.cacheStrategies = {
      static: 'cache-first',
      api: 'network-first',
      dynamic: 'stale-while-revalidate'
    };
    
    this.maxAgeSettings = {
      static: 7 * 24 * 60 * 60 * 1000, // 7 days
      api: 60 * 60 * 1000, // 1 hour
      dynamic: 24 * 60 * 60 * 1000 // 1 day
    };
    
    this.compressionSupport = {
      gzip: true,
      brotli: 'br' in window && 'CompressionStream' in window
    };
    
    this.init();
  }

  /**
   * Initialize advanced caching
   */
  async init() {
    if ('serviceWorker' in navigator) {
      this.setupServiceWorker();
    }
    
    if ('caches' in window) {
      await this.setupCacheStorage();
      this.setupCacheStrategies();
      this.setupCacheOptimization();
    }
    
    this.setupNetworkOptimization();
    this.setupCDNOptimization();
  }

  /**
   * Setup enhanced service worker
   */
  async setupServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.notifyUpdateAvailable();
          }
        });
      });
      
      // Enhanced message handling
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });
      
      console.log('Enhanced service worker registered');
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }

  /**
   * Setup cache storage with intelligent partitioning
   */
  async setupCacheStorage() {
    const cacheNames = await caches.keys();
    
    // Clean old caches
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('stevedores-') && name !== this.cacheName)
        .map(name => caches.delete(name))
    );
    
    // Initialize cache partitions
    await Promise.all([
      caches.open(this.staticCacheName),
      caches.open(this.apiCacheName),
      caches.open(this.dynamicCacheName)
    ]);
  }

  /**
   * Setup intelligent cache strategies
   */
  setupCacheStrategies() {
    // Override fetch for advanced caching
    const originalFetch = window.fetch;
    
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      const strategy = this.determineCacheStrategy(url);
      
      return this.executeStrategy(strategy, input, init, originalFetch);
    };
  }

  /**
   * Determine cache strategy based on URL
   */
  determineCacheStrategy(url) {
    if (url.includes('/api/')) {
      return 'network-first';
    } else if (url.includes('/static/dist/') || url.includes('cdn.')) {
      return 'cache-first';
    } else if (url.includes('.js') || url.includes('.css') || url.includes('.woff')) {
      return 'cache-first';
    } else {
      return 'stale-while-revalidate';
    }
  }

  /**
   * Execute caching strategy
   */
  async executeStrategy(strategy, input, init, originalFetch) {
    const url = typeof input === 'string' ? input : input.url;
    
    switch (strategy) {
      case 'cache-first':
        return this.cacheFirst(url, input, init, originalFetch);
      case 'network-first':
        return this.networkFirst(url, input, init, originalFetch);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidate(url, input, init, originalFetch);
      default:
        return originalFetch(input, init);
    }
  }

  /**
   * Cache-first strategy
   */
  async cacheFirst(url, input, init, originalFetch) {
    const cacheName = this.getCacheName(url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(url);
    
    if (cachedResponse && !this.isExpired(cachedResponse)) {
      return cachedResponse;
    }
    
    try {
      const response = await originalFetch(input, init);
      if (response.ok) {
        const responseClone = response.clone();
        await this.storeWithCompression(cache, url, responseClone);
      }
      return response;
    } catch (error) {
      if (cachedResponse) {
        console.warn('Network failed, serving stale cache:', url);
        return cachedResponse;
      }
      throw error;
    }
  }

  /**
   * Network-first strategy
   */
  async networkFirst(url, input, init, originalFetch) {
    const cacheName = this.getCacheName(url);
    const cache = await caches.open(cacheName);
    
    try {
      const response = await originalFetch(input, init);
      if (response.ok) {
        const responseClone = response.clone();
        await this.storeWithCompression(cache, url, responseClone);
      }
      return response;
    } catch (error) {
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        console.warn('Network failed, serving cached response:', url);
        return cachedResponse;
      }
      throw error;
    }
  }

  /**
   * Stale-while-revalidate strategy
   */
  async staleWhileRevalidate(url, input, init, originalFetch) {
    const cacheName = this.getCacheName(url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(url);
    
    // Always try to update in background
    const updatePromise = originalFetch(input, init).then(response => {
      if (response.ok) {
        const responseClone = response.clone();
        this.storeWithCompression(cache, url, responseClone);
      }
      return response;
    }).catch(error => {
      console.warn('Background update failed:', url, error);
    });
    
    if (cachedResponse) {
      // Don't await the update promise
      updatePromise.catch(() => {});
      return cachedResponse;
    } else {
      // No cached version, wait for network
      return updatePromise;
    }
  }

  /**
   * Store response with compression
   */
  async storeWithCompression(cache, url, response) {
    const headers = new Headers(response.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());
    
    // Add compression headers if supported
    if (this.compressionSupport.brotli) {
      headers.set('content-encoding', 'br');
    } else if (this.compressionSupport.gzip) {
      headers.set('content-encoding', 'gzip');
    }
    
    const compressedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });
    
    await cache.put(url, compressedResponse);
  }

  /**
   * Get appropriate cache name for URL
   */
  getCacheName(url) {
    if (url.includes('/api/')) {
      return this.apiCacheName;
    } else if (url.includes('/static/') || url.includes('cdn.')) {
      return this.staticCacheName;
    } else {
      return this.dynamicCacheName;
    }
  }

  /**
   * Check if cached response is expired
   */
  isExpired(response) {
    const timestamp = response.headers.get('sw-cache-timestamp');
    if (!timestamp) return false;
    
    const cacheTime = parseInt(timestamp);
    const now = Date.now();
    const maxAge = this.getMaxAge(response.url);
    
    return (now - cacheTime) > maxAge;
  }

  /**
   * Get max age for URL
   */
  getMaxAge(url) {
    if (url.includes('/api/')) {
      return this.maxAgeSettings.api;
    } else if (url.includes('/static/') || url.includes('cdn.')) {
      return this.maxAgeSettings.static;
    } else {
      return this.maxAgeSettings.dynamic;
    }
  }

  /**
   * Setup cache optimization
   */
  setupCacheOptimization() {
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Setup cache warming
    this.setupCacheWarming();
    
    // Setup cache cleanup
    this.setupCacheCleanup();
    
    // Setup cache monitoring
    this.setupCacheMonitoring();
  }

  /**
   * Preload critical resources
   */
  async preloadCriticalResources() {
    const criticalResources = [
      '/static/dist/main.js',
      '/static/dist/widgets.js',
      '/static/dist/widget-manager.js',
      '/static/dist/output.css',
      '/api/ships'
    ];
    
    const cache = await caches.open(this.staticCacheName);
    
    try {
      await Promise.all(
        criticalResources.map(async (url) => {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        })
      );
      console.log('Critical resources preloaded');
    } catch (error) {
      console.error('Failed to preload critical resources:', error);
    }
  }

  /**
   * Setup cache warming
   */
  setupCacheWarming() {
    // Warm cache with likely-to-be-requested resources
    const warmCacheOnIdle = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          this.warmCache();
        });
      } else {
        setTimeout(() => {
          this.warmCache();
        }, 2000);
      }
    };
    
    // Warm cache after initial page load
    if (document.readyState === 'complete') {
      warmCacheOnIdle();
    } else {
      window.addEventListener('load', warmCacheOnIdle);
    }
  }

  /**
   * Warm cache with predictive resources
   */
  async warmCache() {
    const predictiveResources = [
      '/static/analytics.html',
      '/static/calendar.html',
      '/api/ships/recent',
      '/api/analytics/overview'
    ];
    
    const cache = await caches.open(this.dynamicCacheName);
    
    for (const url of predictiveResources) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (error) {
        console.warn('Failed to warm cache for:', url);
      }
    }
  }

  /**
   * Setup cache cleanup
   */
  setupCacheCleanup() {
    // Clean up expired entries every 10 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 10 * 60 * 1000);
    
    // Clean up on storage quota exceeded
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      setInterval(() => {
        this.checkStorageQuota();
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredEntries() {
    const cacheNames = [this.staticCacheName, this.apiCacheName, this.dynamicCacheName];
    
    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response && this.isExpired(response)) {
            await cache.delete(request);
          }
        }
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    }
  }

  /**
   * Check storage quota and clean if needed
   */
  async checkStorageQuota() {
    try {
      const estimate = await navigator.storage.estimate();
      const usagePercent = (estimate.usage / estimate.quota) * 100;
      
      if (usagePercent > 80) {
        console.warn('Storage quota exceeded, cleaning cache');
        await this.aggressiveCleanup();
      }
    } catch (error) {
      console.error('Failed to check storage quota:', error);
    }
  }

  /**
   * Aggressive cache cleanup
   */
  async aggressiveCleanup() {
    // Remove oldest entries from dynamic cache
    const cache = await caches.open(this.dynamicCacheName);
    const keys = await cache.keys();
    
    // Sort by cache timestamp and remove oldest 50%
    const timestampedKeys = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        const timestamp = response.headers.get('sw-cache-timestamp');
        return { key, timestamp: parseInt(timestamp) || 0 };
      })
    );
    
    timestampedKeys.sort((a, b) => a.timestamp - b.timestamp);
    const toDelete = timestampedKeys.slice(0, Math.floor(timestampedKeys.length / 2));
    
    await Promise.all(toDelete.map(item => cache.delete(item.key)));
  }

  /**
   * Setup cache monitoring
   */
  setupCacheMonitoring() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      networkRequests: 0,
      cacheSize: 0
    };
    
    // Monitor cache performance
    setInterval(() => {
      this.logCachePerformance();
    }, 5 * 60 * 1000);
  }

  /**
   * Log cache performance
   */
  async logCachePerformance() {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalSize += keys.length;
      }
      
      this.cacheStats.cacheSize = totalSize;
      
      console.log('Cache Performance:', {
        hitRate: `${((this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100).toFixed(2)}%`,
        totalEntries: totalSize,
        networkRequests: this.cacheStats.networkRequests
      });
    } catch (error) {
      console.error('Failed to log cache performance:', error);
    }
  }

  /**
   * Setup network optimization
   */
  setupNetworkOptimization() {
    // Implement resource hints
    this.addResourceHints();
    
    // Setup connection optimization
    this.optimizeConnections();
    
    // Setup request prioritization
    this.setupRequestPrioritization();
  }

  /**
   * Add resource hints for better performance
   */
  addResourceHints() {
    const hints = [
      { rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preload', href: '/static/dist/main.js', as: 'script' },
      { rel: 'preload', href: '/static/dist/output.css', as: 'style' }
    ];
    
    hints.forEach(hint => {
      const link = document.createElement('link');
      Object.assign(link, hint);
      document.head.appendChild(link);
    });
  }

  /**
   * Optimize connections
   */
  optimizeConnections() {
    // Enable HTTP/2 push hints
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.controller?.postMessage({
        type: 'ENABLE_HTTP2_PUSH',
        resources: ['/static/dist/main.js', '/static/dist/widgets.js']
      });
    }
  }

  /**
   * Setup request prioritization
   */
  setupRequestPrioritization() {
    // Priority queue for requests
    this.requestQueue = {
      high: [],
      medium: [],
      low: []
    };
    
    // Process queue with priority
    setInterval(() => {
      this.processRequestQueue();
    }, 100);
  }

  /**
   * Setup CDN optimization
   */
  setupCDNOptimization() {
    // Configure CDN settings
    this.cdnConfig = {
      enabled: true,
      endpoints: [
        'https://cdn.jsdelivr.net',
        'https://cdnjs.cloudflare.com'
      ],
      fallbacks: {
        'https://cdn.jsdelivr.net/npm/chart.js': '/static/js/chart.js'
      }
    };
    
    // Optimize CDN usage
    this.optimizeCDNUsage();
  }

  /**
   * Optimize CDN usage
   */
  optimizeCDNUsage() {
    // Implement CDN failover
    const originalFetch = window.fetch;
    
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      
      // Check if it's a CDN request
      if (this.isCDNRequest(url)) {
        return this.fetchWithCDNFailover(url, input, init, originalFetch);
      }
      
      return originalFetch(input, init);
    };
  }

  /**
   * Check if request is to CDN
   */
  isCDNRequest(url) {
    return this.cdnConfig.endpoints.some(endpoint => url.includes(endpoint));
  }

  /**
   * Fetch with CDN failover
   */
  async fetchWithCDNFailover(url, input, init, originalFetch) {
    try {
      const response = await originalFetch(input, init);
      if (response.ok) {
        return response;
      }
      throw new Error(`CDN request failed: ${response.status}`);
    } catch (error) {
      // Try fallback if available
      const fallbackUrl = this.cdnConfig.fallbacks[url];
      if (fallbackUrl) {
        console.warn(`CDN failed, using fallback: ${fallbackUrl}`);
        return originalFetch(fallbackUrl, init);
      }
      throw error;
    }
  }

  /**
   * Handle service worker messages
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        console.log('Cache updated:', data.url);
        break;
      case 'OFFLINE_FALLBACK':
        console.log('Serving offline fallback');
        this.showOfflineMessage();
        break;
      case 'QUOTA_EXCEEDED':
        console.warn('Storage quota exceeded');
        this.aggressiveCleanup();
        break;
    }
  }

  /**
   * Show offline message
   */
  showOfflineMessage() {
    const message = document.createElement('div');
    message.className = 'offline-message';
    message.textContent = 'You are currently offline. Some features may be limited.';
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 5000);
  }

  /**
   * Notify update available
   */
  notifyUpdateAvailable() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <p>A new version is available!</p>
      <button onclick="location.reload()">Update Now</button>
    `;
    document.body.appendChild(notification);
  }

  /**
   * Process request queue
   */
  processRequestQueue() {
    const queues = ['high', 'medium', 'low'];
    
    for (const priority of queues) {
      if (this.requestQueue[priority].length > 0) {
        const request = this.requestQueue[priority].shift();
        this.executeRequest(request);
      }
    }
  }

  /**
   * Execute queued request
   */
  async executeRequest(request) {
    try {
      const response = await fetch(request.url, request.options);
      request.resolve(response);
    } catch (error) {
      request.reject(error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const cacheNames = await caches.keys();
    const stats = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      stats[cacheName] = {
        entries: keys.length,
        urls: keys.map(key => key.url)
      };
    }
    
    return stats;
  }

  /**
   * Clear all caches
   */
  async clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('All caches cleared');
  }
}

// Initialize advanced cache manager
const advancedCacheManager = new AdvancedCacheManager();

// Export for global use
window.advancedCacheManager = advancedCacheManager;

export default advancedCacheManager;