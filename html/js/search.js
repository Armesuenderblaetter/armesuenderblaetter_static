var project_collection_name = "flugblaetter_todesurteile";
var typesense_host = "typesense.acdh-dev.oeaw.ac.at";
var typesense_port = "443";
var typesense_search_key = "Bp1ezRAZZC2wMVqH6Xc52cR5fBQdcJij";

function makeDocLink(hit) {
  return hit.git_file_path;
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
  facetByOptions: {
    printer: "(sort_by: _alpha:asc)",
    archives: "(sort_by: _alpha:asc)",
  }, 
  collectionSpecificFacetByOptions: {
    collection1: {
      printer: "(sort_by: _alpha:desc)",
    }
  },
  additionalSearchParameters: {
    query_by: "fulltext",
  },
}
);

const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
  routing: true,
});

const iiif_server_base_path =
  "https://iiif.acdh.oeaw.ac.at/iiif/images/todesurteile/";
const iiif_attribs = "/full/260,/0/default.jpg";
function get_iif_link(filename) {
  return `${iiif_server_base_path}${filename}${iiif_attribs}`;
}

function extractWitnessFromThumbnail(thumbnail) {
  if (!thumbnail || typeof thumbnail !== 'string') {
    return '';
  }
  const base = thumbnail.replace(/\.[^.]+$/, '');
  const parts = base.split('_');
  if (parts.length < 2) {
    return '';
  }
  parts.shift();
  return parts.join('_');
}

function buildDocumentUrl(hit) {
  const base = `${hit.id}.html`;
  const witness = extractWitnessFromThumbnail(hit && hit.thumbnail);
  return witness ? `${base}?tab=1${witness}` : base;
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
  instantsearch.widgets.hits({
    container: "#hits",
    /*cssClasses: {
      item: "w-20 border border-light rounded m-2 p-2 d-flex flex-column hover-shadow",
    },*/
    templates: {
      empty: "Keine Resultate für <q>{{ query }}</q>",
      item(hit, { html, components, results }) {
        // On fresh load, filter to unique titles only (like an index)
        if (results && results.hits) {
          const uniqueTitles = new Set();
          results.hits = results.hits.filter(h => {
            if (uniqueTitles.has(h.title)) return false;
            uniqueTitles.add(h.title);
            return true;
          });
        }
        // Determine year: prefer label_date, fallback to print_date
        const year = hit.label_date || hit.print_date || "";
        // Printer value only
        const printer = hit.printer || "";
        // Archive value only (may be array or string)
        let archive = "";
        if (Array.isArray(hit.archives)) {
          archive = hit.archives.join(", ");
        } else if (typeof hit.archives === "string") {
          archive = hit.archives;
        }
        const documentUrl = buildDocumentUrl(hit);
        return html`
          <a href="${documentUrl}">
            <h5 style="display: block; padding-bottom: 1rem; font-size: 1.2rem;">
              ${hit.title}
            </h5>
          </a>
          <div class="row align-items-baseline">
            <a href="${documentUrl}">
              <div class="col">
                <img
                  src="${get_iif_link(hit.thumbnail)}"
                  alt="Deckblatt/Erste Seite des Armesünderblattes"
                  style="max-width:80%; height:auto;"
                />
              </div>
            </a>
            <div class="col" style="padding-top: 1rem;">
              <div>${year}</div>
              <div>${printer}</div>
              <div>${archive}</div>
            </div>
            <div class="col-md-12 p-0 m-0">
              <p>
                ${hit._snippetResult.fulltext.matchedWords.length > 0
                  ? components.Snippet({ hit, attribute: "fulltext" })
                  : ""}
              </p>
            </div>
          </div>
        `;
      },
    },
  }),

  // instantsearch.widgets.hits({
  //   container: "#hits",
  //   /*cssClasses: {
  //     item: "w-20 border border-light rounded m-2 p-2 d-flex flex-column hover-shadow",
  //   },*/
  //   templates: {
  //     empty: "Keine Resultate für <q>{{ query }}</q>",
  //     item(hit, { html, components }) {
  //       console.log(get_iif_link(hit.thumbnail));
  //       return html`
  //         <a href="${hit.id + ".html"}">
  //           <head style="display: block">
  //             ${hit.title}
  //           </head>
  //         </a>
  //         <div class="col align-items-baseline">
  //           <div class="col">
  //             <table class="table table-sm">
  //               <tr>
  //                 <td>
  //                 <img src="${get_iif_link(hit.thumbnail)}" alt="Deckblatt/Erste Seite des Armesünderblattes">
  //                 </td>
  //               </tr>
  //               <tr>
  //                 <td><em>Jahr</em></td>
  //                 <td>${hit.label_date}</td>
  //               </tr>
  //               <tr>
  //                 <td><em>Drucker</em></td>
  //                 <td>${hit.printer}</td>
  //               </tr>
  //               <tr>
  //                 <td><em>Druckort</em></td>
  //                 <td>${hit.printing_location}</td>
  //               </tr>
  //               <tr>
  //                 <td><em>Druckdatum</em></td>
  //                 <td>${hit.print_date}</td>
  //               </tr>
  //             </table>
  //           </div>
  //           <div class="col-md-12 p-0 m-0">
  //             <p>
  //               ${hit._snippetResult.fulltext.matchedWords.length > 0
  //                 ? components.Snippet({ hit, attribute: "fulltext" })
  //                 : ""}
  //             </p>
  //           </div>
  //         </div>
  //       `;
  //     },
  //   },
  // }),

  instantsearch.widgets.pagination({
    container: "#pagination",
  }),

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

  instantsearch.widgets.sortBy({
    container: "#sort-by",
    items: [
      {
        label: "Jahr (absteigend)",
        value: "flugblaetter_todesurteile/sort/sorting_date:desc",
      },
      {
        label: "Jahr (aufsteigend)",
        value: "flugblaetter_todesurteile/sort/sorting_date:asc",
      },
      {
        label: "Titel (absteigend)",
        value: "flugblaetter_todesurteile/sort/title:desc",
      },
      {
        label: "Titel (aufsteigend)",
        value: "flugblaetter_todesurteile/sort/title:asc",
      },
    ],
  }),

  instantsearch.widgets.configure({
    hitsPerPage: 20,
    attributesToSnippet: ["fulltext"],
  }),

  instantsearch.widgets.rangeInput({
    container: "#decade",
    attribute: "label_date",
    templates: {
      separatorText: "bis",
      submitText: "Suchen",
    },
    /*cssClasses: {
      form: "form-inline",
      input: "form-control",
      submit: "btn",
    },*/
  }),

  instantsearch.widgets.refinementList({
    container: "#printer",
    attribute: "printer",
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
      label: "d-flex align-items-baseline text-capitalize",
      checkbox: "mr-2",
    },*/
  }),
  instantsearch.widgets.refinementList({
    container: "#archives",
    attribute: "archives",
    sortBy: ['name:asc', 'count:desc'],
    /*cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-baseline text-capitalize",
      checkbox: "mr-2",
    },*/
  }),
/*  instantsearch.widgets.refinementList({
    container: "#printing_location",
    attribute: "printing_location",
    sortBy: ['name:asc', 'count:desc'],
    limit: 1000,
    searchable: false,
    //cssClasses: {
    //  showMore: "btn btn-secondary btn-sm align-content-center",
    //  list: "list-unstyled",
    //  count: "badge ml-2 badge-secondary hideme",
    //  label: "d-flex align-items-baseline text-capitalize",
    //  checkbox: "mr-2",
    //},
  }),*/
]);

search.start();

var tsInput = document.querySelector("input[type='search']");
if (tsInput) {
  tsInput.addEventListener("input", updateHeaderUrl);
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
