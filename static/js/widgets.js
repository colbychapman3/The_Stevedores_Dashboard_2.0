// Widget Base Classes and Implementations

// Base Widget Class
class BaseWidget {
    constructor(id, element, options = {}) {
        this.id = id;
        this.element = element;
        this.options = { ...this.getDefaultOptions(), ...options };
        this.data = null;
        this.isVisible = true;
        this.lastUpdate = null;
        
        // Event handlers that this widget responds to
        this.eventHandlers = {};
        
        // Widgets this widget depends on
        this.dependencies = [];
        
        this.initialize();
    }

    getDefaultOptions() {
        return {
            autoUpdate: true,
            updateInterval: 5000,
            showLoader: true
        };
    }

    initialize() {
        // Override in subclasses
        this.setupEventHandlers();
        this.render();
    }

    setupEventHandlers() {
        // Base event handlers
        this.eventHandlers = {
            'widget:dataUpdate': this.handleDataUpdate.bind(this),
            'widget:broadcast': this.handleBroadcast.bind(this),
            'widget:periodicSync': this.handlePeriodicSync.bind(this)
        };
    }

    handleDataUpdate(data) {
        if (data.propagate && this.dependencies.includes(data.widgetId)) {
            this.refresh();
        }
    }

    handleBroadcast(data) {
        if (data.data.type === 'shipDataUpdate') {
            this.updateFromShipData(data.data.shipData);
        }
    }

    handlePeriodicSync(data) {
        if (this.options.autoUpdate) {
            this.refresh();
        }
    }

    updateFromShipData(shipData) {
        // Override in subclasses
        this.data = shipData;
        this.render();
    }

    async update(data) {
        this.data = data;
        this.lastUpdate = Date.now();
        
        if (this.options.showLoader) {
            this.showLoader();
        }
        
        try {
            await this.render();
        } finally {
            if (this.options.showLoader) {
                this.hideLoader();
            }
        }
    }

    async render() {
        // Override in subclasses
        console.log(`Rendering widget ${this.id}`);
    }

    refresh() {
        if (window.widgetManager) {
            window.widgetManager.queueUpdate(this.id);
        }
    }

    show() {
        if (!this.isVisible) {
            this.element.classList.remove('widget-disabled');
            this.isVisible = true;
            this.refresh();
        }
    }

    hide() {
        if (this.isVisible) {
            this.element.classList.add('widget-disabled');
            this.isVisible = false;
        }
    }

    showLoader() {
        if (!this.element.querySelector('.widget-loader')) {
            const loader = document.createElement('div');
            loader.className = 'widget-loader absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10';
            loader.innerHTML = '<i class="fas fa-spinner fa-spin text-2xl text-blue-600"></i>';
            this.element.style.position = 'relative';
            this.element.appendChild(loader);
        }
    }

    hideLoader() {
        const loader = this.element.querySelector('.widget-loader');
        if (loader) {
            loader.remove();
        }
    }

    emit(eventName, data) {
        if (window.widgetManager) {
            window.widgetManager.emit(eventName, { ...data, source: this.id });
        }
    }

    getElement(selector) {
        return this.element.querySelector(selector);
    }

    getAllElements(selector) {
        return this.element.querySelectorAll(selector);
    }
}

// Hourly Productivity Widget
class HourlyProductivityWidget extends BaseWidget {
    constructor(id, element, options = {}) {
        super(id, element, options);
        this.chart = null;
        this.dependencies = ['ship-data'];
    }

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            chartType: 'line',
            showBestWorst: true
        };
    }

    initialize() {
        super.initialize();
        this.initializeChart();
    }

    initializeChart() {
        const canvas = this.getElement('#hourlyProductivityChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Vehicles per Hour',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + ' cars';
                            }
                        }
                    }
                }
            }
        });
    }

    updateFromShipData(shipData) {
        super.updateFromShipData(shipData);
        this.generateHourlyData(shipData);
    }

    generateHourlyData(shipData) {
        const currentHour = new Date().getHours();
        const hourlyData = [];
        const labels = [];
        
        // Generate data for past 8 hours
        for (let i = 7; i >= 0; i--) {
            const hour = currentHour - i;
            const hourLabel = hour < 0 ? (24 + hour) : hour;
            const timeLabel = `${hourLabel.toString().padStart(2, '0')}:00`;
            
            labels.push(timeLabel);
            
            // Generate realistic data based on ship info
            let carsThisHour = 0;
            if (shipData && shipData.totalVehicles) {
                const expectedRate = shipData.expectedRate || 150;
                const hourProgress = (8 - i) / 8;
                const baseRate = expectedRate * (1.2 - hourProgress * 0.4);
                carsThisHour = Math.max(0, Math.round(baseRate + (Math.random() * 40 - 20)));
            } else {
                carsThisHour = Math.round(120 + (Math.random() * 60));
            }
            
            hourlyData.push(carsThisHour);
        }

        // Update chart
        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = hourlyData;
            this.chart.update();
        }

        // Update best/worst displays
        if (this.options.showBestWorst) {
            this.updateBestWorstDisplay(hourlyData, labels);
        }

        // Emit productivity update event
        this.emit('productivity:update', {
            hourlyData,
            labels,
            avgRate: hourlyData.reduce((a, b) => a + b, 0) / hourlyData.length
        });
    }

    updateBestWorstDisplay(hourlyData, labels) {
        const maxIndex = hourlyData.indexOf(Math.max(...hourlyData));
        const minIndex = hourlyData.indexOf(Math.min(...hourlyData));

        const bestHourElement = this.getElement('#bestHour');
        const worstHourElement = this.getElement('#worstHour');

        if (bestHourElement) {
            bestHourElement.textContent = `${labels[maxIndex]} (${hourlyData[maxIndex]} cars)`;
        }

        if (worstHourElement) {
            worstHourElement.textContent = `${labels[minIndex]} (${hourlyData[minIndex]} cars)`;
        }
    }

    async render() {
        if (!this.data) return;
        
        // Update chart with current data
        this.generateHourlyData(this.data);
    }
}

// Deck Progress Widget
class DeckProgressWidget extends BaseWidget {
    constructor(id, element, options = {}) {
        super(id, element, options);
        this.dependencies = ['ship-data', 'hourly-productivity'];
        this.deckData = this.generateDeckData();
    }

    setupEventHandlers() {
        super.setupEventHandlers();
        this.eventHandlers['productivity:update'] = this.handleProductivityUpdate.bind(this);
    }

    handleProductivityUpdate(data) {
        // Update deck progress based on productivity data
        this.updateDeckProgress(data.avgRate);
    }

    generateDeckData() {
        return [
            { name: 'Upper Deck', total: 450, completed: Math.floor(Math.random() * 450), color: 'bg-blue-500' },
            { name: 'Main Deck', total: 680, completed: Math.floor(Math.random() * 680), color: 'bg-green-500' },
            { name: 'Lower Deck', total: 320, completed: Math.floor(Math.random() * 320), color: 'bg-purple-500' },
            { name: 'Cargo Hold', total: 150, completed: Math.floor(Math.random() * 150), color: 'bg-orange-500' }
        ];
    }

    updateDeckProgress(avgRate) {
        // Simulate deck progress based on productivity rate
        this.deckData.forEach(deck => {
            const progressRate = (avgRate / 150) * 10; // Normalize to deck progress
            deck.completed = Math.min(deck.total, deck.completed + Math.floor(progressRate));
        });
        
        this.render();
    }

    updateFromShipData(shipData) {
        super.updateFromShipData(shipData);
        
        if (shipData && shipData.totalVehicles) {
            // Distribute vehicles across decks based on ship data
            const totalVehicles = shipData.totalVehicles;
            const distribution = [0.3, 0.45, 0.2, 0.05]; // Upper, Main, Lower, Cargo percentages
            
            this.deckData.forEach((deck, index) => {
                deck.total = Math.floor(totalVehicles * distribution[index]);
                deck.completed = Math.floor(deck.total * (shipData.progress || 0) / 100);
            });
        }
    }

    async render() {
        const container = this.getElement('.deck-progress-container') || this.createDeckContainer();
        
        container.innerHTML = this.deckData.map(deck => {
            const percentage = deck.total > 0 ? Math.round((deck.completed / deck.total) * 100) : 0;
            const isComplete = percentage >= 100;
            
            return `
                <div class="deck-row flex items-center p-3 rounded-lg border transition-all hover:shadow-md ${isComplete ? 'deck-complete' : 'bg-gray-50'}">
                    <div class="flex-1">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-semibold ${isComplete ? 'text-white' : 'text-gray-800'}">${deck.name}</span>
                            <span class="text-sm ${isComplete ? 'text-white' : 'text-gray-600'}">${deck.completed}/${deck.total} (${percentage}%)</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="${deck.color} h-2 rounded-full transition-all duration-300" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                    ${isComplete ? '<i class="fas fa-check-circle text-white text-xl ml-3"></i>' : ''}
                </div>
            `;
        }).join('');

        // Emit deck progress update
        this.emit('deck:update', {
            deckData: this.deckData,
            totalProgress: this.calculateOverallProgress()
        });
    }

    createDeckContainer() {
        const container = document.createElement('div');
        container.className = 'deck-progress-container space-y-3';
        
        const targetElement = this.getElement('.bg-white.rounded-xl.shadow-lg.p-6');
        if (targetElement) {
            targetElement.appendChild(container);
        }
        
        return container;
    }

    calculateOverallProgress() {
        const totalVehicles = this.deckData.reduce((sum, deck) => sum + deck.total, 0);
        const completedVehicles = this.deckData.reduce((sum, deck) => sum + deck.completed, 0);
        
        return totalVehicles > 0 ? Math.round((completedVehicles / totalVehicles) * 100) : 0;
    }
}

// Zone Allocation Widget
class ZoneAllocationWidget extends BaseWidget {
    constructor(id, element, options = {}) {
        super(id, element, options);
        this.dependencies = ['ship-data', 'deck-progress'];
        this.zoneData = this.generateZoneData();
    }

    setupEventHandlers() {
        super.setupEventHandlers();
        this.eventHandlers['deck:update'] = this.handleDeckUpdate.bind(this);
    }

    handleDeckUpdate(data) {
        // Update zone allocation based on deck progress
        this.updateZoneAllocation(data.totalProgress);
    }

    generateZoneData() {
        return [
            { name: 'Zone A', allocated: 245, capacity: 300, efficiency: 87 },
            { name: 'Zone B', allocated: 189, capacity: 250, efficiency: 92 },
            { name: 'Zone C', allocated: 156, capacity: 200, efficiency: 83 }
        ];
    }

    updateZoneAllocation(overallProgress) {
        // Adjust zone allocations based on overall progress
        this.zoneData.forEach(zone => {
            const progressFactor = overallProgress / 100;
            zone.allocated = Math.floor(zone.capacity * progressFactor * (0.7 + Math.random() * 0.3));
            zone.efficiency = Math.max(75, Math.min(95, zone.efficiency + (Math.random() * 10 - 5)));
        });
        
        this.render();
    }

    async render() {
        const container = this.getElement('.zone-allocation-container') || this.createZoneContainer();
        
        container.innerHTML = this.zoneData.map(zone => {
            const utilization = Math.round((zone.allocated / zone.capacity) * 100);
            const utilizationColor = utilization > 90 ? 'text-red-600' : utilization > 70 ? 'text-yellow-600' : 'text-green-600';
            
            return `
                <div class="zone-item bg-gray-50 p-3 rounded-lg">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-semibold text-gray-800">${zone.name}</span>
                        <span class="text-sm ${utilizationColor}">${utilization}%</span>
                    </div>
                    <div class="text-xs text-gray-600 mb-1">
                        ${zone.allocated}/${zone.capacity} vehicles
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${utilization}%"></div>
                    </div>
                    <div class="text-xs text-gray-500">
                        Efficiency: ${zone.efficiency}%
                    </div>
                </div>
            `;
        }).join('');

        // Emit zone allocation update
        this.emit('zone:update', {
            zoneData: this.zoneData,
            totalAllocated: this.zoneData.reduce((sum, zone) => sum + zone.allocated, 0),
            avgEfficiency: Math.round(this.zoneData.reduce((sum, zone) => sum + zone.efficiency, 0) / this.zoneData.length)
        });
    }

    createZoneContainer() {
        const container = document.createElement('div');
        container.className = 'zone-allocation-container space-y-3';
        
        const targetElement = this.getElement('.bg-white.rounded-xl.shadow-lg.p-6');
        if (targetElement) {
            targetElement.appendChild(container);
        }
        
        return container;
    }
}

// Hourly Tracker Widget
class HourlyTrackerWidget extends BaseWidget {
    constructor(id, element, options = {}) {
        super(id, element, options);
        this.dependencies = ['hourly-productivity', 'zone-allocation'];
        this.trackerData = this.generateTrackerData();
    }

    setupEventHandlers() {
        super.setupEventHandlers();
        this.eventHandlers['productivity:update'] = this.handleProductivityUpdate.bind(this);
        this.eventHandlers['zone:update'] = this.handleZoneUpdate.bind(this);
    }

    handleProductivityUpdate(data) {
        this.trackerData.currentRate = data.avgRate;
        this.render();
    }

    handleZoneUpdate(data) {
        this.trackerData.efficiency = data.avgEfficiency;
        this.render();
    }

    generateTrackerData() {
        return {
            target: 150,
            currentRate: 145,
            efficiency: 88,
            hoursRemaining: 4.2,
            estimatedCompletion: '18:30'
        };
    }

    async render() {
        const container = this.getElement('.hourly-tracker-container') || this.createTrackerContainer();
        
        const progressPercentage = Math.round((this.trackerData.currentRate / this.trackerData.target) * 100);
        const statusColor = progressPercentage >= 100 ? 'text-green-600' : progressPercentage >= 80 ? 'text-yellow-600' : 'text-red-600';
        const statusIcon = progressPercentage >= 100 ? 'fa-check-circle' : progressPercentage >= 80 ? 'fa-clock' : 'fa-exclamation-triangle';
        
        container.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div class="text-center p-3 bg-blue-50 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${this.trackerData.currentRate}</div>
                    <div class="text-sm text-gray-600">Current Rate</div>
                </div>
                <div class="text-center p-3 bg-green-50 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${this.trackerData.target}</div>
                    <div class="text-sm text-gray-600">Target Rate</div>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-1">
                    <span>Progress to Target</span>
                    <span class="${statusColor}">${progressPercentage}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full transition-all" style="width: ${Math.min(100, progressPercentage)}%"></div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 gap-3">
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-600">Efficiency</span>
                    <span class="font-semibold">${this.trackerData.efficiency}%</span>
                </div>
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span class="text-sm text-gray-600">Est. Completion</span>
                    <span class="font-semibold">${this.trackerData.estimatedCompletion}</span>
                </div>
                <div class="flex justify-between items-center p-2 rounded ${statusColor.replace('text-', 'bg-').replace('-600', '-50')}">
                    <span class="text-sm ${statusColor}">Status</span>
                    <i class="fas ${statusIcon} ${statusColor}"></i>
                </div>
            </div>
        `;
    }

    createTrackerContainer() {
        const container = document.createElement('div');
        container.className = 'hourly-tracker-container';
        
        const targetElement = this.getElement('.bg-white.rounded-xl.shadow-lg.p-6');
        if (targetElement) {
            targetElement.appendChild(container);
        }
        
        return container;
    }
}

// Widget Factory
class WidgetFactory {
    static createWidget(type, id, element, options) {
        switch (type) {
            case 'hourly-productivity':
                return new HourlyProductivityWidget(id, element, options);
            case 'deck-progress':
                return new DeckProgressWidget(id, element, options);
            case 'zone-allocation':
                return new ZoneAllocationWidget(id, element, options);
            case 'hourly-tracker':
                return new HourlyTrackerWidget(id, element, options);
            default:
                return new BaseWidget(id, element, options);
        }
    }
    
    static getAvailableTypes() {
        return ['hourly-productivity', 'deck-progress', 'zone-allocation', 'hourly-tracker'];
    }
}

// Export for use in other files
window.WidgetFactory = WidgetFactory;
window.BaseWidget = BaseWidget;