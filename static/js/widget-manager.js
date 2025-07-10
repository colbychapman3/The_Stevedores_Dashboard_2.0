// Widget Manager - Centralized widget communication system
class WidgetManager {
    constructor() {
        this.widgets = new Map();
        this.eventListeners = new Map();
        this.dataStore = new Map();
        this.updateQueue = new Set();
        this.isUpdating = false;
        
        // Initialize event system
        this.eventTarget = new EventTarget();
        
        // Setup periodic sync
        this.setupPeriodicSync();
        
        console.log('Widget Manager initialized');
    }

    // Register a widget with the manager
    registerWidget(id, widget) {
        if (this.widgets.has(id)) {
            console.warn(`Widget ${id} is already registered`);
            return false;
        }

        this.widgets.set(id, {
            id,
            instance: widget,
            dependencies: widget.dependencies || [],
            subscribers: new Set(),
            lastUpdate: Date.now(),
            data: widget.initialData || null
        });

        // Setup widget event listeners
        this.setupWidgetEventListeners(id, widget);
        
        console.log(`Widget ${id} registered successfully`);
        return true;
    }

    // Unregister a widget
    unregisterWidget(id) {
        if (!this.widgets.has(id)) {
            console.warn(`Widget ${id} is not registered`);
            return false;
        }

        const widget = this.widgets.get(id);
        
        // Remove all event listeners for this widget
        if (this.eventListeners.has(id)) {
            this.eventListeners.get(id).forEach(({ event, listener }) => {
                this.eventTarget.removeEventListener(event, listener);
            });
            this.eventListeners.delete(id);
        }

        // Remove from update queue
        this.updateQueue.delete(id);
        
        // Remove widget
        this.widgets.delete(id);
        
        console.log(`Widget ${id} unregistered successfully`);
        return true;
    }

    // Setup event listeners for a widget
    setupWidgetEventListeners(id, widget) {
        if (!widget.eventHandlers) return;

        const listeners = [];
        
        Object.entries(widget.eventHandlers).forEach(([event, handler]) => {
            const listener = (e) => {
                try {
                    handler.call(widget, e.detail);
                } catch (error) {
                    console.error(`Error in widget ${id} event handler for ${event}:`, error);
                }
            };
            
            this.eventTarget.addEventListener(event, listener);
            listeners.push({ event, listener });
        });

        this.eventListeners.set(id, listeners);
    }

    // Emit an event to all listening widgets
    emit(eventName, data = {}) {
        const event = new CustomEvent(eventName, {
            detail: {
                ...data,
                timestamp: Date.now(),
                source: data.source || 'widget-manager'
            }
        });

        this.eventTarget.dispatchEvent(event);
        console.log(`Event ${eventName} emitted:`, data);
    }

    // Update data for a specific widget and notify dependencies
    updateWidgetData(widgetId, data, options = {}) {
        if (!this.widgets.has(widgetId)) {
            console.warn(`Cannot update data: Widget ${widgetId} not found`);
            return false;
        }

        const widget = this.widgets.get(widgetId);
        
        // Store the data
        widget.data = { ...widget.data, ...data };
        widget.lastUpdate = Date.now();
        
        // Store in global data store
        this.dataStore.set(widgetId, widget.data);
        
        // Queue update for this widget
        this.queueUpdate(widgetId);
        
        // Emit data update event
        this.emit('widget:dataUpdate', {
            widgetId,
            data: widget.data,
            source: widgetId,
            propagate: options.propagate !== false
        });

        // Update dependent widgets if propagation is enabled
        if (options.propagate !== false) {
            this.updateDependentWidgets(widgetId, data);
        }

        console.log(`Data updated for widget ${widgetId}:`, data);
        return true;
    }

    // Update widgets that depend on the changed widget
    updateDependentWidgets(sourceWidgetId, data) {
        this.widgets.forEach((widget, widgetId) => {
            if (widget.dependencies.includes(sourceWidgetId)) {
                this.queueUpdate(widgetId);
                
                // Emit dependency update event
                this.emit('widget:dependencyUpdate', {
                    widgetId,
                    sourceWidgetId,
                    data,
                    timestamp: Date.now()
                });
            }
        });
    }

    // Queue a widget for update
    queueUpdate(widgetId) {
        this.updateQueue.add(widgetId);
        
        // Process updates on next tick
        if (!this.isUpdating) {
            setTimeout(() => this.processUpdateQueue(), 0);
        }
    }

    // Process all queued widget updates
    async processUpdateQueue() {
        if (this.isUpdating || this.updateQueue.size === 0) {
            return;
        }

        this.isUpdating = true;
        const updates = Array.from(this.updateQueue);
        this.updateQueue.clear();

        try {
            for (const widgetId of updates) {
                await this.updateWidget(widgetId);
            }
        } catch (error) {
            console.error('Error processing widget updates:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    // Update a specific widget
    async updateWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget || !widget.instance) {
            return;
        }

        try {
            // Call widget's update method if it exists
            if (typeof widget.instance.update === 'function') {
                await widget.instance.update(widget.data);
            }

            // Emit widget updated event
            this.emit('widget:updated', {
                widgetId,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(`Error updating widget ${widgetId}:`, error);
            
            // Emit error event
            this.emit('widget:error', {
                widgetId,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    // Get data for a specific widget
    getWidgetData(widgetId) {
        return this.dataStore.get(widgetId) || null;
    }

    // Get all widget data
    getAllWidgetData() {
        const data = {};
        this.dataStore.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }

    // Subscribe a widget to another widget's updates
    subscribe(subscriberWidgetId, targetWidgetId) {
        if (!this.widgets.has(subscriberWidgetId) || !this.widgets.has(targetWidgetId)) {
            console.warn(`Cannot subscribe: One or both widgets not found`);
            return false;
        }

        const targetWidget = this.widgets.get(targetWidgetId);
        targetWidget.subscribers.add(subscriberWidgetId);
        
        console.log(`Widget ${subscriberWidgetId} subscribed to ${targetWidgetId}`);
        return true;
    }

    // Unsubscribe a widget from another widget's updates
    unsubscribe(subscriberWidgetId, targetWidgetId) {
        if (!this.widgets.has(targetWidgetId)) {
            return false;
        }

        const targetWidget = this.widgets.get(targetWidgetId);
        targetWidget.subscribers.delete(subscriberWidgetId);
        
        console.log(`Widget ${subscriberWidgetId} unsubscribed from ${targetWidgetId}`);
        return true;
    }

    // Broadcast data to all widgets
    broadcast(data) {
        this.emit('widget:broadcast', {
            data,
            timestamp: Date.now()
        });

        // Queue updates for all widgets
        this.widgets.forEach((widget, widgetId) => {
            this.queueUpdate(widgetId);
        });
    }

    // Setup periodic synchronization
    setupPeriodicSync() {
        setInterval(() => {
            this.emit('widget:periodicSync', {
                timestamp: Date.now(),
                activeWidgets: Array.from(this.widgets.keys())
            });
        }, 30000); // Every 30 seconds
    }

    // Get widget status information
    getWidgetStatus(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) {
            return null;
        }

        return {
            id: widgetId,
            registered: true,
            lastUpdate: widget.lastUpdate,
            hasData: widget.data !== null,
            subscriberCount: widget.subscribers.size,
            dependencyCount: widget.dependencies.length
        };
    }

    // Get all widget statuses
    getAllWidgetStatuses() {
        const statuses = {};
        this.widgets.forEach((widget, widgetId) => {
            statuses[widgetId] = this.getWidgetStatus(widgetId);
        });
        return statuses;
    }

    // Initialize ship data integration
    initializeShipDataIntegration() {
        // Listen for ship data updates from offline storage
        if (window.offlineStorage) {
            window.addEventListener('shipDataUpdated', (event) => {
                this.broadcast({
                    type: 'shipDataUpdate',
                    shipData: event.detail
                });
            });
        }

        // Listen for chart updates
        this.eventTarget.addEventListener('chartUpdate', (event) => {
            this.updateWidgetData('charts', event.detail.data, { propagate: true });
        });

        // Listen for form updates
        this.eventTarget.addEventListener('formUpdate', (event) => {
            this.updateWidgetData('forms', event.detail.data, { propagate: true });
        });
    }

    // Debug methods
    debug() {
        console.group('Widget Manager Debug Info');
        console.log('Registered widgets:', Array.from(this.widgets.keys()));
        console.log('Data store:', this.getAllWidgetData());
        console.log('Update queue:', Array.from(this.updateQueue));
        console.log('Widget statuses:', this.getAllWidgetStatuses());
        console.groupEnd();
    }
}

// Create global widget manager instance
window.widgetManager = new WidgetManager();

// Initialize ship data integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.widgetManager.initializeShipDataIntegration();
});