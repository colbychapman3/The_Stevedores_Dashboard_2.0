let currentStep = 1;
let extractedData = {};

// Initialize wizard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load any saved wizard data
    loadSavedWizardData();
    
    // Auto-save form data as user types
    setupAutoSave();
});

// Wizard navigation functions
function nextStep(step) {
    if (validateStep(step)) {
        // Save current step data
        saveStepData(step);
        
        document.getElementById(`step${step}`).classList.add('hidden');
        document.getElementById(`step${step + 1}`).classList.remove('hidden');

        // Update step indicators
        document.getElementById(`step${step}-indicator`).classList.remove('step-active');
        document.getElementById(`step${step}-indicator`).classList.add('step-completed');
        document.getElementById(`step${step + 1}-indicator`).classList.add('step-active');

        currentStep = step + 1;

        if (step === 3) {
            generateReviewSummary();
        }
    }
}

function prevStep(step) {
    // Save current step data before going back
    saveStepData(step);
    
    document.getElementById(`step${step}`).classList.add('hidden');
    document.getElementById(`step${step - 1}`).classList.remove('hidden');

    // Update step indicators
    document.getElementById(`step${step}-indicator`).classList.remove('step-active');
    document.getElementById(`step${step - 1}-indicator`).classList.add('step-active');
    document.getElementById(`step${step - 1}-indicator`).classList.remove('step-completed');

    currentStep = step - 1;
}

function validateStep(step) {
    // Comprehensive validation for all steps
    if (step === 1) {
        // Step 1: Vessel Information
        const vesselName = document.getElementById('vesselName').value.trim();
        const shippingLine = document.getElementById('shippingLine').value;
        const vesselType = document.getElementById('vesselType').value;
        const port = document.getElementById('port').value;
        const operationDate = document.getElementById('operationDate').value;
        
        if (!vesselName || !shippingLine || !vesselType) {
            showValidationError('Please fill in the vessel name, shipping line, and vessel type.');
            return false;
        }
        
        if (!port) {
            showValidationError('Please select a port.');
            return false;
        }
        
        if (!operationDate) {
            showValidationError('Please select an operation date.');
            return false;
        }
        
        // Validate date is not too far in the past
        const selectedDate = new Date(operationDate);
        const today = new Date();
        const daysDiff = (today - selectedDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 30) {
            const confirm = showConfirmDialog('The selected date is more than 30 days ago. Are you sure you want to continue?');
            if (!confirm) return false;
        }
        
    } else if (step === 2) {
        // Step 2: Cargo Configuration
        const shippingLine = document.getElementById('shippingLine').value;
        
        if (shippingLine === 'K-Line') {
            // Validate K-Line specific fields
            const brvAutomobiles = parseInt(document.getElementById('brvAutomobiles')?.value) || 0;
            const zeeAutomobiles = parseInt(document.getElementById('zeeAutomobiles')?.value) || 0;
            const souAutomobiles = parseInt(document.getElementById('souAutomobiles')?.value) || 0;
            const totalAutomobiles = parseInt(document.getElementById('totalAutomobiles')?.value) || 0;
            
            const calculatedTotal = brvAutomobiles + zeeAutomobiles + souAutomobiles;
            
            if (Math.abs(calculatedTotal - totalAutomobiles) > 5) {
                showValidationError(`Total automobiles mismatch: ${calculatedTotal} (calculated) vs ${totalAutomobiles} (entered). Please verify the numbers.`);
                return false;
            }
        } else {
            // Validate single terminal fields
            const totalAutomobiles = parseInt(document.getElementById('totalAutomobiles')?.value) || 0;
            const heavyEquipment = parseInt(document.getElementById('heavyEquipment')?.value) || 0;
            
            if (totalAutomobiles <= 0 && heavyEquipment <= 0) {
                showValidationError('Please enter the number of automobiles and/or heavy equipment.');
                return false;
            }
        }
        
    } else if (step === 3) {
        // Step 3: Operational Parameters
        const expectedRate = parseFloat(document.getElementById('expectedRate')?.value) || 0;
        const totalDrivers = parseInt(document.getElementById('totalDrivers')?.value) || 0;
        const shiftStart = document.getElementById('shiftStart')?.value;
        const shiftEnd = document.getElementById('shiftEnd')?.value;
        
        if (expectedRate <= 0) {
            showValidationError('Please enter a valid expected rate (cars per hour).');
            return false;
        }
        
        if (totalDrivers <= 0) {
            showValidationError('Please enter the number of drivers.');
            return false;
        }
        
        if (!shiftStart || !shiftEnd) {
            showValidationError('Please select shift start and end times.');
            return false;
        }
        
        // Validate shift times
        const startTime = new Date('2000-01-01T' + shiftStart);
        const endTime = new Date('2000-01-01T' + shiftEnd);
        
        if (endTime <= startTime) {
            showValidationError('Shift end time must be after shift start time.');
            return false;
        }
        
        // Validate TICO vehicle counts
        const numVans = parseInt(document.getElementById('numVans')?.value) || 0;
        const numStationWagons = parseInt(document.getElementById('numStationWagons')?.value) || 0;
        const totalCapacity = (numVans * 7) + (numStationWagons * 5);
        
        if (totalCapacity > 0 && totalCapacity < totalDrivers) {
            const confirm = showConfirmDialog(`Vehicle capacity (${totalCapacity}) is less than total drivers (${totalDrivers}). Continue anyway?`);
            if (!confirm) return false;
        }
        
    } else if (step === 4) {
        // Step 4: Final Review
        // Additional validation before submission
        const vesselName = document.getElementById('vesselName').value.trim();
        const totalAutomobiles = parseInt(document.getElementById('totalAutomobiles')?.value) || 0;
        const totalDrivers = parseInt(document.getElementById('totalDrivers')?.value) || 0;
        
        if (!vesselName || (totalAutomobiles <= 0 && totalDrivers <= 0)) {
            showValidationError('Please complete all required fields before generating the dashboard.');
            return false;
        }
    }
    
    return true;
}

function showValidationError(message) {
    // Create or update validation error display
    let errorDiv = document.getElementById('validation-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'validation-error';
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
        
        // Insert at the top of the current step
        const currentStepDiv = document.getElementById(`step${currentStep}`);
        currentStepDiv.insertBefore(errorDiv, currentStepDiv.firstChild);
    }
    
    errorDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
    
    // Scroll to top of current step
    document.getElementById(`step${currentStep}`).scrollIntoView({ behavior: 'smooth' });
}

function showConfirmDialog(message) {
    return confirm(message);
}

// Auto-save functionality
function setupAutoSave() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            saveStepData(currentStep);
        });
        
        // Also save on input for text fields
        if (input.type === 'text' || input.type === 'number' || input.tagName === 'TEXTAREA') {
            input.addEventListener('input', debounce(() => {
                saveStepData(currentStep);
            }, 1000));
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function saveStepData(step) {
    if (!window.offlineStorage) return;
    
    const formData = collectFormData();
    const wizardData = {
        currentStep: step,
        formData: formData,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('wizard_progress', JSON.stringify(wizardData));
}

function loadSavedWizardData() {
    try {
        const savedData = localStorage.getItem('wizard_progress');
        if (savedData) {
            const wizardData = JSON.parse(savedData);
            
            // Check if data is recent (within 24 hours)
            const savedTime = new Date(wizardData.timestamp);
            const now = new Date();
            const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                if (confirm('Found saved wizard progress. Would you like to restore it?')) {
                    populateFormFields(wizardData.formData);
                }
            }
        }
    } catch (error) {
        console.error('Failed to load saved wizard data:', error);
    }
}

function collectFormData() {
    const data = {};
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.id) {
            if (input.type === 'checkbox') {
                data[input.id] = input.checked;
            } else if (input.type === 'radio') {
                if (input.checked) {
                    data[input.name] = input.value;
                }
            } else {
                data[input.id] = input.value;
            }
        }
    });
    
    return data;
}

// Wizard file upload functions
function handleWizardFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show upload status
    document.getElementById('wizardUploadStatus').classList.remove('hidden');
    document.getElementById('wizardUploadSuccess').classList.add('hidden');
    document.getElementById('wizardUploadError').classList.add('hidden');

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
        document.getElementById('wizardUploadStatus').classList.add('hidden');
        if (data.success) {
            document.getElementById('wizardUploadSuccess').classList.remove('hidden');
            console.log('Document processed successfully:', data.parsed_data);

            // Auto-populate form fields with extracted data
            populateFormFields(data.parsed_data);

            // Store extracted data globally
            extractedData = data.parsed_data;
        } else {
            throw new Error(data.error || 'Extraction failed');
        }
    })
    .catch(error => {
        document.getElementById('wizardUploadStatus').classList.add('hidden');
        document.getElementById('wizardUploadError').classList.remove('hidden');
        document.getElementById('wizardUploadErrorText').textContent = 'Error processing document: ' + error.message;
        console.error('Error:', error);
    });
}

function populateFormFields(data) {
    // Populate Step 1 fields
    if (data.vesselName) document.getElementById('vesselName').value = data.vesselName;
    if (data.vesselType) document.getElementById('vesselType').value = data.vesselType;
    if (data.port) document.getElementById('port').value = data.port;
    if (data.company) document.getElementById('company').value = data.company;
    if (data.operationType) document.getElementById('operationType').value = data.operationType;
    if (data.operationDate) document.getElementById('operationDate').value = data.operationDate;
    if (data.berth) document.getElementById('berth').value = data.berth;
    if (data.shiftStart) document.getElementById('shiftStart').value = data.shiftStart;
    if (data.shiftEnd) document.getElementById('shiftEnd').value = data.shiftEnd;

    // Populate Step 2 fields
    if (data.autoOperationsLead) document.getElementById('autoOpsLead').value = data.autoOperationsLead;
    if (data.autoOperationsAssistant) document.getElementById('autoOpsAssistant').value = data.autoOperationsAssistant;
    if (data.heavyHeavyLead) document.getElementById('heavyOpsLead').value = data.heavyHeavyLead;
    if (data.heavyHeavyAssistant) document.getElementById('heavyOpsAssistant').value = data.heavyHeavyAssistant;
    if (data.operationManager) document.getElementById('operationManager').value = data.operationManager;

    // Populate Step 3 fields
    if (data.totalAutos) document.getElementById('totalAutos').value = data.totalAutos;
    if (data.totalHeavy) document.getElementById('totalHeavy').value = data.totalHeavy;
    if (data.cargoType) document.getElementById('cargoType').value = data.cargoType;

    // Show success message briefly
    setTimeout(() => {
        document.getElementById('wizardUploadSuccess').classList.add('hidden');
    }, 5000);
}

// File upload functions
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show upload status
    document.getElementById('uploadStatus').classList.remove('hidden');
    document.getElementById('uploadSuccess').classList.add('hidden');
    document.getElementById('uploadError').classList.add('hidden');

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
        document.getElementById('uploadStatus').classList.add('hidden');

        if (data.success) {
            document.getElementById('uploadSuccess').classList.remove('hidden');
            extractedData = data.parsed_data;

            // Debug logging
            console.log('Extraction successful!');
            console.log('Parsed data:', data.parsed_data);
            console.log('Debug info:', data.debug_info);

            // Show debug info to user
            if (Object.keys(data.parsed_data).length === 0) {
                alert(`No data extracted from document. 
Text length: ${data.debug_info?.text_length || 'unknown'}
First 200 chars: ${data.debug_info?.first_200_chars || 'N/A'}

This might indicate the document format is not recognized. Please check the console for more details.`);
            }

            populateFormFields(data.parsed_data);
        } else {
            throw new Error(data.error || 'Extraction failed');
        }
    })
    .catch(error => {
        document.getElementById('uploadStatus').classList.add('hidden');
        document.getElementById('uploadError').classList.remove('hidden');
        document.getElementById('errorText').textContent = error.message;
        console.error('Error:', error);
    });
}


function updateFormField(fieldId, value) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.value = value;
        console.log(`Updated ${fieldId} with value:`, value);
    } else {
        console.log(`Field with ID '${fieldId}' not found`);
    }
}

function updateCargoConfiguration() {
    const shippingLine = document.getElementById('shippingLine').value;
    const vesselType = document.getElementById('vesselType').value;
    const klineConfig = document.getElementById('klineConfiguration');
    const singleTerminalConfig = document.getElementById('singleTerminalConfiguration');

    // Hide all configurations first
    klineConfig.classList.add('hidden');
    singleTerminalConfig.classList.add('hidden');

    // Hide/show vessel type specific fields
    const autoOnlyFields = document.querySelectorAll('.auto-only-field');
    const heavyOnlyFields = document.querySelectorAll('.heavy-only-field');
    const autoHeavyFields = document.querySelectorAll('.auto-heavy-field');

    // Hide all fields first
    autoOnlyFields.forEach(field => field.style.display = 'none');
    heavyOnlyFields.forEach(field => field.style.display = 'none');
    autoHeavyFields.forEach(field => field.style.display = 'none');

    // Show appropriate configuration based on shipping line
    if (shippingLine === 'K-Line') {
        klineConfig.classList.remove('hidden');
    } else if (shippingLine === 'Glovis' || shippingLine === 'MOL' || shippingLine === 'Grimaldi') {
        singleTerminalConfig.classList.remove('hidden');
    }

    // Show fields based on vessel type
    if (vesselType === 'Auto Only') {
        autoOnlyFields.forEach(field => field.style.display = 'block');
    } else if (vesselType === 'Heavy Only') {
        heavyOnlyFields.forEach(field => field.style.display = 'block');
    } else if (vesselType === 'Auto + Heavy') {
        autoHeavyFields.forEach(field => field.style.display = 'block');
    }
}

function generateVehicleIdFields() {
    const numVans = parseInt(document.getElementById('numVans').value) || 0;
    const numWagons = parseInt(document.getElementById('numStationWagons').value) || 0;
    const container = document.getElementById('vehicleIdFields');

    let html = '';

    if (numVans > 0 || numWagons > 0) {
        html += '<h4 class="text-lg font-semibold text-gray-800 mb-4">Vehicle ID Numbers</h4>';
        html += '<div class="grid md:grid-cols-2 gap-4">';

        // Van IDs
        for (let i = 1; i <= numVans; i++) {
            html += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Van ${i} ID</label>
                    <input type="text" id="vanId${i}" class="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500" placeholder="e.g., V${i}">
                </div>
            `;
        }

        // Station Wagon IDs
        for (let i = 1; i <= numWagons; i++) {
            html += `
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Station Wagon ${i} ID</label>
                    <input type="text" id="wagonId${i}" class="w-full px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-blue-500" placeholder="e.g., SW${i}">
                </div>
            `;
        }

        html += '</div>';
    }

    container.innerHTML = html;
}

function generateReviewSummary() {
    const vesselName = document.getElementById('vesselName').value || 'Not specified';
    const vesselType = document.getElementById('vesselType').value || 'Not specified';
    const totalAutos = document.getElementById('totalAutomobiles').value || '0';
    const heavyEquip = document.getElementById('heavyEquipment').value || '0';
    const expectedRate = document.getElementById('expectedRate').value || 'Not specified';

    const summaryHtml = `
        <h3 class="text-xl font-bold mb-4">Operation Summary</h3>
        <div class="grid md:grid-cols-2 gap-4">
            <div>
                <p><strong>Vessel:</strong> ${vesselName}</p>
                <p><strong>Type:</strong> ${vesselType}</p>
                <p><strong>Total Automobiles:</strong> ${totalAutos}</p>
            </div>
            <div>
                <p><strong>Heavy Equipment:</strong> ${heavyEquip}</p>
                <p><strong>Expected Rate:</strong> ${expectedRate} cars/hour</p>
                <p><strong>Port:</strong> ${document.getElementById('port').value || 'Not specified'}</p>
            </div>
        </div>
    `;

    document.getElementById('reviewSummary').innerHTML = summaryHtml;
}

function generateDashboard() {
    // Hide wizard and show dashboard
    document.getElementById('wizardInterface').classList.add('hidden');
    document.getElementById('dashboardInterface').classList.remove('hidden');

    // Populate dashboard with form data
    populateDashboard();
}

function populateDashboard() {
    // This would populate the dashboard with the collected data
    // For now, redirect to the master dashboard
    window.location.href = '/master';
}

function showWizard() {
    document.getElementById('dashboardInterface').classList.add('hidden');
    document.getElementById('wizardInterface').classList.remove('hidden');
}

// Set default date to today and time
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('operationDate').value = today;

    // Set current time for ETC calculation
    const now = new Date();
    const currentTimeStr = now.toTimeString().slice(0, 5);
    const currentTimeInput = document.getElementById('currentTime');
    if (currentTimeInput) {
        currentTimeInput.value = currentTimeStr;
    }
});

function addVehicleType(facility) {
    const containerId = `${facility}VehicleTypeContainer`;
    const container = document.getElementById(containerId);
    const index = container.children.length;

    const newDiv = document.createElement('div');
    newDiv.className = "grid grid-cols-3 gap-4 mb-4";
    newDiv.innerHTML = `
        <div class="w-full">
            <label class="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
            <input type="text" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" id="${facility}VehicleType${index}" name="${facility}VehicleType${index}" placeholder="e.g., Sedan">
        </div>
        <div class="w-full">
            <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input type="number" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" id="${facility}VehicleQuantity${index}" name="${facility}VehicleQuantity${index}" placeholder="e.g., 100">
        </div>
        <div class="w-full">
            <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input type="text" class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent" id="${facility}VehicleLocation${index}" name="${facility}VehicleLocation${index}" placeholder="e.g., North Terminal">
        </div>
    `;
    container.appendChild(newDiv);
}

function toggleElectricQuantity(facility, show) {
    const quantityField = document.getElementById(`${facility}TotalElectric`) || document.getElementById(`${facility}ElectricVehicles`);
    if (quantityField) {
        quantityField.style.display = show ? 'block' : 'none';
        if (!show) {
            quantityField.value = '';
        }
    }
}

function getVehicleTypeData(facility) {
    const container = document.getElementById(`${facility}VehicleTypeContainer`);
    const vehicleTypes = [];
    for (let i = 0; i < container.children.length; i++) {
        const type = document.getElementById(`${facility}VehicleType${i}`).value;
        const quantity = parseInt(document.getElementById(`${facility}VehicleQuantity${i}`).value) || 0;
        vehicleTypes.push({ type, quantity });
    }
    return vehicleTypes;
}

function validateTotals() {
    let warnings = [];

    // Validate BRV if K-Line is selected
    const shippingLine = document.getElementById('shippingLine').value;
    if (shippingLine === 'K-Line') {
        // BRV validation
        const brvTotalAutos = parseInt(document.getElementById('brvAutomobiles')?.value) || 0;
        if (brvTotalAutos > 0) {
            let brvVehicleTypeSum = 0;
            const brvContainer = document.getElementById('brvVehicleTypeContainer');
            if (brvContainer) {
                for (let i = 0; i < brvContainer.children.length; i++) {
                    const quantityInput = document.getElementById(`brvVehicleQuantity${i}`);
                    if (quantityInput) {
                        brvVehicleTypeSum += parseInt(quantityInput.value) || 0;
                    }
                }
                if (brvVehicleTypeSum !== brvTotalAutos) {
                    warnings.push(`BRV: Vehicle type quantities (${brvVehicleTypeSum}) don't match total autos (${brvTotalAutos})`);
                }
            }
        }

        // ZEE validation
        const zeeTotalAutos = parseInt(document.getElementById('zeeTotalAutos')?.value) || 0;
        if (zeeTotalAutos > 0) {
            let zeeVehicleTypeSum = 0;
            const zeeContainer = document.getElementById('zeeVehicleTypeContainer');
            if (zeeContainer) {
                for (let i = 0; i < zeeContainer.children.length; i++) {
                    const quantityInput = document.getElementById(`zeeVehicleQuantity${i}`);
                    if (quantityInput) {
                        zeeVehicleTypeSum += parseInt(quantityInput.value) || 0;
                    }
                }
                if (zeeVehicleTypeSum !== zeeTotalAutos) {
                    warnings.push(`ZEE: Vehicle type quantities (${zeeVehicleTypeSum}) don't match total autos (${zeeTotalAutos})`);
                }
            }
        }

        // SOU validation
        const souTotalAutos = parseInt(document.getElementById('souTotalAutos')?.value) || 0;
        if (souTotalAutos > 0) {
            let souVehicleTypeSum = 0;
            const souContainer = document.getElementById('souVehicleTypeContainer');
            if (souContainer) {
                for (let i = 0; i < souContainer.children.length; i++) {
                    const quantityInput = document.getElementById(`souVehicleQuantity${i}`);
                    if (quantityInput) {
                        souVehicleTypeSum += parseInt(quantityInput.value) || 0;
                    }
                }
                if (souVehicleTypeSum !== souTotalAutos) {
                    warnings.push(`SOU: Vehicle type quantities (${souVehicleTypeSum}) don't match total autos (${souTotalAutos})`);
                }
            }
        }
    } else {
        // Terminal validation for other shipping lines
        const terminalTotalAutos = parseInt(document.getElementById('terminalAutomobiles')?.value) || 0;
        if (terminalTotalAutos > 0) {
            let terminalVehicleTypeSum = 0;
            const terminalContainer = document.getElementById('terminalVehicleTypeContainer');
            if (terminalContainer) {
                for (let i = 0; i < terminalContainer.children.length; i++) {
                    const quantityInput = document.getElementById(`terminalVehicleQuantity${i}`);
                    if (quantityInput) {
                        terminalVehicleTypeSum += parseInt(quantityInput.value) || 0;
                    }
                }
                if (terminalVehicleTypeSum !== terminalTotalAutos) {
                    warnings.push(`Terminal: Vehicle type quantities (${terminalVehicleTypeSum}) don't match total autos (${terminalTotalAutos})`);
                }
            }
        }
    }

    return warnings;
}

async function submitOperation() {
    const data = {};

    // Validate required fields
    const vesselName = document.getElementById('vesselName')?.value?.trim();
    if (!vesselName) {
        alert('Please enter a vessel name');
        return;
    }
// Step 1: Basic Information
    data.vesselName = vesselName;
    data.vesselType = document.getElementById('vesselType')?.value || 'Auto Only';
    data.shippingLine = document.getElementById('shippingLine')?.value || '';
    data.port = document.getElementById('port')?.value || 'Colonel Island';
    data.operationDate = document.getElementById('operationDate')?.value || new Date().toISOString().split('T')[0];
    data.company = document.getElementById('company')?.value || 'APS Stevedoring';

    // Step 2: Operation Details
    data.operationType = document.getElementById('operationType')?.value || 'Discharge Only';
    data.berthLocation = document.getElementById('berthLocation')?.value || 'Berth 1';
    data.operationManager = document.getElementById('operationManager')?.value || '';

    // Step 3: Team Assignments
    data.autoOpsLead = document.getElementById('autoOpsLead')?.value || '';
    data.autoOpsAssistant = document.getElementById('autoOpsAssistant')?.value || '';
    data.heavyOpsLead = document.getElementById('heavyOpsLead')?.value || '';
    data.heavyOpsAssistant = document.getElementById('heavyOpsAssistant')?.value || '';

    // Step 4: Vehicle Data
    data.totalAutomobilesDischarge = parseInt(document.getElementById('totalAutomobilesDischarge')?.value) || 0;
    data.heavyEquipmentDischarge = parseInt(document.getElementById('heavyEquipmentDischarge')?.value) || 0;
    data.totalElectricVehicles = parseInt(document.getElementById('totalElectricVehicles')?.value) || 0;
    data.totalStaticCargo = parseInt(document.getElementById('totalStaticCargo')?.value) || 0;

    // Zone targets
    data.brvTarget = parseInt(document.getElementById('brvTarget')?.value) || 0;
    data.zeeTarget = parseInt(document.getElementById('zeeTarget')?.value) || 0;
    data.souTarget = parseInt(document.getElementById('souTarget')?.value) || 0;

    // Step 5: Operational Parameters
    data.expectedRate = parseInt(document.getElementById('expectedRate')?.value) || 150;
    data.totalDrivers = parseInt(document.getElementById('totalDrivers')?.value) || 30;
    data.shiftStart = document.getElementById('shiftStart')?.value || '07:00';
    data.shiftEnd = document.getElementById('shiftEnd')?.value || '15:00';
    data.breakDuration = parseInt(document.getElementById('breakDuration')?.value) || 0;
    data.targetCompletion = document.getElementById('targetCompletion')?.value || '';
    data.ticoVans = parseInt(document.getElementById('numVans')?.value) || 0;
    data.ticoStationWagons = parseInt(document.getElementById('numStationWagons')?.value) || 0;

    // Calculate total vehicles
    data.totalVehicles = (data.totalAutomobilesDischarge || 0) + (data.heavyEquipmentDischarge || 0) + (data.totalElectricVehicles || 0);

    // Ensure minimum values
    if (data.totalVehicles === 0) {
        data.totalVehicles = 100; // Default minimum
        data.totalAutomobilesDischarge = 100;
    }

    console.log('Submitting data:', data);

    try {
        const response = await fetch('/api/ships', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Ship operation created successfully!');
            window.location.href = `/ship-info?ship=${result.id}`;
        } else {
            const error = await response.json();
            alert('Error creating ship operation: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating operation:', error);
        alert('Error creating operation: ' + error.message);
    }
}

// Handle form submission
document.getElementById('operationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate totals and show warnings
    const warnings = validateTotals();
    if (warnings.length > 0) {
        const proceed = confirm('Warning:\n' + warnings.join('\n') + '\n\nDo you want to proceed anyway?');
        if (!proceed) return;
    }

    await submitForm();
});
// Handle form submission
document.getElementById('operationForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate totals and show warnings
    const warnings = validateTotals();
    if (warnings.length > 0) {
        const proceed = confirm(`Warning: The following totals don't match:\n\n${warnings.join('\n')}\n\nDo you want to proceed anyway?`);
        if (!proceed) {
            return;
        }
    }

    // Show processing state
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Generating Dashboard...';
    submitBtn.disabled = true;

    // Collect form data properly
    const data = {};

    // Step 1: Vessel Information
    data.vesselName = document.getElementById('vesselName').value || '';
    data.shippingLine = document.getElementById('shippingLine').value || '';
    data.vesselType = document.getElementById('vesselType').value || '';
    data.port = document.getElementById('port').value || '';
    data.operationDate = document.getElementById('operationDate').value || '';
    data.company = document.getElementById('company').value || '';
    data.operationType = document.getElementById('operationType').value || '';
    data.berthLocation = document.getElementById('berthLocation').value || '';
    data.operationManager = document.getElementById('operationManager').value || '';
    data.autoOpsLead = document.getElementById('autoOpsLead').value || '';
    data.autoOpsAssistant = document.getElementById('autoOpsAssistant').value || '';
    data.heavyOpsLead = document.getElementById('heavyOpsLead').value || '';
    data.heavyOpsAssistant = document.getElementById('heavyOpsAssistant').value || '';

    // Step 2: Cargo Configuration - determine configuration type
    const shippingLine = data.shippingLine;

    if (shippingLine === 'K-Line') {
        // K-Line: Collect from BRV, ZEE, SOU
        const brvAutos = parseInt(document.getElementById('brvAutomobiles')?.value) || 0;
        const brvHeavy = parseInt(document.getElementById('brvHeavyEquipment')?.value) || 0;
        const brvElectric = parseInt(document.getElementById('brvTotalElectric')?.value) || 0;

        const zeeAutos = parseInt(document.getElementById('zeeTotalAutos')?.value) || 0;
        const zeeHeavy = parseInt(document.getElementById('zeeTotalHeavy')?.value) || 0;
        const zeeElectric = parseInt(document.getElementById('zeeElectricVehicles')?.value) || 0;

        const souAutos = parseInt(document.getElementById('souTotalAutos')?.value) || 0;
        const souHeavy = parseInt(document.getElementById('souHeavyEquipment')?.value) || 0;
        const souElectric = parseInt(document.getElementById('souTotalElectric')?.value) || 0;

        data.totalAutomobilesDischarge = brvAutos + zeeAutos + souAutos;
        data.heavyEquipmentDischarge = brvHeavy + zeeHeavy + souHeavy;
        data.totalElectricVehicles = brvElectric + zeeElectric + souElectric;
        data.brvTarget = brvAutos + brvHeavy + brvElectric;
        data.zeeTarget = zeeAutos + zeeHeavy + zeeElectric;
        data.souTarget = souAutos + souHeavy + souElectric;
    } else {
        // Single Terminal: Glovis, MOL, Grimaldi
        const terminalAutos = parseInt(document.getElementById('terminalAutomobiles')?.value) || 0;
        const terminalHeavy = parseInt(document.getElementById('terminalHeavyEquipment')?.value) || 0;
        const terminalElectric = parseInt(document.getElementById('terminalElectricVehicles')?.value) || 0;
        const terminalStatic = parseInt(document.getElementById('terminalStaticCargo')?.value) || 0;

        data.totalAutomobilesDischarge = terminalAutos;
        data.heavyEquipmentDischarge = terminalHeavy;
        data.totalElectricVehicles = terminalElectric;
        data.totalStaticCargo = terminalStatic;
        data.brvTarget = 0;
        data.zeeTarget = 0;
        data.souTarget = terminalAutos + terminalHeavy + terminalElectric + terminalStatic;
    }

    // Step 3: Operational Parameters
    data.expectedRate = parseFloat(document.getElementById('expectedRate')?.value) || 0;
    data.totalDrivers = parseInt(document.getElementById('totalDrivers')?.value) || 0;
    data.shiftStart = document.getElementById('shiftStart')?.value || '';
    data.shiftEnd = document.getElementById('shiftEnd')?.value || '';
    data.breakDuration = parseInt(document.getElementById('breakDuration')?.value) || 0;
    data.targetCompletion = document.getElementById('targetCompletion')?.value || '';
    data.ticoVans = parseInt(document.getElementById('numVans')?.value) || 0;
    data.ticoStationWagons = parseInt(document.getElementById('numStationWagons')?.value) || 0;

    // Calculate total vehicles
    data.totalVehicles = (data.totalAutomobilesDischarge || 0) + (data.heavyEquipmentDischarge || 0) + (data.totalElectricVehicles || 0);

    console.log('Submitting data:', data);

    try {
        const response = await fetch('/api/ships', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Ship operation created successfully!');
            window.location.href = `/ship-info?ship=${result.id}`;
        } else {
            const error = await response.json();
            alert('Error creating ship operation: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating operation:', error);
        alert('Error creating operation: ' + error.message);
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});
