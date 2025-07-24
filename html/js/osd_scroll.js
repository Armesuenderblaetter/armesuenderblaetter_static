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

// Removed isInViewport function as it's no longer needed for automatic scrolling

// Removed debounce function as it's no longer needed for automatic scrolling

function navigate_prev() {
  const prev_index = current_page_index - 1;
  if (prev_index >= 0) {
    handle_new_image(prev_index);
    handle_page_visibility(prev_index);
    console.log('Navigated to previous page:', prev_index + 1);
  } else {
    console.log('Already at first page');
  }
}

function navigate_next() {
  const next_index = current_page_index + 1;
  if (next_index <= max_index) {
    handle_new_image(next_index);
    handle_page_visibility(next_index);
    console.log('Navigated to next page:', next_index + 1);
  } else {
    console.log('Already at last page');
  }
}

// URL hash handling for initial page setup
// No automatic scrolling - only content and image updates

function get_pb_sibling(element){
    let parent_childs = Array.from(element.parentElement.children);
    console.log(parent_childs)
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
  console.log('Initial page loaded:', initial_page_index + 1);
}

/*
##################################################################
get all image urls stored in span el class tei-xml-images
creates an array for osd viewer with static images
##################################################################
*/
var pb_elements = document.getElementsByClassName(page_break_marker_classname);
var pb_elements_array = Array.from(pb_elements);

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
const max_index = pb_elements_array.length - 1;
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
}

// Function to show only the content of the current page
function show_only_current_page(current_page_index) {
  // Get all content between page breaks
  const editionText = document.getElementById('edition-text');
  if (!editionText) {
    console.log('No edition-text element found');
    return;
  }
  
  // Use the same pb_elements_array that's used for images
  if (pb_elements_array.length === 0) {
    console.log('No page break elements found');
    return;
  }
  
  // Get the current and next page break elements from the main array
  const currentPbElement = pb_elements_array[current_page_index];
  const nextPbElement = pb_elements_array[current_page_index + 1];
  
  if (!currentPbElement) {
    console.log('Current page element not found for index:', current_page_index);
    return;
  }
  
  // Hide all direct children of editionText by default
  const directChildren = Array.from(editionText.children);
  directChildren.forEach(child => {
    child.style.display = 'none';
    child.classList.remove('current-page');
  });

  // Find all nodes between currentPbElement and nextPbElement in document order
  let started = false;
  let finished = false;
  let nodesToShow = [];
  function collectNodes(node) {
    if (finished) return;
    if (node === currentPbElement) started = true;
    if (started) nodesToShow.push(node);
    if (node === nextPbElement && started && node !== currentPbElement) {
      finished = true;
      nodesToShow.pop(); // do not include the nextPbElement itself
      return;
    }
    for (let child of node.childNodes) {
      collectNodes(child);
      if (finished) break;
    }
  }
  collectNodes(editionText);

  // Show all nodes in the range and their ancestors up to editionText
  nodesToShow.forEach(node => {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el !== editionText) {
      el.style.display = '';
      el.classList.add('current-page');
      el = el.parentElement;
    }
  });
  // Always show editionText
  editionText.style.display = '';

  console.log(`Showing page ${current_page_index + 1} of ${pb_elements_array.length}: showing nodes from pb #${current_page_index} to pb #${current_page_index + 1}`);
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

if (isVisible(OSD_container_spawnpoint)) {
  load_initial_image();
}

// Initialize the page to show only the first page content
function initializePageView() {
  // Show only the first page initially
  if (pb_elements_array.length > 0) {
    // Set initial state
    current_page_index = 0;
    show_only_current_page(0);
    console.log('Page view initialized - showing first page only, total pages:', pb_elements_array.length);
  }
}

// Make sure DOM is loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePageView);
} else {
  // Add a small delay to ensure everything is rendered
  setTimeout(initializePageView, 100);
}