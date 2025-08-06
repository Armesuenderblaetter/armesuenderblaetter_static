/**
 * Enhanced Witness Switcher for Manuscript Sources
 * Handles switching between different manuscript witnesses and filters OSD pages accordingly
 */

class WitnessSwitcher {
    constructor() {
        this.currentWitness = null;
        this.availableWitnesses = new Set();
        this.witnessToSuffixMap = new Map(); // Maps witness to page suffix (W/R etc.)
        this.allPages = []; // All available pages from OSD
        this.filteredPages = []; // Pages filtered for current witness
        this.osdViewer = null;
        
        // Use DOM safety helper if available
        if (typeof DOMSafetyHelper !== 'undefined') {
            DOMSafetyHelper.safeInit(() => this.init(), 'WitnessSwitcher');
        } else {
            // Fallback to traditional DOM ready check
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
            } else {
                this.init();
            }
        }
    }

    init() {
        this.discoverWitnesses();
        this.setupWitnessToSuffixMapping();
        this.setupOSDIntegration();
        this.setupTabEventListeners();
        this.setupVariantClickListeners();
        this.setDefaultWitness();
        console.log('🔄 Enhanced Witness Switcher initialized');
        console.log('📋 Available witnesses:', Array.from(this.availableWitnesses));
        console.log('🗺️ Witness to suffix mapping:', this.witnessToSuffixMap);
    }

    /**
     * Discover all available witnesses from the document
     */
    discoverWitnesses() {
        // Use safe DOM queries
        const queryFn = typeof DOMSafetyHelper !== 'undefined' 
            ? DOMSafetyHelper.safeQuerySelectorAll 
            : (selector) => document.querySelectorAll(selector);
            
        // Find witnesses from variant elements
        const variantElements = queryFn('[data-witness]');
        variantElements.forEach(element => {
            const witness = element.getAttribute('data-witness');
            if (witness) {
                this.availableWitnesses.add(witness);
            }
        });

        // Also check pb elements for witness references
        const pbElements = queryFn('.pb[data-witness]');
        pbElements.forEach(element => {
            const witness = element.getAttribute('data-witness');
            if (witness) {
                this.availableWitnesses.add(witness);
            }
        });

        console.log('🔍 Discovered witnesses:', Array.from(this.availableWitnesses));
    }

    /**
     * Set up mapping between witnesses and their page suffixes
     * wb (Wienbibliothek) -> W pages
     * oenb (Österreichische Nationalbibliothek) -> R pages
     */
    setupWitnessToSuffixMapping() {
        // Common mappings based on the institution names
        const commonMappings = {
            'wb': 'W',     // Wienbibliothek -> W pages
            'oenb': 'R',   // Österreichische Nationalbibliothek -> R pages
            'wien': 'W',   // Alternative Wien reference
            'vienna': 'W', // English Vienna reference
            'nat': 'R',    // National library abbreviation
            'onb': 'R'     // Alternative ONB abbreviation
        };

        this.availableWitnesses.forEach(witness => {
            const lowerWitness = witness.toLowerCase();
            
            // Try exact match first
            if (commonMappings[lowerWitness]) {
                this.witnessToSuffixMap.set(witness, commonMappings[lowerWitness]);
            }
            // Try partial match
            else {
                for (const [key, suffix] of Object.entries(commonMappings)) {
                    if (lowerWitness.includes(key)) {
                        this.witnessToSuffixMap.set(witness, suffix);
                        break;
                    }
                }
            }
            
            // Fallback: use first letter uppercased
            if (!this.witnessToSuffixMap.has(witness)) {
                this.witnessToSuffixMap.set(witness, witness.charAt(0).toUpperCase());
            }
        });
    }

    /**
     * Set up OpenSeadragon integration
     */
    setupOSDIntegration() {
        // Wait for OSD to be ready
        const checkOSD = () => {
            if (window.manuscriptViewer && 
                window.manuscriptViewer.viewer && 
                window.manuscriptViewer.iiifManifests &&
                window.manuscriptViewer.iiifManifests.length > 0) {
                
                this.osdViewer = window.manuscriptViewer;
                console.log('🖼️ OSD integration ready');
                
                // Wait a bit more to ensure all images are loaded and viewer is stable
                setTimeout(() => {
                    this.captureAllPages();
                    console.log('📄 Total pages available:', this.allPages.length);
                    
                    // Set up listener for OSD page changes to sync text
                    if (this.osdViewer.viewer) {
                        this.osdViewer.viewer.addHandler('page', (event) => {
                            console.log(`📄 OSD page changed to: ${event.page}`);
                            this.syncTextWithPage(event.page);
                        });
                    }
                }, 1000); // Increased wait time
            } else {
                setTimeout(checkOSD, 200); // Check more frequently
            }
        };
        checkOSD();
    }

    /**
     * Capture all available pages from the OSD viewer
     */
    captureAllPages() {
        if (!this.osdViewer || !this.osdViewer.iiifManifests) return;
        
        // Get pb elements from the DOM to understand witness mapping
        const pbElements = document.querySelectorAll('.pb[source]');
        
        this.allPages = this.osdViewer.iiifManifests.map((source, index) => {
            // Try to find corresponding pb element
            const pbElement = pbElements[index];
            let witness = 'unknown';
            let filename = this.extractFilename(source);
            
            if (pbElement) {
                // Get witness from data-witness attribute if available
                witness = pbElement.getAttribute('data-witness') || 'primary';
                const sourceAttr = pbElement.getAttribute('source');
                if (sourceAttr) {
                    filename = sourceAttr.split('.')[0]; // Remove extension
                }
            }
            
            return {
                index: index,
                source: source,
                filename: filename,
                witness: witness
            };
        });
        
        console.log('📋 All pages captured with witness mapping:', 
                   this.allPages.map(p => `${p.filename} (${p.witness})`));
    }

    /**
     * Extract filename from tile source URL
     */
    extractFilename(tileSource) {
        if (typeof tileSource === 'string') {
            return tileSource.split('/').pop().split('.')[0];
        } else if (tileSource && tileSource.url) {
            return tileSource.url.split('/').pop().split('.')[0];
        }
        return '';
    }

    /**
     * Filter pages for the given witness based on witness data
     */
    filterPagesForWitness(witness) {
        // First, try direct witness matching
        let filteredPages = this.allPages.filter(page => page.witness === witness);
        
        // If no direct match, try suffix-based matching as fallback
        if (filteredPages.length === 0) {
            const suffix = this.witnessToSuffixMap.get(witness);
            if (suffix) {
                filteredPages = this.allPages.filter(page => {
                    const filename = page.filename;
                    return filename.endsWith(suffix) || filename.includes(`_${suffix.toLowerCase()}`);
                });
            }
        }
        
        // Sort pages to ensure correct sequential order (by page number)
        filteredPages.sort((a, b) => {
            // Extract page numbers from filenames (assuming format like page1, page2, etc.)
            const getPageNumber = (filename) => {
                const match = filename.match(/(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };
            
            return getPageNumber(a.filename) - getPageNumber(b.filename);
        });

        this.filteredPages = filteredPages;

        console.log(`🔍 Filtered pages for ${witness}:`, 
                   this.filteredPages.map(p => `${p.filename} (${p.witness})`));
        
        return this.filteredPages;
    }

    /**
     * Update OSD viewer to show only pages for current witness
     */
    updateOSDForWitness(witness) {
        if (!this.osdViewer || !this.osdViewer.viewer) {
            console.warn('⚠️ OSD viewer not available');
            return;
        }

        const filteredPages = this.filterPagesForWitness(witness);
        
        if (filteredPages.length === 0) {
            console.warn(`⚠️ No pages found for witness: ${witness}`);
            return;
        }

        console.log(`🖼️ Updating OSD for witness ${witness}, showing ${filteredPages.length} pages`);
        console.log(`📋 Page sequence:`, filteredPages.map(p => p.filename));

        // Store original sources if not already stored
        if (!this.osdViewer.originalTileSources) {
            this.osdViewer.originalTileSources = [...this.osdViewer.iiifManifests];
            this.osdViewer.originalAllImages = [...this.osdViewer.allImages];
            console.log('💾 Stored original tile sources for restoration');
        }
        
        // Create new filtered tile sources in the correct order
        const filteredTileSources = filteredPages.map(page => page.source);
        
        try {
            console.log('🔄 Updating OSD with filtered tile sources');
            
            // Update internal arrays to match the filtered set
            this.osdViewer.iiifManifests = filteredTileSources;
            this.osdViewer.allImages = filteredTileSources;
            this.osdViewer.currentIndex = 0;
            
            // Force a complete viewer rebuild using the updateViewerWithImages method
            // This should update both the main viewer AND the reference strip
            this.osdViewer.updateViewerWithImages(filteredTileSources, false);
            
            console.log(`✅ OSD successfully updated for witness ${witness}`);
            
        } catch (error) {
            console.error(`❌ Error updating OSD for witness ${witness}:`, error);
            this.fallbackOSDUpdate(filteredTileSources, witness);
        }
    }

    /**
     * Fallback method for updating OSD when primary method fails
     */
    fallbackOSDUpdate(filteredTileSources, witness) {
        console.log('🔄 Attempting fallback method for OSD update');
        
        try {
            // Method 1: Try direct tile source replacement
            console.log('🔄 Fallback Method 1: Direct openWithOptions');
            
            // Update internal arrays first
            this.osdViewer.iiifManifests = filteredTileSources;
            this.osdViewer.allImages = filteredTileSources;
            this.osdViewer.currentIndex = 0;
            
            // Close current viewer if open
            if (this.osdViewer.viewer.isOpen()) {
                this.osdViewer.viewer.close();
            }
            
            // Process images the same way as updateViewerWithImages does
            const processedImages = filteredTileSources.map((img, idx) => {
                if (typeof img === 'string') {
                    const baseUrl = img.split('?')[0];
                    return `${baseUrl}?idx=${idx}&t=${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
                }
                return img;
            });
            
            // Store processed images for reference
            this.osdViewer.validImageTileSources = processedImages;
            
            // Open with filtered tile sources using the same method as OSD
            this.osdViewer.viewer.openWithOptions({
                tileSources: processedImages,
                initialPage: 0
            });
            
            // Force display of first page after short delay
            setTimeout(() => {
                this.osdViewer.viewer.goToPage(0);
                if (this.osdViewer.showOnlyCurrentPage) {
                    this.osdViewer.showOnlyCurrentPage(0);
                }
                console.log(`✅ Fallback Method 1 successful - OSD updated for witness ${witness}`);
            }, 200);
            
        } catch (fallbackError) {
            console.error('❌ Fallback Method 1 failed:', fallbackError);
            
            // Method 2: Last resort - load just the first image
            if (filteredTileSources.length > 0) {
                console.log('🆘 Fallback Method 2: Loading first image only');
                try {
                    this.osdViewer.loadImageFromManifest(filteredTileSources[0]);
                    console.log(`✅ Fallback Method 2 successful - loaded first image for witness ${witness}`);
                } catch (lastResortError) {
                    console.error('❌ All fallback methods failed:', lastResortError);
                }
            }
        }
    }

    /**
     * Set up event listeners for witness tabs
     */
    setupTabEventListeners() {
        // Handle both old-style tabs and dynamically discovered witnesses
        this.availableWitnesses.forEach(witness => {
            const tabElement = document.getElementById(`${witness}-tab`);
            if (tabElement) {
                tabElement.addEventListener('click', (event) => {
                    event.preventDefault();
                    console.log(`📑 ${witness} tab clicked`);
                    this.switchToWitness(witness);
                });
            }
        });

        // Legacy support for hardcoded wmW and wmR tabs
        const wmWTab = document.getElementById('wmW-tab');
        const wmRTab = document.getElementById('wmR-tab');
        
        if (wmWTab) {
            wmWTab.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('📑 wmW tab clicked');
                this.switchToWitness('wmW');
            });
        }
        
        if (wmRTab) {
            wmRTab.addEventListener('click', (event) => {
                event.preventDefault();
                console.log('📑 wmR tab clicked');
                this.switchToWitness('wmR');
            });
        }
    }

    /**
     * Set up event listeners for variant text clicks
     */
    setupVariantClickListeners() {
        const variantElements = document.querySelectorAll('.variant-reading');
        variantElements.forEach(element => {
            element.addEventListener('click', (event) => {
                event.preventDefault();
                const witness = element.getAttribute('data-witness');
                if (witness) {
                    console.log(`🎯 Variant clicked for witness: ${witness}`);
                    this.switchToWitness(witness);
                }
            });
        });
    }

    /**
     * Switch to a specific witness
     */
    switchToWitness(witness) {
        console.log(`🔄 Switching to witness: ${witness}`);
        console.log(`📊 Available pages before switch:`, this.allPages.length);
        
        this.currentWitness = witness;
        
        // Add witness-active class to body
        document.body.classList.add('witness-active');
        document.body.setAttribute('data-active-witness', witness);
        
        // Update text display first
        this.updateTextForWitness(witness);
        
        // Then update OSD pages (with a small delay to ensure text is updated)
        setTimeout(() => {
            this.updateOSDForWitness(witness);
        }, 100);
        
        // Update tab states
        this.updateTabStates(witness);
        
        // Update URL or state if needed
        this.updateBrowserState(witness);
        
        console.log(`✅ Successfully switched to witness: ${witness}`);
    }

    /**
     * Update text display to show only variants for the current witness
     */
    updateTextForWitness(witness) {
        // Hide all variant readings
        const allVariants = document.querySelectorAll('.variant-reading');
        allVariants.forEach(variant => {
            variant.classList.remove('active-witness');
        });

        // Show only variants for the current witness
        const witnessVariants = document.querySelectorAll(`.variant-reading[data-witness="${witness}"]`);
        witnessVariants.forEach(variant => {
            variant.classList.add('active-witness');
        });

        // Handle page breaks for witness - hide all pb elements first
        const allPbs = document.querySelectorAll('.pb');
        allPbs.forEach(pb => {
            pb.style.display = 'none';
            pb.classList.remove('active-witness-pb');
        });

        // Show only page breaks for the current witness
        const witnessPbs = document.querySelectorAll(`.pb[data-witness="${witness}"]`);
        witnessPbs.forEach(pb => {
            pb.style.display = 'inline';
            pb.classList.add('active-witness-pb');
        });

        // Also show primary pages if no specific witness pages found
        if (witnessPbs.length === 0) {
            const primaryPbs = document.querySelectorAll('.pb[data-pb-type="primary"]');
            primaryPbs.forEach(pb => {
                pb.style.display = 'inline';
                pb.classList.add('active-witness-pb');
            });
        }

        console.log(`📝 Text updated for witness: ${witness}`);
        console.log(`📄 Showing ${witnessPbs.length} page breaks for witness ${witness}`);
    }

    /**
     * Update tab visual states
     */
    updateTabStates(witness) {
        // Remove active class from all tabs
        const allTabs = document.querySelectorAll('[id$="-tab"]');
        allTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to current witness tab
        const currentTab = document.getElementById(`${witness}-tab`);
        if (currentTab) {
            currentTab.classList.add('active');
        }
    }

    /**
     * Update browser state (URL hash or history)
     */
    updateBrowserState(witness) {
        // Update URL hash to reflect current witness
        if (history.replaceState) {
            const newUrl = `${window.location.pathname}${window.location.search}#witness=${witness}`;
            history.replaceState(null, null, newUrl);
        }
    }

    /**
     * Set default witness from URL hash or first available
     */
    setDefaultWitness() {
        let defaultWitness = null;
        
        // Check URL hash first
        const hash = window.location.hash;
        if (hash.includes('witness=')) {
            const witnessFromHash = hash.split('witness=')[1].split('&')[0];
            if (this.availableWitnesses.has(witnessFromHash)) {
                defaultWitness = witnessFromHash;
            }
        }
        
        // Fallback to first available witness
        if (!defaultWitness && this.availableWitnesses.size > 0) {
            defaultWitness = Array.from(this.availableWitnesses)[0];
        }
        
        if (defaultWitness) {
            console.log(`🎯 Setting default witness: ${defaultWitness}`);
            this.switchToWitness(defaultWitness);
        }
    }

    /**
     * Get current witness
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

    /**
     * Synchronize text display with current OSD page
     */
    syncTextWithPage(pageIndex) {
        if (!this.filteredPages || pageIndex >= this.filteredPages.length) return;
        
        const currentPage = this.filteredPages[pageIndex];
        console.log(`🔄 Syncing text display with page ${pageIndex}: ${currentPage.filename}`);
        
        // Here you could add logic to highlight the corresponding text section
        // based on the current page being viewed
    }

    /**
     * Restore original OSD view (show all pages)
     */
    restoreOriginalOSDView() {
        if (!this.osdViewer || !this.osdViewer.originalTileSources) {
            console.warn('⚠️ No original tile sources to restore');
            return;
        }

        console.log('🔄 Restoring original OSD view with all pages');

        // Restore original arrays
        this.osdViewer.iiifManifests = [...this.osdViewer.originalTileSources];
        this.osdViewer.allImages = [...this.osdViewer.originalAllImages];
        this.osdViewer.validImageTileSources = [...this.osdViewer.originalTileSources];
        
        // Reset current index
        this.osdViewer.currentIndex = 0;
        
        // Close and rebuild viewer
        if (this.osdViewer.viewer && this.osdViewer.viewer.isOpen()) {
            this.osdViewer.viewer.close();
        }
        
        // Rebuild with all images
        this.osdViewer.updateViewerWithImages(this.osdViewer.allImages, false);
        
        console.log('✅ Original OSD view restored');
    }
}

// Initialize the witness switcher when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Witness Switcher...');
    window.witnessSwitcher = new WitnessSwitcher();
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    // Do nothing, DOMContentLoaded will fire
} else {
    // DOM is already loaded
    console.log('🚀 DOM already loaded, initializing Witness Switcher...');
    window.witnessSwitcher = new WitnessSwitcher();
}