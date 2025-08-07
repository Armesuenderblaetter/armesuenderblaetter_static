var cellClassFormatter = function(cell, formatterParams){
  cell.getElement().classList.add("kwic");
  return cell.getValue();  // Don't forget to return content!
};



var config = {
    //height: 800,
    layout: "fitColumns",
    tooltips: true,
    dataLoader: true,
    pagination: true,
    paginationSize: 50,
    autoColumns: false,
    columns:[
        {title:"Datei", field:"datei", formatter:"html", download:"false", visible:"false"}, 
        {title:"Titel", field:"titel", headerFilter:"input", formatter:"html", headerSort:"true", download:"false", headerSort:"true"},
        {title:"Linker Kotext", field:"left", headerFilter:"input", formatter:"html",download:"false", headerSort:"true"},
        {title:"Stichwort", field:"kwic", headerFilter:"input", download:"false",  formatter:cellClassFormatter, headerSort:"true"},
        {title:"Rechter Kotext", field:"right", headerFilter:"input", formatter:"html", download:"false", headerSort:"true"}, 
    ],
};
