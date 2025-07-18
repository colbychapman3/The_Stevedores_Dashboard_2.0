/**
 * Lazy Loading Module for Stevedores Dashboard
 * Implements dynamic imports and code splitting for optimal performance
 */

class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.observers = new Map();
    this.setupIntersectionObserver();
  }

  /**
   * Setup intersection observer for viewport-based lazy loading
   */
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target;
            const moduleId = element.dataset.lazyModule;
            if (moduleId && !this.loadedModules.has(moduleId)) {
              this.loadModule(moduleId, element);
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.1
      });
    }
  }

  /**
   * Register an element for lazy loading
   */
  observe(element, moduleId) {
    if (this.intersectionObserver) {
      element.dataset.lazyModule = moduleId;
      this.intersectionObserver.observe(element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadModule(moduleId, element);
    }
  }

  /**
   * Load a module dynamically
   */
  async loadModule(moduleId, element = null) {
    if (this.loadedModules.has(moduleId)) {
      return this.loadedModules.get(moduleId);
    }

    if (this.loadingPromises.has(moduleId)) {
      return this.loadingPromises.get(moduleId);
    }

    const loadingPromise = this.dynamicImport(moduleId);
    this.loadingPromises.set(moduleId, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleId, module);
      this.loadingPromises.delete(moduleId);
      
      if (element) {
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-loaded');
        this.intersectionObserver?.unobserve(element);
      }

      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleId);
      console.error(`Failed to load module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Dynamic import with fallback
   */
  async dynamicImport(moduleId) {
    const moduleMap = {
      'charts': () => import('./charts-lazy.js'),
      'analytics': () => import('./analytics-lazy.js'),
      'widgets': () => import('./widgets.js'),
      'widget-manager': () => import('./widget-manager.js'),
      'offline-storage': () => import('./offline-storage.js'),
      'wizard': () => import('./wizard.js'),
      'ship-info': () => import('./ship-info.js'),
      'pwa-install': () => import('./pwa-install.js'),
      'push-notifications': () => import('./push-notifications.js')
    };

    if (moduleMap[moduleId]) {
      return await moduleMap[moduleId]();
    } else {
      throw new Error(`Unknown module: ${moduleId}`);
    }
  }

  /**
   * Preload critical modules
   */
  async preloadCritical() {
    const criticalModules = ['widgets', 'widget-manager', 'offline-storage'];
    
    return Promise.all(
      criticalModules.map(moduleId => this.loadModule(moduleId))
    );
  }

  /**
   * Lazy load charts when needed
   */
  async loadCharts() {
    if (!this.loadedModules.has('charts')) {
      await this.loadModule('charts');
    }
    return this.loadedModules.get('charts');
  }

  /**
   * Lazy load analytics when needed
   */
  async loadAnalytics() {
    if (!this.loadedModules.has('analytics')) {
      await this.loadModule('analytics');
    }
    return this.loadedModules.get('analytics');
  }

  /**
   * Load module on user interaction
   */
  loadOnInteraction(element, moduleId, eventType = 'click') {
    const loadHandler = async (event) => {
      event.preventDefault();
      element.classList.add('lazy-loading');
      
      try {
        const module = await this.loadModule(moduleId, element);
        
        // Execute module initialization if available
        if (module.default && typeof module.default.init === 'function') {
          await module.default.init(element);
        }
        
        // Remove the interaction handler
        element.removeEventListener(eventType, loadHandler);
        
        // Trigger the original event if needed
        if (eventType === 'click') {
          element.click();
        }
      } catch (error) {
        element.classList.remove('lazy-loading');
        element.classList.add('lazy-error');
        console.error(`Failed to load module on ${eventType}:`, error);
      }
    };

    element.addEventListener(eventType, loadHandler, { once: true });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }
}

// Create global lazy loader instance
window.lazyLoader = new LazyLoader();

// Export for module use
export default LazyLoader;