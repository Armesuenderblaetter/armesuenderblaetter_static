let jsonurl = '../../json/punishments.json';
let table_id = "offences"

function getRowByCellValue(cellName, cellValue, table) {
  return table.getRows().find(row => { return row.getCell(cellName).getValue() == cellValue; })
}

fetch(jsonurl).then(response => {
    return response.json();
  }).then(data => {
    console.log(data);
    let tabulator_table = buildTable(data)
    tabulator_table.on("renderComplete", function(){
      console.log(tabulator_table)
      if(window.location.hash) {
        uid = window.location.hash.replace("#", "")
        console.log(uid)
        console.log(tabulator_table)
        row = getRowByCellValue("id", uid, tabulator_table)
        tabulator_table.scrollToRow(row, "top");
        console.log(row)
      }
    });
  }).catch(err => {
    console.log(err);
  });


function make_link(cell, formatterParams, onRendered){
  let url = "./" + cell.getValue() + ".html";
  return `<a href="${url}">Dokument</a>`
}

function buildTable(raw_tabledata){
    let html_table = document.getElementById(table_id);
    let table_container = document.createElement('div');
    html_table.parentNode.replaceChild(table_container, html_table);
    table_container.id = table_id;
    tabledata = Object.values(raw_tabledata);
    console.log(typeof tabledata, tabledata);
    var tabulator_table = new Tabulator(`#${table_id}`, {
        data:tabledata,
        layout:"fitColumns",
        height:"40rem",
        // pagination:true, //enable.
        // paginationSize:10, // this option can take any positive integer value
        columns:[
            {title:"ID", field:"id"},
            {title:"Typ", field:"type"},
            {title:"Beschreibung", field:"description"},
            {title:"Datum", field:"date", formatter:"array", formatterParams:{delimiter: ", "}},
            {title:"Orte", field:"place", formatter:"array", formatterParams:{delimiter: ", "}},
            {title:"Methode", field:"methods", formatter:"array", formatterParams:{delimiter: ", "}},
            {title:"Siehe auch", field:"file", formatter:make_link}
        ],
    });
    return tabulator_table;
};