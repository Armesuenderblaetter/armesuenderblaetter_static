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
  if (page_index < 0 || page_index >= pb_elements_array.length) {
    console.log('Invalid page index:', page_index);
    return;
  }
  
  current_page_index = page_index;
  const current_pb_element = pb_elements_array[page_index];
  
  new_image_url = get_iif_link(
    current_pb_element.getAttribute(
      page_break_marker_image_attribute
    )
  );
  old_image = viewer.world.getItemAt(0);
  load_new_image_with_check(new_image_url, old_image);
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
  // Find the main container and edition-text element
  const main = document.querySelector('main');
  const editionText = document.getElementById('edition-text');
  if (!main || !editionText) return;
  
  // Find the current pb element
  const pbEl = pb_elements_array[page_index];
  if (!pbEl) return;
  
  // Get page info for citation
  const pageNum = pbEl.getAttribute('data-page-number') || (page_index + 1);
  
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
  
  // Get current page URL
  const pageUrl = window.location.href;
  
  // Compose citation text
  const citationText = `${docTitle}. In Claudia Resch. <em>Armesünderblätter Online</em>, 2025, S. ${pageNum}. <a href='${pageUrl}' target='_blank'>${pageUrl}</a>`;
  
  // Find the citation div (which is a direct child of main, not edition-text)
  let citationDiv = main.querySelector('div.citation');
  if (!citationDiv) {
    console.log('Citation div not found in main, creating it');
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
}

// Function to show only the content of the current page
function show_only_current_page(current_page_index) {
  const editionText = document.getElementById('edition-text');
  if (!editionText) {
    console.log('No edition-text element found');
    return;
  }
  if (pb_elements_array.length === 0) {
    console.log('No page break elements found');
    return;
  }

  // Hide all horizontal rules to prevent visual artifacts.
  editionText.querySelectorAll('hr').forEach(hr => hr.style.display = 'none');

  // Remove 'current' from all line break elements to reset the state.
  editionText.querySelectorAll('br.lb').forEach(br => br.classList.remove('current'));

  const currentPbElement = pb_elements_array[current_page_index];
  const nextPbElement = pb_elements_array[current_page_index + 1];

  if (!currentPbElement) {
    console.log('Current page element not found for index:', current_page_index);
    return;
  }

  console.log(`Showing page ${current_page_index + 1}, current pb:`, currentPbElement, 'next pb:', nextPbElement);

  // 1. Get all elements within edition-text in document order.
  const allElements = Array.from(editionText.querySelectorAll('*'));
  
  // 2. Find the start and end markers in the flat list.
  const startIndex = allElements.indexOf(currentPbElement);
  if (startIndex === -1) {
    console.error('Could not find the current page break element in the DOM.');
    return;
  }
  
  let endIndex = allElements.length;
  if (nextPbElement) {
    const nextPbIndex = allElements.indexOf(nextPbElement);
    if (nextPbIndex > startIndex) {
      endIndex = nextPbIndex;
      console.log(`Page boundary: elements ${startIndex} to ${endIndex - 1} (next page starts at ${endIndex})`);
    }
  } else {
    console.log(`Last page: elements ${startIndex} to end (${allElements.length})`);
  }

  // 3. Collect all elements for the current page and their ancestors.
  const elementsToShow = new Set();
  const elementsInRange = allElements.slice(startIndex, endIndex);

  console.log(`Elements in range for page ${current_page_index + 1}:`, elementsInRange.length);

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

  console.log(`Page ${current_page_index + 1}: ${shownCount} elements shown, ${hiddenCount} elements hidden`);
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
}

// Make sure DOM is loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePageView);
} else {
  // Add a small delay to ensure everything is rendered
  setTimeout(initializePageView, 100);
}

// Add a new method to set the active witness
function setActiveWitness(witness, pageBreaks)  {
  console.log(`🔍 osd_scroll: Setting active witness to ${witness}`);
    
    // Store the witness information
    this.activeWitness = witness;
    
    // Dispatch an event that other scripts can listen for
    document.dispatchEvent(new CustomEvent('osdScrollWitnessChanged', {
        detail: { witness, pageBreaks }
    }));
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
