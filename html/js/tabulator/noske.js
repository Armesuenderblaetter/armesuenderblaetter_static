var cellClassFormatter = function(cell, formatterParams){
  cell.getElement().classList.add("kwic");
  return cell.getValue();  // Don't forget to return content!
};

var kwicLeftStyleId = "tabulator-kwic-left-style";

// Keep the styling bootstrap separate so Tabulator can rebuild safely on SPA navigation.
function ensureKwicLeftStyle(){
  if (document.getElementById(kwicLeftStyleId)) {
    return;
  }
  var style = document.createElement("style");
  style.id = kwicLeftStyleId;
  style.textContent = "" +
    ".tabulator-cell .kwic-left{" +
    "display:inline-block;" +
    "width:100%;" +
    "direction:rtl;" +
    "text-align:left;" +
    "overflow:hidden;" +
    "text-overflow:ellipsis;" +
    "white-space:nowrap;" +
    "line-height:inherit;" +
    "}" +
    ".tabulator-cell .kwic-left-inner{" +
    "display:inline;" +
    "direction:ltr;" +
    "unicode-bidi:plaintext;" +
    "}";
  document.head.appendChild(style);
}

function leftContextFormatter(cell){
  ensureKwicLeftStyle();
  var value = cell.getValue();
  var safeValue = value == null ? "" : String(value);
  var outer = document.createElement("span");
  outer.className = "kwic-left";
  var inner = document.createElement("span");
  inner.className = "kwic-left-inner";
  inner.textContent = safeValue;
  outer.appendChild(inner);
  return outer;
}

var config = {
    //height: 800,
    layout: "fitColumns",
    tooltips: true,
    dataLoader: true,
    pagination: false,
    index: "id",
    langs:{
        "default":{
            "pagination":{
                "first":"«",
                "first_title":"First Page",
                "last":"»",
                "last_title":"Last Page",
                "prev":"‹",
                "prev_title":"Prev Page",
                "next":"›",
                "next_title":"Next Page",
            },
        },
    },
    autoColumns: false,
    columns:[
      {title:"Titel", field:"titel", formatter:"html", headerSort:true, download:false},
      {title:"Seite", field:"seite", formatter:"html", headerSort:true, download:false, width:110},
      {title:"Jahr", field:"jahr", formatter:"html", headerSort:true, download:false, width:110},
      {title:"Linker Kotext", field:"left", formatter:leftContextFormatter, download:false, headerSort:true, hozAlign:"right"},
      {title:"Stichwort", field:"kwic", download:false, formatter:cellClassFormatter, headerSort:true},
      {title:"Rechter Kotext", field:"right", formatter:"html", download:false, headerSort:true}, 
      {title:"DocId", field:"docid", visible:false, download:false},
      {title:"TokenId", field:"tokenid", visible:false, download:false},
    ],
};