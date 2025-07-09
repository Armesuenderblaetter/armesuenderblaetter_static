var config = {
    //height: 800,
    layout: "fitColumns",
    tooltips: true,
    dataLoader: true,
    columns:[
        {title:"Datei", field:"datei", headerFilter:"input", formatter:"html", download:"false", editor:"input", headerSort:"true"}, //add input editor to the name column
        {title:"Seite", field:"seite", width: 300, hozAlign: "center", headerSort:"true"},
        {title:"Titel", field:"titel", headerFilter:"input", editor:"input", headerSort:"true"},
        {title:"Eigenheiten", field:"type", headerFilter:"input", editor:"input", headerSort:"true"},
        {title:"Linker Kotext", field:"left", headerFilter:"input", formatter:"html",download:"false", editor:"input", headerSort:"true"},
        {title:"Stichwort", field:"kwic", headerFilter:"input", download:"false",  formatter:"html", editor:"input", headerSort:"true"},
        {title:"Rechter Kotext", field:"right", headerFilter:"input", formatter:"html", download:"false", editor:"input", headerSort:"true"}, 
    ],
};