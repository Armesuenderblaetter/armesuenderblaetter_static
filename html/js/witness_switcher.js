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
        
        // Store instance globally for minimal external access
        window.witnessSwitcherInstance = this;
        
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
//             console.log('🔍 DEBUG: Examining page break sources for witness identification');
            const pbElements = document.querySelectorAll('.pb[source]');
            
            if (!pbElements || pbElements.length === 0) {
//                 console.log('🔍 DEBUG: No page breaks with source attribute found');
                return;
            }
            
//             console.log(`🔍 DEBUG: Found ${pbElements.length} page breaks with source attribute`);
            
            // Check first few page breaks
            const samplesToShow = Math.min(pbElements.length, 5);
            for (let i = 0; i < samplesToShow; i++) {
                const pb = pbElements[i];
                const source = pb.getAttribute('source');
//                 console.log(`🔍 DEBUG: Page break ${i+1} source: "${source}"`);
                
                // Try to extract witness from source
                if (source) {
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        const lastPart = parts[parts.length - 1].split('.')[0];
//                         console.log(`🔍 DEBUG: Extracted potential witness ID: "${lastPart}" from source`);
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
                // Preselect witness from URL (tab param) as early as possible
                try {
                    const urlParams = new URLSearchParams(window.location.search);
                    const tab = urlParams.get('tab');
                    if (tab) {
                        const m = tab.match(/^\d+(.*)$/);
                        const preselected = (m && m[1]) ? m[1].trim() : null;
                        if (preselected) {
                            this.currentWitness = preselected;
                            window.currentWitness = preselected;
                            document.body.setAttribute('data-active-witness', preselected);
                            document.body.classList.add('witness-active');
                        }
                    }
                } catch (_) {}

                // Debug: Check for filename-based witness IDs in page breaks before anything else
                this.debugPageBreakSources();
                
                // Discover witnesses and set up mapping
                this.discoverWitnesses();
                this.setupWitnessToSuffixMapping();
                this.updateWitnessClassVisibilityStyles();
                
                console.log('🔄 INIT: Discovered witnesses:', Array.from(this.availableWitnesses));
                
                // Only proceed with multi-witness logic if there are actually multiple witnesses
                const isMultiWitness = this.availableWitnesses.size > 1;
                
                if (!isMultiWitness) {
                    console.log('🔄 INIT: Single witness document, skipping witness switcher setup');
                    // For single witness, just let osd_scroll.js handle everything
                    return;
                }
                
                // FORCE IMMEDIATE PAGINATION BUILD FOR ALL WITNESSES
                console.log('🔄 FORCE: Building paginations immediately for all witnesses');
                console.log('🔍 FORCE: Current available witnesses:', Array.from(this.availableWitnesses));
                this.availableWitnesses.forEach(witness => {
                    console.log(`🔄 FORCE: Building pagination for witness: ${witness}`);
                    console.log(`🔍 FORCE: Current this.currentWitness before build: "${this.currentWitness}"`);
                    this.buildPaginationForWitness(witness);
                    console.log(`🔍 FORCE: Current this.currentWitness after build: "${this.currentWitness}"`);
                });
                
                // Create necessary UI elements for witnesses - ONLY for multi-witness docs
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
                            }
                        }
                    });
                    
                    this.buildAllPaginations();
                    
                    // Now set default witness and refresh links
                    this.setDefaultWitness();
                    this.triggerPageLinksRefresh();
                    
                    // FORCE PAGINATION CREATION - if no pagination visible, create it aggressively
                    setTimeout(() => {
                        const visiblePagination = document.querySelector('.page-links');
                        if (!visiblePagination && this.currentWitness) {
                            console.log('🚨 No pagination visible, forcing creation for current witness:', this.currentWitness);
                            this.forceCreatePaginationContainer();
                            this.rebuildPaginationLinksForCurrentWitness();
                        }
                    }, 100);
                    
                    // Expose available witnesses for other scripts
                    window.witnessAvailableSet = this.availableWitnesses;
                    
                    // Expose a global function for osd_scroll.js to trigger pagination creation
                    window.createPaginationIfMissing = () => {
                        console.log('🔧 GLOBAL: createPaginationIfMissing called by osd_scroll');
                        if (this.currentWitness && !document.querySelector('.page-link')) {
                            console.log('🔧 GLOBAL: Creating pagination for current witness:', this.currentWitness);
                            this.rebuildPaginationLinksForCurrentWitness();
                            return true;
                        }
                        return false;
                    };
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
                console.warn(`⚠️ ${methodName} is not a function; skipping`);
            }
        } catch (e) {
            console.error(`❌ Error calling ${methodName}:`, e);
        }
        return undefined;
    }

    // Helper to refresh the page list links (delegates to osd_scroll.js)
    triggerPageLinksRefresh() {
        try {
//             console.log('🔄 REFRESH: Triggering page links refresh');
            
            // Debug: Check existing page links before refresh
            const allPageLinks = document.querySelectorAll('.page-links .page-link');
//             console.log(`🔍 REFRESH: Found ${allPageLinks.length} total .page-link elements before refresh`);
            
            // Witness-specific check
            if (this.currentWitness) {
                const witnessPageLinks = document.querySelectorAll(`#${this.currentWitness}-meta-data .page-links .page-link`);
//                 console.log(`🔍 REFRESH: Found ${witnessPageLinks.length} .page-link elements for current witness "${this.currentWitness}"`);
            }
            
            // DEBUG: Check what the links look like before calling updatePageLinks
//             console.log(`🔍 REFRESH DEBUG: Links before updatePageLinks():`);
            allPageLinks.forEach((link, idx) => {
//                 console.log(`  Before ${idx}: href="${link.href}", data-witness="${link.getAttribute('data-witness')}"`);
            });
            
            if (typeof window.updatePageLinks === 'function') {
                clearTimeout(this._linksRefreshTimer);
                this._linksRefreshTimer = setTimeout(() => {
                    setTimeout(() => {
                        const afterAllPageLinks = document.querySelectorAll('.page-links .page-link');
                        afterAllPageLinks.forEach((link, idx) => {
                        });
                        
                        if (this.currentWitness) {
                            const afterWitnessPageLinks = document.querySelectorAll(`#${this.currentWitness}-meta-data .page-links .page-link`);
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
            const safeQuerySelectorAll = (selector) => { try { return document.querySelectorAll(selector) || []; } catch { return []; } };
            
            // Check explicit witness attributes first
            const variantElements = safeQuerySelectorAll('[data-witness]');
            variantElements.forEach(el => { 
                const w = el.getAttribute('data-witness'); 
                if (w) {
                    this.availableWitnesses.add(w.trim());
                }
            });
            
            const pbDataWitness = safeQuerySelectorAll('.pb[data-witness]');
            pbDataWitness.forEach(el => { 
                const w = el.getAttribute('data-witness'); 
                if (w) {
                    this.availableWitnesses.add(w.trim());
                }
            });
            
            const pbWit = safeQuerySelectorAll('.pb[wit]');
            pbWit.forEach(el => { 
                const wit = el.getAttribute('wit'); 
                if (wit) { 
                    const w = wit.startsWith('#') ? wit.slice(1) : wit; 
                    if (w) {
                        this.availableWitnesses.add(w.trim());
                    }
                } 
            });
            
            // Check page break sources for FULL witness IDs in filenames - this is the primary method
            const pbs = safeQuerySelectorAll('.pb[source]');
            pbs.forEach(pb => { 
                const src = pb.getAttribute('source'); 
                if (src) { 
                    const parts = src.split('_'); 
                    if (parts.length >= 4) { 
                        const last = parts[parts.length - 1].split('.')[0]; 
                        if (last && last.length > 0) {
                            this.availableWitnesses.add(last.trim());
                        }
                    } 
                } 
            });
            
            // Remove empty strings
            if (this.availableWitnesses.has('')) this.availableWitnesses.delete('');
            
            // Add primary only if still none
            if (this.availableWitnesses.size === 0) {
                this.availableWitnesses.add('primary');
            }
            
            // If more than one witness, drop 'primary'
            if (this.availableWitnesses.size > 1 && this.availableWitnesses.has('primary')) {
                this.availableWitnesses.delete('primary');
            }
            
        } catch (e) { 
            console.error('❌ DISCOVER error', e); 
            if (this.availableWitnesses.size === 0) this.availableWitnesses.add('primary'); 
        }
    }

    /**
     * Set up mapping between witnesses and their page suffixes
     */
    setupWitnessToSuffixMapping() {

        // Map discovered witnesses to their suffix identifiers based on naming patterns
        this.availableWitnesses.forEach(witness => {
            // Simply use the first letter of the witness ID as a suffix by default
            const defaultSuffix = witness.charAt(0).toUpperCase();
            this.witnessToSuffixMap.set(witness, defaultSuffix);
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
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }
        
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
//             console.log(`🔍 GET_PBS: Finding page breaks for witness "${witness}"`);
//             console.log(`🔍 GET_PBS: this.currentWitness = "${this.currentWitness}"`);
            
            let witnessPbs = [];
            
            // For single-witness documents - if there's only one set of page breaks, use those
            const allPbs = Array.from(document.querySelectorAll('.pb[source]') || []);
//             console.log(`🔍 GET_PBS: Found ${allPbs.length} total page breaks with source attribute`);
            
            // DEBUG: Log all page break sources to understand what we're working with
//             console.log(`🔍 GET_PBS DEBUG: All page break sources:`);
            allPbs.forEach((pb, idx) => {
                const source = pb.getAttribute('source');
                const parts = source ? source.split('_') : [];
                const lastPart = parts.length >= 4 ? parts[parts.length - 1].split('.')[0] : 'N/A';
//                 console.log(`  ${idx}: "${source}" -> witness ID: "${lastPart}"`);
            });
            
            // 1. Most specific first: wit attribute matching exactly
            witnessPbs = Array.from(document.querySelectorAll(`.pb[wit="#${witness}"][source]`) || []);
            if (witnessPbs.length > 0) {
                return witnessPbs;
            }

            // 2. Try data-witness attribute
            witnessPbs = Array.from(document.querySelectorAll(`.pb[data-witness="${witness}"][source]`) || []);
            if (witnessPbs.length > 0) {
//                 console.log(`🔍 GET_PBS: Found ${witnessPbs.length} page breaks with data-witness="${witness}"`);
//                 console.log(`🔍 GET_PBS: Using data-witness="${witness}" page breaks for "${witness}"`);
                return witnessPbs;
            }

            // 3. Try matching against the filenames directly - exact match for full witness ID
            witnessPbs = allPbs.filter(pb => {
                const source = pb.getAttribute('source') || '';
                const parts = source.split('_');
                if (parts.length >= 4) {
                    const lastPart = parts[parts.length - 1].split('.')[0];
                    const isMatch = lastPart === witness;
                    if (isMatch) {
//                         console.log(`🔍 GET_PBS: Found exact match: "${source}" -> "${lastPart}" === "${witness}"`);
                    }
                    return isMatch;
                }
                return false;
            });
            if (witnessPbs.length > 0) {
//                 console.log(`🔍 GET_PBS: Found ${witnessPbs.length} page breaks with full witness ID "${witness}" in filename`);
//                 console.log(`🔍 GET_PBS: Using exact filename matches for "${witness}"`);
                witnessPbs.forEach((pb, idx) => {
//                     console.log(`  Match ${idx}: "${pb.getAttribute('source')}"`);
                });
                return witnessPbs;
            }

            // 4. If we're still empty and witness is short (like "R" or "W"), try matching by suffix
            if (witness.length <= 2) {
                witnessPbs = allPbs.filter(pb => {
                    const source = pb.getAttribute('source') || '';
                    const parts = source.split('_');
                    if (parts.length >= 4) {
                        const lastPart = parts[parts.length - 1].split('.')[0];
                        const isMatch = lastPart.endsWith(witness);
                        if (isMatch) {
//                             console.log(`🔍 GET_PBS: Found suffix match: "${source}" -> "${lastPart}" ends with "${witness}"`);
                        }
                        return isMatch;
                    }
                    return false;
                });
                if (witnessPbs.length > 0) {
//                     console.log(`🔍 GET_PBS: Found ${witnessPbs.length} page breaks with witness suffix "${witness}"`);
//                     console.log(`🔍 GET_PBS: Using suffix matches for "${witness}"`);
                    witnessPbs.forEach((pb, idx) => {
//                         console.log(`  Suffix Match ${idx}: "${pb.getAttribute('source')}"`);
                    });
                    return witnessPbs;
                }
            }

            // 5. If we're still empty, use any available pbs (for single witness documents)
            if (allPbs.length > 0) {
//                 console.log(`🔍 GET_PBS: Using all ${allPbs.length} available page breaks as fallback for single witness document`);
//                 console.log(`🔍 GET_PBS: FALLBACK WARNING - Using ALL page breaks for "${witness}" because no specific matches found!`);
                allPbs.forEach((pb, idx) => {
//                     console.log(`  Fallback ${idx}: "${pb.getAttribute('source')}"`);
                });
                return allPbs;
            }
            
//             console.log(`🔍 GET_PBS: Final result - using ${witnessPbs.length} page breaks for "${witness}"`);
            return witnessPbs;
        } catch (e) {
//             console.error('❌ getWitnessPbs error:', e);
            // Return any available page breaks as a last resort
            const anyPbs = Array.from(document.querySelectorAll('.pb[source]') || []);
//             console.log(`❌ GET_PBS: Error, falling back to ${anyPbs.length} available page breaks`);
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
//                 console.warn(`⚠️ No valid tile sources found for witness: ${witness}`);
                return;
            }

            // Update filteredPages to match pagination order
            this.filteredPages = (this.witnessPagesMap.get(witness) || []).map((e, i) => ({
                index: i,
                source: e.tileSource,
                filename: this.extractFilename(e.tileSource),
                witness
            }));

//             console.log(`🖼️ Built ${tileSources.length} tile sources for witness ${witness}`);
            this.loadFacsimilesIntoOSD(tileSources);
        } catch (e) {
//             console.error(`❌ Error updating OSD images for witness ${witness}:`, e);
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
                            this.syncTextWithPage(target);
                            this.updatePaginationActiveState(this.currentWitness, target);
                            this.pendingNavigation = null;
                            return;
                        }
                    }
                    if (typeof viewer.goToPage === 'function') {
                        viewer.goToPage(0);
                        this.syncTextWithPage(0);
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
//         console.log('🔄 Building paginations for all witnesses:', Array.from(this.availableWitnesses));
        this.availableWitnesses.forEach(witness => {
//             console.log(`🔄 Ensuring pagination for witness: ${witness}`);
            this.ensurePaginationForWitness(witness);
        });
        // After building all paginations, refresh links
        this.triggerPageLinksRefresh();
    }

    // Ensure pagination exists for a witness; build it once
    ensurePaginationForWitness(witness) {
        if (!this.witnessPagesMap.has(witness)) {
//             console.log(`🔄 Building pagination for witness "${witness}" as it doesn't exist yet`);
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
//                 console.log(`🔍 LABEL: Extracted page label "${pageIdentifier[1]}" from "${src}"`);
                return pageIdentifier[1];
            }
            
            // Try to extract a single letter (like a, b, c) which often represents page
            const letterIdentifier = src && src.match(/_([a-z])_/i);
            if (letterIdentifier && letterIdentifier[1]) {
//                 console.log(`🔍 LABEL: Extracted letter label "${letterIdentifier[1]}" from "${src}"`);
                return letterIdentifier[1];
            }
            
            // Fallback to the last chunk before extension
            const base = (src || '').split('/').pop() || '';
            const simpleName = base.replace(/\.[^.]+$/, '') || String(index + 1);
//             console.log(`🔍 LABEL: Using fallback label "${simpleName}" for "${src}"`);
            return simpleName;
        } catch (e) {
//             console.error(`❌ LABEL: Error deriving label from "${src}":`, e);
            return String(index + 1);
        }
    }

    // Build pagination UI and data for one witness
    buildPaginationForWitness(witness) {
        try {
            // Store data for ALL witnesses, but only build UI for current witness
            const pbs = this.getWitnessPbs(witness);
            if (!pbs || pbs.length === 0) {
                return;
            }
            
            // Create entries from page breaks  
            const entries = pbs.map((pb, idx) => {
                const src = pb.getAttribute('source');
                const tileSource = src && src.startsWith('http')
                    ? src
                    : `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`;
                const label = this.deriveLabelFromSource(src, idx, pb);
                return { index: idx, tileSource, label, source: src, pb };
            });
            
            // Store the entries for later use
            this.witnessPagesMap.set(witness, entries);
            console.log(`✅ PAGINATION: Stored ${entries.length} entries for witness "${witness}"`);
            console.log(`🔍 PAGINATION: Entry details:`, entries.map(e => ({index: e.index, source: e.source})));
            
            // Only build UI if this is the current witness
            if (this.currentWitness === witness) {
                console.log(`🔄 PAGINATION: Building UI for current witness "${witness}"`);
                this.rebuildPaginationLinksForCurrentWitness();
            } else {
                console.log(`⏭️ PAGINATION: Skipping UI build for "${witness}" (current is "${this.currentWitness}")`);
            }
            
        } catch (e) {
//             console.error(`❌ PAGINATION: Error building pagination for "${witness}":`, e);
        }
    }
    
    // Rebuild pagination links for the current witness only
    rebuildPaginationLinksForCurrentWitness() {
        if (!this.currentWitness) {
            console.log('🔄 UI: No currentWitness set, skipping pagination rebuild');
            return;
        }
        
        console.log(`🔄 UI: Rebuilding pagination links for current witness "${this.currentWitness}"`);
        
        // Find the pagination container (prefer right-column pagination panes if present)
        let witnessPages = null;
        
        // Try witness-specific PAGINATION container first (in right column)
        const paginationContainer = document.getElementById(`${this.currentWitness}-pagination`);
        const hasDedicatedPaginationArea = !!paginationContainer || !!document.querySelector('.edition-pagination-header');
        if (paginationContainer) {
            witnessPages = paginationContainer.querySelector('.witness-pages');
            console.log('🔍 UI: Found existing .witness-pages in pagination container:', witnessPages);
        }
        
        // Fallback to meta-data container ONLY when there is no dedicated pagination area.
        // Otherwise we end up injecting page-links into the left column witness meta-data tabs.
        if (!witnessPages && !hasDedicatedPaginationArea) {
            const tabContent = document.getElementById(`${this.currentWitness}-meta-data`);
            if (tabContent) {
                witnessPages = tabContent.querySelector('.witness-pages');
                console.log('🔍 UI: Found existing .witness-pages in meta-data tab:', witnessPages);
                console.log('🔍 UI: Existing content:', witnessPages ? witnessPages.innerHTML : 'N/A');
                // If the witness tab exists but has no pagination container, create it there
                if (!witnessPages) {
                    try {
                        witnessPages = document.createElement('div');
                        witnessPages.className = 'witness-pages mt-3';
                        tabContent.appendChild(witnessPages);
                    } catch(_) {}
                }
            }
        }
        
        // Only fall back to global if witness-specific doesn't exist
        if (!witnessPages) {
            witnessPages = document.querySelector('.witness-pages');
        }

        // As a last resort, if no container exists at all, create a global one
        if (!witnessPages) {
            try {
                const tabContentGlobal = document.querySelector('div.tab-content');
                const parent = tabContentGlobal || document.querySelector('main') || document.body;
                witnessPages = document.createElement('div');
                witnessPages.className = 'witness-pages mt-3';
                parent.appendChild(witnessPages);
            } catch(_) {}
        }
        
        if (!witnessPages) {
            console.error(`❌ UI: No .witness-pages container found for "${this.currentWitness}"`);
            console.log(`🔍 UI: Available tab content elements:`, Array.from(document.querySelectorAll('[id$="-meta-data"]')).map(el => el.id));
            return;
        }
        
        console.log(`✅ UI: Found .witness-pages container for "${this.currentWitness}"`);
        console.log(`🔍 UI: Container parent:`, witnessPages.parentElement?.tagName, witnessPages.parentElement?.id);
        console.log(`🔍 UI: Container visibility:`, getComputedStyle(witnessPages).display, getComputedStyle(witnessPages).visibility);
        
        // Stamp container with its witness for clarity (non-breaking)
        try { witnessPages.setAttribute('data-witness', this.currentWitness); } catch(_) {}

        // Remove legacy headings so layout stays compact
        const legacyHeading = witnessPages.querySelector('h5');
        if (legacyHeading) {
            console.log('� UI: Removing legacy heading element to avoid duplicate labels');
            try { legacyHeading.remove(); } catch(_) {}
        }

        const ensureNav = () => {
            let nav = witnessPages.querySelector('nav.witness-pagination');
            if (!nav) {
                nav = document.createElement('nav');
                nav.className = 'witness-pagination ais-Pagination';
                witnessPages.appendChild(nav);
            }
            return nav;
        };

        let ul = witnessPages.querySelector('.page-links');
        console.log('🔍 UI: Found existing .page-links:', ul);
        if (ul) {
            console.log('🔍 UI: Existing .page-links content:', ul.innerHTML);
            console.log('🔍 UI: Existing .page-links children count:', ul.children.length);
        }
        if (!ul) {
            try {
                console.log(`🔧 UI: Creating .page-links for "${this.currentWitness}"`);
                const nav = ensureNav();
                ul = document.createElement('ul');
                ul.className = 'page-links ais-Pagination-list';
                nav.appendChild(ul);
            } catch(_) {}
        }
        if (!ul) { 
            console.error(`❌ UI: Failed to create .page-links for "${this.currentWitness}"`);
            return; 
        }

        console.log(`✅ UI: Found .page-links container for "${this.currentWitness}"`);
        
        // Get entries for current witness
        const entries = this.witnessPagesMap.get(this.currentWitness) || [];
        console.log(`🔍 UI: Found ${entries.length} entries for witness "${this.currentWitness}"`);

        let isInternalUpdate = false;

        const attachUlObserver = () => {
            if (!ul) {
                return;
            }

            if (ul._linksPersistenceObserver) {
                try { ul._linksPersistenceObserver.disconnect(); } catch (_) {}
                delete ul._linksPersistenceObserver;
            }

            try {
                const observer = new MutationObserver(mutations => {
                    if (isInternalUpdate) {
                        return;
                    }

                    const childListChange = mutations.some(m => m.type === 'childList');
                    if (!childListChange) {
                        return;
                    }

                    if (!ul || ul.children.length === 0) {
                        console.warn('⚠️ UI: Pagination links were cleared externally (UL mutation); rebuilding.');
                        handleExternalReset();
                    }
                });

                observer.observe(ul, { childList: true });
                ul._linksPersistenceObserver = observer;
            } catch (e) {
                console.error('❌ UI: Failed to attach UL persistence observer:', e);
            }
        };

        const handleExternalReset = () => {
            if (isInternalUpdate) {
                return;
            }

            if (!document.body.contains(witnessPages)) {
                return;
            }

            let currentUl = witnessPages.querySelector('.page-links');
            if (!currentUl) {
                try {
                    const nav = ensureNav();
                    currentUl = document.createElement('ul');
                    currentUl.className = 'page-links ais-Pagination-list';
                    nav.appendChild(currentUl);
                    console.warn('⚠️ UI: Recreated missing .page-links container before repopulating.');
                } catch (creationError) {
                    console.error('❌ UI: Could not recreate .page-links container during reset:', creationError);
                    return;
                }
            }

            ul = currentUl;
            populateLinks();
            attachUlObserver();
        };

        const ensureContainerObserver = () => {
            if (!witnessPages) {
                return;
            }

            if (witnessPages._linksContainerObserver) {
                try { witnessPages._linksContainerObserver.disconnect(); } catch (_) {}
                delete witnessPages._linksContainerObserver;
            }

            try {
                const observer = new MutationObserver(mutations => {
                    if (isInternalUpdate) {
                        return;
                    }

                    const childListChange = mutations.some(m => m.type === 'childList');
                    if (!childListChange) {
                        return;
                    }

                    const currentUl = witnessPages.querySelector('.page-links');
                    if (!currentUl || currentUl.children.length === 0) {
                        console.warn('⚠️ UI: Pagination container was reset externally; rebuilding.');
                        handleExternalReset();
                    }
                });

                observer.observe(witnessPages, { childList: true });
                witnessPages._linksContainerObserver = observer;
            } catch (e) {
                console.error('❌ UI: Failed to attach container persistence observer:', e);
            }
        };

        const populateLinks = () => {
            if (!ul) {
                return;
            }

            isInternalUpdate = true;
            try {
                ul.innerHTML = '';
                console.log(`🔧 UI: About to build ${entries.length} links...`);

                const currentIndex = (typeof window.current_page_index === 'number')
                    ? Math.min(Math.max(window.current_page_index, 0), Math.max(entries.length - 1, 0))
                    : 0;

                const buildHref = (pageIndex) => {
                    const pageNumber = pageIndex + 1;
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', `${pageNumber}${this.currentWitness}`);
                    return url.toString();
                };

                const addControl = (typeClass, targetIndex, text, ariaLabel) => {
                    const li = document.createElement('li');
                    li.className = `ais-Pagination-item ${typeClass}`;
                    const isDisabled = targetIndex === null;
                    if (isDisabled) {
                        li.classList.add('ais-Pagination-item--disabled');
                        const span = document.createElement('span');
                        span.className = 'ais-Pagination-link';
                        span.textContent = text;
                        li.appendChild(span);
                    } else {
                        const a = document.createElement('a');
                        a.className = 'ais-Pagination-link page-link';
                        a.textContent = text;
                        if (ariaLabel) a.setAttribute('aria-label', ariaLabel);
                        a.href = buildHref(targetIndex);
                        a.setAttribute('data-witness', this.currentWitness);
                        a.setAttribute('data-page-index', String(targetIndex));
                        // Don't prevent default - let the link navigate and reload the page
                        li.appendChild(a);
                    }
                    ul.appendChild(li);
                };

                const total = entries.length;
                if (total === 0) {
                    return;
                }

                // Only page number buttons - no first/prev/next/last controls

                entries.forEach((entry, idx) => {
                    if (idx < 3) console.log(`🔧 UI: Building link ${idx + 1} for entry:`, { index: entry.index, source: entry.source });
                    const li = document.createElement('li');
                    li.className = 'ais-Pagination-item ais-Pagination-item--page';
                    if (idx === currentIndex) {
                        li.classList.add('ais-Pagination-item--selected');
                    }
                    const a = document.createElement('a');

                    const pageNumber = entry.index + 1;
                    a.href = buildHref(entry.index);

                    a.className = 'ais-Pagination-link page-link';
                    a.textContent = pageNumber;
                    a.setAttribute('aria-label', String(pageNumber));
                    a.setAttribute('data-witness', this.currentWitness);
                    a.setAttribute('data-page-index', String(entry.index));
                    if (idx === currentIndex) {
                        a.classList.add('active');
                        a.setAttribute('aria-current', 'page');
                    }

                    // Don't prevent default - let the link navigate and reload the page

                    li.appendChild(a);
                    ul.appendChild(li);
                });

                // No next/last controls

                console.log(`✅ UI: Built ${entries.length} pagination links for current witness "${this.currentWitness}"`);
                console.log(`🔍 UI: ul.children.length after build:`, ul.children.length);
                console.log(`🔍 UI: First 3 links HTML:`, Array.from(ul.children).slice(0, 3).map(li => li.outerHTML));
            } finally {
                isInternalUpdate = false;
            }
        };

        populateLinks();
        attachUlObserver();
        ensureContainerObserver();

        // Guard against external scripts wiping the links immediately after render
        setTimeout(() => {
            if (!isInternalUpdate && entries.length > 0 && (!ul || ul.children.length === 0)) {
                console.warn('⚠️ UI: Pagination links were cleared externally; rebuilding once more.');
                handleExternalReset();
            }
        }, 50);
        
        // After creating pagination links, trigger osd_scroll to update them
        setTimeout(() => {
            if (typeof window.updatePageLinks === 'function') {
                console.log('🔧 UI: Calling osd_scroll updatePageLinks after creation');
                window.updatePageLinks();
            }
        }, 10);
    }

    // Navigate to a specific page in a witness (switch if needed)
    goToWitnessPage(witness, index) {
        if (this.currentWitness !== witness) {
            // If switching witness, let switchToWitness handle the initial text update.
            // It will use pendingNavigation if set, or default to page 0.
            this.scheduleNavigation(witness, index);
            this.switchToWitness(witness);
        } else {
            // Ensure OSD sources are aligned with the active witness.
            this.scheduleNavigation(witness, index);
            this.updateTextForWitness(witness);
            this.updateTabStates(witness);
            this.updateOSDImagesForWitness(witness);
            // If witness is already active, just navigate to the page.
            this.navigateViewerToIndex(index);
        }
        window.current_page_index = index;
        this.updatePaginationActiveState(witness, index);
        this.updateBrowserState(witness, index);
        this.rebuildPaginationLinksForCurrentWitness();
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
            // Try witness-specific PAGINATION container first (right column)
            let container = document.querySelector(`#${witness}-pagination .witness-pages`);
            
            // Fallback to meta-data container
            if (!container) {
                container = document.querySelector(`#${witness}-meta-data .witness-pages`);
            }
            
            // If not found, use global .witness-pages for single witness documents
            if (!container) {
                container = document.querySelector('.witness-pages');
            }
            
            if (!container) return;
            
            container.querySelectorAll('.page-link').forEach(a => {
                a.classList.remove('active');
                a.removeAttribute('aria-current');
                const parent = a.closest('.ais-Pagination-item');
                if (parent) parent.classList.remove('ais-Pagination-item--selected');
            });
            const current = container.querySelector(`.page-link[data-page-index="${pageIndex}"]`);
            if (current) {
                current.classList.add('active');
                current.setAttribute('aria-current', 'page');
                const parent = current.closest('.ais-Pagination-item');
                if (parent) parent.classList.add('ais-Pagination-item--selected');
            }
        } catch (e) {
            // console.error('❌ updatePaginationActiveState error:', e);
        }
    }

    /**
     * Switch to a specific witness - SIMPLIFIED VERSION
     */
    switchToWitness(witness) {
        console.log(`🔄 SWITCH: Switching to witness: ${witness}`);
        
        // UPDATE: Set the current witness variable FIRST (both local and global)
        this.currentWitness = witness;
        window.currentWitness = witness;
        
        // Add witness-active class to body
        document.body.classList.add('witness-active');
        document.body.setAttribute('data-active-witness', witness);
        
        // UPDATE: Rebuild pagination links for the new current witness
        this.rebuildPaginationLinksForCurrentWitness();
        
        // Update text display
        this.updateTextForWitness(witness);        // Make sure pagination exists and load images
        this.ensurePaginationForWitness(witness);
        this.updateOSDImagesForWitness(witness);

        // Update tab states
        this.updateTabStates(witness);

        // Ensure witness-class visibility rules cover all known witnesses
        this.updateWitnessClassVisibilityStyles();

//         console.log(`✅ SWITCH: Finished switching to witness: ${witness}`);
    }
    
    /**
     * Set the default witness based on URL parameters or fallback
     */
    setDefaultWitness() {
        console.log('🔍 DEFAULT: Setting default witness (simplified)');
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        console.log('🔍 DEFAULT: tab parameter =', tab);
        if (tab) {
            const m = tab.match(/^(\d+)(.*)$/);
            let pageIndex = -1; 
            let witness = tab;
            
            if (m) { 
                pageIndex = Math.max(0, parseInt(m[1],10)-1); 
                witness = m[2]; 
            } else {
                // No page number in tab. Check hash for page index.
                if (window.location.hash) {
                     try {
                        const targetId = window.location.hash.substring(1);
                        const targetEl = document.getElementById(targetId);
                        if (targetEl && window.getOsdScrollPbElements) {
                             const pbs = window.getOsdScrollPbElements();
                             let bestPbIndex = 0;
                             for (let i = 0; i < pbs.length; i++) {
                                 const pb = pbs[i];
                                 // Check if targetEl follows pb
                                 if (pb.compareDocumentPosition(targetEl) & Node.DOCUMENT_POSITION_FOLLOWING) {
                                     bestPbIndex = i;
                                 } else {
                                     // Once we find a pb that is AFTER the target, or target is inside it (unlikely for empty pb),
                                     // we stop. The previous one was the correct page.
                                     // But wait, if target is inside the page content following pb[i], 
                                     // then pb[i] is before target.
                                     // If pb[i+1] is after target, then target is on page i.
                                     // So we just keep updating bestPbIndex as long as pb is before target.
                                 }
                             }
                             pageIndex = bestPbIndex;
                             console.log('🔍 DEFAULT: Detected page index from hash:', pageIndex);
                        }
                     } catch (e) {
                         console.error('Error detecting page from hash:', e);
                     }
                }
                if (pageIndex === -1) pageIndex = 0;
            }

            console.log('🔍 DEFAULT: parsed pageIndex =', pageIndex, 'witness =', witness);
            console.log('🔍 DEFAULT: Available witnesses:', Array.from(this.availableWitnesses));
            if (!this.availableWitnesses.has(witness)) {
                console.log('🔍 DEFAULT: witness not available, falling back. Available:', Array.from(this.availableWitnesses));
                // fallback first real witness (avoid 'primary' if others)
                const ordered = Array.from(this.availableWitnesses).filter(w=>w!=='primary');
                witness = ordered[0] || 'primary';
            }
            console.log('🔍 DEFAULT: final witness =', witness, 'pageIndex =', pageIndex);
            console.log('🔍 DEFAULT: About to call goToWitnessPage...');
            this.goToWitnessPage(witness, pageIndex);
            return;
        }
        // No tab param: choose first non-primary witness, else primary
        const ordered = Array.from(this.availableWitnesses).filter(w=>w!=='primary');
        const chosen = ordered[0] || 'primary';
        console.log('🔍 DEFAULT: no tab param, chosen =', chosen);
        this.goToWitnessPage(chosen, 0);
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
                // Don't set inline styles - let showOnlyCurrentPage handle visibility
                pb.classList.add('active-witness-pb');
            });

            // Also show primary pbs if no specific witness pages found
            if (witnessPbs.length === 0) {
                document.querySelectorAll('.pb[data-pb-type="primary"]').forEach(pb => {
                    // Don't set inline styles - let showOnlyCurrentPage handle visibility
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

            // Keep the OSD image in sync with the selected witness/page.
            if (typeof window.handle_new_image === 'function') {
                window.handle_new_image(pageToShow);
            }
            
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
     * Shows/hides variant readings and line breaks based on the selected witness
     */
    applyWitnessVariants(witness) {
        // Hide all variant readings
        document.querySelectorAll('.variant-reading').forEach(variant => {
            variant.classList.remove('active-witness');
        });

        // Show only variants for the current witness
        document.querySelectorAll(`.variant-reading[data-witness="${witness}"]`)
            .forEach(variant => variant.classList.add('active-witness'));
        
        // Filter line breaks (lb) by witness
        const normalizeWitness = (value) => value ? value.replace(/^#/, '') : value;
        const normalizedWitness = normalizeWitness(witness);
        document.querySelectorAll('br.lb').forEach(lb => {
            const wit = normalizeWitness(lb.getAttribute('wit'));
            const dataWitness = normalizeWitness(lb.getAttribute('data-witness'));
            const ancestorWitness = normalizeWitness(lb.closest('[data-witness]')?.getAttribute('data-witness'));
            let shouldShow = true;

            if (wit) {
                shouldShow = wit === 'primary' || wit === normalizedWitness;
            } else if (dataWitness) {
                shouldShow = dataWitness === normalizedWitness;
            } else if (ancestorWitness) {
                shouldShow = ancestorWitness === normalizedWitness;
            }

            if (shouldShow) {
                lb.classList.remove('lb-hidden');
            } else {
                lb.classList.add('lb-hidden');
            }
        });
    }

    /**
     * Build CSS rules to hide other-witness classes for any active witness.
     */
    updateWitnessClassVisibilityStyles() {
        try {
            const witnesses = Array.from(this.availableWitnesses).filter(w => w && w !== 'primary');
            if (witnesses.length === 0) return;

            const styleId = 'witness-class-visibility';
            let styleEl = document.getElementById(styleId);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = styleId;
                document.head.appendChild(styleEl);
            }

            const escapeIdent = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
            const rules = [];

            witnesses.forEach(active => {
                const activeEsc = escapeIdent(active);
                witnesses.forEach(other => {
                    if (other === active) return;
                    const otherEsc = escapeIdent(other);
                    rules.push(
                        `body[data-active-witness="${activeEsc}"] .${otherEsc}, ` +
                        `body[data-active-witness="${activeEsc}"] [class~="${otherEsc}"] { display: none !important; }`
                    );
                });
            });

            styleEl.textContent = rules.join('\n');
        } catch (e) {
            // console.error('❌ updateWitnessClassVisibilityStyles error:', e);
        }
    }

    /**
     * Synchronize text display with current OSD page
     */
    syncTextWithPage(pageIndex) {
        try {
            const entries = this.witnessPagesMap.get(this.currentWitness) || [];
            if (entries.length === 0 || pageIndex >= entries.length) {
                // Fallback to osd_scroll.js directly if entries are missing/out of bounds
                if (typeof window.show_only_current_page === 'function') {
                    window.show_only_current_page(pageIndex);
                    this.updatePaginationActiveState(this.currentWitness, pageIndex);
                }
                this.applyWitnessVariants(this.currentWitness);
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
//             console.log('🔄 TABS: Setting up tab event listeners');
            
            // Handle dynamically discovered witnesses
            this.availableWitnesses.forEach(witness => {
                try {
                    const tabElement = document.getElementById(`${witness}-tab`);
                    if (tabElement) {
                        tabElement.addEventListener('click', (event) => {
                            event.preventDefault();
                            
                            // Get current page index from global variable
                            const pageIndex = window.current_page_index || 0;
//                             console.log(`📑 TABS: ${witness} tab clicked, page index: ${pageIndex}`);
                            
                            // Use goToWitnessPage instead of switchToWitness to preserve page
                            this.goToWitnessPage(witness, pageIndex);
                        });
//                         console.log(`✅ TABS: Added click listener for ${witness} tab`);
                    } else {
//                         console.log(`⚠️ TABS: Tab element for ${witness} not found`);
                    }
                } catch (e) {
//                     console.error(`❌ TABS: Error setting up tab for ${witness}:`, e);
                }
            });
            
//             console.log('✅ TABS: Tab event listeners setup complete');
        } catch (e) {
//             console.error('❌ TABS: Error setting up tab event listeners:', e);
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
            // IMPORTANT: Scope tab state updates. Do not touch unrelated tabs/panes.

            // --- Left column: witness meta-data tabs ---
            const metaTabs = document.getElementById('witness_overview');
            if (metaTabs) {
                metaTabs.querySelectorAll('.nav-link').forEach(tab => {
                    tab.classList.remove('active');
                    try {
                        tab.setAttribute('aria-selected', 'false');
                        tab.setAttribute('tabindex', '-1');
                    } catch (_) {}
                });

                const metaSection = metaTabs.closest('.witness-metadata-section');
                const metaContent = metaSection ? metaSection.querySelector('.tab-content') : null;
                if (metaContent) {
                    metaContent.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
                }

                const activeMetaTab = document.getElementById(`${witness}-tab`);
                if (activeMetaTab) {
                    activeMetaTab.classList.add('active');
                    try {
                        activeMetaTab.setAttribute('aria-selected', 'true');
                        activeMetaTab.removeAttribute('tabindex');
                    } catch (_) {}
                }

                const activeMetaPane = document.getElementById(`${witness}-meta-data`);
                if (activeMetaPane) {
                    activeMetaPane.classList.add('show', 'active');
                }
            }

            // --- Right column: witness pagination tabs (if present) ---
            const paginationTabs = document.getElementById('witness_pagination_tabs');
            if (paginationTabs) {
                paginationTabs.querySelectorAll('.nav-link').forEach(tab => {
                    tab.classList.remove('active');
                    try {
                        tab.setAttribute('aria-selected', 'false');
                        tab.setAttribute('tabindex', '-1');
                    } catch (_) {}
                });

                const paginationContainer = paginationTabs.closest('.witness-pagination-container');
                const paginationContent = paginationContainer ? paginationContainer.querySelector('.tab-content') : null;
                if (paginationContent) {
                    paginationContent.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
                }

                const activePaginationTab = document.getElementById(`${witness}-pagination-tab`);
                if (activePaginationTab) {
                    activePaginationTab.classList.add('active');
                    try {
                        activePaginationTab.setAttribute('aria-selected', 'true');
                        activePaginationTab.removeAttribute('tabindex');
                    } catch (_) {}
                }

                const activePaginationPane = document.getElementById(`${witness}-pagination`);
                if (activePaginationPane) {
                    activePaginationPane.classList.add('show', 'active');
                }
            }
        } catch (e) {
            console.error('❌ Error updating tab states:', e);
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
            console.error('❌ Error updating browser state:', e);
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
            if (!tabsContainer) return;
            const multiple = witnessIds.size > 1 || this.availableWitnesses.size > 1;
            witnessIds.forEach(witnessId => {
                if (!witnessId) return;
                if (witnessId === 'primary' && multiple) return; // skip primary when others exist
                if (document.getElementById(`${witnessId}-tab`)) return;
                const li = document.createElement('li'); li.className = 'nav-item';
                const button = document.createElement('button');
                button.className = 'nav-link';
                button.id = `${witnessId}-tab`;
                button.setAttribute('data-bs-toggle','tab');
                button.setAttribute('data-bs-target', `#${witnessId}-meta-data`);
                button.setAttribute('type','button'); button.setAttribute('role','tab');
                button.setAttribute('aria-controls', `${witnessId}`); button.setAttribute('aria-selected','false');
                button.textContent = (multiple ? witnessId : this.getDisplayNameForWitness(witnessId));
                li.appendChild(button); tabsContainer.appendChild(li);
                const contentContainer = document.querySelector('div.tab-content'); if (!contentContainer) return;
                const tabPane = document.createElement('div'); tabPane.className='tab-pane fade'; tabPane.id = `${witnessId}-meta-data`;
                tabPane.setAttribute('role','tabpanel'); tabPane.setAttribute('aria-labelledby', `${witnessId}-tab`);
                const witnessPages = document.createElement('div'); witnessPages.className='witness-pages mt-3';
                const nav = document.createElement('nav'); nav.className = 'witness-pagination ais-Pagination'; witnessPages.appendChild(nav);
                const pageLinks = document.createElement('ul'); pageLinks.className='page-links ais-Pagination-list'; nav.appendChild(pageLinks);
                tabPane.appendChild(witnessPages); contentContainer.appendChild(tabPane);
            });
        } catch(e) { console.error('❌ createWitnessTabs error', e); }
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
//                             console.log(`🔍 Found better display name "${lastPart}" for primary witness`);
                            return lastPart.toUpperCase();
                        }
                    }
                }
            }
        }
        
        // Standard case: just convert to uppercase for consistent display
        return witnessId.toUpperCase();
    }

    // Force create pagination container when nothing is visible
    forceCreatePaginationContainer() {
        try {
            console.log('🚨 FORCE: Creating pagination container from scratch');
            
            // Find or create a suitable parent
            let parent = document.querySelector('main') || document.querySelector('.container') || document.body;
            
            // Create a visible container
            const container = document.createElement('div');
            container.className = 'witness-pages mt-3';
            container.style.cssText = 'display: block !important; visibility: visible !important; padding: 20px; border: 1px solid #ccc; background: #f9f9f9;';
            
            const nav = document.createElement('nav');
            nav.className = 'witness-pagination ais-Pagination';
            nav.style.cssText = 'display:block !important;';
            container.appendChild(nav);

            const ul = document.createElement('ul');
            ul.className = 'page-links ais-Pagination-list';
            ul.style.cssText = 'display: block !important; list-style: none; margin: 0; padding: 0;';
            nav.appendChild(ul);
            
            parent.appendChild(container);
            
            console.log('🚨 FORCE: Created pagination container in:', parent.tagName);
            return container;
        } catch (e) {
            console.error('🚨 FORCE: Error creating pagination container:', e);
            return null;
        }
    }
}

// Initialize the witness switcher when the class is instantiated
new WitnessSwitcher();

// Keep the initial one-time refresh
if (window.updatePageLinks) window.updatePageLinks();

// Highlight search terms passed via ?mark= query parameter
function getMarkSearchTerms() {
    try {
        const params = new URLSearchParams(window.location.search);
        const rawMark = params.get('mark');
        if (!rawMark) return [];
        return rawMark
            .split(/\s+/)
            .map(term => term.trim())
            .filter(term => term.length > 1);
    } catch (_) {
        return [];
    }
}

function clearExistingHighlights(container) {
    const existing = container.querySelectorAll('span.mark-highlight');
    existing.forEach(span => {
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
    });
}

function highlightTerm(container, term) {
    if (!term) return;
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!safeTerm) return;
    const regex = new RegExp(safeTerm, 'gi');
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const targets = [];
    let node;
    while ((node = walker.nextNode())) {
        if (node.parentElement && node.parentElement.closest('.pb')) {
            // Skip page break tokens to avoid corrupting markup
            continue;
        }
        if (regex.test(node.textContent)) {
            targets.push(node);
        }
        regex.lastIndex = 0;
    }

    targets.forEach(textNode => {
        const originalText = textNode.textContent;
        if (!originalText) return;
        regex.lastIndex = 0;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(originalText)) !== null) {
            const before = originalText.slice(lastIndex, match.index);
            if (before) fragment.appendChild(document.createTextNode(before));
            const markSpan = document.createElement('span');
            markSpan.className = 'mark-highlight';
            markSpan.textContent = match[0];
            fragment.appendChild(markSpan);
            lastIndex = match.index + match[0].length;
        }
        const after = originalText.slice(lastIndex);
        if (after) fragment.appendChild(document.createTextNode(after));
        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

function scrollToFirstHighlight(container) {
    const firstHighlight = container.querySelector('.mark-highlight');
    if (!firstHighlight) return;
    const rect = firstHighlight.getBoundingClientRect();
    const offsetTop = rect.top + window.scrollY;
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.offsetHeight : 0;
    window.scrollTo({
        top: Math.max(0, offsetTop - navbarHeight - 40),
        behavior: 'smooth'
    });
}

function applySearchHighlights() {
    const terms = getMarkSearchTerms();
    if (terms.length === 0) return;
    const editionText = document.getElementById('edition-text') || document.querySelector('main');
    if (!editionText) return;
    clearExistingHighlights(editionText);
    terms.forEach(term => highlightTerm(editionText, term));
    scrollToFirstHighlight(editionText);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(applySearchHighlights, 400);
});

// Expose a function for osd_scroll.js to call when no pagination exists
window.createPaginationIfMissing = function() {
    const getTabWitness = () => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (!tab) {
            return '';
        }
        return tab.replace(/^\d+/, '');
    };

    const extractWitnessFromSource = (source) => {
        if (!source || typeof source !== 'string') {
            return '';
        }
        const filename = source.split('/').pop() || '';
        const base = filename.replace(/\.[^.]+$/, '');
        if (!base) {
            return '';
        }
        const parts = base.split('_').filter(Boolean);
        if (!parts.length) {
            return '';
        }
        const candidate = parts[parts.length - 1];
        if (candidate.length <= 8) {
            return candidate;
        }
        const hyphenChunk = candidate.split('-').pop() || '';
        return hyphenChunk.length <= 8 ? hyphenChunk : '';
    };

    const pageLinks = document.querySelectorAll('.page-link');
    if (pageLinks.length === 0) {
        // Trigger pagination creation with a small delay
        setTimeout(() => {
            // Try witness switcher instance first (for multi-witness docs)
            const witnessInstance = window.witnessSwitcherInstance;
            if (witnessInstance && witnessInstance.rebuildPaginationLinksForCurrentWitness && witnessInstance.currentWitness) {
                witnessInstance.rebuildPaginationLinksForCurrentWitness();
                return;
            }
            
            // For single-witness documents, create pagination directly
            const pbElements = document.querySelectorAll('.pb.primary[source]');
            if (pbElements.length === 0) {
                console.log('createPaginationIfMissing: No page breaks found');
                return;
            }
            
            // Find the page-links container
            let ul = document.querySelector('.page-links');
            if (!ul) {
                // Try to find or create the container
                const witnessPages = document.querySelector('.witness-pages');
                if (witnessPages) {
                    let nav = witnessPages.querySelector('nav.witness-pagination');
                    if (!nav) {
                        nav = document.createElement('nav');
                        nav.className = 'witness-pagination ais-Pagination';
                        witnessPages.appendChild(nav);
                    }
                    ul = document.createElement('ul');
                    ul.className = 'page-links ais-Pagination-list';
                    nav.appendChild(ul);
                }
            }
            
            if (!ul) {
                console.log('createPaginationIfMissing: No .page-links container found');
                return;
            }
            
            // Clear existing content
            ul.innerHTML = '';
            
            // Build pagination links for each page break
            pbElements.forEach((pb, idx) => {
                const li = document.createElement('li');
                li.className = 'ais-Pagination-item ais-Pagination-item--page';
                if (idx === 0) {
                    li.classList.add('ais-Pagination-item--selected');
                }
                
                const a = document.createElement('a');
                const pageNumber = idx + 1;
                const witness = getTabWitness() || extractWitnessFromSource(pb.getAttribute('source'));
                if (witness) {
                    const linkUrl = new URL(window.location.href);
                    linkUrl.searchParams.set('tab', `${pageNumber}${witness}`);
                    a.href = linkUrl.toString();
                } else {
                    a.href = '#';
                }
                a.className = 'ais-Pagination-link page-link';
                a.textContent = pageNumber;
                a.setAttribute('aria-label', String(pageNumber));
                a.setAttribute('data-page-index', String(idx));
                if (idx === 0) {
                    a.classList.add('active');
                    a.setAttribute('aria-current', 'page');
                }
                
                // Add click handler for navigation
                a.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    const pageNumber = idx + 1;
                    const witness = getTabWitness() || extractWitnessFromSource(pb.getAttribute('source'));
                    if (witness) {
                        const newUrl = new URL(window.location.href);
                        newUrl.searchParams.set('tab', `${pageNumber}${witness}`);
                        window.history.replaceState(null, '', newUrl.toString());
                    }
                    
                    if (typeof window.show_only_current_page === 'function') {
                        if (typeof window.handle_new_image === 'function') {
                            window.handle_new_image(idx);
                        }
                        if (typeof window.handle_page_visibility === 'function') {
                            window.handle_page_visibility(idx);
                        } else {
                            window.show_only_current_page(idx);
                        }
                    }
                    // Update active state
                    ul.querySelectorAll('.page-link').forEach(link => {
                        link.classList.remove('active');
                        link.removeAttribute('aria-current');
                        link.closest('li')?.classList.remove('ais-Pagination-item--selected');
                    });
                    a.classList.add('active');
                    a.setAttribute('aria-current', 'page');
                    li.classList.add('ais-Pagination-item--selected');
                });
                
                li.appendChild(a);
                ul.appendChild(li);
            });
            
            console.log('createPaginationIfMissing: Created', pbElements.length, 'pagination links for single-witness document');
        }, 100);
        return true; // Indicate pagination creation was attempted
    }
    return false; // No pagination needed
};

/**
 * Simple Witness Switcher - Immediately reloads page when witness tabs are clicked
 */
document.addEventListener('DOMContentLoaded', function() {
//     console.log('🔍 Simple Witness Switcher initializing...');
    
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
//                         console.log(`📋 Identified witness ID from source: "${lastPart}"`);
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
//                 console.log(`📋 Identified witness ID from data-witness: "${witness}"`);
            }
        });
        
        // If no witnesses found, use ID from existing tabs
        if (availableWitnesses.size === 0) {
            const tabs = document.querySelectorAll('button[data-bs-toggle="tab"][id$="-tab"]');
            tabs.forEach(tab => {
                const witnessId = tab.id.replace('-tab', '');
                if (witnessId && witnessId !== 'persons') {
                    availableWitnesses.add(witnessId);
//                     console.log(`📋 Identified witness ID from tab ID: "${witnessId}"`);
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
//                             console.log(`📋 Identified witness ID from image src: "${lastPart}"`);
                        }
                    }
                }
            });
            
            // If still nothing, use a generic default
            if (availableWitnesses.size === 0) {
//                 console.log(`📋 No witnesses found, using default "doc" witness ID`);
                availableWitnesses.add('doc');
            }
        }
        
        return availableWitnesses;
    };
    
    // Store available witnesses for global access
    window.witnessAvailableSet = getAvailableWitnesses();
//     console.log('📋 Available witnesses:', Array.from(window.witnessAvailableSet));
    
    // Generic handler for all witness tabs using event delegation
    document.addEventListener('click', function(e) {
        // Find closest tab button - handle both direct clicks and bubbled events
        const tabButton = e.target.closest('button[data-bs-toggle="tab"]');
        
        if (!tabButton) return;
        
        // Check if it's a witness tab (not persons tab)
        if (tabButton.id && tabButton.id.endsWith('-tab')) {
            const witnessId = tabButton.id.replace('-tab', '');
            if (witnessId === 'persons') return; // Skip persons tab
            
//             console.log('🎯 Witness tab clicked:', tabButton.id);
            
            // Prevent default and reload
            e.preventDefault();
            e.stopPropagation();
            reloadPageWithWitness(witnessId);
            return false;
        }
    }, true); // Use capturing to get event before Bootstrap
    
//     console.log('✅ Simple Witness Switcher initialized');
});

/**
 * Reload the page with a new witness parameter, preserving current page number
 */
function reloadPageWithWitness(witness) {
//     console.log(`🔄 RELOAD: Starting reloadPageWithWitness("${witness}")`);
    
    // Get current page from global variable or URL or default to 1
    let currentPage = 1;
    
    // FIRST PRIORITY: Use window.current_page_index which is set by osd_scroll.js
    if (typeof window.current_page_index === 'number') {
        currentPage = window.current_page_index + 1; // Convert from 0-based to 1-based
//         console.log(`📄 RELOAD: Got page ${currentPage} from window.current_page_index`);
    }
    // Second priority: Try getting directly from the OSD viewer
    else if (window.viewer && typeof window.viewer.currentPage === 'function') {
        currentPage = window.viewer.currentPage() + 1; // Convert from 0-based to 1-based
//         console.log(`📄 RELOAD: Got page ${currentPage} from OSD viewer.currentPage()`);
    }
    // Third priority: Try the manuscriptViewer global object
    else if (window.manuscriptViewer && typeof window.manuscriptViewer.currentIndex === 'number') {
        currentPage = window.manuscriptViewer.currentIndex + 1; // Convert from 0-based to 1-based
//         console.log(`📄 RELOAD: Got page ${currentPage} from manuscriptViewer.currentIndex`);
    }
    // Last resort: Parse from URL
    else {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            const match = tab.match(/^(\d+)/);
            if (match && match[1]) {
                currentPage = parseInt(match[1], 10);
//                 console.log(`📄 RELOAD: Got page ${currentPage} from URL tab parameter`);
            }
        } else {
//             console.log('⚠️ RELOAD: No page information found, defaulting to page 1');
        }
    }
    
    // Validate the page number
    if (isNaN(currentPage) || currentPage < 1) {
//         console.log('⚠️ RELOAD: Invalid page number, defaulting to page 1');
        currentPage = 1;
    }
    
    // Get the FULL witness ID from the available witnesses set
    let fullWitnessId = witness;
    if (window.witnessAvailableSet && window.witnessAvailableSet.size > 0) {
        // Look for a witness ID that ends with our short witnessId or exact match
        for (const availableWitness of window.witnessAvailableSet) {
            if (availableWitness === witness) {
                fullWitnessId = witness;
                break;
            }
            if (availableWitness.endsWith(witness) && availableWitness.length > witness.length) {
                fullWitnessId = availableWitness;
                break;
            }
        }
    }
    
    // Build the new URL with the FULL witness ID
    const url = new URL(window.location.href);
    url.searchParams.set('tab', `${currentPage}${fullWitnessId}`);
    const newUrl = url.toString();
    

    
    // Update the citation before navigation if available
    if (typeof window.updateCitationSuggestion === 'function') {
        const citationPageIndex = currentPage - 1; // Convert back to 0-based for citation
        
        // Force current witness to be updated to ensure citation has correct witness
        window.currentWitness = fullWitnessId;
        
        try {
            window.updateCitationSuggestion(citationPageIndex);
        } catch (e) {
            console.error(`❌ RELOAD: Error updating citation: ${e}`);
        }
    } else {
        console.log(`⚠️ RELOAD: window.updateCitationSuggestion is not available`);
    }
    
    // Store the target page and witness in localStorage for persistence
    try {
        const state = {
            pageIndex: currentPage - 1, // Store as 0-based index
            witness: fullWitnessId
        };
        localStorage.setItem('lastWitnessState', JSON.stringify(state));
    } catch (e) {
         console.error(`❌ RELOAD: Error saving state to localStorage: ${e}`);
    }
    
    // Force a complete page reload
    window.location.href = newUrl;
}

// Export function for global use
window.reloadPageWithWitness = reloadPageWithWitness;

/**
 * Witness Switcher - Handles switching between witness tabs with proper page reloading
 */
document.addEventListener('DOMContentLoaded', function() {
//     console.log('Witness switcher initializing...');
    
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
//                                 console.log(`📋 Added witness from source: "${lastPart}"`);
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
//                     console.log(`📋 Added witness from data-witness: "${witness}"`);
                }
            });
            
//             console.log('📋 Available witnesses for URL handling:', Array.from(window.witnessAvailableSet));
        }
    } catch (e) {
//         console.error('❌ Error setting up witness available set:', e);
    }
    
    // Find witness *metadata* tab buttons (left column) only.
    // IMPORTANT: do not match pagination tabs (right column) like "wmW-pagination-tab",
    // otherwise we break Bootstrap's tab switching and pagination visibility.
    const witnessTabs = document.querySelectorAll(
        '#witness_overview button[data-bs-toggle="tab"][data-bs-target$="-meta-data"][id$="-tab"]'
    );
    const validWitnessTabs = Array.from(witnessTabs).filter(tab => !tab.id.startsWith('persons-'));
//     console.log(`Found ${validWitnessTabs.length} witness tabs`);
    
    // Add click handlers to each tab
    validWitnessTabs.forEach(tab => {
        // Get the witness ID from the tab's ID or target
        const witnessId = tab.id.replace('-tab', '') || 
                         tab.getAttribute('data-bs-target')?.replace('#', '').replace('-meta-data', '');
        
        if (!witnessId) return;
        
//         console.log(`Setting up click handler for ${witnessId} tab`);
        
        // Replace Bootstrap's event handler with our own
        tab.addEventListener('click', function(e) {
            // Get current page index from OSD (0-based)
            const pageIndex = window.current_page_index || 0;
            // Convert to 1-based for URL
            const pageNumber = pageIndex + 1;
            
            // Get base URL without parameters
            
            // Get the FULL witness ID from the available witnesses set or extract from filename
            let fullWitnessId = witnessId;
            if (window.witnessAvailableSet && window.witnessAvailableSet.size > 0) {
                // Look for a witness ID that ends with our short witnessId
                for (const availableWitness of window.witnessAvailableSet) {
                    if (availableWitness.endsWith(witnessId) && availableWitness.length > witnessId.length) {
                        fullWitnessId = availableWitness;
//                         console.log(`🔍 Found full witness ID "${fullWitnessId}" for short ID "${witnessId}"`);
                        break;
                    }
                    // Or exact match
                    if (availableWitness === witnessId) {
                        fullWitnessId = witnessId;
                        break;
                    }
                }
            }
            
            // Create URL with the new witness and current page - use FULL witness ID
            const url = new URL(window.location.href);
            url.searchParams.set('tab', `${pageNumber}${fullWitnessId}`);
            const newUrl = url.toString();
            
//             console.log(`Witness tab clicked: ${witnessId} (full: ${fullWitnessId}), reloading to page ${pageNumber}`);
//             console.log(`Navigating to: ${newUrl}`);
            
            // Prevent default bootstrap tab behavior
            e.preventDefault();
            e.stopPropagation();
            
            // Update global currentWitness before reload
            window.currentWitness = fullWitnessId;
            
            // Force reload with new URL
            window.location.href = newUrl;
            
            return false;
        }, true); // Use capturing phase to intercept before Bootstrap
    });
    
    // Also handle witness dropdown if present
    const witnessDropdown = document.getElementById('witness-select');
    if (witnessDropdown) {
//         console.log('Setting up witness dropdown handler');
        witnessDropdown.addEventListener('change', function() {
            const selectedWitness = this.value;
            
            // Always use window.current_page_index for consistency
            const pageNumber = (window.current_page_index !== undefined ? window.current_page_index : 0) + 1;
            const url = new URL(window.location.href);
            url.searchParams.set('tab', `${pageNumber}${selectedWitness}`);
            const newUrl = url.toString();
            
//             console.log(`Witness dropdown changed to ${selectedWitness}, navigating to page ${pageNumber}`);
            
            // Update global currentWitness before reload
            window.currentWitness = selectedWitness;
            
            window.location.href = newUrl;
        });
    }
    
//     console.log('Witness switcher initialized');
});

/**
 * Called when witness tabs are dynamically updated
 */
function refreshWitnessTabs() {
    // Re-initialize the click handlers after DOM changes
    const witnessTabs = document.querySelectorAll(
        '#witness_overview button[data-bs-toggle="tab"][data-bs-target$="-meta-data"][id$="-tab"]'
    );
//     console.log(`Refreshing handlers for ${witnessTabs.length} witness tabs`);
    
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

// Initialize the witness switcher when the DOM is ready (removed duplicate)
// new WitnessSwitcher();