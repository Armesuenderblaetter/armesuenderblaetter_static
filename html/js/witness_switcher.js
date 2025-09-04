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
                // Safely call optional hooks to avoid init crashes if not present
                this.safeCall('setupTabEventListeners');
                this.safeCall('setupVariantClickListeners');

                // Build pagination for each witness (populates UL.page-links inside tabs)
                this.buildAllPaginations();

                this.setDefaultWitness(); // now respects ?tab=...
                console.log('🔄 Enhanced Witness Switcher initialized');
                console.log('📋 Available witnesses:', Array.from(this.availableWitnesses));
                console.log('🗺️ Witness to suffix mapping:', this.witnessToSuffixMap);
            } catch (e) {
                console.error('❌ Error during witness switcher initialization:', e);
            }
        }, 100);
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
            'onb': 'R',     // Alternative ONB abbreviation
            'wmw': 'W',    // Specific for wmW
            'wmr': 'R'     // Specific for wmR
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
                        if (this.osdViewer.viewer) {
                            this.osdViewer.viewer.addHandler('page', (event) => {
                                try {
                                    console.log(`📄 OSD page changed to: ${event.page}`);
                                    this.syncTextWithPage(event.page);
                                    if (this.currentWitness) {
                                        this.updatePaginationActiveState(this.currentWitness, event.page);
                                    }
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

    // Helper to find pb elements for a witness (shared by pagination + OSD update)
    getWitnessPbs(witness) {
        try {
            const witnessSuffix = this.witnessToSuffixMap.get(witness) || (witness === 'wmW' ? 'W' : witness === 'wmR' ? 'R' : '');
            let witnessPbs = [];

            // Most specific first: wit attribute
            witnessPbs = Array.from(document.querySelectorAll(`.pb[wit="#${witness}"][source]`) || []);

            if (witnessPbs.length === 0) {
                witnessPbs = Array.from(document.querySelectorAll(`.pb[data-witness="${witness}"][source]`) || []);
            }

            if (witnessPbs.length === 0 && (witness === 'wmW' || witness === 'wmR')) {
                const suffix = witness === 'wmW' ? 'W' : 'R';
                const selector = `.pb[source*="_${suffix}"]`;
                witnessPbs = Array.from(document.querySelectorAll(selector) || []);
            }

            if (witnessPbs.length === 0 && witnessSuffix) {
                const allPbs = Array.from(document.querySelectorAll('.pb[source]') || []);
                witnessPbs = allPbs.filter(pb => {
                    const src = pb.getAttribute('source') || '';
                    return src.includes(`_${witnessSuffix}`) || src.includes(`${witnessSuffix}_`);
                });
            }
            if (witnessPbs.length === 0) {
                if (witness === 'wmW' || witnessSuffix === 'W') {
                    witnessPbs = Array.from(document.querySelectorAll('.pb[source*="_W"], .pb[source*="W_"]') || []);
                } else if (witness === 'wmR' || witnessSuffix === 'R') {
                    witnessPbs = Array.from(document.querySelectorAll('.pb[source*="_R"], .pb[source*="R_"]') || []);
                }
            }
            return witnessPbs;
        } catch (e) {
            console.error('❌ getWitnessPbs error:', e);
            return [];
        }
    }

    /**
     * Update OSD viewer images for a specific witness with defensive coding
     */
    updateOSDImagesForWitness(witness) {
        console.log(`🔍 Finding facsimile images for witness: ${witness}`);
        try {
            // Prefer pages derived from DOM (keeps order in sync with pagination)
            this.ensurePaginationForWitness(witness);
            const entries = this.witnessPagesMap.get(witness) || [];

            let tileSources = entries.map(e => e.tileSource);

            // Fallback to legacy discovery if none found
            if (tileSources.length === 0) {
                const witnessPbs = this.getWitnessPbs(witness);
                if (!witnessPbs || witnessPbs.length === 0) {
                    console.warn(`⚠️ No pb elements found. Using hard-coded fallbacks for ${witness}`);
                    if (witness === 'wmW') {
                        return this.loadFallbackSources('W');
                    } else if (witness === 'wmR') {
                        return this.loadFallbackSources('R');
                    }
                    return;
                }

                tileSources = witnessPbs.map(pb => {
                    const src = pb.getAttribute('source');
                    if (!src) return null;
                    return src.startsWith('http')
                        ? src
                        : `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`;
                }).filter(Boolean);
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
                    console.error('❌ Error applying pending navigation:', e);
                }
            };

            if (typeof viewer.addOnceHandler === 'function') {
                viewer.addOnceHandler('open', applyPending);
            } else {
                setTimeout(applyPending, 300);
            }
        } catch (e) {
            console.error('❌ Error loading facsimiles:', e);
        }
    }

    // Build pagination for all discovered witnesses
    buildAllPaginations() {
        this.availableWitnesses.forEach(witness => this.ensurePaginationForWitness(witness));
    }

    // Ensure pagination exists for a witness; build it once
    ensurePaginationForWitness(witness) {
        if (this.witnessPagesMap.has(witness)) return;
        this.buildPaginationForWitness(witness);
    }

    // Derive a short page label from @n or source filename
    deriveLabelFromSource(src, index, pbEl) {
        const n = pbEl && pbEl.getAttribute ? pbEl.getAttribute('n') : null;
        if (n) return n;
        try {
            // Try pattern "..._a_wmW.jp2" -> "a"
            const m = src && src.match(/_([a-zA-Z0-9]+)_wm/i);
            if (m && m[1]) return m[1];
            // Fallback to the last chunk before extension
            const base = (src || '').split('/').pop() || '';
            return base.replace(/\.[^.]+$/, '') || String(index + 1);
        } catch (_) {
            return String(index + 1);
        }
    }

    // Build pagination UI and data for one witness
    buildPaginationForWitness(witness) {
        try {
            const ul = document.querySelector(`#${witness}-meta-data .witness-pages .page-links`);
            if (!ul) return;

            const pbs = this.getWitnessPbs(witness);
            if (!pbs || pbs.length === 0) return;

            // Clear container
            ul.innerHTML = '';

            const entries = pbs.map((pb, idx) => {
                const src = pb.getAttribute('source');
                const tileSource = src && src.startsWith('http')
                    ? src
                    : `https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/${src}/info.json`;
                const label = this.deriveLabelFromSource(src, idx, pb);
                return { index: idx, tileSource, label, source: src, pb };
            });

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
            });

            this.witnessPagesMap.set(witness, entries);
        } catch (e) {
            console.error(`❌ Error building pagination for ${witness}:`, e);
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
            console.error('❌ navigateViewerToIndex error:', e);
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
            console.error('❌ updatePaginationActiveState error:', e);
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

        // Make sure pagination exists before loading images, then load images
        this.ensurePaginationForWitness(witness);
        this.updateOSDImagesForWitness(witness);

        // Update tab states
        this.updateTabStates(witness);

        // Do NOT update browser state here, as it might lack page context.
        // It's handled by goToWitnessPage or after pending navigation is resolved.

        console.log(`✅ Finished switching to witness: ${witness}`);
    }
    
    /**
     * Set the default witness based on URL parameters or fallback
     */
    setDefaultWitness() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        if (tab) {
            // Parse for page number prefix, e.g., "3wmR" -> witness "wmR", page 3
            const match = tab.match(/^(\d+)(.*)$/);
            let witness = tab;
            let pageIndex = 0;

            if (match) {
                pageIndex = Math.max(0, parseInt(match[1], 10) - 1); // 0-based
                witness = match[2];
                this.pendingNavigation = { witness, index: pageIndex };
                console.log(`📌 URL parameter parsed: page ${pageIndex + 1} of witness ${witness}`);
            }

            const fallbackWitness = this.availableWitnesses.has('wmW') ? 'wmW' : Array.from(this.availableWitnesses)[0];
            const targetWitness = this.availableWitnesses.has(witness) ? witness : fallbackWitness;
            
            if (targetWitness) {
                // Use goToWitnessPage to handle the initial state
                this.goToWitnessPage(targetWitness, pageIndex);
            }
        } else {
            const defaultWitness = this.availableWitnesses.has('wmW') ? 'wmW' : Array.from(this.availableWitnesses)[0];
            if (defaultWitness) {
                this.goToWitnessPage(defaultWitness, 0);
            }
        }
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

            console.log(`📝 Text updated for witness: ${witness}`);
        } catch (e) {
            console.error(`❌ Error updating text for witness ${witness}:`, e);
        }
    }

    /**
     * Shows/hides variant readings based on the selected witness.
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
                console.warn(`⚠️ syncTextWithPage: pageIndex ${pageIndex} is out of bounds for witness ${this.currentWitness} (max: ${entries.length - 1})`);
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
            console.error(`❌ Error syncing text with page ${pageIndex}:`, e);
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
                    console.warn('displayTextForPage: pbElement not found in osd_scroll.js page breaks.');
                }
            } else {
                console.error('displayTextForPage: show_only_current_page or getOsdScrollPbElements is not available.');
            }

            try {
                pbElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (_) {}
        } catch (e) {
            console.error('❌ displayTextForPage error:', e);
        }
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
            console.error('❌ Error updating tab states:', e);
        }
    }

    /**
     * Update the browser state (URL) with the current witness
     */
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
        }
    }

    /**
     * Schedule navigation for later application
     */
    scheduleNavigation(witness, index) {
        this.pendingNavigation = { witness, index };
    }
}

// Initialize the witness switcher when the class is instantiated
new WitnessSwitcher();