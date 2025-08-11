// CODAGE11 3D Pricer - Main JavaScript

// Global variables
let currentFileData = null;
let materials = {};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CODAGE11 3D Pricer initialized');
    
    // Load materials data
    loadMaterials();
    
    // Initialize file handling
    initializeFileHandling();
    
    // Initialize UI components
    initializeUI();
});

// Load available materials from API
async function loadMaterials() {
    try {
        const response = await fetch('/api/materials');
        materials = await response.json();
        
        // Update materials grid on homepage
        updateMaterialsGrid();
        
        console.log('✅ Materials loaded:', Object.keys(materials).length);
    } catch (error) {
        console.error('❌ Error loading materials:', error);
        showAlert('Erreur lors du chargement des matériaux', 'danger');
    }
}

// Update materials grid display
function updateMaterialsGrid() {
    const materialsGrid = document.getElementById('materialsGrid');
    if (!materialsGrid) return;
    
    materialsGrid.innerHTML = '';
    
    Object.entries(materials).forEach(([key, material]) => {
        const materialCard = createMaterialCard(key, material);
        materialsGrid.appendChild(materialCard);
    });
}

// Create material card element
function createMaterialCard(key, material) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3';
    
    col.innerHTML = `
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-body text-center p-4">
                <div class="material-icon bg-${getMaterialColor(key)} text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
                    <i class="fas fa-${getMaterialIcon(key)} fa-2x"></i>
                </div>
                <h6 class="fw-bold">${material.name}</h6>
                <p class="text-muted small mb-2">Densité: ${material.density} g/cm³</p>
                <p class="text-success fw-bold">€${material.price_per_kg}/kg</p>
                <div class="progress mb-2" style="height: 4px;">
                    <div class="progress-bar bg-${getMaterialColor(key)}" 
                         style="width: ${material.print_speed_modifier * 100}%"></div>
                </div>
                <small class="text-muted">Vitesse d'impression</small>
            </div>
        </div>
    `;
    
    return col;
}

// Get material icon based on type
function getMaterialIcon(material) {
    const icons = {
        'PLA': 'leaf',
        'ABS': 'shield-alt',
        'PETG': 'flask',
        'TPU': 'hand-paper'
    };
    return icons[material] || 'cube';
}

// Get material color based on type
function getMaterialColor(material) {
    const colors = {
        'PLA': 'success',
        'ABS': 'primary',
        'PETG': 'info',
        'TPU': 'warning'
    };
    return colors[material] || 'secondary';
}

// Initialize file handling
function initializeFileHandling() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    if (dropZone) {
        // Drag and drop events
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
        
        // Click to upload
        dropZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }
}

// Handle drag over event
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('.drop-zone').classList.add('dragover');
}

// Handle drag leave event
function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.closest('.drop-zone').classList.remove('dragover');
}

// Handle drop event
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const dropZone = e.target.closest('.drop-zone');
    dropZone.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

// Open file dialog
function openFileDialog() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.click();
    }
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

// Process uploaded file
function processFile(file) {
    console.log('📁 Processing file:', file.name);
    
    // Validate file type
    const allowedTypes = ['.stl', '.obj', '.ply', '.step', '.stp'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
        showAlert('Type de fichier non supporté. Formats acceptés: STL, OBJ, PLY, STEP', 'danger');
        return;
    }
    
    // Store file data
    currentFileData = file;
    
    // Redirect to upload page for analysis
    const params = new URLSearchParams();
    params.append('filename', file.name);
    params.append('size', file.size);
    
    window.location.href = `/upload?${params.toString()}`;
}

// Initialize UI components
function initializeUI() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Show alert message
function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-dismiss after duration
    if (duration > 0) {
        setTimeout(() => {
            const alert = document.getElementById(alertId);
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, duration);
    }
}

// Get alert icon based on type
function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format currency
function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
}

// Format time duration
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${Math.round(minutes)} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours < 24) {
        return `${hours}h ${mins}min`;
    }
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    
    return `${days}j ${remainingHours}h`;
}

// Navigate to page with file data
function navigateWithFile(page) {
    if (!currentFileData) {
        showAlert('Aucun fichier sélectionné', 'warning');
        return;
    }
    
    // Store file in sessionStorage for cross-page access
    const reader = new FileReader();
    reader.onload = function(e) {
        sessionStorage.setItem('currentFile', JSON.stringify({
            name: currentFileData.name,
            size: currentFileData.size,
            type: currentFileData.type,
            data: e.target.result
        }));
        
        window.location.href = page;
    };
    reader.readAsDataURL(currentFileData);
}

// Get file from session storage
function getStoredFile() {
    const stored = sessionStorage.getItem('currentFile');
    return stored ? JSON.parse(stored) : null;
}

// Clear stored file
function clearStoredFile() {
    sessionStorage.removeItem('currentFile');
}

// Export functions for global access
window.CODAGE11 = {
    materials,
    currentFileData,
    loadMaterials,
    processFile,
    showAlert,
    formatFileSize,
    formatCurrency,
    formatDuration,
    navigateWithFile,
    getStoredFile,
    clearStoredFile,
    openFileDialog,
    handleFileSelect
};