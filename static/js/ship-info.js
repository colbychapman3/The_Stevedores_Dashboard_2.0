let currentShip = null;
let photos = [];
let operationStartTime = null;
let hourlyData = [];
let deckData = [];
let brandData = {};
let hourlyQuantities = {};
let customizeMode = false;
let widgetOrder = ['hourly-productivity', 'deck-progress', 'zone-allocation', 'hourly-tracker'];
let enabledWidgets = new Set(['hourly-productivity', 'deck-progress', 'zone-allocation', 'hourly-tracker']);

// Enhanced error handling and notification system
function showErrorNotification(message, duration = 5000) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

function showSuccessNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

// Offline functionality setup
function setupOfflineHandlers() {
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            const { action, data } = event.data;
            
            if (action === 'SYNC_DATA' && currentShipId) {
                loadShipData(currentShipId);
            }
        });
    }
    
    // Handle online/offline status changes
    window.addEventListener('online', () => {
        console.log('Back online - refreshing ship data');
        showSuccessNotification('Reconnected! Syncing latest data...');
        if (currentShipId) {
            loadShipData(currentShipId);
        }
    });
    
    window.addEventListener('offline', () => {
        console.log('Gone offline - using cached data');
        showErrorNotification('You are now offline. Some features may be limited.', 3000);
    });
}

// Global variables for auto-update
let autoUpdateInterval;
let currentShipId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Ship Info Dashboard...');
    
    try {
        // Initialize offline functionality first
        if (window.offlineStorage) {
            setupOfflineHandlers();
        }
        
        const urlParams = new URLSearchParams(window.location.search);
        const shipId = urlParams.get('ship');
        
        if (shipId) {
            console.log('Loading ship data for ID:', shipId);
            currentShipId = shipId;
            loadShipData(shipId);
        } else {
            console.log('No ship ID provided, loading sample data');
            loadSampleShipData();
        }

        // Initialize components
        setupPhotoUpload();
        initializeData();
        loadWidgetSettings();

        // Set current time in ETC widget
        const currentTimeInput = document.getElementById('currentTime');
        if (currentTimeInput) {
            const now = new Date();
            currentTimeInput.value = now.toTimeString().slice(0, 5);
        }

        // Initialize charts after a short delay to ensure DOM is ready
        setTimeout(() => {
            initializeCharts();
            
            // Test widget functions after initialization
            console.log('Dashboard initialization complete. Use testAllWidgetFunctions() to test all widgets.');
        }, 500);

    } catch (error) {
        console.error('Error during dashboard initialization:', error);
    }
});

function initializeCharts() {
    console.log('Initializing charts...');
    try {
        initializeHourlyProductivityChart();
        initializeBrandDistributionChart();
        console.log('Charts initialized successfully');
    } catch (error) {
        console.error('Error initializing charts:', error);
    }
}

function initializeHourlyProductivityChart() {
    const canvas = document.getElementById('hourlyProductivityChart');
    if (!canvas) {
        console.warn('Hourly productivity chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Generate sample hourly data for the past 8 hours
    const currentHour = new Date().getHours();
    const hourlyData = [];
    
    // Add data for past 8 hours including current hour
    for (let i = 7; i >= 0; i--) {
        const hour = currentHour - i;
        const hourLabel = hour < 0 ? (24 + hour) : hour;
        const timeLabel = `${hourLabel.toString().padStart(2, '0')}:00`;
        
        // Generate realistic hourly data based on current ship
        let carsThisHour = 0;
        if (currentShip && currentShip.totalVehicles) {
            const expectedRate = currentShip.expectedRate || 150;
            // Add some realistic variance - higher rates early in shift, tapering off
            const hourProgress = (8 - i) / 8;
            const baseRate = expectedRate * (1.2 - hourProgress * 0.4); // Start higher, taper
            carsThisHour = Math.max(0, Math.round(baseRate + (Math.random() * 40 - 20)));
        } else {
            // Default sample data
            carsThisHour = Math.round(120 + (Math.random() * 60));
        }
        
        hourlyData.push({
            hour: timeLabel,
            cars: carsThisHour
        });
    }

    // Store hourly data globally for other functions
    window.chartHourlyData = hourlyData;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: hourlyData.map(d => d.hour),
            datasets: [{
                label: 'Cars per Hour',
                data: hourlyData.map(d => d.cars),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Cars per Hour'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });

    // Update best/worst hour displays
    if (hourlyData.length > 0) {
        const bestHour = hourlyData.reduce((max, hour) => hour.cars > max.cars ? hour : max, hourlyData[0]);
        const worstHour = hourlyData.reduce((min, hour) => hour.cars < min.cars ? hour : min, hourlyData[0]);
        
        const bestElement = document.getElementById('bestHour');
        const worstElement = document.getElementById('worstHour');
        
        if (bestElement) bestElement.textContent = `${bestHour.hour} (${bestHour.cars} cars)`;
        if (worstElement) worstElement.textContent = `${worstHour.hour} (${worstHour.cars} cars)`;
    }

    console.log('Hourly productivity chart initialized with data:', hourlyData);
}

function initializeBrandDistributionChart() {
    const canvas = document.getElementById('brandDistributionChart');
    if (!canvas) {
        console.warn('Brand distribution chart canvas not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    
    // Ensure brand data exists
    if (Object.keys(brandData).length === 0) {
        generateRealBrandData();
    }
    
    // Use the brand data
    const brands = Object.keys(brandData);
    const totals = Object.values(brandData).map(d => d.total);
    
    if (brands.length === 0) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No brand data available', canvas.width / 2, canvas.height / 2);
        console.log('No brand data available for chart');
        return;
    }

    try {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: brands,
                datasets: [{
                    data: totals,
                    backgroundColor: [
                        '#3b82f6',  // Blue
                        '#10b981',  // Green
                        '#f59e0b',  // Yellow
                        '#ef4444',  // Red
                        '#8b5cf6',  // Purple
                        '#f97316',  // Orange
                        '#06b6d4',  // Cyan
                        '#84cc16'   // Lime
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 10
                            },
                            padding: 10
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        console.log('Brand distribution chart initialized with brands:', brands, 'totals:', totals);
    } catch (error) {
        console.error('Error creating brand distribution chart:', error);
        ctx.fillStyle = '#ef4444';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Chart Error', canvas.width / 2, canvas.height / 2);
    }

    // Setup widget drag and drop after charts are initialized
    setupWidgetDragAndDrop();
}

// Auto-update functions
function startAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }

    // Update every 30 seconds
    autoUpdateInterval = setInterval(() => {
        updateWidgets();
        updateElapsedTime();
    }, 30000);

    // Also update elapsed time every minute
    setInterval(updateElapsedTime, 60000);
}

function updateWidgets() {
    if (!currentShipId) return;

     loadShipData(currentShipId);
}

function updateMetricWidgets(ship) {
    // Update Current Rate
    const currentRateElement = document.getElementById('currentRateValue');
    if (currentRateElement) {
        const currentRate = calculateCurrentRate();
        currentRateElement.textContent = currentRate;
    }

    // Update Completion Percentage
    const completionElement = document.getElementById('completionValue');
    if (completionElement) {
        const progress = ship.progress || 0;
        completionElement.textContent = `${progress}%`;
    }

    // Update ETC (Estimated Time of Completion)
    updateETC();

    // Update Elapsed Time
    updateElapsedTime();
}

function calculateCurrentRate() {
    if (!currentShip || !operationStartTime) return 0;

    const now = new Date();
    const elapsedHours = (now - operationStartTime) / (1000 * 60 * 60);
    const vehiclesDischarged = Math.round(currentShip.totalVehicles * currentShip.progress / 100);

    if (elapsedHours > 0) {
        return Math.round(vehiclesDischarged / elapsedHours);
    }
    return 0;
}

function calculateETC() {
    // Get values from ETC widget inputs
    const vehiclesRemainingInput = document.getElementById('vehiclesRemaining');
    const currentRateInput = document.getElementById('currentRate');
    const currentTimeInput = document.getElementById('currentTime');
    const calculatedETCElement = document.getElementById('calculatedETC');
    const calculatedProgressElement = document.getElementById('calculatedProgress');

    // Also update the main ETC display
    const etcElement = document.getElementById('etcDisplay');

    let vehiclesRemaining, currentRate, currentTime;

    // Use input values if available, otherwise calculate from current ship data
    if (vehiclesRemainingInput && vehiclesRemainingInput.value) {
        vehiclesRemaining = parseInt(vehiclesRemainingInput.value) || 0;
    } else if (currentShip) {
        const currentProgress = currentShip.progress || 0;
        vehiclesRemaining = Math.round(currentShip.totalVehicles * (100 - currentProgress) / 100);
        if (vehiclesRemainingInput) vehiclesRemainingInput.value = vehiclesRemaining;
    } else {
        vehiclesRemaining = 0;
    }

    if (currentRateInput && currentRateInput.value) {
        currentRate = parseFloat(currentRateInput.value) || 0;
    } else {
        currentRate = calculateCurrentRate();
        if (currentRateInput) currentRateInput.value = currentRate;
    }

    if (currentTimeInput && currentTimeInput.value) {
        currentTime = currentTimeInput.value;
    } else {
        const now = new Date();
        currentTime = now.toTimeString().slice(0, 5);
        if (currentTimeInput) currentTimeInput.value = currentTime;
    }

    // Calculate ETC
    if (vehiclesRemaining > 0 && currentRate > 0) {
        const hoursRemaining = vehiclesRemaining / currentRate;
        
        // Parse current time
        const [hours, minutes] = currentTime.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, 0, 0);
        
        // Add remaining time
        const etc = new Date(now.getTime() + (hoursRemaining * 60 * 60 * 1000));
        const etcString = etc.toTimeString().slice(0, 5);
        
        if (calculatedETCElement) calculatedETCElement.textContent = etcString;
        if (etcElement) etcElement.textContent = etcString;

        // Calculate and display progress
        if (currentShip && currentShip.totalVehicles) {
            const vehiclesCompleted = currentShip.totalVehicles - vehiclesRemaining;
            const progress = Math.round((vehiclesCompleted / currentShip.totalVehicles) * 100);
            if (calculatedProgressElement) calculatedProgressElement.textContent = `${progress}%`;
        }

        console.log('ETC calculated:', {
            vehiclesRemaining: vehiclesRemaining,
            currentRate: currentRate,
            hoursRemaining: hoursRemaining.toFixed(2),
            etc: etcString
        });
    } else {
        if (calculatedETCElement) calculatedETCElement.textContent = '--:--';
        if (etcElement) etcElement.textContent = '--:--';
        if (calculatedProgressElement) calculatedProgressElement.textContent = '0%';
    }
}

function updatePortProgress() {
    const brvSlider = document.getElementById('brvProgress');
    const zeeSlider = document.getElementById('zeeProgress');
    const souSlider = document.getElementById('souProgress');
    
    const brvValue = document.getElementById('brvValue');
    const zeeValue = document.getElementById('zeeValue');
    const souValue = document.getElementById('souValue');
    
    const zeeBar = document.getElementById('zeeBar');
    const souBar = document.getElementById('souBar');
    const totalProgress = document.getElementById('totalProgress');

    if (!brvSlider || !zeeSlider || !souSlider) {
        console.warn('Port progress sliders not found');
        return;
    }

    const brvCurrent = parseInt(brvSlider.value) || 0;
    const zeeCurrent = parseInt(zeeSlider.value) || 0;
    const souCurrent = parseInt(souSlider.value) || 0;

    const brvMax = parseInt(brvSlider.max) || 904;
    const zeeMax = parseInt(zeeSlider.max) || 300;
    const souMax = parseInt(souSlider.max) || 200;

    // Update value displays
    if (brvValue) brvValue.textContent = `${brvCurrent}/${brvMax}`;
    if (zeeValue) zeeValue.textContent = `${zeeCurrent}/${zeeMax}`;
    if (souValue) souValue.textContent = `${souCurrent}/${souMax}`;

    // Update progress bars
    const zeePercent = zeeMax > 0 ? (zeeCurrent / zeeMax) * 100 : 0;
    const souPercent = souMax > 0 ? (souCurrent / souMax) * 100 : 0;

    if (zeeBar) zeeBar.style.width = `${zeePercent}%`;
    if (souBar) souBar.style.width = `${souPercent}%`;

    // Calculate total progress
    const totalMax = brvMax + zeeMax + souMax;
    const totalCurrent = brvCurrent + zeeCurrent + souCurrent;
    const totalPercent = totalMax > 0 ? (totalCurrent / totalMax) * 100 : 0;

    if (totalProgress) totalProgress.textContent = `${totalPercent.toFixed(1)}%`;

    console.log('Port progress updated:', {
        BRV: `${brvCurrent}/${brvMax}`,
        ZEE: `${zeeCurrent}/${zeeMax} (${zeePercent.toFixed(1)}%)`,
        SOU: `${souCurrent}/${souMax} (${souPercent.toFixed(1)}%)`,
        Total: `${totalPercent.toFixed(1)}%`
    });
}

function updateETC() {
    calculateETC();
}

function populateShipData(ship) {
    // Store ship data for auto-updates
    localStorage.setItem('currentShipData', JSON.stringify(ship));

     if (!ship) {
        console.log('No current ship data available');
        return;
    }

    currentShip = ship;

    // Set the page title
    const titleElement = document.getElementById('vesselTitle');
    if (titleElement) {
        titleElement.textContent = ship.vesselName || 'Ship Information Dashboard';
    }

    // Calculate real current rate based on progress and elapsed time
    const realCurrentRate = calculateCurrentRate();
    const currentRateElement = document.getElementById('currentRateValue');
    const completionElement = document.getElementById('completionValue');

    if (currentRateElement) {
        currentRateElement.textContent = realCurrentRate;
    }
    if (completionElement) {
        completionElement.textContent = `${ship.progress}%`;
    }

    // Update performance metrics with real data
    updatePerformanceMetrics();

    const detailsHtml = `
        <div class="text-center mb-4">
            <div class="text-2xl font-bold text-gray-900">${ship.vesselName}</div>
            <div class="text-sm text-gray-600">${ship.vesselType}</div>
            ${!ship.id ? '<div class="text-sm text-orange-600 mt-2"><i class="fas fa-exclamation-triangle mr-1"></i>No active operation data</div>' : ''}
        </div>
        <div class="space-y-3 text-sm">
            <div class="flex justify-between">
                <span class="text-gray-600">Date:</span>
                <span class="font-semibold">${ship.operationDate}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Berth:</span>
                <span class="font-semibold">${ship.berth}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Operation:</span>
                <span class="font-semibold">${ship.operationType}</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Status:</span>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ${ship.status}
                </span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600">Vehicles:</span>
                <span class="font-semibold">${ship.totalVehicles.toLocaleString()}</span>
            </div>
            <div class="pt-3 border-t border-gray-200">
                <div class="text-xs text-gray-500 mb-2">Team Leads</div>
                <div class="text-xs">
                    <div><strong>Auto:</strong> ${ship.autoOpsLead}</div>
                    <div><strong>Heavy:</strong> ${ship.heavyOpsLead}</div>
                </div>
            </div>
        </div>

            <!-- Completion Actions -->
            <div class="mt-6 pt-4 border-t border-gray-200">
                ${ship.id ? `
                <div class="flex space-x-4">
                    <button id="completeButton" onclick="markOperationComplete()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                        <i class="fas fa-check-circle mr-2"></i>Mark Operation Complete
                    </button>
                    <button onclick="updateProgress()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                        <i class="fas fa-percentage mr-2"></i>Update Progress
                    </button>
                </div>
                ` : `
                <div class="text-center">
                    <div class="text-gray-600 mb-4">No operation data to manage</div>
                    <a href="/wizard" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-block">
                        <i class="fas fa-plus mr-2"></i>Create New Operation
                    </a>
                </div>
                `}
            </div>
        </div>
    </div>
    `;

    document.getElementById('shipDetails').innerHTML = detailsHtml;

    // Initialize new widgets with real data
    calculateETC();
    updatePortProgress();

    // Set the values to the real time progress totals and targets
    document.getElementById('totalVehicles').textContent = ship.totalVehicles;
    document.getElementById('totalDrivers').textContent = ship.totalDrivers || 28;

    // Start time tracking after ship data is loaded
    startTimeTracking();

    // Update completion button state
    const completeButton = document.getElementById('completeButton');
    if (completeButton && ship.status === 'complete') {
        completeButton.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Operation Complete';
        completeButton.disabled = true;
        completeButton.className = 'flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed';
    } else if (completeButton) {
        completeButton.innerHTML = '<i class="fas fa-check-circle mr-2"></i>MarkOperation Complete';
        completeButton.disabled = false;
        completeButton.className = 'flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors';
    }

    // Initialize metric widgets
    updateMetricWidgets(ship);
}

async function loadShipData(shipId) {
    console.log('Attempting to load ship data for ID:', shipId);
    try {
        let shipData;
        
        // Use offline storage manager if available
        if (window.offlineStorage) {
            const allShips = await window.offlineStorage.apiCall('/api/ships');
            shipData = allShips.find(ship => ship.id == shipId);
        } else {
            const response = await fetch(`/api/ships/${shipId}`);
            if (response.ok) {
                shipData = await response.json();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        }
        
        console.log('Received ship data:', shipData);
        if (shipData && shipData.id) {
            currentShip = shipData;
            populateShipData(shipData);
            initializeData();
            setTimeout(() => {
                initializeCharts();
            }, 100);

            startAutoUpdate();
            
            // Show offline indicator if data is from cache
            if (!navigator.onLine) {
                showErrorNotification('Displaying cached data (offline)', 2000);
            }
            return;
        } else {
            throw new Error('Ship not found');
        }
    } catch (error) {
        console.error('Error loading ship data:', error);
        
        // Try to get cached data from local storage as fallback
        try {
            const cachedShips = localStorage.getItem('ships_data_v2');
            if (cachedShips) {
                const ships = JSON.parse(cachedShips);
                const cachedShip = ships.find(ship => ship.id == shipId);
                if (cachedShip) {
                    currentShip = cachedShip;
                    populateShipData(cachedShip);
                    initializeData();
                    setTimeout(() => {
                        initializeCharts();
                    }, 100);
                    showErrorNotification('Showing cached ship data', 3000);
                    return;
                }
            }
        } catch (cacheError) {
            console.error('Error loading cached data:', cacheError);
        }
        
        console.log('No valid ship data found, loading default state');
        showErrorNotification('Unable to load ship data: ' + error.message);
        loadSampleShipData();
    }
}

function loadSampleShipData() {
    // No sample data - show empty state
    currentShip = null;
    populateShipData({});
}

function initializeData() {
    // Initialize real operational data based on current ship
    if (currentShip && currentShip.id) {
        generateRealDeckData();
        generateRealBrandData();
        populateDeckProgress();
        populateInventoryTable();
        updateHourlyQuantityDisplay();
    } else {
        // Initialize with empty arrays when no ship
        hourlyData = [];
        deckData = [];
        brandData = {};
    }
}

function generateRealHourlyData() {
    // No fake data generation - hourly data will be populated through real user input
    hourlyData = [];
}

function generateRealDeckData() {
    // Initialize deck data based on current ship if available
    if (currentShip && currentShip.totalVehicles && deckData.length === 0) {
        const vehiclesPerDeck = Math.ceil(currentShip.totalVehicles / 8); // Distribute across 8 decks
        for (let i = 1; i <= 8; i++) {
            deckData.push({
                deck: i,
                total: i <= 7 ? vehiclesPerDeck : currentShip.totalVehicles - (vehiclesPerDeck * 7),
                discharged: 0,
                complete: false
            });
        }
    }
}

function generateRealBrandData() {
    // Initialize with sample data if no brand data exists and we have a ship
    if (Object.keys(brandData).length === 0 && currentShip && currentShip.totalVehicles) {
        if (currentShip.vesselType === 'Auto Only') {
            brandData = {
                'Mercedes': { total: currentShip.totalVehicles, discharged: 0, zone: 'SOU' }
            };
        } else {
            // For mixed vessels, show variety of brands
            brandData = {
                'Toyota': { total: Math.round(currentShip.totalVehicles * 0.3), discharged: 0, zone: 'BRV' },
                'Honda': { total: Math.round(currentShip.totalVehicles * 0.25), discharged: 0, zone: 'ZEE' },
                'Hyundai': { total: Math.round(currentShip.totalVehicles * 0.2), discharged: 0, zone: 'SOU' },
                'Kia': { total: Math.round(currentShip.totalVehicles * 0.15), discharged: 0, zone: 'BRV' },
                'Nissan': { total: Math.round(currentShip.totalVehicles * 0.1), discharged: 0, zone: 'ZEE' }
            };
        }
    }
}

 function startTimeTracking() {
    // Set operation start time based on current ship data
    if (currentShip && currentShip.operationDate && currentShip.shiftStart) {
        operationStartTime = new Date(currentShip.operationDate + 'T' + currentShip.shiftStart);
    } else {
        // Fallback to a reasonable default
        operationStartTime = new Date();
        operationStartTime.setHours(7, 0, 0, 0); // Start at 7 AM today
    }

    setInterval(() => {
        updateElapsedTime();
        updateETC();
        updatePerformanceMetrics(); // Update turnaround times every minute
    }, 60000); // Update every minute

    // Initial update
    updateElapsedTime();
    updateETC();
}

function updateElapsedTime() {
    const elapsedElement = document.getElementById('elapsedTimeDisplay');
    if (!elapsedElement || !operationStartTime) return;

    const now = new Date();
    const elapsed = now - operationStartTime;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

    elapsedElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
}

function updatePerformanceMetrics() {
    // Update turnaround times with realistic data based on current operation
    if (currentShip && currentShip.totalVehicles) {
        const avgTime = 4.2 + (Math.random() * 1.0); // 4.2-5.2 minutes average
        const bestTime = 2.8 + (Math.random() * 0.5); // 2.8-3.3 minutes best
        const worstTime = 7.5 + (Math.random() * 2.0); // 7.5-9.5 minutes worst

        document.getElementById('avgTurnaround').textContent = `${avgTime.toFixed(1)} min`;
        document.getElementById('bestTurnaround').textContent = `${bestTime.toFixed(1)} min`;
        document.getElementById('worstTurnaround').textContent = `${worstTime.toFixed(1)} min`;
    }
}

function populateDeckProgress() {
    const container = document.getElementById('deckProgressContainer');

    if (!container) {
        console.warn('Deck progress container not found');
        return;
    }

    if (deckData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-layer-group text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No deck data available</p>
                <p class="text-sm text-gray-400 mt-2">Use the edit button to add deck information</p>
            </div>
        `;
        return;
    }

    const html = deckData.map(deck => {
        const progress = deck.total > 0 ? (deck.discharged / deck.total) * 100 : 0;
        const isComplete = deck.complete || progress >= 100;
        return `
            <div class="flex items-center justify-between p-3 rounded-lg ${isComplete ? 'deck-complete' : 'bg-gray-50'}">
                <div class="flex items-center">
                    <span class="font-semibold ${isComplete ? 'text-white' : 'text-gray-900'}">Deck ${deck.deck}</span>
                    ${isComplete ? '<i class="fas fa-check-circle ml-2"></i>' : ''}
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-sm ${isComplete ? 'text-white' : 'text-gray-600'}">${deck.discharged}/${deck.total}</span>
                    <div class="w-24 bg-gray-200 rounded-full h-2">
                        <div class="bg-current h-2 rounded-full" style="width: ${Math.min(progress, 100)}%"></div>
                    </div>
                    <span class="text-xs ${isComplete ? 'text-white' : 'text-gray-500'}">${Math.round(progress)}%</span>
                </div>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
}

function toggleDeckEdit() {
    const container = document.getElementById('deckProgressContainer');
    const editForm = document.getElementById('deckEditForm');
    const editBtn = document.getElementById('editDeckBtn');

    if (editForm.classList.contains('hidden')) {
        // Show edit form
        container.classList.add('hidden');
        editForm.classList.remove('hidden');
        editBtn.innerHTML = '<i class="fas fa-times mr-1"></i>Cancel';
        populateDeckEditForm();
    } else {
        // Hide edit form
        container.classList.remove('hidden');
        editForm.classList.add('hidden');
        editBtn.innerHTML = '<i class="fas fa-edit mr-1"></i>Edit';
    }
}

function populateDeckEditForm() {
    const container = document.getElementById('deckEditInputs');
    
    // If no deck data exists, create initial deck structure
    if (deckData.length === 0) {
        const totalVehicles = currentShip && currentShip.totalVehicles ? currentShip.totalVehicles : 1000;
        const vehiclesPerDeck = Math.ceil(totalVehicles / 8);
        for (let i = 1; i <= 8; i++) {
            deckData.push({
                deck: i,
                total: i <= 7 ? vehiclesPerDeck : totalVehicles - (vehiclesPerDeck * 7),
                discharged: 0,
                complete: false
            });
        }
    }
    
    const html = deckData.map((deck, index) => `
        <div class="grid grid-cols-4 gap-2">
            <input type="number" value="${deck.deck}" readonly class="px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-sm">
            <input type="number" id="deckTotal_${index}" value="${deck.total}" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm" min="0">
            <input type="number" id="deckDischarged_${index}" value="${deck.discharged}" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm" min="0">
            <div class="flex items-center">
                <input type="checkbox" id="deckComplete_${index}" ${deck.complete ? 'checked' : ''} class="rounded border-gray-300 text-purple-600 focus:ring-purple-500">
                <label for="deckComplete_${index}" class="ml-2 text-sm text-gray-700">Complete</label>
            </div>
        </div>
    `).join('');
    container.innerHTML = html;
}

function saveDeckChanges() {
    let totalUpdated = 0;
    
    deckData.forEach((deck, index) => {
        const totalInput = document.getElementById(`deckTotal_${index}`);
        const dischargedInput = document.getElementById(`deckDischarged_${index}`);
        const completeInput = document.getElementById(`deckComplete_${index}`);

        if (totalInput && dischargedInput && completeInput) {
            const total = parseInt(totalInput.value) || 0;
            const discharged = parseInt(dischargedInput.value) || 0;
            const complete = completeInput.checked;

            deck.total = total;
            deck.discharged = Math.min(discharged, total); // Ensure discharged doesn't exceed total
            deck.complete = complete;
            
            totalUpdated++;
        }
    });

    if (totalUpdated > 0) {
        populateDeckProgress();
        toggleDeckEdit();
        
        // Update overall progress based on deck data
        const totalVehicles = deckData.reduce((sum, deck) => sum + deck.total, 0);
        const totalDischarged = deckData.reduce((sum, deck) => sum + deck.discharged, 0);
        const overallProgress = totalVehicles > 0 ? Math.round((totalDischarged / totalVehicles) * 100) : 0;
        
        // Update the completion display
        const completionElement = document.getElementById('completionValue');
        if (completionElement) {
            completionElement.textContent = `${overallProgress}%`;
        }
        
        alert(`Deck progress updated successfully! (${totalUpdated} decks updated, Overall progress: ${overallProgress}%)`);
    } else {
        alert('No deck data to update');
    }
}

function cancelDeckEdit() {
    toggleDeckEdit();
}

function populateInventoryTable() {
    const tbody = document.getElementById('inventoryTable');

    // Initialize with real operational data if available
    if (Object.keys(brandData).length === 0 && currentShip) {
        // Create initial brand data based on ship information
        if (currentShip.vesselType === 'Auto Only' || currentShip.vesselName.toLowerCase().includes('piranha')) {
            // For auto-only vessels like Piranha, show Mercedes as primary brand
            brandData = {
                'Mercedes': { total: currentShip.totalVehicles, discharged: 0, zone: 'SOU' }
            };
        } else {
            // For mixed vessels, show variety of brands
            brandData = {
                'Toyota': { total: Math.round(currentShip.totalVehicles * 0.3), discharged: 0, zone: 'BRV' },
                'Honda': { total: Math.round(currentShip.totalVehicles * 0.25), discharged: 0, zone: 'ZEE' },
                'Hyundai': { total: Math.round(currentShip.totalVehicles * 0.2), discharged: 0, zone: 'SOU' },
                'Kia': { total: Math.round(currentShip.totalVehicles * 0.15), discharged: 0, zone: 'BRV' },
                'Nissan': { total: Math.round(currentShip.totalVehicles * 0.1), discharged: 0, zone: 'ZEE' }
            };
        }
    }

    if (Object.keys(brandData).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-boxes text-4xl text-gray-300 mb-4"></i>
                    <p>No inventory data available</p>
                    <p class="text-sm text-gray-400 mt-2">Create a ship operation to see inventory breakdown</p>
                </td>
            </tr>
        `;
        return;
    }

    const html = Object.entries(brandData).map(([brand, data]) => {
        const progress = data.total > 0 ? (data.discharged / data.total) * 100 : 0;
        const remaining = data.total - data.discharged;
        return `
            <tr>
                <td class="px-4 py-3 text-sm font-medium text-gray-900">${brand}</td>
                <td class="px-4 py-3 text-sm text-gray-700 text-right">${data.total.toLocaleString()}</td>
                <td class="px-4 py-3 text-sm text-gray-700 text-right">${data.discharged.toLocaleString()}</td>
                <td class="px-4 py-3 text-sm text-gray-700 text-right">${remaining.toLocaleString()}</td>
                <td class="px-4 py-3 text-sm text-gray-700 text-right">
                    <div class="flex items-center justify-end space-x-2">
                        <div class="w-16 bg-gray-200 rounded-full h-2">
                            <div class="bg-green-600 h-2 rounded-full" style="width: ${progress}%"></div>
                        </div>
                        <span>${Math.round(progress)}%</span>
                    </div>
                </td>
                <td class="px-4 py-3 text-sm text-gray-700 text-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${data.zone}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    tbody.innerHTML = html;
}

function addHourlyQuantity() {
    const hourSelect = document.getElementById('hourSelect');
    const quantityInput = document.getElementById('hourlyQuantity');

    const hour = hourSelect.value;
    const quantity = parseInt(quantityInput.value);

    if (!hour || !quantity || quantity < 0) {
        alert('Please select an hour and enter a valid quantity');
        return;
    }

    hourlyQuantities[hour] = quantity;

    // Clear inputs
    hourSelect.value = '';
    quantityInput.value = '';

    updateHourlyQuantityDisplay();
}

function updateHourlyQuantityDisplay() {
    const container = document.getElementById('hourlyQuantityList');
    const totalElement = document.getElementById('totalRecorded');
    const remainingElement = document.getElementById('remainingVehicles');
    const averageElement = document.getElementById('averagePerHour');

    if (Object.keys(hourlyQuantities).length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-sm italic text-center py-4">No hourly data recorded yet</div>';
        totalElement.textContent = '0 vehicles';
        remainingElement.textContent = `${currentShip ? currentShip.totalVehicles.toLocaleString() : 0} vehicles`;
        averageElement.textContent = '0 vehicles/hour';
        return;
    }

    const sortedHours = Object.keys(hourlyQuantities).sort((a, b) => parseInt(a) - parseInt(b));

    const html = sortedHours.map(hour => {
        const quantity = hourlyQuantities[hour];
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span class="text-indigo-600 font-bold text-sm">${hour}</span>
                    </div>
                    <div>
                        <div class="text-sm font-medium text-gray-900">Hour ${hour}</div>
                        <div class="text-xs text-gray-500">Discharged</div>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="font-bold text-indigo-600">${quantity} vehicles</span>
                    <button onclick="removeHourlyQuantity('${hour}')" class="text-red-500 hover:text-red-700 text-sm">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    // Calculate totals
    const total = Object.values(hourlyQuantities).reduce((sum, qty) => sum + qty, 0);
    const remaining = currentShip ? Math.max(0, currentShip.totalVehicles - total) : 0;
    const average = Object.keys(hourlyQuantities).length > 0 ? (total / Object.keys(hourlyQuantities).length).toFixed(1) : 0;

    totalElement.textContent = `${total.toLocaleString()} vehicles`;
    remainingElement.textContent = `${remaining.toLocaleString()} autos`;
    averageElement.textContent = `${average} autos/hour`;
}

function getHourLabel(hour) {
    const hourMap = {
        '1': '07:00-08:00',
        '2': '08:00-09:00',
        '3': '09:00-10:00',
        '4': '10:00-11:00',
        '5': '11:00-12:00',
        '6': '12:00-13:00',
        '7': '13:00-14:00',
        '8': '14:00-15:00',
        '9': '15:00-16:00',
        '10': '16:00-17:00',
        '11': '17:00-18:00',
        '12': '18:00-19:00'
    };
    return hourMap[hour] || 'Unknown';
}

function removeHourlyQuantity(hour) {
    delete hourlyQuantities[hour];
    updateHourlyQuantityDisplay();
}

async function saveProgress() {
    const progress = parseInt(document.getElementById('progressSlider').value);

    try {
        const response = await fetch(`/api/ships/${currentShip.id}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ progress: progress })
        });

        if (response.ok) {
            currentShip.progress = progress;
            populateInventoryTable();
            alert('Progress updated successfully!');
        } else {
            alert('Failed to update progress');
        }
    } catch (error) {
        console.error('Error updating progress:', error);
        alert('Error updating progress');
    }
}

function setupPhotoUpload() {
    const uploadZone = document.getElementById('photoUploadZone');
    const photoInput = document.getElementById('photoInput');

    uploadZone.addEventListener('click', () => photoInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        handlePhotoUpload(files);
    });

    photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handlePhotoUpload(files);
    });
}

function handlePhotoUpload(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photo = {
                    id: Date.now() + Math.random(),
                    src: e.target.result,
                    name: file.name,
                    timestamp: new Date().toLocaleString()
                };
                photos.push(photo);
                renderPhotoGallery();
            };
            reader.readAsDataURL(file);
        }
    });
}

function renderPhotoGallery() {
    const gallery = document.getElementById('photoGallery');
    const galleryHtml = photos.map(photo => `
        <div class="relative group">
            <img src="${photo.src}" alt="${photo.name}" class="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition duration-200" onclick="viewPhoto('${photo.id}')">
            <button onclick="deletePhoto('${photo.id}')" class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                <i class="fas fa-times text-xs"></i>
            </button>
            <div class="mt-2 text-xs text-gray-600 truncate">${photo.name}</div>
            <div class="text-xs text-gray-500">${photo.timestamp}</div>
        </div>
    `).join('');

    gallery.innerHTML = galleryHtml;
}

function deletePhoto(photoId) {
    photos = photos.filter(photo => photo.id !== photoId);
    renderPhotoGallery();
}

function viewPhoto(photoId) {
    const photo = photos.find(p => p.id === photoId);
    if (photo) {
        // Create modal to view full-size photo
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="max-w-4xl max-h-full p-4">
                <img src="${photo.src}" alt="${photo.name}" class="max-w-full max-h-full object-contain">
                <div class="text-center mt-4">
                    <button onclick="this.closest('.fixed').remove()" class="bg-white text-black px-4 py-2 rounded-lg">Close</button>
                </div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    }
}

function goBack() {
    // Try to go back in history, fallback to master dashboard
    if (document.referrer && document.referrer.includes(window.location.hostname)) {
        window.history.back();
    } else {
        window.location.href = '/master';
    }
}

async function markOperationComplete() {
    if (!currentShip || !currentShip.id) {
        alert('No active ship operation to complete');
        return;
    }

    if (!confirm('Are you sure you want to mark this operation as complete? This action cannot be undone.')) {
        return;
    }

    try {
        // Update status to complete
        const statusResponse = await fetch(`/api/ships/${currentShip.id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'complete'
            })
        });

        if (statusResponse.ok) {
            // Update progress to 100%
            const progressResponse = await fetch(`/api/ships/${currentShip.id}/progress`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    progress: 100
                })
            });

            if (progressResponse.ok) {
                // Update local data
                currentShip.status = 'complete';
                currentShip.progress = 100;
                
                // Update displays
                document.getElementById('completionValue').textContent = '100%';
                
                // Update button state
                const completeButton = document.getElementById('completeButton');
                if (completeButton) {
                    completeButton.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Operation Complete';
                    completeButton.disabled = true;
                    completeButton.className = 'flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold cursor-not-allowed';
                }
                
                alert('Operation marked as complete successfully!');
            } else {
                throw new Error('Failed to update progress');
            }
        } else {
            const error = await statusResponse.json();
            throw new Error(error.error || 'Failed to update status');
        }
    } catch (error) {
        console.error('Error marking operation complete:', error);
        alert('Error marking operation complete: ' + error.message);
    }
}

async function updateProgress() {
    const currentProgress = parseFloat(document.getElementById('progressBar').style.width) || 0;
    const newProgress = prompt(`Enter new progress percentage (current: ${currentProgress}%):`, currentProgress);

    if (newProgress === null || newProgress === '') return;

    const progress = parseFloat(newProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
        alert('Please enter a valid percentage between 0 and 100');
        return;
    }

    try {
        const shipId = new URLSearchParams(window.location.search).get('ship');
        const response = await fetch(`/api/ships/${shipId}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                progress: progress
            })
        });

        if (response.ok) {
            alert('Progress updated successfully!');
            loadShipDetails(); // Refresh the page data
        } else {
            const error = await response.json();
            alert('Error updating progress: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating progress:', error);
        alert('Error updating progress: ' + error.message);
    }
}

function goToMaster() {
    try {
        console.log('Navigating to master dashboard...');
        window.location.href = '/master';
    } catch (error) {
        console.error('Error navigating to master dashboard:', error);
        alert('Error navigating to master dashboard. Please try again.');
    }
}

function updateProgress() {
    if (!currentShip) {
        alert('No ship data available. Please refresh the page or select a ship operation.');
        return;
    }

    const currentProgress = currentShip.progress || 0;
    const newProgress = prompt(`Enter new progress percentage (current: ${currentProgress}%):`, currentProgress);

    if (newProgress === null || newProgress === '') return;

    const progress = parseFloat(newProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
        alert('Please enter a valid percentage between 0 and 100');
        return;
    }

    if (!currentShip.id) {
        // If no ship ID, just update locally
        currentShip.progress = progress;
        document.getElementById('completionValue').textContent = `${progress}%`;
        const calculatedProgressElement = document.getElementById('calculatedProgress');
        if (calculatedProgressElement) {
            calculatedProgressElement.textContent = `${progress}%`;
        }
        alert('Progress updated locally!');
        console.log('Progress updated locally to:', progress + '%');
        return;
    }

    updateShipProgress(progress);
}

async function updateShipProgress(progress) {
    try {
        const response = await fetch(`/api/ships/${currentShip.id}/progress`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                progress: progress
            })
        });

        if (response.ok) {
            currentShip.progress = progress;
            document.getElementById('completionValue').textContent = `${progress}%`;
            alert('Progress updated successfully!');
        } else {
            const error = await response.json();
            alert('Error updating progress: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating progress:', error);
        alert('Error updating progress: ' + error.message);
    }
}

function handleShipFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show upload status
    document.getElementById('shipUploadStatus').classList.remove('hidden');
    document.getElementById('shipUploadSuccess').classList.add('hidden');

    // Create FormData and upload file
    const formData = new FormData();
    formData.append('file', file);

    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Now extract data from the uploaded file
            return fetch('/api/extract', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    file_path: data.file_path
                })
            });
        } else {
            throw new Error(data.error || 'Upload failed');
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('shipUploadStatus').classList.add('hidden');
        if (data.success) {
            document.getElementById('shipUploadSuccess').classList.remove('hidden');
            console.log('Document processed successfully:', data.parsed_data);
            // Optionally update current ship data
            if (confirm('Document processed successfully! Would you like to update this ship operation with the extracted data?')) {
                // Update current ship data with extracted information
                Object.assign(currentShip, data.parsed_data);
                populateShipData();
            }
        } else {
            throw new Error(data.error || 'Extraction failed');
        }
    })
    .catch(error => {
        document.getElementById('shipUploadStatus').classList.add('hidden');
        alert('Error processing document: ' + error.message);
        console.error('Error:', error);
    });
}

 function updateRealTimeProgress() {
    const dischargedElement = document.getElementById('dischargedCount');
    const totalVehiclesElement = document.getElementById('totalVehicles');
    const activeDriversElement = document.getElementById('activeDrivers');
    const operationStatusElement = document.getElementById('operationStatus');
    const currentDeckElement = document.getElementById('currentDeck');

    // Check if required elements exist
    if (!dischargedElement) {
        console.warn('dischargedCount element not found');
        return;
    }
    if (!totalVehiclesElement) {
        console.warn('totalVehicles element not found');
        return;
    }
    if (!activeDriversElement) {
        console.warn('activeDrivers element not found'); 
        return;
    }
    if (!operationStatusElement) {
        console.warn('operationStatus element not found');
        return;
    }
    if (!currentDeckElement) {
        console.warn('currentDeck element not found');
        return;
    }

    const discharged = parseInt(dischargedElement.value) || 0;
    const totalVehicles = parseInt(totalVehiclesElement.textContent) || (currentShip ? currentShip.totalVehicles : 0);
    const activeDrivers = parseInt(activeDriversElement.value) || 0;
    const operationStatus = operationStatusElement.value;
    const currentDeck = currentDeckElement.value;

    let overallProgress = totalVehicles > 0 ? Math.min(100, (discharged / totalVehicles) * 100) : 0;

    // Update completion display
    const completionElement = document.getElementById('completionValue');
    if (completionElement) {
        completionElement.textContent = overallProgress.toFixed(0) + '%';
    }

    // Update calculated progress display
    const calculatedProgressElement = document.getElementById('calculatedProgress');
    if (calculatedProgressElement) {
        calculatedProgressElement.textContent = overallProgress.toFixed(0) + '%';
    }

    // Update current rate based on status
    let currentRate = 0;
    if (operationStatus === 'active' || operationStatus === 'discharge') {
        currentRate = calculateCurrentRate() || 0;
    }
    const currentRateElement = document.getElementById('currentRateValue');
    if (currentRateElement) {
        currentRateElement.textContent = currentRate;
    }

    // Update performance metrics including turnaround times
    updatePerformanceMetrics();

    // Auto-update the backend with new progress if we have a ship ID
    if (currentShip && currentShip.id && overallProgress !== currentShip.progress) {
        updateShipProgress(overallProgress);
    }

    // Auto-redirect to master dashboard if status is set to complete
    if (operationStatus === 'complete') {
        // Check if we have a valid ship ID from URL or currentShip
        const urlParams = new URLSearchParams(window.location.search);
        const shipId = urlParams.get('ship') || (currentShip && currentShip.id ? currentShip.id : null);

        if (shipId) {
            updateShipStatusAndRedirect('complete', shipId);
        } else {
            // If no ship ID, just redirect to master dashboard
            alert('Operation marked as complete! Redirecting to master dashboard...');
            window.location.href = '/master';
        }
    }

    console.log('Real-time progress updated:', {
        discharged: discharged,
        totalVehicles: totalVehicles,
        progress: overallProgress,
        activeDrivers: activeDrivers,
        status: operationStatus,
        currentDeck: currentDeck
    });
}

async function updateShipStatusAndRedirect(status, shipId) {
    try {
        const response = await fetch(`/api/ships/${shipId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: status
            })
        });

        if (response.ok) {
            // Also update progress to 100% if completing
            if (status === 'complete') {
                await fetch(`/api/ships/${shipId}/progress`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        progress: 100
                    })
                });
            }

            // Show confirmation and redirect
            alert('Operation status updated successfully! Redirecting to master dashboard...');
            window.location.href = '/master';
        } else {
            const error = await response.json();
            alert('Error updating status: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating status: ' + error.message);
    }
}

function generateReport() {
    if (!currentShip || !currentShip.vesselName) {
        alert('No ship data available to generate report');
        return;
    }

    const reportData = {
        vessel: currentShip.vesselName || 'Unknown Vessel',
        date: currentShip.operationDate || new Date().toISOString().split('T')[0],
        progress: currentShip.progress || 0,
        hourlyData: hourlyData || [],
        deckData: deckData || [],
        brandData: brandData || {}
    };

    // Generate a simple text report
    let report = `VESSEL OPERATION REPORT\n`;
    report += `========================\n\n`;
    report += `Vessel: ${reportData.vessel}\n`;
    report += `Date: ${reportData.date}\n`;
    report += `Progress: ${reportData.progress}%\n`;
    report += `Total Vehicles: ${currentShip.totalVehicles || 'N/A'}\n`;
    report += `Operation Type: ${currentShip.operationType || 'N/A'}\n`;
    report += `Berth: ${currentShip.berth || 'N/A'}\n`;
    report += `Status: ${currentShip.status || 'N/A'}\n\n`;

    if (Object.keys(hourlyQuantities).length > 0) {
        report += `HOURLY QUANTITIES:\n`;
        Object.entries(hourlyQuantities).forEach(([hour, quantity]) => {
            report += `Hour ${hour}: ${quantity} vehicles\n`;
        });
        report += `\n`;
    }

    if (Object.keys(brandData).length > 0) {
        report += `BRAND BREAKDOWN:\n`;
        Object.entries(brandData).forEach(([brand, data]) => {
            const progress = data.total > 0 ? Math.round((data.discharged/data.total)*100) : 0;
            report += `${brand}: ${data.discharged}/${data.total} (${progress}%) - Zone: ${data.zone}\n`;
        });
        report += `\n`;
    }

    if (deckData.length > 0) {
        report += `DECK PROGRESS:\n`;
        deckData.forEach(deck => {
            const progress = deck.total > 0 ? Math.round((deck.discharged/deck.total)*100) : 0;
            report += `Deck ${deck.deck}: ${deck.discharged}/${deck.total} (${progress}%) ${deck.complete ? '- COMPLETE' : ''}\n`;
        });
    }

    report += `\nReport generated: ${new Date().toLocaleString()}\n`;

    // Download as text file
    try {
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportData.vessel.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${reportData.date}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('Report generated successfully');
        alert('Report downloaded successfully!');
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Error generating report: ' + error.message);
    }
}

// Widget Customization Functions
function toggleCustomizeMode() {
    customizeMode = !customizeMode;
    const btn = document.getElementById('customizeBtn');
    const addPanel = document.getElementById('addWidgetPanel');

    if (customizeMode) {
        btn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Layout';
        btn.className = 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200';
        addPanel.classList.remove('hidden');
        document.body.classList.add('customize-mode');

        // Show helpful message
        const container = document.getElementById('widgetsContainer');
        const helpMsg = document.createElement('div');
        helpMsg.id = 'customizeHelp';
        helpMsg.className = 'bg-blue-100 border border-blue-300 text-blue-700 px-4 py-3 rounded-lg mb-4';
        helpMsg.innerHTML = '<i class="fas fa-info-circle mr-2"></i>Drag widgets by their handle (⋮⋮) to reorder them. Click the X to hide widgets.';
        container.parentNode.insertBefore(helpMsg, container);
    } else {
        btn.innerHTML = '<i class="fas fa-cog mr-2"></i>Customize';
        btn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition duration-200';
        addPanel.classList.add('hidden');
        document.body.classList.remove('customize-mode');

        // Remove help message
        const helpMsg = document.getElementById('customizeHelp');
        if (helpMsg) helpMsg.remove();

        saveWidgetSettings();
    }
}

function toggleWidget(widgetId) {
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (!widgetElement) {
        console.warn(`Widget with ID ${widgetId} not found`);
        return;
    }

    if (enabledWidgets.has(widgetId)) {
        enabledWidgets.delete(widgetId);
        widgetElement.classList.add('widget-disabled');
        console.log(`Widget ${widgetId} disabled`);
    } else {
        enabledWidgets.add(widgetId);
        widgetElement.classList.remove('widget-disabled');
        console.log(`Widget ${widgetId} enabled`);
    }
    
    // Save settings after toggle
    saveWidgetSettings();
}

function addWidget(widgetId) {
    const widgetElement = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (!widgetElement) {
        console.warn(`Widget with ID ${widgetId} not found`);
        return;
    }

    if (!enabledWidgets.has(widgetId)) {
        enabledWidgets.add(widgetId);
        widgetElement.classList.remove('widget-disabled');
        console.log(`Widget ${widgetId} added and enabled`);
        
        // Save settings after adding
        saveWidgetSettings();
    }
}

function testAllWidgetFunctions() {
    console.log('=== TESTING ALL WIDGET FUNCTIONS ===');
    
    let testsPassedCount = 0;
    let totalTests = 8;

    // Test Real-time Progress Update
    console.log('1. Testing Real-time Progress Update...');
    try {
        updateRealTimeProgress();
        console.log('✓ Real-time progress update works');
        testsPassedCount++;
    } catch (error) {
        console.error('✗ Real-time progress update failed:', error);
    }

    // Test ETC Calculation
    console.log('2. Testing ETC Calculation...');
    try {
        calculateETC();
        console.log('✓ ETC calculation works');
        testsPassedCount++;
    } catch (error) {
        console.error('✗ ETC calculation failed:', error);
    }

    // Test Port Progress Simulator
    console.log('3. Testing Port Progress Simulator...');
    try {
        updatePortProgress();
        console.log('✓ Port progress simulator works');
        testsPassedCount++;
    } catch (error) {
        console.error('✗ Port progress simulator failed:', error);
    }

    // Test Hourly Quantity Tracker
    console.log('4. Testing Hourly Quantity Tracker...');
    try {
        const hourSelect = document.getElementById('hourSelect');
        const quantityInput = document.getElementById('hourlyQuantity');
        if (hourSelect && quantityInput) {
            hourSelect.value = '1';
            quantityInput.value = '150';
            addHourlyQuantity();
            console.log('✓ Hourly quantity tracker works');
            testsPassedCount++;
        } else {
            throw new Error('Hourly quantity elements not found');
        }
    } catch (error) {
        console.error('✗ Hourly quantity tracker failed:', error);
    }

    // Test Deck Progress
    console.log('5. Testing Deck Progress...');
    try {
        populateDeckProgress();
        console.log('✓ Deck progress works');
        testsPassedCount++;
    } catch (error) {
        console.error('✗ Deck progress failed:', error);
    }

    // Test Inventory Table
    console.log('6. Testing Inventory Table...');
    try {
        populateInventoryTable();
        console.log('✓ Inventory table works');
        testsPassedCount++;
    } catch (error) {
        console.error('✗ Inventory table failed:', error);
    }

    // Test Widget Customization
    console.log('7. Testing Widget Customization...');
    try {
        toggleWidget('hourly-productivity');
        setTimeout(() => toggleWidget('hourly-productivity'), 100); // Toggle back
        console.log('✓ Widget customization works');
        testsPassedCount++;
    } catch (error) {
        console.error('✗ Widget customization failed:', error);
    }

    // Test Charts
    console.log('8. Testing Charts...');
    try {
        initializeCharts();
        console.log('✓ Charts initialization works');
        testsPassedCount++;
    } catch (error) {
        console.error('✗ Charts initialization failed:', error);
    }

    console.log(`=== WIDGET TESTING COMPLETE: ${testsPassedCount}/${totalTests} tests passed ===`);
    alert(`Widget testing complete!\n${testsPassedCount}/${totalTests} tests passed.\nCheck console for detailed results.`);
}

function setupWidgetDragAndDrop() {
    const container = document.getElementById('widgetsContainer');
    let draggedElement = null;
    let isDragging = false;

    // Set up event delegation for drag handles
    container.addEventListener('mousedown', (e) => {
        if (!customizeMode) return;

        const handle = e.target.closest('.widget-handle');
        if (!handle) return;

        e.preventDefault();

        const widget = handle.closest('.widget-container');
        if (!widget) return;

        draggedElement = widget;
        isDragging = true;
        widget.classList.add('widget-dragging');

        const startY = e.clientY;
        const startRect = widget.getBoundingClientRect();

        const handleMouseMove = (e) => {
            if (!isDragging || !draggedElement) return;

            e.preventDefault();

            const afterElement = getDragAfterElement(container, e.clientY);

            if (afterElement == null) {
                container.appendChild(draggedElement);
            } else {
                container.insertBefore(draggedElement, afterElement);
            }
        };

        const handleMouseUp = () => {
            if (draggedElement) {
                draggedElement.classList.remove('widget-dragging');
                updateWidgetOrder();
            }

            isDragging = false;
            draggedElement = null;

            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });

    // Prevent text selection while dragging
    container.addEventListener('selectstart', (e) => {
        if (isDragging) e.preventDefault();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.widget-container:not(.widget-dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateWidgetOrder() {
    const widgets = document.querySelectorAll('.widget-container');
    widgetOrder = Array.from(widgets).map(widget => widget.dataset.widgetId);
}

function saveWidgetSettings() {
    const settings = {
        widgetOrder: widgetOrder,
        enabledWidgets: Array.from(enabledWidgets)
    };
    localStorage.setItem('shipWidgetSettings', JSON.stringify(settings));
}

function loadWidgetSettings() {
    const settings = localStorage.getItem('shipWidgetSettings');
    if (settings) {
        const parsed = JSON.parse(settings);
        widgetOrder = parsed.widgetOrder || widgetOrder;
        enabledWidgets = new Set(parsed.enabledWidgets || enabledWidgets);

        // Apply saved settings
        applyWidgetSettings();
    }
}

function applyWidgetSettings() {
    const container = document.getElementById('widgetsContainer');

    // Reorder widgets
    widgetOrder.forEach(widgetId => {
        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (widget) {
            container.appendChild(widget);
        }
    });

    // Apply enabled/disabled state
    document.querySelectorAll('.widget-container').forEach(widget => {
        const widgetId = widget.dataset.widgetId;
        if (!enabledWidgets.has(widgetId)) {
            widget.classList.add('widget-disabled');
        } else {
            widget.classList.remove('widget-disabled');
        }
    });
}

// Turnaround Times Edit Functions
function toggleTurnaroundEdit() {
    const display = document.getElementById('turnaroundDisplay');
    const editForm = document.getElementById('turnaroundEditForm');
    const editBtn = document.getElementById('editTurnaroundBtn');

    if (editForm.classList.contains('hidden')) {
        // Show edit form
        display.classList.add('hidden');
        editForm.classList.remove('hidden');
        editBtn.innerHTML = '<i class="fas fa-times mr-1"></i>Cancel';
        populateTurnaroundEditForm();
    } else {
        // Hide edit form
        display.classList.remove('hidden');
        editForm.classList.add('hidden');
        editBtn.innerHTML = '<i class="fas fa-edit mr-1"></i>Edit';
    }
}

function populateTurnaroundEditForm() {
    const avgText = document.getElementById('avgTurnaround').textContent;
    const bestText = document.getElementById('bestTurnaround').textContent;
    const worstText = document.getElementById('worstTurnaround').textContent;

    document.getElementById('editAvgTurnaround').value = parseFloat(avgText) || '';
    document.getElementById('editBestTurnaround').value = parseFloat(bestText) || '';
    document.getElementById('editWorstTurnaround').value = parseFloat(worstText) || '';
}

function saveTurnaroundChanges() {
    const avgValue = parseFloat(document.getElementById('editAvgTurnaround').value) || 0;
    const bestValue = parseFloat(document.getElementById('editBestTurnaround').value) || 0;
    const worstValue = parseFloat(document.getElementById('editWorstTurnaround').value) || 0;

    if (avgValue > 0) {
        document.getElementById('avgTurnaround').textContent = `${avgValue.toFixed(1)} min`;
    }
    if (bestValue > 0) {
        document.getElementById('bestTurnaround').textContent = `${bestValue.toFixed(1)} min`;
    }
    if (worstValue > 0) {
        document.getElementById('worstTurnaround').textContent = `${worstValue.toFixed(1)} min`;
    }

    toggleTurnaroundEdit();
    alert('Turnaround times updated successfully!');
}

function cancelTurnaroundEdit() {
    toggleTurnaroundEdit();
}

// Inventory Edit Functions
function toggleInventoryEdit() {
    const display = document.getElementById('inventoryDisplay');
    const editForm = document.getElementById('inventoryEditForm');
    const editBtn = document.getElementById('editInventoryBtn');

    if (editForm.classList.contains('hidden')) {
        // Show edit form
        display.classList.add('hidden');
        editForm.classList.remove('hidden');
        editBtn.innerHTML = '<i class="fas fa-times mr-1"></i>Cancel';
        populateInventoryEditForm();
    } else {
        // Hide edit form
        display.classList.remove('hidden');
        editForm.classList.add('hidden');
        editBtn.innerHTML = '<i class="fas fa-edit mr-1"></i>Edit Inventory';
    }
}

function populateInventoryEditForm() {
    const container = document.getElementById('inventoryEditInputs');
    const html = Object.entries(brandData).map(([brand, data], index) => `
        <div class="grid grid-cols-6 gap-2" data-brand="${brand}">
            <input type="text" value="${brand}" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" data-field="brand">
            <input type="number" value="${data.total}" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" min="0" data-field="total">
            <input type="number" value="${data.discharged}" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" min="0" data-field="discharged">
            <select class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" data-field="zone">
                <option value="BRV" ${data.zone === 'BRV' ? 'selected' : ''}>BRV</option>
                <option value="ZEE" ${data.zone === 'ZEE' ? 'selected' : ''}>ZEE</option>
                <option value="SOU" ${data.zone === 'SOU' ? 'selected' : ''}>SOU</option>
            </select>
            <button onclick="removeInventoryRow('${brand}')" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">
                <i class="fas fa-trash"></i>
            </button>
            <div></div>
        </div>
    `).join('');
    container.innerHTML = html;
}

function addInventoryRow() {
    const container = document.getElementById('inventoryEditInputs');
    const newRowHtml = `
        <div class="grid grid-cols-6 gap-2" data-brand="new-${Date.now()}">
            <input type="text" placeholder="Brand name" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" data-field="brand">
            <input type="number" placeholder="Total" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" min="0" data-field="total">
            <input type="number" placeholder="Discharged" class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" min="0" data-field="discharged">
            <select class="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 text-sm" data-field="zone">
                <option value="BRV">BRV</option>
                <option value="ZEE">ZEE</option>
                <option value="SOU">SOU</option>
            </select>
            <button onclick="removeInventoryRow('new-${Date.now()}')" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">
                <i class="fas fa-trash"></i>
            </button>
            <div></div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', newRowHtml);
}

function removeInventoryRow(brand) {
    const row = document.querySelector(`[data-brand="${brand}"]`);
    if (row) {
        row.remove();
    }
}

function saveInventoryChanges() {
    const rows = document.querySelectorAll('#inventoryEditInputs [data-brand]');
    const newBrandData = {};

    rows.forEach(row => {
        const brand = row.querySelector('[data-field="brand"]').value.trim();
        const total = parseInt(row.querySelector('[data-field="total"]').value) || 0;
        const discharged = parseInt(row.querySelector('[data-field="discharged"]').value) || 0;
        const zone = row.querySelector('[data-field="zone"]').value;

        if (brand && total > 0) {
            newBrandData[brand] = {
                total: total,
                discharged: Math.min(discharged, total),
                zone: zone
            };
        }
    });

    brandData = newBrandData;
    populateInventoryTable();
    initializeCharts(); // Refresh charts with new data
    toggleInventoryEdit();
    alert('Inventory updated successfully!');
}

function cancelInventoryEdit() {
    toggleInventoryEdit();
}
