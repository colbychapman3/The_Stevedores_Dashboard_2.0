// Push Notifications Manager for Maritime Operations
class PushNotificationManager {
    constructor() {
        this.publicVapidKey = 'BP8rKvXF6GVbFrtNz5Wq9C_jN5D6yA8Hs4I9xJ7kL8mN9oP0qR1sT2uV3wX4yZ5'; // Demo key
        this.subscription = null;
        this.permissionStatus = null;
        this.notificationQueue = [];
        this.isOnline = navigator.onLine;
        
        this.init();
    }

    async init() {
        this.checkSupport();
        await this.checkPermissionStatus();
        this.setupEventListeners();
        await this.initializeSubscription();
        this.setupOfflineQueue();
    }

    checkSupport() {
        if (!('serviceWorker' in navigator)) {
            console.warn('Service Workers not supported');
            return false;
        }

        if (!('PushManager' in window)) {
            console.warn('Push messaging not supported');
            return false;
        }

        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        console.log('Push notifications fully supported');
        return true;
    }

    async checkPermissionStatus() {
        if ('Notification' in window) {
            this.permissionStatus = Notification.permission;
            console.log('Notification permission:', this.permissionStatus);
        }
    }

    setupEventListeners() {
        // Listen for online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Listen for ship data updates to trigger notifications
        if (window.widgetManager) {
            window.widgetManager.eventTarget.addEventListener('widget:dataUpdate', (event) => {
                this.handleDataUpdate(event.detail);
            });
        }
    }

    async requestPermission() {
        if (this.permissionStatus === 'granted') {
            return true;
        }

        if (this.permissionStatus === 'denied') {
            this.showPermissionDeniedMessage();
            return false;
        }

        // Show permission request UI
        const userWantsNotifications = await this.showPermissionRequest();
        
        if (userWantsNotifications) {
            const permission = await Notification.requestPermission();
            this.permissionStatus = permission;
            
            if (permission === 'granted') {
                console.log('Notification permission granted');
                await this.initializeSubscription();
                this.showPermissionGrantedMessage();
                return true;
            } else {
                console.log('Notification permission denied');
                this.showPermissionDeniedMessage();
                return false;
            }
        }
        
        return false;
    }

    showPermissionRequest() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
            modal.innerHTML = `
                <div class="bg-white rounded-xl max-w-md w-full p-6">
                    <div class="text-center mb-6">
                        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-bell text-2xl text-blue-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 mb-2">Stay Updated on Ship Operations</h3>
                        <p class="text-gray-600 text-sm">Get instant notifications for critical ship operations, delays, and status updates.</p>
                    </div>
                    
                    <div class="space-y-3 mb-6">
                        <div class="flex items-center text-sm">
                            <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                            <span>Critical alerts and emergency situations</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <i class="fas fa-clock text-yellow-500 mr-3"></i>
                            <span>Operation delays and schedule changes</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <i class="fas fa-check-circle text-green-500 mr-3"></i>
                            <span>Operation completions and milestones</span>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button id="allow-notifications" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition">
                            Allow Notifications
                        </button>
                        <button id="deny-notifications" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold transition">
                            Not Now
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('#allow-notifications').onclick = () => {
                modal.remove();
                resolve(true);
            };

            modal.querySelector('#deny-notifications').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    }

    showPermissionGrantedMessage() {
        this.showNotificationMessage('Notifications Enabled!', 'You\'ll now receive important updates about ship operations.', 'success');
    }

    showPermissionDeniedMessage() {
        this.showNotificationMessage('Notifications Disabled', 'You can enable notifications later in your browser settings.', 'warning');
    }

    showNotificationMessage(title, message, type = 'info') {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
        
        notification.className = `fixed top-4 right-4 ${bgColor} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm`;
        notification.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'info'} mt-1 mr-3"></i>
                <div class="flex-1">
                    <div class="font-semibold">${title}</div>
                    <div class="text-sm opacity-90">${message}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 opacity-75 hover:opacity-100">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    async initializeSubscription() {
        if (!('serviceWorker' in navigator) || this.permissionStatus !== 'granted') {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            
            if (existingSubscription) {
                this.subscription = existingSubscription;
                console.log('Using existing push subscription');
                await this.sendSubscriptionToServer(existingSubscription);
            } else {
                // Create new subscription
                await this.createSubscription(registration);
            }
        } catch (error) {
            console.error('Error initializing push subscription:', error);
        }
    }

    async createSubscription(registration) {
        try {
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
            });

            this.subscription = subscription;
            console.log('Created new push subscription');
            
            await this.sendSubscriptionToServer(subscription);
        } catch (error) {
            console.error('Error creating push subscription:', error);
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: subscription,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('Subscription sent to server successfully');
            } else {
                console.error('Failed to send subscription to server');
            }
        } catch (error) {
            console.error('Error sending subscription to server:', error);
            
            // Queue for retry when online
            if (!this.isOnline) {
                this.notificationQueue.push({
                    type: 'subscription',
                    data: subscription,
                    timestamp: Date.now()
                });
            }
        }
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Send notification to server for broadcasting
    async sendNotification(type, title, message, data = {}) {
        const notification = {
            type,
            title,
            message,
            data,
            timestamp: new Date().toISOString(),
            priority: this.getNotificationPriority(type)
        };

        try {
            if (this.isOnline) {
                const response = await fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(notification)
                });

                if (response.ok) {
                    console.log('Notification sent successfully');
                } else {
                    throw new Error('Failed to send notification');
                }
            } else {
                // Queue for when back online
                this.notificationQueue.push({
                    type: 'notification',
                    data: notification,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Error sending notification:', error);
            
            // Show local notification as fallback
            this.showLocalNotification(title, message, type);
        }
    }

    showLocalNotification(title, message, type = 'info') {
        if (this.permissionStatus === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/static/icons/icon-192x192.png',
                badge: '/static/icons/icon-72x72.png',
                tag: `stevedores-${type}-${Date.now()}`,
                requireInteraction: type === 'critical',
                silent: false,
                timestamp: Date.now(),
                data: {
                    type,
                    timestamp: Date.now(),
                    url: window.location.origin
                }
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // Auto-close after 5 seconds for non-critical notifications
            if (type !== 'critical') {
                setTimeout(() => notification.close(), 5000);
            }
        }
    }

    getNotificationPriority(type) {
        const priorities = {
            'critical': 'high',
            'warning': 'normal',
            'info': 'low',
            'success': 'low'
        };
        return priorities[type] || 'normal';
    }

    // Handle ship data updates for automatic notifications
    handleDataUpdate(data) {
        if (!data.shipData) return;

        const ship = data.shipData;
        
        // Check for critical conditions
        if (ship.status === 'emergency') {
            this.sendNotification('critical', 
                '🚨 Emergency Alert', 
                `Emergency situation reported for ${ship.vesselName}`, 
                { shipId: ship.id, type: 'emergency' }
            );
        }
        
        // Check for completion
        if (ship.progress >= 100 && ship.status !== 'complete') {
            this.sendNotification('success', 
                '✅ Operation Complete', 
                `${ship.vesselName} operation has been completed successfully`, 
                { shipId: ship.id, type: 'completion' }
            );
        }
        
        // Check for delays (if estimated completion time is exceeded)
        if (ship.estimatedCompletion && new Date() > new Date(ship.estimatedCompletion)) {
            this.sendNotification('warning', 
                '⚠️ Operation Delayed', 
                `${ship.vesselName} operation is running behind schedule`, 
                { shipId: ship.id, type: 'delay' }
            );
        }
    }

    setupOfflineQueue() {
        // Process queue when coming back online
        window.addEventListener('online', () => {
            this.processOfflineQueue();
        });
    }

    async processOfflineQueue() {
        if (this.notificationQueue.length === 0) return;

        console.log(`Processing ${this.notificationQueue.length} queued notifications`);

        const queue = [...this.notificationQueue];
        this.notificationQueue = [];

        for (const item of queue) {
            try {
                if (item.type === 'subscription') {
                    await this.sendSubscriptionToServer(item.data);
                } else if (item.type === 'notification') {
                    const response = await fetch('/api/notifications/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(item.data)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to send queued notification');
                    }
                }
            } catch (error) {
                console.error('Error processing queued notification:', error);
                // Re-queue if still failing
                this.notificationQueue.push(item);
            }
        }
    }

    // Public methods for manual notification sending
    async sendCriticalAlert(title, message, shipId = null) {
        await this.sendNotification('critical', title, message, { shipId, type: 'critical' });
    }

    async sendWarning(title, message, shipId = null) {
        await this.sendNotification('warning', title, message, { shipId, type: 'warning' });
    }

    async sendInfo(title, message, shipId = null) {
        await this.sendNotification('info', title, message, { shipId, type: 'info' });
    }

    async sendSuccess(title, message, shipId = null) {
        await this.sendNotification('success', title, message, { shipId, type: 'success' });
    }

    // Unsubscribe from notifications
    async unsubscribe() {
        if (this.subscription) {
            try {
                await this.subscription.unsubscribe();
                
                // Notify server
                await fetch('/api/notifications/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        endpoint: this.subscription.endpoint
                    })
                });

                this.subscription = null;
                console.log('Unsubscribed from push notifications');
            } catch (error) {
                console.error('Error unsubscribing:', error);
            }
        }
    }

    // Get notification settings
    getSettings() {
        return {
            permissionStatus: this.permissionStatus,
            isSubscribed: !!this.subscription,
            isSupported: this.checkSupport(),
            queueSize: this.notificationQueue.length
        };
    }
}

// Initialize notification manager
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new PushNotificationManager();
});

// Global functions for easy access
window.requestNotificationPermission = async () => {
    if (window.notificationManager) {
        return await window.notificationManager.requestPermission();
    }
};

window.sendTestNotification = () => {
    if (window.notificationManager) {
        window.notificationManager.sendInfo('Test Notification', 'This is a test notification from Stevedores Dashboard');
    }
};