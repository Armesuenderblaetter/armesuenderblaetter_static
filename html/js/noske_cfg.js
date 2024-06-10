import { NoskeSearch } from "https://cdn.jsdelivr.net/npm/acdh-noske-search@0.0.7/dist/index.js";
const search = new NoskeSearch({ container: "noske-search" });
console.log("initialisiert");
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
      table: "table-auto",
    },
  },
  pagination: {
    id: "noske-pagination",
  },
  searchInput: {
    id: "noske-input",
  },
  stats: {
    id: "noske-stats",
  },
  config: {
    customUrl: "kdsjf",
  }
});
console.log("search created");
