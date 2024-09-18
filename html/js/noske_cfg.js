import { NoskeSearch } from "./noske.js";
const search = new NoskeSearch({ container: "noske-search" });
search.search({
  debug: true,
  client: {
    base: "https://flugblaetter-noske.acdh-dev.oeaw.ac.at",
    corpname: "flugblaetter",
    attrs: "word,lemma,ana,pos,id,join,part",
    structs: "doc,p,lg,l",
    refs: "doc.id,doc.date,doc.title.id",
  },
  hits: {
    id: "noske-hits",
    css: {
      table: "noske-hits-table",
      div: "noske-hits-div",
      table: "noske-hits-table",
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
    id: "noske-pagination",
    css: {
      div: "noske-pagination-div",
      select: "noske-pagination-select",
    },
  },
  searchInput: {
    id: "noske-input",
    placeholder: "suchen",
    css: {
      div: "noske-search-div",
      select: "noske-search-select",
      input: "noske-search-input",
    },
  },
  stats: {
    id: "noske-stats",
    css: {
      div: "stats-div",
      label: "stats-label",
    },
  },
  config: {
    // customUrl: "/todesurteile/flugblaetter-static-page/",
    customUrl: "./",
  },
});
search.minQueryLength=1;
