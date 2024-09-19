
// import { NoskeSearch } from "https://cdn.jsdelivr.net/npm/acdh-noske-search/dist/index.js";
import { NoskeSearch } from "./noske.js";
const search = new NoskeSearch({ container: "noske-search", autocomplete: false,  wordlistattr: ["word","lemma","pos","vocab","id"]});
search.search({
  debug: true,
  client: {
    base: "https://flugblaetter-noske.acdh-dev.oeaw.ac.at",
    corpname: "flugblaetter",
    attrs: "word,lemma,pos,vocab,id",
    structs: "doc,head,p,lg,l,placeName,quote,bibl,persName,date,cit,g",
    // refs: "doc.id,doc.date, doc.name",
    refs: "doc.id,doc.title",
  },
  hits: {
    id: "custom-noske-hits",
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
    urlparam: "wlmaxitems=1",
  },
});
search.minQueryLength=1;
