var project_collection_name = "flugblaetter_todesurteile";
var typesense_host = "typesense.acdh-dev.oeaw.ac.at";
var typesense_port = "443";
var typesense_search_key = "Bp1ezRAZZC2wMVqH6Xc52cR5fBQdcJij";

const iiif_server_base_path =
  "https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/";
const iiif_attribs = "/full/360,/0/default.jpg";

function getDocumentLink(hit) {
  const id = hit && hit.id;
  if (!id) return "#";
  return `${id}.html`;
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
    query_by: "title,fulltext,person_names",
    sort_by: "sorting_date:asc",
    per_page: 250,
  },
});

const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
  routing: true,
});

// ---------- Facet slider widget for string facets (e.g. decade ranges "20–29") ----------
function createFacetSliderWidget({
  sliderContainer,
  countContainer,
  attribute,
  valueFilter,
  valueSorter,
}) {
  const defaultFilter = (name) => /^\d+$/.test(name) || /^\d+–\d+$/.test(name);
  const defaultSorter = (a, b) => parseInt(a, 10) - parseInt(b, 10);
  const keepValue = valueFilter || defaultFilter;
  const sortValues = valueSorter || defaultSorter;

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
        try {
          this.helper.addDisjunctiveFacet(this.attribute);
        } catch (e) {}
      }
    },

    render({ results, state }) {
      if (this.countEl && results && typeof results.nbHits === "number") {
        this.countEl.textContent = String(results.nbHits);
      }

      if (!this.sliderEl) return;
      if (!window.noUiSlider) return;

      if (
        !this.values &&
        results &&
        typeof results.getFacetValues === "function"
      ) {
        let facetValues = [];
        try {
          facetValues = results.getFacetValues(this.attribute) || [];
        } catch (e) {
          facetValues = [];
        }

        const labels = (Array.isArray(facetValues) ? facetValues : [])
          .map((v) => (v && v.name != null ? String(v.name) : ""))
          .filter(keepValue)
          .sort(sortValues);

        if (!labels.length) return;

        this.values = labels;

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
          range: { min: 0, max: maxIndex },
          behaviour: "tap-drag",
          tooltips: [tooltipFormat, tooltipFormat],
        });

        this.slider = this.sliderEl.noUiSlider;

        this.slider.on("change", (rawValues) => {
          if (!this.helper || !this.attribute || !Array.isArray(this.values) || !this.values.length) return;
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

      const refinements =
        (state && state.disjunctiveFacetsRefinements && state.disjunctiveFacetsRefinements[this.attribute]) || [];
      const active = (Array.isArray(refinements) ? refinements : [])
        .map((v) => String(v))
        .filter((v) => this.values.includes(v));

      const maxIndex = this.values.length - 1;
      let target = [0, maxIndex];
      if (active.length) {
        const indices = active.map((v) => this.values.indexOf(v)).filter((i) => i >= 0).sort((a, b) => a - b);
        if (indices.length) target = [indices[0], indices[indices.length - 1]];
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

// ---------- Range slider widget for numeric (int32) facets using connectRange ----------
// Uses instantsearch.connectors.connectRange for proper numeric range filtering.
function createRangeSliderWidget({ sliderContainer, countContainer, attribute }) {
  const connectRange = instantsearch.connectors.connectRange;

  const renderRangeSlider = (renderOptions, isFirstRender) => {
    const { start, range, refine, widgetParams } = renderOptions;
    const sliderEl = document.querySelector(widgetParams.sliderContainer);
    const countEl = document.querySelector(widgetParams.countContainer);

    if (!sliderEl || !window.noUiSlider) return;

    // Update hit count from the parent search results
    if (countEl && renderOptions.instantSearchInstance) {
      const helper = renderOptions.instantSearchInstance.helper;
      if (helper && helper.lastResults && typeof helper.lastResults.nbHits === "number") {
        countEl.textContent = String(helper.lastResults.nbHits);
      }
    }

    const rangeMin = range.min;
    const rangeMax = range.max;

    // Don't create slider if range is invalid
    if (rangeMin === undefined || rangeMax === undefined || rangeMin === rangeMax) return;

    if (isFirstRender) {
      const tooltipFormat = {
        to: (value) => String(Math.round(value)),
        from: (value) => Number(value),
      };

      window.noUiSlider.create(sliderEl, {
        start: [rangeMin, rangeMax],
        connect: true,
        step: 1,
        range: { min: rangeMin, max: rangeMax },
        behaviour: "tap-drag",
        tooltips: [tooltipFormat, tooltipFormat],
      });

      sliderEl.noUiSlider.on("change", (rawValues) => {
        const newMin = Math.round(Number(rawValues[0]));
        const newMax = Math.round(Number(rawValues[1]));
        refine([newMin, newMax]);
      });
    } else {
      // Update slider range if data changed
      const slider = sliderEl.noUiSlider;
      if (!slider) return;

      slider.updateOptions({
        range: { min: rangeMin, max: rangeMax },
      }, false);

      // Sync slider position with current refinement
      const currentMin = start[0] === -Infinity || start[0] === undefined ? rangeMin : start[0];
      const currentMax = start[1] === Infinity || start[1] === undefined ? rangeMax : start[1];

      const currentSliderValues = slider.get().map((v) => Math.round(Number(v)));
      const targetMin = Math.round(currentMin);
      const targetMax = Math.round(currentMax);

      if (currentSliderValues[0] !== targetMin || currentSliderValues[1] !== targetMax) {
        slider.set([targetMin, targetMax]);
      }
    }
  };

  return connectRange(renderRangeSlider)({
    attribute,
    sliderContainer,
    countContainer,
  });
}

// ---------- Widgets ----------
search.addWidgets([
  instantsearch.widgets.searchBox({
    container: "#searchbox",
    autofocus: true,
  }),

  createFacetSliderWidget({
    sliderContainer: "#decadeAgeSlider",
    countContainer: "#decadeAgeCount",
    attribute: "person_decade_age",
    valueFilter: (name) => /^\d+–\d+$/.test(name),
  }),

  createFacetSliderWidget({
    sliderContainer: "#labelDateSlider",
    countContainer: "#labelDateCount",
    attribute: "label_date",
    valueFilter: (name) => /^\d+$/.test(name),
  }),

  // Infinite hits – document-based display
  (function () {
    window.__infiniteHitsShowMore = null;
    window.__infiniteHitsIsLastPage = true;

    const connectInfiniteHits = instantsearch.connectors.connectInfiniteHits;

    const renderInfiniteHits = (renderOptions, isFirstRender) => {
      const { hits, showMore, isLastPage, widgetParams } = renderOptions;
      const container = document.querySelector(widgetParams.container);

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

      const hitsHtml =
        hits.length === 0
          ? '<div class="ais-InfiniteHits-empty">Keine Resultate für diese Suche</div>'
          : `<ol class="ais-InfiniteHits-list">${hits
              .map((hit) => {
                const title = valueOrDash(hit.title);
                const titleUpper = String(title).toLocaleUpperCase("de-DE");
                const detailUrl = getDocumentLink(hit);
                const imageUrl =
                  iiif_server_base_path + hit.thumbnail + iiif_attribs;
                const printDate = valueOrDash(hit.print_date);
                const labelDate = hit.label_date || "";
                const archives = valueOrDash(hit.archives);
                const personNames = valueOrDash(hit.person_names);
                const executionPlaces = hit.person_execution_places;
                const hasExecPlaces = Array.isArray(executionPlaces) ? executionPlaces.length > 0 : (executionPlaces && String(executionPlaces).trim().length > 0);
                const execPlacesStr = hasExecPlaces ? valueOrDash(executionPlaces) : "";

                return `<li class="ais-InfiniteHits-item">
              <div class="person-hit-card">
                <a class="person-hit-link" href="${detailUrl}" aria-label="Details zu ${title}">
                  <img class="person-hit-image" src="${imageUrl}" alt="Deckblatt/Erste Seite des Armesünderblattes" />
                </a>
                <div class="person-hit-overlay">
                  <h4 class="person-hit-title">${titleUpper}</h4>
                  <ul class="person-hit-list">
                    <li><span class="person-hit-label">DATUM</span><span class="person-hit-value">${labelDate}</span></li>
                    <li><span class="person-hit-label">ARCHIV</span><span class="person-hit-value">${archives}</span></li>
                    <li><span class="person-hit-label">PERSONEN</span><span class="person-hit-value">${personNames}</span></li>
                    ${hasExecPlaces ? `<li><span class="person-hit-label">HINRICHTUNGSORT</span><span class="person-hit-value">${execPlacesStr}</span></li>` : ""}
                  </ul>
                  <div class="person-hit-cta">
                    <a class="cta-button" href="${detailUrl}">DETAILS</a>
                  </div>
                </div>
              </div>
            </li>`;
              })
              .join("")}</ol>`;

      container.innerHTML = `<div class="ais-InfiniteHits">${hitsHtml}</div>`;
      window.dispatchEvent(new CustomEvent("infiniteHitsRendered"));
    };

    return connectInfiniteHits(renderInfiniteHits)({
      container: "#hits",
    });
  })(),

  instantsearch.widgets.clearRefinements({
    container: "#clear-refinements",
    templates: {
      resetLabel: "Filter zurücksetzen",
    },
  }),


  instantsearch.widgets.configure({
    hitsPerPage: 250,
    attributesToSnippet: ["title"],
  }),

  // Document-level facets

  instantsearch.widgets.refinementList({
    container: "#label_date",
    attribute: "label_date",
    sortBy: ["name:asc"],
    limit: 1000,
    searchable: false,
  }),

  instantsearch.widgets.refinementList({
    container: "#archives",
    attribute: "archives",
    sortBy: ["name:asc", "count:desc"],
    searchable: false,
  }),

  instantsearch.widgets.refinementList({
    container: "#has_vignette",
    attribute: "has_vignette",
    sortBy: ["name:desc"],
    transformItems: function (items) {
      return items
        .filter(function (item) { return item.label === "true"; })
        .map(function (item) {
          return Object.assign({}, item, {
            label: "Vignetten",
            highlighted: "Vignetten",
          });
        });
    },
  }),

  instantsearch.widgets.refinementList({
    container: "#has_verse",
    attribute: "has_verse",
    sortBy: ["name:desc"],
    transformItems: function (items) {
      return items
        .filter(function (item) { return item.label === "true"; })
        .map(function (item) {
          return Object.assign({}, item, {
            label: "Verse",
            highlighted: "Verse",
          });
        });
    },
  }),

  // Person-level facets
  instantsearch.widgets.refinementList({
    container: "#person_names",
    attribute: "person_names",
    sortBy: ["name:asc", "count:desc"],
    limit: 1000,
    searchable: false,
    cssClasses: {
      list: "facet-list-scroll",
    },
  }),

  instantsearch.widgets.refinementList({
    container: "#person_sex",
    attribute: "person_sex",
    searchable: false,
  }),

  instantsearch.widgets.refinementList({
    container: "#person_decade_age",
    attribute: "person_decade_age",
    searchable: false,
    sortBy: ["name:asc"],
  }),

  instantsearch.widgets.refinementList({
    container: "#person_marriage_status",
    attribute: "person_marriage_status",
    sortBy: ["name:asc", "count:desc"],
    searchable: false,
  }),

  instantsearch.widgets.refinementList({
    container: "#person_birth_place",
    attribute: "person_birth_place",
    limit: 1000,
    searchable: false,
    sortBy: ["name:asc", "count:desc"],
    cssClasses: {
      list: "facet-list-scroll",
    },
  }),

  instantsearch.widgets.refinementList({
    container: "#person_faith",
    attribute: "person_faith",
    sortBy: ["name:asc", "count:desc"],
    searchable: false,
  }),

  instantsearch.widgets.refinementList({
    container: "#person_offences",
    attribute: "person_offences",
    sortBy: ["name:asc", "count:desc"],
    searchable: false,
  }),

  instantsearch.widgets.refinementList({
    container: "#person_execution_places",
    attribute: "person_execution_places",
    limit: 1000,
    searchable: false,
    sortBy: ["name:asc", "count:desc"],
    cssClasses: {
      list: "facet-list-scroll",
    },
  }),

  instantsearch.widgets.refinementList({
    container: "#person_execution",
    attribute: "person_execution",
    sortBy: ["name:asc", "count:desc"],
    searchable: false,
  }),
]);

search.start();

// ---------- Load More button ----------
(function initLoadMoreButton() {
  const paginationEl = document.getElementById("pagination");
  if (!paginationEl) return;

  const loadMoreWrapper = document.createElement("div");
  loadMoreWrapper.className = "load-more-wrapper";
  loadMoreWrapper.style.display = "none";

  const loadMoreBtn = document.createElement("button");
  loadMoreBtn.type = "button";
  loadMoreBtn.className = "site-button load-more-btn";
  loadMoreBtn.innerHTML =
    '<i class="bi bi-chevron-double-down" aria-hidden="true"></i>';
  loadMoreBtn.addEventListener("click", function () {
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
    const displayedHits = document.querySelectorAll(
      ".ais-InfiniteHits-item"
    ).length;
    const countEl = document.getElementById("decadeAgeCount");
    const totalHits = countEl ? parseInt(countEl.textContent, 10) : 0;
    const hasMore = displayedHits > 0 && displayedHits < totalHits;
    loadMoreBtn.disabled = !hasMore;
    loadMoreWrapper.style.display = hasMore ? "" : "none";
  }

  window.addEventListener("infiniteHitsRendered", updateButtonVisibility);

  const hitsEl = document.getElementById("hits");
  if (hitsEl) {
    const observer = new MutationObserver(updateButtonVisibility);
    observer.observe(hitsEl, { childList: true, subtree: true });
  }

  setTimeout(updateButtonVisibility, 500);
  setTimeout(updateButtonVisibility, 1000);
  setTimeout(updateButtonVisibility, 2000);
})();

// ---------- Scroll to top ----------
(function initScrollToTop() {
  const scrollBtn = document.getElementById("scrollToTopBtn");
  const siteTopInner = document.querySelector(".site-top-inner");
  const main = document.querySelector("main");
  if (!scrollBtn || !siteTopInner) return;

  const baseBottom = 0;
  const baseRight = 0;

  const topObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        scrollBtn.classList.toggle("visible", !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );

  topObserver.observe(siteTopInner);

  function updateScrollButtonPosition() {
    if (main) {
      const mainRect = main.getBoundingClientRect();
      const rightOffset = Math.max(
        baseRight,
        window.innerWidth - mainRect.right + baseRight
      );
      scrollBtn.style.right = `${rightOffset}px`;
      const gapBelowMain = Math.max(0, window.innerHeight - mainRect.bottom);
      scrollBtn.style.bottom = `${baseBottom + gapBelowMain}px`;
      return;
    }
    scrollBtn.style.right = `${baseRight}px`;
    scrollBtn.style.bottom = `${baseBottom}px`;
  }

  updateScrollButtonPosition();
  window.addEventListener("scroll", updateScrollButtonPosition, {
    passive: true,
  });
  window.addEventListener("resize", updateScrollButtonPosition, {
    passive: true,
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();

// ---------- View toggle ----------
(function initPersonViewToggle() {
  const checkbox = document.getElementById("personViewToggle");
  if (!checkbox) return;

  function applySteckbriefView() {
    const enabled = checkbox.checked;
    document.body.classList.toggle("person-view-steckbrief", enabled);
  }

  checkbox.addEventListener("change", applySteckbriefView);
  applySteckbriefView();
})();

// ---------- Facet list toggles + client-side filtering ----------
(function initFacetLists() {
  function bindToggleAndFilter(options) {
    const { buttonId, inputId, bodyClass, containerSelector } = options;

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
        const label =
          item.querySelector(".ais-RefinementList-labelText")?.textContent || "";
        const match = q.length === 0 || label.toLowerCase().includes(q);
        item.style.display = match ? "" : "none";
      });
    }

    const observer = new MutationObserver(() => applyFilter());
    observer.observe(container, { childList: true, subtree: true });

    input.addEventListener("input", applyFilter);
    button.addEventListener("click", () => {
      const enabled = !document.body.classList.contains(bodyClass);
      document.body.classList.toggle(bodyClass, enabled);
      setButtonLabel();
      if (enabled) {
        window.setTimeout(() => input.focus(), 0);
      }
    });

    applyFilter();
    setButtonLabel();
  }

  bindToggleAndFilter({
    buttonId: "personNameListBtn",
    inputId: "personNameFilter",
    bodyClass: "person-name-list-visible",
    containerSelector: "#person_names",
  });

  bindToggleAndFilter({
    buttonId: "birthPlaceListBtn",
    inputId: "birthPlaceFilter",
    bodyClass: "birth-place-list-visible",
    containerSelector: "#person_birth_place",
  });

  bindToggleAndFilter({
    buttonId: "executionPlaceListBtn",
    inputId: "executionPlaceFilter",
    bodyClass: "execution-place-list-visible",
    containerSelector: "#person_execution_places",
  });
})();

// ---------- Update header URLs with search mark ----------
var tsInput;
function bindMainSearchInput() {
  tsInput = document.querySelector("#searchbox input[type='search']");
  if (!tsInput) return false;
  tsInput.removeEventListener("input", updateHeaderUrl);
  tsInput.addEventListener("input", updateHeaderUrl);
  return true;
}
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
      if (!href || href.startsWith("#")) return;

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
