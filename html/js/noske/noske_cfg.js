//import { NoskeSearch } from "https://cdn.jsdelivr.net/npm/acdh-noske-search/dist/index.js";

import { NoskeSearch } from "./noske.js";

function getNoskeBaseUrl() {
  const url = new URL(window.location.href);
  const override = url.searchParams.get("noskeBase");
  if (override) return override.replace(/\/$/, "");
  return "https://flugblaetter-noske.acdh-dev.oeaw.ac.at";
}

function ensureRequiredNoskeUrlParams() {
  // The NoskeSearch library will read URL params on load and use them
  // (including refs/structs). Older links in this site hardcode a refs list
  // that doesn't include page/year, which makes the results table show blanks.
  const url = new URL(window.location.href);
  let changed = false;

  const requiredRefs = [
    "doc.id",
    "doc.year",
    "doc.title",
    "pb.n",
    "doc.attrs",
    "doc.archive",
    "persName.id",
  ];

  const refsRaw = url.searchParams.get("refs");
  if (refsRaw) {
    const refs = refsRaw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    for (const req of requiredRefs) {
      if (!refs.includes(req)) {
        refs.push(req);
        changed = true;
      }
    }
    if (changed) {
      url.searchParams.set("refs", refs.join(","));
    }
  }

  // Some configurations may also use `structs` from the URL; keep it in sync.
  const structsRaw = url.searchParams.get("structs");
  if (structsRaw) {
    const structs = structsRaw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (!structs.includes("pb")) {
      structs.push("pb");
      url.searchParams.set("structs", structs.join(","));
      changed = true;
    }
  }

  if (changed) {
    // Best-effort only: when opened via file:// some browsers have origin "null"
    // and will throw on history URL updates.
    try {
      if (window.location.protocol === "http:" || window.location.protocol === "https:") {
        window.history.replaceState({}, "", url.toString());
      }
    } catch (e) {
      // Ignore and continue; search should still work with the current URL.
      console.warn("Could not update URL params", e);
    }
  }
}

ensureRequiredNoskeUrlParams();
const search = new NoskeSearch({ container: "noske-search", autocomplete: false,  wordlistattr: ["word","lemma","pos","vocab","id"]});

const ARCHIVE_CODE_MAP = {
  "Wienbibliothek im Rathaus": "wb",
  "Wiener Stadt- und Landesbibliothek": "wb",
  "Österreichische Nationalbibliothek": "oenb",
  "Oesterreichische Nationalbibliothek": "oenb",
  "Österreichische National-Bibliothek": "oenb",
  "Wien Museum": "wmW",
  "Wiener Museum": "wmW",
  "Wien Museum Wien": "wmW",
  "Wiener Stadt- und Landesarchiv": "wstla",
  "Stadtarchiv Regensburg": "wmR"
};

function return_url(line) {
  if (!line.kwic_attr || !line.refs) {
    console.error("Invalid line object:", line);
    return "#";
  }
  let attribs = line.kwic_attr.split("/");
  let token_id = attribs[attribs.length - 1];
  let doc_id_entry = line.refs.find((ref) => ref.startsWith("doc.id"));
  if (!doc_id_entry) {
    console.error("doc.id not found in refs:", line.refs);
    return "#";
  }
  let doc_id = doc_id_entry.split("=")[1];

  // Extract witness/archive
  let witness = "oenb"; // Default
  let doc_archive_entry = line.refs.find((ref) => ref.startsWith("doc.archive"));
  if (doc_archive_entry) {
    let archive_name = doc_archive_entry.split("=")[1];
    if (ARCHIVE_CODE_MAP[archive_name]) {
        witness = ARCHIVE_CODE_MAP[archive_name];
    } else {
        for (const [name, code] of Object.entries(ARCHIVE_CODE_MAP)) {
            if (archive_name.includes(name)) {
                witness = code;
                break;
            }
        }
    }
  } else {
      // Fallback: check doc.attrs for archive name
      let doc_attrs_entry = line.refs.find((ref) => ref.startsWith("doc.attrs"));
      if (doc_attrs_entry) {
          let attrs = doc_attrs_entry.split("=")[1];
          for (const [name, code] of Object.entries(ARCHIVE_CODE_MAP)) {
              if (attrs.includes(name)) {
                  witness = code;
                  break;
              }
          }
      }
  }

  return `./${doc_id}.html?tab=${witness}#${token_id}`;
}

search.search({
  debug: true,
  client: {
    base: getNoskeBaseUrl(),
    corpname: "flugblaetter",
    attrs: "word,lemma,pos,vocab,id",
    structs: "doc,head,p,lg,l,placeName,quote,bibl,persName,date,cit,g",
    refs: "doc.id,doc.year,doc.title,pb.n,doc.attrs,persName.id,doc.archive",
    kwicrightctx: "45#",
    kwicleftctx: "45#",
    pagesize: 100000000,
  },
  hits: {
    id: "custom-noske-hits",
    labels: {
      "doc.id": "Datei",
      "persName.id": "Personen-id",
      "doc.title": "Titel",
    },
    css: {
      table: "noske-hits-table",
      div: "noske-hits-div",
      thead: "noske-hits-head",
      trHead: "noske-hits-trHead",
      th: "noske-hits-th",
      tbody: "noske-hits-tbody",
      trBody: "noske-hits-trBody",
      td: "noske-hits-td",
      kwic: "noske-hits-kwic",
      left: "noske-hits-left",
      right: "noske-hits-right",
    },
  },
  pagination: {
    id: "custom-noske-pagination",
    css: {
      div: "noske-pagination-div",
      select: "noske-pagination-select",
    },
  },
  searchInput: {
    id: "custom-noske-input",
    placeholder: "suchen",
    css: {
      div: "noske-search-div",
      select: "noske-search-select",
      input: "noske-search-input",
    },
  },
  stats: {
    id: "custom-noske-stats",
    css: {
      div: "stats-div",
      label: "stats-label",
    },
  },
  config: {
    customUrl: "./",
    // urlparams: "wlmaxitems=1",
    customUrlTransform: return_url,
  },
});
search.minQueryLength=1;
