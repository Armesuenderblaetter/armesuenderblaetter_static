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
        this.witnessPagesMap = new Map(); // witness -> [{ tileSource, label, source, pb }]
        this.pendingNavigation = null;     // { witness, index }
        this._linksRefreshTimer = null; // debounce timer for page-links refresh
        
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

    // Debug helper to check page break sources for witness identification
    debugPageBreakSources() {
        try {
            console.log('🔍 DEBUG: Examining page break sources for witness identification');
            const pbElements = document.querySelectorAll('.pb[source]');
            
            if (!pbElements || pbElements.length === 0) {
                console.log('🔍 DEBUG: No page breaks with source attribute found');
                return;
            }
            
            console.log(`🔍 DEBUG: Found ${pbElements.length} page breaks with source attribute`);
            
            // Check first few page breaks
            const samplesToShow = Math.min(pbElements.length, 5);
            for (let i = 0; i < samplesToShow; i++) {
                const pb = pbElements[i];
                const source = pb.getAttribute('source');
                console.log(`🔍 DEBUG: Page break ${i+1} source: "${source}"`);
                
                // Try to extract witness from source
                if (source) {
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        console.log(`🔍 DEBUG: Extracted potential witness ID: "${lastPart}" from source`);
                    }
                }
            }
        } catch (e) {
            console.error('❌ DEBUG: Error examining page break sources:', e);
        }
    }
    
    init() {
        // Add a slight delay to ensure DOM is fully loaded
        setTimeout(() => {
            try {
                // Debug: Check for filename-based witness IDs in page breaks before anything else
                this.debugPageBreakSources();
                
                // Discover witnesses and set up mapping
                this.discoverWitnesses();
                this.setupWitnessToSuffixMapping();
                
                // Create necessary UI elements for witnesses
                this.availableWitnesses.forEach(witness => {
                    if (!document.getElementById(`${witness}-tab`)) {
                        console.log(`Creating tab for witness: ${witness}`);
                        this.createWitnessTabs(new Set([witness]));
                    }
                });
                
                // Set up integrations and build paginations
                this.setupOSDIntegration();
                this.safeCall('setupTabEventListeners');
                this.safeCall('setupVariantClickListeners');
                
                // Debug: Add a slight delay before building paginations
                setTimeout(() => {
                    console.log('🔄 Starting to build all paginations');
                    
                    // Debug: Check the tab content structure before building paginations
                    this.availableWitnesses.forEach(witness => {
                        const tabContent = document.getElementById(`${witness}-meta-data`);
                        if (tabContent) {
                            const witnessPages = tabContent.querySelector('.witness-pages');
                            if (witnessPages) {
                                const pageLinks = witnessPages.querySelector('.page-links');
                                console.log(`📦 TAB CHECK: ${witness} tab content structure: ` + 
                                           (pageLinks ? '✅ Complete' : '❌ Missing .page-links'));
                            } else {
                                console.log(`📦 TAB CHECK: ${witness} tab content missing .witness-pages`);
                            }
                        } else {
                            console.log(`📦 TAB CHECK: ${witness} tab content element not found`);
                        }
                    });
                    
                    this.buildAllPaginations();
                    
                    // Now set default witness and refresh links
                    this.setDefaultWitness();
                    this.triggerPageLinksRefresh();
                    
                    console.log('🔄 Enhanced Witness Switcher initialized');
                    console.log('📋 Available witnesses:', Array.from(this.availableWitnesses));
                    console.log('🗺️ Witness to suffix mapping:', this.witnessToSuffixMap);
                    
                    // Expose available witnesses for other scripts
                    window.witnessAvailableSet = this.availableWitnesses;
                }, 200);
                
            } catch (e) {
                console.error('❌ Error during witness switcher initialization:', e);
            }
        }, 200); // Increased delay for better tab content initialization
    }

    // Safe method invoker to avoid TypeError if a hook is missing
    safeCall(methodName, ...args) {
        try {
            const fn = this[methodName];
            if (typeof fn === 'function') {
                return fn.apply(this, args);
            } else {
                // console.warn(`⚠️ ${methodName} is not a function; skipping`);
            }
        } catch (e) {
            // console.error(`❌ Error calling ${methodName}:`, e);
        }
        return undefined;
    }

    // Helper to refresh the page list links (delegates to osd_scroll.js)
    triggerPageLinksRefresh() {
        try {
            console.log('🔄 REFRESH: Triggering page links refresh');
            
            // Debug: Check existing page links before refresh
            const allPageLinks = document.querySelectorAll('.page-links .page-link');
            console.log(`🔍 REFRESH: Found ${allPageLinks.length} total .page-link elements before refresh`);
            
            // Witness-specific check
            if (this.currentWitness) {
                const witnessPageLinks = document.querySelectorAll(`#${this.currentWitness}-meta-data .page-links .page-link`);
                console.log(`🔍 REFRESH: Found ${witnessPageLinks.length} .page-link elements for current witness "${this.currentWitness}"`);
            }
            
            if (typeof window.updatePageLinks === 'function') {
                clearTimeout(this._linksRefreshTimer);
                this._linksRefreshTimer = setTimeout(() => {
                    window.updatePageLinks();
                    console.log('✅ REFRESH: Called window.updatePageLinks()');
                    
                    // Debug: Check page links after refresh
                    setTimeout(() => {
                        const afterAllPageLinks = document.querySelectorAll('.page-links .page-link');
                        console.log(`🔍 REFRESH: Found ${afterAllPageLinks.length} total .page-link elements after refresh`);
                        
                        if (this.currentWitness) {
                            const afterWitnessPageLinks = document.querySelectorAll(`#${this.currentWitness}-meta-data .page-links .page-link`);
                            console.log(`🔍 REFRESH: Found ${afterWitnessPageLinks.length} .page-link elements for current witness "${this.currentWitness}" after refresh`);
                        }
                    }, 50);
                }, 0);
            } else {
                console.warn('⚠️ REFRESH: window.updatePageLinks is not available');
            }
        } catch (e) {
            console.error('❌ REFRESH: Error refreshing page links:', e);
        }
    }

    /**
     * Discover all available witnesses from the document
     */
    discoverWitnesses() {
        try {
            console.log('🔍 DISCOVER: Starting witness discovery');
            
            // Use safe DOM queries with defensive null checks
            const safeQuerySelectorAll = (selector) => {
                try {
                    return document.querySelectorAll(selector) || [];
                } catch (e) {
                    console.error(`❌ DISCOVER: Error querying selector "${selector}":`, e);
                    return [];
                }
            };
            
            // Find witnesses from variant elements
            const variantElements = safeQuerySelectorAll('[data-witness]');
            console.log(`🔍 DISCOVER: Found ${variantElements.length} elements with [data-witness]`);
            
            if (variantElements && variantElements.length > 0) {
                variantElements.forEach(element => {
                    if (element && typeof element.getAttribute === 'function') {
                        const witness = element.getAttribute('data-witness');
                        if (witness) {
                            console.log(`🔍 DISCOVER: Adding witness from variant: "${witness}"`);
                            this.availableWitnesses.add(witness);
                        }
                    }
                });
            }

            // Check pb elements for witness references
            const pbElementsDataWitness = safeQuerySelectorAll('.pb[data-witness]');
            console.log(`🔍 DISCOVER: Found ${pbElementsDataWitness.length} elements with .pb[data-witness]`);
            
            if (pbElementsDataWitness && pbElementsDataWitness.length > 0) {
                pbElementsDataWitness.forEach(element => {
                    if (element && typeof element.getAttribute === 'function') {
                        const witness = element.getAttribute('data-witness');
                        if (witness) {
                            console.log(`🔍 DISCOVER: Adding witness from pb data-witness: "${witness}"`);
                            this.availableWitnesses.add(witness);
                        }
                    }
                });
            }

            // Check for wit attributes
            const pbElementsWit = safeQuerySelectorAll('.pb[wit]');
            console.log(`🔍 DISCOVER: Found ${pbElementsWit.length} elements with .pb[wit]`);
            
            if (pbElementsWit && pbElementsWit.length > 0) {
                pbElementsWit.forEach(element => {
                    if (element && typeof element.getAttribute === 'function') {
                        const wit = element.getAttribute('wit');
                        if (wit) {
                            const witness = wit.startsWith('#') ? wit.substring(1) : wit;
                            console.log(`🔍 DISCOVER: Adding witness from pb wit: "${witness}"`);
                            this.availableWitnesses.add(witness);
                        }
                    }
                });
            }

            // Get all pb sources for checking and extract witness IDs from filenames
            const allPbSources = [];
            const allPbs = safeQuerySelectorAll('.pb[source]');
            const witnessesFromFilenames = new Set();
            
            allPbs.forEach(pb => {
                const source = pb.getAttribute('source');
                if (source) {
                    allPbSources.push(source);
                    
                    // Extract witness ID from filename (like 17000316_HanssGeorgWagner_a_oenb.jp2)
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        // The last part before file extension typically contains the witness ID
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        if (lastPart) {
                            console.log(`🔍 DISCOVER: Found witness "${lastPart}" in filename: ${source}`);
                            witnessesFromFilenames.add(lastPart);
                        }
                    }
                }
            });
            console.log(`🔍 DISCOVER: Found ${allPbSources.length} pb sources:`, allPbSources);
            
            // Add witnesses extracted from filenames
            witnessesFromFilenames.forEach(witness => {
                console.log(`🔍 DISCOVER: Adding witness from filename: "${witness}"`);
                this.availableWitnesses.add(witness);
            });

            // If no witnesses discovered at all, create a default "primary" witness
            if (this.availableWitnesses.size === 0) {
                console.log(`🔍 DISCOVER: No witnesses found, creating default "primary" witness`);
                this.availableWitnesses.add('primary');
            }

            console.log('🔍 DISCOVER: Discovered witnesses:', Array.from(this.availableWitnesses));
        } catch (e) {
            console.error('❌ DISCOVER: Error discovering witnesses:', e);
            // Add a fallback witness if error
            this.availableWitnesses.add('primary');
        }
    }

    /**
     * Set up mapping between witnesses and their page suffixes
     */
    setupWitnessToSuffixMapping() {
        console.log('🔍 MAPPING: Setting up witness to suffix mapping');

        // Map discovered witnesses to their suffix identifiers based on naming patterns
        this.availableWitnesses.forEach(witness => {
            // Simply use the first letter of the witness ID as a suffix by default
            const defaultSuffix = witness.charAt(0).toUpperCase();
            this.witnessToSuffixMap.set(witness, defaultSuffix);
            console.log(`🔍 MAPPING: Set ${witness} -> ${defaultSuffix} (default mapping)`);
        });
        
        // Look for more specific mappings in pb elements' sources
        const pbElements = document.querySelectorAll('.pb[source]');
        if (pbElements && pbElements.length > 0) {
            pbElements.forEach(pb => {
                const source = pb.getAttribute('source');
                if (source) {
                    // Try to extract witness ID and suffix from filename patterns
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        // Check if the last part contains the witness ID
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        
                        // If we have a witness with this ID, look for a pattern in the source
                        if (this.availableWitnesses.has(lastPart)) {
                            // Look for suffix indicators in the filename (like '_R_' or '_W_')
                            for (let i = 0; i < parts.length; i++) {
                                const part = parts[i];
                                if (part.length === 1 && /^[A-Z]$/.test(part)) {
                                    // Single uppercase letter could be a suffix indicator
                                    this.witnessToSuffixMap.set(lastPart, part);
                                    console.log(`🔍 MAPPING: Updated ${lastPart} -> ${part} (from filename pattern)`);
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        console.log('🔍 MAPPING: Final witness to suffix mapping:', 
                    Array.from(this.witnessToSuffixMap.entries())
                        .map(([k, v]) => `${k} -> ${v}`)
                        .join(', '));
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
                    // console.log('🖼️ OSD integration ready');
                    
                    // Wait a bit more to ensure all images are loaded
                    setTimeout(() => {
                        this.captureAllPages();
                        // console.log('📄 Total pages available:', this.allPages.length);
                        if (this.osdViewer.viewer) {
                            this.osdViewer.viewer.addHandler('page', (event) => {
                                try {
                                    // console.log(`📄 OSD page changed to: ${event.page}`);
                                    this.syncTextWithPage(event.page);
                                    if (this.currentWitness) {
                                        this.updatePaginationActiveState(this.currentWitness, event.page);
                                    }
                                } catch (e) {
                                    // console.error('❌ Error in page change handler:', e);
                                }
                            });
                        }
                    }, 1000);
                } else {
                    setTimeout(checkOSD, 200);
                }
            } catch (e) {
                // console.error('❌ Error checking for OSD viewer:', e);
                setTimeout(checkOSD, 500);
            }
        };
        
        // Start checking for OSD, but with a slight delay
        setTimeout(checkOSD, 300);
    }

    // Helper to find pb elements for a witness (shared by pagination + OSD update)
    getWitnessPbs(witness) {
        try {
            console.log(`🔍 GET_PBS: Finding page breaks for witness "${witness}"`);
            
            const witnessSuffix = this.witnessToSuffixMap.get(witness);
            let witnessPbs = [];
            
            // For single-witness documents - if there's only one set of page breaks, use those
            const allPbs = Array.from(document.querySelectorAll('.pb[source]') || []);
            console.log(`🔍 GET_PBS: Found ${allPbs.length} total page breaks with source attribute`);
            
            // 1. Most specific first: wit attribute
            witnessPbs = Array.from(document.querySelectorAll(`.pb[wit="#${witness}"][source]`) || []);
            if (witnessPbs.length > 0) {
                console.log(`🔍 GET_PBS: Found ${witnessPbs.length} page breaks with wit="#${witness}"`);
            }

            // 2. Try data-witness attribute
            if (witnessPbs.length === 0) {
                witnessPbs = Array.from(document.querySelectorAll(`.pb[data-witness="${witness}"][source]`) || []);
                if (witnessPbs.length > 0) {
                    console.log(`🔍 GET_PBS: Found ${witnessPbs.length} page breaks with data-witness="${witness}"`);
                }
            }

            // 3. Try matching against the filenames directly
            if (witnessPbs.length === 0) {
                witnessPbs = allPbs.filter(pb => {
                    const source = pb.getAttribute('source') || '';
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        return lastPart === witness;
                    }
                    return false;
                });
                if (witnessPbs.length > 0) {
                    console.log(`🔍 GET_PBS: Found ${witnessPbs.length} page breaks with "${witness}" in filename`);
                }
            }

            // 4. If we're still empty and this is a primary witness, use any available pbs
            if (witnessPbs.length === 0 && witness === 'primary') {
                // If we have data-pb-type="primary", prefer those
                const primaryPbs = Array.from(document.querySelectorAll('.pb[data-pb-type="primary"][source]'));
                if (primaryPbs.length > 0) {
                    console.log(`🔍 GET_PBS: Using ${primaryPbs.length} primary page breaks as fallback`);
                    return primaryPbs;
                }
                
                // If still empty, use ANY pbs we can find
                if (allPbs.length > 0) {
                    console.log(`🔍 GET_PBS: Using all ${allPbs.length} available page breaks as fallback`);
                    return allPbs;
                }
            }
            
            // 5. If still nothing found and we have a witnessSuffix, try less specific pattern matching
            if (witnessPbs.length === 0 && witnessSuffix) {
                // Don't be too specific about where the suffix appears in the filename
                const witnessSuffixLower = witnessSuffix.toLowerCase();
                witnessPbs = allPbs.filter(pb => {
                    const src = pb.getAttribute('source') || '';
                    // Case insensitive check for the suffix anywhere in the source
                    return src.toLowerCase().includes(witnessSuffixLower);
                });
                if (witnessPbs.length > 0) {
                    console.log(`🔍 GET_PBS: Found ${witnessPbs.length} page breaks containing suffix "${witnessSuffix}"`);
                }
            }
            
            console.log(`🔍 GET_PBS: Final result - using ${witnessPbs.length} page breaks for "${witness}"`);
            return witnessPbs;
        } catch (e) {
            console.error('❌ getWitnessPbs error:', e);
            // Return any available page breaks as a last resort
            const anyPbs = Array.from(document.querySelectorAll('.pb[source]') || []);
            console.log(`❌ GET_PBS: Error, falling back to ${anyPbs.length} available page breaks`);
            return anyPbs;
        }
    }

    /**
     * Update OSD viewer images for a specific witness with defensive coding
     */
    updateOSDImagesForWitness(witness) {
        try {
            // Prefer pages derived from DOM (keeps order in sync with pagination)
            this.ensurePaginationForWitness(witness);
            const entries = this.witnessPagesMap.get(witness) || [];

            let tileSources = entries.map(e => e.tileSource);

            // Fallback to any page breaks if none witness-specific found
            if (tileSources.length === 0) {
                const witnessPbs = this.getWitnessPbs(witness);
                
                // Last resort: If still no witness-specific pbs, use ANY available pbs
                if (!witnessPbs || witnessPbs.length === 0) {
                    const anyPbs = document.querySelectorAll('.pb[source]');
                    if (anyPbs && anyPbs.length > 0) {
                        tileSources = Array.from(anyPbs).map(pb => {
                            const src = pb.getAttribute('source');
                            if (!src) return null;
                            return src.startsWith('http') 
                                ? src 
                                : `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`;
                        }).filter(Boolean);
                    } else {
                        // Absolute last resort - use an empty array
                        return [];
                    }
                } else {
                    tileSources = witnessPbs.map(pb => {
                        const src = pb.getAttribute('source');
                        if (!src) return null;
                        return src.startsWith('http')
                            ? src
                            : `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`;
                    }).filter(Boolean);
                }
            }

            if (tileSources.length === 0) {
                console.warn(`⚠️ No valid tile sources found for witness: ${witness}`);
                return;
            }

            // Update filteredPages to match pagination order
            this.filteredPages = (this.witnessPagesMap.get(witness) || []).map((e, i) => ({
                index: i,
                source: e.tileSource,
                filename: this.extractFilename(e.tileSource),
                witness
            }));

            console.log(`🖼️ Built ${tileSources.length} tile sources for witness ${witness}`);
            this.loadFacsimilesIntoOSD(tileSources);
        } catch (e) {
            console.error(`❌ Error updating OSD images for witness ${witness}:`, e);
        }
    }
    
    /**
     * Load fallback sources for a specific witness type
     */
    loadFallbackSources(witnessType) {
        // console.log(`🔄 Loading fallback sources for witness type ${witnessType}`);
        
        // No more hardcoded witness types
        const sources = [];
        
        const tileSources = sources.map(src => 
            `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`);
        
        // console.log(`📋 Using ${tileSources.length} fallback tile sources`);
        this.loadFacsimilesIntoOSD(tileSources);
    }
    
    /**
     * Simplified method to load facsimiles into OSD viewer
     */
    loadFacsimilesIntoOSD(tileSources) {
        // console.log('🔄 Loading facsimiles into OSD viewer');
        try {
            // Find the viewer - try multiple approaches
            let viewer = null;
            
            if (window.manuscriptViewer && window.manuscriptViewer.viewer) {
                viewer = window.manuscriptViewer.viewer;
                // console.log('✅ Found viewer in manuscriptViewer.viewer');
            } else if (window.viewer && typeof window.viewer.open === 'function') {
                viewer = window.viewer;
                // console.log('✅ Found viewer in window.viewer');
            } else if (window.OpenSeadragon && window.OpenSeadragon.viewers && window.OpenSeadragon.viewers.length > 0) {
                viewer = window.OpenSeadragon.viewers[0];
                // console.log('✅ Found viewer in OpenSeadragon.viewers[0]');
            }
            
            if (!viewer) {
                // console.error('❌ No OSD viewer found');
                return;
            }
            
            // Update manuscriptViewer arrays
            if (window.manuscriptViewer) {
                window.manuscriptViewer.iiifManifests = [...tileSources];
                window.manuscriptViewer.allImages = [...tileSources];
                window.manuscriptViewer.currentIndex = 0;
            }
            
            // console.log('🔄 Updating viewer with new tile sources...');
            
            // Reset the viewer
            if (viewer.world && typeof viewer.world.removeAll === 'function') {
                viewer.world.removeAll();
            }
            
            // Close and reopen with new images
            if (typeof viewer.isOpen === 'function' && viewer.isOpen()) {
                viewer.close();
            }
            
            // Open with new tile sources - add error handling
            // console.log('🔄 Opening viewer with new tile sources');
            try {
                viewer.open(tileSources);
                // console.log('✅ Successfully opened viewer with new sources');
            } catch (openError) {
                // console.error('❌ Error opening viewer with tileSources:', openError);
                // Try opening just the first image as fallback
                if (tileSources.length > 0) {
                    try {
                        // console.log('🔄 Trying to open just the first image');
                        viewer.open(tileSources[0]);
                    } catch (singleError) {
                        // console.error('❌ Error opening single image:', singleError);
                    }
                }
            }

            // After open, prefer navigating to a pending target page (from ?tab=...)
            const applyPending = () => {
                try {
                    const total = (window.manuscriptViewer && Array.isArray(window.manuscriptViewer.iiifManifests))
                        ? window.manuscriptViewer.iiifManifests.length
                        : (Array.isArray(tileSources) ? tileSources.length : 0);
                    if (this.pendingNavigation && this.pendingNavigation.witness === this.currentWitness) {
                        const target = Math.max(0, Math.min(this.pendingNavigation.index, Math.max(0, total - 1)));
                        if (typeof viewer.goToPage === 'function') {
                            viewer.goToPage(target);
                            this.updatePaginationActiveState(this.currentWitness, target);
                            this.pendingNavigation = null;
                            return;
                        }
                    }
                    if (typeof viewer.goToPage === 'function') {
                        viewer.goToPage(0);
                    }
                } catch (e) {
                    // console.error('❌ Error applying pending navigation:', e);
                }
            };

            if (typeof viewer.addOnceHandler === 'function') {
                viewer.addOnceHandler('open', applyPending);
            } else {
                setTimeout(applyPending, 300);
            }
        } catch (e) {
            // console.error('❌ Error loading facsimiles:', e);
        }
    }

    // Build pagination for all discovered witnesses
    buildAllPaginations() {
        console.log('🔄 Building paginations for all witnesses:', Array.from(this.availableWitnesses));
        this.availableWitnesses.forEach(witness => {
            console.log(`🔄 Ensuring pagination for witness: ${witness}`);
            this.ensurePaginationForWitness(witness);
        });
        // After building all paginations, refresh links
        this.triggerPageLinksRefresh();
    }

    // Ensure pagination exists for a witness; build it once
    ensurePaginationForWitness(witness) {
        if (!this.witnessPagesMap.has(witness)) {
            console.log(`🔄 Building pagination for witness "${witness}" as it doesn't exist yet`);
            this.buildPaginationForWitness(witness);
        }
    }

    // Derive a short page label from @n or source filename
    deriveLabelFromSource(src, index, pbEl) {
        const n = pbEl && pbEl.getAttribute ? pbEl.getAttribute('n') : null;
        if (n) return n;
        try {
            // Try to extract a page identifier from between underscores
            // Look for patterns like "date_name_a_witnessId.jp2" -> "a"
            const pageIdentifier = src && src.match(/_([a-zA-Z0-9]+)_[^_.]+\.[^_.]+$/i);
            if (pageIdentifier && pageIdentifier[1]) {
                console.log(`🔍 LABEL: Extracted page label "${pageIdentifier[1]}" from "${src}"`);
                return pageIdentifier[1];
            }
            
            // Try to extract a single letter (like a, b, c) which often represents page
            const letterIdentifier = src && src.match(/_([a-z])_/i);
            if (letterIdentifier && letterIdentifier[1]) {
                console.log(`🔍 LABEL: Extracted letter label "${letterIdentifier[1]}" from "${src}"`);
                return letterIdentifier[1];
            }
            
            // Fallback to the last chunk before extension
            const base = (src || '').split('/').pop() || '';
            const simpleName = base.replace(/\.[^.]+$/, '') || String(index + 1);
            console.log(`🔍 LABEL: Using fallback label "${simpleName}" for "${src}"`);
            return simpleName;
        } catch (e) {
            console.error(`❌ LABEL: Error deriving label from "${src}":`, e);
            return String(index + 1);
        }
    }

    // Build pagination UI and data for one witness
    buildPaginationForWitness(witness) {
        try {
            console.log(`🔄 PAGINATION: Starting buildPaginationForWitness for "${witness}"`);
            
            // Debug: Check if the tab content exists
            const tabContent = document.getElementById(`${witness}-meta-data`);
            if (!tabContent) {
                console.error(`❌ PAGINATION: Tab content #${witness}-meta-data not found`);
                return;
            }
            
            // Debug: Check if the witness-pages container exists
            const witnessPages = tabContent.querySelector('.witness-pages');
            if (!witnessPages) {
                console.error(`❌ PAGINATION: .witness-pages container not found in #${witness}-meta-data`);
                return;
            }
            
            // Find the page links container
            const ul = witnessPages.querySelector('.page-links');
            if (!ul) {
                console.error(`❌ PAGINATION: .page-links container not found in #${witness}-meta-data .witness-pages`);
                return;
            }
            
            // Debug: List all the page breaks we have
            console.log(`🔍 PAGINATION: Looking for page breaks for witness "${witness}"`);
            const allPbs = document.querySelectorAll('.pb[source]');
            console.log(`🔍 PAGINATION: Found ${allPbs.length} total page breaks with source`);
            
            // Get page breaks specific to this witness
            const pbs = this.getWitnessPbs(witness);
            if (!pbs || pbs.length === 0) {
                console.error(`❌ PAGINATION: No page breaks found for witness "${witness}"`);
                return;
            }
            
            console.log(`✅ PAGINATION: Found ${pbs.length} page breaks for witness "${witness}"`);
            
            // Clear container
            ul.innerHTML = '';
            
            // Create entries from page breaks
            const entries = pbs.map((pb, idx) => {
                const src = pb.getAttribute('source');
                console.log(`🔍 PAGINATION: Processing page break ${idx} with source "${src}"`);
                
                const tileSource = src && src.startsWith('http')
                    ? src
                    : `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`;
                const label = this.deriveLabelFromSource(src, idx, pb);
                console.log(`🔍 PAGINATION: Derived label for page ${idx}: "${label}"`);
                
                return { index: idx, tileSource, label, source: src, pb };
            });
            
            // Add page links to the UI
            entries.forEach(entry => {
                const li = document.createElement('li');
                li.className = 'list-inline-item';
                const a = document.createElement('a');
                a.href = '#';
                a.className = 'page-link';
                a.textContent = entry.label;
                a.setAttribute('data-witness', witness);
                a.setAttribute('data-page-index', String(entry.index));
                a.addEventListener('click', (ev) => {
                    ev.preventDefault();
                    this.goToWitnessPage(witness, entry.index);
                });
                li.appendChild(a);
                ul.appendChild(li);
                console.log(`➕ PAGINATION: Added page link for ${witness}: ${entry.label} (index: ${entry.index})`);
            });
            
            // Store the entries for later use
            this.witnessPagesMap.set(witness, entries);
            console.log(`✅ PAGINATION: Completed pagination for "${witness}" with ${entries.length} pages`);
            
            // Debug: Confirm the links are actually in the DOM
            const addedLinks = ul.querySelectorAll('.page-link');
            console.log(`🔍 PAGINATION: Verified ${addedLinks.length} page links are in the DOM for witness "${witness}"`);
            
            // Refresh links
            this.triggerPageLinksRefresh();
        } catch (e) {
            console.error(`❌ PAGINATION: Error building pagination for "${witness}":`, e);
        }
    }

    // Navigate to a specific page in a witness (switch if needed)
    goToWitnessPage(witness, index) {
        if (this.currentWitness !== witness) {
            // If switching witness, let switchToWitness handle the initial text update.
            // It will use pendingNavigation if set, or default to page 0.
            this.scheduleNavigation(witness, index);
            this.switchToWitness(witness);
        } else {
            // If witness is already active, just navigate to the page.
            this.navigateViewerToIndex(index);
            this.syncTextWithPage(index); // This will update the text display
        }
        this.updatePaginationActiveState(witness, index);
        this.updateBrowserState(witness, index);
    }

    navigateViewerToIndex(index) {
        try {
            const viewer = (this.osdViewer && this.osdViewer.viewer) ? this.osdViewer.viewer : null;
            if (viewer && typeof viewer.goToPage === 'function') {
                viewer.goToPage(index);
            }
        } catch (e) {
            // console.error('❌ navigateViewerToIndex error:', e);
        }
    }

    updatePaginationActiveState(witness, pageIndex) {
        try {
            const container = document.querySelector(`#${witness}-meta-data .witness-pages`);
            if (!container) return;
            container.querySelectorAll('.page-link').forEach(a => a.classList.remove('active'));
            const current = container.querySelector(`.page-link[data-page-index="${pageIndex}"]`);
            if (current) current.classList.add('active');
        } catch (e) {
            // console.error('❌ updatePaginationActiveState error:', e);
        }
    }

    /**
     * Switch to a specific witness - SIMPLIFIED VERSION
     */
    switchToWitness(witness) {
        console.log(`🔄 SWITCH: Switching to witness: ${witness}`);
        this.currentWitness = witness;

        // Add witness-active class to body
        document.body.classList.add('witness-active');
        document.body.setAttribute('data-active-witness', witness);

        // Update text display first
        this.updateTextForWitness(witness);

        // Make sure pagination exists before loading images, then load images
        console.log(`🔄 SWITCH: Ensuring pagination exists for ${witness}`);
        this.ensurePaginationForWitness(witness);
        
        // Force page links refresh after ensuring pagination
        this.triggerPageLinksRefresh();
        
        // Update OSD images
        console.log(`🔄 SWITCH: Updating OSD images for ${witness}`);
        this.updateOSDImagesForWitness(witness);

        // Update tab states
        this.updateTabStates(witness);

        // Ensure page-links reflect the switched witness
        console.log(`✅ SWITCH: Finished switching to witness: ${witness}`);
        this.triggerPageLinksRefresh();
    }
    
    /**
     * Set the default witness based on URL parameters or fallback
     */
    setDefaultWitness() {
        console.log('🔍 DEFAULT: Setting default witness');
        
        // First check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        console.log(`🔍 DEFAULT: URL tab parameter: "${tab}"`);
        
        if (tab) {
            // Parse for page number prefix, e.g., "3oenb" -> witness "oenb", page 3
            const match = tab.match(/^(\d+)(.*)$/);
            let witness = tab;
            let pageIndex = 0;

            if (match) {
                pageIndex = Math.max(0, parseInt(match[1], 10) - 1); // 0-based
                witness = match[2];
                console.log(`🔍 DEFAULT: Parsed from URL: page ${pageIndex + 1} of witness "${witness}"`);
                this.pendingNavigation = { witness, index: pageIndex };
            }

            // Check if the witness exists in our available witnesses
            // If we don't have a valid witness, use the first available one
            let targetWitness = witness;
            if (!this.availableWitnesses.has(witness)) {
                targetWitness = Array.from(this.availableWitnesses)[0];
                console.log(`🔍 DEFAULT: Witness "${witness}" not found, using first available: "${targetWitness}"`);
            }
            
            if (targetWitness) {
                // Use goToWitnessPage to handle the initial state
                console.log(`🔍 DEFAULT: Going to witness "${targetWitness}" page ${pageIndex}`);
                this.goToWitnessPage(targetWitness, pageIndex);
            }
        } else {
            // Pick the most appropriate default witness
            const allPbElements = document.querySelectorAll('.pb[source]');
            const hasMultipleWitnesses = this.availableWitnesses.size > 1;
            
            console.log(`🔍 DEFAULT: No tab param, found ${allPbElements.length} pb elements, hasMultipleWitnesses: ${hasMultipleWitnesses}`);
            
            // Check for witnesses in the filenames of page breaks
            let witnessFromFilename = null;
            if (allPbElements && allPbElements.length > 0) {
                const firstPb = allPbElements[0];
                const source = firstPb.getAttribute('source');
                if (source) {
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        if (lastPart && this.availableWitnesses.has(lastPart)) {
                            witnessFromFilename = lastPart;
                            console.log(`🔍 DEFAULT: Found witness "${witnessFromFilename}" in first pb source: ${source}`);
                        }
                    }
                }
            }
            
            // For single-witness documents, create a tab using the actual witness name from source
            if (!hasMultipleWitnesses && allPbElements.length > 0) {
                let actualWitnessId = 'primary';
                
                // Try to get the actual witness ID from the first page break source
                if (allPbElements[0]) {
                    const source = allPbElements[0].getAttribute('source');
                    if (source) {
                        const parts = source.split('_');
                        if (parts.length >= 4) {
                            const lastPart = parts[parts.length - 1].split('.')[0];
                            if (lastPart) {
                                actualWitnessId = lastPart;
                                console.log(`🔍 DEFAULT: Using actual witness ID "${actualWitnessId}" from source`);
                            }
                        }
                    }
                }
                
                console.log(`🔍 DEFAULT: Single-witness document, using "${actualWitnessId}" witness`);
                this.availableWitnesses.add(actualWitnessId);
                this.goToWitnessPage(actualWitnessId, 0);
                return;
            }
            
            // For multi-witness, prioritize real witness IDs from filenames
            let defaultWitness;
            if (witnessFromFilename) {
                defaultWitness = witnessFromFilename;
                console.log(`🔍 DEFAULT: Using witness from filename: "${defaultWitness}"`);
            } else {
                defaultWitness = Array.from(this.availableWitnesses)[0];
                console.log(`🔍 DEFAULT: Using first available witness: "${defaultWitness}"`);
            }
            
            if (defaultWitness) {
                this.goToWitnessPage(defaultWitness, 0);
            }
        }
        
        console.log(`🔍 DEFAULT: Current witness set to: "${this.currentWitness}"`);
    }

    /**
     * Update text display to show only variants for the current witness
     */
    updateTextForWitness(witness) {
        try {
            // Ensure pagination/entries exist before using them
            this.ensurePaginationForWitness(witness);

            // Show/hide the correct witness text variants
            this.applyWitnessVariants(witness);

            // Hide all pb elements first
            document.querySelectorAll('.pb').forEach(pb => {
                pb.style.display = 'none';
                pb.classList.remove('active-witness-pb', 'current-page');
            });

            // Get pbs for the current witness
            const witnessPbs = this.getWitnessPbs(witness);
            witnessPbs.forEach(pb => {
                pb.style.display = 'inline';
                pb.classList.add('active-witness-pb');
            });

            // Also show primary pbs if no specific witness pages found
            if (witnessPbs.length === 0) {
                document.querySelectorAll('.pb[data-pb-type="primary"]').forEach(pb => {
                    pb.style.display = 'inline';
                    pb.classList.add('active-witness-pb');
                });
            }

            // Inform osd_scroll.js about the new set of page breaks
            if (typeof window.updateOsdScrollPageBreaks === 'function') {
                window.updateOsdScrollPageBreaks(witnessPbs);
            }

            // Determine which page to show
            let pageToShow = 0;
            if (this.pendingNavigation && this.pendingNavigation.witness === witness) {
                pageToShow = this.pendingNavigation.index;
                // Don't clear pendingNavigation here; let the viewer handler do it.
            }

            // Show the determined page's text. This will mark the correct pb.
            this.syncTextWithPage(pageToShow);
            
            // If we handled a pending navigation from a URL, update the state
            if (this.pendingNavigation && this.pendingNavigation.witness === witness) {
                this.updateBrowserState(witness, pageToShow);
            }

            // console.log(`📝 Text updated for witness: ${witness}`);
        } catch (e) {
            // console.error(`❌ Error updating text for witness ${witness}:`, e);
        } finally {
            // Text, pbs and pagination updated -> refresh links
            this.triggerPageLinksRefresh();
        }
    }

    /**
     * Shows/hides variant readings based on the selected witness
     */
    applyWitnessVariants(witness) {
        // Hide all variant readings
        document.querySelectorAll('.variant-reading').forEach(variant => {
            variant.classList.remove('active-witness');
        });

        // Show only variants for the current witness
        document.querySelectorAll(`.variant-reading[data-witness="${witness}"]`)
            .forEach(variant => variant.classList.add('active-witness'));
    }

    /**
     * Synchronize text display with current OSD page
     */
    syncTextWithPage(pageIndex) {
        try {
            const entries = this.witnessPagesMap.get(this.currentWitness) || [];
            if (pageIndex >= entries.length) {
                // console.warn(`⚠️ syncTextWithPage: pageIndex ${pageIndex} is out of bounds for witness ${this.currentWitness} (max: ${entries.length - 1})`);
                return;
            }

            // Find the corresponding pb element for this page
            const entry = entries.find(e => e.index === pageIndex);

            if (entry && entry.pb) {
                // Remove current-page from all pbs and mark the current one
                document.querySelectorAll('.pb').forEach(pb => pb.classList.remove('current-page'));
                entry.pb.classList.add('current-page');

                // Show text for this page using osd_scroll's logic
                this.displayTextForPage(entry.pb);
                this.updatePaginationActiveState(this.currentWitness, pageIndex);
            } else {
                 // Fallback to osd_scroll.js directly if entry not found
                if (typeof window.show_only_current_page === 'function') {
                    window.show_only_current_page(pageIndex);
                    this.updatePaginationActiveState(this.currentWitness, pageIndex);
                }
            }

            // Re-apply witness variants after osd_scroll has updated page visibility
            this.applyWitnessVariants(this.currentWitness);

        } catch (e) {
            // console.error(`❌ Error syncing text with page ${pageIndex}:`, e);
        } finally {
            // Keep links in sync with current witness state
            this.triggerPageLinksRefresh();
        }
    }

    /**
     * Display text for a specific page break element
     */
    displayTextForPage(pbElement) {
        if (!pbElement) return;

        try {
            // Delegate to osd_scroll.js's show_only_current_page function
            if (typeof window.show_only_current_page === 'function' && typeof window.getOsdScrollPbElements === 'function') {
                const pbElements = window.getOsdScrollPbElements();
                const pageIndex = pbElements.indexOf(pbElement);
                if (pageIndex !== -1) {
                    window.show_only_current_page(pageIndex);
                } else {
                    // console.warn('displayTextForPage: pbElement not found in osd_scroll.js page breaks.');
                }
            } else {
                // console.error('displayTextForPage: show_only_current_page or getOsdScrollPbElements is not available.');
            }

            try {
                pbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (_) {}
        } catch (e) {
            // console.error('❌ displayTextForPage error:', e);
        }
    }

    /**
     * Set up event listeners for witness tabs
     */
    setupTabEventListeners() {
        try {
            console.log('🔄 TABS: Setting up tab event listeners');
            
            // Handle dynamically discovered witnesses
            this.availableWitnesses.forEach(witness => {
                try {
                    const tabElement = document.getElementById(`${witness}-tab`);
                    if (tabElement) {
                        tabElement.addEventListener('click', (event) => {
                            event.preventDefault();
                            
                            // Get current page index from global variable
                            const pageIndex = window.current_page_index || 0;
                            console.log(`📑 TABS: ${witness} tab clicked, page index: ${pageIndex}`);
                            
                            // Use goToWitnessPage instead of switchToWitness to preserve page
                            this.goToWitnessPage(witness, pageIndex);
                        });
                        console.log(`✅ TABS: Added click listener for ${witness} tab`);
                    } else {
                        console.log(`⚠️ TABS: Tab element for ${witness} not found`);
                    }
                } catch (e) {
                    console.error(`❌ TABS: Error setting up tab for ${witness}:`, e);
                }
            });
            
            console.log('✅ TABS: Tab event listeners setup complete');
        } catch (e) {
            console.error('❌ TABS: Error setting up tab event listeners:', e);
        }
    }

    /**
     * Set up event listeners for variant text clicks
     */
    setupVariantClickListeners() {
        try {
            // console.log('Setting up variant click listeners');
            const variantElements = document.querySelectorAll('.variant-reading');
            
            if (variantElements && variantElements.length > 0) {
                variantElements.forEach(element => {
                    try {
                        element.addEventListener('click', (event) => {
                            event.preventDefault();
                            const witness = element.getAttribute('data-witness');
                            if (witness) {
                                // console.log(`🎯 Variant clicked for witness: ${witness}`);
                                this.switchToWitness(witness);
                            }
                        });
                    } catch (e) {
                        // console.error('❌ Error setting up variant click listener:', e);
                    }
                });
                // console.log(`✅ Added click listeners for ${variantElements.length} variant elements`);
            } else {
                // console.log('⚠️ No variant elements found');
            }
        } catch (e) {
            // console.error('❌ Error setting up variant click listeners:', e);
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
                    // console.error(`❌ Error mapping page ${index}:`, e);
                    return {
                        index: index,
                        source: source,
                        filename: typeof source === 'string' ? source.split('/').pop().split('.')[0] : `page${index}`,
                        witness: 'unknown'
                    };
                }
            });
            
            // console.log('📋 All pages captured with witness mapping:', 
            //            this.allPages.map(p => `${p.filename} (${p.witness})`));
        } catch (e) {
            // console.error('❌ Error capturing pages:', e);
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
            // console.error('❌ Error extracting filename:', e);
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

            // console.log(`🔍 Filtered pages for ${witness}:`, 
            //            this.filteredPages.map(p => `${p.filename} (${p.witness})`));
            
            return this.filteredPages;
        } catch (e) {
            // console.error(`❌ Error filtering pages for witness ${witness}:`, e);
            this.filteredPages = [];
            return [];
        }
    }

    /**
     * Update the active tab states in the UI
     */
    updateTabStates(witness) {
        try {
            // Remove active class from all tabs
            document.querySelectorAll('.nav-link').forEach(tab => tab.classList.remove('active'));
            // Add active class to the current witness tab
            const activeTab = document.getElementById(`${witness}-tab`);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        } catch (e) {
            // console.error('❌ Error updating tab states:', e);
        }
    }

    // Update the browser state (URL) with the current witness
    updateBrowserState(witness, pageIndex = -1) {
        try {
            const url = new URL(window.location);
            let tabValue = witness;
            if (pageIndex > -1) {
                tabValue = `${pageIndex + 1}${witness}`;
            }
            url.searchParams.set('tab', tabValue);
            window.history.replaceState(null, null, url);
        } catch (e) {
            // console.error('❌ Error updating browser state:', e);
        } finally {
            this.triggerPageLinksRefresh();
        }
    }

    /**
     * Schedule navigation for later application
     */
    scheduleNavigation(witness, index) {
        this.pendingNavigation = { witness, index };
    }

    // Create a witness tab if it doesn't exist
    createWitnessTabs(witnessIds) {
        try {
            const tabsContainer = document.querySelector('ul.nav-tabs');
            if (!tabsContainer) {
                console.log('⚠️ No tab container found to create tabs');
                return;
            }
            
            witnessIds.forEach(witnessId => {
                // Check if tab already exists
                if (document.getElementById(`${witnessId}-tab`)) {
                    console.log(`📋 Tab for ${witnessId} already exists`);
                    return;
                }
                
                console.log(`🔨 Creating tab for witness: ${witnessId}`);
                
                // Create tab button
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const button = document.createElement('button');
                button.className = 'nav-link';
                button.id = `${witnessId}-tab`;
                button.setAttribute('data-bs-toggle', 'tab');
                button.setAttribute('data-bs-target', `#${witnessId}-meta-data`);
                button.setAttribute('type', 'button');
                button.setAttribute('role', 'tab');
                button.setAttribute('aria-controls', `${witnessId}`);
                button.setAttribute('aria-selected', 'false');
                button.textContent = witnessId.toUpperCase();
                
                li.appendChild(button);
                tabsContainer.appendChild(li);
                
                // Create tab content pane
                const contentContainer = document.querySelector('div.tab-content');
                if (contentContainer) {
                    const tabPane = document.createElement('div');
                    tabPane.className = 'tab-pane fade';
                    tabPane.id = `${witnessId}-meta-data`;
                    tabPane.setAttribute('role', 'tabpanel');
                    tabPane.setAttribute('aria-labelledby', `${witnessId}-tab`);
                    
                    // Add container for page links with the requested structure
                    const witnessPages = document.createElement('div');
                    witnessPages.className = 'witness-pages mt-3';
                    
                    const heading = document.createElement('h5');
                    heading.textContent = 'Seiten:';
                    witnessPages.appendChild(heading);
                    
                    const pageLinks = document.createElement('ul');
                    pageLinks.className = 'page-links list-inline';
                    
                    witnessPages.appendChild(pageLinks);
                    tabPane.appendChild(witnessPages);
                    contentContainer.appendChild(tabPane);
                    
                    console.log(`📦 Created tab content pane for ${witnessId}`);
                    console.log(`📦 STRUCTURE: #${witnessId}-meta-data > .witness-pages > .page-links`);
                } else {
                    console.error(`❌ No tab content container found for ${witnessId}`);
                }
                
                console.log(`✅ Created tab and content for ${witnessId}`);
            });
        } catch (e) {
            console.error('❌ Error creating witness tabs:', e);
        }
    }
    
    // Get a display name for the witness ID
    getDisplayNameForWitness(witnessId) {
        // If the witness is "primary", try to find a better name from the actual content
        if (witnessId === 'primary') {
            // Look through pb sources to find an actual witness identifier
            const pbs = document.querySelectorAll('.pb[source]');
            if (pbs && pbs.length > 0) {
                // Check the first pb element's source
                const source = pbs[0].getAttribute('source');
                if (source) {
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        // Usually the last part before the extension is the witness ID
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        if (lastPart && lastPart !== 'primary') {
                            console.log(`🔍 Found better display name "${lastPart}" for primary witness`);
                            return lastPart.toUpperCase();
                        }
                    }
                }
            }
        }
        
        // Standard case: just convert to uppercase for consistent display
        return witnessId.toUpperCase();
    }
}

// Initialize the witness switcher when the class is instantiated
new WitnessSwitcher();

// Keep the initial one-time refresh
if (window.updatePageLinks) window.updatePageLinks();

/**
 * Simple Witness Switcher - Immediately reloads page when witness tabs are clicked
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Simple Witness Switcher initializing...');
    
    // Create a helper to get available witnesses
    const getAvailableWitnesses = () => {
        const availableWitnesses = new Set();
        
        // Find witnesses from page break sources
        const pbElements = document.querySelectorAll('.pb[source]');
        pbElements.forEach(pb => {
            const source = pb.getAttribute('source');
            if (source) {
                const parts = source.split('_');
                if (parts.length >= 4) {
                    const lastPart = parts[parts.length - 1].split('.')[0];
                    if (lastPart) {
                        availableWitnesses.add(lastPart);
                        console.log(`📋 Identified witness ID from source: "${lastPart}"`);
                    }
                }
            }
        });
        
        // Also check [data-witness] attributes
        const witnessElements = document.querySelectorAll('[data-witness]');
        witnessElements.forEach(el => {
            const witness = el.getAttribute('data-witness');
            if (witness) {
                availableWitnesses.add(witness);
                console.log(`📋 Identified witness ID from data-witness: "${witness}"`);
            }
        });
        
        // If no witnesses found, use ID from existing tabs
        if (availableWitnesses.size === 0) {
            const tabs = document.querySelectorAll('button[data-bs-toggle="tab"][id$="-tab"]');
            tabs.forEach(tab => {
                const witnessId = tab.id.replace('-tab', '');
                if (witnessId && witnessId !== 'persons') {
                    availableWitnesses.add(witnessId);
                    console.log(`📋 Identified witness ID from tab ID: "${witnessId}"`);
                }
            });
        }
        
        // If still no witnesses found, add a default
        if (availableWitnesses.size === 0) {
            // Look for actual witness ID in file names
            const imgElements = document.querySelectorAll('img[src*="_"]');
            imgElements.forEach(img => {
                const src = img.getAttribute('src');
                if (src) {
                    const parts = src.split('_');
                    if (parts.length >= 4) {
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        if (lastPart) {
                            availableWitnesses.add(lastPart);
                            console.log(`📋 Identified witness ID from image src: "${lastPart}"`);
                        }
                    }
                }
            });
            
            // If still nothing, use a generic default
            if (availableWitnesses.size === 0) {
                console.log(`📋 No witnesses found, using default "doc" witness ID`);
                availableWitnesses.add('doc');
            }
        }
        
        return availableWitnesses;
    };
    
    // Store available witnesses for global access
    window.witnessAvailableSet = getAvailableWitnesses();
    console.log('📋 Available witnesses:', Array.from(window.witnessAvailableSet));
    
    // Generic handler for all witness tabs using event delegation
    document.addEventListener('click', function(e) {
        // Find closest tab button - handle both direct clicks and bubbled events
        const tabButton = e.target.closest('button[data-bs-toggle="tab"]');
        
        if (!tabButton) return;
        
        // Check if it's a witness tab (not persons tab)
        if (tabButton.id && tabButton.id.endsWith('-tab')) {
            const witnessId = tabButton.id.replace('-tab', '');
            if (witnessId === 'persons') return; // Skip persons tab
            
            console.log('🎯 Witness tab clicked:', tabButton.id);
            
            // Prevent default and reload
            e.preventDefault();
            e.stopPropagation();
            reloadPageWithWitness(witnessId);
            return false;
        }
    }, true); // Use capturing to get event before Bootstrap
    
    console.log('✅ Simple Witness Switcher initialized');
});

/**
 * Reload the page with a new witness parameter, preserving current page number
 */
function reloadPageWithWitness(witness) {
    console.log(`🔄 RELOAD: Starting reloadPageWithWitness("${witness}")`);
    
    // Get current page from global variable or URL or default to 1
    let currentPage = 1;
    
    // FIRST PRIORITY: Use window.current_page_index which is set by osd_scroll.js
    if (typeof window.current_page_index === 'number') {
        currentPage = window.current_page_index + 1; // Convert from 0-based to 1-based
        console.log(`📄 RELOAD: Got page ${currentPage} from window.current_page_index`);
    }
    // Second priority: Try getting directly from the OSD viewer
    else if (window.viewer && typeof window.viewer.currentPage === 'function') {
        currentPage = window.viewer.currentPage() + 1; // Convert from 0-based to 1-based
        console.log(`📄 RELOAD: Got page ${currentPage} from OSD viewer.currentPage()`);
    }
    // Third priority: Try the manuscriptViewer global object
    else if (window.manuscriptViewer && typeof window.manuscriptViewer.currentIndex === 'number') {
        currentPage = window.manuscriptViewer.currentIndex + 1; // Convert from 0-based to 1-based
        console.log(`📄 RELOAD: Got page ${currentPage} from manuscriptViewer.currentIndex`);
    }
    // Last resort: Parse from URL
    else {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const match = tab.match(/^(\d+)/);
            if (match && match[1]) {
                currentPage = parseInt(match[1], 10);
                console.log(`📄 RELOAD: Got page ${currentPage} from URL tab parameter`);
            }
        } else {
            console.log('⚠️ RELOAD: No page information found, defaulting to page 1');
        }
    }
    
    // Validate the page number
    if (isNaN(currentPage) || currentPage < 1) {
        console.log('⚠️ RELOAD: Invalid page number, defaulting to page 1');
        currentPage = 1;
    }
    
    // Build the new URL with the witness ID
    const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    const newUrl = `${baseUrl}?tab=${currentPage}${witness}`;
    
    console.log(`🔄 RELOAD: Reloading page with witness ${witness}, page ${currentPage}`);
    console.log(`📄 RELOAD: New URL: ${newUrl}`);
    
    // Update the citation before navigation if available
    if (typeof window.updateCitationSuggestion === 'function') {
        const citationPageIndex = currentPage - 1; // Convert back to 0-based for citation
        console.log(`📋 RELOAD: Updating citation with page index ${citationPageIndex} before navigation`);
        
        // Force current witness to be updated to ensure citation has correct witness
        window.currentWitness = witness;
        console.log(`📋 RELOAD: Set window.currentWitness = "${witness}" for citation`);
        
        try {
            window.updateCitationSuggestion(citationPageIndex);
            console.log(`✅ RELOAD: Citation updated successfully`);
        } catch (e) {
            console.error(`❌ RELOAD: Error updating citation: ${e.message}`);
        }
    } else {
        console.log(`⚠️ RELOAD: window.updateCitationSuggestion is not available`);
    }
    
    // Store the target page and witness in localStorage for persistence
    try {
        const state = {
            pageIndex: currentPage - 1, // Store as 0-based index
            witness: witness
        };
        localStorage.setItem('lastWitnessState', JSON.stringify(state));
        console.log(`📋 RELOAD: Saved state to localStorage: ${JSON.stringify(state)}`);
    } catch (e) {
        console.error(`❌ RELOAD: Error saving state to localStorage: ${e.message}`);
    }
    
    // Force a complete page reload
    console.log(`🚀 RELOAD: Navigating to: ${newUrl}`);
    window.location.href = newUrl;
}

// Export function for global use
window.reloadPageWithWitness = reloadPageWithWitness;

/**
 * Witness Switcher - Handles switching between witness tabs with proper page reloading
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Witness switcher initializing...');
    
    // Share available witnesses for the cleanWitnessId function
    try {
        if (typeof window.witnessAvailableSet === 'undefined') {
            window.witnessAvailableSet = new Set();
            
            // Extract witness IDs from page break sources
            const pbElements = document.querySelectorAll('.pb[source]');
            if (pbElements && pbElements.length > 0) {
                pbElements.forEach(pb => {
                    const source = pb.getAttribute('source');
                    if (source) {
                        const parts = source.split('_');
                        if (parts.length >= 4) {
                            const lastPart = parts[parts.length - 1].split('.')[0];
                            if (lastPart) {
                                window.witnessAvailableSet.add(lastPart);
                                console.log(`📋 Added witness from source: "${lastPart}"`);
                            }
                        }
                    }
                });
            }
            
            // Also check data-witness attributes
            const witnessElements = document.querySelectorAll('[data-witness]');
            witnessElements.forEach(el => {
                const witness = el.getAttribute('data-witness');
                if (witness) {
                    window.witnessAvailableSet.add(witness);
                    console.log(`📋 Added witness from data-witness: "${witness}"`);
                }
            });
            
            console.log('📋 Available witnesses for URL handling:', Array.from(window.witnessAvailableSet));
        }
    } catch (e) {
        console.error('❌ Error setting up witness available set:', e);
    }
    
    // Find all witness tab buttons (excluding persons tab)
    const witnessTabs = document.querySelectorAll('.nav-tabs button[data-bs-toggle="tab"][id$="-tab"]');
    const validWitnessTabs = Array.from(witnessTabs).filter(tab => !tab.id.startsWith('persons-'));
    console.log(`Found ${validWitnessTabs.length} witness tabs`);
    
    // Add click handlers to each tab
    validWitnessTabs.forEach(tab => {
        // Get the witness ID from the tab's ID or target
        const witnessId = tab.id.replace('-tab', '') || 
                         tab.getAttribute('data-bs-target')?.replace('#', '').replace('-meta-data', '');
        
        if (!witnessId) return;
        
        console.log(`Setting up click handler for ${witnessId} tab`);
        
        // Replace Bootstrap's event handler with our own
        tab.addEventListener('click', function(e) {
            // Get current page index from OSD (0-based)
            const pageIndex = window.current_page_index || 0;
            // Convert to 1-based for URL
            const pageNumber = pageIndex + 1;
            
            // Get base URL without parameters
            const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
            
            // Create URL with the new witness and current page - use actual witness ID
            const newUrl = `${baseUrl}?tab=${pageNumber}${witnessId}`;
            
            console.log(`Witness tab clicked: ${witnessId}, reloading to page ${pageNumber}`);
            console.log(`Navigating to: ${newUrl}`);
            
            // Prevent default bootstrap tab behavior
            e.preventDefault();
            e.stopPropagation();
            
            // Update global currentWitness before reload
            window.currentWitness = witnessId;
            
            // Force reload with new URL
            window.location.href = newUrl;
            
            return false;
        }, true); // Use capturing phase to intercept before Bootstrap
    });
    
    // Also handle witness dropdown if present
    const witnessDropdown = document.getElementById('witness-select');
    if (witnessDropdown) {
        console.log('Setting up witness dropdown handler');
        witnessDropdown.addEventListener('change', function() {
            const selectedWitness = this.value;
            
            // Always use window.current_page_index for consistency
            const pageNumber = (window.current_page_index !== undefined ? window.current_page_index : 0) + 1;
            const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
            const newUrl = `${baseUrl}?tab=${pageNumber}${selectedWitness}`;
            
            console.log(`Witness dropdown changed to ${selectedWitness}, navigating to page ${pageNumber}`);
            
            // Update global currentWitness before reload
            window.currentWitness = selectedWitness;
            
            window.location.href = newUrl;
        });
    }
    
    console.log('Witness switcher initialized');
});

/**
 * Called when witness tabs are dynamically updated
 */
function refreshWitnessTabs() {
    // Re-initialize the click handlers after DOM changes
    const witnessTabs = document.querySelectorAll('.nav-tabs button[data-bs-toggle="tab"][id$="-tab"]');
    console.log(`Refreshing handlers for ${witnessTabs.length} witness tabs`);
    
    // Remove any existing click listeners first
    witnessTabs.forEach(tab => {
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
    });
    
    // Re-initialize
    document.dispatchEvent(new Event('DOMContentLoaded'));
}

// Expose for other scripts
window.refreshWitnessTabs = refreshWitnessTabs;

// Helper function to clean witness IDs (remove any prefix if needed)
function cleanWitnessId(witness, availableWitnesses) {
    if (!witness) return witness;
    
    // Generic check - if we have a witness ID with any prefix and the non-prefixed version exists
    // in the available witnesses, use the non-prefixed version
    if (availableWitnesses && availableWitnesses.size > 0) {
        for (const availableWitness of availableWitnesses) {
            if (witness !== availableWitness && witness.endsWith(availableWitness)) {
                return availableWitness;
            }
        }
    }
    
    return witness;
}