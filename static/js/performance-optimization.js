/**
 * Performance Optimization Module
 * Implements virtual scrolling, memoization, and other performance enhancements
 */

class PerformanceOptimizer {
  constructor() {
    this.memoCache = new Map();
    this.debounceTimers = new Map();
    this.virtualScrollInstances = new Map();
    this.observers = [];
    this.rafId = null;
    this.pendingUpdates = new Set();
  }

  /**
   * Initialize performance optimizations
   */
  init() {
    this.setupVirtualScrolling();
    this.setupMemoization();
    this.setupDebouncing();
    this.setupRAFScheduling();
    this.setupMemoryManagement();
  }

  /**
   * Setup virtual scrolling for large datasets
   */
  setupVirtualScrolling() {
    const scrollContainers = document.querySelectorAll('[data-virtual-scroll]');
    
    scrollContainers.forEach(container => {
      const config = {
        itemHeight: parseInt(container.dataset.itemHeight) || 50,
        bufferSize: parseInt(container.dataset.bufferSize) || 10,
        threshold: parseInt(container.dataset.threshold) || 100
      };
      
      this.initVirtualScroll(container, config);
    });
  }

  /**
   * Initialize virtual scrolling for a container
   */
  initVirtualScroll(container, config) {
    const virtualScroll = new VirtualScroller(container, config);
    this.virtualScrollInstances.set(container, virtualScroll);
    
    // Setup intersection observer for performance monitoring
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            virtualScroll.resume();
          } else {
            virtualScroll.pause();
          }
        });
      });
      
      observer.observe(container);
      this.observers.push(observer);
    }
  }

  /**
   * Setup memoization for expensive calculations
   */
  setupMemoization() {
    // Memoize chart data calculations
    this.memoizedChartData = this.memoize(this.calculateChartData.bind(this));
    
    // Memoize widget calculations
    this.memoizedWidgetData = this.memoize(this.calculateWidgetData.bind(this));
    
    // Memoize search results
    this.memoizedSearch = this.memoize(this.performSearch.bind(this));
  }

  /**
   * Generic memoization function
   */
  memoize(fn, maxSize = 100) {
    const cache = new Map();
    
    return (...args) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      
      // Implement LRU cache
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, result);
      return result;
    };
  }

  /**
   * Setup debouncing for input events
   */
  setupDebouncing() {
    // Debounce search inputs
    const searchInputs = document.querySelectorAll('input[type="search"], input[data-search]');
    
    searchInputs.forEach(input => {
      input.addEventListener('input', this.debounce((event) => {
        this.handleSearch(event.target.value);
      }, 300));
    });

    // Debounce resize events
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 150));
  }

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Setup RAF-based scheduling for DOM updates
   */
  setupRAFScheduling() {
    this.scheduleUpdate = () => {
      if (this.rafId) return;
      
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates();
        this.rafId = null;
      });
    };
  }

  /**
   * Flush pending DOM updates
   */
  flushUpdates() {
    if (this.pendingUpdates.size === 0) return;
    
    const updates = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    
    // Batch DOM reads and writes
    const reads = [];
    const writes = [];
    
    updates.forEach(update => {
      if (update.type === 'read') {
        reads.push(update);
      } else {
        writes.push(update);
      }
    });
    
    // Execute all reads first
    reads.forEach(update => update.callback());
    
    // Then all writes
    writes.forEach(update => update.callback());
  }

  /**
   * Schedule a DOM update
   */
  scheduleUpdate(type, callback) {
    this.pendingUpdates.add({ type, callback });
    this.scheduleUpdate();
  }

  /**
   * Setup memory management
   */
  setupMemoryManagement() {
    // Clear memoization cache periodically
    setInterval(() => {
      this.clearOldCacheEntries();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        this.checkMemoryUsage();
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Clear old cache entries
   */
  clearOldCacheEntries() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    
    for (const [key, entry] of this.memoCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.memoCache.delete(key);
      }
    }
  }

  /**
   * Check memory usage and clear cache if needed
   */
  checkMemoryUsage() {
    if (!performance.memory) return;
    
    const memoryInfo = performance.memory;
    const usagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100;
    
    if (usagePercent > 80) {
      console.warn('High memory usage detected, clearing caches');
      this.clearAllCaches();
    }
  }

  /**
   * Clear all caches
   */
  clearAllCaches() {
    this.memoCache.clear();
    
    // Clear virtual scroll caches
    this.virtualScrollInstances.forEach(instance => {
      instance.clearCache();
    });
  }

  /**
   * Calculate chart data (memoized)
   */
  calculateChartData(ships, chartType) {
    switch (chartType) {
      case 'progress':
        return this.calculateProgressData(ships);
      case 'vehicles':
        return this.calculateVehicleData(ships);
      case 'status':
        return this.calculateStatusData(ships);
      default:
        return null;
    }
  }

  /**
   * Calculate progress chart data
   */
  calculateProgressData(ships) {
    const completed = ships.filter(ship => ship.progress >= 100).length;
    const inProgress = ships.filter(ship => ship.progress > 0 && ship.progress < 100).length;
    const pending = ships.filter(ship => ship.progress === 0).length;
    
    return {
      labels: ['Completed', 'In Progress', 'Pending'],
      datasets: [{
        data: [completed, inProgress, pending],
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b']
      }]
    };
  }

  /**
   * Calculate vehicle distribution data
   */
  calculateVehicleData(ships) {
    const totals = ships.reduce((acc, ship) => {
      if (ship.vehicles) {
        acc.trucks += ship.vehicles.trucks || 0;
        acc.cranes += ship.vehicles.cranes || 0;
        acc.forklifts += ship.vehicles.forklifts || 0;
        acc.containers += ship.vehicles.containers || 0;
      }
      return acc;
    }, { trucks: 0, cranes: 0, forklifts: 0, containers: 0 });

    return {
      labels: ['Trucks', 'Cranes', 'Forklifts', 'Containers'],
      datasets: [{
        data: [totals.trucks, totals.cranes, totals.forklifts, totals.containers],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
      }]
    };
  }

  /**
   * Calculate status chart data
   */
  calculateStatusData(ships) {
    const statusCounts = ships.reduce((acc, ship) => {
      acc[ship.status] = (acc[ship.status] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['#22c55e', '#3b82f6', '#ef4444', '#f59e0b']
      }]
    };
  }

  /**
   * Calculate widget data (memoized)
   */
  calculateWidgetData(ships, widgetType) {
    // Implementation depends on widget type
    return { ships, widgetType };
  }

  /**
   * Perform search (memoized)
   */
  performSearch(query, data) {
    if (!query.trim()) return data;
    
    const lowercaseQuery = query.toLowerCase();
    return data.filter(item => {
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(lowercaseQuery)
      );
    });
  }

  /**
   * Handle search input
   */
  handleSearch(query) {
    const results = this.memoizedSearch(query, window.ships || []);
    
    // Schedule DOM update
    this.scheduleUpdate('write', () => {
      this.updateSearchResults(results);
    });
  }

  /**
   * Update search results in DOM
   */
  updateSearchResults(results) {
    const container = document.getElementById('search-results');
    if (!container) return;
    
    container.innerHTML = results.map(ship => `
      <div class="search-result-item">
        <h3>${ship.vesselName}</h3>
        <p>Status: ${ship.status}</p>
        <p>Progress: ${ship.progress}%</p>
      </div>
    `).join('');
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.virtualScrollInstances.forEach(instance => {
      instance.handleResize();
    });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.virtualScrollInstances.forEach(instance => instance.destroy());
    
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    
    this.memoCache.clear();
    this.debounceTimers.clear();
  }
}

/**
 * Virtual Scroller implementation
 */
class VirtualScroller {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.data = [];
    this.visibleItems = [];
    this.scrollTop = 0;
    this.containerHeight = 0;
    this.totalHeight = 0;
    this.startIndex = 0;
    this.endIndex = 0;
    this.isActive = true;
    
    this.init();
  }

  init() {
    this.setupContainer();
    this.setupEventListeners();
    this.calculateDimensions();
  }

  setupContainer() {
    this.container.style.overflow = 'auto';
    this.container.style.position = 'relative';
    
    // Create virtual content
    this.virtualContent = document.createElement('div');
    this.virtualContent.style.position = 'absolute';
    this.virtualContent.style.top = '0';
    this.virtualContent.style.left = '0';
    this.virtualContent.style.right = '0';
    
    // Create spacer for total height
    this.spacer = document.createElement('div');
    this.spacer.style.position = 'absolute';
    this.spacer.style.top = '0';
    this.spacer.style.left = '0';
    this.spacer.style.right = '0';
    this.spacer.style.zIndex = '-1';
    
    this.container.appendChild(this.spacer);
    this.container.appendChild(this.virtualContent);
  }

  setupEventListeners() {
    this.container.addEventListener('scroll', this.handleScroll.bind(this));
  }

  calculateDimensions() {
    this.containerHeight = this.container.clientHeight;
    this.totalHeight = this.data.length * this.config.itemHeight;
    this.spacer.style.height = `${this.totalHeight}px`;
  }

  handleScroll() {
    if (!this.isActive) return;
    
    this.scrollTop = this.container.scrollTop;
    this.updateVisibleRange();
    this.renderVisibleItems();
  }

  updateVisibleRange() {
    const buffer = this.config.bufferSize;
    
    this.startIndex = Math.max(0, 
      Math.floor(this.scrollTop / this.config.itemHeight) - buffer
    );
    
    this.endIndex = Math.min(this.data.length - 1,
      Math.ceil((this.scrollTop + this.containerHeight) / this.config.itemHeight) + buffer
    );
  }

  renderVisibleItems() {
    const fragment = document.createDocumentFragment();
    
    for (let i = this.startIndex; i <= this.endIndex; i++) {
      const item = this.createItem(this.data[i], i);
      fragment.appendChild(item);
    }
    
    this.virtualContent.innerHTML = '';
    this.virtualContent.appendChild(fragment);
    
    // Update position
    this.virtualContent.style.transform = 
      `translateY(${this.startIndex * this.config.itemHeight}px)`;
  }

  createItem(data, index) {
    const item = document.createElement('div');
    item.className = 'virtual-item';
    item.style.height = `${this.config.itemHeight}px`;
    item.style.position = 'relative';
    
    // Custom item renderer
    if (this.config.itemRenderer) {
      item.innerHTML = this.config.itemRenderer(data, index);
    } else {
      item.innerHTML = `<div class="p-4 border-b">${JSON.stringify(data)}</div>`;
    }
    
    return item;
  }

  setData(data) {
    this.data = data;
    this.calculateDimensions();
    this.updateVisibleRange();
    this.renderVisibleItems();
  }

  handleResize() {
    this.calculateDimensions();
    this.updateVisibleRange();
    this.renderVisibleItems();
  }

  pause() {
    this.isActive = false;
  }

  resume() {
    this.isActive = true;
    this.handleScroll();
  }

  clearCache() {
    // Clear any cached DOM elements
    this.virtualContent.innerHTML = '';
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll);
    this.container.removeChild(this.spacer);
    this.container.removeChild(this.virtualContent);
  }
}

// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    performanceOptimizer.init();
  });
} else {
  performanceOptimizer.init();
}

// Export for global use
window.performanceOptimizer = performanceOptimizer;

export default performanceOptimizer;