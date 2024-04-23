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
  additionalSearchParameters: {
    query_by: "fulltext",
  },
});

const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
  routing: true,
});

search.addWidgets([
  instantsearch.widgets.searchBox({
    container: "#searchbox",
    autofocus: true,
    cssClasses: {
      form: "form-inline",
      input: "form-control col-md-11",
      submit: "btn",
      reset: "btn",
    },
  }),

  instantsearch.widgets.hits({
    container: "#hits",
    cssClasses: {
      item: "w-20 border border-light rounded m-2 p-2 d-flex flex-column hover-shadow",
    },
    templates: {
      empty: "Keine Resultate für <q>{{ query }}</q>",
      item(hit, { html, components }) {
        return html`
          <a href="${hit.id + ".html"}">
            <head style="display: block">
              ${hit.title}
            </head>
          </a>
          <div class="col align-items-center">
            <div class="col">
              <table class="table table-sm">
                <!--<tr>
                      <td><em>Datum</em></td>
                      <td>${hit.sorting_date}</td>
                    </tr>-->
                <tr>
                  <td><em>Jahr</em></td>
                  <td>${hit.label_date}</td>
                </tr>
                <tr>
                  <td><em>Drucker</em></td>
                  <td>${hit.printer}</td>
                </tr>
                <tr>
                  <td><em>Druckort</em></td>
                  <td>${hit.printing_location}</td>
                </tr>
                <tr>
                  <td><em>Druckdatum</em></td>
                  <td>${hit.print_date}</td>
                </tr>
              </table>
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

  instantsearch.widgets.pagination({
    container: "#pagination",
  }),

  instantsearch.widgets.clearRefinements({
    container: "#clear-refinements",
    templates: {
      resetLabel: "Filter zurücksetzen",
    },
    cssClasses: {
      button: "btn",
    },
  }),

  instantsearch.widgets.currentRefinements({
    container: "#current-refinements",
    cssClasses: {
      delete: "btn",
      label: "badge",
    },
  }),


  instantsearch.widgets.sortBy({
    container: "#sort-by",
    items: [
      { label: "Jahr (absteigend)", value: "flugblaetter_todesurteile"},
      { label: "Jahr (aufsteigend)", value: "flugblaetter_todesurteile/sort/sorting_date:asc"},
      
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
    cssClasses: {
      form: "form-inline",
      input: "form-control",
      submit: "btn",
    },
  }),

  instantsearch.widgets.refinementList({
    container: "#printer",
    attribute: "printer",
    searchable: true,
    cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },
  }),

  instantsearch.widgets.refinementList({
    container: "#printing_location",
    attribute: "printing_location",
    searchable: true,
    cssClasses: {
      showMore: "btn btn-secondary btn-sm align-content-center",
      list: "list-unstyled",
      count: "badge ml-2 badge-secondary hideme",
      label: "d-flex align-items-center text-capitalize",
      checkbox: "mr-2",
    },
  }),
]);

search.start();

var tsInput = document.querySelector("input[type='search']");
tsInput.addEventListener("input", updateHeaderUrl);

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
    var tsInputVal = tsInput.value;

    urlToUpdate.forEach((el) => {
      var urlToUpdateHref = el.getAttribute("href");
      if (urlToUpdateHref.includes("?mark=")) {
        var newUrl = urlToUpdateHref.replace(
          /\?mark=\.+$/,
          `?mark=${tsInputVal}`
        );
        el.setAttribute("href", newUrl);
      } else {
        var searchParams = new URLSearchParams("?mark=default");
        searchParams.set("mark", tsInputVal);
        var url = `${
          urlToUpdateHref.split("#")[0]
        }?${searchParams.toString()}#${urlToUpdateHref.split("#")[1]}`;
        el.setAttribute("href", url);
      }
    });

    listenToPagination();
  }, 500);
}
