// Global variables
let ships = [];
let refreshInterval;
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    initializeCharts();
    loadShips();
    refreshInterval = setInterval(loadShips, 30000); // Refresh every 30 seconds
    
    // Initialize offline functionality
    if (window.offlineStorage) {
        setupOfflineHandlers();
    }
});

function updateCurrentTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString();
}

async function loadShips() {
    try {
        // Use offline storage manager if available
        if (window.offlineStorage) {
            ships = await window.offlineStorage.apiCall('/api/ships');
        } else {
            const response = await fetch('/api/ships');
            if (response.ok) {
                ships = await response.json();
            } else {
                throw new Error('Failed to load ships');
            }
        }
        
        updateDashboard();
        updateCharts();
        return Promise.resolve();
    } catch (error) {
        console.error('Error loading ships:', error);
        
        // Fallback to local storage if offline storage manager not available
        const cachedShips = localStorage.getItem('ships_data_v2');
        if (cachedShips) {
            ships = JSON.parse(cachedShips);
        } else {
            ships = [];
        }
        
        updateDashboard();
        updateCharts();
        return Promise.resolve();
    }
}

function updateDashboard() {
    updateStats();
    updateBerthMap();
    renderShips();
    updateCharts();
}

function updateStats() {
    const activeShips = ships.filter(ship => ship.status !== 'complete');
    const activeShipsCount = activeShips.length;
    const totalTeams = activeShipsCount * 2; // Auto ops + Heavy ops teams
    const totalVehicles = activeShips.reduce((sum, ship) => sum + ship.totalVehicles, 0);
    const berthsOccupied = new Set(activeShips.map(ship => ship.berth)).size;

    document.getElementById('activeShipsCount').textContent = activeShipsCount;
    document.getElementById('teamsCount').textContent = totalTeams;
    document.getElementById('totalVehicles').textContent = totalVehicles.toLocaleString();
    document.getElementById('berthsOccupied').textContent = berthsOccupied;
}

function updateBerthMap() {
    // Reset all berths
    for (let i = 1; i <= 3; i++) {
        const berthElement = document.getElementById(`berth${i}`);
        const indicator = berthElement.querySelector('.berth-indicator');
        const statusText = berthElement.querySelector('.text-sm');

        berthElement.className = 'berth-slot bg-gray-100 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-200 transition-colors';
        indicator.className = 'berth-indicator w-4 h-4 bg-gray-400 rounded-full mx-auto mb-2';
        statusText.textContent = 'Available';
    }

    // Update occupied berths (only for non-complete ships)
    ships.forEach(ship => {
        if (ship.status !== 'complete') {
            const berthNumber = ship.berth.replace('Berth ', '');
            const berthElement = document.getElementById(`berth${berthNumber}`);
            const indicator = berthElement.querySelector('.berth-indicator');
            const statusText = berthElement.querySelector('.text-sm');

            if (berthElement) {
                berthElement.className = 'berth-slot bg-blue-100 rounded-lg p-4 text-center cursor-pointer hover:bg-blue-200 transition-colors';
                indicator.className = 'berth-indicator w-4 h-4 bg-blue-500 rounded-full mx-auto mb-2';
                statusText.textContent = ship.vesselName;
            }
        }
    });
}

function renderShips(statusFilter = '') {
    const container = document.getElementById('shipsContainer');
    
    // Filter ships based on the selected status
    let filteredShips;
    if (statusFilter === '') {
        // Show only active ships when no filter is selected (default behavior)
        filteredShips = ships.filter(ship => ship.status !== 'complete');
    } else {
        // Show ships matching the selected status
        filteredShips = ships.filter(ship => ship.status === statusFilter);
    }

    if (filteredShips.length === 0) {
        let message = statusFilter === 'complete' ? 'No completed operations' : 'No active ship operations';
        let subMessage = statusFilter === 'complete' ? 'Completed operations will appear here' : 'Click "New Operation" to get started';
        
        container.innerHTML = `
            <div class="text-center py-12 col-span-full">
                <i class="fas fa-ship text-6xl text-gray-300 mb-4"></i>
                <p class="text-gray-500 text-lg">${message}</p>
                <p class="text-gray-400">${subMessage}</p>
            </div>
        `;
        return;
    }

    const shipsHtml = filteredShips.map(ship => `
        <div class="ship-card rounded-xl p-6 text-white cursor-pointer ${getStatusClass(ship.status)}" onclick="viewShipDetails(${ship.id})">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold">${ship.vesselName}</h3>
                    <p class="text-blue-100">${ship.vesselType}</p>
                </div>
                <div class="text-right">
                    <div class="bg-white bg-opacity-20 rounded-lg px-3 py-1">
                        <span class="text-sm font-semibold">${ship.berth}</span>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <div class="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>${ship.progress}%</span>
                </div>
                <div class="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div class="bg-white h-2 rounded-full" style="width: ${ship.progress}%"></div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <div class="text-blue-100">Operation</div>
                    <div class="font-semibold">${ship.operationType}</div>
                </div>
                <div>
                    <div class="text-blue-100">Vehicles</div>
                    <div class="font-semibold">${ship.totalVehicles.toLocaleString()}</div>
                </div>
            </div>

            <div class="mt-4 pt-4 border-t border-white border-opacity-20">
                <div class="text-xs text-blue-100 mb-1">Teams</div>
                <div class="text-sm">
                    <div><strong>Auto:</strong> ${ship.autoOpsLead}, ${ship.autoOpsAssistant}</div>
                    <div><strong>H&H:</strong> ${ship.heavyOpsLead}, ${ship.heavyOpsAssistant}</div>
                </div>
            </div>

            <div class="mt-3 text-xs text-blue-100">
                Manager: ${ship.operationManager} | ${ship.startTime} - ${ship.estimatedCompletion}
            </div>

            <div class="mt-4 pt-4 border-t border-white border-opacity-20">
                <div class="flex space-x-2">
                    ${ship.status !== 'complete' ? `
                        <button onclick="markShipComplete(${ship.id})" class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-check mr-1"></i>Mark Complete
                        </button>
                    ` : `
                        <div class="flex-1 bg-white bg-opacity-20 text-white px-3 py-2 rounded-lg text-sm font-semibold text-center">
                            <i class="fas fa-check-circle mr-1"></i>Completed
                        </div>
                    `}
                    <button onclick="editShip(${ship.id})" class="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = shipsHtml;
}

function getStatusClass(status) {
    switch (status) {
        case 'active': return 'status-active';
        case 'loading': return 'status-loading';
        case 'discharge': return 'status-discharge';
        case 'complete': return 'status-complete';
        default: return 'ship-card';
    }
}

function createNewOperation() {
    // TODO: Implement new operation creation
    alert('New operation creation will be implemented soon!');
}

async function handleMasterFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('masterUploadStatus').classList.remove('hidden');
    document.getElementById('masterUploadSuccess').classList.add('hidden');

    try {
        const formData = new FormData();
        formData.append('file', file);

        // Use offline storage manager for consistent handling
        let uploadResult;
        if (window.offlineStorage && window.offlineStorage.isOnline()) {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            uploadResult = await response.json();
        } else {
            throw new Error('File upload requires internet connection');
        }

        if (uploadResult.success) {
            const extractResult = await (window.offlineStorage ? 
                window.offlineStorage.apiCall('/api/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: { file_path: uploadResult.file_path }
                }) :
                fetch('/api/extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ file_path: uploadResult.file_path })
                }).then(r => r.json())
            );

            document.getElementById('masterUploadStatus').classList.add('hidden');
            if (extractResult.success) {
                document.getElementById('masterUploadSuccess').classList.remove('hidden');
                console.log('Document processed successfully:', extractResult.parsed_data);
                
                if (confirm('Document processed successfully! Would you like to create a new operation with this data?')) {
                    window.location.href = '/';
                }
            } else {
                throw new Error(extractResult.error || 'Extraction failed');
            }
        } else {
            throw new Error(uploadResult.error || 'Upload failed');
        }
    } catch (error) {
        document.getElementById('masterUploadStatus').classList.add('hidden');
        
        // Show offline-specific error if applicable
        const errorMessage = !navigator.onLine ? 
            'File upload is not available offline. Please connect to the internet and try again.' :
            'Error processing document: ' + error.message;
            
        alert(errorMessage);
        console.error('Error:', error);
    }
}

function goToCalendar() {
    window.location.href = '/calendar';
}

function goToAnalytics() {
    window.location.href = '/analytics';
}

function viewShipDetails(shipId) {
    window.location.href = `/ship-info?ship=${shipId}`;
}

function viewBerthDetails(berth) {
    const ship = ships.find(s => s.berth === berth);
    if (ship) {
        viewShipDetails(ship.id);
    }
}

function filterShips() {
    const filter = document.getElementById('filterStatus').value;
    renderShips(filter);
}

function refreshShips() {
    const currentFilter = document.getElementById('filterStatus').value;
    loadShips().then(() => {
        renderShips(currentFilter);
    });
}

async function markShipComplete(shipId) {
    if (!confirm('Are you sure you want to mark this ship operation as complete?')) {
        return;
    }

    try {
        // Use offline storage manager for consistent offline/online handling
        if (window.offlineStorage) {
            await window.offlineStorage.apiCall(`/api/ships/${shipId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: { status: 'complete' }
            });
            
            await window.offlineStorage.apiCall(`/api/ships/${shipId}/progress`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: { progress: 100 }
            });
            
            // Update local data immediately
            const ship = ships.find(s => s.id === shipId);
            if (ship) {
                ship.status = 'complete';
                ship.progress = 100;
            }
        } else {
            const response = await fetch(`/api/ships/${shipId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'complete' })
            });

            if (response.ok) {
                await fetch(`/api/ships/${shipId}/progress`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ progress: 100 })
                });
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Unknown error');
            }
        }

        loadShips(); // Refresh the dashboard
        alert('Ship operation marked as complete!');
    } catch (error) {
        console.error('Error marking ship complete:', error);
        alert('Error marking ship complete: ' + error.message);
    }
}

function editShip(shipId) {
    window.location.href = `/ship-info?ship=${shipId}`;
}

// Interactive stat box functions
function showActiveShipsDetails() {
    const activeShips = ships.filter(ship => ship.status !== 'complete');
    
    let content = `
        <div class="space-y-4">
            <div class="flex items-center mb-4">
                <i class="fas fa-ship text-2xl text-blue-600 mr-3"></i>
                <h3 class="text-xl font-bold text-gray-900">Active Ships Details</h3>
            </div>
    `;

    if (activeShips.length === 0) {
        content += `
            <div class="text-center py-8">
                <i class="fas fa-ship text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No active ships currently</p>
                <p class="text-gray-400 text-sm mt-2">Ships will appear here when operations are created</p>
            </div>
        `;
    } else {
        content += `<div class="grid gap-4">`;
        activeShips.forEach(ship => {
            content += `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-semibold text-blue-900">${ship.vesselName}</h4>
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${ship.status}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Berth:</strong> ${ship.berth}</div>
                        <div><strong>Progress:</strong> ${ship.progress}%</div>
                        <div><strong>Vehicles:</strong> ${ship.totalVehicles.toLocaleString()}</div>
                        <div><strong>Operation:</strong> ${ship.operationType}</div>
                        <div><strong>Auto Lead:</strong> ${ship.autoOpsLead}</div>
                        <div><strong>Heavy Lead:</strong> ${ship.heavyOpsLead}</div>
                    </div>
                    <div class="mt-2">
                        <button onclick="viewShipDetails(${ship.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                            View Details
                        </button>
                    </div>
                </div>
            `;
        });
        content += `</div>`;
    }
    
    content += `</div>`;
    showModal('Active Ships', content);
}

function showTeamsDetails() {
    const activeShips = ships.filter(ship => ship.status !== 'complete');
    
    let content = `
        <div class="space-y-4">
            <div class="flex items-center mb-4">
                <i class="fas fa-users text-2xl text-green-600 mr-3"></i>
                <h3 class="text-xl font-bold text-gray-900">Teams Deployed</h3>
            </div>
    `;

    if (activeShips.length === 0) {
        content += `
            <div class="text-center py-8">
                <i class="fas fa-users text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No teams currently deployed</p>
                <p class="text-gray-400 text-sm mt-2">Teams will appear here when ship operations are active</p>
            </div>
        `;
    } else {
        content += `<div class="grid gap-4">`;
        activeShips.forEach(ship => {
            content += `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 mb-3">${ship.vesselName} - ${ship.berth}</h4>
                    <div class="grid gap-3">
                        <div class="bg-white p-3 rounded border">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-car text-blue-600 mr-2"></i>
                                <span class="font-medium">Auto Operations Team</span>
                            </div>
                            <div class="text-sm">
                                <div><strong>Lead:</strong> ${ship.autoOpsLead}</div>
                                <div><strong>Assistant:</strong> ${ship.autoOpsAssistant}</div>
                                <div><strong>Drivers:</strong> ${ship.totalDrivers || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="bg-white p-3 rounded border">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-truck text-orange-600 mr-2"></i>
                                <span class="font-medium">Heavy Equipment Team</span>
                            </div>
                            <div class="text-sm">
                                <div><strong>Lead:</strong> ${ship.heavyOpsLead}</div>
                                <div><strong>Assistant:</strong> ${ship.heavyOpsAssistant}</div>
                                <div><strong>Operation:</strong> ${ship.operationType}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        content += `</div>`;
    }
    
    content += `</div>`;
    showModal('Teams Deployed', content);
}

function showVehiclesDetails() {
    const activeShips = ships.filter(ship => ship.status !== 'complete');
    
    // Calculate totals from real data
    const totalAutomobiles = activeShips.reduce((sum, ship) => sum + (ship.totalAutomobilesDischarge || 0), 0);
    const totalHeavyEquipment = activeShips.reduce((sum, ship) => sum + (ship.heavyEquipmentDischarge || 0), 0);
    const totalElectricVehicles = activeShips.reduce((sum, ship) => sum + (ship.totalElectricVehicles || 0), 0);
    const totalVehicles = activeShips.reduce((sum, ship) => sum + (ship.totalVehicles || 0), 0);
    
    let content = `
        <div class="space-y-4">
            <div class="flex items-center mb-4">
                <i class="fas fa-car text-2xl text-yellow-600 mr-3"></i>
                <h3 class="text-xl font-bold text-gray-900">Unit Breakdown</h3>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-blue-50 p-4 rounded-lg text-center">
                    <i class="fas fa-car text-2xl text-blue-600 mb-2"></i>
                    <p class="text-2xl font-bold text-blue-600">${totalAutomobiles.toLocaleString()}</p>
                    <p class="text-sm text-gray-600">Total Autos</p>
                </div>
                <div class="bg-orange-50 p-4 rounded-lg text-center">
                    <i class="fas fa-truck text-2xl text-orange-600 mb-2"></i>
                    <p class="text-2xl font-bold text-orange-600">${totalHeavyEquipment.toLocaleString()}</p>
                    <p class="text-sm text-gray-600">Total Heavy</p>
                </div>
                <div class="bg-green-50 p-4 rounded-lg text-center">
                    <i class="fas fa-bolt text-2xl text-green-600 mb-2"></i>
                    <p class="text-2xl font-bold text-green-600">${totalElectricVehicles.toLocaleString()}</p>
                    <p class="text-sm text-gray-600">Electric Vehicles</p>
                </div>
                <div class="bg-purple-50 p-4 rounded-lg text-center">
                    <i class="fas fa-calculator text-2xl text-purple-600 mb-2"></i>
                    <p class="text-2xl font-bold text-purple-600">${totalVehicles.toLocaleString()}</p>
                    <p class="text-sm text-gray-600">Total Units</p>
                </div>
            </div>
    `;

    if (activeShips.length > 0) {
        content += `
            <div class="mt-6">
                <h4 class="font-semibold text-gray-900 mb-3">Vehicle Details by Ship</h4>
                <div class="space-y-3">
        `;
        activeShips.forEach(ship => {
            content += `
                <div class="bg-gray-50 p-3 rounded border">
                    <div class="font-medium text-gray-900 mb-2">${ship.vesselName}</div>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>Total Autos: ${(ship.totalAutomobilesDischarge || 0).toLocaleString()}</div>
                        <div>Total Heavy: ${(ship.heavyEquipmentDischarge || 0).toLocaleString()}</div>
                        <div>Electric Vehicles: ${(ship.totalElectricVehicles || 0).toLocaleString()}</div>
                        <div>Progress: ${ship.progress}%</div>
                    </div>
                </div>
            `;
        });
        content += `
                </div>
            </div>
        `;
    } else {
        content += `
            <div class="text-center py-4">
                <p class="text-gray-500">No vehicles currently being processed</p>
                <p class="text-gray-400 text-sm mt-2">Vehicle data will appear when operations are active</p>
            </div>
        `;
    }
    
    content += `</div>`;
    showModal('Unit Details', content);
}

function showBerthsDetails() {
    const activeShips = ships.filter(ship => ship.status !== 'complete');
    
    // Create berth occupancy map
    const berthMap = {};
    activeShips.forEach(ship => {
        if (ship.berth) {
            berthMap[ship.berth] = ship;
        }
    });
    
    let content = `
        <div class="space-y-4">
            <div class="flex items-center mb-4">
                <i class="fas fa-anchor text-2xl text-purple-600 mr-3"></i>
                <h3 class="text-xl font-bold text-gray-900">Berth Status</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    `;

    for (let i = 1; i <= 3; i++) {
        const berthName = `Berth ${i}`;
        const ship = berthMap[berthName];
        
        if (ship) {
            content += `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <div class="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                        <h4 class="font-semibold text-blue-900">${berthName}</h4>
                    </div>
                    <div class="text-sm">
                        <div class="font-medium text-blue-900">${ship.vesselName}</div>
                        <div class="text-blue-700">Status: ${ship.status}</div>
                        <div class="text-blue-700">Progress: ${ship.progress}%</div>
                        <div class="text-blue-700">Vehicles: ${ship.totalVehicles.toLocaleString()}</div>
                        <div class="text-xs text-blue-600 mt-1">${ship.operationType}</div>
                    </div>
                    <button onclick="viewShipDetails(${ship.id})" class="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs">
                        View Details
                    </button>
                </div>
            `;
        } else {
            content += `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div class="flex items-center mb-2">
                        <div class="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                        <h4 class="font-semibold text-gray-700">${berthName}</h4>
                    </div>
                    <div class="text-sm text-gray-500">
                        <p>Available</p>
                        <p class="text-xs">No active operations</p>
                    </div>
                </div>
            `;
        }
    }

    content += `
            </div>
            <div class="mt-4 text-center">
                <p class="text-gray-600">Berths occupied: ${Object.keys(berthMap).length} of 3</p>
                <p class="text-gray-400 text-sm mt-1">Real-time berth status based on active operations</p>
            </div>
        </div>
    `;
    showModal('Berth Status', content);
}

function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl max-w-4xl max-h-[90vh] w-full overflow-y-auto">
            <div class="p-6 border-b border-gray-200">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">${title}</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            <div class="p-6">
                ${content}
            </div>
        </div>
    `;
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

// Chart initialization and management
function initializeCharts() {
    // Initialize progress overview chart
    const progressCtx = document.getElementById('progressChart');
    if (progressCtx) {
        charts.progress = new Chart(progressCtx, {
            type: 'doughnut',
            data: {
                labels: ['In Progress', 'Loading', 'Discharge', 'Complete'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#3b82f6', // blue
                        '#f59e0b', // amber
                        '#10b981', // emerald
                        '#6b7280'  // gray
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Initialize vehicle distribution chart
    const vehicleCtx = document.getElementById('vehicleChart');
    if (vehicleCtx) {
        charts.vehicle = new Chart(vehicleCtx, {
            type: 'bar',
            data: {
                labels: ['Automobiles', 'Heavy Equipment', 'Electric Vehicles'],
                datasets: [{
                    label: 'Total Units',
                    data: [0, 0, 0],
                    backgroundColor: [
                        '#3b82f6',
                        '#f59e0b',
                        '#10b981'
                    ],
                    borderRadius: 6
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
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (!ships || ships.length === 0) {
        // Reset charts when no data
        if (charts.progress) {
            charts.progress.data.datasets[0].data = [0, 0, 0, 0];
            charts.progress.update();
        }
        if (charts.vehicle) {
            charts.vehicle.data.datasets[0].data = [0, 0, 0];
            charts.vehicle.update();
        }
        return;
    }

    // Update progress chart
    if (charts.progress) {
        const statusCounts = {
            active: ships.filter(s => s.status === 'active').length,
            loading: ships.filter(s => s.status === 'loading').length,
            discharge: ships.filter(s => s.status === 'discharge').length,
            complete: ships.filter(s => s.status === 'complete').length
        };
        
        charts.progress.data.datasets[0].data = [
            statusCounts.active,
            statusCounts.loading,
            statusCounts.discharge,
            statusCounts.complete
        ];
        charts.progress.update();
    }

    // Update vehicle distribution chart
    if (charts.vehicle) {
        const vehicleTotals = {
            automobiles: ships.reduce((sum, ship) => sum + (ship.totalAutomobilesDischarge || 0), 0),
            heavyEquipment: ships.reduce((sum, ship) => sum + (ship.heavyEquipmentDischarge || 0), 0),
            electricVehicles: ships.reduce((sum, ship) => sum + (ship.totalElectricVehicles || 0), 0)
        };
        
        charts.vehicle.data.datasets[0].data = [
            vehicleTotals.automobiles,
            vehicleTotals.heavyEquipment,
            vehicleTotals.electricVehicles
        ];
        charts.vehicle.update();
    }
}

// Offline functionality setup
function setupOfflineHandlers() {
    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            const { action, data } = event.data;
            
            if (action === 'SYNC_DATA') {
                loadShips();
            }
        });
    }
    
    // Handle online/offline status changes
    window.addEventListener('online', () => {
        console.log('Back online - refreshing data');
        loadShips();
    });
    
    window.addEventListener('offline', () => {
        console.log('Gone offline - using cached data');
    });
}
