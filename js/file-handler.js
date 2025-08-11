// File Handler - Manages file upload and processing

class FileHandler {
    constructor() {
        this.currentFile = null;
        this.analysisResults = null;
        this.isAnalyzing = false;
        
        this.initializeUploadHandling();
    }
    
    initializeUploadHandling() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            // Setup drag and drop
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
            
            // Setup file input change
            fileInput.addEventListener('change', this.handleFileUpload.bind(this));
        }
        
        // Check for stored file from navigation
        this.checkStoredFile();
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processUploadedFile(files[0]);
        }
    }
    
    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processUploadedFile(file);
        }
    }
    
    processUploadedFile(file) {
        // Validate file type
        const allowedExtensions = ['.stl', '.obj', '.ply', '.step', '.stp'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            showAlert('Format de fichier non supporté. Utilisez: STL, OBJ, PLY, STEP', 'danger');
            return;
        }
        
        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            showAlert('Fichier trop volumineux. Taille maximale: 50MB', 'danger');
            return;
        }
        
        this.currentFile = file;
        this.displayFileInfo(file);
        this.showPrintParameters();
        
        console.log('✅ File uploaded:', file.name, formatFileSize(file.size));
        showAlert(`Fichier "${file.name}" chargé avec succès`, 'success');
    }
    
    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        
        if (fileInfo && fileName && fileSize) {
            fileName.textContent = file.name;
            fileSize.textContent = `Taille: ${formatFileSize(file.size)}`;
            fileInfo.classList.remove('d-none');
        }
    }
    
    showPrintParameters() {
        const printParameters = document.getElementById('printParameters');
        if (printParameters) {
            printParameters.classList.remove('d-none');
        }
        
        // Auto-detect supports based on file name or extension
        const needsSupports = this.detectSupportsNeeded();
        const supportsCheck = document.getElementById('supportsCheck');
        if (supportsCheck) {
            supportsCheck.checked = needsSupports;
        }
    }
    
    detectSupportsNeeded() {
        if (!this.currentFile) return false;
        
        const fileName = this.currentFile.name.toLowerCase();
        const supportKeywords = ['overhang', 'bridge', 'complex', 'figurine', 'miniature'];
        
        return supportKeywords.some(keyword => fileName.includes(keyword));
    }
    
    checkStoredFile() {
        const storedFile = getStoredFile();
        if (storedFile) {
            // Convert base64 back to File object
            this.restoreFileFromStorage(storedFile);
        }
    }
    
    restoreFileFromStorage(storedData) {
        try {
            // Convert base64 to blob
            const byteCharacters = atob(storedData.data.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: storedData.type });
            
            // Create File object
            const file = new File([blob], storedData.name, { type: storedData.type });
            
            this.processUploadedFile(file);
            
            // Clear storage after use
            clearStoredFile();
            
        } catch (error) {
            console.error('Error restoring file from storage:', error);
            clearStoredFile();
        }
    }
    
    async analyzeFile() {
        if (!this.currentFile) {
            showAlert('Aucun fichier sélectionné', 'warning');
            return;
        }
        
        if (this.isAnalyzing) {
            showAlert('Analyse en cours...', 'info');
            return;
        }
        
        this.isAnalyzing = true;
        
        try {
            // Show loading modal
            const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
            loadingModal.show();
            
            // Disable analyze button
            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn) {
                analyzeBtn.disabled = true;
                analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyse...';
            }
            
            // Prepare form data
            const formData = new FormData();
            formData.append('file', this.currentFile);
            formData.append('material', document.getElementById('materialSelect').value);
            formData.append('infill', document.getElementById('infillSlider').value);
            formData.append('layer_height', document.getElementById('layerHeightSelect').value);
            formData.append('include_supports', document.getElementById('supportsCheck').checked);
            
            // Send to API
            const response = await fetch('/api/analyze', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erreur lors de l\'analyse');
            }
            
            const results = await response.json();
            this.analysisResults = results;
            
            // Display results
            this.displayAnalysisResults(results);
            this.displayPricingResults(results);
            
            // Hide loading modal
            loadingModal.hide();
            
            showAlert('Analyse terminée avec succès!', 'success');
            
        } catch (error) {
            console.error('Analysis error:', error);
            showAlert(`Erreur d'analyse: ${error.message}`, 'danger');
            
            // Hide loading modal
            const loadingModal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
            if (loadingModal) loadingModal.hide();
            
        } finally {
            this.isAnalyzing = false;
            
            // Re-enable analyze button
            const analyzeBtn = document.getElementById('analyzeBtn');
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = '<i class="fas fa-cogs me-2"></i>Analyser & Calculer';
            }
        }
    }
    
    displayAnalysisResults(results) {
        const analysisCard = document.getElementById('analysisCard');
        const analysisResults = document.getElementById('analysisResults');
        
        if (!analysisCard || !analysisResults) return;
        
        const analysis = results.analysis;
        const pricing = results.pricing;
        
        analysisResults.innerHTML = `
            <div class="row g-3">
                <div class="col-6">
                    <div class="analysis-result">
                        <div class="analysis-value">${analysis.volume_cm3} cm³</div>
                        <div class="analysis-label">Volume</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="analysis-result">
                        <div class="analysis-value">${analysis.surface_area_cm2} cm²</div>
                        <div class="analysis-label">Surface</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="analysis-result">
                        <div class="analysis-value">${analysis.dimensions_cm.x}×${analysis.dimensions_cm.y}×${analysis.dimensions_cm.z}</div>
                        <div class="analysis-label">Dimensions (cm)</div>
                    </div>
                </div>
                <div class="col-6">
                    <div class="analysis-result">
                        <div class="analysis-value">${pricing.material.weight_g}g</div>
                        <div class="analysis-label">Poids matériau</div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="analysis-result">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="analysis-label">Étanche (imprimable)</span>
                            <span class="badge ${analysis.is_watertight ? 'bg-success' : 'bg-warning'}">
                                <i class="fas fa-${analysis.is_watertight ? 'check' : 'exclamation-triangle'} me-1"></i>
                                ${analysis.is_watertight ? 'Oui' : 'Attention'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="col-12">
                    <div class="analysis-result">
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="analysis-label">Supports recommandés</span>
                            <span class="badge ${analysis.needs_supports ? 'bg-warning' : 'bg-success'}">
                                <i class="fas fa-${analysis.needs_supports ? 'hand-paper' : 'check'} me-1"></i>
                                ${analysis.needs_supports ? 'Oui' : 'Non'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        analysisCard.classList.remove('d-none');
        analysisCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    displayPricingResults(results) {
        const pricingCard = document.getElementById('pricingCard');
        const pricingResults = document.getElementById('pricingResults');
        
        if (!pricingCard || !pricingResults) return;
        
        const pricing = results.pricing;
        
        pricingResults.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Détail des Coûts</h6>
                    <div class="pricing-breakdown">
                        <div class="pricing-item">
                            <span class="pricing-label">Matériau (${pricing.material.name})</span>
                            <span class="pricing-value">${formatCurrency(pricing.costs.material)}</span>
                        </div>
                        <div class="pricing-item">
                            <span class="pricing-label">Temps machine (${pricing.print_time.hours}h)</span>
                            <span class="pricing-value">${formatCurrency(pricing.costs.machine_time)}</span>
                        </div>
                        <div class="pricing-item">
                            <span class="pricing-label">Post-traitement</span>
                            <span class="pricing-value">${formatCurrency(pricing.costs.post_processing)}</span>
                        </div>
                        <div class="pricing-item">
                            <span class="pricing-label">Sous-total</span>
                            <span class="pricing-value">${formatCurrency(pricing.costs.subtotal)}</span>
                        </div>
                        <div class="pricing-item">
                            <span class="pricing-label">Marge (25%)</span>
                            <span class="pricing-value">${formatCurrency(pricing.costs.margin)}</span>
                        </div>
                        <div class="pricing-item border-top pt-3">
                            <span class="pricing-label text-success fw-bold">TOTAL</span>
                            <span class="pricing-value text-success fw-bold fs-5">${formatCurrency(pricing.costs.total)}</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6 class="fw-bold mb-3">Informations d'Impression</h6>
                    <div class="info-item mb-2">
                        <i class="fas fa-clock text-primary me-2"></i>
                        <strong>Temps d'impression:</strong> ${formatDuration(pricing.print_time.minutes)}
                    </div>
                    <div class="info-item mb-2">
                        <i class="fas fa-weight text-primary me-2"></i>
                        <strong>Poids:</strong> ${pricing.material.weight_g}g
                    </div>
                    <div class="info-item mb-2">
                        <i class="fas fa-fill text-primary me-2"></i>
                        <strong>Remplissage:</strong> ${pricing.parameters.infill_percent}%
                    </div>
                    <div class="info-item mb-2">
                        <i class="fas fa-layer-group text-primary me-2"></i>
                        <strong>Hauteur couche:</strong> ${pricing.parameters.layer_height_mm}mm
                    </div>
                    <div class="info-item mb-2">
                        <i class="fas fa-hand-paper text-primary me-2"></i>
                        <strong>Supports:</strong> ${pricing.parameters.includes_supports ? 'Oui' : 'Non'}
                    </div>
                </div>
            </div>
        `;
        
        pricingCard.classList.remove('d-none');
        pricingCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    saveQuote() {
        if (!this.analysisResults) {
            showAlert('Aucune analyse disponible à sauvegarder', 'warning');
            return;
        }
        
        // Store quote in localStorage
        const quote = {
            id: 'quote-' + Date.now(),
            timestamp: new Date().toISOString(),
            filename: this.currentFile.name,
            results: this.analysisResults
        };
        
        const quotes = JSON.parse(localStorage.getItem('codage11-quotes') || '[]');
        quotes.push(quote);
        localStorage.setItem('codage11-quotes', JSON.stringify(quotes));
        
        showAlert('Devis sauvegardé avec succès!', 'success');
        
        // Redirect to pricing page
        setTimeout(() => {
            window.location.href = '/pricing';
        }, 1500);
    }
}

// Update infill value display
function updateInfillValue() {
    const slider = document.getElementById('infillSlider');
    const value = document.getElementById('infillValue');
    if (slider && value) {
        value.textContent = slider.value + '%';
    }
}

// Update pricing when parameters change
function updatePricing() {
    // This would trigger real-time pricing updates
    // For now, just enable the analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn && window.fileHandler && window.fileHandler.currentFile) {
        analyzeBtn.classList.remove('d-none');
    }
}

// Global functions for HTML event handlers
function handleFileUpload(event) {
    if (window.fileHandler) {
        window.fileHandler.handleFileUpload(event);
    }
}

function analyzeFile() {
    if (window.fileHandler) {
        window.fileHandler.analyzeFile();
    }
}

function saveQuote() {
    if (window.fileHandler) {
        window.fileHandler.saveQuote();
    }
}

// Initialize file handler when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.fileHandler = new FileHandler();
});