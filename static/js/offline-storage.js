// Enhanced Offline Storage Manager for Stevedores Dashboard 2.0
class OfflineStorageManager {
    constructor() {
        this.storageKeys = {
            ships: 'ships_data_v2',
            analytics: 'analytics_data_v2',
            settings: 'app_settings_v2',
            lastSync: 'last_sync_time_v2',
            operationQueue: 'operation_queue_v2',
            cache: 'api_cache_v2'
        };
        this.init();
    }

    init() {
        // Initialize storage if not exists
        if (!localStorage.getItem(this.storageKeys.ships)) {
            localStorage.setItem(this.storageKeys.ships, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.storageKeys.analytics)) {
            localStorage.setItem(this.storageKeys.analytics, JSON.stringify({}));
        }
        if (!localStorage.getItem(this.storageKeys.settings)) {
            localStorage.setItem(this.storageKeys.settings, JSON.stringify({
                theme: 'light',
                autoRefresh: true,
                refreshInterval: 30000,
                offlineMode: false
            }));
        }
        if (!localStorage.getItem(this.storageKeys.operationQueue)) {
            localStorage.setItem(this.storageKeys.operationQueue, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.storageKeys.cache)) {
            localStorage.setItem(this.storageKeys.cache, JSON.stringify({}));
        }
    }

    // Ship data management with enhanced features
    saveShips(ships) {
        try {
            localStorage.setItem(this.storageKeys.ships, JSON.stringify(ships));
            this.updateLastSync();
            this.cacheData('/api/ships', ships);
            return true;
        } catch (error) {
            console.error('Failed to save ships data:', error);
            return false;
        }
    }

    getShips() {
        try {
            const data = localStorage.getItem(this.storageKeys.ships);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to get ships data:', error);
            return [];
        }
    }

    addShip(ship) {
        const ships = this.getShips();
        ship.id = ship.id || this.generateId();
        ship.createdAt = ship.createdAt || new Date().toISOString();
        ship.updatedAt = new Date().toISOString();
        ships.push(ship);
        return this.saveShips(ships);
    }

    updateShip(shipId, updates) {
        const ships = this.getShips();
        const index = ships.findIndex(s => s.id === shipId);
        if (index !== -1) {
            ships[index] = { 
                ...ships[index], 
                ...updates, 
                updatedAt: new Date().toISOString() 
            };
            return this.saveShips(ships);
        }
        return false;
    }

    deleteShip(shipId) {
        const ships = this.getShips();
        const filteredShips = ships.filter(s => s.id !== shipId);
        return this.saveShips(filteredShips);
    }

    // Analytics data management
    saveAnalytics(analytics) {
        try {
            localStorage.setItem(this.storageKeys.analytics, JSON.stringify(analytics));
            this.updateLastSync();
            this.cacheData('/api/analytics', analytics);
            return true;
        } catch (error) {
            console.error('Failed to save analytics data:', error);
            return false;
        }
    }

    getAnalytics() {
        try {
            const data = localStorage.getItem(this.storageKeys.analytics);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to get analytics data:', error);
            return {};
        }
    }

    // Settings management
    saveSettings(settings) {
        try {
            const currentSettings = this.getSettings();
            const mergedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.storageKeys.settings, JSON.stringify(mergedSettings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    getSettings() {
        try {
            const data = localStorage.getItem(this.storageKeys.settings);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to get settings:', error);
            return {};
        }
    }

    // Cache management
    cacheData(url, data) {
        try {
            const cache = this.getCache();
            cache[url] = {
                data: data,
                timestamp: new Date().toISOString(),
                ttl: 300000 // 5 minutes default TTL
            };
            localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
            return true;
        } catch (error) {
            console.error('Failed to cache data:', error);
            return false;
        }
    }

    getCachedData(url) {
        try {
            const cache = this.getCache();
            const cached = cache[url];
            
            if (!cached) return null;
            
            const now = new Date().getTime();
            const cachedTime = new Date(cached.timestamp).getTime();
            
            // Check if cache is still valid
            if (now - cachedTime > cached.ttl) {
                delete cache[url];
                localStorage.setItem(this.storageKeys.cache, JSON.stringify(cache));
                return null;
            }
            
            return cached.data;
        } catch (error) {
            console.error('Failed to get cached data:', error);
            return null;
        }
    }

    getCache() {
        try {
            const data = localStorage.getItem(this.storageKeys.cache);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to get cache:', error);
            return {};
        }
    }

    clearCache() {
        localStorage.setItem(this.storageKeys.cache, JSON.stringify({}));
    }

    // Sync management
    updateLastSync() {
        localStorage.setItem(this.storageKeys.lastSync, new Date().toISOString());
    }

    getLastSync() {
        return localStorage.getItem(this.storageKeys.lastSync);
    }

    // Network status
    isOnline() {
        return navigator.onLine;
    }

    // Operation queue for offline operations
    queueOperation(operation) {
        try {
            const queue = this.getOperationQueue();
            const queuedOperation = {
                ...operation,
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                retryCount: 0,
                maxRetries: 3
            };
            queue.push(queuedOperation);
            localStorage.setItem(this.storageKeys.operationQueue, JSON.stringify(queue));
            return queuedOperation.id;
        } catch (error) {
            console.error('Failed to queue operation:', error);
            return null;
        }
    }

    getOperationQueue() {
        try {
            const data = localStorage.getItem(this.storageKeys.operationQueue);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to get operation queue:', error);
            return [];
        }
    }

    clearOperationQueue() {
        localStorage.setItem(this.storageKeys.operationQueue, JSON.stringify([]));
    }

    // Process queued operations when back online
    async processQueuedOperations() {
        if (!this.isOnline()) return [];

        const queue = this.getOperationQueue();
        const processedOperations = [];
        const failedOperations = [];

        for (const operation of queue) {
            try {
                const response = await fetch(operation.url, {
                    method: operation.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...operation.headers
                    },
                    body: operation.body ? JSON.stringify(operation.body) : null
                });

                if (response.ok) {
                    const data = await response.json();
                    processedOperations.push({ operation, response: data });
                    
                    // Update local data based on operation type
                    this.handleSuccessfulOperation(operation, data);
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Failed to process queued operation:', error);
                operation.retryCount = (operation.retryCount || 0) + 1;
                
                if (operation.retryCount < operation.maxRetries) {
                    failedOperations.push(operation);
                } else {
                    console.error('Max retries reached for operation:', operation);
                }
            }
        }

        // Update queue with failed operations only
        localStorage.setItem(this.storageKeys.operationQueue, JSON.stringify(failedOperations));

        return processedOperations;
    }

    handleSuccessfulOperation(operation, response) {
        // Update local storage based on successful operations
        if (operation.url.includes('/api/ships')) {
            if (operation.method === 'POST' && response.id) {
                // Update the local ship with the server-assigned ID
                const ships = this.getShips();
                const localShip = ships.find(s => s.tempId === operation.tempId);
                if (localShip) {
                    localShip.id = response.id;
                    delete localShip.tempId;
                    this.saveShips(ships);
                }
            } else if (operation.method === 'PUT' || operation.method === 'DELETE') {
                // Refresh ships data
                this.fetchAndCacheShips();
            }
        }
    }

    // Enhanced API call with comprehensive offline fallback
    async apiCall(url, options = {}) {
        const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
        
        try {
            // Try online first
            if (this.isOnline()) {
                const response = await fetch(fullUrl, {
                    ...options,
                    timeout: 10000 // 10 second timeout
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Cache successful GET responses
                    if (!options.method || options.method === 'GET') {
                        this.cacheData(url, data);
                        
                        // Update local storage for specific endpoints
                        if (url.includes('/api/ships')) {
                            this.saveShips(data);
                        } else if (url.includes('/api/analytics')) {
                            this.saveAnalytics(data);
                        }
                    }
                    
                    return data;
                }
                
                throw new Error(`HTTP ${response.status}`);
            } else {
                throw new Error('Offline');
            }
        } catch (error) {
            console.warn('API call failed, using offline strategy:', error.message);
            
            // Handle offline or failed requests
            if (options.method && options.method !== 'GET') {
                // Queue write operations for later
                const operationId = this.queueOperation({
                    url: fullUrl,
                    method: options.method,
                    headers: options.headers,
                    body: options.body,
                    tempId: options.tempId
                });
                
                // For POST operations, return a temporary response
                if (options.method === 'POST') {
                    const tempResponse = {
                        ...options.body,
                        id: `temp_${Date.now()}`,
                        tempId: operationId,
                        _offline: true
                    };
                    
                    // Add to local storage immediately
                    if (url.includes('/api/ships')) {
                        this.addShip(tempResponse);
                    }
                    
                    return tempResponse;
                }
                
                return { success: true, queued: true, operationId };
            }
            
            // For GET requests, try cache first
            const cachedData = this.getCachedData(url);
            if (cachedData) {
                return cachedData;
            }
            
            // Fallback to local storage
            if (url.includes('/api/ships')) {
                return this.getShips();
            } else if (url.includes('/api/analytics')) {
                const analytics = this.getAnalytics();
                if (Object.keys(analytics).length === 0) {
                    return this.generateSampleAnalytics();
                }
                return analytics;
            }
            
            throw error;
        }
    }

    // Utility functions
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateSampleAnalytics() {
        return {
            totalHours: Math.floor(Math.random() * 500 + 200),
            shipsProcessed: Math.floor(Math.random() * 20 + 5),
            vehiclesHandled: Math.floor(Math.random() * 10000 + 5000),
            avgEfficiency: Math.floor(Math.random() * 20 + 80),
            dailyHours: Array.from({length: 30}, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
                hours: Math.floor(Math.random() * 16 + 8)
            })),
            vehicleTypes: {
                automobiles: Math.floor(Math.random() * 5000 + 3000),
                heavyEquipment: Math.floor(Math.random() * 500 + 200),
                electricVehicles: Math.floor(Math.random() * 300 + 100),
                staticCargo: Math.floor(Math.random() * 100 + 50)
            },
            zonePerformance: {
                zoneA: { vehicles: 1250, avgTime: 12, efficiency: 87 },
                zoneB: { vehicles: 1450, avgTime: 10, efficiency: 92 },
                zoneC: { vehicles: 980, avgTime: 15, efficiency: 83 }
            },
            teamPerformance: [
                { name: 'Colby Chapman', role: 'Auto Operations Lead', hours: 168, ships: 8, efficiency: 94 },
                { name: 'Cole Bailey', role: 'Auto Operations Assistant', hours: 156, ships: 7, efficiency: 89 },
                { name: 'Spencer Wilkins', role: 'Heavy Equipment Lead', hours: 144, ships: 6, efficiency: 91 },
                { name: 'Bruce Banner', role: 'Heavy Equipment Assistant', hours: 132, ships: 5, efficiency: 87 }
            ]
        };
    }

    // Data export/import for backup
    exportData() {
        return {
            ships: this.getShips(),
            analytics: this.getAnalytics(),
            settings: this.getSettings(),
            operationQueue: this.getOperationQueue(),
            cache: this.getCache(),
            lastSync: this.getLastSync(),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
    }

    importData(data) {
        try {
            if (data.ships) this.saveShips(data.ships);
            if (data.analytics) this.saveAnalytics(data.analytics);
            if (data.settings) this.saveSettings(data.settings);
            if (data.operationQueue) {
                localStorage.setItem(this.storageKeys.operationQueue, JSON.stringify(data.operationQueue));
            }
            if (data.cache) {
                localStorage.setItem(this.storageKeys.cache, JSON.stringify(data.cache));
            }
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Storage cleanup
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.init();
    }

    // Get storage usage info
    getStorageInfo() {
        const used = new Blob(Object.values(localStorage)).size;
        const quota = 5 * 1024 * 1024; // Estimate 5MB quota
        
        return {
            used: used,
            quota: quota,
            available: quota - used,
            usagePercent: (used / quota) * 100
        };
    }
}

// Initialize global storage manager
window.offlineStorage = new OfflineStorageManager();

// Handle online/offline events
window.addEventListener('online', async () => {
    console.log('Back online! Processing queued operations...');
    document.body.classList.remove('offline');
    
    // Show reconnection indicator
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
        indicator.textContent = '🔄 Reconnected! Syncing data...';
        indicator.style.backgroundColor = '#10b981';
    }
    
    try {
        const processed = await window.offlineStorage.processQueuedOperations();
        console.log(`Processed ${processed.length} queued operations`);
        
        // Update indicator
        if (indicator && processed.length > 0) {
            indicator.textContent = `✅ Synced ${processed.length} operations`;
            setTimeout(() => {
                indicator.style.transform = 'translateY(-100%)';
            }, 3000);
        } else if (indicator) {
            indicator.style.transform = 'translateY(-100%)';
        }
        
        // Refresh current page data
        if (window.location.pathname.includes('/master') && typeof loadShips === 'function') {
            loadShips();
        }
        if (window.location.pathname.includes('/analytics') && typeof updateAnalytics === 'function') {
            updateAnalytics();
        }
    } catch (error) {
        console.error('Error processing queued operations:', error);
        if (indicator) {
            indicator.textContent = '⚠️ Sync failed. Will retry automatically.';
            indicator.style.backgroundColor = '#f59e0b';
        }
    }
});

window.addEventListener('offline', () => {
    console.log('Gone offline! Switching to cached data...');
    document.body.classList.add('offline');
    
    // Show offline indicator
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
        indicator.style.transform = 'translateY(0)';
        indicator.textContent = '⚠️ You are offline. Changes will sync when reconnected.';
        indicator.style.backgroundColor = '#f59e0b';
    }
});

// Add offline indicator and styles
const offlineStyles = `
    .offline-indicator {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1000;
        transform: translateY(-100%);
        transition: transform 0.3s ease, background-color 0.3s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .offline .offline-indicator {
        transform: translateY(0);
    }
    
    .offline-data {
        border-left: 4px solid #f59e0b;
        background: #fef3c7;
        padding: 8px;
        margin: 8px 0;
        border-radius: 4px;
    }
    
    .offline-badge {
        display: inline-block;
        background: #f59e0b;
        color: white;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
        margin-left: 8px;
    }
    
    .temp-data {
        opacity: 0.8;
        border: 1px dashed #f59e0b;
    }
`;

// Add styles to page
const styleSheet = document.createElement('style');
styleSheet.textContent = offlineStyles;
document.head.appendChild(styleSheet);

// Add offline indicator to body
const offlineIndicator = document.createElement('div');
offlineIndicator.id = 'offline-indicator';
offlineIndicator.className = 'offline-indicator';
offlineIndicator.textContent = '⚠️ You are currently offline. Some features may not be available.';
document.body.appendChild(offlineIndicator);

// Check initial online status
if (!navigator.onLine) {
    document.body.classList.add('offline');
    offlineIndicator.style.transform = 'translateY(0)';
}