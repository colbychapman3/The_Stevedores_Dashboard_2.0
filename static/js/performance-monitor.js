/**
 * Performance Monitoring Module
 * Real-time performance tracking and optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      navigation: {},
      resources: [],
      interactions: [],
      errors: [],
      memory: {},
      fps: []
    };
    
    this.thresholds = {
      pageLoad: 3000, // 3 seconds
      interaction: 100, // 100ms
      fps: 30,
      memory: 50 // 50MB
    };
    
    this.observers = [];
    this.isMonitoring = false;
    
    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isMonitoring) return;
    
    this.setupPageLoadMetrics();
    this.setupNavigationMetrics();
    this.setupResourceMetrics();
    this.setupInteractionMetrics();
    this.setupErrorTracking();
    this.setupMemoryMonitoring();
    this.setupFPSMonitoring();
    this.setupReporting();
    
    this.isMonitoring = true;
    console.log('Performance monitoring initialized');
  }

  /**
   * Setup page load metrics
   */
  setupPageLoadMetrics() {
    window.addEventListener('load', () => {
      if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        this.metrics.pageLoad = {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart,
          dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcpConnection: perfData.connectEnd - perfData.connectStart,
          serverResponse: perfData.responseStart - perfData.requestStart,
          domProcessing: perfData.domComplete - perfData.domLoading,
          timestamp: Date.now()
        };
        
        this.analyzePageLoad();
      }
    });
  }

  /**
   * Setup navigation metrics
   */
  setupNavigationMetrics() {
    let navigationStart = performance.now();
    
    // Track SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      const navigationTime = performance.now() - navigationStart;
      this.recordNavigation(navigationTime, args[2]);
      navigationStart = performance.now();
      return originalPushState.apply(history, args);
    }.bind(this);
    
    history.replaceState = function(...args) {
      const navigationTime = performance.now() - navigationStart;
      this.recordNavigation(navigationTime, args[2]);
      navigationStart = performance.now();
      return originalReplaceState.apply(history, args);
    }.bind(this);
    
    window.addEventListener('popstate', () => {
      const navigationTime = performance.now() - navigationStart;
      this.recordNavigation(navigationTime, location.pathname);
      navigationStart = performance.now();
    });
  }

  /**
   * Record navigation timing
   */
  recordNavigation(time, url) {
    this.metrics.navigation[url] = {
      time,
      timestamp: Date.now()
    };
    
    if (time > this.thresholds.pageLoad) {
      this.reportSlowNavigation(url, time);
    }
  }

  /**
   * Setup resource metrics
   */
  setupResourceMetrics() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.metrics.resources.push({
              name: entry.name,
              type: this.getResourceType(entry.name),
              duration: entry.duration,
              size: entry.transferSize,
              timestamp: entry.startTime
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  /**
   * Get resource type from URL
   */
  getResourceType(url) {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'style';
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.svg')) return 'image';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * Setup interaction metrics
   */
  setupInteractionMetrics() {
    const interactionTypes = ['click', 'input', 'scroll', 'keydown'];
    
    interactionTypes.forEach(type => {
      document.addEventListener(type, (event) => {
        const startTime = performance.now();
        
        // Use RAF to measure interaction response time
        requestAnimationFrame(() => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.metrics.interactions.push({
            type,
            target: event.target.tagName,
            duration,
            timestamp: Date.now()
          });
          
          if (duration > this.thresholds.interaction) {
            this.reportSlowInteraction(type, duration);
          }
        });
      }, { passive: true });
    });
  }

  /**
   * Setup error tracking
   */
  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.metrics.errors.push({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now()
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errors.push({
        type: 'promise',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        timestamp: Date.now()
      });
    });
  }

  /**
   * Setup memory monitoring
   */
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        this.metrics.memory = {
          used: memInfo.usedJSHeapSize,
          total: memInfo.totalJSHeapSize,
          limit: memInfo.jsHeapSizeLimit,
          timestamp: Date.now()
        };
        
        const usedMB = memInfo.usedJSHeapSize / (1024 * 1024);
        if (usedMB > this.thresholds.memory) {
          this.reportHighMemoryUsage(usedMB);
        }
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Setup FPS monitoring
   */
  setupFPSMonitoring() {
    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        this.metrics.fps.push({
          value: fps,
          timestamp: Date.now()
        });
        
        if (fps < this.thresholds.fps) {
          this.reportLowFPS(fps);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  /**
   * Setup reporting
   */
  setupReporting() {
    // Report metrics every 5 minutes
    setInterval(() => {
      this.generateReport();
    }, 5 * 60 * 1000);
    
    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.sendBeaconReport();
    });
  }

  /**
   * Analyze page load performance
   */
  analyzePageLoad() {
    const { pageLoad } = this.metrics;
    
    if (pageLoad.totalTime > this.thresholds.pageLoad) {
      console.warn(`Slow page load detected: ${pageLoad.totalTime}ms`);
      
      // Identify bottlenecks
      const bottlenecks = [];
      if (pageLoad.dnsLookup > 200) bottlenecks.push('DNS lookup');
      if (pageLoad.tcpConnection > 100) bottlenecks.push('TCP connection');
      if (pageLoad.serverResponse > 500) bottlenecks.push('Server response');
      if (pageLoad.domProcessing > 1000) bottlenecks.push('DOM processing');
      
      if (bottlenecks.length > 0) {
        console.warn('Performance bottlenecks:', bottlenecks);
      }
    }
  }

  /**
   * Report slow navigation
   */
  reportSlowNavigation(url, time) {
    console.warn(`Slow navigation to ${url}: ${time}ms`);
    
    // Could send to analytics service
    this.sendMetric('slow_navigation', {
      url,
      time,
      timestamp: Date.now()
    });
  }

  /**
   * Report slow interaction
   */
  reportSlowInteraction(type, duration) {
    console.warn(`Slow ${type} interaction: ${duration}ms`);
    
    this.sendMetric('slow_interaction', {
      type,
      duration,
      timestamp: Date.now()
    });
  }

  /**
   * Report high memory usage
   */
  reportHighMemoryUsage(usedMB) {
    console.warn(`High memory usage: ${usedMB}MB`);
    
    this.sendMetric('high_memory', {
      used: usedMB,
      timestamp: Date.now()
    });
  }

  /**
   * Report low FPS
   */
  reportLowFPS(fps) {
    console.warn(`Low FPS detected: ${fps}`);
    
    this.sendMetric('low_fps', {
      fps,
      timestamp: Date.now()
    });
  }

  /**
   * Send metric to analytics
   */
  sendMetric(type, data) {
    // Store locally for now
    const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    metrics.push({ type, data });
    
    // Keep only last 100 metrics
    if (metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(metrics));
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      pageLoad: this.metrics.pageLoad,
      navigation: Object.keys(this.metrics.navigation).length,
      resources: this.metrics.resources.length,
      interactions: this.metrics.interactions.length,
      errors: this.metrics.errors.length,
      memory: this.metrics.memory,
      fps: this.metrics.fps.slice(-10), // Last 10 FPS measurements
      summary: this.generateSummary()
    };
    
    console.log('Performance Report:', report);
    return report;
  }

  /**
   * Generate performance summary
   */
  generateSummary() {
    const now = Date.now();
    const last5Min = now - (5 * 60 * 1000);
    
    // Recent interactions
    const recentInteractions = this.metrics.interactions
      .filter(i => i.timestamp > last5Min);
    
    const avgInteractionTime = recentInteractions.length > 0
      ? recentInteractions.reduce((sum, i) => sum + i.duration, 0) / recentInteractions.length
      : 0;
    
    // Recent FPS
    const recentFPS = this.metrics.fps.filter(f => f.timestamp > last5Min);
    const avgFPS = recentFPS.length > 0
      ? recentFPS.reduce((sum, f) => sum + f.value, 0) / recentFPS.length
      : 0;
    
    return {
      averageInteractionTime: Math.round(avgInteractionTime),
      averageFPS: Math.round(avgFPS),
      errorCount: this.metrics.errors.filter(e => e.timestamp > last5Min).length,
      memoryUsage: this.metrics.memory.used ? Math.round(this.metrics.memory.used / (1024 * 1024)) : 0
    };
  }

  /**
   * Send beacon report on page unload
   */
  sendBeaconReport() {
    if ('sendBeacon' in navigator) {
      const report = this.generateReport();
      const blob = new Blob([JSON.stringify(report)], { type: 'application/json' });
      
      // Would send to analytics endpoint
      // navigator.sendBeacon('/api/analytics/performance', blob);
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      summary: this.generateSummary()
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics() {
    this.metrics = {
      pageLoad: {},
      navigation: {},
      resources: [],
      interactions: [],
      errors: [],
      memory: {},
      fps: []
    };
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.observers.forEach(observer => observer.disconnect());
    this.isMonitoring = false;
  }
}

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Export for global use
window.performanceMonitor = performanceMonitor;

export default performanceMonitor;