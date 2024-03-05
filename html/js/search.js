var project_collection_name = "flugblaetter_todesurteile"
var typesense_host = "typesense.acdh-dev.oeaw.ac.at"
var typesense_port = "443"
var typesense_search_key = "U2da3YrdRT1jkBZXhbXJWK42rMt0Rf0b"

function makeDocLink(hit) {
    return hit.git_file_path
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
                <a class="text-decoration-none text-dark" 
                    href='${makeDocLink(hit)}'
                    aria-label="Link zu Dokument: ${hit.title}">
                    <div class="col align-items-center">
                        <div class="col">
                            <table class="table table-sm">
                                <tr>
                                    <td>${hit.title}</td>
                                </tr>
                                <tr>
                                    <td><em>date</em></td>
                                    <td>${hit.date}</td>
                                </tr>
                                <tr>
                                    <td><em>ID:</em></td>
                                    <td>${hit.identifier}</td>
                                </tr>
                                <tr>
                                    <td><em>filepath (wrong):</em></td>
                                    <td>${hit.git_file_path}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-12 p-0 m-0">
                            <p>${hit._snippetResult.fulltext.matchedWords.length > 0 ? components.Snippet({ hit, attribute: 'fulltext' }) : ''}</p>
                        </div>
                    </div>
                </a>
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
            { label: "Standard", value: "date" },
        ],
    }),

    instantsearch.widgets.configure({
        hitsPerPage: 20,
        attributesToSnippet: ["fulltext"],
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
        var url = `${urlToUpdateHref.split("#")[0]}?${searchParams.toString()}#${urlToUpdateHref.split("#")[1]}`
        el.setAttribute("href", url);
      }
    });

    listenToPagination();
  }, 500);
}