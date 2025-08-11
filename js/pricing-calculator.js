// Pricing Calculator - Handles pricing calculations and quote management

class PricingCalculator {
    constructor() {
        this.materials = {};
        this.currentQuote = null;
        this.quotes = [];
        
        this.loadMaterials();
        this.loadQuotes();
        this.initializePricingPage();
    }
    
    async loadMaterials() {
        try {
            const response = await fetch('/api/materials');
            this.materials = await response.json();
            console.log('✅ Materials loaded for pricing');
        } catch (error) {
            console.error('❌ Error loading materials:', error);
        }
    }
    
    loadQuotes() {
        const stored = localStorage.getItem('codage11-quotes');
        this.quotes = stored ? JSON.parse(stored) : [];
        console.log(`📊 Loaded ${this.quotes.length} quotes from storage`);
    }
    
    saveQuotes() {
        localStorage.setItem('codage11-quotes', JSON.stringify(this.quotes));
    }
    
    initializePricingPage() {
        // Check if we're on the pricing page
        if (window.location.pathname === '/pricing') {
            this.displayCurrentQuote();
            this.displayQuotesHistory();
            this.updateOrderStats();
        }
    }
    
    displayCurrentQuote() {
        // Check for latest quote or URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const quoteId = urlParams.get('quote');
        
        let quote = null;
        if (quoteId) {
            quote = this.quotes.find(q => q.id === quoteId);
        } else if (this.quotes.length > 0) {
            quote = this.quotes[this.quotes.length - 1]; // Latest quote
        }
        
        if (quote) {
            this.currentQuote = quote;
            this.renderCurrentQuote(quote);
        }
    }
    
    renderCurrentQuote(quote) {
        const section = document.getElementById('currentQuoteSection');
        const modelInfo = document.getElementById('modelInfo');
        const pricingBreakdown = document.getElementById('pricingBreakdown');
        const quoteDate = document.getElementById('quoteDate');
        
        if (!section || !modelInfo || !pricingBreakdown) return;
        
        const results = quote.results;
        const analysis = results.analysis;
        const pricing = results.pricing;
        
        // Update date
        if (quoteDate) {
            const date = new Date(quote.timestamp);
            quoteDate.textContent = `Créé le: ${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR')}`;
        }
        
        // Model information
        modelInfo.innerHTML = `
            <div class="row g-3">
                <div class="col-12">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-cube fa-2x text-primary me-3"></i>
                        <div>
                            <h6 class="mb-1">${quote.filename}</h6>
                            <small class="text-muted">Taille: ${formatFileSize(results.file_size_bytes)}</small>
                        </div>
                    </div>
                </div>
                <div class="col-6">
                    <strong>Volume:</strong><br>
                    <span class="text-primary">${analysis.volume_cm3} cm³</span>
                </div>
                <div class="col-6">
                    <strong>Surface:</strong><br>
                    <span class="text-primary">${analysis.surface_area_cm2} cm²</span>
                </div>
                <div class="col-12">
                    <strong>Dimensions:</strong><br>
                    <span class="text-primary">${analysis.dimensions_cm.x} × ${analysis.dimensions_cm.y} × ${analysis.dimensions_cm.z} cm</span>
                </div>
                <div class="col-6">
                    <strong>Matériau:</strong><br>
                    <span class="badge bg-info">${pricing.material.name}</span>
                </div>
                <div class="col-6">
                    <strong>Poids:</strong><br>
                    <span class="text-primary">${pricing.material.weight_g}g</span>
                </div>
            </div>
        `;
        
        // Pricing breakdown
        pricingBreakdown.innerHTML = `
            <div class="pricing-table">
                <div class="pricing-row">
                    <span>Matériau</span>
                    <span>${formatCurrency(pricing.costs.material)}</span>
                </div>
                <div class="pricing-row">
                    <span>Temps machine (${pricing.print_time.hours}h)</span>
                    <span>${formatCurrency(pricing.costs.machine_time)}</span>
                </div>
                <div class="pricing-row">
                    <span>Post-traitement</span>
                    <span>${formatCurrency(pricing.costs.post_processing)}</span>
                </div>
                <div class="pricing-row border-top pt-2">
                    <span>Sous-total</span>
                    <span>${formatCurrency(pricing.costs.subtotal)}</span>
                </div>
                <div class="pricing-row">
                    <span>Marge (25%)</span>
                    <span>${formatCurrency(pricing.costs.margin)}</span>
                </div>
                <div class="pricing-row total border-top pt-2">
                    <span class="fw-bold">TOTAL</span>
                    <span class="fw-bold text-success fs-4">${formatCurrency(pricing.costs.total)}</span>
                </div>
            </div>
            
            <div class="mt-3">
                <small class="text-muted">
                    <i class="fas fa-clock me-1"></i>
                    Temps d'impression estimé: ${formatDuration(pricing.print_time.minutes)}
                </small>
            </div>
        `;
        
        section.classList.remove('d-none');
    }
    
    displayQuotesHistory() {
        const tableBody = document.getElementById('quotesTableBody');
        const emptyQuotes = document.getElementById('emptyQuotes');
        
        if (!tableBody) return;
        
        if (this.quotes.length === 0) {
            tableBody.innerHTML = '';
            if (emptyQuotes) emptyQuotes.classList.remove('d-none');
            return;
        }
        
        if (emptyQuotes) emptyQuotes.classList.add('d-none');
        
        tableBody.innerHTML = this.quotes
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(quote => this.renderQuoteRow(quote))
            .join('');
    }
    
    renderQuoteRow(quote) {
        const results = quote.results;
        const pricing = results.pricing;
        const date = new Date(quote.timestamp);
        
        const statusBadge = this.getStatusBadge(quote);
        
        return `
            <tr>
                <td>${date.toLocaleDateString('fr-FR')}</td>
                <td>
                    <i class="fas fa-cube text-primary me-2"></i>
                    ${quote.filename}
                </td>
                <td>
                    <span class="badge bg-${this.getMaterialColor(pricing.material.type)}">${pricing.material.type}</span>
                </td>
                <td>${results.analysis.volume_cm3} cm³</td>
                <td><strong>${formatCurrency(pricing.costs.total)}</strong></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="pricingCalculator.viewQuote('${quote.id}')" title="Voir">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-success" onclick="pricingCalculator.duplicateQuote('${quote.id}')" title="Dupliquer">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="pricingCalculator.deleteQuote('${quote.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    getStatusBadge(quote) {
        // Simple status logic - in real app would come from backend
        const age = Date.now() - new Date(quote.timestamp).getTime();
        const days = age / (1000 * 60 * 60 * 24);
        
        if (days < 1) {
            return '<span class="badge bg-warning">En attente</span>';
        } else if (days < 7) {
            return '<span class="badge bg-primary">En cours</span>';
        } else {
            return '<span class="badge bg-success">Archivé</span>';
        }
    }
    
    getMaterialColor(material) {
        const colors = {
            'PLA': 'success',
            'ABS': 'primary',
            'PETG': 'info',
            'TPU': 'warning'
        };
        return colors[material] || 'secondary';
    }
    
    updateOrderStats() {
        // Simple stats calculation
        const pendingEl = document.getElementById('pendingOrders');
        const printingEl = document.getElementById('printingOrders');
        const completedEl = document.getElementById('completedOrders');
        
        if (pendingEl) pendingEl.textContent = this.quotes.filter(q => 
            Date.now() - new Date(q.timestamp).getTime() < 24 * 60 * 60 * 1000
        ).length;
        
        if (printingEl) printingEl.textContent = this.quotes.filter(q => {
            const age = Date.now() - new Date(q.timestamp).getTime();
            const days = age / (1000 * 60 * 60 * 24);
            return days >= 1 && days < 7;
        }).length;
        
        if (completedEl) completedEl.textContent = this.quotes.filter(q => 
            Date.now() - new Date(q.timestamp).getTime() >= 7 * 24 * 60 * 60 * 1000
        ).length;
    }
    
    viewQuote(quoteId) {
        const quote = this.quotes.find(q => q.id === quoteId);
        if (quote) {
            // Update URL and display
            const url = new URL(window.location);
            url.searchParams.set('quote', quoteId);
            window.history.pushState({}, '', url);
            
            this.currentQuote = quote;
            this.renderCurrentQuote(quote);
            
            // Scroll to current quote
            document.getElementById('currentQuoteSection').scrollIntoView({ 
                behavior: 'smooth' 
            });
        }
    }
    
    duplicateQuote(quoteId) {
        const quote = this.quotes.find(q => q.id === quoteId);
        if (quote) {
            // Store quote data for upload page
            sessionStorage.setItem('duplicateQuote', JSON.stringify(quote));
            window.location.href = '/upload';
        }
    }
    
    deleteQuote(quoteId) {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce devis ?')) {
            this.quotes = this.quotes.filter(q => q.id !== quoteId);
            this.saveQuotes();
            this.displayQuotesHistory();
            this.updateOrderStats();
            
            // Clear current quote if it was deleted
            if (this.currentQuote && this.currentQuote.id === quoteId) {
                this.currentQuote = null;
                document.getElementById('currentQuoteSection').classList.add('d-none');
            }
            
            showAlert('Devis supprimé', 'success');
        }
    }
    
    proceedToOrder() {
        if (!this.currentQuote) {
            showAlert('Aucun devis sélectionné', 'warning');
            return;
        }
        
        // Populate order modal
        this.populateOrderModal();
        
        // Show order modal
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
    }
    
    populateOrderModal() {
        const orderSummary = document.getElementById('orderSummary');
        if (!orderSummary || !this.currentQuote) return;
        
        const results = this.currentQuote.results;
        const pricing = results.pricing;
        
        orderSummary.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title">${this.currentQuote.filename}</h6>
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">Matériau:</small><br>
                            <span class="badge bg-info">${pricing.material.name}</span>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Temps d'impression:</small><br>
                            ${formatDuration(pricing.print_time.minutes)}
                        </div>
                    </div>
                    <hr>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="fw-bold">Prix total:</span>
                        <span class="fs-4 text-success fw-bold">${formatCurrency(pricing.costs.total)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    submitOrder() {
        const form = document.getElementById('orderForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const orderData = {
            quoteId: this.currentQuote.id,
            customerName: document.getElementById('customerName').value,
            customerEmail: document.getElementById('customerEmail').value,
            customerPhone: document.getElementById('customerPhone').value,
            urgency: document.getElementById('urgency').value,
            specialInstructions: document.getElementById('specialInstructions').value,
            timestamp: new Date().toISOString()
        };
        
        // In a real app, this would send to backend
        console.log('Order submitted:', orderData);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();
        
        // Show success message
        showAlert('Commande envoyée avec succès! Vous recevrez une confirmation par email.', 'success');
        
        // Clear form
        form.reset();
    }
    
    saveQuotePDF() {
        if (!this.currentQuote) {
            showAlert('Aucun devis à télécharger', 'warning');
            return;
        }
        
        // In a real app, this would generate a PDF
        // For now, we'll create a simple text representation
        const quoteText = this.generateQuoteText();
        
        const blob = new Blob([quoteText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `devis_${this.currentQuote.filename}_${Date.now()}.txt`;
        link.click();
        
        URL.revokeObjectURL(url);
        showAlert('Devis téléchargé!', 'success');
    }
    
    generateQuoteText() {
        const quote = this.currentQuote;
        const results = quote.results;
        const analysis = results.analysis;
        const pricing = results.pricing;
        const date = new Date(quote.timestamp);
        
        return `
CODAGE11 - DEVIS D'IMPRESSION 3D
================================

Date: ${date.toLocaleDateString('fr-FR')}
Fichier: ${quote.filename}
Taille: ${formatFileSize(results.file_size_bytes)}

ANALYSE DU MODÈLE
-----------------
Volume: ${analysis.volume_cm3} cm³
Surface: ${analysis.surface_area_cm2} cm²
Dimensions: ${analysis.dimensions_cm.x} × ${analysis.dimensions_cm.y} × ${analysis.dimensions_cm.z} cm
Complexité: ${(analysis.complexity_factor * 100).toFixed(1)}%
Étanche: ${analysis.is_watertight ? 'Oui' : 'Non'}
Supports nécessaires: ${analysis.needs_supports ? 'Oui' : 'Non'}

PARAMÈTRES D'IMPRESSION
-----------------------
Matériau: ${pricing.material.name}
Remplissage: ${pricing.parameters.infill_percent}%
Hauteur de couche: ${pricing.parameters.layer_height_mm}mm
Supports: ${pricing.parameters.includes_supports ? 'Inclus' : 'Non inclus'}

CALCUL DU PRIX
--------------
Matériau: ${formatCurrency(pricing.costs.material)}
Temps machine (${pricing.print_time.hours}h): ${formatCurrency(pricing.costs.machine_time)}
Post-traitement: ${formatCurrency(pricing.costs.post_processing)}
Sous-total: ${formatCurrency(pricing.costs.subtotal)}
Marge (25%): ${formatCurrency(pricing.costs.margin)}

TOTAL: ${formatCurrency(pricing.costs.total)}

Temps d'impression estimé: ${formatDuration(pricing.print_time.minutes)}

---
CODAGE11 - Impression 3D professionnelle
        `.trim();
    }
    
    modifyQuote() {
        if (!this.currentQuote) {
            showAlert('Aucun devis à modifier', 'warning');
            return;
        }
        
        // Store current quote for modification
        sessionStorage.setItem('modifyQuote', JSON.stringify(this.currentQuote));
        window.location.href = '/upload';
    }
}

// Global functions for HTML event handlers
function proceedToOrder() {
    if (window.pricingCalculator) {
        window.pricingCalculator.proceedToOrder();
    }
}

function submitOrder() {
    if (window.pricingCalculator) {
        window.pricingCalculator.submitOrder();
    }
}

function saveQuotePDF() {
    if (window.pricingCalculator) {
        window.pricingCalculator.saveQuotePDF();
    }
}

function modifyQuote() {
    if (window.pricingCalculator) {
        window.pricingCalculator.modifyQuote();
    }
}

function viewQuote(quoteId) {
    if (window.pricingCalculator) {
        window.pricingCalculator.viewQuote(quoteId);
    }
}

function duplicateQuote(quoteId) {
    if (window.pricingCalculator) {
        window.pricingCalculator.duplicateQuote(quoteId);
    }
}

function deleteQuote(quoteId) {
    if (window.pricingCalculator) {
        window.pricingCalculator.deleteQuote(quoteId);
    }
}

function reorder(quoteId) {
    if (window.pricingCalculator) {
        window.pricingCalculator.viewQuote(quoteId);
        setTimeout(() => {
            window.pricingCalculator.proceedToOrder();
        }, 500);
    }
}

// Initialize pricing calculator when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.pricingCalculator = new PricingCalculator();
});