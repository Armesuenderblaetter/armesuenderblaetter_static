// Strip invalid hash early to avoid external scripts querying it as a selector
(() => {
	try {
		if (window.location.hash && /^#witness=/.test(window.location.hash)) {
			history.replaceState(null, null, window.location.pathname + window.location.search);
		}
	} catch (_) {}
})();

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
        // Add a slight delay to ensure DOM is fully loaded
        setTimeout(() => {
            try {
                this.discoverWitnesses();
                this.setupWitnessToSuffixMapping();
                this.setupOSDIntegration();
                this.setupTabEventListeners();
                this.setupVariantClickListeners();
                this.setDefaultWitness();
                console.log('🔄 Enhanced Witness Switcher initialized');
                console.log('📋 Available witnesses:', Array.from(this.availableWitnesses));
                console.log('🗺️ Witness to suffix mapping:', this.witnessToSuffixMap);
            } catch (e) {
                console.error('❌ Error during witness switcher initialization:', e);
            }
        }, 100);
    }

    /**
     * Discover all available witnesses from the document
     */
    discoverWitnesses() {
        try {
            // Use safe DOM queries with defensive null checks
            const safeQuerySelectorAll = (selector) => {
                try {
                    return document.querySelectorAll(selector) || [];
                } catch (e) {
                    console.error(`❌ Error querying selector "${selector}":`, e);
                    return [];
                }
            };
            
            // Find witnesses from variant elements
            const variantElements = safeQuerySelectorAll('[data-witness]');
            if (variantElements && variantElements.length > 0) {
                variantElements.forEach(element => {
                    if (element && typeof element.getAttribute === 'function') {
                        const witness = element.getAttribute('data-witness');
                        if (witness) {
                            this.availableWitnesses.add(witness);
                        }
                    }
                });
            }

            // Check pb elements for witness references
            const pbElementsDataWitness = safeQuerySelectorAll('.pb[data-witness]');
            if (pbElementsDataWitness && pbElementsDataWitness.length > 0) {
                pbElementsDataWitness.forEach(element => {
                    if (element && typeof element.getAttribute === 'function') {
                        const witness = element.getAttribute('data-witness');
                        if (witness) {
                            this.availableWitnesses.add(witness);
                        }
                    }
                });
            }

            // Check for wit attributes
            const pbElementsWit = safeQuerySelectorAll('.pb[wit]');
            if (pbElementsWit && pbElementsWit.length > 0) {
                pbElementsWit.forEach(element => {
                    if (element && typeof element.getAttribute === 'function') {
                        const wit = element.getAttribute('wit');
                        if (wit) {
                            const witness = wit.startsWith('#') ? wit.substring(1) : wit;
                            this.availableWitnesses.add(witness);
                        }
                    }
                });
            }

            // Add fallback witnesses for wmW and wmR if not already discovered
            this.availableWitnesses.add('wmW');
            this.availableWitnesses.add('wmR');

            console.log('🔍 Discovered witnesses:', Array.from(this.availableWitnesses));
        } catch (e) {
            console.error('❌ Error discovering witnesses:', e);
            // Add fallback witnesses
            this.availableWitnesses.add('wmW');
            this.availableWitnesses.add('wmR');
        }
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
            try {
                if (window.manuscriptViewer && 
                    window.manuscriptViewer.viewer && 
                    window.manuscriptViewer.iiifManifests &&
                    window.manuscriptViewer.iiifManifests.length > 0) {
                    
                    this.osdViewer = window.manuscriptViewer;
                    console.log('🖼️ OSD integration ready');
                    
                    // Wait a bit more to ensure all images are loaded
                    setTimeout(() => {
                        this.captureAllPages();
                        console.log('📄 Total pages available:', this.allPages.length);
                        
                        // Set up simple page change handler with error handling
                        if (this.osdViewer.viewer) {
                            this.osdViewer.viewer.addHandler('page', (event) => {
                                try {
                                    console.log(`📄 OSD page changed to: ${event.page}`);
                                    this.syncTextWithPage(event.page);
                                } catch (e) {
                                    console.error('❌ Error in page change handler:', e);
                                }
                            });
                        }
                    }, 1000);
                } else {
                    setTimeout(checkOSD, 200);
                }
            } catch (e) {
                console.error('❌ Error checking for OSD viewer:', e);
                setTimeout(checkOSD, 500);
            }
        };
        
        // Start checking for OSD, but with a slight delay
        setTimeout(checkOSD, 300);
    }

    /**
     * Update OSD viewer images for a specific witness with defensive coding
     */
    updateOSDImagesForWitness(witness) {
        console.log(`🔍 Finding facsimile images for witness: ${witness}`);
        
        try {
            // Get witness suffix for filename matching
            const witnessSuffix = this.witnessToSuffixMap.get(witness) || 
                                 (witness === 'wmW' ? 'W' : witness === 'wmR' ? 'R' : '');
            
            console.log(`📑 Using witness suffix: ${witnessSuffix} for witness: ${witness}`);
            
            // Find pb elements with source attribute for this witness
            let witnessPbs = [];
            
            // METHOD 1: Special direct handling for wmW and wmR which are common cases
            if (witness === 'wmW' || witness === 'wmR') {
                const suffix = witness === 'wmW' ? 'W' : 'R';
                const selector = `.pb[source*="_${suffix}"]`;
                witnessPbs = Array.from(document.querySelectorAll(selector) || []);
                console.log(`📄 Direct search for ${witness}: found ${witnessPbs.length} elements with ${selector}`);
            } 
            
            // If we didn't find elements yet, try other methods
            if (witnessPbs.length === 0) {
                // METHOD 2: Try by data-witness attribute
                const dataWitnessPbs = Array.from(document.querySelectorAll(`.pb[data-witness="${witness}"][source]`) || []);
                console.log(`📄 Found ${dataWitnessPbs.length} pb elements by data-witness="${witness}"`);
                witnessPbs = dataWitnessPbs;
            }
            
            if (witnessPbs.length === 0) {
                // METHOD 3: Try by wit attribute
                const witPbs = Array.from(document.querySelectorAll(`.pb[wit="#${witness}"][source]`) || []);
                console.log(`📄 Found ${witPbs.length} pb elements by wit="#${witness}"`);
                witnessPbs = witPbs;
            }
            
            // METHOD 4: More generic suffix-based search
            if (witnessPbs.length === 0 && witnessSuffix) {
                const allPbs = Array.from(document.querySelectorAll('.pb[source]') || []);
                witnessPbs = allPbs.filter(pb => {
                    try {
                        const source = pb.getAttribute('source');
                        if (!source) return false;
                        
                        // Check if source contains the witness suffix
                        return source.includes(`_${witnessSuffix}`) || 
                               source.includes(`${witnessSuffix}_`);
                    } catch (e) {
                        return false;
                    }
                });
                console.log(`📄 Found ${witnessPbs.length} pb elements by source containing "${witnessSuffix}"`);
            }
            
            // METHOD 5: Fallback to direct search for specific patterns
            if (witnessPbs.length === 0) {
                if (witness === 'wmW' || witnessSuffix === 'W') {
                    witnessPbs = Array.from(document.querySelectorAll('.pb[source*="_W"]') || [])
                                .concat(Array.from(document.querySelectorAll('.pb[source*="W_"]') || []));
                    console.log(`📄 Found ${witnessPbs.length} pb elements for W using pattern search`);
                } else if (witness === 'wmR' || witnessSuffix === 'R') {
                    witnessPbs = Array.from(document.querySelectorAll('.pb[source*="_R"]') || [])
                                .concat(Array.from(document.querySelectorAll('.pb[source*="R_"]') || []));
                    console.log(`📄 Found ${witnessPbs.length} pb elements for R using pattern search`);
                }
            }
            
            // METHOD 6: Last resort - use hard-coded fallback URLs for wmW and wmR
            if (witnessPbs.length === 0) {
                console.warn(`⚠️ No pb elements found. Using hard-coded fallbacks for ${witness}`);
                
                // Create some artificial pb elements with sources
                if (witness === 'wmW') {
                    // Hard-coded W sources
                    return this.loadFallbackSources('W');
                } else if (witness === 'wmR') {
                    // Hard-coded R sources
                    return this.loadFallbackSources('R');
                }
            }
            
            if (witnessPbs.length === 0) {
                console.warn(`⚠️ No pb elements found for witness: ${witness}`);
                return;
            }
            
            // Debug output
            witnessPbs.forEach((pb, idx) => {
                try {
                    console.log(`📑 Witness PB ${idx + 1}:`, {
                        source: pb.getAttribute('source'),
                        n: pb.getAttribute('n') || '',
                        witness: pb.getAttribute('data-witness') || pb.getAttribute('wit') || ''
                    });
                } catch (e) {
                    console.error('❌ Error accessing pb attributes:', e);
                }
            });
            
            // Build IIIF URLs from pb 'source' attributes
            const tileSources = witnessPbs.map(pb => {
                try {
                    const src = pb.getAttribute('source');
                    if (!src) return null;
                    
                    // Handle full URLs vs relative paths
                    if (src.startsWith('http')) {
                        return src;
                    } else {
                        return `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`;
                    }
                } catch (e) {
                    console.error('❌ Error building tile source URL:', e);
                    return null;
                }
            }).filter(src => src !== null);
            
            if (tileSources.length === 0) {
                console.warn(`⚠️ No valid tile sources found for witness: ${witness}`);
                return;
            }
            
            console.log(`🖼️ Built ${tileSources.length} tile sources for witness ${witness}`);
            console.log('📋 First tile source:', tileSources[0]);
            
            // Update OpenSeadragon viewer
            this.loadFacsimilesIntoOSD(tileSources);
            
        } catch (e) {
            console.error(`❌ Error updating OSD images for witness ${witness}:`, e);
        }
    }
    
    /**
     * Load fallback sources for a specific witness type
     */
    loadFallbackSources(witnessType) {
        console.log(`🔄 Loading fallback sources for witness type ${witnessType}`);
        
        let sources = [];
        if (witnessType === 'W') {
            sources = [
                'oenb_W_1r.jpg',
                'oenb_W_1v.jpg',
                'oenb_W_2r.jpg',
                'oenb_W_2v.jpg'
            ];
        } else if (witnessType === 'R') {
            sources = [
                'oenb_R_1r.jpg',
                'oenb_R_1v.jpg',
                'oenb_R_2r.jpg',
                'oenb_R_2v.jpg'
            ];
        }
        
        const tileSources = sources.map(src => 
            `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`);
        
        console.log(`📋 Using ${tileSources.length} fallback tile sources`);
        this.loadFacsimilesIntoOSD(tileSources);
    }
    
    /**
     * Simplified method to load facsimiles into OSD viewer
     */
    loadFacsimilesIntoOSD(tileSources) {
        console.log('🔄 Loading facsimiles into OSD viewer');
        
        try {
            // Find the viewer - try multiple approaches
            let viewer = null;
            
            if (window.manuscriptViewer && window.manuscriptViewer.viewer) {
                viewer = window.manuscriptViewer.viewer;
                console.log('✅ Found viewer in manuscriptViewer.viewer');
            } else if (window.viewer && typeof window.viewer.open === 'function') {
                viewer = window.viewer;
                console.log('✅ Found viewer in window.viewer');
            } else if (window.OpenSeadragon && window.OpenSeadragon.viewers && window.OpenSeadragon.viewers.length > 0) {
                viewer = window.OpenSeadragon.viewers[0];
                console.log('✅ Found viewer in OpenSeadragon.viewers[0]');
            }
            
            if (!viewer) {
                console.error('❌ No OSD viewer found');
                return;
            }
            
            // Update manuscriptViewer arrays
            if (window.manuscriptViewer) {
                window.manuscriptViewer.iiifManifests = [...tileSources];
                window.manuscriptViewer.allImages = [...tileSources];
                window.manuscriptViewer.currentIndex = 0;
            }
            
            console.log('🔄 Updating viewer with new tile sources...');
            
            // Reset the viewer
            if (viewer.world && typeof viewer.world.removeAll === 'function') {
                viewer.world.removeAll();
            }
            
            // Close and reopen with new images
            if (typeof viewer.isOpen === 'function' && viewer.isOpen()) {
                viewer.close();
            }
            
            // Open with new tile sources - add error handling
            console.log('🔄 Opening viewer with new tile sources');
            try {
                viewer.open(tileSources);
                console.log('✅ Successfully opened viewer with new sources');
            } catch (openError) {
                console.error('❌ Error opening viewer with tileSources:', openError);
                
                // Try opening just the first image as fallback
                if (tileSources.length > 0) {
                    try {
                        console.log('🔄 Trying to open just the first image');
                        viewer.open(tileSources[0]);
                    } catch (singleError) {
                        console.error('❌ Error opening single image:', singleError);
                    }
                }
            }
            
            // Make sure we're on the first page
            setTimeout(() => {
                try {
                    if (typeof viewer.goToPage === 'function') {
                        viewer.goToPage(0);
                        console.log('✅ Successfully navigated to first page');
                    }
                } catch (e) {
                    console.error('❌ Error navigating to first page:', e);
                }
            }, 300);
            
        } catch (e) {
            console.error('❌ Error loading facsimiles:', e);
        }
    }
    
    /**
     * Switch to a specific witness - SIMPLIFIED VERSION
     */
    switchToWitness(witness) {
        console.log(`🔄 Switching to witness: ${witness}`);

        this.currentWitness = witness;

        // Add witness-active class to body
        document.body.classList.add('witness-active');
        document.body.setAttribute('data-active-witness', witness);

        // Update text display first
        this.updateTextForWitness(witness);

        // Update OSD images for this witness
        this.updateOSDImagesForWitness(witness);

        // Update tab states
        this.updateTabStates(witness);

        // Update URL or state if needed
        this.updateBrowserState(witness);

        console.log(`✅ Finished switching to witness: ${witness}`);
    }
    
    /**
     * Set up event listeners for witness tabs
     */
    setupTabEventListeners() {
        try {
            console.log('Setting up tab event listeners');
            
            // Handle dynamically discovered witnesses
            this.availableWitnesses.forEach(witness => {
                try {
                    const tabElement = document.getElementById(`${witness}-tab`);
                    if (tabElement) {
                        tabElement.addEventListener('click', (event) => {
                            event.preventDefault();
                            console.log(`📑 ${witness} tab clicked`);
                            this.switchToWitness(witness);
                        });
                        console.log(`✅ Added click listener for ${witness} tab`);
                    } else {
                        console.log(`⚠️ Tab element for ${witness} not found`);
                    }
                } catch (e) {
                    console.error(`❌ Error setting up tab for ${witness}:`, e);
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
                console.log('✅ Added click listener for wmW tab');
            }
            
            if (wmRTab) {
                wmRTab.addEventListener('click', (event) => {
                    event.preventDefault();
                    console.log('📑 wmR tab clicked');
                    this.switchToWitness('wmR');
                });
                console.log('✅ Added click listener for wmR tab');
            }
            
            console.log('✅ Tab event listeners setup complete');
        } catch (e) {
            console.error('❌ Error setting up tab event listeners:', e);
        }
    }

    /**
     * Set up event listeners for variant text clicks
     */
    setupVariantClickListeners() {
        try {
            console.log('Setting up variant click listeners');
            const variantElements = document.querySelectorAll('.variant-reading');
            
            if (variantElements && variantElements.length > 0) {
                variantElements.forEach(element => {
                    try {
                        element.addEventListener('click', (event) => {
                            event.preventDefault();
                            const witness = element.getAttribute('data-witness');
                            if (witness) {
                                console.log(`🎯 Variant clicked for witness: ${witness}`);
                                this.switchToWitness(witness);
                            }
                        });
                    } catch (e) {
                        console.error('❌ Error setting up variant click listener:', e);
                    }
                });
                console.log(`✅ Added click listeners for ${variantElements.length} variant elements`);
            } else {
                console.log('⚠️ No variant elements found');
            }
        } catch (e) {
            console.error('❌ Error setting up variant click listeners:', e);
        }
    }

    /**
     * Update text display to show only variants for the current witness
     */
    updateTextForWitness(witness) {
        try {
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
                pb.classList.remove('current-page'); // Remove current-page from all
            });

            // Show page breaks for the current witness (check both data-witness and wit attributes)
            let witnessPbs = document.querySelectorAll(`.pb[data-witness="${witness}"]`);
            if (witnessPbs.length === 0) {
                // Try wit attribute with # prefix
                witnessPbs = document.querySelectorAll(`.pb[wit="#${witness}"]`);
            }
            
            witnessPbs.forEach(pb => {
                pb.style.display = 'inline';
                pb.classList.add('active-witness-pb');
            });

            // Force the first page of the new witness to be current
            if (witnessPbs.length > 0) {
                witnessPbs[0].classList.add('current-page');
            }

            // Also show primary pages if no specific witness pages found
            if (witnessPbs.length === 0) {
                const primaryPbs = document.querySelectorAll('.pb[data-pb-type="primary"]');
                primaryPbs.forEach(pb => {
                    pb.style.display = 'inline';
                    pb.classList.add('active-witness-pb');
                });
                if (primaryPbs.length > 0) {
                    primaryPbs[0].classList.add('current-page');
                }
            }

            console.log(`📝 Text updated for witness: ${witness}`);
            console.log(`📄 Showing ${witnessPbs.length} page breaks for witness ${witness}`);
        } catch (e) {
            console.error(`❌ Error updating text for witness ${witness}:`, e);
        }
    }

    /**
     * Update tab visual states
     */
    updateTabStates(witness) {
        try {
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
        } catch (e) {
            console.error(`❌ Error updating tab states for witness ${witness}:`, e);
        }
    }

    /**
     * Update browser state (URL hash or history)
     */
    updateBrowserState(witness) {
        try {
            // Do not set hash like #witness=wmW to avoid invalid selector errors in external scripts
            if (history.replaceState) {
                history.replaceState(null, null, `${window.location.pathname}${window.location.search}`);
                console.log(`📝 URL cleaned (no hash) for witness: ${witness}`);
            }
        } catch (e) {
            console.error(`❌ Error updating browser state for witness ${witness}:`, e);
        }
    }

    /**
     * Set default witness from URL hash or first available
     */
    setDefaultWitness() {
        try {
            let defaultWitness = null;

            // Ignore any hash like #witness=... to avoid external selector issues
            // Fallback to first available witness
            if (this.availableWitnesses.size > 0) {
                defaultWitness = Array.from(this.availableWitnesses)[0];
            }

            if (defaultWitness) {
                console.log(`🎯 Setting default witness: ${defaultWitness}`);
                this.switchToWitness(defaultWitness);
            } else {
                console.warn('⚠️ No default witness found');
            }
        } catch (e) {
            console.error('❌ Error setting default witness:', e);
        }
    }
    
    /**
     * Synchronize text display with current OSD page
     */
    syncTextWithPage(pageIndex) {
        try {
            if (!this.filteredPages || pageIndex >= this.filteredPages.length) return;
            
            const currentPage = this.filteredPages[pageIndex];
            console.log(`🔄 Syncing text display with page ${pageIndex}: ${currentPage ? currentPage.filename : 'unknown'}`);
            
            // Here you could add logic to highlight the corresponding text section
            // based on the current page being viewed
        } catch (e) {
            console.error(`❌ Error syncing text with page ${pageIndex}:`, e);
        }
    }

    /**
     * Capture all available pages from the OSD viewer
     */
    captureAllPages() {
        try {
            if (!this.osdViewer || !this.osdViewer.iiifManifests) return;
            
            // Get pb elements from the DOM to understand witness mapping
            const pbElements = document.querySelectorAll('.pb[source]');
            
            this.allPages = this.osdViewer.iiifManifests.map((source, index) => {
                try {
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
                } catch (e) {
                    console.error(`❌ Error mapping page ${index}:`, e);
                    return {
                        index: index,
                        source: source,
                        filename: typeof source === 'string' ? source.split('/').pop().split('.')[0] : `page${index}`,
                        witness: 'unknown'
                    };
                }
            });
            
            console.log('📋 All pages captured with witness mapping:', 
                       this.allPages.map(p => `${p.filename} (${p.witness})`));
        } catch (e) {
            console.error('❌ Error capturing pages:', e);
            this.allPages = [];
        }
    }

    /**
     * Extract filename from tile source URL
     */
    extractFilename(tileSource) {
        try {
            if (typeof tileSource === 'string') {
                return tileSource.split('/').pop().split('.')[0];
            } else if (tileSource && tileSource.url) {
                return tileSource.url.split('/').pop().split('.')[0];
            }
            return '';
        } catch (e) {
            console.error('❌ Error extracting filename:', e);
            return '';
        }
    }

    /**
     * Filter pages for the given witness based on witness data
     */
    filterPagesForWitness(witness) {
        try {
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
        } catch (e) {
            console.error(`❌ Error filtering pages for witness ${witness}:`, e);
            this.filteredPages = [];
            return [];
        }
    }

    // ...existing code...
}

// Initialize the witness switcher when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Witness Switcher...');
    window.witnessSwitcher = new WitnessSwitcher();
});

// Also initialize if DOM is already loaded, but with a slight delay
if (document.readyState !== 'loading') {
    console.log('🚀 DOM already loaded, initializing Witness Switcher with delay...');
    setTimeout(() => {
        window.witnessSwitcher = new WitnessSwitcher();
    }, 500); // Give other scripts time to initialize
}