/**
 * Variant Switcher for Armesuenderblaetter
 * Handles switching between different witness variants and their corresponding OSD facsimiles
 */

class VariantSwitcher {
    constructor() {
        this.currentWitness = null;
        this.availableWitnesses = new Set();
        this.manuscriptViewer = null;
        this.witnessToFacsimileMap = new Map();
        this.init();
    }

    init() {
        this.discoverWitnesses();
        this.setupEventListeners();
        this.createWitnessSelector();
        this.setDefaultWitness();
        console.log('🔄 VariantSwitcher initialized with witnesses:', Array.from(this.availableWitnesses));
    }

    /**
     * Discover all available witnesses from the document
     */
    discoverWitnesses() {
        // Find all variant readings with witness information
        const variantReadings = document.querySelectorAll('[data-witness]');
        variantReadings.forEach(element => {
            const witness = element.getAttribute('data-witness');
            if (witness) {
                this.availableWitnesses.add(witness);
            }
        });

        // Build witness to facsimile mapping from pb elements
        const pbElements = document.querySelectorAll('.pb[data-witness]');
        pbElements.forEach(pb => {
            const witness = pb.getAttribute('data-witness');
            const facs = pb.getAttribute('source');
            if (witness && facs) {
                if (!this.witnessToFacsimileMap.has(witness)) {
                    this.witnessToFacsimileMap.set(witness, []);
                }
                this.witnessToFacsimileMap.get(witness).push({
                    facs: facs,
                    element: pb
                });
            }
        });

        console.log('📚 Discovered witness-facsimile mapping:', this.witnessToFacsimileMap);
    }

    /**
     * Set up event listeners for variant clicking
     */
    setupEventListeners() {
        // Add click handlers to all variant readings
        document.addEventListener('click', (event) => {
            const target = event.target.closest('.variant-reading');
            if (target) {
                event.preventDefault();
                const witness = target.getAttribute('data-witness');
                if (witness) {
                    this.switchToWitness(witness);
                }
            }
        });
    }

    /**
     * Create a witness selector UI
     */
    createWitnessSelector() {
        if (this.availableWitnesses.size <= 1) {
            return; // No need for selector if only one witness
        }

        const container = document.getElementById('container_facs_1') || document.body;
        
        const selectorContainer = document.createElement('div');
        selectorContainer.className = 'witness-selector';
        selectorContainer.style.cssText = `
            position: absolute;
            top: 50px;
            left: 10px;
            z-index: 1001;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 14px;
        `;

        const label = document.createElement('div');
        label.textContent = 'Select Witness:';
        label.style.marginBottom = '5px';
        selectorContainer.appendChild(label);

        const select = document.createElement('select');
        select.style.cssText = `
            background: white;
            color: black;
            border: none;
            padding: 5px;
            border-radius: 3px;
            width: 120px;
        `;

        // Add options for each witness
        this.availableWitnesses.forEach(witness => {
            const option = document.createElement('option');
            option.value = witness;
            option.textContent = witness.toUpperCase();
            select.appendChild(option);
        });

        select.addEventListener('change', (event) => {
            this.switchToWitness(event.target.value);
        });

        selectorContainer.appendChild(select);
        container.appendChild(selectorContainer);

        this.witnessSelector = select;
    }

    /**
     * Set the default witness (usually the first/primary one)
     */
    setDefaultWitness() {
        // Try to find the primary witness first
        const primaryWitness = Array.from(this.availableWitnesses).find(w => 
            document.querySelector(`[data-witness="${w}"][data-variant-type="lem"]`)
        );
        
        if (primaryWitness) {
            this.switchToWitness(primaryWitness);
        } else if (this.availableWitnesses.size > 0) {
            this.switchToWitness(Array.from(this.availableWitnesses)[0]);
        }
    }

    /**
     * Switch to showing a specific witness
     */
    switchToWitness(witnessId) {
        if (!this.availableWitnesses.has(witnessId)) {
            console.warn('Unknown witness:', witnessId);
            return;
        }

        console.log(`🔄 Switching to witness: ${witnessId}`);
        this.currentWitness = witnessId;

        // Update the UI
        this.updateVariantDisplay(witnessId);
        this.updateFacsimileDisplay(witnessId);
        this.updateWitnessSelector(witnessId);
        this.highlightActiveVariants(witnessId);
    }

    /**
     * Update variant display to show only the selected witness
     */
    updateVariantDisplay(witnessId) {
        // Hide all variant readings first
        const allReadings = document.querySelectorAll('.variant-reading');
        allReadings.forEach(reading => {
            reading.style.display = 'none';
            reading.classList.remove('active-witness');
        });

        // Show only readings for the selected witness
        const witnessReadings = document.querySelectorAll(`[data-witness="${witnessId}"]`);
        witnessReadings.forEach(reading => {
            reading.style.display = 'inline';
            reading.classList.add('active-witness');
        });
    }

    /**
     * Update facsimile display to show pages for the selected witness
     */
    updateFacsimileDisplay(witnessId) {
        // Check if we have an OSD viewer available
        if (window.manuscriptViewer || window.viewer) {
            this.updateOSDForWitness(witnessId);
        }

        // Update pb elements visibility based on witness
        const allPbElements = document.querySelectorAll('.pb[data-witness]');
        allPbElements.forEach(pb => {
            const pbWitness = pb.getAttribute('data-witness');
            if (pbWitness === witnessId) {
                pb.style.display = 'inline';
                pb.classList.add('active-witness-pb');
            } else {
                pb.style.display = 'none';
                pb.classList.remove('active-witness-pb');
            }
        });
    }

    /**
     * Update OpenSeadragon viewer for the selected witness
     */
    updateOSDForWitness(witnessId) {
        const facsimiles = this.witnessToFacsimileMap.get(witnessId);
        if (!facsimiles || facsimiles.length === 0) {
            console.warn(`No facsimiles found for witness: ${witnessId}`);
            return;
        }

        // If we have access to the manuscript viewer, update its tile sources
        if (window.manuscriptViewer && window.manuscriptViewer.viewer) {
            this.updateManuscriptViewerTileSources(witnessId, facsimiles);
        } else if (window.viewer) {
            this.updateStandaloneOSDTileSources(witnessId, facsimiles);
        }
    }

    /**
     * Update manuscript viewer tile sources for witness
     */
    updateManuscriptViewerTileSources(witnessId, facsimiles) {
        const viewer = window.manuscriptViewer.viewer;
        
        // Build new tile sources from facsimiles
        const newTileSources = facsimiles.map(fac => {
            const cleanedSource = fac.facs.trim().split(/\s+/)[0];
            if (cleanedSource.startsWith('https://hdl.handle.net/')) {
                return `${cleanedSource}@format=image%2Fjson`;
            } else if (cleanedSource.startsWith('https://id.acdh.oeaw.ac.at/')) {
                return `${cleanedSource}?format=image%2Fjson`;
            } else {
                return `${cleanedSource}?format=image%2Fjson`;
            }
        });

        console.log(`🖼️ Updating OSD with ${newTileSources.length} tile sources for witness ${witnessId}`);

        // Close current viewer and reopen with new sources
        if (viewer.isOpen()) {
            viewer.close();
        }

        setTimeout(() => {
            viewer.openWithOptions({
                tileSources: newTileSources,
                initialPage: 0
            });
        }, 100);
    }

    /**
     * Update standalone OSD tile sources for witness
     */
    updateStandaloneOSDTileSources(witnessId, facsimiles) {
        const viewer = window.viewer;
        
        const newTileSources = facsimiles.map(fac => {
            return {
                type: 'image',
                url: `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${fac.facs}/full/max/0/default.jpg`
            };
        });

        console.log(`🖼️ Updating standalone OSD with ${newTileSources.length} tile sources for witness ${witnessId}`);

        // Update viewer with new tile sources
        viewer.openWithOptions({
            tileSources: newTileSources,
            initialPage: 0
        });
    }

    /**
     * Update witness selector UI
     */
    updateWitnessSelector(witnessId) {
        if (this.witnessSelector) {
            this.witnessSelector.value = witnessId;
        }
    }

    /**
     * Highlight active variants for the current witness
     */
    highlightActiveVariants(witnessId) {
        // Remove existing highlights
        const allReadings = document.querySelectorAll('.variant-reading');
        allReadings.forEach(reading => {
            reading.classList.remove('variant-highlighted');
        });

        // Add highlight to active witness readings
        const activeReadings = document.querySelectorAll(`[data-witness="${witnessId}"].variant-reading`);
        activeReadings.forEach(reading => {
            reading.classList.add('variant-highlighted');
        });
    }

    /**
     * Get the currently active witness
     */
    getCurrentWitness() {
        return this.currentWitness;
    }

    /**
     * Get all available witnesses
     */
    getAvailableWitnesses() {
        return Array.from(this.availableWitnesses);
    }
}

// Initialize the variant switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for other scripts to initialize
    setTimeout(() => {
        window.variantSwitcher = new VariantSwitcher();
    }, 500);
});

// Add CSS styles for variant switching
const variantStyles = document.createElement('style');
variantStyles.textContent = `
    .variant-reading {
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .variant-reading:hover {
        background-color: rgba(255, 255, 0, 0.3);
    }
    
    .variant-highlighted {
        background-color: rgba(0, 255, 0, 0.2);
        border: 1px solid #4CAF50;
        border-radius: 2px;
    }
    
    .active-witness {
        display: inline !important;
    }
    
    .pb:not(.active-witness-pb) {
        display: none !important;
    }
    
    .witness-selector {
        user-select: none;
    }
    
    .witness-selector select:focus {
        outline: 2px solid #4CAF50;
    }
`;
document.head.appendChild(variantStyles);
