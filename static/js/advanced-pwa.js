/**
 * Advanced PWA Features Module
 * Implements push notifications, background sync, and app install prompts
 */

class AdvancedPWAManager {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.installPrompt = null;
    this.isInstalled = false;
    this.backgroundSyncQueue = [];
    
    this.config = {
      vapidPublicKey: 'BK8mGzrTIEJY0QaAE7K9QkY6J5E8mGzrTIEJY0QaAE7K9QkY6J5E8mGzrTIEJY0QaAE7K9QkY6J5E8mGzrTIEJY0QaAE7K9QkY6J5E8mGzrTIEJY0QaAE7K9QkY6',
      notificationEndpoint: '/api/notifications/subscribe',
      backgroundSyncTag: 'stevedores-background-sync',
      installPromptDelay: 30000 // 30 seconds
    };
    
    this.init();
  }

  /**
   * Initialize Advanced PWA Features
   */
  async init() {
    try {
      await this.initializeServiceWorker();
      await this.initializePushNotifications();
      this.initializeBackgroundSync();
      this.initializeAppInstallPrompt();
      this.initializeOfflineAnalytics();
      this.setupPWAEventListeners();
      
      console.log('Advanced PWA features initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Advanced PWA features:', error);
    }
  }

  /**
   * Initialize Service Worker
   */
  async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/static/sw-enhanced.js');
        console.log('Service Worker registered successfully');
        
        // Handle service worker updates
        this.registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate();
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Initialize Push Notifications
   */
  async initializePushNotifications() {
    if (!('Notification' in window) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    // Request permission
    const permission = await this.requestNotificationPermission();
    if (permission === 'granted') {
      await this.subscribeToPushNotifications();
      this.setupNotificationHandlers();
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission() {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications() {
    try {
      const applicationServerKey = this.urlB64ToUint8Array(this.config.vapidPublicKey);
      
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);
      
      console.log('Push notification subscription successful');
    } catch (error) {
      console.error('Push notification subscription failed:', error);
    }
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(this.config.notificationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userId: this.getCurrentUserId(),
          preferences: this.getNotificationPreferences()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  /**
   * Setup notification handlers
   */
  setupNotificationHandlers() {
    // Handle notification clicks
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
          this.handleNotificationClick(event.data);
        }
      });
    }

    // Handle push events
    this.setupPushEventHandlers();
  }

  /**
   * Setup push event handlers
   */
  setupPushEventHandlers() {
    const notificationTypes = {
      'ship_arrival': {
        title: '🚢 Ship Arrival',
        icon: '/static/icons/ship-arrival.png',
        badge: '/static/icons/badge.png',
        tag: 'ship-arrival'
      },
      'operation_complete': {
        title: '✅ Operation Complete',
        icon: '/static/icons/operation-complete.png',
        badge: '/static/icons/badge.png',
        tag: 'operation'
      },
      'alert_critical': {
        title: '🚨 Critical Alert',
        icon: '/static/icons/alert-critical.png',
        badge: '/static/icons/badge.png',
        tag: 'alert',
        requireInteraction: true
      },
      'maintenance_due': {
        title: '🔧 Maintenance Due',
        icon: '/static/icons/maintenance.png',
        badge: '/static/icons/badge.png',
        tag: 'maintenance'
      }
    };

    // Store notification types globally for service worker
    if (typeof window !== 'undefined') {
      window.notificationTypes = notificationTypes;
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(type, data) {
    if (Notification.permission !== 'granted') {
      return;
    }

    const notificationConfig = window.notificationTypes[type] || {
      title: 'Stevedores Dashboard',
      icon: '/static/icons/default.png'
    };

    const options = {
      body: data.message,
      icon: notificationConfig.icon,
      badge: notificationConfig.badge,
      tag: notificationConfig.tag,
      data: data,
      requireInteraction: notificationConfig.requireInteraction || false,
      actions: this.getNotificationActions(type),
      timestamp: Date.now()
    };

    const notification = new Notification(notificationConfig.title, options);
    
    notification.onclick = (event) => {
      event.preventDefault();
      this.handleNotificationClick({ type, data });
    };

    return notification;
  }

  /**
   * Get notification actions based on type
   */
  getNotificationActions(type) {
    const actions = {
      'ship_arrival': [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      'alert_critical': [
        { action: 'acknowledge', title: 'Acknowledge' },
        { action: 'escalate', title: 'Escalate' }
      ],
      'operation_complete': [
        { action: 'view', title: 'View Report' },
        { action: 'next', title: 'Next Task' }
      ]
    };

    return actions[type] || [{ action: 'view', title: 'View' }];
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(data) {
    switch (data.type) {
      case 'ship_arrival':
        window.location.href = `/ship-info.html?id=${data.data.shipId}`;
        break;
      case 'operation_complete':
        window.location.href = `/master-dashboard.html#operations`;
        break;
      case 'alert_critical':
        window.location.href = `/alerts.html?id=${data.data.alertId}`;
        break;
      default:
        window.location.href = '/master-dashboard.html';
    }
  }

  /**
   * Initialize Background Sync
   */
  initializeBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.setupBackgroundSync();
      this.setupSyncEventHandlers();
    } else {
      console.warn('Background sync not supported');
    }
  }

  /**
   * Setup background sync
   */
  setupBackgroundSync() {
    // Queue operations for background sync
    this.queueBackgroundSync = async (operation) => {
      this.backgroundSyncQueue.push({
        id: this.generateId(),
        operation: operation,
        timestamp: Date.now(),
        retryCount: 0
      });

      // Store in IndexedDB
      await this.persistBackgroundSyncQueue();

      // Register sync event
      if (this.registration && this.registration.sync) {
        try {
          await this.registration.sync.register(this.config.backgroundSyncTag);
        } catch (error) {
          console.error('Background sync registration failed:', error);
        }
      }
    };
  }

  /**
   * Setup sync event handlers
   */
  setupSyncEventHandlers() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
          this.handleSyncComplete(event.data);
        }
      });
    }
  }

  /**
   * Handle sync complete
   */
  handleSyncComplete(data) {
    console.log('Background sync completed:', data);
    
    // Update UI to reflect synced changes
    if (data.syncedOperations) {
      data.syncedOperations.forEach(operation => {
        this.updateUIAfterSync(operation);
      });
    }

    // Show success notification
    this.sendLocalNotification('sync_complete', {
      message: `${data.syncedOperations.length} operations synchronized`
    });
  }

  /**
   * Update UI after sync
   */
  updateUIAfterSync(operation) {
    // Dispatch events to update UI components
    const event = new CustomEvent('backgroundSyncComplete', {
      detail: { operation }
    });
    window.dispatchEvent(event);
  }

  /**
   * Initialize App Install Prompt
   */
  initializeAppInstallPrompt() {
    // Check if app is already installed
    this.checkIfAppInstalled();

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.installPrompt = event;
      
      // Show install prompt after delay
      setTimeout(() => {
        this.showInstallPrompt();
      }, this.config.installPromptDelay);
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallPrompt();
      this.trackAppInstall();
    });
  }

  /**
   * Check if app is already installed
   */
  checkIfAppInstalled() {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      return;
    }

    // Check if navigator.standalone is true (iOS)
    if (navigator.standalone) {
      this.isInstalled = true;
      return;
    }

    // Check if app is installed via other means
    if (document.referrer.includes('android-app://')) {
      this.isInstalled = true;
      return;
    }
  }

  /**
   * Show install prompt
   */
  showInstallPrompt() {
    if (this.installPrompt && !this.isInstalled) {
      const installBanner = this.createInstallBanner();
      document.body.appendChild(installBanner);
    }
  }

  /**
   * Create install banner
   */
  createInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-install-content">
        <div class="pwa-install-info">
          <img src="/static/icons/icon-192x192.png" alt="App Icon" class="pwa-install-icon">
          <div class="pwa-install-text">
            <h3>Install Stevedores Dashboard</h3>
            <p>Get quick access and work offline</p>
          </div>
        </div>
        <div class="pwa-install-actions">
          <button id="pwa-install-btn" class="pwa-install-accept">Install</button>
          <button id="pwa-install-dismiss" class="pwa-install-dismiss">Maybe Later</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .pwa-install-banner {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        padding: 16px;
        max-width: 400px;
        margin: 0 auto;
      }
      
      .pwa-install-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .pwa-install-info {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      
      .pwa-install-icon {
        width: 48px;
        height: 48px;
        border-radius: 8px;
      }
      
      .pwa-install-text h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .pwa-install-text p {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #666;
      }
      
      .pwa-install-actions {
        display: flex;
        gap: 8px;
        flex-direction: column;
      }
      
      .pwa-install-accept {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 500;
      }
      
      .pwa-install-dismiss {
        background: transparent;
        color: #666;
        border: none;
        padding: 4px 8px;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);

    // Add event listeners
    banner.querySelector('#pwa-install-btn').addEventListener('click', () => {
      this.handleInstallClick();
    });

    banner.querySelector('#pwa-install-dismiss').addEventListener('click', () => {
      this.hideInstallPrompt();
    });

    return banner;
  }

  /**
   * Handle install click
   */
  async handleInstallClick() {
    if (this.installPrompt) {
      this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        this.trackAppInstall();
      }
      
      this.installPrompt = null;
      this.hideInstallPrompt();
    }
  }

  /**
   * Hide install prompt
   */
  hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  /**
   * Track app install
   */
  trackAppInstall() {
    // Track install event
    if (window.performanceMonitor) {
      window.performanceMonitor.trackEvent('pwa_install', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
    }
  }

  /**
   * Initialize Offline Analytics
   */
  initializeOfflineAnalytics() {
    this.offlineAnalytics = {
      sessions: [],
      interactions: [],
      errors: []
    };

    // Track offline usage
    this.trackOfflineUsage();
    
    // Sync analytics when online
    this.syncOfflineAnalytics();
  }

  /**
   * Track offline usage
   */
  trackOfflineUsage() {
    window.addEventListener('online', () => {
      this.trackConnectivityChange('online');
    });

    window.addEventListener('offline', () => {
      this.trackConnectivityChange('offline');
    });

    // Track page views while offline
    if (!navigator.onLine) {
      this.trackOfflinePageView();
    }
  }

  /**
   * Track connectivity change
   */
  trackConnectivityChange(status) {
    const event = {
      type: 'connectivity_change',
      status: status,
      timestamp: Date.now(),
      url: location.href
    };

    this.offlineAnalytics.interactions.push(event);
    this.persistOfflineAnalytics();
  }

  /**
   * Sync offline analytics
   */
  async syncOfflineAnalytics() {
    if (navigator.onLine && this.offlineAnalytics.interactions.length > 0) {
      try {
        await fetch('/api/analytics/offline', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.offlineAnalytics)
        });

        // Clear synced analytics
        this.offlineAnalytics = {
          sessions: [],
          interactions: [],
          errors: []
        };
      } catch (error) {
        console.error('Failed to sync offline analytics:', error);
      }
    }
  }

  /**
   * Setup PWA event listeners
   */
  setupPWAEventListeners() {
    // Service worker update notification
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.showUpdateNotification();
      });
    }

    // App lifecycle events
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleAppPause();
      } else {
        this.handleAppResume();
      }
    });
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span>🔄 New version available!</span>
        <button onclick="location.reload()">Update Now</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 10000);
  }

  /**
   * Handle app pause
   */
  handleAppPause() {
    this.persistOfflineAnalytics();
    this.persistBackgroundSyncQueue();
  }

  /**
   * Handle app resume
   */
  handleAppResume() {
    this.syncOfflineAnalytics();
  }

  /**
   * Utility functions
   */
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getCurrentUserId() {
    return localStorage.getItem('userId') || 'anonymous';
  }

  getNotificationPreferences() {
    return JSON.parse(localStorage.getItem('notificationPreferences') || '{}');
  }

  async persistBackgroundSyncQueue() {
    localStorage.setItem('backgroundSyncQueue', JSON.stringify(this.backgroundSyncQueue));
  }

  async persistOfflineAnalytics() {
    localStorage.setItem('offlineAnalytics', JSON.stringify(this.offlineAnalytics));
  }

  trackOfflinePageView() {
    this.offlineAnalytics.interactions.push({
      type: 'page_view',
      url: location.href,
      timestamp: Date.now(),
      offline: true
    });
  }

  /**
   * Handle service worker update
   */
  handleServiceWorkerUpdate() {
    const newWorker = this.registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          this.showUpdateNotification();
        }
      }
    });
  }

  /**
   * Get PWA status
   */
  getPWAStatus() {
    return {
      isInstalled: this.isInstalled,
      notificationsEnabled: Notification.permission === 'granted',
      backgroundSyncSupported: 'sync' in window.ServiceWorkerRegistration.prototype,
      serviceWorkerActive: !!navigator.serviceWorker.controller,
      offlineReady: this.backgroundSyncQueue.length > 0
    };
  }
}

// Initialize Advanced PWA Manager
const advancedPWAManager = new AdvancedPWAManager();

// Export for global use
window.advancedPWAManager = advancedPWAManager;

export default advancedPWAManager;