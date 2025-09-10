/*
##################################################################
get container holding the transcribed text
get container in which the osd viewer renders its div
##################################################################
*/
// string vars: input / cfg section

const OSD_container_spawnpoint_id = "OSD-container-spawnpoint";
const iiif_server_base_path =
  "https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/";
const iiif_attribs = "/full/max/0/default.jpg";
const page_break_marker_classname = "pb primary";
const page_break_marker_image_attribute = "source";
// Removed automatic scrolling thresholds and intersection observer options

// get relevant elements/values
const OSD_container_spawnpoint = document.getElementById(
  OSD_container_spawnpoint_id
);
// const transcript_container = document.getElementById(transcript_container_id)
const height = screen.height;

// helper functions
// iiif stuff
function get_iif_link(filename) {
  return `${iiif_server_base_path}${filename}${iiif_attribs}`;
}

function isVisible(el) {
  var style = window.getComputedStyle(el);
  return style.display !== "none";
}

function wrap_all_text_nodes(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while(node = walker.nextNode()) {
        if (node.textContent.trim() !== '') {
            textNodes.push(node);
        }
    }
    
    textNodes.forEach(textNode => {
        const wrapper = document.createElement('span');
        textNode.parentNode.insertBefore(wrapper, textNode);
        wrapper.appendChild(textNode);
    });
}

// Removed isInViewport function as it's no longer needed for automatic scrolling

// Removed debounce function as it's no longer needed for automatic scrolling

function navigate_prev() {
  const prev_index = current_page_index - 1;
  if (prev_index >= 0) {
    handle_new_image(prev_index);
    handle_page_visibility(prev_index);
  }
}

function navigate_next() {
  const next_index = current_page_index + 1;
  if (next_index <= max_index) {
    handle_new_image(next_index);
    handle_page_visibility(next_index);
  }
}

// URL hash handling for initial page setup
// No automatic scrolling - only content and image updates

function get_pb_sibling(element){
    let parent_childs = Array.from(element.parentElement.children);
    parent_childs = parent_childs.filter(c=>c.nodeType == 1 && c.classList.contains("pb") && c.classList.contains("primary"))
    if (parent_childs.length != 0){
      return parent_childs[0]
    }
    else {
      return undefined
    }
  }

function load_initial_image() {
  // Load the first image on startup
  if (viewer.world.getItemCount() > 1) {
    viewer.world.removeItem(viewer.world.getItemAt(1));
  }
  
  let initial_page_index = 0; // Always start with first page
  let first_pb_element_in_viewport = pb_elements_array[0];
  
  // Handle URL hash for specific page targeting
  if (window.location.hash) {
    let current_target_element = document.getElementById(
      window.location.hash.substring(1)
    );
    if (current_target_element) {
      target_el_parent = current_target_element.parentElement
      if (target_el_parent){
        first_pb_element_in_viewport = get_pb_sibling(target_el_parent)
      }
    }
    if (first_pb_element_in_viewport === undefined || first_pb_element_in_viewport === null){
      first_pb_element_in_viewport = pb_elements_array[0]
    }
    
    // Find the index of the target element
    if (first_pb_element_in_viewport) {
      initial_page_index = pb_elements_array.findIndex(el => el === first_pb_element_in_viewport);
      if (initial_page_index === -1) {
        initial_page_index = 0;
      }
    }
  }
  
  // Load the appropriate image and show its content
  handle_new_image(initial_page_index);
  handle_page_visibility(initial_page_index);
}

/*
##################################################################
get all image urls stored in span el class tei-xml-images
creates an array for osd viewer with static images
##################################################################
*/
var pb_elements = document.getElementsByClassName(page_break_marker_classname);
var pb_elements_array = Array.from(pb_elements);

// Expose functions for witness_switcher.js
window.show_only_current_page = show_only_current_page;
window.updateOsdScrollPageBreaks = (newPbElements) => {
  console.log('osd_scroll.js: Updating page breaks from witness switcher.', newPbElements);
  pb_elements_array = Array.from(newPbElements);
  max_index = pb_elements_array.length - 1;
};
window.getOsdScrollPbElements = () => pb_elements_array;


// Debug: Log all page break elements found
console.log('Total page break elements found:', pb_elements_array.length);
pb_elements_array.forEach((el, index) => {
  console.log(`Page break ${index}:`, el.getAttribute('source'), el);
});

// Debug: Check if the missing _d_ element exists with different classes
const editionText = document.getElementById('edition-text');
if (editionText) {
  const allSpansWithSource = editionText.querySelectorAll('span[source*="_d_"]');
  console.log('All spans with _d_ in source:', allSpansWithSource.length);
  allSpansWithSource.forEach((el, index) => {
    console.log(`_d_ span ${index}:`, el.getAttribute('source'), 'classes:', el.className, el);
  });
  
  // Also check for any pb elements regardless of classes
  const allPbElements = editionText.querySelectorAll('span.pb');
  console.log('All pb elements found:', allPbElements.length);
  const missingD = Array.from(allPbElements).find(el => el.getAttribute('source') && el.getAttribute('source').includes('_d_'));
  if (missingD) {
    console.log('Found _d_ pb element with classes:', missingD.className, missingD);
  } else {
    console.log('No _d_ pb element found at all');
  }
  
  // Check entire document for _d_ elements
  const allDElementsInDoc = document.querySelectorAll('*[source*="_d_"]');
  console.log('All _d_ elements in entire document:', allDElementsInDoc.length);
  allDElementsInDoc.forEach((el, index) => {
    console.log(`_d_ element ${index} in document:`, el.getAttribute('source'), 'classes:', el.className, 'parent:', el.parentElement?.id || 'no-id', el);
  });

  // Set up a mutation observer to watch for dynamically added _d_ elements
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          if (node.getAttribute && node.getAttribute('source') && node.getAttribute('source').includes('_d_')) {
            console.log('DYNAMIC: _d_ element added:', node.getAttribute('source'), 'classes:', node.className, node);
          }
          // Check children too
          const childDElements = node.querySelectorAll ? node.querySelectorAll('*[source*="_d_"]') : [];
          childDElements.forEach(child => {
            console.log('DYNAMIC: _d_ child element added:', child.getAttribute('source'), 'classes:', child.className, child);
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log('Mutation observer set up to watch for _d_ elements');
}

/*
##################################################################
initialize osd
##################################################################
*/

let initial_osd_visible = isVisible(OSD_container_spawnpoint);
if (initial_osd_visible) {
  OSD_container_spawnpoint.style.height = `${String(height / 1.5)}px`;
  OSD_container_spawnpoint.style.width = "auto";
}
var viewer = OpenSeadragon({
  id: OSD_container_spawnpoint_id,
  prefixUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.0.0/images/",
  sequenceMode: true,
  showNavigator: false,
  constrainDuringPan: true,
  visibilityRatio: 1,
  showNavigationControl: true,
  showSequenceControl: true,
});

// if anybody can explain to me, why I need that function
// even though I defined a callback in the image loader, removing the old
// image, I would be really happy or at least a little bit
viewer.world.addHandler("add-item", () => {
  while (viewer.world.getItemCount() > 1) {
    viewer.world.removeItem(viewer.world.getItemAt(0));
  }
});
/*
##################################################################
index and previous index for click navigation in osd viewer
locate index of anchor element
##################################################################
*/

// Track the current page index globally
var current_page_index = 0;
let max_index = pb_elements_array.length - 1;
var prev = document.querySelector("div[title='Previous page']");
var next = document.querySelector("div[title='Next page']");
prev.style.opacity = 1;
next.style.opacity = 1;
var last_img_url = ""

// Manual navigation with prev/next buttons only
function handle_new_image(page_index) {
  console.log(`🔄 IMAGE: handle_new_image(${page_index})`);
  
  if (page_index < 0 || page_index >= pb_elements_array.length) {
    console.log('❌ IMAGE: Invalid page index:', page_index);
    return;
  }
  
  console.log(`🔄 IMAGE: Setting current_page_index = ${page_index}`);
  current_page_index = page_index;
  const current_pb_element = pb_elements_array[page_index];
  
  new_image_url = get_iif_link(
    current_pb_element.getAttribute(
      page_break_marker_image_attribute
    )
  );
  console.log(`🔄 IMAGE: Loading image: ${new_image_url}`);
  
  old_image = viewer.world.getItemAt(0);
  load_new_image_with_check(new_image_url, old_image);
  
  // Update citation with correct page after image change
  console.log(`🔄 IMAGE: Updating citation for page ${page_index}`);
  updateCitationSuggestion(page_index);
}

// New function to handle page content visibility
function handle_page_visibility(page_index) {
  if (page_index < 0 || page_index >= pb_elements_array.length) {
    console.log('Invalid page index for visibility:', page_index);
    return;
  }
  
  current_page_index = page_index;
  // Hide all page content except current page
  show_only_current_page(page_index);
  // Update citation suggestion below footnotes
  updateCitationSuggestion(page_index);
}

// Generate and update citation suggestion below footnotes
function updateCitationSuggestion(page_index) {
  console.log(`🔍 CITATION: Updating citation for page_index=${page_index}, current_page_index=${current_page_index}`);
  
  // Find the main container and edition-text element
  const main = document.querySelector('main');
  const editionText = document.getElementById('edition-text');
  if (!main || !editionText) {
    console.log('❌ CITATION: Missing main or edition-text elements');
    return;
  }
  
  // Find the current pb element
  const pbEl = pb_elements_array[page_index];
  if (!pbEl) {
    console.log(`❌ CITATION: No pb element found for index ${page_index}`);
    return;
  }
  
  // Get page info for citation
  const pageNum = pbEl.getAttribute('data-page-number') || (page_index + 1);
  console.log(`📋 CITATION: Using page number ${pageNum} for citation`);
  
  // Get document title from <title> tag or fallback to filename
  let docTitle = '';
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent) {
    docTitle = h1.textContent.trim();
  } else if (document.title && document.title.trim() !== '') {
    docTitle = document.title.trim();
  } else {
    docTitle = window.location.pathname.split('/').pop().replace('.html', '');
  }
  
  // Generate URL with the current page number and witness
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  let currentWitness = getCurrentWitness();
  console.log(`🔍 CITATION: Current witness for URL: ${currentWitness}`);
  
  let pageUrlWithTab;
  
  if (currentWitness === 'primary') {
    pageUrlWithTab = `${baseUrl}?tab=${pageNum}primary`;
  } else {
    pageUrlWithTab = `${baseUrl}?tab=${pageNum}wm${currentWitness}`;
  }
  
  console.log(`🌐 CITATION: Generated URL: ${pageUrlWithTab}`);
  
  // Compose citation text with updated URL that includes the current page
  const citationText = `${docTitle}. In Claudia Resch. <em>Armesünderblätter Online</em>, 2025, S. ${pageNum}. <a href='${pageUrlWithTab}' target='_blank'>${pageUrlWithTab}</a>`;
  
  // Find the citation div (which is a direct child of main, not edition-text)
  let citationDiv = main.querySelector('div.citation');
  if (!citationDiv) {
    console.log('📋 CITATION: Citation div not found in main, creating it');
    citationDiv = document.createElement('div');
    citationDiv.className = 'citation';
    main.appendChild(citationDiv);
  }
  
  // Update the citation content and styling
  citationDiv.innerHTML = citationText;
  citationDiv.style.display = 'block'; // Ensure always visible
  citationDiv.style.marginTop = '1em';
  citationDiv.style.fontSize = 'small';
  citationDiv.style.color = 'grey';
  console.log(`✅ CITATION: Citation updated successfully`);
}

// Function to show only the content of the current page
function show_only_current_page(current_page_index) {
  console.log(`📃 PAGE: show_only_current_page(${current_page_index})`);
  
  const editionText = document.getElementById('edition-text');
  if (!editionText) {
    console.log('❌ PAGE: No edition-text element found');
    return;
  }
  if (pb_elements_array.length === 0) {
    console.log('❌ PAGE: No page break elements found');
    return;
  }

  // Hide all horizontal rules to prevent visual artifacts.
  editionText.querySelectorAll('hr').forEach(hr => hr.style.display = 'none');

  // Remove 'current' from all line break elements to reset the state.
  editionText.querySelectorAll('br.lb').forEach(br => br.classList.remove('current'));

  const currentPbElement = pb_elements_array[current_page_index];
  const nextPbElement = pb_elements_array[current_page_index + 1];

  if (!currentPbElement) {
    console.log('❌ PAGE: Current page element not found for index:', current_page_index);
    return;
  }

  console.log(`📃 PAGE: Showing page ${current_page_index + 1}, current pb:`, 
    currentPbElement.getAttribute('source') || 'no-source');

  // 1. Get all elements within edition-text in document order.
  const allElements = Array.from(editionText.querySelectorAll('*'));
  
  // 2. Find the start and end markers in the flat list.
  const startIndex = allElements.indexOf(currentPbElement);
  if (startIndex === -1) {
    console.error('❌ PAGE: Could not find the current page break element in the DOM.');
    return;
  }
  
  let endIndex = allElements.length;
  if (nextPbElement) {
    const nextPbIndex = allElements.indexOf(nextPbElement);
    if (nextPbIndex > startIndex) {
      endIndex = nextPbIndex;
      console.log(`📃 PAGE: Page boundary: elements ${startIndex} to ${endIndex - 1} (next page starts at ${endIndex})`);
    }
  } else {
    console.log(`📃 PAGE: Last page: elements ${startIndex} to end (${allElements.length})`);
  }

  // 3. Collect all elements for the current page and their ancestors.
  const elementsToShow = new Set();
  const elementsInRange = allElements.slice(startIndex, endIndex);

  console.log(`📃 PAGE: Elements in range for page ${current_page_index + 1}:`, elementsInRange.length);

  elementsInRange.forEach(element => {
    elementsToShow.add(element);
    // Add 'current' class to visible line breaks and mark split words.
    if (element.tagName === 'BR' && element.classList.contains('lb')) {
      element.classList.add('current');
      const parent = element.parentElement;
      if (parent && parent.classList.contains('token')) {
        const prevSibling = element.previousElementSibling;
        if (prevSibling && prevSibling.tagName === 'SPAN') {
          prevSibling.classList.add('split-word-part-1');
        }
      }
    }
    let parent = element.parentElement;
    // Traverse up the DOM tree to ensure all parent containers are also shown.
    while (parent && parent !== editionText) {
      elementsToShow.add(parent);
      parent = parent.parentElement;
    }
  });

  // 4. Apply visibility based on the collected set.
  let hiddenCount = 0;
  let shownCount = 0;
  allElements.forEach(element => {
    // No need to check for citation div here as it's not inside edition-text
    if (elementsToShow.has(element)) {
      element.style.cssText = ''; // Reset to default display style.
      element.classList.add('current-page');
      shownCount++;
    } else {
      element.style.cssText = 'display: none !important;';
      element.classList.remove('current-page');
      hiddenCount++;
    }
  });

  console.log(`📃 PAGE: Page ${current_page_index + 1}: ${shownCount} elements shown, ${hiddenCount} elements hidden`);
  
  // Update global current_page_index for tracking
  window.current_page_index = current_page_index;
  console.log(`📃 PAGE: Set window.current_page_index = ${current_page_index}`);
  
  // Make sure citation is updated with the correct page number
  console.log(`📃 PAGE: Calling updateCitationSuggestion(${current_page_index})`);
  updateCitationSuggestion(current_page_index);
}

function load_new_image_with_check(new_image_url, old_image) {
  if (last_img_url != new_image_url){
    last_img_url = new_image_url;
    viewer.addSimpleImage({
      url: new_image_url,
      success: function (event) {
        function ready() {
          if (viewer.world.getItemCount() > 1 && old_image) {
            viewer.world.removeItem(old_image);
          }
        }
        // test if item was loaded and trigger function to remove previous item
        if (event.item) {
          ready();
        } else {
          event.item.addOnceHandler("fully-loaded-change", ready());
        }
      },
    });
  }
}


// Removed intersection observer functionality for automatic scrolling
/*this function previously handled automatic scrolling via intersection observer
but has been removed to disable automatic scrolling behavior*/

/*
 Manual navigation only - no scrolling, just content updates
*/
prev.addEventListener("click", () => {
  navigate_prev();
});
next.addEventListener("click", () => {
  navigate_next();
});

// Keyboard navigation
document.addEventListener("keydown", (event) => {
  // Only handle navigation when not typing in an input field
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }
  
  switch(event.key) {
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault();
      navigate_prev();
      break;
      
    case 'ArrowRight':
    case 'ArrowDown':
    case ' ': // Spacebar
      event.preventDefault();
      navigate_next();
      break;
      
    case 'Home':
      event.preventDefault();
      if (pb_elements_array.length > 0) {
        handle_new_image(0);
        handle_page_visibility(0);
      }
      break;
      
    case 'End':
      event.preventDefault();
      if (pb_elements_array.length > 0) {
        const lastIndex = pb_elements_array.length - 1;
        handle_new_image(lastIndex);
        handle_page_visibility(lastIndex);
      }
      break;
  }
});

if (isVisible(OSD_container_spawnpoint)) {
  load_initial_image();
}

// Initialize the page to show only the first page content
function initializePageView() {
  // Wrap all loose text nodes in spans to make them targetable
  const editionText = document.getElementById('edition-text');
  if (editionText) {
    wrap_all_text_nodes(editionText);
  }
  // Show only the first page initially
  if (pb_elements_array.length > 0) {
    // Set initial state
    current_page_index = 0;
    show_only_current_page(0);
    updateCitationSuggestion(0);
  }
  
  // Initial update of the page links
  updatePageLinks();
}

// Make sure DOM is loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePageView);
} else {
  // Add a small delay to ensure everything is rendered
  setTimeout(initializePageView, 100);
}

// Update the page links based on the current witness
function updatePageLinks() {
  // Find the witness-pages container and the page links list
  const pageLinksContainer = document.querySelector('.witness-pages ul.page-links');
  if (!pageLinksContainer) return;
  
  // Get current witness and base URL
  let currentWitness = getCurrentWitness();
  const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
  
  // DESTROY the old list completely
  while (pageLinksContainer.firstChild) {
    pageLinksContainer.removeChild(pageLinksContainer.firstChild);
  }
  
  // Create new links
  pb_elements_array.forEach((pb, index) => {
    const pageNumber = index + 1;
    const listItem = document.createElement('li');
    listItem.className = 'list-inline-item';
    
    const link = document.createElement('a');
    link.className = 'page-link';
    // FIX: Use correct URL format for witness links
    if (currentWitness === 'primary') {
      // Primary witness format
      link.href = `${baseUrl}?tab=${pageNumber}primary`;
    } else {
      // Regular witness format with wm prefix
      link.href = `${baseUrl}?tab=${pageNumber}wm${currentWitness}`;
    }
    
    // Set correct data attributes
    link.setAttribute('data-witness', currentWitness);
    link.setAttribute('data-page-index', index);
    
    // Use lowercase letter for label
    link.textContent = String.fromCharCode(97 + index);
    
    // Add click handler to ensure text updates for single-witness documents
    link.addEventListener('click', function(e) {
      const pageIndex = parseInt(this.getAttribute('data-page-index'), 10);
      
      // Check if we're in a single-witness document
      const availableWitnesses = document.querySelectorAll('.tab-pane[id^="witness-"]').length;
      if (availableWitnesses <= 1 || window.witnessState === 'single') {
        e.preventDefault();
        
        // Update both facsimile and text
        handle_new_image(pageIndex);
        handle_page_visibility(pageIndex);
        
        // Update URL without page reload
        const newUrl = this.href;
        window.history.replaceState(null, '', newUrl);
        return false;
      }
      // For multi-witness docs, let the normal navigation handle it
    });
    
    listItem.appendChild(link);
    pageLinksContainer.appendChild(listItem);
  });
  
  // Mark the current page as active
  const currentPageLink = pageLinksContainer.querySelector(`[data-page-index="${current_page_index}"]`);
  if (currentPageLink) {
    currentPageLink.classList.add('active');
  }
  
  console.log(`Page links rebuilt for witness: ${currentWitness}`);
}

// Helper function to get the current witness
function getCurrentWitness() {
  console.log(`🔍 GET_WITNESS: Starting getCurrentWitness()`);
  
  // First check URL for witness information
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  console.log(`🔍 GET_WITNESS: URL tab parameter: "${tabParam}"`);
  
  if (tabParam && tabParam.includes('wm')) {
    const witness = tabParam.match(/wm([A-Za-z0-9]+)/);
    if (witness && witness[1]) {
      console.log(`✅ GET_WITNESS: Found witness ${witness[1]} in URL tab parameter`);
      return witness[1];
    }
  }
  
  // If window.currentWitness is set (by witness_switcher.js), use that
  if (window.currentWitness) {
    const cleanWitness = window.currentWitness.replace(/^wm/, '');
    console.log(`✅ GET_WITNESS: Using window.currentWitness: ${cleanWitness}`);
    return cleanWitness;
  }
  
  // If not in URL, check for active tab or other indicators
  const activeTab = document.querySelector('.tab-pane.active');
  if (activeTab && activeTab.id) {
    const witnessMatch = activeTab.id.match(/witness-(\w+)/);
    if (witnessMatch) {
      console.log(`✅ GET_WITNESS: Found witness ${witnessMatch[1]} from active tab`);
      return witnessMatch[1];
    }
  }
  
  // Check document attribute as a last resort
  const bodyWitness = document.body.getAttribute('data-active-witness');
  if (bodyWitness) {
    const cleanWitness = bodyWitness.replace(/^wm/, '');
    console.log(`✅ GET_WITNESS: Found witness ${cleanWitness} from body attribute`);
    return cleanWitness;
  }
  
  // Default to W if nothing else found
  console.log(`⚠️ GET_WITNESS: No witness found, defaulting to W`);
  return 'W';
}

// Expose the updatePageLinks function globally so witness_switcher.js can call it
window.updatePageLinks = updatePageLinks;

// Add a new method to set the active witness - update links when witness changes
function setActiveWitness(witness, pageBreaks) {
  console.log(`🔍 osd_scroll: Setting active witness to ${witness}`);
  
  // Store witness info
  window.currentWitness = witness;
  
  // Dispatch event
  document.dispatchEvent(new CustomEvent('osdScrollWitnessChanged', {
    detail: { witness, pageBreaks }
  }));
  
  // Update page links with new witness
  setTimeout(updatePageLinks, 100);
}

// Set up listeners for witness tab changes
function setupWitnessChangeListeners() {
  console.log("Setting up witness change listeners");
  
  // DIRECT APPROACH: Find and attach click handlers to all witness tabs
  const witnessTabLinks = document.querySelectorAll('.nav-tabs a[data-bs-toggle="tab"][href^="#witness-"]');
  console.log(`Found ${witnessTabLinks.length} witness tab links`);
  
  witnessTabLinks.forEach(tabLink => {
    tabLink.addEventListener('click', function(e) {
      // Get the witness code from the link
      const witnessId = this.getAttribute('href').replace('#witness-', '');
      console.log(`Direct tab click on witness: ${witnessId}`);
      
      // Get current page number (1-based)
      const pageNumber = current_page_index + 1;
      
      // Build URL and force reload - using current page number
      const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      let newUrl = `${baseUrl}?tab=${pageNumber}wm${witnessId}`;
      
      console.log(`RELOADING TO: ${newUrl}`);
      
      // Prevent default tab behavior
      e.preventDefault();
      e.stopPropagation();
      
      // Force reload with new URL
      window.location.replace(newUrl);
      return false;
    });
    console.log(`Added click handler to ${tabLink.getAttribute('href')}`);
  });
  
  // Keep the old handlers as backup with fix for preserving current page
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    if (target && 
        target.getAttribute && 
        target.getAttribute('data-bs-toggle') === 'tab' && 
        (target.getAttribute('href')?.startsWith('#witness-') || target.getAttribute('data-witness'))) {
      
      console.log('General click handler caught a tab click');
      
      // Extract witness code
      const witness = target.getAttribute('data-witness') || 
                     (target.getAttribute('href') ? target.getAttribute('href').replace('#witness-', '') : '');
      
      if (witness) {
        console.log(`Tab clicked for witness: ${witness}`);
        
        // Get current page number (1-based) - FIXED to use the global current_page_index
        const pageNumber = current_page_index + 1;
        
        // Construct URL with current page number
        const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
        let newUrl = (witness === 'primary') 
                    ? `${baseUrl}?tab=${pageNumber}primary` 
                    : `${baseUrl}?tab=${pageNumber}wm${witness}`;
        
        // Prevent default and force reload
        event.preventDefault();
        event.stopPropagation();
        
        console.log(`FORCE RELOADING to: ${newUrl}`);
        window.location.replace(newUrl);
        return false;
      }
    }
  }, true); // Use capturing phase for earlier interception
  
  // Witness dropdown handler with page preservation fix
  const witnessSelect = document.querySelector('#witness-select');
  if (witnessSelect) {
    witnessSelect.addEventListener('change', function() {
      const witness = this.value;
      console.log(`Dropdown changed to: ${witness}`);
      
      // Get page number and construct URL - FIXED to use current_page_index
      const pageNumber = current_page_index + 1;
      const baseUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      const newUrl = `${baseUrl}?tab=${pageNumber}wm${witness}`;
      
      console.log(`RELOADING TO: ${newUrl}`);
      window.location.replace(newUrl);
    });
    console.log('Added change handler to witness dropdown');
  }
}

// Call this function during initialization
document.addEventListener('DOMContentLoaded', setupWitnessChangeListeners);

// Replace the old updatePageLinkHrefs function
function updatePageLinkHrefs() {
  updatePageLinks();
}

// Add witness awareness to showPage method
function showPage(pageNumber) {
    // ...existing code...
    
    // Add this at the end of the method
    // Notify about the page change with witness info
    document.dispatchEvent(new CustomEvent('osdScrollPageChanged', {
        detail: { 
            pageIndex: pageNumber,
            witness: this.activeWitness || null
        }
    }));
    
    return true;
}