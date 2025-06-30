var config = {
    //height: 800,
    layout: "fitColumns",
    tooltips: true,
    dataLoader: true,
    columns:[
            //{title:"ID", field:"id", show:false},
            {title:"Typ", field:"type", headerFilter:"input", width: 200, formatter:"html"},
            {title:"Methode", field:"methode", formatter:"html", headerSort:"true", headerFilter:"input"},
            {title:"Datum", field:"datum",  width: 150, headerFilter:"input"},
            //{title:"Datum", field:"date", formatter:"array", formatterParams:{delimiter: ", "}, headerSort:"true", headerFilter:"input"},
            {title:"Ort", field:"ort", formatter:"array", maxWidth: 400, formatterParams:{delimiter: ", "}, headerSort:"true", headerFilter:"input"},
            {title:"Siehe auch", field:"id",  width: 150, headerSort:false, formatter:"html", headerContextMenu:false}
    ],
};

