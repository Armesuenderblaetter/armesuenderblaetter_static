var project_collection_name = "flugblaetter_todesurteile_persons";
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
    query_by: "fullname",
  },
});

const searchClient = typesenseInstantsearchAdapter.searchClient;
const search = instantsearch({
  searchClient,
  indexName: project_collection_name,
  routing: true,
});

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

  instantsearch.widgets.hits({
    container: "#hits",
    /*cssClasses: {
      item: "w-20 border border-light rounded m-2 p-2 d-flex flex-column hover-shadow",
    },*/
    templates: {
      empty: "Keine Resultate für <q>{{ query }}</q>",
      item(hit, { html, components }) {
        let offences = return_html_list(hit.offences);
        let execution = return_html_list(hit.execution);
        let punishments = return_html_list(hit.punishments);
        return `
          <a href="${hit.global_id}.html">
            <h5 style="display: block; padding-bottom: 1rem; font-size: 1.2rem">
              ${hit.fullname}
            </h5>
          </a>
          <div class="col align-items-center">
           <a href="${hit.id}.html">
              <div class="col" >
                <img
                  src="${iiif_server_base_path + hit.thumbnail + iiif_attribs}"
                  alt="Deckblatt/Erste Seite des Armesünderblattes"
                  style="max-width:80%;height:auto;"
                />
              </div>
            </a>
            <div class="col">
              <table class="table table-sm">
                <tr>
                  <td><em>Geschlecht</em></td>
                  <td>${hit.sex}</td>
                </tr>
                <tr>
                  <td><em>Alter</em></td>
                  <td>${hit.age}</td>
                </tr>
                <tr>
                  <td><em>Geburtsort</em></td>
                  <td>${hit.birth_place}</td>
                </tr>
                <!-- <tr>
                  <td><em>Stand</em></td>
                  <td>${hit.type}</td>
                </tr> -->
                <tr>
                  <td><em>Familienstand</em></td>
                  <td>${hit.marriage_status}</td>
                </tr>
                <tr>
                  <td><em>Konfession</em></td>
                  <td>${hit.faith}</td>
                </tr>
                <tr>
                  <td><em>Beruf</em></td>
                  <td>${hit.occupation}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
      },
    },
  }),
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

  instantsearch.widgets.configure({
    hitsPerPage: 20,
    attributesToSnippet: ["fullname"],
  }),

  instantsearch.widgets.refinementList({
    container: "#name_list",
    attribute: "fullname",
    limit: 1000,
    searchable: true,
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
    searchable: true,
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
    searchable: true,
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
    container: "#occupation",
    attribute: "occupation",
    searchable: true,
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
    container: "#offences",
    attribute: "offences",
    searchable: true,
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
    container: "#execution",
    attribute: "execution",
    limit: 1000,
    searchable: true,
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
    container: "#punishments",
    attribute: "punishments",
    limit: 1000,
    searchable: true,
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
