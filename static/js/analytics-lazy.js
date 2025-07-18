/**
 * Lazy-loaded Analytics Module
 * Advanced analytics and reporting functionality
 */

class AnalyticsManager {
  constructor() {
    this.data = [];
    this.metrics = {};
    this.observers = [];
  }

  /**
   * Initialize analytics tracking
   */
  async init() {
    this.setupPerformanceTracking();
    this.setupUserActivityTracking();
    this.calculateMetrics();
    
    // Load analytics dashboard if element exists
    const analyticsContainer = document.getElementById('analytics-container');
    if (analyticsContainer) {
      this.renderAnalyticsDashboard(analyticsContainer);
    }
  }

  /**
   * Setup performance tracking
   */
  setupPerformanceTracking() {
    if ('performance' in window) {
      // Track page load time
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        this.trackEvent('page_load', {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart
        });
      });

      // Track resource loading
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.trackEvent('resource_load', {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize
            });
          }
        });
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    }
  }

  /**
   * Setup user activity tracking
   */
  setupUserActivityTracking() {
    // Track click events
    document.addEventListener('click', (event) => {
      if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
        this.trackEvent('button_click', {
          element: event.target.textContent || event.target.getAttribute('aria-label'),
          timestamp: Date.now()
        });
      }
    });

    // Track navigation
    let currentPage = location.pathname;
    const trackPageView = () => {
      if (location.pathname !== currentPage) {
        this.trackEvent('page_view', {
          from: currentPage,
          to: location.pathname,
          timestamp: Date.now()
        });
        currentPage = location.pathname;
      }
    };

    window.addEventListener('popstate', trackPageView);
    
    // Track time spent on page
    let pageStartTime = Date.now();
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_exit', {
        timeSpent: Date.now() - pageStartTime,
        page: location.pathname
      });
    });
  }

  /**
   * Track custom events
   */
  trackEvent(eventType, data) {
    const event = {
      type: eventType,
      data: data,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };

    this.data.push(event);
    
    // Store in local storage (with size limit)
    this.persistData();
    
    // Update real-time metrics
    this.updateMetrics(event);
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Persist data to local storage
   */
  persistData() {
    try {
      // Keep only last 1000 events to prevent storage overflow
      const recentData = this.data.slice(-1000);
      localStorage.setItem('analytics_data', JSON.stringify(recentData));
    } catch (error) {
      console.warn('Failed to persist analytics data:', error);
    }
  }

  /**
   * Load persisted data
   */
  loadPersistedData() {
    try {
      const stored = localStorage.getItem('analytics_data');
      if (stored) {
        this.data = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load persisted analytics data:', error);
    }
  }

  /**
   * Calculate metrics from data
   */
  calculateMetrics() {
    if (this.data.length === 0) return;

    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const recentData = this.data.filter(event => event.timestamp > last24h);

    this.metrics = {
      totalEvents: this.data.length,
      recentEvents: recentData.length,
      pageViews: this.data.filter(e => e.type === 'page_view').length,
      buttonClicks: this.data.filter(e => e.type === 'button_click').length,
      avgLoadTime: this.calculateAverageLoadTime(),
      topPages: this.getTopPages(),
      userActivity: this.getUserActivityPattern()
    };
  }

  /**
   * Calculate average page load time
   */
  calculateAverageLoadTime() {
    const loadEvents = this.data.filter(e => e.type === 'page_load');
    if (loadEvents.length === 0) return 0;

    const totalTime = loadEvents.reduce((sum, event) => sum + event.data.totalTime, 0);
    return Math.round(totalTime / loadEvents.length);
  }

  /**
   * Get top visited pages
   */
  getTopPages() {
    const pageViews = this.data.filter(e => e.type === 'page_view');
    const pageCount = {};
    
    pageViews.forEach(event => {
      const page = event.data.to;
      pageCount[page] = (pageCount[page] || 0) + 1;
    });

    return Object.entries(pageCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([page, count]) => ({ page, count }));
  }

  /**
   * Get user activity pattern
   */
  getUserActivityPattern() {
    const hours = Array(24).fill(0);
    
    this.data.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hours[hour]++;
    });

    return hours;
  }

  /**
   * Update metrics with new event
   */
  updateMetrics(event) {
    this.metrics.totalEvents = (this.metrics.totalEvents || 0) + 1;
    
    if (event.type === 'page_view') {
      this.metrics.pageViews = (this.metrics.pageViews || 0) + 1;
    } else if (event.type === 'button_click') {
      this.metrics.buttonClicks = (this.metrics.buttonClicks || 0) + 1;
    }
  }

  /**
   * Render analytics dashboard
   */
  renderAnalyticsDashboard(container) {
    const dashboard = document.createElement('div');
    dashboard.className = 'analytics-dashboard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
    
    dashboard.innerHTML = `
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Total Events</h3>
        <p class="text-3xl font-bold text-blue-600">${this.metrics.totalEvents || 0}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Page Views</h3>
        <p class="text-3xl font-bold text-green-600">${this.metrics.pageViews || 0}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Button Clicks</h3>
        <p class="text-3xl font-bold text-purple-600">${this.metrics.buttonClicks || 0}</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-2">Avg Load Time</h3>
        <p class="text-3xl font-bold text-orange-600">${this.metrics.avgLoadTime || 0}ms</p>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6 col-span-full">
        <h3 class="text-lg font-semibold mb-4">Top Pages</h3>
        <div class="space-y-2">
          ${(this.metrics.topPages || []).map(item => `
            <div class="flex justify-between items-center">
              <span class="text-sm">${item.page}</span>
              <span class="text-sm font-medium">${item.count} views</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    container.appendChild(dashboard);
  }

  /**
   * Export analytics data
   */
  exportData(format = 'json') {
    const data = {
      metrics: this.metrics,
      events: this.data,
      exportDate: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      return this.convertToCSV(this.data);
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    const headers = ['Type', 'Timestamp', 'Session ID', 'Data'];
    const rows = data.map(event => [
      event.type,
      new Date(event.timestamp).toISOString(),
      event.sessionId,
      JSON.stringify(event.data)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create and export analytics manager
const analyticsManager = new AnalyticsManager();

export default {
  init: async (element) => {
    analyticsManager.loadPersistedData();
    await analyticsManager.init();
    return analyticsManager;
  },
  analyticsManager,
  trackEvent: (type, data) => analyticsManager.trackEvent(type, data)
};