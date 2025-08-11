// 3D Viewer - Three.js implementation for 3D model visualization

class Viewer3D {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.wireframe = null;
        this.axesHelper = null;
        this.gridHelper = null;
        this.ambientLight = null;
        this.directionalLight = null;
        
        this.currentFile = null;
        this.modelData = null;
        
        this.init();
    }
    
    init() {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) {
            console.error('Canvas element not found:', this.canvasId);
            return;
        }
        
        // Check WebGL support
        if (!this.checkWebGLSupport()) {
            this.showWebGLError();
            return;
        }
        
        // Initialize Three.js components
        this.initScene();
        this.initCamera();
        this.initRenderer(canvas);
        this.initControls();
        this.initLights();
        this.initHelpers();
        
        // Start render loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('✅ 3D Viewer initialized');
    }
    
    checkWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && 
                     (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            return false;
        }
    }
    
    showWebGLError() {
        const canvas = document.getElementById(this.canvasId);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'webgl-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
            <h5>WebGL non supporté</h5>
            <p>Votre navigateur ne supporte pas WebGL, requis pour la visualisation 3D.</p>
            <p>Veuillez mettre à jour votre navigateur ou activer WebGL.</p>
        `;
        canvas.parentNode.appendChild(errorDiv);
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2c3e50);
    }
    
    initCamera() {
        const canvas = document.getElementById(this.canvasId);
        const aspect = canvas.clientWidth / canvas.clientHeight;
        
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(50, 50, 50);
        this.camera.lookAt(0, 0, 0);
    }
    
    initRenderer(canvas) {
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    initControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 2.0;
    }
    
    initLights() {
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(this.ambientLight);
        
        // Directional light
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(10, 10, 5);
        this.directionalLight.castShadow = true;
        
        // Shadow camera settings
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -50;
        this.directionalLight.shadow.camera.right = 50;
        this.directionalLight.shadow.camera.top = 50;
        this.directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(this.directionalLight);
    }
    
    initHelpers() {
        // Grid helper
        this.gridHelper = new THREE.GridHelper(100, 50, 0x888888, 0x444444);
        this.scene.add(this.gridHelper);
        
        // Axes helper
        this.axesHelper = new THREE.AxesHelper(20);
        this.scene.add(this.axesHelper);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        
        // Update performance stats
        this.updatePerformanceStats();
    }
    
    updatePerformanceStats() {
        const fpsElement = document.getElementById('fps');
        const trianglesElement = document.getElementById('triangles');
        
        if (fpsElement) {
            fpsElement.textContent = Math.round(1000 / (performance.now() - (this.lastTime || performance.now())));
            this.lastTime = performance.now();
        }
        
        if (trianglesElement && this.model) {
            let triangles = 0;
            this.model.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    triangles += child.geometry.attributes.position.count / 3;
                }
            });
            trianglesElement.textContent = Math.round(triangles);
        }
    }
    
    onWindowResize() {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas) return;
        
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(width, height);
    }
    
    loadFile(file) {
        if (!file) return;
        
        this.showLoadingOverlay(true);
        this.currentFile = file;
        
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // Create object URL for the file
        const objectURL = URL.createObjectURL(file);
        
        try {
            switch (fileExtension) {
                case 'stl':
                    this.loadSTL(objectURL);
                    break;
                case 'obj':
                    this.loadOBJ(objectURL);
                    break;
                case 'ply':
                    this.loadPLY(objectURL);
                    break;
                default:
                    throw new Error(`Format de fichier non supporté: ${fileExtension}`);
            }
        } catch (error) {
            console.error('Error loading file:', error);
            showAlert(`Erreur lors du chargement: ${error.message}`, 'danger');
            this.showLoadingOverlay(false);
        }
    }
    
    loadSTL(url) {
        const loader = new THREE.STLLoader();
        
        loader.load(url, (geometry) => {
            this.processGeometry(geometry);
            this.showLoadingOverlay(false);
            URL.revokeObjectURL(url);
        }, 
        (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('STL loading error:', error);
            showAlert('Erreur lors du chargement du fichier STL', 'danger');
            this.showLoadingOverlay(false);
            URL.revokeObjectURL(url);
        });
    }
    
    loadOBJ(url) {
        const loader = new THREE.OBJLoader();
        
        loader.load(url, (object) => {
            // Find the first mesh in the object
            let geometry = null;
            object.traverse((child) => {
                if (child.isMesh) {
                    geometry = child.geometry;
                }
            });
            
            if (geometry) {
                this.processGeometry(geometry);
            } else {
                throw new Error('Aucune géométrie trouvée dans le fichier OBJ');
            }
            
            this.showLoadingOverlay(false);
            URL.revokeObjectURL(url);
        },
        (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('OBJ loading error:', error);
            showAlert('Erreur lors du chargement du fichier OBJ', 'danger');
            this.showLoadingOverlay(false);
            URL.revokeObjectURL(url);
        });
    }
    
    loadPLY(url) {
        const loader = new THREE.PLYLoader();
        
        loader.load(url, (geometry) => {
            this.processGeometry(geometry);
            this.showLoadingOverlay(false);
            URL.revokeObjectURL(url);
        },
        (progress) => {
            console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('PLY loading error:', error);
            showAlert('Erreur lors du chargement du fichier PLY', 'danger');
            this.showLoadingOverlay(false);
            URL.revokeObjectURL(url);
        });
    }
    
    processGeometry(geometry) {
        // Remove previous model
        this.clearModel();
        
        // Center and scale geometry
        geometry.center();
        geometry.computeBoundingBox();
        
        const boundingBox = geometry.boundingBox;
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        
        // Scale to fit in view
        if (maxDimension > 50) {
            const scale = 50 / maxDimension;
            geometry.scale(scale, scale, scale);
        }
        
        // Compute normals if needed
        if (!geometry.attributes.normal) {
            geometry.computeVertexNormals();
        }
        
        // Create material
        const material = new THREE.MeshLambertMaterial({
            color: 0x3498db,
            side: THREE.DoubleSide
        });
        
        // Create mesh
        this.model = new THREE.Mesh(geometry, material);
        this.model.castShadow = true;
        this.model.receiveShadow = true;
        
        // Add to scene
        this.scene.add(this.model);
        
        // Create wireframe
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        this.wireframe = new THREE.Mesh(geometry.clone(), wireframeMaterial);
        this.wireframe.visible = false;
        this.scene.add(this.wireframe);
        
        // Update camera to fit model
        this.fitCameraToModel();
        
        // Update measurements
        this.updateMeasurements(geometry);
        
        // Update file info
        this.updateFileInfo();
        
        // Hide no file message
        this.hideNoFileMessage();
        
        // Show success message
        showAlert(`Modèle 3D chargé: ${this.currentFile.name}`, 'success');
        
        console.log('✅ Model loaded and processed');
    }
    
    fitCameraToModel() {
        if (!this.model) return;
        
        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxDimension = Math.max(size.x, size.y, size.z);
        const distance = maxDimension * 2;
        
        this.camera.position.set(
            center.x + distance,
            center.y + distance,
            center.z + distance
        );
        
        this.controls.target.copy(center);
        this.controls.update();
    }
    
    updateMeasurements(geometry) {
        const dimensionsEl = document.getElementById('dimensions');
        const volumeEl = document.getElementById('volume');
        const surfaceEl = document.getElementById('surface');
        
        if (geometry.boundingBox) {
            const size = geometry.boundingBox.getSize(new THREE.Vector3());
            
            if (dimensionsEl) {
                dimensionsEl.textContent = `${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} unités`;
            }
        }
        
        if (volumeEl) {
            // Rough volume calculation
            const volume = this.calculateVolume(geometry);
            volumeEl.textContent = volume ? `${volume.toFixed(2)} unités³` : 'Non calculé';
        }
        
        if (surfaceEl) {
            // Surface area calculation
            const area = this.calculateSurfaceArea(geometry);
            surfaceEl.textContent = area ? `${area.toFixed(2)} unités²` : 'Non calculé';
        }
    }
    
    calculateVolume(geometry) {
        // Simple bounding box volume calculation
        if (!geometry.boundingBox) return 0;
        
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        return size.x * size.y * size.z;
    }
    
    calculateSurfaceArea(geometry) {
        // Calculate surface area from triangles
        const positions = geometry.attributes.position;
        if (!positions) return 0;
        
        let area = 0;
        for (let i = 0; i < positions.count; i += 3) {
            const a = new THREE.Vector3().fromBufferAttribute(positions, i);
            const b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
            const c = new THREE.Vector3().fromBufferAttribute(positions, i + 2);
            
            const triangle = new THREE.Triangle(a, b, c);
            area += triangle.getArea();
        }
        
        return area;
    }
    
    updateFileInfo() {
        const fileInfoEl = document.getElementById('fileInfo');
        if (fileInfoEl && this.currentFile) {
            fileInfoEl.innerHTML = `
                <p><strong>Fichier:</strong> ${this.currentFile.name}</p>
                <p><strong>Taille:</strong> ${formatFileSize(this.currentFile.size)}</p>
                <p><strong>Type:</strong> ${this.currentFile.type || 'Modèle 3D'}</p>
            `;
        }
    }
    
    hideNoFileMessage() {
        const noFileMsg = document.getElementById('noFileMessage');
        if (noFileMsg) {
            noFileMsg.style.display = 'none';
        }
    }
    
    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('d-none', !show);
        }
    }
    
    clearModel() {
        if (this.model) {
            this.scene.remove(this.model);
            this.model.geometry.dispose();
            this.model.material.dispose();
            this.model = null;
        }
        
        if (this.wireframe) {
            this.scene.remove(this.wireframe);
            this.wireframe.geometry.dispose();
            this.wireframe.material.dispose();
            this.wireframe = null;
        }
    }
    
    // Control methods
    changeRenderMode(mode) {
        if (!this.model) return;
        
        switch (mode) {
            case 'solid':
                this.model.material.wireframe = false;
                this.model.material.transparent = false;
                this.model.material.opacity = 1;
                break;
            case 'wireframe':
                this.model.material.wireframe = true;
                this.model.material.transparent = false;
                this.model.material.opacity = 1;
                break;
            case 'points':
                // Create points material if needed
                const pointsMaterial = new THREE.PointsMaterial({
                    color: this.model.material.color,
                    size: 2
                });
                const points = new THREE.Points(this.model.geometry, pointsMaterial);
                this.scene.remove(this.model);
                this.scene.add(points);
                this.model = points;
                break;
        }
    }
    
    changeMaterialColor(color) {
        if (!this.model) return;
        
        this.model.material.color.setHex(color.replace('#', '0x'));
    }
    
    toggleWireframe() {
        if (this.wireframe) {
            this.wireframe.visible = !this.wireframe.visible;
        }
    }
    
    toggleAxes() {
        if (this.axesHelper) {
            this.axesHelper.visible = !this.axesHelper.visible;
        }
    }
    
    toggleGrid() {
        if (this.gridHelper) {
            this.gridHelper.visible = !this.gridHelper.visible;
        }
    }
    
    updateAmbientLight(intensity) {
        if (this.ambientLight) {
            this.ambientLight.intensity = intensity;
        }
    }
    
    updateDirectionalLight(intensity) {
        if (this.directionalLight) {
            this.directionalLight.intensity = intensity;
        }
    }
    
    resetView() {
        if (this.model) {
            this.fitCameraToModel();
        } else {
            this.camera.position.set(50, 50, 50);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }
    
    exportScreenshot() {
        this.renderer.render(this.scene, this.camera);
        
        const link = document.createElement('a');
        link.download = `${this.currentFile ? this.currentFile.name : 'model'}_screenshot.png`;
        link.href = this.renderer.domElement.toDataURL('image/png');
        link.click();
        
        showAlert('Capture d\'écran sauvegardée!', 'success');
    }
}

// Global viewer instance
let viewer3D = null;

// Initialize viewer when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('threejs-canvas');
    if (canvas) {
        viewer3D = new Viewer3D('threejs-canvas');
        
        // Check for stored file
        const storedFile = getStoredFile();
        if (storedFile) {
            loadStoredFile(storedFile);
        }
    }
});

// Global functions for HTML event handlers
function loadNewFile(event) {
    const file = event.target.files[0];
    if (file && viewer3D) {
        viewer3D.loadFile(file);
    }
}

function resetView() {
    if (viewer3D) {
        viewer3D.resetView();
    }
}

function changeRenderMode() {
    const select = document.getElementById('renderMode');
    if (select && viewer3D) {
        viewer3D.changeRenderMode(select.value);
    }
}

function changeMaterialColor() {
    const input = document.getElementById('materialColor');
    if (input && viewer3D) {
        viewer3D.changeMaterialColor(input.value);
    }
}

function toggleWireframe() {
    if (viewer3D) {
        viewer3D.toggleWireframe();
    }
}

function toggleAxes() {
    if (viewer3D) {
        viewer3D.toggleAxes();
    }
}

function toggleGrid() {
    if (viewer3D) {
        viewer3D.toggleGrid();
    }
}

function updateAmbientLight() {
    const slider = document.getElementById('ambientLight');
    const value = document.getElementById('ambientValue');
    if (slider && value && viewer3D) {
        value.textContent = slider.value;
        viewer3D.updateAmbientLight(parseFloat(slider.value));
    }
}

function updateDirectionalLight() {
    const slider = document.getElementById('directionalLight');
    const value = document.getElementById('directionalValue');
    if (slider && value && viewer3D) {
        value.textContent = slider.value;
        viewer3D.updateDirectionalLight(parseFloat(slider.value));
    }
}

function analyzeModel() {
    if (!viewer3D || !viewer3D.currentFile) {
        showAlert('Aucun modèle chargé à analyser', 'warning');
        return;
    }
    
    // Show analysis modal with current data
    const modal = new bootstrap.Modal(document.getElementById('analysisModal'));
    const resultsDiv = document.getElementById('analysisResults');
    
    resultsDiv.innerHTML = `
        <div class="analysis-grid">
            <div class="analysis-card">
                <div class="analysis-card-icon bg-primary">
                    <i class="fas fa-cube"></i>
                </div>
                <div class="analysis-card-value">Analyse en cours...</div>
                <div class="analysis-card-label">Chargement des données</div>
            </div>
        </div>
    `;
    
    modal.show();
    
    // TODO: Integrate with actual analysis API
    setTimeout(() => {
        resultsDiv.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Pour une analyse complète avec calcul de prix, utilisez la page d'upload avec les paramètres d'impression.
            </div>
            <div class="text-center">
                <a href="/upload" class="btn btn-primary">
                    <i class="fas fa-upload me-2"></i>Aller à l'analyse complète
                </a>
            </div>
        `;
    }, 1000);
}

function checkPrintability() {
    if (!viewer3D || !viewer3D.model) {
        showAlert('Aucun modèle chargé', 'warning');
        return;
    }
    
    // Basic printability check
    const geometry = viewer3D.model.geometry;
    const boundingBox = geometry.boundingBox;
    
    if (boundingBox) {
        const size = boundingBox.getSize(new THREE.Vector3());
        const printBed = { x: 200, y: 200, z: 200 }; // Example print bed size
        
        let warnings = [];
        
        if (size.x > printBed.x || size.y > printBed.y || size.z > printBed.z) {
            warnings.push('Modèle trop grand pour le plateau d\'impression standard');
        }
        
        if (size.z / Math.max(size.x, size.y) > 3) {
            warnings.push('Modèle très élancé - risque d\'instabilité');
        }
        
        const message = warnings.length > 0 
            ? `⚠️ Attention: ${warnings.join(', ')}`
            : '✅ Modèle semble imprimable';
            
        showAlert(message, warnings.length > 0 ? 'warning' : 'success');
    }
}

function exportScreenshot() {
    if (viewer3D) {
        viewer3D.exportScreenshot();
    }
}

function goToPricing() {
    window.location.href = '/pricing';
}

// Load stored file from session storage
function loadStoredFile(storedData) {
    try {
        // Convert base64 back to File object
        const byteCharacters = atob(storedData.data.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: storedData.type });
        const file = new File([blob], storedData.name, { type: storedData.type });
        
        if (viewer3D) {
            viewer3D.loadFile(file);
        }
        
        // Clear storage after use
        clearStoredFile();
        
    } catch (error) {
        console.error('Error loading stored file:', error);
        clearStoredFile();
    }
}