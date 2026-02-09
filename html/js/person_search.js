var project_collection_name = "flugblaetter_todesurteile_persons";
var typesense_host = "typesense.acdh-dev.oeaw.ac.at";
var typesense_port = "443";
var typesense_search_key = "Bp1ezRAZZC2wMVqH6Xc52cR5fBQdcJij";

function makeDocLink(hit) {
  return hit.git_file_path;
}

function getDocumentLink(hit) {
  const global_id = hit && hit.global_id;
  if (!global_id) {
    return '#';
  }
  const match = global_id.match(/^pers_(fb_\d{8}_[^_]+)/);
  if (match) {
    return `${match[1]}.html`;
  }
  return '#';
}

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: typesense_search_key,
    nodes: [
      {
        host: typesense_host,
        port: typesense_port,
        protocol: "https",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "fullname",
    per_page: 20,
  },
});

const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
  routing: true,
});

function createDecadeAgeSliderWidget({
  sliderContainer,
  countContainer,
  attribute,
}) {
  return {
    init({ helper }) {
      this.helper = helper;
      this.sliderEl = document.querySelector(sliderContainer);
      this.countEl = document.querySelector(countContainer);
      this.attribute = attribute;
      this.values = null;
      this.slider = null;
      this.isSyncing = false;

      if (this.helper && this.attribute) {
        // Ensure the attribute is treated as disjunctive facet.
        try {
          this.helper.addDisjunctiveFacet(this.attribute);
        } catch (e) {
          // Ignore; helper implementation may already include it.
        }
      }
    },

    render({ results, state }) {
      if (this.countEl && results && typeof results.nbHits === "number") {
        this.countEl.textContent = String(results.nbHits);
      }

      if (!this.sliderEl) return;
      if (!window.noUiSlider) return;

      if (!this.values && results && typeof results.getFacetValues === "function") {
        let facetValues = [];
        try {
          facetValues = results.getFacetValues(this.attribute) || [];
        } catch (e) {
          facetValues = [];
        }

        // Keep only decade-like labels (e.g., "20–29"); ignore "k. A.".
        const decadeRe = /^\d+–\d+$/;
        const decades = (Array.isArray(facetValues) ? facetValues : [])
          .map((v) => (v && v.name ? String(v.name) : ""))
          .filter((name) => decadeRe.test(name))
          .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

        this.values = decades;

        if (!this.values.length) {
          this.sliderEl.style.display = "none";
          return;
        }

        const maxIndex = this.values.length - 1;

        const tooltipFormat = {
          to: (value) => {
            const idx = Math.round(Number(value));
            return this.values && this.values[idx] ? this.values[idx] : "";
          },
          from: (value) => Number(value),
        };

        window.noUiSlider.create(this.sliderEl, {
          start: [0, maxIndex],
          connect: true,
          step: 1,
          range: {
            min: 0,
            max: maxIndex,
          },
          behaviour: "tap-drag",
          tooltips: [tooltipFormat, tooltipFormat],
        });

        this.slider = this.sliderEl.noUiSlider;

        this.slider.on("change", (rawValues) => {
          if (!this.helper || !this.attribute || !Array.isArray(this.values) || !this.values.length) {
            return;
          }
          if (this.isSyncing) return;

          const minIndex = Math.max(0, Math.round(Number(rawValues[0])));
          const maxIndex2 = Math.min(this.values.length - 1, Math.round(Number(rawValues[1])));

          const isFullRange = minIndex === 0 && maxIndex2 === this.values.length - 1;
          const selected = isFullRange ? [] : this.values.slice(minIndex, maxIndex2 + 1);

          this.helper.clearRefinements(this.attribute);
          for (const label of selected) {
            this.helper.addDisjunctiveFacetRefinement(this.attribute, label);
          }
          this.helper.search();
        });
      }

      if (!this.slider || !this.values || !this.values.length) return;

      // Sync slider position to current refinements (e.g., when using back/forward).
      const refinements =
        (state && state.disjunctiveFacetsRefinements && state.disjunctiveFacetsRefinements[this.attribute]) || [];

      const active = (Array.isArray(refinements) ? refinements : [])
        .map((v) => String(v))
        .filter((v) => this.values.includes(v));

      const maxIndex = this.values.length - 1;
      let target = [0, maxIndex];
      if (active.length) {
        const indices = active
          .map((v) => this.values.indexOf(v))
          .filter((i) => i >= 0)
          .sort((a, b) => a - b);
        if (indices.length) {
          target = [indices[0], indices[indices.length - 1]];
        }
      }

      const current = this.slider.get().map((v) => Math.round(Number(v)));
      if (current[0] !== target[0] || current[1] !== target[1]) {
        this.isSyncing = true;
        this.slider.set(target);
        this.isSyncing = false;
      }
    },
  };
}

const iiif_server_base_path =
  "https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/";
const iiif_attribs = "/full/260,/0/default.jpg";

function get_iif_link(filename, place) {
  const placeMap = {
    "Österreichische Nationalbibliothek": "oenb",
    "Wiener Museum": "wmW",
    "Wienbibliothek im Rathaus": "wb"
  };
  let placecleaned = placeMap[place] || ""; 
  let cleaned = filename.replace(/^fb_/, "");
  return iiif_server_base_path + cleaned + "_a_" + placecleaned + ".jp2" + iiif_attribs;
}

function return_html_list(arr) {
  if (arr.length == 0) {
    return "–";
  }
  let ul = "<ul>";
  for (i = 0; i < arr.length; ++i) {
    let li = `<li>${arr[i]}</li>`;
    ul = ul + li;
  }
  ul = ul + "</ul>";
  return ul;
}

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: "#searchbox",
    autofocus: true,
    /*cssClasses: {
      form: "form-inline",
      input: "form-control col-md-11",
      submit: "btn",
      reset: "btn",
    },*/
  }),

  createDecadeAgeSliderWidget({
    sliderContainer: "#decadeAgeSlider",
    countContainer: "#decadeAgeCount",
    attribute: "decade_age",
  }),

  // Custom infiniteHits using connector to expose showMore function
  (function() {
    // Store showMore function globally so our load-more button can use it
    window.__infiniteHitsShowMore = null;
    window.__infiniteHitsIsLastPage = true;

    const connectInfiniteHits = instantsearch.connectors.connectInfiniteHits;

    const renderInfiniteHits = (renderOptions, isFirstRender) => {
      const { hits, showMore, isLastPage, widgetParams } = renderOptions;
      const container = document.querySelector(widgetParams.container);

      // Store for our custom button
      window.__infiniteHitsShowMore = showMore;
      window.__infiniteHitsIsLastPage = isLastPage;

      if (!container) return;

      function valueOrDash(value) {
        if (Array.isArray(value)) {
          return value.length ? value.join(", ") : "–";
        }
        if (value === null || value === undefined) return "–";
        const s = String(value).trim();
        return s.length ? s : "–";
      }

      const hitsHtml = hits.length === 0
        ? '<div class="ais-InfiniteHits-empty">Keine Resultate für diese Suche</div>'
        : `<ol class="ais-InfiniteHits-list">${hits.map(hit => {
            const fullName = valueOrDash(hit.fullname);
            const fullNameUpper = String(fullName).toLocaleUpperCase("de-DE");
            const detailUrl = getDocumentLink(hit);
            const imageUrl = iiif_server_base_path + hit.thumbnail + iiif_attribs;

            return `<li class="ais-InfiniteHits-item">
              <div class="person-hit-card">
                <a class="person-hit-link" href="${detailUrl}" aria-label="Details zu ${fullName}">
                  <img class="person-hit-image" src="${imageUrl}" alt="Deckblatt/Erste Seite des Armesünderblattes" />
                </a>
                <div class="person-hit-overlay">
                  <h4 class="person-hit-title">${fullNameUpper}</h4>
                  <ul class="person-hit-list">
                    <li><span class="person-hit-label">GESCHLECHT</span><span class="person-hit-value">${valueOrDash(hit.sex)}</span></li>
                    <li><span class="person-hit-label">ALTER</span><span class="person-hit-value">${valueOrDash(hit.age)}</span></li>
                    <li><span class="person-hit-label">FAMILIENSTAND</span><span class="person-hit-value">${valueOrDash(hit.marriage_status)}</span></li>
                    <li><span class="person-hit-label">GEBURTSORT</span><span class="person-hit-value">${valueOrDash(hit.birth_place)}</span></li>
                    <li><span class="person-hit-label">KONFESSION</span><span class="person-hit-value">${valueOrDash(hit.faith)}</span></li>
                    <li><span class="person-hit-label">HINRICHTUNGSORT</span><span class="person-hit-value">${valueOrDash(hit.execution_places)}</span></li>
                  </ul>
                  <div class="person-hit-cta">
                    <a class="cta-button" href="${detailUrl}">DETAILS</a>
                  </div>
                </div>
              </div>
            </li>`;
          }).join('')}</ol>`;

      container.innerHTML = `<div class="ais-InfiniteHits">${hitsHtml}</div>`;

      // Dispatch event so load-more button can update
      window.dispatchEvent(new CustomEvent('infiniteHitsRendered'));
    };

    return connectInfiniteHits(renderInfiniteHits)({
      container: "#hits",
    });
  })(),
  // <tr>
  //   <td><em>Verbrechen</em></td>
  //   <td>${offences}</td>
  // </tr>
  // <tr>
  //   <td><em>Hinrichtung</em></td>
  //   <td>${execution}</td>
  // </tr>
  // <tr>
  //   <td><em>Bestrafungen</em></td>
  //   <td>${punishments}</td>
  // </tr>

  instantsearch.widgets.clearRefinements({
    container: "#clear-refinements",
    templates: {
      resetLabel: "Filter zurücksetzen",
    },
    /*cssClasses: {
      button: "btn",
    },*/
  }),

  instantsearch.widgets.currentRefinements({
    container: "#current-refinements",
    /*cssClasses: {
      delete: "btn",
      label: "badge",
    },*/
  }),

  instantsearch.widgets.configure({
    hitsPerPage: 20,
    attributesToSnippet: ["fullname"],
  }),

  instantsearch.widgets.refinementList({
    container: "#name_list",
    attribute: "fullname",
    sortBy: ['name:asc', 'count:desc'],
    limit: 1000,
    searchable: false,
    cssClasses: {
      // showMore: "btn btn-secondary btn-sm align-content-center",
      list: "facet-list-scroll",
      // count: "badge ml-2 badge-secondary hideme",
      // label: "d-flex align-items-center text-capitalize",
      // checkbox: "mr-2",
    },
  }),

  instantsearch.widgets.refinementList({
    container: "#sex",
    attribute: "sex",
    searchable: false,
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },*/
  }),

  instantsearch.widgets.refinementList({
    container: "#birth_place",
    attribute: "birth_place",
    limit: 1000,
    searchable: false,
    sortBy: ['name:asc', 'count:desc'],
    cssClasses: {
      list: "facet-list-scroll",
    },
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },*/
  }),

  instantsearch.widgets.refinementList({
    container: "#execution_places",
    attribute: "execution_places",
    limit: 1000,
    searchable: false,
    sortBy: ['name:asc', 'count:desc'],
    cssClasses: {
      list: "facet-list-scroll",
    },
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },*/
  }),

  instantsearch.widgets.refinementList({
    container: "#decade_age",
    attribute: "decade_age",
    searchable: false,
    sortBy: ['name:asc'],
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },*/
  }),

  //instantsearch.widgets.refinementList({
  // container: "#type",
  //  attribute: "type",
  //  searchable: false,
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },*/
  //}),

  instantsearch.widgets.refinementList({
    container: "#marriage_status",
    attribute: "marriage_status",
     sortBy: ['name:asc', 'count:desc'],
    searchable: false,
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },*/
  }),

  instantsearch.widgets.refinementList({
    container: "#faith",
    attribute: "faith",
     sortBy: ['name:asc', 'count:desc'],
    searchable: false,
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },*/
  }),

  // Removed from left column: offences + execution
]);

search.start();

// Create a "Load More" button in #pagination
(function initLoadMoreButton() {
  const paginationEl = document.getElementById("pagination");
  if (!paginationEl) return;

  // Create the button immediately
  const loadMoreWrapper = document.createElement("div");
  loadMoreWrapper.className = "load-more-wrapper";
  loadMoreWrapper.style.display = "none"; // Hidden until we know there are more results

  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.type = "button";
  loadMoreBtn.className = "site-button load-more-btn";
  loadMoreBtn.innerHTML = '<i class="bi bi-chevron-double-down" aria-hidden="true"></i>';
  loadMoreBtn.addEventListener("click", function() {
    // Call the exposed showMore function from our custom infiniteHits connector
    if (window.__infiniteHitsShowMore) {
      window.__infiniteHitsShowMore();
    }
  });

  const label = document.createElement("span");
  label.className = "load-more-label";
  label.textContent = "MEHR LADEN";

  loadMoreWrapper.appendChild(loadMoreBtn);
  loadMoreWrapper.appendChild(label);
  paginationEl.appendChild(loadMoreWrapper);

  function updateButtonVisibility() {
    // Count currently displayed hits
    const displayedHits = document.querySelectorAll(".ais-InfiniteHits-item").length;
    // Get total hits from the count element (decadeAgeCount shows total)
    const countEl = document.getElementById("decadeAgeCount");
    const totalHits = countEl ? parseInt(countEl.textContent, 10) : 0;
    
    const hasMore = displayedHits > 0 && displayedHits < totalHits;
    loadMoreBtn.disabled = !hasMore;
    loadMoreWrapper.style.display = hasMore ? "" : "none";
  }

  // Listen for render events from our custom infiniteHits connector
  window.addEventListener('infiniteHitsRendered', updateButtonVisibility);

  // Also observe DOM changes in hits container
  const hitsEl = document.getElementById("hits");
  if (hitsEl) {
    const observer = new MutationObserver(updateButtonVisibility);
    observer.observe(hitsEl, { childList: true, subtree: true });
  }

  // Also check periodically in case events are missed
  setTimeout(updateButtonVisibility, 500);
  setTimeout(updateButtonVisibility, 1000);
  setTimeout(updateButtonVisibility, 2000);
})();

// Scroll to top button - appears when .site-top-inner is out of view
(function initScrollToTop() {
  const scrollBtn = document.getElementById("scrollToTopBtn");
  const siteTopInner = document.querySelector(".site-top-inner");
  const main = document.querySelector("main");
  if (!scrollBtn || !siteTopInner) return;

  // Keep the button fixed, but dynamically align it to the visible `main`
  // and lift it above the footer when the footer scrolls into view.
  const baseBottom = 0;
  const baseRight = 0;

  // Use IntersectionObserver to detect when site-top-inner is out of view
  const topObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Show button when site-top-inner is NOT intersecting (scrolled out of view)
        scrollBtn.classList.toggle("visible", !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );

  topObserver.observe(siteTopInner);

  function updateScrollButtonPosition() {
    // Align horizontally with the visible main column (bottom-right of main).
    if (main) {
      const mainRect = main.getBoundingClientRect();
      const rightOffset = Math.max(baseRight, window.innerWidth - mainRect.right + baseRight);
      scrollBtn.style.right = `${rightOffset}px`;

      // Keep vertically within the visible main frame: when `main` ends and the
      // footer starts scrolling in, `mainRect.bottom` moves above the viewport
      // bottom. We increase `bottom` by that gap so the button lifts up and
      // stays inside `main` instead of overlapping the footer.
      const gapBelowMain = Math.max(0, window.innerHeight - mainRect.bottom);
      scrollBtn.style.bottom = `${baseBottom + gapBelowMain}px`;
      return;
    }

    // Fallback if `main` isn't found
    scrollBtn.style.right = `${baseRight}px`;
    scrollBtn.style.bottom = `${baseBottom}px`;
  }

  updateScrollButtonPosition();
  window.addEventListener("scroll", updateScrollButtonPosition, { passive: true });
  window.addEventListener("resize", updateScrollButtonPosition, { passive: true });

  // Scroll to top on click
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// View toggle
// - "Steckbriefansicht" keeps the grid, but shows the overlay permanently.
// - "Als Liste zeigen" switches to the list layout.
(function initPersonViewToggle() {
  const checkbox = document.getElementById("personViewToggle");
  const listBtn = document.getElementById("personViewListBtn");
  if (!checkbox && !listBtn) return;

  const NAME_LIST_CLASS = "name-list-visible";

  function setListBtnLabel() {
    if (!listBtn) return;
    const open = document.body.classList.contains(NAME_LIST_CLASS);
    listBtn.textContent = open ? "Einklappen" : "Als Liste zeigen";
  }

  function applySteckbriefView() {
    const enabled = !!checkbox && checkbox.checked;
    document.body.classList.toggle("person-view-steckbrief", enabled);
  }

  function toggleNameList() {
    const enabled = !document.body.classList.contains(NAME_LIST_CLASS);
    document.body.classList.toggle(NAME_LIST_CLASS, enabled);
    setListBtnLabel();
  }

  if (checkbox) {
    checkbox.addEventListener("change", () => {
      applySteckbriefView();
    });
  }

  if (listBtn) {
    listBtn.addEventListener("click", () => {
      toggleNameList();
    });
  }

  applySteckbriefView();
  setListBtnLabel();
})();

// Facet list toggles + client-side filtering for long lists
(function initFacetLists() {
  function bindToggleAndFilter(options) {
    const {
      buttonId,
      inputId,
      bodyClass,
      containerSelector,
    } = options;

    const button = document.getElementById(buttonId);
    const input = document.getElementById(inputId);
    const container = document.querySelector(containerSelector);
    if (!button || !input || !container) return;

    function setButtonLabel() {
      const open = document.body.classList.contains(bodyClass);
      button.textContent = open ? "Einklappen" : "Als Liste zeigen";
    }

    function applyFilter() {
      const q = (input.value || "").trim().toLowerCase();
      const items = container.querySelectorAll(".ais-RefinementList-item");
      items.forEach((item) => {
        const label = item.querySelector(".ais-RefinementList-labelText")?.textContent || "";
        const match = q.length === 0 || label.toLowerCase().includes(q);
        item.style.display = match ? "" : "none";
      });
    }

    // Re-apply filter when InstantSearch re-renders the list.
    const observer = new MutationObserver(() => {
      applyFilter();
    });
    observer.observe(container, { childList: true, subtree: true });

    input.addEventListener("input", applyFilter);
    button.addEventListener("click", () => {
      const enabled = !document.body.classList.contains(bodyClass);
      document.body.classList.toggle(bodyClass, enabled);
      setButtonLabel();
      if (enabled) {
        // focus the filter box when opening
        window.setTimeout(() => input.focus(), 0);
      }
    });

    // initial filter state
    applyFilter();
    setButtonLabel();
  }

  bindToggleAndFilter({
    buttonId: "birthPlaceListBtn",
    inputId: "birthPlaceFilter",
    bodyClass: "birth-place-list-visible",
    containerSelector: "#birth_place",
  });

  bindToggleAndFilter({
    buttonId: "executionPlaceListBtn",
    inputId: "executionPlaceFilter",
    bodyClass: "execution-place-list-visible",
    containerSelector: "#execution_places",
  });
})();

var tsInput;
function bindMainSearchInput() {
  tsInput = document.querySelector("#searchbox input[type='search']");
  if (!tsInput) return false;
  tsInput.removeEventListener("input", updateHeaderUrl);
  tsInput.addEventListener("input", updateHeaderUrl);
  return true;
}
// The InstantSearch input is rendered after search.start().
if (!bindMainSearchInput()) {
  setTimeout(bindMainSearchInput, 0);
  setTimeout(bindMainSearchInput, 250);
}

function listenToPagination() {
  setTimeout(() => {
    var tsPagination = document.querySelectorAll(".ais-Pagination-link");
    [].forEach.call(tsPagination, function (opt) {
      opt.removeEventListener("click", updateHeaderUrl);
      opt.addEventListener("click", updateHeaderUrl);
    });
  }, 100);
}
setTimeout(() => {
  listenToPagination();
}, 100);

function updateHeaderUrl() {
  setTimeout(() => {
    var urlToUpdate = document.querySelectorAll(".ais-Hits-item a");
    var tsInputVal = tsInput ? tsInput.value : "";

    urlToUpdate.forEach((el) => {
      var href = el.getAttribute("href");
      if (!href || href.startsWith("#")) {
        return;
      }

      let urlObj;
      try {
        urlObj = new URL(href, window.location.href);
      } catch (_) {
        return;
      }

      if (tsInputVal && tsInputVal.length > 0) {
        urlObj.searchParams.set("mark", tsInputVal);
      } else {
        urlObj.searchParams.delete("mark");
      }

      const relative =
        urlObj.origin === window.location.origin
          ? `${urlObj.pathname.replace(/^\//, "")}${urlObj.search}${urlObj.hash}`
          : urlObj.toString();

      el.setAttribute("href", relative);
    });

    listenToPagination();
  }, 500);
}
