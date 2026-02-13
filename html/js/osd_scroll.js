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
const iiif_info_suffix = "/info.json";
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

function get_iiif_info_url(filename) {
  return `${iiif_server_base_path}${filename}${iiif_info_suffix}`;
}

function isVisible(el) {
  var style = window.getComputedStyle(el);
  return style.display !== "none";
}

function wrap_all_text_nodes(element) {
    // Accepts either a selector string or an element
    const root = typeof element === 'string' ? document.querySelector(element) : element;
    if (!root) return;
    // Wrap all direct child text nodes of root
    Array.from(root.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
        const span = document.createElement('span');
        span.className = 'wrapped-text';
        node.parentNode.replaceChild(span, node);
        span.appendChild(node);
      }
    });
    // Now walk descendants for any further bare text nodes
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement && node.parentElement.classList.contains('wrapped-text')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    const nodesToWrap = [];
    while (node = walker.nextNode()) {
      nodesToWrap.push(node);
    }
    nodesToWrap.forEach(textNode => {
      const span = document.createElement('span');
      span.className = 'wrapped-text';
      textNode.parentNode.replaceChild(span, textNode);
      span.appendChild(textNode);
    });
}

// Normalize page break placement so that each pb marker becomes a direct child of #edition-text.
// This enables sibling-based paging logic (show_only_current_page) to work even when TEI pb
// occurs inside inline structures like verse spans.
function normalize_page_break_nesting(editionText) {
  try {
    const container = editionText || document.getElementById('edition-text');
    if (!container) return;

    // Prefer the inner text wrapper so pb elements stay siblings of content.
    const inner = container.querySelector('.edition-text-inner');
    const root = inner || container;

    // Handle ALL pb elements (both primary and secondary) for multi-witness documents
    const pbs = Array.from(root.querySelectorAll('span.pb'));
    if (pbs.length === 0) return;

    const liftPbToRoot = (pb) => {
      // Lift the pb node up the ancestor chain until it is a direct child of root.
      while (pb && pb.parentElement && pb.parentElement !== root) {
        const parent = pb.parentElement;
        const grand = parent.parentElement;
        if (!grand) break;

        // Split parent into a left clone (nodes before pb) and the remaining parent (pb + after).
        const left = parent.cloneNode(false);
        try { left.removeAttribute('id'); } catch (_) {}

        let movedAny = false;
        while (parent.firstChild && parent.firstChild !== pb) {
          left.appendChild(parent.firstChild);
          movedAny = true;
        }

        if (movedAny) {
          grand.insertBefore(left, parent);
        }

        // Move pb out of parent into grand, directly before the remaining parent.
        try { parent.removeChild(pb); } catch (_) { break; }
        grand.insertBefore(pb, parent);
      }
    };

    // Iterate over a snapshot because lifting mutates the DOM.
    pbs.forEach(liftPbToRoot);
  } catch (e) {
    console.error('❌ normalize_page_break_nesting error:', e);
  }
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
window.handle_new_image = handle_new_image;
window.handle_page_visibility = handle_page_visibility;
window.updateOsdScrollPageBreaks = (newPbElements) => {
//   console.log('osd_scroll.js: Updating page breaks from witness switcher.', newPbElements);
  const editionText = document.getElementById('edition-text');
  if (editionText) {
    normalize_page_break_nesting(editionText);
  }
  pb_elements_array = Array.from(newPbElements);
  max_index = pb_elements_array.length - 1;
};
window.getOsdScrollPbElements = () => pb_elements_array;


// Debug: Log all page break elements found
// console.log('Total page break elements found:', pb_elements_array.length);
pb_elements_array.forEach((el, index) => {
//   console.log(`Page break ${index}:`, el.getAttribute('source'), el);
});

// Debug: Check if the missing _d_ element exists with different classes
const editionText = document.getElementById('edition-text');
if (editionText) {
  const allSpansWithSource = editionText.querySelectorAll('span[source*="_d_"]');
//   console.log('All spans with _d_ in source:', allSpansWithSource.length);
  allSpansWithSource.forEach((el, index) => {
//     console.log(`_d_ span ${index}:`, el.getAttribute('source'), 'classes:', el.className, el);
  });
  
  // Also check for any pb elements regardless of classes
  const allPbElements = editionText.querySelectorAll('span.pb');
//   console.log('All pb elements found:', allPbElements.length);
  const missingD = Array.from(allPbElements).find(el => el.getAttribute('source') && el.getAttribute('source').includes('_d_'));
  if (missingD) {
//     console.log('Found _d_ pb element with classes:', missingD.className, missingD);
  } else {
//     console.log('No _d_ pb element found at all');
  }
  
  // Check entire document for _d_ elements
  const allDElementsInDoc = document.querySelectorAll('*[source*="_d_"]');
//   console.log('All _d_ elements in entire document:', allDElementsInDoc.length);
  allDElementsInDoc.forEach((el, index) => {
//     console.log(`_d_ element ${index} in document:`, el.getAttribute('source'), 'classes:', el.className, 'parent:', el.parentElement?.id || 'no-id', el);
  });

  // Set up a mutation observer to watch for dynamically added _d_ elements
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          if (node.getAttribute && node.getAttribute('source') && node.getAttribute('source').includes('_d_')) {
//             console.log('DYNAMIC: _d_ element added:', node.getAttribute('source'), 'classes:', node.className, node);
          }
          // Check children too
          const childDElements = node.querySelectorAll ? node.querySelectorAll('*[source*="_d_"]') : [];
          childDElements.forEach(child => {
//             console.log('DYNAMIC: _d_ child element added:', child.getAttribute('source'), 'classes:', child.className, child);
          });
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
//   console.log('Mutation observer set up to watch for _d_ elements');
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
  showSequenceControl: false,
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
if (prev) prev.style.opacity = 1;
if (next) next.style.opacity = 1;
var last_img_url = ""

// Manual navigation with prev/next buttons only
function handle_new_image(page_index) {
//   console.log(`🔄 IMAGE: handle_new_image(${page_index})`);
  
  if (page_index < 0 || page_index >= pb_elements_array.length) {
//     console.log('❌ IMAGE: Invalid page index:', page_index);
    return;
  }
  
//   console.log(`🔄 IMAGE: Setting current_page_index = ${page_index}`);
  current_page_index = page_index;
  const current_pb_element = pb_elements_array[page_index];
  
  const facsId = current_pb_element.getAttribute(
    page_break_marker_image_attribute
  );
  new_image_url = get_iiif_info_url(facsId);
//   console.log(`🔄 IMAGE: Loading image: ${new_image_url}`);
  
  old_image = viewer.world.getItemAt(0);
  load_new_image_with_check(new_image_url, old_image, facsId);
  
  // Update citation with correct page after image change
//   console.log(`🔄 IMAGE: Updating citation for page ${page_index}`);
  updateCitationSuggestion(page_index);
}

// New function to handle page content visibility
function handle_page_visibility(page_index) {
  if (page_index < 0 || page_index >= pb_elements_array.length) {
//     console.log('Invalid page index for visibility:', page_index);
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
//   console.log(`🔍 CITATION: Updating citation for page_index=${page_index}, current_page_index=${current_page_index}`);
  
  // Find the main container and edition-text element
  const main = document.querySelector('main');
  const editionText = document.getElementById('edition-text');
  if (!main || !editionText) {
//     console.log('❌ CITATION: Missing main or edition-text elements');
    return;
  }
  
  // Find the current pb element
  const pbEl = pb_elements_array[page_index];
  if (!pbEl) {
//     console.log(`❌ CITATION: No pb element found for index ${page_index}`);
    return;
  }
  
  // Get page info for citation
  const pageNum = pbEl.getAttribute('data-page-number') || (page_index + 1);
//   console.log(`📋 CITATION: Using page number ${pageNum} for citation`);
  
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
  let currentWitness = getCurrentWitness();
//   console.log(`🔍 CITATION: Current witness for URL: ${currentWitness}`);
  
  // Build URL using the pag/wit parameters
  const citationUrl = new URL(window.location.href);
  citationUrl.searchParams.set('pag', String(pageNum));
  if (currentWitness) {
    citationUrl.searchParams.set('wit', String(currentWitness));
  } else {
    citationUrl.searchParams.delete('wit');
  }
  citationUrl.searchParams.delete('tab');
  const pageUrlWithTab = citationUrl.toString();
//   console.log(`🌐 CITATION: Generated URL: ${pageUrlWithTab}`);
  
  // Compose citation text with updated URL that includes the current page
  const citationText = `${docTitle}. In Claudia Resch. <em>Armesünderblätter Online</em>, 2025, S. ${pageNum}. <a href='${pageUrlWithTab}' target='_blank'>${pageUrlWithTab}</a>`;
  
  // Find the citation div (which is a direct child of main, not edition-text)
  let citationDiv = main.querySelector('div.citation');
  if (!citationDiv) {
//     console.log('📋 CITATION: Citation div not found in main, creating it');
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
//   console.log(`✅ CITATION: Citation updated successfully`);
}

// Function to show only the content of the current page
function show_only_current_page(current_page_index) {

  const editionText = document.getElementById('edition-text');
  if (!editionText) return;

  // Safety check: if no page breaks found, show everything to avoid blank screen
  if (pb_elements_array.length === 0) {
    console.warn('osd_scroll: No page breaks found in pb_elements_array. Showing all content as fallback.');
    Array.from(editionText.querySelectorAll('*')).forEach(child => {
      child.style.removeProperty('display');
    });
    return;
  }

  // Ensure all bare text nodes are wrapped before proceeding
  wrap_all_text_nodes(editionText);

  const currentWitness = getCurrentWitness();

  // Find the container that holds the page breaks (could be edition-text or edition-text-inner)
  const currentPb = pb_elements_array[current_page_index];
  if (!currentPb) {
    console.warn('osd_scroll: currentPb not found at index', current_page_index);
    return;
  }
  
  // Use the nearest root container that holds the full page stream.
  // This guards against pb elements that are still nested inside paragraphs.
  const contentContainer = currentPb.closest('.edition-text-inner') || editionText;
  if (!contentContainer) {
    console.warn('osd_scroll: contentContainer not found');
    return;
  }

  // Hide all children of the content container (not edition-text itself)
  Array.from(contentContainer.children).forEach(child => {
    child.style.setProperty('display', 'none', 'important');
  });

  // Show the current pb (page break) and its content until the next pb
  const nextPb = pb_elements_array[current_page_index + 1] || null;

  // Show the catchword row for this page (row.layer_counter.fw)
  // and the main content between currentPb and nextPb
  let node = currentPb;
  let show = false;
  const nodesInRange = new Set();
  while (node) {
    // Check if we reached the next page break (moved check to start of loop)
    if (nextPb && node === nextPb) break;
    // Show catchword row before pb (footer) only if the following pb is for current witness
    if (node.classList && ((node.classList.contains('row') && node.classList.contains('layer_counter')) || node.classList.contains('catch'))) {
      let next = node.nextSibling;
      while (next && next.nodeType !== Node.ELEMENT_NODE) next = next.nextSibling;
      if (next && next.classList.contains('pb')) {
        const wit = next.getAttribute('wit');
        if (!wit || wit === currentWitness || wit === 'primary') {
          node.style.setProperty('display', '');
        }
      }
    }
    if (node === currentPb) {
      node.style.setProperty('display', '');
      show = true;
      node = node.nextSibling;
      continue;
    }
    if (node === nextPb) break;
    if (show && node.nodeType === Node.ELEMENT_NODE) {
      const dw = node.dataset.witness;
      let shouldShow = true;

      // Signature/counter rows are typically witness-specific but often lack data-witness.
      // Decide their visibility by looking at the next *primary* page-break (or any pb as fallback).
      if (node.classList && node.classList.contains('row') && node.classList.contains('layer_counter')) {
        let nextEl = node.nextSibling;
        while (nextEl && nextEl.nodeType !== Node.ELEMENT_NODE) nextEl = nextEl.nextSibling;

        // Find next primary pb in the following siblings
        let ownerPb = null;
        let scan = nextEl;
        while (scan) {
          if (scan.nodeType === Node.ELEMENT_NODE && scan.classList && scan.classList.contains('pb')) {
            if (scan.classList.contains('primary')) {
              ownerPb = scan;
              break;
            }
            // Keep first pb as a fallback if no primary pb exists later
            if (!ownerPb) ownerPb = scan;
          }
          scan = scan.nextSibling;
        }

        if (ownerPb) {
          const wit = ownerPb.getAttribute('wit');
          // Treat primary as shared; otherwise only show for current witness
          shouldShow = !wit || wit === currentWitness || wit === 'primary';
        } else {
          // No following pb -> safest is to hide
          shouldShow = false;
        }
      }

      if (dw) {
        shouldShow = dw === currentWitness;
      } else {
        // No data-witness: default to shared (show for all witnesses)
        if (node.classList.contains('pb')) {
          // For pb elements, check wit attribute to decide; treat primary as shared
          const wit = node.getAttribute('wit');
          shouldShow = !wit || wit === currentWitness || wit === 'primary';
        } else {
          // Keep whatever decision was computed above (e.g., layer_counter logic).
          // Default remains "shared" because shouldShow starts as true.
        }
      }
        if (shouldShow) {
        node.style.setProperty('display', '');
        try { nodesInRange.add(node); } catch (e) {}
      }
    }
    if (show && node.nodeType === Node.TEXT_NODE && node.parentElement) {
      node.parentElement.style.setProperty('display', '');
      try { nodesInRange.add(node.parentElement); } catch (e) {}
    }
    node = node.nextSibling;
  }

    // Ensure pb elements with mismatching witness are hidden
    Array.from(editionText.querySelectorAll('span.pb')).forEach(pb => {
      const wit = pb.getAttribute('wit');
      // Treat primary as shared; hide only pbs that are explicitly for another witness
      if (wit && wit !== currentWitness && wit !== 'primary') {
        pb.style.setProperty('display', 'none', 'important');
      } else {
        pb.style.removeProperty('display');
      }
    });

    // Hide catchwords ('col catch fw') only when the *next pb for the active witness*
    // indicates they belong to a different witness.
    //
    // Important: in multi-witness documents, a pb for another witness can appear first
    // in the DOM (e.g., wmW before wmR). Using the first following pb would incorrectly
    // hide shared catchwords for the active witness.
    Array.from(editionText.querySelectorAll('.col.catch.fw')).forEach(catchEl => {
      const witnessPbs = Array.from(
        editionText.querySelectorAll(`span.pb[wit="${currentWitness}"], span.pb[wit="primary"]`)
      );

      const nextWitnessPb = witnessPbs.find(pb =>
        (catchEl.compareDocumentPosition(pb) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
      );

      if (nextWitnessPb) {
        const wit = nextWitnessPb.getAttribute('wit');
        if (wit && wit !== currentWitness && wit !== 'primary') {
          catchEl.style.setProperty('display', 'none', 'important');
        }
      }
    });

  // Update global current_page_index for tracking
  window.current_page_index = current_page_index;
  updateCitationSuggestion(current_page_index);
  filterLineBreaksByWitness();
}

// Hide/show line breaks (lb) according to active witness
function filterLineBreaksByWitness() {
  const normalizeWitness = (value) => value ? value.replace(/^#/, '') : value;
  const bodyWitness = normalizeWitness(document.body.getAttribute('data-active-witness'));
  const currentWitness = bodyWitness || normalizeWitness(getCurrentWitness());
  if (!currentWitness) return;

  document.querySelectorAll('br.lb').forEach(lb => {
    const wit = normalizeWitness(lb.getAttribute('wit'));
    const dataWitness = normalizeWitness(lb.getAttribute('data-witness'));
    const ancestorWitness = normalizeWitness(lb.closest('[data-witness]')?.getAttribute('data-witness'));
    let shouldShow = true;

    if (wit) {
      shouldShow = wit === 'primary' || wit === normalizedCurrent;
    } else if (dataWitness) {
      shouldShow = dataWitness === normalizedCurrent;
    } else if (ancestorWitness) {
      shouldShow = ancestorWitness === normalizedCurrent;
    }

    if (shouldShow) {
      lb.classList.remove('lb-hidden');
    } else {
      lb.classList.add('lb-hidden');
    }
  });
}

function load_new_image_with_check(new_image_url, old_image, facsId) {
  if (last_img_url !== new_image_url) {
    last_img_url = new_image_url;
    viewer.addTiledImage({
      tileSource: new_image_url,
      success: function (event) {
        if (viewer.world.getItemCount() > 1 && old_image) {
          viewer.world.removeItem(old_image);
        }
      },
      error: function () {
        const fallback_url = get_iif_link(facsId);
        if (last_img_url === fallback_url) {
          return;
        }
        last_img_url = fallback_url;
        viewer.addSimpleImage({
          url: fallback_url,
          success: function (event) {
            function ready() {
              if (viewer.world.getItemCount() > 1 && old_image) {
                viewer.world.removeItem(old_image);
              }
            }
            if (event.item) {
              ready();
            } else {
              event.item.addOnceHandler("fully-loaded-change", ready());
            }
          },
        });
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
if (prev) {
  prev.addEventListener("click", () => {
    navigate_prev();
  });
}
if (next) {
  next.addEventListener("click", () => {
    navigate_next();
  });
}

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
  
  // Check if there's a pag/wit parameter in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const pagParam = urlParams.get('pag');
  const witParam = urlParams.get('wit');
  
  // Also check if this is a multi-witness document (has both primary and secondary pbs)
  const hasPrimaryPbs = document.querySelectorAll('.pb.primary[source]').length > 0;
  const hasSecondaryPbs = document.querySelectorAll('.pb.secondary[source]').length > 0;
  const isMultiWitness = hasPrimaryPbs && hasSecondaryPbs;
  
  if (isMultiWitness) {
    // witness_switcher.js will handle the initial page display
    console.log('osd_scroll: Multi-witness detected, deferring to witness_switcher for initialization');
    // Still update page links but don't show initial page
    updatePageLinks();
    return;
  }

  if (pagParam) {
    // Single-witness doc with pag param: use the page number directly.
    const requestedIndex = Math.max(0, parseInt(pagParam, 10) - 1);
    if (pb_elements_array.length > 0) {
      current_page_index = Math.min(requestedIndex, pb_elements_array.length - 1);
      handle_new_image(current_page_index);
      handle_page_visibility(current_page_index);
      updateCitationSuggestion(current_page_index);
    }

    updatePageLinks();
    return;
  }
  
  // Show only the first page initially (only for single-witness documents without pag param)
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
  document.addEventListener('DOMContentLoaded', function() {
    // Wrap all bare text nodes in #edition-text, including direct children
    const editionText = document.getElementById('edition-text');
    if (editionText) {
      wrap_all_text_nodes(editionText);
      normalize_page_break_nesting(editionText);
      pb_elements_array = Array.from(document.getElementsByClassName(page_break_marker_classname));
      max_index = pb_elements_array.length - 1;
    }
    initializePageView();
  });
} else {
  // Add a small delay to ensure everything is rendered
  setTimeout(function() {
    const editionText = document.getElementById('edition-text');
    if (editionText) {
      wrap_all_text_nodes(editionText);
      normalize_page_break_nesting(editionText);
      pb_elements_array = Array.from(document.getElementsByClassName(page_break_marker_classname));
      max_index = pb_elements_array.length - 1;
    }
    initializePageView();
  }, 100);
}

// Update page links with proper navigation links
function updatePageLinks() {
  console.log('OSD: Updating page links');
  
  // Get all page links
  const page_links = document.querySelectorAll('.page-link');
  
  if (!page_links || page_links.length === 0) {
    console.log('OSD: No page links found, checking if witness_switcher can create them');
    
    // If no page links exist, try to trigger witness_switcher to create them
    if (typeof window.createPaginationIfMissing === 'function') {
      console.log('OSD: Calling witness_switcher to create pagination');
      const created = window.createPaginationIfMissing();
      if (created) {
        // Retry after creation
        setTimeout(() => {
          const retryLinks = document.querySelectorAll('.page-link');
          if (retryLinks.length > 0) {
            console.log('OSD: Found', retryLinks.length, 'links after creation, updating them');
            updatePageLinksActual(retryLinks);
          }
        }, 10);
        return;
      }
    }
    
    // Fallback: build pagination for single-witness documents.
    const createdSingle = buildSingleWitnessPagination();
    if (createdSingle) {
      const retryLinks = document.querySelectorAll('.page-link');
      if (retryLinks.length > 0) {
        console.log('OSD: Built single-witness pagination, updating links');
        updatePageLinksActual(retryLinks);
        return;
      }
    }

    console.log('OSD: No page links found and cannot create them');
    return;
  }
  
  updatePageLinksActual(page_links);
}

function buildSingleWitnessPagination() {
  try {
    const witnessPages = document.querySelector('.witness-pages');
    if (!witnessPages) return false;

    let nav = witnessPages.querySelector('nav.witness-pagination');
    if (!nav) {
      nav = document.createElement('nav');
      nav.className = 'witness-pagination ais-Pagination';
      nav.setAttribute('aria-label', 'Seitennavigation');
      witnessPages.appendChild(nav);
    }

    let ul = nav.querySelector('.page-links');
    if (!ul) {
      ul = document.createElement('ul');
      ul.className = 'page-links ais-Pagination-list';
      nav.appendChild(ul);
    }

    const total = Array.isArray(pb_elements_array) ? pb_elements_array.length : 0;
    if (!total) return false;

    ul.innerHTML = '';

    for (let idx = 0; idx < total; idx += 1) {
      const li = document.createElement('li');
      li.className = 'ais-Pagination-item ais-Pagination-item--page';
      if (idx === current_page_index) {
        li.classList.add('ais-Pagination-item--selected');
      }

      const a = document.createElement('a');
      a.className = 'ais-Pagination-link page-link';
      a.textContent = String(idx + 1);
      a.setAttribute('aria-label', String(idx + 1));
      a.setAttribute('data-page-index', String(idx));

      const linkUrl = new URL(window.location.href);
      linkUrl.searchParams.set('pag', String(idx + 1));
      linkUrl.searchParams.delete('wit');
      linkUrl.searchParams.delete('tab');
      a.href = linkUrl.toString();

      if (idx === current_page_index) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }

      li.appendChild(a);
      ul.appendChild(li);
    }

    return true;
  } catch (e) {
    console.error('OSD: Failed to build single-witness pagination', e);
    return false;
  }
}

// Actual page link updating logic (extracted)
function updatePageLinksActual(page_links) {
  console.log('OSD: Updating', page_links.length, 'existing page links');
  const hasWitnessMarkers = document.querySelectorAll('[data-witness], .pb[wit], .rdg[wit]').length > 0;
  
  // Normalize witness IDs (strip leading "wit-" if present)
  const cleanWitnessId = function(witness) {
    return witness ? String(witness).replace(/^wit-/, '') : witness;
  };
  
  // Update each link
  page_links.forEach(link => {
    // Get the target page index (0-based)
    const page_index = link.getAttribute('data-page-index');
    
    // Determine witness with a conservative priority to preserve correct links
    // 0) If href already contains ?wit=... preserve that witness
    let witness = null;
    try {
      const href = link.getAttribute('href') || '';
      const mHref = href.match(/[?&]wit=([^&#]+)/);
      if (mHref && mHref[1]) {
        witness = decodeURIComponent(mHref[1]);
      }
    } catch (_) {}

    // 1) Else authoritative if the link already carries data-witness (do not override)
    if (!witness) {
      witness = link.getAttribute('data-witness');
    }
    
    // 2) Else prefer the enclosing tab-pane witness (data-witness or id)
    if (!witness) {
      const pane = link.closest('[id$="-meta-data"]');
      if (pane) {
        const paneWitness = pane.getAttribute('data-witness');
        if (paneWitness) {
          witness = paneWitness;
        } else if (pane.id) {
          const m = pane.id.match(/^wit-(.+)-meta-data$/);
          if (m && m[1]) {
            witness = m[1];
          }
        }
      }
    }
    
    // 3) Else prefer a stamped container witness
    if (!witness) {
      const stamped = link.closest('.witness-pages[data-witness]');
      if (stamped) {
        witness = stamped.getAttribute('data-witness');
      }
    }
    
    // 4) Last resort: use current active witness
    if (!witness) {
      witness = getCurrentWitness();
    }
    
    // Normalize witness ID
    witness = witness ? String(cleanWitnessId(witness)).trim().toLowerCase() : witness;
    if (!hasWitnessMarkers) {
      witness = null;
    }
    
    if (page_index !== null) {
      const page_num = parseInt(page_index, 10) + 1; // Convert to 1-based

      // If the link already has a matching ?pag page number, do not rewrite it
      try {
        const existingHref = link.getAttribute('href') || '';
        const existingUrl = new URL(existingHref, window.location.href);
        const existingPag = existingUrl.searchParams.get('pag');
        if (existingPag && parseInt(existingPag, 10) === page_num) {
          return;
        }
      } catch (_) {}

  // Build the URL with pag/wit, preserving existing search params like pbs
  const updatedUrl = new URL(window.location.href);
  updatedUrl.searchParams.set('pag', String(page_num));
  if (witness) {
    updatedUrl.searchParams.set('wit', String(witness));
  } else {
    updatedUrl.searchParams.delete('wit');
  }
  updatedUrl.searchParams.delete('tab');
  const newUrl = updatedUrl.toString();
      
      // Update the link
      link.href = newUrl;
      // Persist resolved witness to avoid future ambiguity
      try {
        if (witness) {
          link.setAttribute('data-witness', witness);
        } else {
          link.removeAttribute('data-witness');
        }
      } catch(_) {}
//       console.log(`Updated link to ${newUrl}`);
    }
  });
  
//   console.log(`Page links rebuilt for ${page_links.length} links, witness:`, getCurrentWitness());
}

// Helper function to get the current witness
function getCurrentWitness() {
//     console.log(`🔍 GET_WITNESS: Starting getCurrentWitness()`);
    
    // HIGHEST PRIORITY: Check if witness_switcher.js has set a current witness
    if (window.currentWitness) {
//         console.log(`✅ GET_WITNESS: Using window.currentWitness: ${window.currentWitness}`);
        return window.currentWitness;
    }
    
    // SECOND PRIORITY: Check if we have an active witness switcher instance
    if (window.witnessAvailableSet && window.witnessAvailableSet.size > 0) {
        // Check body attribute for active witness (set by witness_switcher.js)
        const bodyWitness = document.body.getAttribute('data-active-witness');
        if (bodyWitness && window.witnessAvailableSet.has(bodyWitness)) {
//             console.log(`✅ GET_WITNESS: Found witness ${bodyWitness} from body attribute`);
            return bodyWitness;
        }
    }
    
    // THIRD PRIORITY: Check URL for witness information
    const urlParams = new URLSearchParams(window.location.search);
    const witParam = urlParams.get('wit');
    if (witParam) {
      return String(witParam).trim().toLowerCase();
    }
    
    // If there are no witness markers, treat as single-witness and return null
    const hasWitnessMarkers = document.querySelectorAll('[data-witness], .pb[wit], .rdg[wit]').length > 0;
    if (!hasWitnessMarkers) {
      return null;
    }

    // FOURTH PRIORITY: Try to detect witness from the currently visible page breaks
    const visiblePbs = document.querySelectorAll('.pb.active-witness-pb[wit], .pb.active-witness-pb[data-witness]');
    if (visiblePbs && visiblePbs.length > 0) {
      const wit = visiblePbs[0].getAttribute('wit') || visiblePbs[0].getAttribute('data-witness');
      if (wit) {
        return String(wit).trim().toLowerCase();
      }
    }
    
    // SIXTH PRIORITY: Check for active tab or other indicators
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab) {
      const activeWitness = activeTab.getAttribute('data-witness');
      if (activeWitness) {
        return String(activeWitness).trim().toLowerCase();
      }
      if (activeTab.id) {
        const witnessMatch = activeTab.id.match(/^wit-(.+)-meta-data$/);
        if (witnessMatch) {
          return String(witnessMatch[1]).trim().toLowerCase();
        }
      }
    }
    
    // Default to the first available witness if nothing else found
    if (window.witnessAvailableSet && window.witnessAvailableSet.size > 0) {
        const firstWitness = Array.from(window.witnessAvailableSet)[0];
//         console.log(`⚠️ GET_WITNESS: No witness found, using first available: ${firstWitness}`);
        return firstWitness;
    }
    
    // Final fallback
//     console.log(`⚠️ GET_WITNESS: No witness found, defaulting to W`);
    return 'primary';
}

// Expose the updatePageLinks function globally so witness_switcher.js can call it
window.updatePageLinks = updatePageLinks;

// Add a new method to set the active witness - update links when witness changes
function setActiveWitness(witness, pageBreaks) {
//   console.log(`🔍 osd_scroll: Setting active witness to ${witness}`);
  
  // Store witness info
  window.currentWitness = witness ? String(witness).trim().toLowerCase() : witness;
  
  // Dispatch event
  document.dispatchEvent(new CustomEvent('osdScrollWitnessChanged', {
    detail: { witness, pageBreaks }
  }));
  
  // Update page links with new witness
  setTimeout(updatePageLinks, 100);
}

// Set up listeners for witness tab changes
function setupWitnessChangeListeners() {
//   console.log("Setting up witness change listeners");
  
  // DIRECT APPROACH: Find and attach click handlers to all witness tabs
  const witnessTabLinks = document.querySelectorAll('#witness_overview button[data-bs-toggle="tab"][data-bs-target^="#wit-"]');
  
  witnessTabLinks.forEach(tabLink => {
    tabLink.addEventListener('click', function(e) {
      const witnessId = (this.id || '').replace(/^wit-/, '').replace('-tab', '');
      if (!witnessId) return;

      const pageNumber = current_page_index + 1;
      const newUrlObj = new URL(window.location.href);
      newUrlObj.searchParams.set('pag', String(pageNumber));
      newUrlObj.searchParams.set('wit', String(witnessId).trim().toLowerCase());
      newUrlObj.searchParams.delete('tab');
      const newUrl = newUrlObj.toString();
      
      e.preventDefault();
      e.stopPropagation();
      window.location.replace(newUrl);
      return false;
    });
  });
  
  // Keep the old handlers as backup with fix for preserving current page
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    if (target && 
        target.getAttribute && 
        target.getAttribute('data-bs-toggle') === 'tab' && 
        (target.getAttribute('data-bs-target')?.startsWith('#wit-') || target.getAttribute('data-witness'))) {
      
//       console.log('General click handler caught a tab click');
      
      // Extract witness code
      const witness = target.getAttribute('data-witness') || 
             (target.getAttribute('data-bs-target') ? target.getAttribute('data-bs-target').replace('#wit-', '').replace('-meta-data', '') : '');
      
      if (witness) {
//         console.log(`Tab clicked for witness: ${witness}`);
        
        // Get current page number (1-based) - FIXED to use the global current_page_index
  const pageNumber = current_page_index + 1;
        
  // Construct URL with current page number
  const newUrlObj = new URL(window.location.href);
  newUrlObj.searchParams.set('pag', String(pageNumber));
  newUrlObj.searchParams.set('wit', String(witness).trim().toLowerCase());
  newUrlObj.searchParams.delete('tab');
  const newUrl = newUrlObj.toString();
        
        // Prevent default and force reload
        event.preventDefault();
        event.stopPropagation();
        
//         console.log(`FORCE RELOADING to: ${newUrl}`);
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
//       console.log(`Dropdown changed to: ${witness}`);
      
      // Get page number and construct URL - FIXED to use current_page_index
  const pageNumber = current_page_index + 1;
  const newUrlObj = new URL(window.location.href);
  newUrlObj.searchParams.set('pag', String(pageNumber));
  newUrlObj.searchParams.set('wit', String(witness).trim().toLowerCase());
  newUrlObj.searchParams.delete('tab');
  const newUrl = newUrlObj.toString();
      
//       console.log(`RELOADING TO: ${newUrl}`);
      window.location.replace(newUrl);
    });
//     console.log('Added change handler to witness dropdown');
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